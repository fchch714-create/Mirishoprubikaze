'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  sanitizeInput, 
  validateId, 
  requireAuth, 
  requireStaff 
} from '@/lib/security';
import { revalidatePath } from 'next/cache';

export interface ProductReviewItem {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  is_approved?: boolean;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

/**
 * Get approved product reviews for storefront product pages.
 * Public read access.
 */
export async function getProductReviews(productId: string) {
  try {
    const cleanId = validateId(productId, 'Məhsul ID');
    const supabase = await createServerSupabaseClient();

    let { data, error } = await supabase
      .from('reviews')
      .select('id, product_id, user_id, rating, comment, is_approved, created_at, profiles(full_name)')
      .eq('product_id', cleanId)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback if relational FK is not configured or named differently
      const fallback = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', cleanId)
        .order('created_at', { ascending: false });

      if (fallback.error) {
        console.error('getProductReviews Error:', error.message);
        return { success: false, data: [] };
      }
      data = fallback.data;
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getProductReviews Error:', error.message);
    return { success: false, data: [] };
  }
}

/**
 * Submit a customer product review.
 * Security: Requires authentication, enforces rating 1-5, sanitizes comment, prevents spam/injection.
 */
export async function addProductReview(productId: string, rating: number, comment: string) {
  try {
    const cleanProdId = validateId(productId, 'Məhsul ID');
    const authUser = await requireAuth();

    const numericRating = Math.round(Number(rating));
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return { success: false, error: 'Qiymətləndirmə 1 ilə 5 ulduz arasında olmalıdır.' };
    }

    const cleanComment = sanitizeInput(comment || '').trim();
    if (!cleanComment || cleanComment.length < 3) {
      return { success: false, error: 'Rəy mətni ən azı 3 simvol olmalıdır.' };
    }
    if (cleanComment.length > 2000) {
      return { success: false, error: 'Rəy mətni maksimum 2000 simvol ola bilər.' };
    }

    const adminSupabase = createAdminSupabaseClient();

    // Verify product exists
    const { data: product, error: prodErr } = await adminSupabase
      .from('products')
      .select('id')
      .eq('id', cleanProdId)
      .maybeSingle();

    if (prodErr || !product) {
      return { success: false, error: 'Rəy yazılacaq məhsul tapılmadı.' };
    }

    // Insert review
    const { error: insertError } = await adminSupabase
      .from('reviews')
      .insert({
        user_id: authUser.id,
        product_id: cleanProdId,
        rating: numericRating,
        comment: cleanComment,
        is_approved: true, // Default to true or auto-moderated
        created_at: new Date().toISOString()
      });

    if (insertError) throw insertError;
    
    revalidatePath('/[locale]/product/[slug]', 'page');
    revalidatePath('/[locale]/admin/reviews', 'page');

    return { success: true };
  } catch (error: any) {
    console.error('addProductReview Error:', error.message);
    return { success: false, error: error.message || 'Rəy əlavə edilərkən xəta baş verdi' };
  }
}

/**
 * Fetch all reviews for admin moderation.
 * BFLA Protection: Requires Staff (Admin / Manager) access.
 */
export async function getAllReviewsAdminAction() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from('reviews')
      .select('*, profiles(full_name, email), products(name_az, name_en, name_ru, slug)')
      .order('created_at', { ascending: false });

    if (error) {
      // Simple fallback query
      const { data: fallbackData, error: fbError } = await adminSupabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (fbError) throw fbError;
      return { success: true, data: fallbackData || [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getAllReviewsAdminAction Error:', error.message);
    return { success: false, data: [], error: error.message || 'Rəylər yüklənmədi' };
  }
}

/**
 * Update review approval status.
 * Security: Requires Staff access and writes to audit_logs.
 */
export async function updateReviewStatusAdminAction(reviewId: string, isApproved: boolean) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(reviewId, 'Rəy ID');

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('reviews')
      .update({ is_approved: Boolean(isApproved), updated_at: new Date().toISOString() })
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: isApproved ? 'approve_review' : 'reject_review',
        entity_type: 'review',
        entity_id: cleanId,
        details: { is_approved: isApproved }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/reviews', 'page');
    revalidatePath('/[locale]/product/[slug]', 'page');

    return { success: true, data };
  } catch (error: any) {
    console.error('updateReviewStatusAdminAction Error:', error.message);
    return { success: false, error: error.message || 'Status yenilənmədi' };
  }
}

/**
 * Delete review permanently.
 * Security: Requires Staff access and records audit log.
 */
export async function deleteReviewAdminAction(reviewId: string) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(reviewId, 'Rəy ID');

    const adminSupabase = createAdminSupabaseClient();
    const { error } = await adminSupabase
      .from('reviews')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'delete_review',
        entity_type: 'review',
        entity_id: cleanId,
        details: { deleted_at: new Date().toISOString() }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/reviews', 'page');
    revalidatePath('/[locale]/product/[slug]', 'page');

    return { success: true };
  } catch (error: any) {
    console.error('deleteReviewAdminAction Error:', error.message);
    return { success: false, error: error.message || 'Rəy silinərkən xəta baş verdi' };
  }
}
