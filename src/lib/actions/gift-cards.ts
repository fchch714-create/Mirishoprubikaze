'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface GiftCardData {
  id?: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  is_active?: boolean;
  expires_at?: string | null;
}

// 1. Validate Gift Card (used during checkout)
export async function validateGiftCard(code: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const cleanCode = code.trim().toUpperCase();

    const { data: card, error } = await supabase
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
        code: card.code,
        current_balance: Number(card.current_balance)
      }
    };
  } catch (error: any) {
    console.error('validateGiftCard Error:', error.message);
    return { success: false, error: 'Hədiyyə kartı yoxlanılarkən xəta baş verdi.' };
  }
}

// 2. Retrieve Gift Cards
export async function getGiftCards() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
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

// 3. Create Gift Card
export async function createGiftCard(data: GiftCardData) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: inserted, error } = await supabase
      .from('gift_cards')
      .insert([{
        code: data.code.trim().toUpperCase(),
        initial_balance: data.initial_balance,
        current_balance: data.current_balance,
        is_active: data.is_active !== undefined ? data.is_active : true,
        expires_at: data.expires_at || null
      }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/gift-cards', 'page');
    return { success: true, giftCard: inserted };
  } catch (error: any) {
    console.error('createGiftCard Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 4. Update Gift Card (e.g. status or balance deduction)
export async function updateGiftCard(id: string, data: Partial<GiftCardData>) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: updated, error } = await supabase
      .from('gift_cards')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/gift-cards', 'page');
    return { success: true, giftCard: updated };
  } catch (error: any) {
    console.error('updateGiftCard Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 5. Delete Gift Card
export async function deleteGiftCard(id: string) {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from('gift_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/[locale]/admin/marketing/gift-cards', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('deleteGiftCard Error:', error.message);
    return { success: false, error: error.message };
  }
}
