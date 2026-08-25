'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  sanitizeInput, 
  validatePositiveAmount, 
  validateId,
  requireStaff, 
  requireAdmin 
} from '@/lib/security';
import { revalidatePath } from 'next/cache';

export interface GiftCardData {
  id?: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  is_active?: boolean;
  expires_at?: string | null;
}

// 1. Validate Gift Card (used during public checkout)
export async function validateGiftCard(code: string) {
  try {
    const cleanCode = sanitizeInput(code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Hədiyyə kartı kodu daxil edilməyib.' };
    }

    const adminSupabase = createAdminSupabaseClient();

    const { data: card, error } = await adminSupabase
      .from('gift_cards')
      .select('*')
      .eq('code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    if (!card) {
      return { success: false, error: 'Hədiyyə kartı tapılmadı və ya aktiv deyil.' };
    }

    // Check expiration
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return { success: false, error: 'Bu hədiyyə kartının istifadə müddəti bitib.' };
    }

    // Check balance
    if (Number(card.current_balance) <= 0) {
      return { success: false, error: 'Bu hədiyyə kartının balansı bitib (0.00 AZN).' };
    }

    return {
      success: true,
      giftCard: {
        id: card.id,
        code: card.code,
        current_balance: Number(card.current_balance)
      }
    };
  } catch (error: any) {
    console.error('validateGiftCard Error:', error.message);
    return { success: false, error: 'Hədiyyə kartı yoxlanılarkən xəta baş verdi.' };
  }
}

// 2. Retrieve Gift Cards (Requires Staff or Admin)
export async function getGiftCards() {
  try {
    const { user } = await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from('gift_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, giftCards: data || [] };
  } catch (error: any) {
    console.error('getGiftCards Error:', error.message);
    return { success: false, giftCards: [], error: error.message };
  }
}

// 3. Create Gift Card (Requires Admin Privilege)
export async function createGiftCard(data: GiftCardData) {
  try {
    const { user } = await requireAdmin();
    const cleanCode = sanitizeInput(data.code || '').trim().toUpperCase();
    if (!cleanCode) throw new Error('Hədiyyə kartı kodu boş ola bilməz.');

    const initialBal = validatePositiveAmount(data.initial_balance, 'İlkin Balans');
    const currentBal = validatePositiveAmount(data.current_balance, 'Mövcud Balans');

    const adminSupabase = createAdminSupabaseClient();

    const { data: inserted, error } = await adminSupabase
      .from('gift_cards')
      .insert([{
        code: cleanCode,
        initial_balance: initialBal,
        current_balance: currentBal,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
        expires_at: data.expires_at || null
      }])
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'create_gift_card',
      entity_type: 'gift_card',
      entity_id: inserted.id,
      details: { code: cleanCode, initial_balance: initialBal, current_balance: currentBal }
    }]);

    revalidatePath('/[locale]/admin/marketing/gift-cards', 'page');
    return { success: true, giftCard: inserted };
  } catch (error: any) {
    console.error('createGiftCard Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 4. Update Gift Card (Requires Admin Privilege)
export async function updateGiftCard(id: string, data: Partial<GiftCardData>) {
  try {
    const { user } = await requireAdmin();
    const cleanId = validateId(id, 'Hədiyyə Kartı ID');

    const updateData: any = {};
    if (data.code !== undefined) {
      updateData.code = sanitizeInput(data.code).trim().toUpperCase();
      if (!updateData.code) throw new Error('Hədiyyə kartı kodu boş ola bilməz.');
    }
    if (data.current_balance !== undefined) {
      updateData.current_balance = validatePositiveAmount(data.current_balance, 'Mövcud Balans');
    }
    if (data.initial_balance !== undefined) {
      updateData.initial_balance = validatePositiveAmount(data.initial_balance, 'İlkin Balans');
    }
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at || null;

    const adminSupabase = createAdminSupabaseClient();

    const { data: updated, error } = await adminSupabase
      .from('gift_cards')
      .update(updateData)
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'update_gift_card',
      entity_type: 'gift_card',
      entity_id: cleanId,
      details: updateData
    }]);

    revalidatePath('/[locale]/admin/marketing/gift-cards', 'page');
    return { success: true, giftCard: updated };
  } catch (error: any) {
    console.error('updateGiftCard Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 5. Delete Gift Card (Requires Admin Privilege)
export async function deleteGiftCard(id: string) {
  try {
    const { user } = await requireAdmin();
    const cleanId = validateId(id, 'Hədiyyə Kartı ID');
    const adminSupabase = createAdminSupabaseClient();
    
    const { error } = await adminSupabase
      .from('gift_cards')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;

    // Audit log
    await adminSupabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'delete_gift_card',
      entity_type: 'gift_card',
      entity_id: cleanId,
      details: { deleted_at: new Date().toISOString() }
    }]);

    revalidatePath('/[locale]/admin/marketing/gift-cards', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('deleteGiftCard Error:', error.message);
    return { success: false, error: error.message };
  }
}

