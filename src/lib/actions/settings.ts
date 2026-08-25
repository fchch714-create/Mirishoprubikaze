// src/lib/actions/settings.ts

'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin, sanitizeInput } from '@/lib/security';
import { revalidatePath } from 'next/cache';

/**
 * Get store settings by key (e.g., 'general', 'payment', 'shipping', 'localization', 'seo_global')
 * Public / Authenticated read access.
 */
export async function getSettings(key: string) {
  try {
    const cleanKey = sanitizeInput(key || '').trim();
    if (!cleanKey) {
      return { success: false, error: 'Tənzimləmə açarı daxil edilməlidir.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('settings')
      .select('*')
      .eq('key', cleanKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, return empty object default
        return { success: true, data: {} };
      }
      throw error;
    }

    return { success: true, data: data?.value || {} };
  } catch (error: any) {
    console.error('getSettings Error for key:', key, error?.message || error);
    return { success: false, error: error.message || 'Tənzimləmələr yüklənə bilmədi' };
  }
}

/**
 * Update store settings
 * BFLA Protection: Strictly restricted to Super-Admin (`requireAdmin`).
 * Prevents unauthorized manipulation of payment numbers, shipping rates, and store config.
 */
export async function updateSettings(key: string, value: any) {
  try {
    const authUser = await requireAdmin();

    const cleanKey = sanitizeInput(key || '').trim();
    if (!cleanKey) {
      return { success: false, error: 'Tənzimləmə açarı daxil edilməlidir.' };
    }

    if (value === undefined || value === null) {
      return { success: false, error: 'Tənzimləmə dəyəri boş ola bilməz.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('settings')
      .upsert({
        key: cleanKey,
        value: value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) throw error;

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_system_settings',
        entity_type: 'settings',
        entity_id: cleanKey,
        details: { key: cleanKey, updated_at: new Date().toISOString() }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning in updateSettings:', auditErr);
    }

    revalidatePath('/[locale]/admin/settings', 'page');
    revalidatePath('/[locale]/admin/seo', 'page');
    revalidatePath('/[locale]/checkout', 'page');
    revalidatePath('/[locale]', 'layout');

    return { success: true, data };
  } catch (error: any) {
    console.error('updateSettings Error for key:', key, error?.message || error);
    return { success: false, error: error.message || 'Tənzimləmələr yenilənərkən xəta baş verdi' };
  }
}

