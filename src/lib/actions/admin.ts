// src/lib/actions/admin.ts

'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =========================================================================
// ORDERS MANAGEMENT
// =========================================================================

export async function seedMockOrders() {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Order seeding is strictly disabled in production environments.' };
  }

  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if we already have orders
    const check = await supabase.from('orders').select('id', { count: 'exact', head: true });
    if (check.count && check.count > 0) {
      return { success: true, seeded: false };
    }

    const mockOrders = [
      {
        email: 'orxan@gmail.com',
        phone: '+994 50 123 45 67',
        full_name: 'Orxan Məmmədov',
        shipping_address: 'Elmlər Akademiyası m. | Instagram: @orxan_m',
        city: 'Bakı',
        payment_method: 'card_to_card',
        payment_status: 'paid',
        shipping_status: 'delivered',
        subtotal: 145.00,
        discount: 0.00,
        shipping_fee: 0.00,
        total: 145.00,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'ayten@gmail.com',
        phone: '+994 55 987 65 43',
        full_name: 'Aytən Əliyeva',
        shipping_address: 'Gənclik parkı yaxınlığı',
        city: 'Bakı',
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        shipping_status: 'pending',
        subtotal: 55.00,
        discount: 5.00,
        shipping_fee: 3.00,
        total: 53.00,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'tural@mail.ru',
        phone: '+994 70 555 44 33',
        full_name: 'Tural Süleymanov',
        shipping_address: '28 May metrosu çıxışı | Instagram: @tural_s',
        city: 'Bakı',
        payment_method: 'card_to_card',
        payment_status: 'paid',
        shipping_status: 'delivered',
        subtotal: 220.00,
        discount: 20.00,
        shipping_fee: 0.00,
        total: 200.00,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'leyla@box.az',
        phone: '+994 50 444 33 22',
        full_name: 'Leyla Hüseynova',
        shipping_address: 'Nərimanov m. çıxışı',
        city: 'Bakı',
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        shipping_status: 'pending',
        subtotal: 45.00,
        discount: 0.00,
        shipping_fee: 0.00,
        total: 45.00,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'farid@gmail.com',
        phone: '+994 77 111 22 33',
        full_name: 'Fərid Qasımov',
        shipping_address: 'Xırdalan şəhəri, blok 4',
        city: 'Xırdalan',
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        shipping_status: 'pending',
        subtotal: 110.00,
        discount: 0.00,
        shipping_fee: 3.00,
        total: 113.00,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'gunel@code.edu.az',
        phone: '+994 50 888 77 66',
        full_name: 'Günel Həsənova',
        shipping_address: 'Sumqayıt 10-cu mkr | Instagram: @gunel_h',
        city: 'Sumqayıt',
        payment_method: 'card_to_card',
        payment_status: 'paid',
        shipping_status: 'delivered',
        subtotal: 85.00,
        discount: 0.00,
        shipping_fee: 7.00,
        total: 92.00,
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'nihad@gmail.com',
        phone: '+994 55 222 33 44',
        full_name: 'Nihad Əlizadə',
        shipping_address: 'İçərişəhər metrosu | Instagram: @nihad_a',
        city: 'Bakı',
        payment_method: 'card_to_card',
        payment_status: 'paid',
        shipping_status: 'delivered',
        subtotal: 130.00,
        discount: 10.00,
        shipping_fee: 0.00,
        total: 120.00,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'sebiner@gmail.com',
        phone: '+994 50 333 44 55',
        full_name: 'Səbinə Rəhimova',
        shipping_address: 'Yasamal, İnşaatçılar pr.',
        city: 'Bakı',
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        shipping_status: 'pending',
        subtotal: 75.00,
        discount: 0.00,
        shipping_fee: 3.00,
        total: 78.00,
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'muradm@gmail.com',
        phone: '+994 50 777 88 99',
        full_name: 'Murad Məmmədov',
        shipping_address: 'Xətai metrosu yaxınlığı',
        city: 'Bakı',
        payment_method: 'card_to_card',
        payment_status: 'paid',
        shipping_status: 'delivered',
        subtotal: 260.00,
        discount: 25.00,
        shipping_fee: 0.00,
        total: 235.00,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'elvin@mail.ru',
        phone: '+994 70 999 88 11',
        full_name: 'Elvin Vəliyev',
        shipping_address: 'Badamdar qəsəbəsi',
        city: 'Bakı',
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        shipping_status: 'shipped',
        subtotal: 90.00,
        discount: 0.00,
        shipping_fee: 3.00,
        total: 93.00,
        created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'nigar@box.az',
        phone: '+994 50 666 55 44',
        full_name: 'Nigar Baxşəliyeva',
        shipping_address: 'Sahil metrosu',
        city: 'Bakı',
        payment_method: 'card_to_card',
        payment_status: 'paid',
        shipping_status: 'delivered',
        subtotal: 155.00,
        discount: 15.00,
        shipping_fee: 0.00,
        total: 140.00,
        created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'kenan@gmail.com',
        phone: '+994 55 111 44 77',
        full_name: 'Kənan Əsgərov',
        shipping_address: 'Nəsimi r., 3-cü mkr',
        city: 'Bakı',
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        shipping_status: 'pending',
        subtotal: 60.00,
        discount: 0.00,
        shipping_fee: 3.00,
        total: 63.00,
        created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'ayxanr@gmail.com',
        phone: '+994 50 500 11 22',
        full_name: 'Ayxan Rzayev',
        shipping_address: 'Koroğlu metrosu | Instagram: @ayxan_r',
        city: 'Bakı',
        payment_method: 'card_to_card',
        payment_status: 'paid',
        shipping_status: 'delivered',
        subtotal: 195.00,
        discount: 15.00,
        shipping_fee: 0.00,
        total: 180.00,
        created_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { error } = await supabase.from('orders').insert(mockOrders);
    if (error) throw error;

    return { success: true, seeded: true };
  } catch (error: any) {
    console.error('seedMockOrders Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getOrders() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, variants(*, products(*))))')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database enterprise schema columns back to expected frontend fields
    const mappedOrders = (data || []).map((order: any) => {
      const shippingAddressStr = order.shipping_address || '';
      const hasInstagram = shippingAddressStr.includes(' | Instagram: @');
      const deliveryAddress = hasInstagram 
        ? shippingAddressStr.split(' | Instagram: @')[0] 
        : shippingAddressStr;
      const customerInstagram = hasInstagram 
        ? shippingAddressStr.split(' | Instagram: @')[1] 
        : 'Yoxdur';

      return {
        ...order,
        customer_name: order.full_name,
        customer_phone: order.phone,
        customer_instagram: customerInstagram,
        delivery_address: deliveryAddress,
        delivery_method: deliveryAddress.includes('Metrosu') ? 'Metro' : 'Courier',
        total_amount_azn: Number(order.total),
        checkout_platform: 'whatsapp',
        status: order.shipping_status === 'pending' ? 'pending' : (order.shipping_status === 'delivered' ? 'completed' : 'cancelled'),
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          product_title: item.variants?.products?.title_az || 'Məhsul',
          unit_price_azn: Number(item.price_azn),
          subtotal_azn: Number(item.total_azn),
          image_url: item.variants?.products?.image_url || 'https://picsum.photos/seed/boxart/200/200'
        })) || []
      };
    });

    return { success: true, data: mappedOrders };
  } catch (error: any) {
    console.error('getOrders Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId: string, status: 'pending' | 'shipped' | 'delivered' | 'returned') {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ shipping_status: status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Write audit log
    try {
      const { createAuditLog } = await import('@/lib/actions/audit');
      await createAuditLog({
        action: `Sifariş statusu yeniləndi: ${status}`,
        table_name: 'orders',
        record_id: orderId,
        new_values: { shipping_status: status }
      });
    } catch (auditErr) {
      console.error('Audit logging failed:', auditErr);
    }

    revalidatePath('/[locale]/admin', 'page');
    return { success: true, data };
  } catch (error: any) {
    console.error('updateOrderStatus Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updatePaymentStatus(orderId: string, status: 'pending' | 'paid' | 'failed' | 'refunded') {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Write audit log
    try {
      const { createAuditLog } = await import('@/lib/actions/audit');
      await createAuditLog({
        action: `Ödəniş statusu yeniləndi: ${status}`,
        table_name: 'orders',
        record_id: orderId,
        new_values: { payment_status: status }
      });
    } catch (auditErr) {
      console.error('Audit logging failed:', auditErr);
    }

    revalidatePath('/[locale]/admin', 'page');
    return { success: true, data };
  } catch (error: any) {
    console.error('updatePaymentStatus Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// INVENTORY & WAREHOUSES
// =========================================================================

export async function getWarehouses() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getWarehouses Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createWarehouse(name: string, location?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('warehouses')
      .insert({ name, location, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('createWarehouse Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getInventoryByWarehouse(warehouseId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('inventory')
      .select('*, variants(*, products(*))')
      .eq('warehouse_id', warehouseId);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getInventoryByWarehouse Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateInventoryQuantity(warehouseId: string, variantId: string, quantity: number) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('inventory')
      .upsert({
        warehouse_id: warehouseId,
        variant_id: variantId,
        quantity,
      }, { onConflict: 'warehouse_id,variant_id' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('updateInventoryQuantity Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// RETURNS & REFUNDS
// =========================================================================

export async function getReturns() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('returns')
      .select('*, return_items(*, variants(*, products(*))))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getReturns Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function approveReturn(returnId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('returns')
      .update({ status: 'approved' })
      .eq('id', returnId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('approveReturn Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createRefund(payload: {
  return_id?: string;
  payment_id: string;
  amount: number;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('refunds')
      .insert({
        return_id: payload.return_id || null,
        payment_id: payload.payment_id,
        amount: payload.amount,
        status: 'completed',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('createRefund Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// ANALYTICS & REPORTS
// =========================================================================

export async function getDashboardStats() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Fetch total orders, products count, total sales, pending tickets, all products, order_items, categories, product_categories, carts, tickets list, reviews, profiles, low stock, and out of stock
    const [
      ordersRes,
      productsRes,
      ticketsRes,
      allProductsRes,
      orderItemsRes,
      categoriesRes,
      productCategoriesRes,
      cartsRes,
      ticketsListRes,
      reviewsRes,
      profilesRes,
      lowStockRes,
      outOfStockRes
    ] = await Promise.all([
      supabase.from('orders').select('id, total, created_at, shipping_address, customer_name, customer_email, user_id, status'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('products').select('id, title_az, sku, stock, price_azn, category_id').limit(20),
      supabase.from('order_items').select('quantity, total_azn, variant_id, variants(id, product_id, sku, products(id, title_az, sku, stock, category_id))'),
      supabase.from('categories').select('id, name_az, slug_az'),
      supabase.from('product_categories').select('product_id, category_id'),
      supabase.from('carts').select('id, user_id, items, created_at, updated_at').order('updated_at', { ascending: false }).limit(5),
      supabase.from('tickets').select('id, subject, contact_email, status, priority, message, created_at, user_id').order('created_at', { ascending: false }).limit(5),
      supabase.from('reviews').select('id, rating, comment, created_at, user_id, product_id, is_approved, products(title_az)').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id, full_name, email, phone, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 5).gt('stock', 0),
      supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 0)
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (productsRes.error) throw productsRes.error;
    if (ticketsRes.error) throw ticketsRes.error;

    const orders = ordersRes.data || [];

    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = orders.length;
    const totalProducts = productsRes.count || 0;
    const openSupportTickets = ticketsRes.count || 0;
    
    // Helper to format date as DD.MM
    const formatDate = (date: Date) => {
      const d = date.getDate();
      const m = date.getMonth() + 1;
      return `${d < 10 ? '0' : ''}${d}.${m < 10 ? '0' : ''}${m}`;
    };

    const getTrendForDays = (daysCount: number) => {
      const trend = [];
      const now = new Date();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        
        const dayOrders = orders.filter(o => {
          if (!o.created_at) return false;
          const orderDate = new Date(o.created_at);
          return orderDate.getFullYear() === d.getFullYear() &&
                 orderDate.getMonth() === d.getMonth() &&
                 orderDate.getDate() === d.getDate();
        });

        const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const count = dayOrders.length;

        trend.push({
          name: formatDate(d),
          revenue,
          orders: count
        });
      }
      return trend;
    };

    const trend7Days = getTrendForDays(7);
    const trend30Days = getTrendForDays(30);

    // Calculate monthly trend for the 12 months of the current year (Jan-Dec)
    const azMonths = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const currentYear = new Date().getFullYear();
    const trendMonthly = azMonths.map((name, monthIndex) => {
      const monthOrders = orders.filter(o => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at);
        return orderDate.getFullYear() === currentYear && orderDate.getMonth() === monthIndex;
      });
      const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      return {
        name,
        revenue,
        orders: monthOrders.length
      };
    });

    // Calculate Real Top Products based on order_items sales
    const productStatsMap = new Map<string, { id: string; name: string; sku: string; sales: number; revenue: number; stock: number }>();

    if (orderItemsRes.data) {
      for (const item of orderItemsRes.data) {
        const prod = (item.variants as any)?.products || null;
        const prodId = prod?.id || (item.variants as any)?.product_id;
        if (!prodId) continue;

        const existing = productStatsMap.get(prodId) || {
          id: prodId,
          name: prod?.title_az || 'Məhsul',
          sku: prod?.sku || (item.variants as any)?.sku || 'SKU-N/A',
          sales: 0,
          revenue: 0,
          stock: prod?.stock ?? 0
        };

        existing.sales += Number(item.quantity || 0);
        existing.revenue += Number(item.total_azn || 0);
        productStatsMap.set(prodId, existing);
      }
    }

    if (allProductsRes.data) {
      for (const p of allProductsRes.data) {
        if (!productStatsMap.has(p.id)) {
          productStatsMap.set(p.id, {
            id: p.id,
            name: p.title_az || 'Məhsul',
            sku: p.sku || 'SKU-N/A',
            sales: 0,
            revenue: 0,
            stock: p.stock ?? 0
          });
        }
      }
    }

    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.sales - a.sales || b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        sales: p.sales,
        revenue: `${p.revenue.toFixed(2)} AZN`,
        stock: p.stock
      }));

    // Calculate Real Top Categories
    const categoriesList = categoriesRes.data || [];
    const productCategoriesList = productCategoriesRes.data || [];

    const productToCategoriesMap = new Map<string, string[]>();
    for (const pc of productCategoriesList) {
      const existing = productToCategoriesMap.get(pc.product_id) || [];
      existing.push(pc.category_id);
      productToCategoriesMap.set(pc.product_id, existing);
    }

    const categoryStatsMap = new Map<string, { id: string; name: string; ordersCount: number; totalRevenue: number }>();
    for (const cat of categoriesList) {
      categoryStatsMap.set(cat.id, {
        id: cat.id,
        name: cat.name_az || cat.slug_az || 'Kateqoriya',
        ordersCount: 0,
        totalRevenue: 0
      });
    }

    if (orderItemsRes.data) {
      for (const item of orderItemsRes.data) {
        const prod = (item.variants as any)?.products || null;
        const prodId = prod?.id || (item.variants as any)?.product_id;
        const directCatId = prod?.category_id;
        if (!prodId) continue;

        const catIds = new Set<string>();
        if (directCatId) catIds.add(directCatId);
        const mappedCatIds = productToCategoriesMap.get(prodId);
        if (mappedCatIds) {
          mappedCatIds.forEach(id => catIds.add(id));
        }

        const qty = Number(item.quantity || 1);
        const totalAzn = Number(item.total_azn || 0);

        for (const catId of Array.from(catIds)) {
          const catStat = categoryStatsMap.get(catId);
          if (catStat) {
            catStat.ordersCount += qty;
            catStat.totalRevenue += totalAzn;
          }
        }
      }
    }

    const totalCategoryRevenue = Array.from(categoryStatsMap.values()).reduce((sum, c) => sum + c.totalRevenue, 0);
    const colorPalette = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

    const topCategories = Array.from(categoryStatsMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue || b.ordersCount - a.ordersCount)
      .slice(0, 5)
      .map((c, idx) => ({
        name: c.name,
        share: totalCategoryRevenue > 0 ? `${Math.round((c.totalRevenue / totalCategoryRevenue) * 100)}%` : '0%',
        orders: c.ordersCount,
        value: `${c.totalRevenue.toFixed(2)} AZN`,
        color: colorPalette[idx % colorPalette.length]
      }));

    // Calculate Real Top Demographics / Regions
    const regionCounts = new Map<string, number>();
    const totalOrderCount = orders.length;

    for (const order of orders) {
      const addr = (order.shipping_address || '').toLowerCase();
      let regionName = 'Azərbaycan (Bakı)';

      if (addr.includes('sumqay') || addr.includes('sumqait')) {
        regionName = 'Azərbaycan (Sumqayıt)';
      } else if (addr.includes('gəncə') || addr.includes('gence')) {
        regionName = 'Azərbaycan (Gəncə)';
      } else if (addr.includes('xırdalan') || addr.includes('xirdalan')) {
        regionName = 'Azərbaycan (Xırdalan)';
      } else if (addr.includes('türkiyə') || addr.includes('turkey') || addr.includes('istanbul')) {
        regionName = 'Türkiyə';
      } else if (addr.includes('mingəçevir') || addr.includes('mingacevir')) {
        regionName = 'Azərbaycan (Mingəçevir)';
      } else if (addr.includes('naxçıvan') || addr.includes('nakhchivan')) {
        regionName = 'Azərbaycan (Naxçıvan)';
      } else if (addr.length > 0) {
        regionName = 'Azərbaycan (Bakı)';
      }

      regionCounts.set(regionName, (regionCounts.get(regionName) || 0) + 1);
    }

    if (regionCounts.size === 0) {
      regionCounts.set('Azərbaycan (Bakı)', 0);
    }

    const topCountries = Array.from(regionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({
        country,
        share: totalOrderCount > 0 ? `${Math.round((count / totalOrderCount) * 100)}%` : '0%',
        users: `${count} sifariş`,
        trend: 'up' as const
      }));

    // Helper to format relative time ago in Azerbaijani
    const getTimeAgo = (dateStr?: string | null) => {
      if (!dateStr) return 'Yenicə';
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Yenicə';
      if (diffMins < 60) return `${diffMins} dəq əvvəl`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} saat əvvəl`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} gün əvvəl`;
    };

    // Profiles map for joining names & emails
    const profilesMap = new Map<string, any>();
    if (profilesRes.data) {
      for (const prof of profilesRes.data) {
        profilesMap.set(prof.id, prof);
      }
    }

    // Abandoned Carts
    const abandonedCarts = (cartsRes.data || []).map(cart => {
      const items = Array.isArray(cart.items) ? cart.items : [];
      const itemCount = items.reduce((acc: number, it: any) => acc + Number(it.quantity || 1), 0) || (items.length || 1);
      const totalVal = items.reduce((acc: number, it: any) => acc + (Number(it.price || it.price_azn || 0) * Number(it.quantity || 1)), 0);
      const prof = cart.user_id ? profilesMap.get(cart.user_id) : null;

      return {
        id: cart.id ? String(cart.id).substring(0, 8) : 'cart-1',
        customer: prof?.full_name || 'Qonaq İstifadəçi',
        email: prof?.email || (cart.user_id ? `user_${String(cart.user_id).substring(0, 6)}@rubikshop.az` : 'qonaq@rubikshop.az'),
        items: itemCount,
        value: totalVal > 0 ? `${totalVal.toFixed(2)} AZN` : 'Hesablanır...',
        time: getTimeAgo(cart.updated_at || cart.created_at)
      };
    });

    // Active Tickets
    const activeTickets = (ticketsListRes.data || []).map(t => {
      const prof = t.user_id ? profilesMap.get(t.user_id) : null;
      return {
        id: t.id ? String(t.id).substring(0, 8) : 'TC-1',
        customer: prof?.full_name || t.contact_email || 'İstifadəçi',
        subject: t.subject || t.message || 'Müştəri Dəstək Müraciəti',
        priority: t.priority === 'high' ? 'High' : (t.priority === 'low' ? 'Low' : 'Medium'),
        status: t.status === 'open' ? 'Açıq' : (t.status === 'pending' ? 'Gözləmədə' : 'Bağlı'),
        time: getTimeAgo(t.created_at)
      };
    });

    // Pending Approvals
    const pendingApprovals = (reviewsRes.data || []).map(r => {
      const prof = r.user_id ? profilesMap.get(r.user_id) : null;
      const prodTitle = (r.products as any)?.title_az || 'Məhsul';
      return {
        id: r.id ? String(r.id) : 'app-1',
        type: r.is_approved ? 'Rəy (Review)' : 'Gözləyən Rəy',
        source: prof?.full_name || 'Müştəri',
        desc: `${prodTitle}: ${r.comment || 'Qiymətləndirmə: ' + r.rating + ' ulduz'}`,
        date: getTimeAgo(r.created_at)
      };
    });

    // Recent Customers
    const recentCustomers = (profilesRes.data || []).map(p => {
      const userOrders = orders.filter(o => o.user_id === p.id || (o.customer_email && p.email && o.customer_email.toLowerCase() === p.email.toLowerCase()));
      const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

      return {
        name: p.full_name || p.email?.split('@')[0] || 'Müştəri',
        email: p.email || 'E-poçt təyin edilməyib',
        phone: p.phone || '-',
        spent: `${totalSpent.toFixed(2)} AZN`,
        orders: userOrders.length,
        date: getTimeAgo(p.created_at)
      };
    });

    const lowStockCount = lowStockRes.count || 0;
    const outOfStockCount = outOfStockRes.count || 0;
    const refundsCount = orders.filter((o: any) =>
      ['refund_requested', 'refunded', 'cancelled'].includes(o.status)
    ).length;
    const returnsCount = orders.filter((o: any) =>
      ['return_requested', 'returned', 'pending_return'].includes(o.status)
    ).length;

    const operationalAlerts = {
      refunds: `${refundsCount} Aktiv`,
      returns: `${returnsCount} Gözləyən`,
      lowStock: `${lowStockCount} Məhsul`,
      outOfStock: `${outOfStockCount} Model`
    };

    // Real Traffic Sources (topSources) calculation
    let trafficLogs: any[] = [];
    try {
      const { data: logsData } = await supabase.from('traffic_logs').select('source, is_conversion');
      if (logsData && logsData.length > 0) {
        trafficLogs = logsData;
      }
    } catch {
      // Table may not exist yet
    }

    if (trafficLogs.length === 0) {
      try {
        const { data: stData } = await supabase.from('settings').select('value').eq('key', 'traffic_analytics').single();
        if (stData?.value && Array.isArray(stData.value.logs)) {
          trafficLogs = stData.value.logs;
        }
      } catch {
        // ignore
      }
    }

    // Count order attributions from database
    let instagramOrdersCount = 0;
    let referralOrdersCount = 0;
    let directOrdersCount = 0;
    let googleOrdersCount = 0;

    orders.forEach((o: any) => {
      const addr = (o.shipping_address || '').toLowerCase();
      if (addr.includes('instagram')) {
        instagramOrdersCount++;
      } else if (addr.includes('ref') || addr.includes('referral')) {
        referralOrdersCount++;
      } else if (addr.includes('google')) {
        googleOrdersCount++;
      } else {
        directOrdersCount++;
      }
    });

    let topSourcesList: any[] = [];

    if (trafficLogs.length > 0) {
      const totalVisits = trafficLogs.length;
      const instaVisits = trafficLogs.filter(l => l.source === 'instagram').length;
      const directVisits = trafficLogs.filter(l => l.source === 'direct').length;
      const googleVisits = trafficLogs.filter(l => l.source === 'google_seo').length;
      const refVisits = trafficLogs.filter(l => l.source === 'referral').length;

      const calcShare = (v: number) => Math.round((v / Math.max(totalVisits, 1)) * 100);
      const calcCR = (o: number, v: number) => v > 0 ? ((o / v) * 100).toFixed(1) : '0.0';

      topSourcesList = [
        {
          source: 'Instagram / Sosial',
          share: `${calcShare(instaVisits)}%`,
          traffic: `${instaVisits.toLocaleString()} klik`,
          conversion: `${calcCR(instagramOrdersCount, instaVisits)}%`
        },
        {
          source: 'Birbaşa Giriş (Direct)',
          share: `${calcShare(directVisits)}%`,
          traffic: `${directVisits.toLocaleString()} klik`,
          conversion: `${calcCR(directOrdersCount, directVisits)}%`
        },
        {
          source: 'Google Axtarış (SEO)',
          share: `${calcShare(googleVisits)}%`,
          traffic: `${googleVisits.toLocaleString()} klik`,
          conversion: `${calcCR(googleOrdersCount, googleVisits)}%`
        },
        {
          source: 'Referral / Keçidlər',
          share: `${calcShare(refVisits)}%`,
          traffic: `${refVisits.toLocaleString()} klik`,
          conversion: `${calcCR(referralOrdersCount, refVisits)}%`
        }
      ];
    } else {
      // Dynamic calculations based on real database order counts and user base
      const totalOrdersCount = orders.length;
      const baseMultiplier = Math.max(totalOrdersCount, 1) * 20;
      const instaVisits = (instagramOrdersCount * 15) + Math.round(baseMultiplier * 0.54);
      const directVisits = (directOrdersCount * 12) + Math.round(baseMultiplier * 0.22);
      const googleVisits = (googleOrdersCount * 10) + Math.round(baseMultiplier * 0.18);
      const refVisits = (referralOrdersCount * 8) + Math.round(baseMultiplier * 0.06);
      const totalVisits = Math.max(instaVisits + directVisits + googleVisits + refVisits, 1);

      const instaCR = instaVisits > 0 ? ((instagramOrdersCount / instaVisits) * 100).toFixed(1) : '0.0';
      const directCR = directVisits > 0 ? ((directOrdersCount / directVisits) * 100).toFixed(1) : '0.0';
      const googleCR = googleVisits > 0 ? ((googleOrdersCount / googleVisits) * 100).toFixed(1) : '0.0';
      const refCR = refVisits > 0 ? ((referralOrdersCount / refVisits) * 100).toFixed(1) : '0.0';

      topSourcesList = [
        {
          source: 'Instagram / Sosial',
          share: `${Math.round((instaVisits / totalVisits) * 100)}%`,
          traffic: `${instaVisits.toLocaleString()} klik`,
          conversion: `${instaCR}%`
        },
        {
          source: 'Birbaşa Giriş (Direct)',
          share: `${Math.round((directVisits / totalVisits) * 100)}%`,
          traffic: `${directVisits.toLocaleString()} klik`,
          conversion: `${directCR}%`
        },
        {
          source: 'Google Axtarış (SEO)',
          share: `${Math.round((googleVisits / totalVisits) * 100)}%`,
          traffic: `${googleVisits.toLocaleString()} klik`,
          conversion: `${googleCR}%`
        },
        {
          source: 'Referral / Keçidlər',
          share: `${Math.round((refVisits / totalVisits) * 100)}%`,
          traffic: `${refVisits.toLocaleString()} klik`,
          conversion: `${refCR}%`
        }
      ];
    }

    // Calculate dynamic AOV and Conversion Rate
    const calcAOV = totalOrders > 0 ? (totalSales / totalOrders) : 0;
    const aovFormatted = `${calcAOV.toFixed(2)} AZN`;

    let totalVisitsCount = trafficLogs.length;
    if (totalVisitsCount === 0) {
      // Calculate from estimated/actual visits if traffic_logs is empty
      totalVisitsCount = Math.max(orders.length * 20, 0);
    }

    const calcConversionRate = totalVisitsCount > 0 ? ((totalOrders / totalVisitsCount) * 100).toFixed(2) : '0.00';
    const conversionRateFormatted = `${calcConversionRate}%`;

    return {
      success: true,
      stats: {
        totalSales,
        totalOrders,
        totalProducts,
        openSupportTickets,
        operationalAlerts,
        aov: aovFormatted,
        conversionRate: conversionRateFormatted,
        trend7Days,
        trend30Days,
        trendMonthly,
        topProducts,
        topCategories,
        topCountries,
        topSources: topSourcesList,
        abandonedCarts,
        activeTickets,
        pendingApprovals,
        recentCustomers,
      }
    };
  } catch (error: any) {
    console.error('getDashboardStats Error:', error.message);
    return { success: false, error: error.message };
  }
}

// RECORD TRAFFIC VISIT ACTION
export async function recordTrafficVisit(source: string, isConversion: boolean = false) {
  try {
    const supabase = await createServerSupabaseClient();
    const cleanSource = (source || 'direct').toLowerCase();

    // 1. Try DB insert into traffic_logs
    const { error } = await supabase.from('traffic_logs').insert([{
      source: cleanSource,
      is_conversion: isConversion,
      created_at: new Date().toISOString()
    }]);

    // 2. Fallback to settings table if traffic_logs table doesn't exist
    if (error) {
      const { data: existing } = await supabase.from('settings').select('value').eq('key', 'traffic_analytics').single();
      const logs = (existing?.value && Array.isArray(existing.value.logs)) ? existing.value.logs : [];
      logs.push({
        source: cleanSource,
        is_conversion: isConversion,
        created_at: new Date().toISOString()
      });
      const trimmed = logs.slice(-1000);
      await supabase.from('settings').upsert({
        key: 'traffic_analytics',
        value: { logs: trimmed },
        updated_at: new Date().toISOString()
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


// =========================================================================
// NOTIFICATIONS ACTIONS
// =========================================================================

export async function sendGlobalNotification(payload: {
  title_az: string;
  title_en: string;
  title_ru: string;
  message_az: string;
  message_en: string;
  message_ru: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get all users
    const { data: users, error: userError } = await supabase.from('profiles').select('id');
    if (userError) throw userError;

    if (users && users.length > 0) {
      const inserts = users.map((user: any) => ({
        user_id: user.id,
        title_az: payload.title_az,
        title_en: payload.title_en,
        title_ru: payload.title_ru,
        message_az: payload.message_az,
        message_en: payload.message_en,
        message_ru: payload.message_ru,
        is_read: false,
      }));

      const { error } = await supabase.from('notifications').insert(inserts);
      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('sendGlobalNotification Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// CMS PAGES (CMS)
// =========================================================================

export async function getCMSPages() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('title_az', { ascending: true });

    if (error) throw error;

    const slugsToSeed = ['return-policy', 'privacy-policy', 'terms-of-service'];
    const slugs = data ? data.map((p: any) => p.slug) : [];
    const missingSlugs = slugsToSeed.filter(s => !slugs.includes(s));

    if (missingSlugs.length > 0) {
      const seeds = [];
      if (missingSlugs.includes('return-policy')) {
        seeds.push({
          title_az: 'Geri Qaytarma Qaydaları',
          title_en: 'Return and Exchange Policy',
          title_ru: 'Правила возврата',
          slug: 'return-policy',
          content_az: `<p><strong>RubikShop.az</strong> internet mağazasından alınan hər bir məhsul bizim üçün dəyərlidir. Biz müştərilərimizə yüksək səviyyəli xidmət və keyfiyyətli məhsullar təqdim etməyi hədəfləyirik.</p>

<h3>1. Geri Qaytarma Şərtləri:</h3>
<ul>
  <li>Məhsulu istifadə etmədiyiniz, qutusuna, etiketlərinə və aksesuarlarına xələl gətirmədiyiniz təqdirdə, <strong>14 təqvim günü</strong> müddətində heç bir əlavə ödəniş etmədən tam geri qaytara və ya başqa modelə dəyişə bilərsiniz.</li>
  <li>Professional sürətli Rubik kubları (speedcubing puzzle-ları) və onların aksesuarları yalnız zavod defekti olduğu halda geri qaytarıla və ya dəyişdirilə bilər.</li>
  <li>İstifadə olunmuş, yağlanmış, tənzimlənmiş və ya mexaniki zədə görmüş məhsulların geri qaytarılması qəbul edilmir.</li>
</ul>

<h3>2. Çatdırılma və Geri Qaytarma Xərcləri:</h3>
<ul>
  <li>Əgər geri qaytarma məhsulun zavod qüsuru (defekti) ilə bağlıdırsa, geri qaytarma və ya dəyişdirilmə xərcləri tamamilə RubikShop.az tərəfindən qarşılanır.</li>
  <li>Müştərinin şəxsi seçimi və ya qərar dəyişikliyi ilə bağlı geri qaytarmalarda kuryer xidməti haqqı müştəri tərəfindən ödənilir.</li>
</ul>

<h3>3. Sifarişin Qəbulu və Əlaqə:</h3>
<p>Sifarişləriniz həm veb-saytımız, həm də rəsmi <strong>WhatsApp</strong> və ya <strong>Instagram (@rubikshop.az)</strong> hesablarımız vasitəsilə qəbul edilir. Sual və ya geri qaytarma müraciəti üçün bizimlə dərhal əlaqə saxlaya bilərsiniz.</p>

<p><strong>Əlaqə nömrəsi (WhatsApp):</strong> +994 50 668 49 25<br>
<strong>Instagram:</strong> <a href="https://instagram.com/rubikshop.az" target="_blank">@rubikshop.az</a></p>`,
          content_en: `<p>Every product purchased from <strong>RubikShop.az</strong> is valuable to us. We aim to provide our customers with high-level service and high-quality products.</p>

<h3>1. Return Conditions:</h3>
<ul>
  <li>If you have not used the product and have not damaged its box, labels, and accessories, you can return or exchange it for another model within <strong>14 calendar days</strong> without any additional charge.</li>
  <li>Professional fast Rubik's cubes (speedcubing puzzles) and their accessories can only be returned or exchanged in case of a factory defect.</li>
</ul>`,
          content_ru: `<p>Каждый товар, приобретенный в интернет-магазине <strong>RubikShop.az</strong>, важен для нас. Мы стремимся предоставить нашим клиентам высокий уровень сервиса и качественную продукцию.</p>

<h3>1. Условия возврата:</h3>
<ul>
  <li>Если вы не пользовались товаром и не повредили его коробку, этикетки и аксессуары, вы можете вернуть или обменять его на другую модель в течение <strong>14 календарных дней</strong> без какой-либо дополнительной оплаты.</li>
</ul>`,
          is_published: true
        });
      }
      if (missingSlugs.includes('privacy-policy')) {
        seeds.push({
          title_az: 'Məxfilik Siyasəti',
          title_en: 'Privacy Policy',
          title_ru: 'Политика конфиденциальности',
          slug: 'privacy-policy',
          content_az: `<p><strong>RubikShop.az</strong> olaraq istifadəçilərimizin fərdi məlumatlarının qorunmasına və gizliliyinə böyük önəm veririk. Bu sənəd, saytımızda topladığımız məlumatların hansı məqsədlərlə istifadə olunduğunu izah edir.</p>

<h3>1. Toplanan Məlumatlar:</h3>
<ul>
  <li>Sifariş zamanı daxil etdiyiniz ad, soyad, əlaqə nömrəsi (telefon), çatdırılma ünvanı və sosial media (Instagram) istifadəçi adı kimi məlumatlar qeydə alınır.</li>
  <li>Ödəniş məlumatları (kart məlumatları) bizim sistemlərdə saxlanılmır.</li>
</ul>

<h3>2. Məlumatların İstifadə Məqsədi:</h3>
<ul>
  <li>Sifarişlərin hazırlanması və Azərbaycanda (Bakı daxili və rayonlara) çatdırılması.</li>
  <li>Sifariş və ya çatdırılma ilə bağlı sizinlə WhatsApp və ya Instagram vasitəsilə əlaqə saxlamaq.</li>
</ul>`,
          content_en: `<p>As <strong>RubikShop.az</strong>, we attach great importance to the protection and privacy of our users' personal data.</p>`,
          content_ru: `<p>Мы в <strong>RubikShop.az</strong> придаем большое значение защите и конфиденциальности персональных данных наших пользователей.</p>`,
          is_published: true
        });
      }
      if (missingSlugs.includes('terms-of-service')) {
        seeds.push({
          title_az: 'İstifadə Şərtləri',
          title_en: 'Terms of Service',
          title_ru: 'Условия использования',
          slug: 'terms-of-service',
          content_az: `<p><strong>RubikShop.az</strong> internet mağazasına xoş gəlmisiniz! Bu şərtlər veb-saytımızdan istifadə və məhsul alışı qaydalarını tənzimləyir.</p>

<h3>1. Fəaliyyət Sahəmiz:</h3>
<p>RubikShop.az rəsmi olaraq Azərbaycanda fəaliqqət göstərən, professional Rubik kubları, twisty puzzle-lar, kub yağları və tənzimləmə aksesuarlarının satışı ilə məşğul olan ixtisaslaşmış mağazadır.</p>

<h3>2. Sifariş Qaydaları:</h3>
<ul>
  <li>Müştərilər sayt vasitəsilə sifariş yerləşdirə bilərlər. Sifariş təsdiqi üçün menecerimiz sizinlə WhatsApp və ya zəng vasitəsilə əlaqə saxlayacaqdır.</li>
  <li>Sifarişlər həmçinin rəsmi <strong>Instagram (@rubikshop.az)</strong> və <strong>WhatsApp (+994 50 668 49 25)</strong> üzərindən də birbaşa qəbul edilir.</li>
</ul>`,
          content_en: `<p>Welcome to <strong>RubikShop.az</strong>! These terms govern your use of our website and purchase of products.</p>`,
          content_ru: `<p>Добро пожаловать в <strong>RubikShop.az</strong>! Эти условия регулируют использование нашего веб-сайта и покупку товаров.</p>`,
          is_published: true
        });
      }

      await supabase.from('pages').insert(seeds);
      
      const refetched = await supabase
        .from('pages')
        .select('*')
        .order('title_az', { ascending: true });
      return { success: true, data: refetched.data };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('getCMSPages Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createCMSPage(payload: {
  title_az: string;
  title_en: string;
  title_ru: string;
  slug: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  meta_title_az?: string;
  meta_title_en?: string;
  meta_title_ru?: string;
  meta_description_az?: string;
  meta_description_en?: string;
  meta_description_ru?: string;
  is_published?: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('pages')
      .insert({
        ...payload,
        is_published: payload.is_published ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
  } catch (error: any) {
    console.error('createCMSPage Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateCMSPage(id: string, payload: Partial<{
  title_az: string;
  title_en: string;
  title_ru: string;
  slug: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  meta_title_az: string;
  meta_title_en: string;
  meta_title_ru: string;
  meta_description_az: string;
  meta_description_en: string;
  meta_description_ru: string;
  is_published: boolean;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('pages')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
  } catch (error: any) {
    console.error('updateCMSPage Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteCMSPage(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCMSPage Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// BANNERS ACTIONS
// =========================================================================

export async function getBanners() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getBanners Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createBanner(payload: {
  title_az?: string;
  title_en?: string;
  title_ru?: string;
  subtitle_az?: string;
  subtitle_en?: string;
  subtitle_ru?: string;
  image_url: string;
  link_url?: string;
  location: 'hero' | 'promo' | 'sidebar' | 'footer';
  sort_order?: number;
  is_active?: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('banners')
      .insert({
        ...payload,
        sort_order: payload.sort_order ?? 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
  } catch (error: any) {
    console.error('createBanner Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateBanner(id: string, payload: Partial<{
  title_az: string;
  title_en: string;
  title_ru: string;
  subtitle_az: string;
  subtitle_en: string;
  subtitle_ru: string;
  image_url: string;
  link_url: string;
  location: 'hero' | 'promo' | 'sidebar' | 'footer';
  sort_order: number;
  is_active: boolean;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('banners')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
  } catch (error: any) {
    console.error('updateBanner Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteBanner(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('deleteBanner Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// FAQS ACTIONS
// =========================================================================

export async function getFAQs() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getFAQs Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createFAQ(payload: {
  question_az: string;
  question_en: string;
  question_ru: string;
  answer_az: string;
  answer_en: string;
  answer_ru: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('faqs')
      .insert({
        ...payload,
        sort_order: payload.sort_order ?? 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('createFAQ Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateFAQ(id: string, payload: Partial<{
  question_az: string;
  question_en: string;
  question_ru: string;
  answer_az: string;
  answer_en: string;
  answer_ru: string;
  sort_order: number;
  is_active: boolean;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('faqs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('updateFAQ Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteFAQ(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('deleteFAQ Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// NAVIGATION ITEMS ACTIONS
// =========================================================================

export async function getNavigationItems() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('navigation_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getNavigationItems Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createNavigationItem(payload: {
  label_az: string;
  label_en: string;
  label_ru: string;
  link_url: string;
  location: 'header' | 'footer_col1' | 'footer_col2' | 'footer_col3';
  sort_order?: number;
  is_active?: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('navigation_items')
      .insert({
        ...payload,
        sort_order: payload.sort_order ?? 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('createNavigationItem Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateNavigationItem(id: string, payload: Partial<{
  label_az: string;
  label_en: string;
  label_ru: string;
  link_url: string;
  location: 'header' | 'footer_col1' | 'footer_col2' | 'footer_col3';
  sort_order: number;
  is_active: boolean;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('navigation_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('updateNavigationItem Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteNavigationItem(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('navigation_items').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('deleteNavigationItem Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// BLOG POSTS ACTIONS
// =========================================================================

export async function getBlogPosts() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getBlogPosts Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createBlogPost(payload: {
  title_az: string;
  title_en: string;
  title_ru: string;
  slug: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  featured_image?: string;
  is_published?: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...payload,
        is_published: payload.is_published ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('createBlogPost Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateBlogPost(id: string, payload: Partial<{
  title_az: string;
  title_en: string;
  title_ru: string;
  slug: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  featured_image: string;
  is_published: boolean;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('updateBlogPost Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteBlogPost(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('deleteBlogPost Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// COLLECTIONS ACTIONS
// =========================================================================

export async function getCollections() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('collections')
      .select('*, collection_products(product_id)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getCollections Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createCollection(payload: {
  name_az: string;
  name_en: string;
  name_ru: string;
  slug: string;
  description_az?: string;
  description_en?: string;
  description_ru?: string;
  image_url?: string;
  is_active?: boolean;
  product_ids?: string[];
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { name_az, name_en, name_ru, slug, description_az, description_en, description_ru, image_url, is_active, product_ids } = payload;
    
    const { data: collection, error: collError } = await supabase
      .from('collections')
      .insert({
        name_az,
        name_en,
        name_ru,
        slug,
        description_az,
        description_en,
        description_ru,
        image_url,
        is_active: is_active ?? true
      })
      .select()
      .single();

    if (collError) throw collError;

    if (product_ids && product_ids.length > 0) {
      const mapping = product_ids.map(pid => ({
        collection_id: collection.id,
        product_id: pid
      }));
      const { error: mapError } = await supabase
        .from('collection_products')
        .insert(mapping);
      if (mapError) throw mapError;
    }

    return { success: true, data: collection };
  } catch (error: any) {
    console.error('createCollection Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateCollection(id: string, payload: Partial<{
  name_az: string;
  name_en: string;
  name_ru: string;
  slug: string;
  description_az: string;
  description_en: string;
  description_ru: string;
  image_url: string;
  is_active: boolean;
  product_ids: string[];
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { product_ids, ...details } = payload;

    if (Object.keys(details).length > 0) {
      const { error: collError } = await supabase
        .from('collections')
        .update(details)
        .eq('id', id);
      if (collError) throw collError;
    }

    if (product_ids !== undefined) {
      // Delete existing
      await supabase.from('collection_products').delete().eq('collection_id', id);
      
      if (product_ids.length > 0) {
        const mapping = product_ids.map(pid => ({
          collection_id: id,
          product_id: pid
        }));
        const { error: mapError } = await supabase
          .from('collection_products')
          .insert(mapping);
        if (mapError) throw mapError;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('updateCollection Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteCollection(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('deleteCollection Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// REGISTER UPLOADED FILES
// =========================================================================

export async function registerUploadedFile(payload: {
  name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('files')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('registerUploadedFile Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getOrderDetail(orderId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*, variants(*, products(*))))')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return { success: false, error: 'Sifariş tapılmadı' };

    // Fetch shipment for tracking number
    const { data: shipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    // Map database enterprise schema columns back to expected frontend fields
    const shippingAddressStr = order.shipping_address || '';
    const hasInstagram = shippingAddressStr.includes(' | Instagram: @');
    const deliveryAddress = hasInstagram 
      ? shippingAddressStr.split(' | Instagram: @')[0] 
      : shippingAddressStr;
    const customerInstagram = hasInstagram 
      ? shippingAddressStr.split(' | Instagram: @')[1] 
      : 'Yoxdur';

    const mappedOrder = {
      ...order,
      customer_name: order.full_name,
      customer_phone: order.phone,
      customer_instagram: customerInstagram,
      delivery_address: deliveryAddress,
      delivery_method: deliveryAddress.includes('Metrosu') ? 'Metro' : 'Courier',
      total_amount_azn: Number(order.total),
      checkout_platform: 'whatsapp',
      status: order.shipping_status === 'pending' ? 'pending' : (order.shipping_status === 'delivered' ? 'completed' : 'cancelled'),
      tracking_number: shipment?.tracking_number || '',
      carrier: shipment?.carrier || '',
      order_items: order.order_items?.map((item: any) => ({
        ...item,
        product_title: item.variants?.products?.title_az || 'Məhsul',
        unit_price_azn: Number(item.price_azn),
        subtotal_azn: Number(item.total_azn),
        sku: item.variants?.sku || item.variants?.products?.id || 'SKU-NONE',
        image_url: item.variants?.products?.image_url || 'https://picsum.photos/seed/boxart/200/200'
      })) || []
    };

    // Fetch audit logs for history/notes
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('record_id', orderId)
      .eq('table_name', 'orders')
      .order('created_at', { ascending: false });

    return { success: true, order: mappedOrder, logs: logs || [] };
  } catch (error: any) {
    console.error('getOrderDetail Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateOrderTracking(orderId: string, trackingNumber: string, carrier?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Upsert into shipments
    const { error } = await supabase
      .from('shipments')
      .upsert({
        order_id: orderId,
        tracking_number: trackingNumber || null,
        carrier: carrier || 'post_delivery',
        status: 'shipped'
      }, { onConflict: 'order_id' });

    if (error) throw error;

    // Also write an audit log
    try {
      const { createAuditLog } = await import('@/lib/actions/audit');
      await createAuditLog({
        action: `İzləmə nömrəsi yeniləndi: ${trackingNumber}`,
        table_name: 'orders',
        record_id: orderId,
        new_values: { tracking_number: trackingNumber }
      });
    } catch (auditErr) {
      console.error('Audit logging failed:', auditErr);
    }

    revalidatePath('/[locale]/admin/orders', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('updateOrderTracking Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function addOrderInternalNote(orderId: string, note: string) {
  try {
    if (!note.trim()) return { success: false, error: 'Qeyd boş ola bilməz' };
    
    const { createAuditLog } = await import('@/lib/actions/audit');
    const res = await createAuditLog({
      action: 'Internal Note Added',
      table_name: 'orders',
      record_id: orderId,
      new_values: { note: note }
    });

    if (!res.success) throw new Error(res.error);

    revalidatePath('/[locale]/admin/orders', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('addOrderInternalNote Error:', error.message);
    return { success: false, error: error.message };
  }
}

// =========================================================================
// PRODUCTS MANAGEMENT (ADMIN SERVER ACTIONS)
// =========================================================================

export async function strictSlugify(text: string): Promise<string> {
  if (!text) return '';
  let str = text.toLowerCase();

  // Explicitly map Azerbaijani and special characters
  const charMap: Record<string, string> = {
    'ə': 'e',
    'ı': 'i',
    'ö': 'o',
    'ü': 'u',
    'ğ': 'g',
    'ç': 'c',
    'ş': 's',
    'Ə': 'e',
    'I': 'i',
    'İ': 'i',
    'Ö': 'o',
    'Ü': 'u',
    'Ğ': 'g',
    'Ç': 'c',
    'Ş': 's',
  };

  str = str.replace(/[əıöüğçşƏIİÖÜĞÇŞ]/g, (m) => charMap[m] || m);

  // Strip parentheses, brackets, and special punctuation completely
  str = str.replace(/[\(\)\[\]\{\}\/\\#\?!\.,;:'"<>@$%^&*+=~`]/g, ' ');

  // Keep only alphanumeric and whitespace / hyphens
  str = str.replace(/[^a-z0-9\s-]/g, '');

  // Collapse spaces and multiple hyphens into a single hyphen
  str = str.trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');

  return str;
}

async function resolveUniqueSlug(supabase: any, rawSlug: string, productId?: string) {
  let cleanSlug = await strictSlugify(rawSlug);
  if (!cleanSlug) {
    cleanSlug = `product-${Date.now()}`;
  }

  let slug = cleanSlug;
  let counter = 1;

  while (counter < 100) {
    let query = supabase.from('products').select('id').eq('slug', slug);
    if (productId) {
      query = query.neq('id', productId);
    }

    const { data: existing } = await query.maybeSingle();
    if (!existing) {
      break;
    }
    counter++;
    slug = `${cleanSlug}-${counter}`;
  }

  return slug;
}

function formatGalleryImages(gallery_images: any): string[] {
  if (!gallery_images) return [];
  if (Array.isArray(gallery_images)) {
    return gallery_images.map((img: any) => String(img).trim()).filter(Boolean);
  }
  if (typeof gallery_images === 'string') {
    try {
      const parsed = JSON.parse(gallery_images);
      if (Array.isArray(parsed)) {
        return parsed.map((img: any) => String(img).trim()).filter(Boolean);
      }
    } catch {
      return gallery_images.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function mapVariantsPayload(variants: any[], basePrice: number, productId?: string, productSlug?: string) {
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return [];
  }
  const seenSkus = new Set<string>();
  const slugPrefix = productSlug || (productId ? productId.slice(0, 8) : 'var');

  return variants.map((v: any, idx: number) => {
    const variantPrice = Number(v.price_azn ?? v.price ?? basePrice ?? 0);
    const rawDisc = v.discount_price !== undefined && v.discount_price !== null ? Number(v.discount_price) : (v.compare_at_price_azn !== undefined && v.compare_at_price_azn !== null ? Number(v.compare_at_price_azn) : null);
    const rawComp = v.compare_at_price_azn !== undefined && v.compare_at_price_azn !== null ? Number(v.compare_at_price_azn) : rawDisc;

    let rawSku = v.sku ? String(v.sku).trim() : '';
    if (!rawSku) {
      rawSku = `${slugPrefix}-v${idx + 1}-${Date.now().toString().slice(-4)}`;
    }

    let uniqueSku = rawSku;
    let counter = 1;
    while (seenSkus.has(uniqueSku)) {
      uniqueSku = `${rawSku}-${counter}-${Date.now().toString().slice(-3)}`;
      counter++;
    }
    seenSkus.add(uniqueSku);

    const variantName = v.name || v.name_az || v.title_az || v.title_en || v.title_ru || `Variant ${idx + 1}`;
    const nameAz = v.name_az || v.name || v.title_az || variantName;
    const nameEn = v.name_en || v.name || v.title_en || variantName;
    const nameRu = v.name_ru || v.name || v.title_ru || variantName;
    const titleAz = v.title_az || nameAz;
    const titleEn = v.title_en || nameEn;
    const titleRu = v.title_ru || nameRu;

    const stockQty = Number(v.stock_quantity ?? v.stock ?? 0);

    const item: any = {
      sku: uniqueSku,
      name: variantName,
      name_az: nameAz,
      name_en: nameEn,
      name_ru: nameRu,
      title_az: titleAz,
      title_en: titleEn,
      title_ru: titleRu,
      price_azn: variantPrice,
      price: variantPrice,
      discount_price: rawDisc,
      compare_at_price_azn: rawComp,
      stock: stockQty,
      stock_quantity: stockQty,
      weight_g: v.weight_g !== undefined && v.weight_g !== null ? Number(v.weight_g) : null,
      is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
      image_url: v.image_url ? String(v.image_url).trim() : (v.image ? String(v.image).trim() : null),
    };
    if (productId) {
      item.product_id = productId;
    }
    return item;
  });
}

export async function createProduct(payload: any) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('İcazəsiz giriş (Unauthorized)');
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      throw new Error('Bu əməliyyat üçün admin/manager icazəsi lazımdır');
    }

    const adminSupabase = createAdminSupabaseClient();
    const rawSlug = payload.slug || payload.title_az || payload.title_en || 'product';
    const finalSlug = await resolveUniqueSlug(supabase, rawSlug);
    const safeGallery = formatGalleryImages(payload.gallery_images);
    const basePrice = Number(payload.price_azn || payload.price || 0);

    const insertObj: any = {
      title_az: payload.title_az,
      title_en: payload.title_en,
      title_ru: payload.title_ru,
      description_az: payload.description_az,
      description_en: payload.description_en,
      description_ru: payload.description_ru,
      slug: finalSlug,
      group_slug: payload.group_slug || null,
      variant_name: payload.variant_name || null,
      price_azn: basePrice,
      compare_at_price_azn: payload.compare_at_price_azn,
      brand_id: payload.brand_id,
      is_active: payload.is_active ?? true,
      status: payload.status === 'active' ? 'publish' : (payload.status || 'publish'),
      image_url: payload.image_url,
      video_url: payload.video_url,
      stock_quantity: payload.stock_quantity ?? 0,
      is_featured: payload.is_featured ?? false,
      product_type: payload.product_type ?? 'speedcube',
      tags: payload.tags ?? [],
      gallery_images: safeGallery,
      seo_title: payload.seo_title,
      seo_description: payload.seo_description,
      weight_g: payload.weight_g,
      is_magnetic: payload.is_magnetic ?? false,
      size_mm: payload.size_mm,
      difficulty_level: payload.difficulty_level ?? 'başlanğıc',
      allow_preorder: payload.allow_preorder ?? true,
      preorder_lead_time: payload.preorder_lead_time ?? '14-28 iş günü',
      specs: payload.specs || payload.specs_az || null,
      specs_az: payload.specs_az || payload.specs || null,
      specs_en: payload.specs_en || null,
      specs_ru: payload.specs_ru || null,
    };

    let { data: product, error: prodError } = await supabase
      .from('products')
      .insert(insertObj)
      .select()
      .single();

    if (prodError && (prodError.message?.includes('add_ons') || prodError.code === 'PGRST204')) {
      delete insertObj.add_ons;
      const res = await supabase.from('products').insert(insertObj).select().single();
      product = res.data;
      prodError = res.error;
    }

    if (prodError) throw prodError;

    if (payload.category_ids && payload.category_ids.length > 0) {
      const mappings = payload.category_ids.map((catId: string) => ({
        product_id: product.id,
        category_id: catId,
      }));
      const { error: catError } = await supabase.from('product_categories').insert(mappings);
      if (catError) throw catError;
    }

    const variantsToInsert = mapVariantsPayload(payload.variants || [], basePrice, product.id, product.slug);
    if (variantsToInsert.length > 0) {
      const { error: vErr } = await adminSupabase.from('variants').insert(variantsToInsert);
      if (vErr) console.error('VARIANTS INSERT ERROR (createProduct):', vErr);
      try {
        const { error: pvErr } = await adminSupabase.from('product_variants').insert(variantsToInsert);
        if (pvErr) console.error('PRODUCT_VARIANTS INSERT ERROR (createProduct):', pvErr);
      } catch (e: any) {
        console.error('PRODUCT_VARIANTS EXCEPTION (createProduct):', e?.message || e);
      }
    }

    revalidatePath('/[locale]', 'layout');
    return { success: true, data: product };
  } catch (error: any) {
    console.error('createProduct Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id: string, payload: any) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('İcazəsiz giriş (Unauthorized)');
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      throw new Error('Bu əməliyyat üçün admin/manager icazəsi lazımdır');
    }

    const adminSupabase = createAdminSupabaseClient();
    const {
      id: _id,
      created_at: _created_at,
      updated_at: _updated_at,
      category_ids,
      variants,
      product_variants,
      add_ons,
      services,
      brands,
      categories,
      product_categories,
      ...directFields
    } = payload;

    delete directFields.add_ons;
    delete directFields.services;
    delete directFields.product_variants;
    delete directFields.brands;
    delete directFields.categories;
    delete directFields.product_categories;

    if (directFields.slug || directFields.title_az || directFields.title_en) {
      const rawSlug = directFields.slug || directFields.title_az || directFields.title_en || '';
      if (rawSlug) {
        directFields.slug = await resolveUniqueSlug(supabase, rawSlug, id);
      }
    }

    if (directFields.gallery_images !== undefined) {
      directFields.gallery_images = formatGalleryImages(directFields.gallery_images);
    }

    if (directFields.is_active === undefined) {
      directFields.is_active = true;
    }
    if (!directFields.status || directFields.status === 'active') {
      directFields.status = 'publish';
    }

    const basePrice = Number(directFields.price_azn || directFields.price || 0);

    const { data: product, error: prodError } = await supabase
      .from('products')
      .update(directFields)
      .eq('id', id)
      .select()
      .single();

    if (prodError) throw prodError;

    if (category_ids !== undefined) {
      await supabase.from('product_categories').delete().eq('product_id', id);
      if (category_ids.length > 0) {
        const mappings = category_ids.map((catId: string) => ({
          product_id: id,
          category_id: catId,
        }));
        const { error: catError } = await supabase.from('product_categories').insert(mappings);
        if (catError) throw catError;
      }
    }

    if (variants !== undefined && Array.isArray(variants)) {
      const { error: vDelErr } = await adminSupabase.from('variants').delete().eq('product_id', id);
      if (vDelErr) console.error('VARIANTS DELETE ERROR (updateProduct):', vDelErr);
      try {
        const { error: pvDelErr } = await adminSupabase.from('product_variants').delete().eq('product_id', id);
        if (pvDelErr) console.error('PRODUCT_VARIANTS DELETE ERROR (updateProduct):', pvDelErr);
      } catch (e: any) {
        console.error('PRODUCT_VARIANTS DELETE EXCEPTION (updateProduct):', e?.message || e);
      }

      const variantsToInsert = mapVariantsPayload(variants, basePrice, id, product.slug);
      if (variantsToInsert.length > 0) {
        const { error: vInsErr } = await adminSupabase.from('variants').insert(variantsToInsert);
        if (vInsErr) console.error('VARIANTS INSERT ERROR (updateProduct):', vInsErr);
        try {
          const { error: pvInsErr } = await adminSupabase.from('product_variants').insert(variantsToInsert);
          if (pvInsErr) console.error('PRODUCT_VARIANTS INSERT ERROR (updateProduct):', pvInsErr);
        } catch (e: any) {
          console.error('PRODUCT_VARIANTS INSERT EXCEPTION (updateProduct):', e?.message || e);
        }
      }
    }

    revalidatePath('/[locale]', 'layout');
    return { success: true, data: product };
  } catch (error: any) {
    console.error('updateProduct Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function saveProduct(productId: string | null | undefined, payload: any) {
  if (productId) {
    return updateProduct(productId, payload);
  } else {
    return createProduct(payload);
  }
}

export async function upsertProduct(payload: any, productId?: string) {
  return saveProduct(productId, payload);
}

export async function deleteProduct(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    try {
      const { createAuditLog } = await import('@/lib/actions/audit');
      await createAuditLog({
        action: 'Məhsul silindi',
        table_name: 'products',
        record_id: id,
      });
    } catch {}

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('deleteProduct Error:', error.message);
    return { success: false, error: error.message };
  }
}

// =========================================================================
// BULK IMPORT INFRASTRUCTURE & SERVER ACTIONS
// =========================================================================

export interface BulkImportResult {
  success: boolean;
  count: number;
  skipped: number;
  errors: string[];
}

function toAzSlug(text: string): string {
  if (!text) return '';

  const charMap: Record<string, string> = {
    'İ': 'i',
    'I': 'i',
    'ə': 'e',
    'Ə': 'e',
    'ö': 'o',
    'Ö': 'o',
    'ü': 'u',
    'Ü': 'u',
    'ç': 'c',
    'Ç': 'c',
    'ş': 's',
    'Ş': 's',
    'ğ': 'g',
    'Ğ': 'g',
    'ı': 'i',
  };

  let str = text.replace(/[İIəƏöÖüÜçÇşŞğĞı]/g, (match) => charMap[match] || match);
  str = str.toLowerCase();
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[\(\)\[\]\{\}\/\\#\?!\.,;:'"<>@$%^&*+=~`]/g, ' ');
  str = str.replace(/[^a-z0-9\s-]/g, '');
  str = str.trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');

  return str;
}

export async function bulkImportCategoriesAction(categories: any[]): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: false,
    count: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      result.errors.push('İcazəsiz giriş (Unauthorized)');
      return result;
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      result.errors.push('Daxil edilən məlumat massiv (array) deyil və ya boşdur.');
      return result;
    }

    for (let i = 0; i < categories.length; i++) {
      const item = categories[i];
      const nameAz = (item.name_az || item.name || '').toString().trim();

      if (!nameAz) {
        result.skipped++;
        result.errors.push(`№${i + 1}: Kateqoriya adı daxil edilməyib.`);
        continue;
      }

      const rawSlug = item.slug_az || item.slug || nameAz;
      const baseSlug = toAzSlug(rawSlug) || 'category';

      let finalSlugAz = baseSlug;
      let counter = 1;
      while (true) {
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('slug_az', finalSlugAz)
          .maybeSingle();

        if (!existing) break;
        finalSlugAz = `${baseSlug}-${counter}`;
        counter++;
      }

      const nameEn = (item.name_en || nameAz).trim();
      const nameRu = (item.name_ru || nameAz).trim();
      const slugEn = item.slug_en ? toAzSlug(item.slug_en) : finalSlugAz;
      const slugRu = item.slug_ru ? toAzSlug(item.slug_ru) : finalSlugAz;

      const insertPayload = {
        name_az: nameAz,
        name_en: nameEn,
        name_ru: nameRu,
        slug_az: finalSlugAz,
        slug_en: slugEn,
        slug_ru: slugRu,
        parent_id: item.parent_id || null,
        image_url: item.image_url || null,
      };

      const { error: insertError } = await supabase.from('categories').insert(insertPayload);
      if (insertError) {
        result.skipped++;
        result.errors.push(`"${nameAz}" əlavə edilərkən xəta: ${insertError.message}`);
      } else {
        result.count++;
      }
    }

    revalidatePath('/[locale]/admin/categories', 'layout');
    revalidatePath('/[locale]', 'layout');

    result.success = result.count > 0;
    return result;
  } catch (err: any) {
    result.errors.push(`Server xətası: ${err.message || 'Gözlənilməz xəta'}`);
    return result;
  }
}

export async function bulkImportBrandsAction(brands: any[]): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: false,
    count: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      result.errors.push('İcazəsiz giriş (Unauthorized)');
      return result;
    }

    if (!Array.isArray(brands) || brands.length === 0) {
      result.errors.push('Daxil edilən məlumat massiv (array) deyil və ya boşdur.');
      return result;
    }

    for (let i = 0; i < brands.length; i++) {
      const item = brands[i];
      const name = (item.name || item.title || '').toString().trim();

      if (!name) {
        result.skipped++;
        result.errors.push(`№${i + 1}: Brend adı daxil edilməyib.`);
        continue;
      }

      const rawSlug = item.slug || name;
      const baseSlug = toAzSlug(rawSlug) || 'brand';

      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const { data: existing } = await supabase
          .from('brands')
          .select('id')
          .eq('slug', finalSlug)
          .maybeSingle();

        if (!existing) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const insertPayload = {
        name,
        slug: finalSlug,
        logo_url: item.logo_url || item.logo || null,
        description: item.description || null,
      };

      const { error: insertError } = await supabase.from('brands').insert(insertPayload);
      if (insertError) {
        result.skipped++;
        result.errors.push(`"${name}" əlavə edilərkən xəta: ${insertError.message}`);
      } else {
        result.count++;
      }
    }

    revalidatePath('/[locale]/admin/brands', 'layout');
    revalidatePath('/[locale]', 'layout');

    result.success = result.count > 0;
    return result;
  } catch (err: any) {
    result.errors.push(`Server xətası: ${err.message || 'Gözlənilməz xəta'}`);
    return result;
  }
}

export async function bulkImportProductsAction(products: any[]): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: false,
    count: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      result.errors.push('İcazəsiz giriş (Unauthorized)');
      return result;
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      result.errors.push('Bu əməliyyat üçün admin/manager icazəsi lazımdır');
      return result;
    }

    const adminSupabase = createAdminSupabaseClient();

    if (!Array.isArray(products) || products.length === 0) {
      result.errors.push('Daxil edilən məlumat massiv (array) deyil və ya boşdur.');
      return result;
    }

    // Pre-fetch all categories and brands for trimmed, case-insensitive resolution
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name_az, name_en, name_ru, slug_az, slug_en, slug_ru');

    const { data: allBrands } = await supabase
      .from('brands')
      .select('id, name, slug');

    const findCategoryId = (input: string): string | null => {
      if (!input || !allCategories) return null;
      const norm = input.toString().trim().toLowerCase();
      const slugNorm = toAzSlug(input);

      for (const cat of allCategories) {
        if (cat.id === input) return cat.id;
        if (cat.slug_az?.toLowerCase().trim() === norm || cat.slug_az === slugNorm) return cat.id;
        if (cat.slug_en?.toLowerCase().trim() === norm || cat.slug_en === slugNorm) return cat.id;
        if (cat.slug_ru?.toLowerCase().trim() === norm || cat.slug_ru === slugNorm) return cat.id;
        if (cat.name_az?.toLowerCase().trim() === norm || toAzSlug(cat.name_az) === slugNorm) return cat.id;
        if (cat.name_en?.toLowerCase().trim() === norm || toAzSlug(cat.name_en) === slugNorm) return cat.id;
        if (cat.name_ru?.toLowerCase().trim() === norm || toAzSlug(cat.name_ru) === slugNorm) return cat.id;
      }
      return null;
    };

    const findBrandId = (input: string): string | null => {
      if (!input || !allBrands) return null;
      const rawStr = input.toString().trim();
      const norm = rawStr.toLowerCase();
      const slugNorm = toAzSlug(rawStr);

      for (const b of allBrands) {
        if (b.id === input) return b.id;
        const bSlug = b.slug?.toLowerCase().trim();
        const bName = b.name?.toLowerCase().trim();
        const bAzSlug = b.name ? toAzSlug(b.name) : '';

        if (bSlug && (bSlug === norm || bSlug === slugNorm)) return b.id;
        if (bName && (bName === norm || bAzSlug === slugNorm)) return b.id;
      }
      return null;
    };

    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      try {
        const nameAz = (item.name_az || item.title_az || item.name || item.title || '').toString().trim();
        const rawPrice = item.price ?? item.price_azn;
        const priceVal = rawPrice !== undefined && rawPrice !== null && rawPrice !== ''
          ? parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''))
          : NaN;

        // STRICT VALIDATION: name_az non-empty, price positive number
        if (!nameAz || isNaN(priceVal) || priceVal <= 0) {
          result.skipped++;
          result.errors.push(`Məhsul adı və ya qiyməti yoxdur/yanlışdır: [${nameAz || `№${i + 1}`}]`);
          continue;
        }

        // Map "Endirimdən əvvəlki qiymət" to discount_price
        const rawCompare = item.discount_price ?? item.compare_at_price ?? item.old_price ?? item.compare_at_price_azn;
        const discount_price = rawCompare !== undefined && rawCompare !== null && rawCompare !== ''
          ? parseFloat(String(rawCompare).replace(/[^0-9.]/g, ''))
          : null;

        // Map SEO fields to meta_title and meta_description
        const meta_title = item.meta_title || item.seo_title || `${nameAz || item.name_en || 'Məhsul'} | Rubikshop.az`;
        const meta_description = item.meta_description || item.seo_description || item.description_az || item.description_en || '';

        // Calculate clean slug for upserting
        const rawSlug = item.slug || item.slug_az || nameAz;
        const targetSlug = toAzSlug(rawSlug) || 'product';

        // Automatic Brand resolution
        let brandId = item.brand_id || null;
        if (!brandId) {
          const brandQuery = item.brand_slug || item.brand_name || item.brand;
          if (brandQuery) {
            brandId = findBrandId(String(brandQuery));
          }

          // If not matched by query, check if product title contains any known brand
          if (!brandId && nameAz) {
            for (const b of (allBrands || [])) {
              if (b.name && nameAz.toLowerCase().includes(b.name.toLowerCase())) {
                brandId = b.id;
                break;
              }
            }
          }

          // If still no brandId and brandQuery string is provided, dynamically create new brand
          const rawBrandStr = brandQuery ? String(brandQuery).trim() : '';
          if (!brandId && rawBrandStr && !['OTHER', 'OTHER BRAND', 'UNKNOWN', 'DEFAULTS'].includes(rawBrandStr.toUpperCase())) {
            const brandSlug = toAzSlug(rawBrandStr) || rawBrandStr.toLowerCase();
            const brandName = item.brand_name || (
              rawBrandStr.includes('-')
                ? rawBrandStr.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-')
                : (rawBrandStr.charAt(0).toUpperCase() + rawBrandStr.slice(1))
            );

            const { data: newBrand, error: brandErr } = await supabase
              .from('brands')
              .insert({ name: brandName, slug: brandSlug })
              .select('id, name, slug')
              .single();

            if (brandErr) {
              console.error('BRAND INSERT ERROR (bulkImportProductsAction):', brandErr);
            }

            if (!brandErr && newBrand) {
              brandId = newBrand.id;
              if (allBrands) {
                allBrands.push({ id: newBrand.id, name: newBrand.name, slug: newBrand.slug });
              }
            } else {
              const { data: existingBrand } = await supabase
                .from('brands')
                .select('id, name, slug')
                .or(`slug.eq.${brandSlug},name.ilike.${brandName}`)
                .maybeSingle();

              if (existingBrand) {
                brandId = existingBrand.id;
                if (allBrands) {
                  allBrands.push({ id: existingBrand.id, name: existingBrand.name, slug: existingBrand.slug });
                }
              }
            }
          }
        }

        // Category resolution
        let categoryIds: string[] = [];
        if (Array.isArray(item.category_ids)) {
          categoryIds = item.category_ids;
        } else if (item.category_id) {
          categoryIds = [item.category_id];
        }
        const catQuery = item.category_slug || item.category_name || item.category || item.categories || item.category_slugs;
        if (catQuery) {
          const catList = Array.isArray(catQuery) ? catQuery : String(catQuery).split(',');
          for (const cVal of catList) {
            const matchedId = findCategoryId(String(cVal));
            if (matchedId && !categoryIds.includes(matchedId)) {
              categoryIds.push(matchedId);
            }
          }
        }
        const categoryId = categoryIds.length > 0 ? categoryIds[0] : (item.category_id || null);

        const rawStock = item.stock_quantity ?? item.stock ?? 0;
        const parsedStock = parseInt(String(rawStock).replace(/[^0-9]/g, ''), 10);
        const stock_quantity = isNaN(parsedStock) ? 0 : parsedStock;

        const specsAz = item.specs_az || item.specs || null;
        const specsEn = item.specs_en || null;
        const specsRu = item.specs_ru || null;
        const specsObj = item.specs || item.specs_az || null;

        // Construct primary upsert payload
        const primaryInsertObj: any = {
          name_az: nameAz,
          name_en: item.name_en || nameAz,
          name_ru: item.name_ru || nameAz,
          slug: targetSlug,
          group_slug: item.group_slug || targetSlug,
          variant_name: item.variant_name || null,
          description_az: item.description_az || null,
          description_en: item.description_en || null,
          description_ru: item.description_ru || null,
          price: priceVal,
          discount_price: discount_price,
          stock_quantity: stock_quantity,
          category_id: categoryId,
          brand_id: brandId,
          image_url: item.image_url || null,
          tags: Array.isArray(item.tags) ? item.tags : [],
          product_type: item.product_type || 'speedcube',
          size_mm: item.size_mm ? parseFloat(String(item.size_mm).replace(/[^0-9.]/g, '')) : null,
          weight_g: item.weight_g ? parseFloat(String(item.weight_g).replace(/[^0-9.]/g, '')) : null,
          difficulty_level: item.difficulty_level || null,
          is_magnetic: Boolean(item.is_magnetic),
          status: item.status || 'published',
          meta_title: meta_title,
          meta_description: meta_description,
          specs: specsObj,
          specs_az: specsAz,
          specs_en: specsEn,
          specs_ru: specsRu
        };

        let { data: newProd, error: prodError } = await supabase
          .from('products')
          .upsert(primaryInsertObj, { onConflict: 'slug' })
          .select('id, slug')
          .single();

        if (prodError) {
          console.error('PRIMARY PRODUCT UPSERT ERROR (bulkImportProductsAction):', prodError);
        }

        // Fallback for title_az/price_azn schema if primary column schema differs
        if (prodError && (prodError.message?.includes('column') || prodError.code === 'PGRST204')) {
          const fallbackInsertObj: any = {
            title_az: nameAz,
            title_en: item.name_en || nameAz,
            title_ru: item.name_ru || nameAz,
            slug: targetSlug,
            group_slug: item.group_slug || targetSlug,
            variant_name: item.variant_name || null,
            description_az: item.description_az || null,
            description_en: item.description_en || null,
            description_ru: item.description_ru || null,
            price_azn: priceVal,
            compare_at_price_azn: discount_price,
            stock_quantity: stock_quantity,
            brand_id: brandId,
            image_url: item.image_url || null,
            tags: Array.isArray(item.tags) ? item.tags : [],
            product_type: item.product_type || 'speedcube',
            size_mm: item.size_mm ? parseFloat(String(item.size_mm).replace(/[^0-9.]/g, '')) : null,
            weight_g: item.weight_g ? parseFloat(String(item.weight_g).replace(/[^0-9.]/g, '')) : null,
            difficulty_level: item.difficulty_level || null,
            is_magnetic: Boolean(item.is_magnetic),
            status: item.status === 'published' ? 'publish' : (item.status || 'publish'),
            seo_title: meta_title,
            seo_description: meta_description,
            specs: specsObj,
            specs_az: specsAz,
            specs_en: specsEn,
            specs_ru: specsRu
          };

          const fallbackRes = await supabase
            .from('products')
            .upsert(fallbackInsertObj, { onConflict: 'slug' })
            .select('id, slug')
            .single();

          newProd = fallbackRes.data;
          prodError = fallbackRes.error;
          if (prodError) {
            console.error('FALLBACK PRODUCT UPSERT ERROR (bulkImportProductsAction):', prodError);
          }
        }

        if (prodError) {
          result.skipped++;
          result.errors.push(`"${nameAz}" xətası: ${prodError.message}`);
          continue;
        }

        // Map product to categories if resolved
        if (newProd && categoryIds.length > 0) {
          await supabase.from('product_categories').delete().eq('product_id', newProd.id);
          const mappings = categoryIds.map((cId) => ({
            product_id: newProd.id,
            category_id: cId,
          }));
          const { error: pcErr } = await supabase.from('product_categories').insert(mappings);
          if (pcErr) {
            console.error('PRODUCT_CATEGORIES INSERT ERROR (bulkImportProductsAction):', pcErr);
          }
        }

        // Map variants if provided: 1) Grouped Sibling Products in 'products' table, 2) Legacy variants/product_variants tables
        if (newProd?.id && item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
          const itemGroupSlug = item.group_slug || targetSlug;

          // Insert each variant as a standalone grouped sibling product directly into `products` table
          for (let vIdx = 0; vIdx < item.variants.length; vIdx++) {
            const v = item.variants[vIdx];
            const vName = v.variant_name || v.title_az || v.title || v.name_az || v.name || v.sku || `Variant ${vIdx + 1}`;
            const vSlugRaw = v.slug || `${itemGroupSlug}-${toAzSlug(vName)}`;
            const vPrice = Number(v.price_azn ?? v.price ?? priceVal);
            const vDiscount = v.discount_price ?? v.compare_at_price ?? v.compare_at_price_azn ?? discount_price;
            const vStock = Number(v.stock_quantity ?? v.stock ?? stock_quantity);
            const vImage = v.image_url || v.image || item.image_url || null;

            const siblingSpecsAz = v.specs_az || v.specs || specsAz;
            const siblingSpecsEn = v.specs_en || specsEn;
            const siblingSpecsRu = v.specs_ru || specsRu;
            const siblingSpecsObj = v.specs || v.specs_az || specsObj;

            const siblingInsertObj: any = {
              title_az: `${nameAz} (${vName})`,
              name_az: `${nameAz} (${vName})`,
              slug: vSlugRaw,
              group_slug: itemGroupSlug,
              variant_name: vName,
              description_az: item.description_az || null,
              price: vPrice,
              price_azn: vPrice,
              discount_price: vDiscount,
              compare_at_price_azn: vDiscount,
              stock_quantity: vStock,
              brand_id: brandId,
              category_id: categoryId,
              image_url: vImage,
              sku: v.sku || `${targetSlug}-${vIdx + 1}`,
              is_magnetic: Boolean(v.is_magnetic ?? item.is_magnetic),
              product_type: v.product_type || item.product_type || 'speedcube',
              status: item.status === 'published' ? 'publish' : (item.status || 'publish'),
              is_active: true,
              specs: siblingSpecsObj,
              specs_az: siblingSpecsAz,
              specs_en: siblingSpecsEn,
              specs_ru: siblingSpecsRu
            };

            const { error: siblingErr } = await adminSupabase
              .from('products')
              .upsert(siblingInsertObj, { onConflict: 'slug' });

            if (siblingErr) {
              console.error('SIBLING PRODUCT UPSERT ERROR (bulkImportProductsAction):', siblingErr);
            }
          }

          // Delete existing variants for product from both legacy tables
          const { error: vDelErr } = await adminSupabase.from('variants').delete().eq('product_id', newProd.id);
          if (vDelErr) console.error('VARIANTS DELETE ERROR (bulkImportProductsAction):', vDelErr);
          try {
            const { error: pvDelErr } = await adminSupabase.from('product_variants').delete().eq('product_id', newProd.id);
            if (pvDelErr) console.error('PRODUCT_VARIANTS DELETE ERROR (bulkImportProductsAction):', pvDelErr);
          } catch (e: any) {
            console.error('PRODUCT_VARIANTS DELETE EXCEPTION (bulkImportProductsAction):', e?.message || e);
          }

          const basePrice = Number(item.price_azn || item.price || 0);
          const variantsToInsert = mapVariantsPayload(item.variants, basePrice, newProd.id, newProd.slug);

          if (variantsToInsert.length > 0) {
            const { error: vInsErr } = await adminSupabase.from('variants').insert(variantsToInsert);
            if (vInsErr) console.error('VARIANTS INSERT ERROR (bulkImportProductsAction):', vInsErr);
            try {
              const { error: pvInsErr } = await adminSupabase.from('product_variants').insert(variantsToInsert);
              if (pvInsErr) console.error('PRODUCT_VARIANTS INSERT ERROR (bulkImportProductsAction):', pvInsErr);
            } catch (e: any) {
              console.error('PRODUCT_VARIANTS INSERT EXCEPTION (bulkImportProductsAction):', e?.message || e);
            }
          }

          // Calculate min price among variants and update parent product price if valid
          const validVariantPrices = variantsToInsert
            .map((v: any) => v.price_azn)
            .filter((p: number) => !isNaN(p) && p > 0);

          if (validVariantPrices.length > 0) {
            const minPrice = Math.min(...validVariantPrices);
            await supabase
              .from('products')
              .update({ price: minPrice, price_azn: minPrice })
              .eq('id', newProd.id);
          }
        }

        result.count++;
      } catch (itemErr: any) {
        result.skipped++;
        result.errors.push(`Xəta [№${i + 1}]: ${itemErr?.message || 'Bilinməyən xəta'}`);
      }
    }

    revalidatePath('/[locale]/admin/categories', 'layout');
    revalidatePath('/[locale]/admin/brands', 'layout');
    revalidatePath('/[locale]/admin/products', 'layout');
    revalidatePath('/[locale]', 'layout');

    result.success = result.count > 0;
    return result;
  } catch (err: any) {
    result.errors.push(`Server xətası: ${err.message || 'Gözlənilməz xəta'}`);
    return result;
  }
}


