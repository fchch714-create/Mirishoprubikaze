// src/lib/actions/catalog.ts

'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =========================================================================
// PRODUCTS ACTIONS
// =========================================================================

export async function getProducts(options?: {
  categoryId?: string;
  brandId?: string;
  collectionId?: string;
  limit?: number;
  offset?: number;
  isActive?: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from('products').select(`
      *,
      brands (*),
      product_categories!inner(category_id),
      variants (*)
    `, { count: 'exact' });

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    if (options?.brandId) {
      query = query.eq('brand_id', options.brandId);
    }

    if (options?.categoryId) {
      query = query.eq('product_categories.category_id', options.categoryId);
    }

    if (options?.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    const uniqueProducts = data ? Array.from(new Map(data.map((p: any) => [p.id, p])).values()) : [];
    return { success: true, data: uniqueProducts, count: count ?? uniqueProducts.length };
  } catch (error: any) {
    console.error('getProducts Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getProductBySlug(slug: string) {
  try {
    if (!slug) return { success: false, error: 'Slug təyin edilməyib' };
    const supabase = await createServerSupabaseClient();
    const cleanSlug = decodeURIComponent(slug).trim();
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleanSlug);

    const selectQuery = `
      *,
      brands (*),
      product_variants (*),
      variants (*)
    `;

    let data = null;

    try {
      const { data: slugData } = await supabase
        .from('products')
        .select(selectQuery)
        .eq('slug', cleanSlug)
        .maybeSingle();
      data = slugData;
    } catch {
      const { data: fallbackSlugData } = await supabase
        .from('products')
        .select('*, brands(*), variants(*)')
        .eq('slug', cleanSlug)
        .maybeSingle();
      data = fallbackSlugData;
    }

    if (!data && isUuid) {
      try {
        const { data: idData } = await supabase
          .from('products')
          .select(selectQuery)
          .eq('id', cleanSlug)
          .maybeSingle();
        data = idData;
      } catch {
        const { data: fallbackIdData } = await supabase
          .from('products')
          .select('*, brands(*), variants(*)')
          .eq('id', cleanSlug)
          .maybeSingle();
        data = fallbackIdData;
      }
    }

    if (!data) {
      const { data: simpleData } = await supabase
        .from('products')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();
      data = simpleData;
    }

    if (!data) {
      return { success: false, error: 'Məhsul tapılmadı' };
    }

    // Normalize variants payload
    const rawVars = (Array.isArray(data.variants) && data.variants.length > 0)
      ? data.variants
      : ((Array.isArray(data.product_variants) && data.product_variants.length > 0) ? data.product_variants : []);

    const normalizedVars = rawVars.map((v: any) => ({
      ...v,
      price_azn: v.price_azn ?? v.price ?? 0,
      compare_at_price_azn: v.compare_at_price_azn ?? v.discount_price ?? v.compare_at_price ?? 0,
      stock_quantity: v.stock_quantity ?? v.stock ?? 0,
      sku: v.sku ?? '',
      name_az: v.name_az ?? v.name ?? v.title_az ?? v.title ?? '',
      name_en: v.name_en ?? v.name ?? v.title_en ?? v.title ?? '',
      name_ru: v.name_ru ?? v.name ?? v.title_ru ?? v.title ?? '',
      image_url: v.image_url ?? v.image ?? null,
    }));

    data.variants = normalizedVars;
    data.product_variants = normalizedVars;

    return { success: true, data };
  } catch (error: any) {
    console.error('getProductBySlug Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getProductById(id: string) {
  try {
    if (!id) return { success: false, error: 'ID təyin edilməyib' };
    const supabase = await createServerSupabaseClient();
    const cleanId = decodeURIComponent(String(id)).trim();
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleanId);

    const selectQuery = `
      *,
      brands (*),
      product_variants (*),
      variants (*)
    `;

    let data = null;

    if (isUuid) {
      try {
        const { data: idData } = await supabase
          .from('products')
          .select(selectQuery)
          .eq('id', cleanId)
          .maybeSingle();
        data = idData;
      } catch {
        const { data: fallbackIdData } = await supabase
          .from('products')
          .select('*, brands(*), variants(*)')
          .eq('id', cleanId)
          .maybeSingle();
        data = fallbackIdData;
      }
    }

    if (!data) {
      try {
        const { data: slugData } = await supabase
          .from('products')
          .select(selectQuery)
          .eq('slug', cleanId)
          .maybeSingle();
        data = slugData;
      } catch {
        const { data: fallbackSlugData } = await supabase
          .from('products')
          .select('*, brands(*), variants(*)')
          .eq('slug', cleanId)
          .maybeSingle();
        data = fallbackSlugData;
      }
    }

    if (!data && !isUuid) {
      const { data: simpleSlugData } = await supabase
        .from('products')
        .select('*')
        .eq('slug', cleanId)
        .maybeSingle();
      data = simpleSlugData;
    }

    if (!data && isUuid) {
      const { data: simpleIdData } = await supabase
        .from('products')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();
      data = simpleIdData;
    }

    if (!data) {
      return { success: false, error: 'Məhsul tapılmadı' };
    }

    if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
      try {
        const { data: vars } = await supabase
          .from('variants')
          .select('*')
          .eq('product_id', data.id);
        if (vars && vars.length > 0) {
          data.variants = vars;
        } else {
          const { data: pVars } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', data.id);
          if (pVars && pVars.length > 0) {
            data.variants = pVars;
            data.product_variants = pVars;
          }
        }
      } catch (e) {
        data.variants = [];
      }
    }

    const rawVars = (Array.isArray(data.variants) && data.variants.length > 0)
      ? data.variants
      : ((Array.isArray(data.product_variants) && data.product_variants.length > 0) ? data.product_variants : []);

    const normalizedVars = rawVars.map((v: any) => ({
      ...v,
      price_azn: v.price_azn ?? v.price ?? 0,
      compare_at_price_azn: v.compare_at_price_azn ?? v.discount_price ?? v.compare_at_price ?? 0,
      stock_quantity: v.stock_quantity ?? v.stock ?? 0,
      sku: v.sku ?? '',
      name_az: v.name_az ?? v.name ?? v.title_az ?? v.title ?? '',
      name_en: v.name_en ?? v.name ?? v.title_en ?? v.title ?? '',
      name_ru: v.name_ru ?? v.name ?? v.title_ru ?? v.title ?? '',
      image_url: v.image_url ?? v.image ?? null,
    }));

    data.variants = normalizedVars;
    data.product_variants = normalizedVars;

    if (!data.product_categories || !Array.isArray(data.product_categories) || data.product_categories.length === 0) {
      try {
        const { data: catRel } = await supabase
          .from('product_categories')
          .select('category_id')
          .eq('product_id', data.id);
        if (catRel) {
          data.product_categories = catRel;
        }
      } catch (e) {
        data.product_categories = [];
      }
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('getProductById Error:', error?.message || error);
    return { success: false, error: error?.message || 'Sistem xətası baş verdi' };
  }
}

import * as adminActions from '@/lib/actions/admin';

export async function createProduct(payload: any) {
  return adminActions.createProduct(payload);
}

export async function updateProduct(id: string, payload: any) {
  return adminActions.updateProduct(id, payload);
}

export async function saveProduct(productId: string | null | undefined, payload: any) {
  return adminActions.saveProduct(productId, payload);
}

export async function deleteProduct(id: string) {
  return adminActions.deleteProduct(id);
}




// =========================================================================
// CATEGORIES ACTIONS
// =========================================================================

export async function getCategories() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name_az', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getCategories Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createCategory(payload: {
  name_az: string;
  name_en: string;
  name_ru: string;
  slug_az: string;
  slug_en: string;
  slug_ru: string;
  parent_id?: string | null;
  image_url?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name_az: payload.name_az,
        name_en: payload.name_en,
        name_ru: payload.name_ru,
        slug_az: payload.slug_az,
        slug_en: payload.slug_en,
        slug_ru: payload.slug_ru,
        parent_id: payload.parent_id || null,
        image_url: payload.image_url,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
  } catch (error: any) {
    console.error('createCategory Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: string, payload: Partial<{
  name_az: string;
  name_en: string;
  name_ru: string;
  slug_az: string;
  slug_en: string;
  slug_ru: string;
  parent_id: string | null;
  image_url: string;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
  } catch (error: any) {
    console.error('updateCategory Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCategory Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// BRANDS ACTIONS
// =========================================================================

export async function getBrands() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getBrands Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createBrand(payload: {
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('brands')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
  } catch (error: any) {
    console.error('createBrand Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateBrand(id: string, payload: Partial<{
  name: string;
  slug: string;
  logo_url: string;
  description: string;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('brands')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
  } catch (error: any) {
    console.error('updateBrand Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteBrand(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('deleteBrand Error:', error.message);
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
      .select('*')
      .order('name_az', { ascending: true });

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
  image_url?: string;
  is_active?: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('collections')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
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
  image_url: string;
  is_active: boolean;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('collections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, data };
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
    revalidatePath('/[locale]', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCollection Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// REVIEWS ACTIONS
// =========================================================================

export async function getReviews(productId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getReviews Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function createReview(payload: {
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id: payload.product_id,
        user_id: payload.user_id,
        rating: payload.rating,
        comment: payload.comment,
        is_approved: false, // Default requires moderation
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, message: 'Rəyiniz qəbul olundu, təsdiqləndikdən sonra görünəcək.' };
  } catch (error: any) {
    console.error('createReview Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function approveReview(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('approveReview Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteReview(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('deleteReview Error:', error.message);
    return { success: false, error: error.message };
  }
}
