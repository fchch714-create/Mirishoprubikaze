// src/lib/actions/commerce.ts

'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =========================================================================
// CARTS ACTIONS
// =========================================================================

export async function getOrCreateCart(userId?: string, sessionId?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Look up existing cart
    let query = supabase.from('carts').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      throw new Error('user_id və ya session_id təqdim edilməlidir.');
    }

    let { data: cart, error } = await query.maybeSingle();
    
    if (error) throw error;

    if (!cart) {
      // Create new cart
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: userId || null,
          session_id: sessionId || null,
        })
        .select()
        .single();

      if (createError) throw createError;
      cart = newCart;
    }

    return { success: true, data: cart };
  } catch (error: any) {
    console.error('getOrCreateCart Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function addToCart(payload: {
  userId?: string;
  sessionId?: string;
  variantId: string;
  quantity: number;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get or create cart
    const cartRes = await getOrCreateCart(payload.userId, payload.sessionId);
    if (!cartRes.success || !cartRes.data) throw new Error(cartRes.error || 'Səbət yaradıla bilmədi.');

    const cartId = cartRes.data.id;

    // Insert or update cart item
    const { data: existingItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('variant_id', payload.variantId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingItem) {
      // Update quantity
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + payload.quantity })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          variant_id: payload.variantId,
          quantity: payload.quantity,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('addToCart Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function removeFromCart(cartItemId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('removeFromCart Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: Math.max(1, quantity) })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('updateCartItemQuantity Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function clearCart(cartId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('clearCart Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// COUPONS ACTIONS
// =========================================================================

export async function applyCoupon(code: string, currentCartTotal: number) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !coupon) {
      return { success: false, error: 'Kupon kodu yanlışdır və ya mövcud deyil.' };
    }

    // Validate expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { success: false, error: 'Kuponun istifadə müddəti bitib.' };
    }

    // Validate usage limits
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { success: false, error: 'Kuponun istifadə limiti dolub.' };
    }

    // Validate minimum spend
    if (currentCartTotal < coupon.min_spend) {
      return { success: false, error: `Bu kupon üçün minimum səbət məbləği ${coupon.min_spend} AZN olmalıdır.` };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (currentCartTotal * coupon.discount_value) / 100;
      if (coupon.max_spend && discountAmount > coupon.max_spend) {
        discountAmount = coupon.max_spend;
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    return { success: true, coupon, discountAmount };
  } catch (error: any) {
    console.error('applyCoupon Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// CHECKOUT & ORDERS ACTIONS
// =========================================================================

export async function createOrder(payload: {
  user_id?: string;
  email: string;
  phone: string;
  full_name: string;
  shipping_address: string;
  city: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon_code?: string;
  items: Array<{
    variant_id: string;
    quantity: number;
    price_azn: number;
  }>;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. Insert Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: payload.user_id || null,
        email: payload.email,
        phone: payload.phone,
        full_name: payload.full_name,
        shipping_address: payload.shipping_address,
        city: payload.city,
        payment_method: payload.payment_method,
        payment_status: payload.payment_method === 'cash' ? 'pending' : 'pending',
        shipping_status: 'pending',
        subtotal: payload.subtotal,
        discount: payload.discount,
        shipping_fee: payload.shipping_fee,
        total: payload.total,
        coupon_code: payload.coupon_code || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insert Order Items
    const orderItems = payload.items.map((item) => ({
      order_id: order.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price_azn: item.price_azn,
      total_azn: item.price_azn * item.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    // 3. Update coupon count if any used
    if (payload.coupon_code) {
      const { data: coupon } = await supabase.from('coupons').select('id, used_count').eq('code', payload.coupon_code).single();
      if (coupon) {
        await supabase.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id);
      }
    }

    revalidatePath('/[locale]', 'layout');
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error('createOrder Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, variants(*, products(*))))')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getOrderDetails Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// PAYMENTS ACTIONS
// =========================================================================

export async function processPayment(payload: {
  order_id: string;
  payment_method: string;
  amount: number;
  transaction_id?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();

    // Insert payment
    const { data: payment, error: payError } = await supabase
      .from('payments')
      .insert({
        order_id: payload.order_id,
        payment_method: payload.payment_method,
        transaction_id: payload.transaction_id || null,
        status: 'completed',
        amount: payload.amount,
      })
      .select()
      .single();

    if (payError) throw payError;

    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', payload.order_id);

    if (orderError) throw orderError;

    revalidatePath('/[locale]', 'layout');
    return { success: true, payment };
  } catch (error: any) {
    console.error('processPayment Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// WISHLISTS ACTIONS
// =========================================================================

export async function getWishlist(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, variants(*, products(*))')
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getWishlist Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function toggleWishlistItem(userId: string, variantId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: existing, error: checkError } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('variant_id', variantId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Remove
      const { error } = await supabase.from('wishlists').delete().eq('id', existing.id);
      if (error) throw error;
      return { success: true, wishlisted: false };
    } else {
      // Add
      const { error } = await supabase.from('wishlists').insert({ user_id: userId, variant_id: variantId });
      if (error) throw error;
      return { success: true, wishlisted: true };
    }
  } catch (error: any) {
    console.error('toggleWishlistItem Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// COMPARE ACTIONS
// =========================================================================

export async function getCompareList(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('compare_lists')
      .select('*, products(*, brands(*))')
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getCompareList Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function toggleCompareListItem(userId: string, productId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: existing, error: checkError } = await supabase
      .from('compare_lists')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Remove
      const { error } = await supabase.from('compare_lists').delete().eq('id', existing.id);
      if (error) throw error;
      return { success: true, compared: false };
    } else {
      // Add
      const { error } = await supabase.from('compare_lists').insert({ user_id: userId, product_id: productId });
      if (error) throw error;
      return { success: true, compared: true };
    }
  } catch (error: any) {
    console.error('toggleCompareListItem Error:', error.message);
    return { success: false, error: error.message };
  }
}
