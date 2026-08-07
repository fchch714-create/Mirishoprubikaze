'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CampaignData {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  discount_percent: number;
  target_type: 'all' | 'category' | 'product';
  target_ids: string[]; // Holds product or category UUIDs/slugs as array
  is_active?: boolean;
}

// 1. Fetch All Campaigns (for Admin panel)
export async function getCampaigns() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, campaigns: data || [] };
  } catch (error: any) {
    console.error('getCampaigns Error:', error.message);
    return { success: false, campaigns: [], error: error.message };
  }
}

// 2. Fetch Active Campaigns (for Front-end)
export async function getActiveCampaigns() {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now);

    if (error) throw error;
    return { success: true, campaigns: data || [] };
  } catch (error: any) {
    console.error('getActiveCampaigns Error:', error.message);
    return { success: false, campaigns: [] };
  }
}

// 3. Create Campaign
export async function createCampaign(data: CampaignData) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: inserted, error } = await supabase
      .from('campaigns')
      .insert([{
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        discount_percent: data.discount_percent,
        target_type: data.target_type,
        target_ids: data.target_ids || [],
        is_active: data.is_active !== undefined ? data.is_active : true
      }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/campaigns', 'page');
    return { success: true, campaign: inserted };
  } catch (error: any) {
    console.error('createCampaign Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 4. Update Campaign
export async function updateCampaign(id: string, data: Partial<CampaignData>) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: updated, error } = await supabase
      .from('campaigns')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/campaigns', 'page');
    return { success: true, campaign: updated };
  } catch (error: any) {
    console.error('updateCampaign Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 5. Delete Campaign
export async function deleteCampaign(id: string) {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/campaigns', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('deleteCampaign Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 6. Apply Active Campaigns to Product List
export async function applyCampaignDiscounts(products: any[]) {
  try {
    const res = await getActiveCampaigns();
    if (!res.success || !res.campaigns || res.campaigns.length === 0) {
      return products;
    }

    const activeCampaigns = res.campaigns;
    const supabase = await createServerSupabaseClient();

    // Fetch product category mappings to check category targets
    const { data: mappings } = await supabase
      .from('product_categories')
      .select('product_id, category_id');

    const productCategoriesMap: Record<string, string[]> = {};
    if (mappings) {
      mappings.forEach((m: any) => {
        if (!productCategoriesMap[m.product_id]) {
          productCategoriesMap[m.product_id] = [];
        }
        productCategoriesMap[m.product_id].push(m.category_id);
      });
    }

    return products.map((product) => {
      const prodId = product.id;
      const prodCategories = productCategoriesMap[prodId] || [];

      // Find all campaigns that apply to this product
      const matchingCampaigns = activeCampaigns.filter((camp: any) => {
        if (camp.target_type === 'all') return true;
        if (camp.target_type === 'product' && camp.target_ids?.includes(prodId)) return true;
        if (camp.target_type === 'category') {
          return prodCategories.some((catId: string) => camp.target_ids?.includes(catId));
        }
        return false;
      });

      if (matchingCampaigns.length > 0) {
        // Find the campaign with the maximum discount percentage
        const maxCampaign = matchingCampaigns.reduce((prev: any, current: any) => 
          Number(prev.discount_percent) > Number(current.discount_percent) ? prev : current
        );

        const discountPercent = Number(maxCampaign.discount_percent);
        const currentPrice = Number(product.price_azn || product.price || 0);

        // Find existing higher compare price if available
        const existingCompareCandidates = [
          product.original_price_azn,
          product.compare_at_price_azn,
          product.compare_at_price,
          product.discount_price,
          product.old_price,
          product.original_price
        ]
          .map(v => (v !== undefined && v !== null && v !== '') ? Number(v) : NaN)
          .filter(v => !isNaN(v) && v > currentPrice);

        const baseOriginalPrice = existingCompareCandidates.length > 0 
          ? existingCompareCandidates[0] 
          : currentPrice;

        const discountedPrice = currentPrice * (1 - discountPercent / 100);
        const finalCalculatedPercent = Math.round(((baseOriginalPrice - discountedPrice) / baseOriginalPrice) * 100);

        return {
          ...product,
          price_azn: Number(discountedPrice.toFixed(2)),
          original_price_azn: baseOriginalPrice,
          compare_at_price_azn: baseOriginalPrice,
          discount_price: baseOriginalPrice,
          old_price: baseOriginalPrice,
          discount_percent: finalCalculatedPercent,
          campaign_name: maxCampaign.name
        };
      }

      return product;
    });
  } catch (error) {
    console.error('applyCampaignDiscounts Error:', error);
    return products;
  }
}

