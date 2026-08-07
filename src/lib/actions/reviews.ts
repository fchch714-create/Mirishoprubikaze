'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProductReviews(productId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    let { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback if profiles table relationship is missing
      const fallback = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (fallback.error) {
        console.error('getProductReviews Error:', error.message);
        return { success: false, data: [] };
      }
      data = fallback.data;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('getProductReviews Error:', error.message);
    return { success: false, data: [] };
  }
}

export async function addProductReview(productId: string, rating: number, comment: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'İstifadəçi daxil olmayıb. Rəy yazmaq üçün daxil olun.' };
    }

    const { error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        product_id: productId,
        rating,
        comment,
      });

    if (error) throw error;
    
    revalidatePath('/[locale]/product/[slug]', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('addProductReview Error:', error.message);
    return { success: false, error: error.message };
  }
}
