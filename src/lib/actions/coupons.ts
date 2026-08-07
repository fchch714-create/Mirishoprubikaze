'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CouponData {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend?: number;
  max_spend?: number;
  usage_limit?: number;
  used_count?: number;
  expires_at?: string | null;
  is_active?: boolean;
}

// 1. Validate Coupon (Used in checkout/cart)
export async function validateCoupon(code: string, cartTotal: number) {
  try {
    const supabase = await createServerSupabaseClient();
    const cleanCode = code.trim().toUpperCase();
    
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    
    if (!coupon) {
      return { success: false, error: 'Kupon kodu tapılmadı və ya aktiv deyil.' };
    }

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { success: false, error: 'Bu kuponun vaxtı bitib.' };
    }

    // Check usage limits (uses used_count in DB)
    if (coupon.usage_limit && coupon.used_count && coupon.used_count >= coupon.usage_limit) {
      return { success: false, error: 'Bu kupon artıq limitə çatıb.' };
    }

    // Check min spend
    if (coupon.min_spend && cartTotal < Number(coupon.min_spend)) {
      return { success: false, error: `Bu kupon üçün minimum sifariş məbləği ${coupon.min_spend} AZN olmalıdır.` };
    }

    return { 
      success: true, 
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type, // 'percentage' | 'fixed'
        discount_value: Number(coupon.discount_value)
      } 
    };
  } catch (error: any) {
    console.error('validateCoupon Error:', error.message);
    return { success: false, error: 'Kupon yoxlanılarkən xəta baş verdi.' };
  }
}

// 2. Fetch Coupons
export async function getCoupons() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, coupons: data || [] };
  } catch (error: any) {
    console.error('getCoupons Error:', error.message);
    return { success: false, coupons: [], error: error.message };
  }
}

// 3. Create Coupon
export async function createCoupon(data: CouponData) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: inserted, error } = await supabase
      .from('coupons')
      .insert([{
        code: data.code.trim().toUpperCase(),
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_spend: data.min_spend || 0,
        max_spend: data.max_spend || null,
        usage_limit: data.usage_limit || null,
        expires_at: data.expires_at || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        used_count: 0
      }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/coupons', 'page');
    return { success: true, coupon: inserted };
  } catch (error: any) {
    console.error('createCoupon Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 4. Update Coupon
export async function updateCoupon(id: string, data: Partial<CouponData>) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const updateData: any = { ...data };
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();

    const { data: updated, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/coupons', 'page');
    return { success: true, coupon: updated };
  } catch (error: any) {
    console.error('updateCoupon Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 5. Delete Coupon
export async function deleteCoupon(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/coupons', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCoupon Error:', error.message);
    return { success: false, error: error.message };
  }
}
