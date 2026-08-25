// src/lib/actions/preorders.ts

'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  sanitizeInput, 
  validateId, 
  validateNonNegativeInt, 
  requireStaff, 
  requireAdmin 
} from '@/lib/security';
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
 * Create a new Pre-order record (Public or Authenticated)
 * Full server-side validation, product status check, rate limiting, and sanitization.
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
    const cleanProductId = validateId(payload.product_id, 'Məhsul ID');
    const cleanVariantId = payload.variant_id ? validateId(payload.variant_id, 'Variant ID') : null;
    const cleanName = sanitizeInput(payload.customer_name || 'Müştəri');
    const cleanPhone = sanitizeInput(payload.customer_phone || '').trim().replace(/[^0-9+]/g, '');
    const cleanEmail = payload.customer_email ? sanitizeInput(payload.customer_email).trim().toLowerCase() : null;
    const quantity = validateNonNegativeInt(payload.quantity || 1, 'Məhsul Sayı');

    if (quantity <= 0) {
      return { success: false, error: 'Ön sifariş sayı ən azı 1 olmalıdır.' };
    }

    if (!cleanPhone || cleanPhone.length < 7) {
      return { success: false, error: 'Düzgün telefon nömrəsi daxil edilməlidir.' };
    }

    const adminSupabase = createAdminSupabaseClient();

    // 1. Verify Product exists and is active / allows pre-order
    const { data: productData, error: pError } = await adminSupabase
      .from('products')
      .select('id, title_az, is_active, allow_preorder')
      .eq('id', cleanProductId)
      .single();

    if (pError || !productData) {
      return { success: false, error: 'Məhsul tapılmadı.' };
    }

    if (!productData.is_active) {
      return { success: false, error: 'Bu məhsul hazırda aktiv deyil.' };
    }

    // 2. Spam Protection: 2-minute rate limiting check by phone/email
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    let spamQuery = adminSupabase
      .from('preorders')
      .select('id, created_at')
      .eq('customer_phone', cleanPhone)
      .gte('created_at', twoMinutesAgo)
      .limit(1);

    const { data: recentPreorders } = await spamQuery;

    if (recentPreorders && recentPreorders.length > 0) {
      return {
        success: false,
        error: 'Spam Qorunması: Eyni telefon nömrəsi ilə son 2 dəqiqə ərzində təkrar ön sifariş qeydə alınıb. Zəhmət olmasa bir qədər gözləyin.'
      };
    }

    // 3. User session resolution
    const userClient = await createServerSupabaseClient();
    const { data: { user: authUser } } = await userClient.auth.getUser();

    // 4. Retry loop for unique preorder_code collision safety
    let code = generatePreorderCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      attempts++;
      const { data: existing } = await adminSupabase
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
      product_id: cleanProductId,
      variant_id: cleanVariantId,
      customer_name: cleanName,
      customer_phone: cleanPhone,
      customer_email: cleanEmail,
      quantity,
      status: 'pending_payment',
      user_id: authUser?.id || payload.user_id || null,
      admin_notes: payload.admin_notes ? sanitizeInput(payload.admin_notes) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await adminSupabase
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
 * Fetch preorders for admin with optional filtering & search (Requires Staff or Admin)
 * Dynamically computes queue position for paid_confirmed / assigned items
 */
export async function getAdminPreordersAction(params?: {
  status?: string;
  search?: string;
}) {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    let query = adminSupabase
      .from('preorders')
      .select(`
        *,
        product:products(id, title_az, title_en, title_ru, image_url, price_azn, stock_quantity, allow_preorder, preorder_lead_time, slug)
      `)
      .order('created_at', { ascending: false });

    if (params?.status && params.status !== 'all') {
      query = query.eq('status', sanitizeInput(params.status));
    }

    if (params?.search && params.search.trim()) {
      const cleanSearch = sanitizeInput(params.search).trim();
      const s = `%${cleanSearch}%`;
      query = query.or(`preorder_code.ilike.${s},customer_name.ilike.${s},customer_phone.ilike.${s},customer_email.ilike.${s}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getAdminPreordersAction Error:', error.message);
      return { success: true, data: [] };
    }

    const preorders: PreorderItem[] = data || [];

    // FIFO queue position calculation for paid_confirmed and assigned status
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
 * Supplier Summary Report (Requires Staff or Admin)
 * SUM(quantity) of confirmed preorders per product
 */
export async function getSupplierReportAction() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    // Query active preorders in 'paid_confirmed' or 'assigned' status
    const { data: activePreorders, error } = await adminSupabase
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
 * Update Pre-Order status (Requires Staff or Admin)
 */
export async function updatePreorderStatusAction(
  preorder_id: string,
  new_status: 'pending_payment' | 'paid_confirmed' | 'assigned' | 'fulfilled' | 'cancelled',
  admin_notes?: string
) {
  try {
    const { user } = await requireStaff();
    const cleanId = validateId(preorder_id, 'Ön Sifariş ID');
    const adminSupabase = createAdminSupabaseClient();

    // Fetch existing preorder record
    const { data: existing, error: fetchErr } = await adminSupabase
      .from('preorders')
      .select('*')
      .eq('id', cleanId)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Ön sifariş tapılmadı' };
    }

    const updateObj: any = {
      status: new_status,
      updated_at: new Date().toISOString()
    };

    if (admin_notes !== undefined) {
      updateObj.admin_notes = sanitizeInput(admin_notes);
    }

    // Set paid_at when transitioning to paid_confirmed
    if (new_status === 'paid_confirmed' && !existing.paid_at) {
      updateObj.paid_at = new Date().toISOString();
    }

    const { data, error } = await adminSupabase
      .from('preorders')
      .update(updateObj)
      .eq('id', cleanId)
      .select('*, product:products(title_az, preorder_lead_time)')
      .single();

    if (error) {
      console.error('updatePreorderStatusAction Error:', error.message);
      return { success: false, error: error.message };
    }

    // Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'update_preorder_status',
      entity_type: 'preorder',
      entity_id: cleanId,
      details: { old_status: existing.status, new_status, admin_notes }
    }]);

    // Trigger Email Notifications based on Status Change
    if (data && data.customer_email) {
      if (new_status === 'paid_confirmed') {
        const { count } = await adminSupabase
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
 * Check if newly arrived stock matches pending confirmed pre-orders (Requires Staff or Admin)
 */
export async function checkStockAllocationNeedAction(productId: string, newlyAddedStock: number) {
  try {
    await requireStaff();
    const cleanProductId = validateId(productId, 'Məhsul ID');
    const addedStock = validateNonNegativeInt(newlyAddedStock, 'Əlavə Edilən Stok');
    const adminSupabase = createAdminSupabaseClient();

    // Fetch product title
    const { data: prod } = await adminSupabase
      .from('products')
      .select('id, title_az, stock_quantity')
      .eq('id', cleanProductId)
      .single();

    if (!prod) {
      return { success: false, error: 'Məhsul tapılmadı' };
    }

    // Fetch waiting paid_confirmed preorders sorted by paid_at ASC
    const { data: waitingPreorders } = await adminSupabase
      .from('preorders')
      .select('*')
      .eq('product_id', cleanProductId)
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

    const suggestedAllocationCount = Math.min(addedStock, waitingCount);

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
 * Confirm Stock Allocation to Queue (Requires Staff or Admin)
 */
export async function confirmStockAllocationAction(payload: {
  productId: string;
  allocatedUnits: number;
  addedStockQty?: number;
}) {
  try {
    const { user } = await requireStaff();
    const cleanProductId = validateId(payload.productId, 'Məhsul ID');
    const allocatedUnits = validateNonNegativeInt(payload.allocatedUnits, 'Ayrılacaq Vahid Sayı');
    const addedStockQty = payload.addedStockQty ? validateNonNegativeInt(payload.addedStockQty, 'Əlavə Edilən Stok') : 0;
    const adminSupabase = createAdminSupabaseClient();

    if (allocatedUnits <= 0) {
      return { success: false, error: 'Ayrılacaq say ən azı 1 olmalıdır.' };
    }

    // 1. Fetch top allocatedUnits preorders in paid_confirmed status
    const { data: waitingList } = await adminSupabase
      .from('preorders')
      .select('*, product:products(title_az)')
      .eq('product_id', cleanProductId)
      .eq('status', 'paid_confirmed')
      .order('paid_at', { ascending: true })
      .limit(allocatedUnits);

    if (!waitingList || waitingList.length === 0) {
      return { success: false, error: 'Növbədə gözləyən təsdiqlənmiş ön sifariş tapılmadı.' };
    }

    const assignedIds = waitingList.map(item => item.id);

    // 2. Update their status to 'assigned'
    const { error: updateErr } = await adminSupabase
      .from('preorders')
      .update({
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .in('id', assignedIds);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'allocate_preorder_stock',
      entity_type: 'preorder_allocation',
      entity_id: cleanProductId,
      details: { assigned_count: assignedIds.length, assigned_ids: assignedIds, added_stock: addedStockQty }
    }]);

    // 4. Send automated emails to allocated customers
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

    // 5. Update product stock_quantity if addedStockQty provided
    if (addedStockQty > 0) {
      const { data: currentProd } = await adminSupabase
        .from('products')
        .select('stock_quantity')
        .eq('id', cleanProductId)
        .single();

      if (currentProd) {
        const newStock = Math.max(0, Number(currentProd.stock_quantity || 0) + addedStockQty);
        await adminSupabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', cleanProductId);
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
 * Update Pre-Order Admin Notes (Requires Staff or Admin)
 */
export async function updatePreorderNotesAction(preorder_id: string, notes: string) {
  try {
    const { user } = await requireStaff();
    const cleanId = validateId(preorder_id, 'Ön Sifariş ID');
    const cleanNotes = sanitizeInput(notes || '');
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from('preorders')
      .update({
        admin_notes: cleanNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', cleanId)
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
 * Delete a Pre-Order record (Requires Admin Privilege)
 */
export async function deletePreorderAction(preorder_id: string) {
  try {
    const { user } = await requireAdmin();
    const cleanId = validateId(preorder_id, 'Ön Sifariş ID');
    const adminSupabase = createAdminSupabaseClient();

    const { error } = await adminSupabase
      .from('preorders')
      .delete()
      .eq('id', cleanId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'delete_preorder',
      entity_type: 'preorder',
      entity_id: cleanId,
      details: { deleted_at: new Date().toISOString() }
    }]);

    revalidatePath('/[locale]/admin/preorders', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Silinərkən xəta baş verdi' };
  }
}

/**
 * Public Track Order/Preorder Action (Guest Lookup)
 * Lookup by Order/Preorder Code + Phone OR Email
 * Protected against PII leakage by strictly matching both Code and Contact.
 */
export async function trackOrderOrPreorderAction(code: string, contact: string) {
  try {
    const cleanCode = sanitizeInput(code || '').trim();
    const cleanContact = sanitizeInput(contact || '').trim();

    if (!cleanCode || !cleanContact) {
      return { success: false, error: 'Zəhmət olmasa Sifariş Kodunu və Telefon/Email məlumatını daxil edin.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    const digitsOnly = cleanContact.replace(/[^0-9]/g, '');
    const cleanEmail = cleanContact.toLowerCase();

    // 1. Try finding in preorders table
    const { data: preorderList } = await adminSupabase
      .from('preorders')
      .select('*, product:products(id, title_az, title_en, title_ru, image_url, price_azn, preorder_lead_time)')
      .eq('preorder_code', cleanCode.toUpperCase());

    if (preorderList && preorderList.length > 0) {
      const matched = preorderList.find((item: any) => {
        const itemPhoneDigits = (item.customer_phone || '').replace(/[^0-9]/g, '');
        const phoneMatch = digitsOnly.length >= 7 && itemPhoneDigits.includes(digitsOnly);
        const emailMatch = item.customer_email && item.customer_email.toLowerCase() === cleanEmail;
        return phoneMatch || emailMatch;
      });

      if (matched) {
        let queuePosition = null;
        if (matched.status === 'paid_confirmed' && matched.product_id) {
          const { count } = await adminSupabase
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
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);
    let orderQuery = adminSupabase
      .from('orders')
      .select('id, full_name, phone, email, total, shipping_status, payment_status, created_at, shipping_address, order_items(*, product:products(title_az, image_url))');

    if (isUUID) {
      orderQuery = orderQuery.eq('id', cleanCode);
    } else {
      orderQuery = orderQuery.ilike('id', `${cleanCode}%`);
    }

    const { data: orderList } = await orderQuery.limit(5);

    if (orderList && orderList.length > 0) {
      const matchedOrder = orderList.find((ord: any) => {
        const ordPhoneDigits = (ord.phone || '').replace(/[^0-9]/g, '');
        const phoneMatch = digitsOnly.length >= 7 && ordPhoneDigits.includes(digitsOnly);
        const emailMatch = ord.email && ord.email.toLowerCase() === cleanEmail;
        return phoneMatch || emailMatch;
      });

      if (matchedOrder) {
        return {
          success: true,
          type: 'order' as const,
          data: {
            id: matchedOrder.id,
            code: matchedOrder.id.substring(0, 8).toUpperCase(),
            customer_name: matchedOrder.full_name,
            customer_phone: matchedOrder.phone,
            status: matchedOrder.shipping_status || 'pending',
            payment_status: matchedOrder.payment_status,
            total_amount_azn: Number(matchedOrder.total || 0),
            delivery_address: matchedOrder.shipping_address,
            created_at: matchedOrder.created_at,
            items: matchedOrder.order_items
          }
        };
      }
    }

    return {
      success: false,
      error: 'Daxil etdiyiniz məlumatlar üzrə heç bir aktiv sifariş və ya ön sifariş tapılmadı. Zəhmət olmasa Sifariş Kodunu və Telefon/Email məlumatını dəqiqləşdirin.'
    };
  } catch (err: any) {
    console.error('trackOrderOrPreorderAction Error:', err);
    return { success: false, error: err.message || 'Axtarış zamanı xəta baş verdi.' };
  }
}

