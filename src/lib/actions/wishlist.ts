'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getWishlist(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, products(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getWishlist Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function toggleWishlist(productId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'İstifadəçi daxil olmayıb.' };
    }

    const { data: existing, error: checkError } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Remove
      const { error } = await supabase.from('wishlists').delete().eq('id', existing.id);
      if (error) throw error;
      revalidatePath('/', 'layout');
      return { success: true, wishlisted: false };
    } else {
      // Add
      const { error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      revalidatePath('/', 'layout');
      return { success: true, wishlisted: true };
    }
  } catch (error: any) {
    console.error('toggleWishlist Error:', error.message);
    return { success: false, error: error.message };
  }
}
