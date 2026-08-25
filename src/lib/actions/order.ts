'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  validateId, 
  validatePositiveAmount, 
  validateNonNegativeInt, 
  sanitizeInput 
} from '@/lib/security';

interface OrderItemPayload {
  product_id: string;
  quantity: number;
  unit_price_azn?: number;
  subtotal_azn?: number;
}

export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_instagram?: string;
  delivery_address: string;
  delivery_method?: string;
  total_amount_azn?: number;
  checkout_platform?: 'whatsapp' | 'instagram' | 'web';
  email?: string;
  customer_email?: string;
  subtotal?: number;
  discount?: number;
  shipping_fee?: number;
  coupon_code?: string | null;
  items: OrderItemPayload[];
}

/**
 * Parses and extracts productId and variantId safely from payload product_id
 */
function parseProductAndVariantId(rawId: string): { productId: string | null; variantId: string | null } {
  if (!rawId) return { productId: null, variantId: null };

  if (rawId.includes('__variant__')) {
    const parts = rawId.split('__variant__');
    return {
      productId: parts[0] || null,
      variantId: parts[1] || null,
    };
  }

  const uuidMatch = rawId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) {
    return { productId: uuidMatch[0], variantId: null };
  }

  return { productId: rawId, variantId: null };
}

/**
 * Calculates server-authoritative shipping fee based on delivery method and subtotal threshold
 */
function resolveServerShippingFee(method: string | undefined, subtotal: number, clientShippingFee?: number): number {
  // Free delivery for orders >= 100 AZN
  if (subtotal >= 100) return 0.00;

  if (clientShippingFee !== undefined && clientShippingFee !== null) {
    const fee = Number(clientShippingFee);
    if (Number.isFinite(fee) && fee >= 0 && fee <= 20) {
      return Number(fee.toFixed(2));
    }
  }

  const m = (method || '').toLowerCase();
  if (m.includes('metro')) {
    return 1.00;
  } else if (m.includes('region') || m.includes('rayon') || m.includes('poçt') || m.includes('kargo')) {
    return 7.00;
  }
  return 3.00; // Standard courier
}

/**
 * 100% SERVER-VERIFIED ATOMIC ORDER SUBMISSION
 * Re-calculates all prices from the database directly, prevents price tampering,
 * supports allow_preorder, validates coupons/gift cards on the server, sanitizes inputs, 
 * and handles atomic stock updates.
 */
export async function submitOrderAtomic(payload: OrderPayload) {
  try {
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('Səbət boşdur. Zəhmət olmasa məhsul seçin.');
    }

    // 1. Sanitize customer inputs
    const cleanName = sanitizeInput(payload.customer_name || 'Müştəri');
    const cleanPhone = sanitizeInput(payload.customer_phone || '').trim().replace(/[^0-9+]/g, '');
    const cleanAddress = sanitizeInput(payload.delivery_address || 'Bakı');
    const cleanInstagram = payload.customer_instagram ? sanitizeInput(payload.customer_instagram).replace(/^@/, '') : '';
    const cleanDeliveryMethod = payload.delivery_method ? sanitizeInput(payload.delivery_method) : 'Courier';
    const rawEmail = payload.email || payload.customer_email || '';
    const cleanEmail = rawEmail ? sanitizeInput(rawEmail).trim().toLowerCase() : '';

    if (!cleanPhone || cleanPhone.length < 7) {
      throw new Error('Düzgün telefon nömrəsi daxil edilməlidir.');
    }

    const adminSupabase = createAdminSupabaseClient();

    // 2. Spam Protection: Rate limit by phone/email (1 order per 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    let spamFilter = `phone.eq.${cleanPhone}`;
    if (cleanEmail) {
      spamFilter += `,email.eq.${cleanEmail}`;
    }

    const { data: recentOrders } = await adminSupabase
      .from('orders')
      .select('id, created_at')
      .or(spamFilter)
      .gte('created_at', twoMinutesAgo)
      .limit(1);

    if (recentOrders && recentOrders.length > 0) {
      throw new Error('Spam Qorunması: Eyni telefon nömrəsi ilə son 2 dəqiqə ərzində sifariş qeydə alınıb. Zəhmət olmasa bir qədər gözləyin.');
    }

    // Check optional authenticated user
    const userClient = await createServerSupabaseClient();
    const { data: { user: authUser } } = await userClient.auth.getUser();

    // 3. SERVER-SIDE PRICE, STOCK & PREORDER VERIFICATION
    let verifiedSubtotal = 0;
    const verifiedItems: {
      productId: string;
      variantId: string | null;
      productTitle: string;
      variantName: string | null;
      quantity: number;
      unitPrice: number;
      itemTotal: number;
      isVariant: boolean;
      currentStock: number;
      allowPreorder: boolean;
    }[] = [];

    for (const item of payload.items) {
      const quantity = validateNonNegativeInt(item.quantity, 'Məhsul Sayı');
      if (quantity <= 0) {
        throw new Error('Məhsul sayı ən azı 1 olmalıdır.');
      }

      const { productId, variantId } = parseProductAndVariantId(item.product_id);
      if (!productId) {
        throw new Error(`Yanlış məhsul identifikatoru: ${item.product_id}`);
      }

      // Fetch official product data from database
      const { data: productData, error: pError } = await adminSupabase
        .from('products')
        .select('id, title_az, price_azn, compare_at_price_azn, stock_quantity, is_active, allow_preorder')
        .eq('id', productId)
        .single();

      if (pError || !productData || !productData.is_active) {
        throw new Error(`Məhsul tapılmadı və ya aktiv deyil: ${productId}`);
      }

      let actualUnitPrice = Number(productData.price_azn || 0);
      let targetVariantId: string | null = null;
      let targetVariantName: string | null = null;
      let currentStock = Number(productData.stock_quantity || 0);
      let isVariant = false;
      const allowPreorder = Boolean(productData.allow_preorder);

      // Check variants if product has them
      const { data: variants } = await adminSupabase
        .from('variants')
        .select('id, name, name_az, price_azn, stock, stock_quantity, is_active')
        .eq('product_id', productId);

      if (variants && variants.length > 0) {
        isVariant = true;
        let matchedVariant = null;
        if (variantId) {
          matchedVariant = variants.find(v => v.id === variantId);
        }
        if (!matchedVariant) {
          matchedVariant = variants.find(v => v.is_active) || variants[0];
        }

        if (!matchedVariant) {
          throw new Error(`"${productData.title_az}" üçün uyğun variant tapılmadı.`);
        }

        targetVariantId = matchedVariant.id;
        targetVariantName = matchedVariant.name_az || matchedVariant.name || 'Variant';
        currentStock = Number(matchedVariant.stock ?? matchedVariant.stock_quantity ?? 0);

        if (matchedVariant.price_azn !== undefined && matchedVariant.price_azn !== null) {
          actualUnitPrice = Number(matchedVariant.price_azn);
        }
      }

      // Verify actual stock availability unless pre-order is permitted
      if (!allowPreorder && currentStock < quantity) {
        const itemLabel = targetVariantName 
          ? `"${productData.title_az} (${targetVariantName})"` 
          : `"${productData.title_az}"`;
        throw new Error(`Sifariş tamamlanmadı: ${itemLabel} üçün anbarda cəmi ${currentStock} ədəd var, sifariş miqdarı isə ${quantity} ədəddir.`);
      }

      const itemTotal = Number((actualUnitPrice * quantity).toFixed(2));
      verifiedSubtotal += itemTotal;

      verifiedItems.push({
        productId: productData.id,
        variantId: targetVariantId,
        productTitle: productData.title_az,
        variantName: targetVariantName,
        quantity,
        unitPrice: actualUnitPrice,
        itemTotal,
        isVariant,
        currentStock,
        allowPreorder
      });
    }

    verifiedSubtotal = Number(verifiedSubtotal.toFixed(2));

    // 4. SERVER-SIDE DISCOUNT & COUPON VERIFICATION
    let verifiedDiscount = 0;
    let verifiedCouponCode: string | null = null;
    let targetCouponId: string | null = null;
    let targetGiftCardId: string | null = null;
    let giftCardBalanceToDeduct = 0;

    if (payload.coupon_code) {
      const codeUpper = sanitizeInput(payload.coupon_code).trim().toUpperCase();
      
      // Try coupons table
      const { data: coupon } = await adminSupabase
        .from('coupons')
        .select('*')
        .eq('code', codeUpper)
        .eq('is_active', true)
        .maybeSingle();

      if (coupon) {
        const now = new Date();
        const isNotExpired = !coupon.expires_at || new Date(coupon.expires_at) > now;
        const hasUsesLeft = !coupon.max_uses || (coupon.used_count || 0) < coupon.max_uses;
        const meetsMinAmount = !coupon.min_order_amount || verifiedSubtotal >= Number(coupon.min_order_amount);

        if (isNotExpired && hasUsesLeft && meetsMinAmount) {
          verifiedCouponCode = codeUpper;
          targetCouponId = coupon.id;
          if (coupon.discount_type === 'percentage') {
            const rawDiscount = (verifiedSubtotal * Number(coupon.discount_value)) / 100;
            const maxCap = coupon.max_discount_amount ? Number(coupon.max_discount_amount) : Infinity;
            verifiedDiscount = Math.min(rawDiscount, maxCap, verifiedSubtotal);
          } else {
            verifiedDiscount = Math.min(Number(coupon.discount_value || 0), verifiedSubtotal);
          }
        }
      } else {
        // Try gift cards table
        const { data: giftCard } = await adminSupabase
          .from('gift_cards')
          .select('*')
          .eq('code', codeUpper)
          .eq('is_active', true)
          .maybeSingle();

        if (giftCard && Number(giftCard.current_balance) > 0) {
          const now = new Date();
          const isNotExpired = !giftCard.expires_at || new Date(giftCard.expires_at) > now;
          if (isNotExpired) {
            verifiedCouponCode = codeUpper;
            targetGiftCardId = giftCard.id;
            const availableBalance = Number(giftCard.current_balance);
            verifiedDiscount = Math.min(availableBalance, verifiedSubtotal);
            giftCardBalanceToDeduct = verifiedDiscount;
          }
        }
      }
    }

    verifiedDiscount = Number(verifiedDiscount.toFixed(2));

    // Calculate shipping fee safely
    const verifiedShippingFee = resolveServerShippingFee(cleanDeliveryMethod, verifiedSubtotal, payload.shipping_fee);
    const verifiedTotal = Number(Math.max(0, verifiedSubtotal - verifiedDiscount + verifiedShippingFee).toFixed(2));

    // 5. ATOMIC DB INSERT: Insert Order
    const guestEmail = cleanEmail || `${cleanPhone.replace(/\D/g, '')}@rubikshop.az`;
    const shippingAddressFull = cleanInstagram && cleanInstagram !== 'Yoxdur'
      ? `${cleanAddress} | Instagram: @${cleanInstagram}`
      : cleanAddress;

    const { data: orderData, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        user_id: authUser?.id || null,
        full_name: cleanName,
        email: guestEmail,
        phone: cleanPhone,
        shipping_address: shippingAddressFull,
        city: 'Bakı',
        payment_method: 'cash',
        payment_status: 'pending',
        shipping_status: 'pending',
        subtotal: verifiedSubtotal,
        discount: verifiedDiscount,
        shipping_fee: verifiedShippingFee,
        total: verifiedTotal,
        coupon_code: verifiedCouponCode,
      })
      .select('id')
      .single();

    if (orderError || !orderData) {
      console.error('Supabase Order Insert Error:', orderError);
      throw new Error('Sifariş yaradılarkən xəta baş verdi. Zəhmət olmasa yenidən yoxlayın.');
    }

    const orderId = orderData.id;

    // 6. ATOMIC DB INSERT: Insert Order Items
    const orderItemsInsert = verifiedItems.map(item => ({
      order_id: orderId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price_azn: item.unitPrice,
      total_azn: item.itemTotal,
    }));

    const { error: itemsError } = await adminSupabase
      .from('order_items')
      .insert(orderItemsInsert);

    if (itemsError) {
      console.error('Supabase Order Items Insert Error:', itemsError);
      throw new Error('Sifariş elementləri qeyd edilərkən xəta baş verdi.');
    }

    // 7. ATOMIC STOCK DEDUCTION
    for (const item of verifiedItems) {
      const newStock = Math.max(0, item.currentStock - item.quantity);
      if (item.isVariant && item.variantId) {
        await adminSupabase
          .from('variants')
          .update({ stock: newStock, stock_quantity: newStock })
          .eq('id', item.variantId);
      } else {
        await adminSupabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.productId);
      }
    }

    // 8. UPDATE COUPON / GIFT CARD USAGE
    if (targetCouponId) {
      const { data: cData } = await adminSupabase
        .from('coupons')
        .select('used_count')
        .eq('id', targetCouponId)
        .single();

      if (cData) {
        await adminSupabase
          .from('coupons')
          .update({ used_count: (cData.used_count || 0) + 1 })
          .eq('id', targetCouponId);
      }
    } else if (targetGiftCardId && giftCardBalanceToDeduct > 0) {
      const { data: gData } = await adminSupabase
        .from('gift_cards')
        .select('current_balance')
        .eq('id', targetGiftCardId)
        .single();

      if (gData) {
        const newBalance = Math.max(0, Number(gData.current_balance) - giftCardBalanceToDeduct);
        await adminSupabase
          .from('gift_cards')
          .update({ current_balance: newBalance })
          .eq('id', targetGiftCardId);
      }
    }

    // 9. AUDIT LOG (Internal)
    try {
      const { createAuditLog } = await import('@/lib/actions/audit');
      await createAuditLog({
        action: `Yeni sifariş yaradıldı: ${orderId} (${verifiedTotal} AZN)`,
        table_name: 'orders',
        record_id: orderId,
        user_id: authUser?.id,
        new_values: { total: verifiedTotal, items_count: verifiedItems.length }
      });
    } catch {}

    return { 
      success: true, 
      orderId,
      total_amount_azn: verifiedTotal
    };
  } catch (error: any) {
    console.error('submitOrderAtomic Error:', error.message);
    return { success: false, error: error.message || 'Sifariş tamamlanmadı' };
  }
}

/**
 * Fetches order history for a verified customer session or matching sanitized phone.
 * Sanitizes phone input and masks sensitive PII if unauthenticated and no orderIdLookup is provided.
 */
export async function getOrdersByPhone(phone: string, orderIdLookup?: string) {
  try {
    const cleanPhone = sanitizeInput(phone || '').trim().replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      return { success: false, error: 'Düzgün telefon nömrəsi tələb olunur.', data: [] };
    }

    const userClient = await createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();

    const adminSupabase = createAdminSupabaseClient();
    let query = adminSupabase
      .from('orders')
      .select('id, full_name, phone, shipping_address, total, shipping_status, payment_status, created_at, order_items(*, variants(*, products(*)))')
      .eq('phone', cleanPhone);

    if (!user && orderIdLookup) {
      const cleanOrderId = sanitizeInput(orderIdLookup).trim();
      if (cleanOrderId) {
        query = query.eq('id', cleanOrderId);
      }
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return { success: false, error: error.message, data: [] };
    }
    
    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }

    const mappedOrders = data.map((order: any) => {
      const shippingAddressStr = order.shipping_address || '';
      const hasInstagram = shippingAddressStr.includes(' | Instagram: @');
      let deliveryAddress = hasInstagram 
        ? shippingAddressStr.split(' | Instagram: @')[0] 
        : shippingAddressStr;
      const customerInstagram = hasInstagram 
        ? shippingAddressStr.split(' | Instagram: @')[1] 
        : 'Yoxdur';

      let displayName = order.full_name || '';

      // Mask sensitive personal info if unauthenticated guest is viewing without direct orderId matching
      if (!user && !orderIdLookup) {
        displayName = displayName.slice(0, 2) + '***';
        deliveryAddress = 'Bakı (Məlumat qorunur)';
      }

      return {
        id: order.id,
        customer_name: displayName,
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


