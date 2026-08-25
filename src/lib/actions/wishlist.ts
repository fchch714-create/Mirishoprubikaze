'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  requireAuth, 
  validateId, 
  getUserRole 
} from '@/lib/security';
import { revalidatePath } from 'next/cache';

/**
 * Get Wishlist for a given user.
 * IDOR Protection: Verifies that caller is either the account owner or staff.
 */
export async function getWishlist(userId?: string) {
  try {
    const authUser = await requireAuth();
    const targetUserId = userId ? validateId(userId, 'İstifadəçi ID') : authUser.id;

    // IDOR Check
    if (targetUserId !== authUser.id) {
      const role = await getUserRole(authUser.id);
      if (role !== 'admin' && role !== 'manager') {
        throw new Error('Səlahiyyətsiz giriş: Yalnız öz istək siyahınıza baxa bilərsiniz.');
      }
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('wishlists')
      .select('*, products(*)')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getWishlist Error:', error.message);
    return { success: false, data: [], error: error.message || 'İstək siyahısı yüklənmədi' };
  }
}

/**
 * Toggle product in customer wishlist.
 * Security: Requires auth, validates product ID and checks product existence in DB.
 */
export async function toggleWishlist(productId: string) {
  try {
    const cleanProdId = validateId(productId, 'Məhsul ID');
    const authUser = await requireAuth();
    const adminSupabase = createAdminSupabaseClient();

    // Verify product exists
    const { data: product, error: prodErr } = await adminSupabase
      .from('products')
      .select('id')
      .eq('id', cleanProdId)
      .maybeSingle();

    if (prodErr || !product) {
      return { success: false, error: 'Məhsul tapılmadı.' };
    }

    // Check if already in wishlist
    const { data: existing, error: checkError } = await adminSupabase
      .from('wishlists')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('product_id', cleanProdId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Remove from wishlist
      const { error: delError } = await adminSupabase
        .from('wishlists')
        .delete()
        .eq('id', existing.id);

      if (delError) throw delError;

      revalidatePath('/[locale]/wishlist', 'page');
      revalidatePath('/[locale]/product/[slug]', 'page');
      return { success: true, wishlisted: false };
    } else {
      // Add to wishlist
      const { error: insError } = await adminSupabase
        .from('wishlists')
        .insert({ 
          user_id: authUser.id, 
          product_id: cleanProdId,
          created_at: new Date().toISOString()
        });

      if (insError) throw insError;

      revalidatePath('/[locale]/wishlist', 'page');
      revalidatePath('/[locale]/product/[slug]', 'page');
      return { success: true, wishlisted: true };
    }
  } catch (error: any) {
    console.error('toggleWishlist Error:', error.message);
    return { success: false, error: error.message || 'İstək siyahısı dəyişdirilərkən xəta baş verdi' };
  }
}

/**
 * Clear all items from caller's wishlist.
 */
export async function clearWishlistAction() {
  try {
    const authUser = await requireAuth();
    const adminSupabase = createAdminSupabaseClient();

    const { error } = await adminSupabase
      .from('wishlists')
      .delete()
      .eq('user_id', authUser.id);

    if (error) throw error;

    revalidatePath('/[locale]/wishlist', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('clearWishlistAction Error:', error.message);
    return { success: false, error: error.message || 'İstək siyahısı təmizlənərkən xəta baş verdi' };
  }
}
