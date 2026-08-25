'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  sanitizeInput, 
  validatePositiveAmount, 
  validateNonNegativeInt, 
  validateId,
  requireStaff, 
  requireAdmin 
} from '@/lib/security';
import { revalidatePath } from 'next/cache';

export interface CouponData {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend?: number;
  max_spend?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count?: number;
  expires_at?: string | null;
  is_active?: boolean;
}

// 1. Validate Coupon (Used in public checkout/cart)
export async function validateCoupon(code: string, cartTotal: number) {
  try {
    const cleanCode = sanitizeInput(code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Kupon kodu daxil edilməyib.' };
    }

    const cleanCartTotal = Number(cartTotal);
    if (!Number.isFinite(cleanCartTotal) || cleanCartTotal < 0) {
      return { success: false, error: 'Səbət məbləği düzgün deyil.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    
    const { data: coupon, error } = await adminSupabase
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

    // Check min spend (min_spend or min_order_amount)
    const minRequired = Number(coupon.min_spend ?? coupon.min_order_amount ?? 0);
    if (minRequired > 0 && cleanCartTotal < minRequired) {
      return { success: false, error: `Bu kupon üçün minimum sifariş məbləği ${minRequired} AZN olmalıdır.` };
    }

    // Check max spend if set
    if (coupon.max_spend && cleanCartTotal > Number(coupon.max_spend)) {
      return { success: false, error: `Bu kupon maksimum ${coupon.max_spend} AZN-dək sifarişlərdə keçərlidir.` };
    }

    return { 
      success: true, 
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type, // 'percentage' | 'fixed'
        discount_value: Number(coupon.discount_value),
        max_discount_amount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : undefined
      } 
    };
  } catch (error: any) {
    console.error('validateCoupon Error:', error.message);
    return { success: false, error: 'Kupon yoxlanılarkən xəta baş verdi.' };
  }
}

// 2. Fetch Coupons (Requires Staff or Admin)
export async function getCoupons() {
  try {
    const { user, profile } = await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
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

// 3. Create Coupon (Requires Admin Privilege)
export async function createCoupon(data: CouponData) {
  try {
    const { user } = await requireAdmin();
    const cleanCode = sanitizeInput(data.code || '').trim().toUpperCase();
    if (!cleanCode) throw new Error('Kupon kodu boş ola bilməz.');

    let discountVal = validatePositiveAmount(data.discount_value, 'Endirim Dəyəri');
    const discountType = data.discount_type === 'percentage' ? 'percentage' : 'fixed';

    if (discountType === 'percentage' && discountVal > 100) {
      throw new Error('Faiz endirimi 100%-dən çox ola bilməz.');
    }

    const adminSupabase = createAdminSupabaseClient();
    
    const { data: inserted, error } = await adminSupabase
      .from('coupons')
      .insert([{
        code: cleanCode,
        discount_type: discountType,
        discount_value: discountVal,
        min_spend: data.min_spend ? Number(data.min_spend) : 0,
        max_spend: data.max_spend ? Number(data.max_spend) : null,
        max_discount_amount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
        usage_limit: data.usage_limit ? validateNonNegativeInt(data.usage_limit, 'İstifadə Limiti') : null,
        expires_at: data.expires_at || null,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
        used_count: 0
      }])
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'create_coupon',
      entity_type: 'coupon',
      entity_id: inserted.id,
      details: { code: cleanCode, discount_type: discountType, discount_value: discountVal }
    }]);

    revalidatePath('/[locale]/admin/marketing/coupons', 'page');
    return { success: true, coupon: inserted };
  } catch (error: any) {
    console.error('createCoupon Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 4. Update Coupon (Requires Admin Privilege)
export async function updateCoupon(id: string, data: Partial<CouponData>) {
  try {
    const { user } = await requireAdmin();
    const cleanId = validateId(id, 'Kupon ID');
    
    const updateData: any = {};
    if (data.code !== undefined) {
      updateData.code = sanitizeInput(data.code).trim().toUpperCase();
      if (!updateData.code) throw new Error('Kupon kodu boş ola bilməz.');
    }
    if (data.discount_type !== undefined) {
      updateData.discount_type = data.discount_type === 'percentage' ? 'percentage' : 'fixed';
    }
    if (data.discount_value !== undefined) {
      updateData.discount_value = validatePositiveAmount(data.discount_value, 'Endirim Dəyəri');
      if (updateData.discount_type === 'percentage' && updateData.discount_value > 100) {
        throw new Error('Faiz endirimi 100%-dən çox ola bilməz.');
      }
    }
    if (data.min_spend !== undefined) updateData.min_spend = Number(data.min_spend) || 0;
    if (data.max_spend !== undefined) updateData.max_spend = data.max_spend ? Number(data.max_spend) : null;
    if (data.max_discount_amount !== undefined) updateData.max_discount_amount = data.max_discount_amount ? Number(data.max_discount_amount) : null;
    if (data.usage_limit !== undefined) {
      updateData.usage_limit = data.usage_limit ? validateNonNegativeInt(data.usage_limit, 'İstifadə Limiti') : null;
    }
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at || null;
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

    const adminSupabase = createAdminSupabaseClient();

    const { data: updated, error } = await adminSupabase
      .from('coupons')
      .update(updateData)
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'update_coupon',
      entity_type: 'coupon',
      entity_id: cleanId,
      details: updateData
    }]);

    revalidatePath('/[locale]/admin/marketing/coupons', 'page');
    return { success: true, coupon: updated };
  } catch (error: any) {
    console.error('updateCoupon Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 5. Delete Coupon (Requires Admin Privilege)
export async function deleteCoupon(id: string) {
  try {
    const { user } = await requireAdmin();
    const cleanId = validateId(id, 'Kupon ID');
    const adminSupabase = createAdminSupabaseClient();
    
    const { error } = await adminSupabase
      .from('coupons')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;

    // Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'delete_coupon',
      entity_type: 'coupon',
      entity_id: cleanId,
      details: { deleted_at: new Date().toISOString() }
    }]);

    revalidatePath('/[locale]/admin/marketing/coupons', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCoupon Error:', error.message);
    return { success: false, error: error.message };
  }
}

