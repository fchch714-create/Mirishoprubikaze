'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  requireStaff, 
  sanitizeInput, 
  validateId, 
  validateEnum, 
  validateNonNegativeInt 
} from '@/lib/security';
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

/**
 * 1. Fetch All Campaigns (for Admin panel)
 * BFLA Protection: Requires Staff (Admin / Manager) access.
 */
export async function getCampaigns() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, campaigns: data || [] };
  } catch (error: any) {
    console.error('getCampaigns Error:', error.message);
    return { success: false, campaigns: [], error: error.message || 'Kampaniyalar yüklənmədi' };
  }
}

/**
 * 2. Fetch Active Campaigns (for Front-end Storefront)
 * Public read access for active discounts.
 */
export async function getActiveCampaigns() {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    
    const { data, error } = await adminSupabase
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

/**
 * 3. Create Campaign
 * Security: Requires Staff access, validates discount (1-100%), target types and dates.
 */
export async function createCampaign(data: CampaignData) {
  try {
    const authUser = await requireStaff();

    const cleanName = sanitizeInput(data.name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Kampaniya adı ən azı 2 simvol olmalıdır.' };
    }

    const discountPercent = Number(data.discount_percent);
    if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      return { success: false, error: 'Endirim faizi 1% ilə 100% arasında olmalıdır.' };
    }

    const targetType = validateEnum(
      data.target_type, 
      ['all', 'category', 'product'] as const, 
      'Hədəf növü'
    );

    // Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, error: 'Başlama və bitmə tarixləri düzgün formatda deyil.' };
    }
    if (endDate <= startDate) {
      return { success: false, error: 'Bitmə tarixi başlama tarixindən sonra olmalıdır.' };
    }

    const cleanTargetIds = Array.isArray(data.target_ids) 
      ? data.target_ids.map(id => sanitizeInput(String(id)).trim()).filter(Boolean)
      : [];

    const adminSupabase = createAdminSupabaseClient();
    const { data: inserted, error } = await adminSupabase
      .from('campaigns')
      .insert([{
        name: cleanName,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        discount_percent: discountPercent,
        target_type: targetType,
        target_ids: cleanTargetIds,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'create_campaign',
        entity_type: 'campaign',
        entity_id: inserted.id,
        details: { name: cleanName, discount_percent: discountPercent, target_type: targetType }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/marketing/campaigns', 'page');
    revalidatePath('/[locale]/catalog', 'page');
    revalidatePath('/[locale]', 'page');

    return { success: true, campaign: inserted };
  } catch (error: any) {
    console.error('createCampaign Error:', error.message);
    return { success: false, error: error.message || 'Kampaniya yaradılarkən xəta baş verdi' };
  }
}

/**
 * 4. Update Campaign
 * Security: Requires Staff access, validates id and inputs, records audit log.
 */
export async function updateCampaign(id: string, data: Partial<CampaignData>) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(id, 'Kampaniya ID');

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) {
      const cleanName = sanitizeInput(data.name).trim();
      if (cleanName.length < 2) throw new Error('Kampaniya adı ən azı 2 simvol olmalıdır.');
      updatePayload.name = cleanName;
    }

    if (data.discount_percent !== undefined) {
      const discountPercent = Number(data.discount_percent);
      if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
        throw new Error('Endirim faizi 1% ilə 100% arasında olmalıdır.');
      }
      updatePayload.discount_percent = discountPercent;
    }

    if (data.target_type !== undefined) {
      updatePayload.target_type = validateEnum(
        data.target_type, 
        ['all', 'category', 'product'] as const, 
        'Hədəf növü'
      );
    }

    if (data.target_ids !== undefined) {
      updatePayload.target_ids = Array.isArray(data.target_ids)
        ? data.target_ids.map(tid => sanitizeInput(String(tid)).trim()).filter(Boolean)
        : [];
    }

    if (data.start_date !== undefined) {
      const d = new Date(data.start_date);
      if (isNaN(d.getTime())) throw new Error('Düzgün başlama tarixi daxil edin.');
      updatePayload.start_date = d.toISOString();
    }

    if (data.end_date !== undefined) {
      const d = new Date(data.end_date);
      if (isNaN(d.getTime())) throw new Error('Düzgün bitmə tarixi daxil edin.');
      updatePayload.end_date = d.toISOString();
    }

    if (data.is_active !== undefined) {
      updatePayload.is_active = Boolean(data.is_active);
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: updated, error } = await adminSupabase
      .from('campaigns')
      .update(updatePayload)
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_campaign',
        entity_type: 'campaign',
        entity_id: cleanId,
        details: { updated_fields: Object.keys(updatePayload), values: updatePayload }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/marketing/campaigns', 'page');
    revalidatePath('/[locale]/catalog', 'page');
    revalidatePath('/[locale]', 'page');

    return { success: true, campaign: updated };
  } catch (error: any) {
    console.error('updateCampaign Error:', error.message);
    return { success: false, error: error.message || 'Kampaniya yenilənərkən xəta baş verdi' };
  }
}

/**
 * 5. Delete Campaign
 * Security: Requires Staff access and records audit log.
 */
export async function deleteCampaign(id: string) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(id, 'Kampaniya ID');

    const adminSupabase = createAdminSupabaseClient();
    const { error } = await adminSupabase
      .from('campaigns')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'delete_campaign',
        entity_type: 'campaign',
        entity_id: cleanId,
        details: { deleted_at: new Date().toISOString() }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/marketing/campaigns', 'page');
    revalidatePath('/[locale]/catalog', 'page');
    revalidatePath('/[locale]', 'page');

    return { success: true };
  } catch (error: any) {
    console.error('deleteCampaign Error:', error.message);
    return { success: false, error: error.message || 'Kampaniya silinərkən xəta baş verdi' };
  }
}

/**
 * 6. Apply Active Campaigns to Product List
 * Calculates realistic marketing discounts across targeted products/categories.
 */
export async function applyCampaignDiscounts(products: any[]) {
  try {
    if (!Array.isArray(products) || products.length === 0) return products;

    const res = await getActiveCampaigns();
    if (!res.success || !res.campaigns || res.campaigns.length === 0) {
      return products;
    }

    const activeCampaigns = res.campaigns;
    const adminSupabase = createAdminSupabaseClient();

    // Fetch product category mappings to check category targets
    const { data: mappings } = await adminSupabase
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

        const discountPercent = Math.min(100, Math.max(0, Number(maxCampaign.discount_percent)));
        const currentPrice = Math.max(0, Number(product.price_azn || product.price || 0));

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

        const discountedPrice = Math.max(0, currentPrice * (1 - discountPercent / 100));
        const finalCalculatedPercent = baseOriginalPrice > 0 
          ? Math.round(((baseOriginalPrice - discountedPrice) / baseOriginalPrice) * 100)
          : discountPercent;

        return {
          ...product,
          price_azn: Number(discountedPrice.toFixed(2)),
          original_price_azn: baseOriginalPrice,
          compare_at_price_azn: baseOriginalPrice,
          discount_price: baseOriginalPrice,
          old_price: baseOriginalPrice,
          discount_percent: Math.min(100, Math.max(0, finalCalculatedPercent)),
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

