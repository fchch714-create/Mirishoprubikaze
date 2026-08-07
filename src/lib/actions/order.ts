'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npqecrxvllvuoxaybnoq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required but is missing! Please configure it in your environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface OrderItemPayload {
  product_id: string;
  quantity: number;
  unit_price_azn: number;
  subtotal_azn: number;
}

export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_instagram: string;
  delivery_address: string;
  delivery_method: string;
  total_amount_azn: number;
  checkout_platform: 'whatsapp' | 'instagram';
  email?: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  coupon_code?: string | null;
  items: OrderItemPayload[];
}

export async function submitOrderAtomic(payload: OrderPayload) {
  try {
    // Spam Protection v3: 5-minute rate-limiting check by phone number or email
    const cleanPhone = payload.customer_phone.trim();
    const cleanEmail = payload.email?.trim().toLowerCase() || '';
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    let spamFilter = `customer_phone.eq.${cleanPhone}`;
    if (cleanEmail) {
      spamFilter += `,email.eq.${cleanEmail}`;
    }

    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('id, created_at')
      .or(spamFilter)
      .gte('created_at', fiveMinutesAgo)
      .limit(1);

    if (recentOrders && recentOrders.length > 0) {
      throw new Error('Spam Qorunması: Eyni telefon nömrəsi və ya email ilə son 5 dəqiqə ərzində təkrar sifariş qeydə alınıb. Zəhmət olmasa 5 dəqiqə gözləyib yenidən cəhd edin.');
    }

    // 0. Validate stock quantity before placing the order
    for (const item of payload.items) {
      let productId = '';
      let variantId = '';

      if (item.product_id.includes('__variant__')) {
        const parts = item.product_id.split('__variant__');
        productId = parts[0];
        variantId = parts[1];
      } else {
        const uuidMatch = item.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch) {
          productId = uuidMatch[0];
        }
      }

      if (productId) {
        // Check if there are variants for this product
        const { data: productVariants } = await supabaseAdmin
          .from('variants')
          .select('*')
          .eq('product_id', productId);

        const hasVariants = productVariants && productVariants.length > 0;

        if (hasVariants) {
          // It's a product with variants! Find the specific variant to check
          let targetVariant = null;
          if (variantId) {
            targetVariant = productVariants.find(v => v.id === variantId);
          }
          if (!targetVariant) {
            // Fallback: pick the first active variant
            targetVariant = productVariants.find(v => v.is_active) || productVariants[0];
          }

          if (targetVariant) {
            if (targetVariant.stock < item.quantity) {
              const { data: productData } = await supabaseAdmin
                .from('products')
                .select('title_az')
                .eq('id', productId)
                .single();
              const pName = productData?.title_az || 'Məhsul';
              throw new Error(`Sifariş tamamlanmadı: "${pName} (${targetVariant.name || 'Seçilmiş Variant'})" variantının mövcud stoku (${targetVariant.stock} ədəd) sifariş etmək istədiyiniz miqdardan (${item.quantity} ədəd) azdır.`);
            }
          }
        } else {
          // It's a product without variants (simple product)
          const { data: productData, error: productError } = await supabaseAdmin
            .from('products')
            .select('title_az, stock_quantity')
            .eq('id', productId)
            .single();

          if (!productError && productData) {
            if (productData.stock_quantity < item.quantity) {
              throw new Error(`Sifariş tamamlanmadı: "${productData.title_az}" məhsulunun mövcud stoku (${productData.stock_quantity} ədəd) sifariş etmək istədiyiniz miqdardan (${item.quantity} ədəd) azdır.`);
            }
          }
        }
      }
    }

    // 1. Insert into orders table using active enterprise schema columns
    const formattedPhone = payload.customer_phone;
    const guestEmail = payload.email || `${formattedPhone.replace(/\D/g, '')}@rubikshop.az`;

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        full_name: payload.customer_name,
        email: guestEmail,
        phone: formattedPhone,
        shipping_address: payload.customer_instagram && payload.customer_instagram !== 'Yoxdur'
          ? `${payload.delivery_address} | Instagram: @${payload.customer_instagram}`
          : payload.delivery_address,
        city: 'Baku',
        payment_method: 'cash',
        payment_status: 'pending',
        shipping_status: 'pending',
        subtotal: payload.subtotal,
        discount: payload.discount,
        shipping_fee: payload.shipping_fee,
        total: payload.total_amount_azn,
        coupon_code: payload.coupon_code || null
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Supabase Order Insert Error:', orderError);
      throw new Error(orderError.message);
    }

    const orderId = orderData.id;

    // 2. Insert into order_items table querying active variant IDs
    const orderItems = [];
    for (const item of payload.items) {
      let productId = null;
      let variantId = null;

      if (item.product_id.includes('__variant__')) {
        const parts = item.product_id.split('__variant__');
        productId = parts[0];
        variantId = parts[1];
      } else {
        const uuidMatch = item.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch) {
          productId = uuidMatch[0];
        }
      }

      if (productId && !variantId) {
        // Query the first active variant from variants table
        const { data: variantData } = await supabaseAdmin
          .from('variants')
          .select('id')
          .eq('product_id', productId)
          .eq('is_active', true)
          .limit(1);

        if (variantData && variantData.length > 0) {
          variantId = variantData[0].id;
        } else {
          // Fallback: try any variant regardless of is_active
          const { data: anyVariantData } = await supabaseAdmin
            .from('variants')
            .select('id')
            .eq('product_id', productId)
            .limit(1);
            
          if (anyVariantData && anyVariantData.length > 0) {
            variantId = anyVariantData[0].id;
          }
        }
      }

      orderItems.push({
        order_id: orderId,
        variant_id: variantId,
        quantity: item.quantity,
        price_azn: item.unit_price_azn,
        total_azn: item.subtotal_azn
      });
    }

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Supabase Order Items Insert Error:', itemsError);
      throw new Error(itemsError.message);
    }

    // 3. Automatically decrease stock quantity for ordered products or variants
    for (const item of payload.items) {
      let productId = '';
      let variantId = '';

      if (item.product_id.includes('__variant__')) {
        const parts = item.product_id.split('__variant__');
        productId = parts[0];
        variantId = parts[1];
      } else {
        const uuidMatch = item.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch) {
          productId = uuidMatch[0];
        }
      }

      if (productId) {
        // Check if there are variants for this product
        const { data: productVariants } = await supabaseAdmin
          .from('variants')
          .select('*')
          .eq('product_id', productId);

        const hasVariants = productVariants && productVariants.length > 0;

        if (hasVariants) {
          // Decrease variant stock
          let targetVariant = null;
          if (variantId) {
            targetVariant = productVariants.find(v => v.id === variantId);
          }
          if (!targetVariant) {
            targetVariant = productVariants.find(v => v.is_active) || productVariants[0];
          }

          if (targetVariant) {
            const newStock = Math.max(0, targetVariant.stock - item.quantity);
            await supabaseAdmin
              .from('variants')
              .update({ stock: newStock })
              .eq('id', targetVariant.id);
          }
        } else {
          // Simple product - decrease products.stock_quantity
          const { data: productData } = await supabaseAdmin
            .from('products')
            .select('stock_quantity')
            .eq('id', productId)
            .single();

          if (productData) {
            const newStock = Math.max(0, productData.stock_quantity - item.quantity);
            await supabaseAdmin
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', productId);
          }
        }
      }
    }

    // 4. Update coupon usage or deduct gift card balance
    if (payload.coupon_code) {
      const codeUpper = payload.coupon_code.trim().toUpperCase();
      
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', codeUpper)
        .maybeSingle();

      if (coupon) {
        await supabaseAdmin
          .from('coupons')
          .update({ used_count: (coupon.used_count || 0) + 1 })
          .eq('id', coupon.id);
      } else {
        const { data: giftCard } = await supabaseAdmin
          .from('gift_cards')
          .select('*')
          .eq('code', codeUpper)
          .maybeSingle();

        if (giftCard) {
          const appliedDiscount = Number(payload.discount || 0);
          const newBalance = Math.max(0, Number(giftCard.current_balance) - appliedDiscount);
          await supabaseAdmin
            .from('gift_cards')
            .update({ current_balance: newBalance })
            .eq('id', giftCard.id);
        }
      }
    }

    return { success: true, orderId: orderId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOrdersByPhone(phone: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*, variants(*, products(*))))')
      .eq('phone', phone)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getOrdersByPhone direct table fallback:', error.message);
      return { success: false, error: error.message, data: [] };
    }
    
    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }

    // Map database enterprise schema columns back to expected frontend fields
    const mappedOrders = data.map((order: any) => {
      const shippingAddressStr = order.shipping_address || '';
      const hasInstagram = shippingAddressStr.includes(' | Instagram: @');
      const deliveryAddress = hasInstagram 
        ? shippingAddressStr.split(' | Instagram: @')[0] 
        : shippingAddressStr;
      const customerInstagram = hasInstagram 
        ? shippingAddressStr.split(' | Instagram: @')[1] 
        : 'Yoxdur';

      return {
        id: order.id,
        customer_name: order.full_name,
        customer_phone: order.phone,
        customer_instagram: customerInstagram,
        delivery_address: deliveryAddress,
        delivery_method: deliveryAddress.includes('Metrosu') ? 'Metro' : 'Courier',
        total_amount_azn: Number(order.total),
        checkout_platform: 'whatsapp',
        status: order.shipping_status === 'pending' ? 'pending' : (order.shipping_status === 'delivered' ? 'completed' : 'cancelled'),
        created_at: order.created_at,
        order_items: order.order_items?.map((item: any) => ({
          id: item.id,
          product_title: item.variants?.products?.title_az || 'Məhsul',
          quantity: item.quantity,
          unit_price_azn: Number(item.price_azn),
          subtotal_azn: Number(item.total_azn),
          image_url: item.variants?.products?.image_url || 'https://picsum.photos/seed/boxart/200/200'
        })) || []
      };
    });

    return { success: true, data: mappedOrders };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

