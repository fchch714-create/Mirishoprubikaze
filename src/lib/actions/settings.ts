// src/lib/actions/settings.ts

'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSettings(key: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, return empty object default
        return { success: true, data: {} };
      }
      throw error;
    }

    return { success: true, data: data.value };
  } catch (error: any) {
    console.error(`getSettings Error for key ${key}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function updateSettings(key: string, value: any) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]/admin/settings', 'page');
    return { success: true, data };
  } catch (error: any) {
    console.error(`updateSettings Error for key ${key}:`, error.message);
    return { success: false, error: error.message };
  }
}
