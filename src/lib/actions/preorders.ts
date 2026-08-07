// src/lib/actions/preorders.ts

'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendPaymentConfirmedEmail, sendStockAssignedEmail } from '@/lib/email';

export interface PreorderItem {
  id: string;
  preorder_code: string;
  user_id?: string | null;
  product_id: string;
  variant_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  quantity: number;
  status: 'pending_payment' | 'paid_confirmed' | 'assigned' | 'fulfilled' | 'cancelled';
  order_id?: string | null;
  admin_notes?: string | null;
  created_at: string;
  paid_at?: string | null;
  updated_at: string;
  queue_position?: number | null;
  product?: {
    id: string;
    title_az: string;
    title_en?: string;
    title_ru?: string;
    image_url: string;
    price_azn: number;
    stock_quantity: number;
    allow_preorder?: boolean;
    preorder_lead_time?: string;
    slug: string;
  } | null;
  variant?: {
    id: string;
    name?: string;
    title_az?: string;
  } | null;
}

export interface SupplierReportItem {
  product_id: string;
  product_title: string;
  product_image: string;
  product_slug: string;
  current_stock: number;
  total_preorder_quantity: number;
  confirmed_preorders_count: number;
  preorders_list: {
    id: string;
    preorder_code: string;
    customer_name: string;
    customer_phone: string;
    quantity: number;
    paid_at?: string | null;
    status: string;
  }[];
  lead_time: string;
}

/**
 * Generate a collision-resistant unique pre-order code
 * Format: RCYYYYXXXX (e.g., RC2026A8K9)
 */

function generatePreorderCode(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RC${year}${randomPart}`;
}

/**
 * Create a new Pre-order record
 */
export async function createPreorderAction(payload: {
  product_id: string;
  variant_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  quantity?: number;
  user_id?: string | null;
  admin_notes?: string | null;
}) {
  try {
    const supabase = createAdminSupabaseClient();
    const quantity = Math.max(1, Number(payload.quantity || 1));
    const cleanPhone = payload.customer_phone.trim();
    const cleanEmail = payload.customer_email?.trim().toLowerCase() || '';

    // Spam Protection v3: 5-minute rate limiting check
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    let spamFilter = `customer_phone.eq.${cleanPhone}`;
    if (cleanEmail) {
      spamFilter += `,customer_email.eq.${cleanEmail}`;
    }

    const { data: recentPreorders } = await supabase
      .from('preorders')
      .select('id, created_at')
      .or(spamFilter)
      .gte('created_at', fiveMinutesAgo)
      .limit(1);

    if (recentPreorders && recentPreorders.length > 0) {
      return {
        success: false,
        error: 'Spam Qorunması: Eyni telefon nömrəsi və ya email ilə son 5 dəqiqə ərzində təkrar ön sifariş yaradılıb. Zəhmət olmasa 5 dəqiqə gözləyib yenidən cəhd edin.'
      };
    }

    // Retry loop for unique preorder_code collision safety
    let code = generatePreorderCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      attempts++;
      const { data: existing } = await supabase
        .from('preorders')
        .select('id')
        .eq('preorder_code', code)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        code = generatePreorderCode();
      }
    }

    const insertData: any = {
      preorder_code: code,
      product_id: payload.product_id,
      variant_id: payload.variant_id || null,
      customer_name: payload.customer_name.trim(),
      customer_phone: payload.customer_phone.trim(),
      customer_email: payload.customer_email?.trim() || null,
      quantity,
      status: 'pending_payment',
      user_id: payload.user_id || null,
      admin_notes: payload.admin_notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('preorders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating preorder in database:', error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/[locale]/admin/preorders', 'page');
    return { success: true, data };
  } catch (err: any) {
    console.error('createPreorderAction Exception:', err.message || err);
    return { success: false, error: err.message || 'Ön sifariş yaradılarkən xəta baş verdi' };
  }
}

/**
 * Fetch preorders for admin with optional filtering & search
 * Dynamically computes queue position for paid_confirmed / assigned items
 */
export async function getAdminPreordersAction(params?: {
  status?: string;
  search?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('preorders')
      .select(`
        *,
        product:products(id, title_az, title_en, title_ru, image_url, price_azn, stock_quantity, allow_preorder, preorder_lead_time, slug)
      `)
      .order('created_at', { ascending: false });

    if (params?.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    if (params?.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      query = query.or(`preorder_code.ilike.${s},customer_name.ilike.${s},customer_phone.ilike.${s},customer_email.ilike.${s}`);
    }

    const { data, error } = await query;

    if (error) {
      // If table does not exist yet (before migration), return empty array gracefully
      console.error('getAdminPreordersAction Error:', error.message);
      return { success: true, data: [] };
    }

    const preorders: PreorderItem[] = data || [];

    // Calculate dynamic FIFO queue position for paid_confirmed and assigned status
    // Items with paid_at timestamp are sorted by paid_at ASC
    const paidItems = preorders
      .filter((item) => (item.status === 'paid_confirmed' || item.status === 'assigned') && item.paid_at)
      .sort((a, b) => new Date(a.paid_at!).getTime() - new Date(b.paid_at!).getTime());

    const queueMap = new Map<string, number>();
    paidItems.forEach((item, idx) => {
      queueMap.set(item.id, idx + 1);
    });

    const enriched = preorders.map((item) => ({
      ...item,
      queue_position: queueMap.get(item.id) || null
    }));

    return { success: true, data: enriched };
  } catch (err: any) {
    console.error('getAdminPreordersAction Exception:', err.message || err);
    return { success: false, error: err.message || 'Xəta baş verdi', data: [] };
  }
}

/**
 * Supplier Summary Report (Təchizatçı Hesabatı - Çin Sifariş Sayğacı)
 * SUM(quantity) of confirmed preorders per product
 */
export async function getSupplierReportAction() {
  try {
    const supabase = await createServerSupabaseClient();

    // Query active preorders in 'paid_confirmed' or 'assigned' status
    const { data: activePreorders, error } = await supabase
      .from('preorders')
      .select(`
        *,
        product:products(id, title_az, title_en, image_url, price_azn, stock_quantity, allow_preorder, preorder_lead_time, slug)
      `)
      .in('status', ['paid_confirmed', 'assigned'])
      .order('paid_at', { ascending: true });

    if (error) {
      console.error('getSupplierReportAction Error:', error.message);
      return { success: true, report: [], total_units_to_order: 0 };
    }

    const groupMap = new Map<string, SupplierReportItem>();
    let totalUnits = 0;

    (activePreorders || []).forEach((item: any) => {
      const prodId = item.product_id;
      const qty = Number(item.quantity || 1);
      totalUnits += qty;

      const prod = item.product || {};
      const title = prod.title_az || prod.title_en || 'Məhsul';
      const image = prod.image_url || '/placeholder.png';
      const slug = prod.slug || '';
      const stock = Number(prod.stock_quantity || 0);
      const leadTime = prod.preorder_lead_time || '14-28 iş günü';

      if (!groupMap.has(prodId)) {
        groupMap.set(prodId, {
          product_id: prodId,
          product_title: title,
          product_image: image,
          product_slug: slug,
          current_stock: stock,
          total_preorder_quantity: 0,
          confirmed_preorders_count: 0,
          preorders_list: [],
          lead_time: leadTime
        });
      }

      const reportEntry = groupMap.get(prodId)!;
      reportEntry.total_preorder_quantity += qty;
      reportEntry.confirmed_preorders_count += 1;
      reportEntry.preorders_list.push({
        id: item.id,
        preorder_code: item.preorder_code,
        customer_name: item.customer_name,
        customer_phone: item.customer_phone,
        quantity: qty,
        paid_at: item.paid_at,
        status: item.status
      });
    });

    const reportArray = Array.from(groupMap.values()).sort(
      (a, b) => b.total_preorder_quantity - a.total_preorder_quantity
    );

    return {
      success: true,
      report: reportArray,
      total_units_to_order: totalUnits
    };
  } catch (err: any) {
    console.error('getSupplierReportAction Exception:', err.message || err);
    return { success: false, error: err.message, report: [], total_units_to_order: 0 };
  }
}

/**
 * Update Pre-Order status
 */
export async function updatePreorderStatusAction(
  preorder_id: string,
  new_status: 'pending_payment' | 'paid_confirmed' | 'assigned' | 'fulfilled' | 'cancelled',
  admin_notes?: string
) {
  try {
    const supabase = createAdminSupabaseClient();

    // Fetch existing preorder record
    const { data: existing, error: fetchErr } = await supabase
      .from('preorders')
      .select('*')
      .eq('id', preorder_id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Ön sifariş tapılmadı' };
    }

    const updateObj: any = {
      status: new_status,
      updated_at: new Date().toISOString()
    };

    if (admin_notes !== undefined) {
      updateObj.admin_notes = admin_notes;
    }

    // Set paid_at when transitioning to paid_confirmed
    if (new_status === 'paid_confirmed' && !existing.paid_at) {
      updateObj.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('preorders')
      .update(updateObj)
      .eq('id', preorder_id)
      .select('*, product:products(title_az, preorder_lead_time)')
      .single();

    if (error) {
      console.error('updatePreorderStatusAction Error:', error.message);
      return { success: false, error: error.message };
    }

    // Trigger Email Notifications based on Status Change
    if (data && data.customer_email) {
      if (new_status === 'paid_confirmed') {
        // Calculate queue position
        const { count } = await supabase
          .from('preorders')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', data.product_id)
          .eq('status', 'paid_confirmed')
          .lte('paid_at', data.paid_at || new Date().toISOString());

        sendPaymentConfirmedEmail({
          customerEmail: data.customer_email,
          customerName: data.customer_name,
          preorderCode: data.preorder_code,
          productTitle: data.product?.title_az || 'Rubik Məhsulu',
          leadTime: data.product?.preorder_lead_time || '14-28 iş günü',
          queuePosition: count || 1
        }).catch(err => console.error('Email trigger error (paid_confirmed):', err));
      } else if (new_status === 'assigned') {
        sendStockAssignedEmail({
          customerEmail: data.customer_email,
          customerName: data.customer_name,
          preorderCode: data.preorder_code,
          productTitle: data.product?.title_az || 'Rubik Məhsulu'
        }).catch(err => console.error('Email trigger error (assigned):', err));
      }
    }

    revalidatePath('/[locale]/admin/preorders', 'page');
    return { success: true, data };
  } catch (err: any) {
    console.error('updatePreorderStatusAction Exception:', err.message || err);
    return { success: false, error: err.message || 'Status yenilənərkən xəta baş verdi' };
  }
}

/**
 * Check if newly arrived stock matches pending confirmed pre-orders (Növbə Sinxronizasiyası)
 */
export async function checkStockAllocationNeedAction(productId: string, newlyAddedStock: number) {
  try {
    const supabase = createAdminSupabaseClient();

    // Fetch product title
    const { data: prod } = await supabase
      .from('products')
      .select('id, title_az, stock_quantity')
      .eq('id', productId)
      .single();

    if (!prod) {
      return { success: false, error: 'Məhsul tapılmadı' };
    }

    // Fetch waiting paid_confirmed preorders sorted by paid_at ASC
    const { data: waitingPreorders } = await supabase
      .from('preorders')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'paid_confirmed')
      .order('paid_at', { ascending: true });

    const preordersList = waitingPreorders || [];
    const waitingCount = preordersList.length;

    if (waitingCount === 0) {
      return {
        success: true,
        hasWaitingPreorders: false,
        productTitle: prod.title_az,
        waitingCount: 0,
        suggestedAllocationCount: 0,
        preorders: []
      };
    }

    // How many units/persons can be assigned stock
    let allocableCount = 0;
    let accumulatedUnits = 0;
    for (const item of preordersList) {
      if (accumulatedUnits + item.quantity <= newlyAddedStock) {
        accumulatedUnits += item.quantity;
        allocableCount++;
      } else if (allocableCount === 0) {
        allocableCount = 1; // At least first in queue
        break;
      } else {
        break;
      }
    }

    const suggestedAllocationCount = Math.min(newlyAddedStock, waitingCount);

    return {
      success: true,
      hasWaitingPreorders: true,
      productTitle: prod.title_az,
      waitingCount,
      suggestedAllocationCount,
      preorders: preordersList.slice(0, suggestedAllocationCount)
    };
  } catch (err: any) {
    console.error('checkStockAllocationNeedAction Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Confirm Stock Allocation to Queue (Növbədəki ön sifarişlərə avtomatik stok ayırmaq)
 */
export async function confirmStockAllocationAction(payload: {
  productId: string;
  allocatedUnits: number;
  addedStockQty?: number;
}) {
  try {
    const supabase = createAdminSupabaseClient();
    const { productId, allocatedUnits, addedStockQty } = payload;

    if (!productId || allocatedUnits <= 0) {
      return { success: false, error: 'Məlumatlar tam deyil.' };
    }

    // 1. Fetch top allocatedUnits preorders in paid_confirmed status
    const { data: waitingList } = await supabase
      .from('preorders')
      .select('*, product:products(title_az)')
      .eq('product_id', productId)
      .eq('status', 'paid_confirmed')
      .order('paid_at', { ascending: true })
      .limit(allocatedUnits);

    if (!waitingList || waitingList.length === 0) {
      return { success: false, error: 'Növbədə gözləyən təsdiqlənmiş ön sifariş tapılmadı.' };
    }

    const assignedIds = waitingList.map(item => item.id);

    // 2. Update their status to 'assigned'
    const { error: updateErr } = await supabase
      .from('preorders')
      .update({
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .in('id', assignedIds);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. Send automated emails to allocated customers
    for (const item of waitingList) {
      if (item.customer_email) {
        sendStockAssignedEmail({
          customerEmail: item.customer_email,
          customerName: item.customer_name,
          preorderCode: item.preorder_code,
          productTitle: item.product?.title_az || 'Rubik Məhsulu'
        }).catch(err => console.error('Allocation email error:', err));
      }
    }

    // 4. Update product stock_quantity if addedStockQty provided
    if (addedStockQty && addedStockQty > 0) {
      const { data: currentProd } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (currentProd) {
        const newStock = Math.max(0, Number(currentProd.stock_quantity || 0) + addedStockQty);
        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', productId);
      }
    }

    revalidatePath('/[locale]/admin/preorders', 'page');
    revalidatePath('/[locale]/admin/inventory', 'page');

    return {
      success: true,
      assignedCount: assignedIds.length,
      message: `Növbədəki ${assignedIds.length} nəfər ön sifarişçi üçün stok uğurla ayrıldı və bildiriş göndərildi!`
    };
  } catch (err: any) {
    console.error('confirmStockAllocationAction Exception:', err);
    return { success: false, error: err.message || 'Stok ayırılarkən xəta baş verdi.' };
  }
}

/**
 * Update Pre-Order Admin Notes
 */
export async function updatePreorderNotesAction(preorder_id: string, notes: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('preorders')
      .update({
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', preorder_id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/[locale]/admin/preorders', 'page');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Qeyd saxlanılarkən xəta baş verdi' };
  }
}

/**
 * Delete a Pre-Order record
 */
/**
 * Public Track Order/Preorder Action (Guest Lookup)
 * Lookup by Order/Preorder Code + Phone OR Email
 */
export async function trackOrderOrPreorderAction(code: string, contact: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const cleanCode = code.trim();
    const codeNoHyphen = cleanCode.replace(/-/g, '');
    const cleanContact = contact.trim();

    if (!cleanCode || !cleanContact) {
      return { success: false, error: 'Zəhmət olmasa Sifariş Kodu və Telefon/Email məlumatını daxil edin.' };
    }

    // Format phone if digits
    const digitsOnly = cleanContact.replace(/[^0-9]/g, '');
    let formattedPhone = cleanContact;
    if (digitsOnly.length >= 7) {
      if (digitsOnly.startsWith('0')) {
        formattedPhone = '+994' + digitsOnly.slice(1);
      } else if (digitsOnly.startsWith('994')) {
        formattedPhone = '+' + digitsOnly;
      } else if (!cleanContact.startsWith('+')) {
        formattedPhone = '+994' + digitsOnly;
      }
    }

    // 1. Try finding in preorders table
    const { data: preorderList } = await supabase
      .from('preorders')
      .select('*, product:products(id, title_az, title_en, title_ru, image_url, price_azn, preorder_lead_time)')
      .or(`preorder_code.ilike.%${cleanCode}%,preorder_code.ilike.%${codeNoHyphen}%,id.eq.${cleanCode.length === 36 ? cleanCode : '00000000-0000-0000-0000-000000000000'}`);

    if (preorderList && preorderList.length > 0) {
      // Filter by phone or email
      const matched = preorderList.find((item: any) => {
        const phoneMatch = item.customer_phone && (
          item.customer_phone.includes(digitsOnly) || 
          item.customer_phone === formattedPhone
        );
        const emailMatch = item.customer_email && (
          item.customer_email.toLowerCase() === cleanContact.toLowerCase()
        );
        return phoneMatch || emailMatch;
      });

      if (matched) {
        // Calculate queue position if paid_confirmed
        let queuePosition = null;
        if (matched.status === 'paid_confirmed' && matched.product_id) {
          const { count } = await supabase
            .from('preorders')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', matched.product_id)
            .eq('status', 'paid_confirmed')
            .lte('created_at', matched.created_at);

          queuePosition = count || 1;
        }

        return {
          success: true,
          type: 'preorder' as const,
          data: {
            id: matched.id,
            preorder_code: matched.preorder_code,
            customer_name: matched.customer_name,
            customer_phone: matched.customer_phone,
            customer_email: matched.customer_email,
            status: matched.status,
            quantity: matched.quantity,
            queue_position: queuePosition,
            created_at: matched.created_at,
            paid_at: matched.paid_at,
            product: matched.product
          }
        };
      }
    }

    // 2. Try finding in standard orders table
    const { data: orderList } = await supabase
      .from('orders')
      .select('*, order_items(*, product:products(title_az, image_url))')
      .or(`id.eq.${cleanCode.length === 36 ? cleanCode : '00000000-0000-0000-0000-000000000000'},id.ilike.%${cleanCode}%`);

    if (orderList && orderList.length > 0) {
      const matchedOrder = orderList.find((ord: any) => {
        const phoneMatch = ord.customer_phone && (
          ord.customer_phone.includes(digitsOnly) || 
          ord.customer_phone === formattedPhone
        );
        const emailMatch = ord.email && (
          ord.email.toLowerCase() === cleanContact.toLowerCase()
        );
        return phoneMatch || emailMatch;
      });

      if (matchedOrder) {
        return {
          success: true,
          type: 'order' as const,
          data: {
            id: matchedOrder.id,
            code: matchedOrder.id.substring(0, 8).toUpperCase(),
            customer_name: matchedOrder.customer_name,
            customer_phone: matchedOrder.customer_phone,
            status: matchedOrder.order_status || matchedOrder.status || 'pending',
            total_amount_azn: matchedOrder.total_amount_azn || matchedOrder.total_amount,
            delivery_method: matchedOrder.delivery_method,
            delivery_address: matchedOrder.delivery_address,
            created_at: matchedOrder.created_at,
            items: matchedOrder.order_items
          }
        };
      }
    }

    return {
      success: false,
      error: 'Daxil etdiyiniz Məlumatlar üzrə heç bir aktiv Sifariş və ya Ön Sifariş tapılmadı. Zəhmət olmasa Sifariş Kodunu və Telefon/Email məlumatını dəqiqləşdirin.'
    };
  } catch (err: any) {
    console.error('trackOrderOrPreorderAction Error:', err);
    return { success: false, error: err.message || 'Axtarış zamanı xəta baş verdi.' };
  }
}

export async function deletePreorderAction(preorder_id: string) {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('preorders')
      .delete()
      .eq('id', preorder_id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/[locale]/admin/preorders', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Silinərkən xəta baş verdi' };
  }
}
