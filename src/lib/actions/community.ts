'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface LoyaltyUser {
  user_id: string;
  name: string;
  email: string;
  balance: number;
  tier: 'Bürünc' | 'Gümüş' | 'Qızıl' | 'Platin';
  updated_at: string;
}

export interface NewsletterSub {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface ReferralUser {
  user_id: string;
  name: string;
  email: string;
  referral_code: string;
  invited_count: number;
  total_bonus_azn: number;
}

export interface ReferralRecordItem {
  id: string;
  referrer_name: string;
  referred_name: string;
  referred_email: string;
  reward_amount: number;
  status: string;
  created_at: string;
}

// 1. Get loyalty program participants
export async function getLoyaltyParticipants() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get profiles
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, email');

    if (pError) throw pError;

    // Get loyalty records
    const { data: loyalty, error: lError } = await supabase
      .from('loyalty_points')
      .select('*');

    if (lError) throw lError;

    const loyaltyMap = new Map<string, number>();
    const loyaltyTimeMap = new Map<string, string>();
    if (loyalty) {
      for (const record of loyalty) {
        loyaltyMap.set(record.user_id, record.balance);
        loyaltyTimeMap.set(record.user_id, record.updated_at);
      }
    }

    const participants: LoyaltyUser[] = (profiles || []).map(p => {
      const balance = loyaltyMap.get(p.id) || 0;
      const updated_at = loyaltyTimeMap.get(p.id) || p.created_at || new Date().toISOString();

      let tier: LoyaltyUser['tier'] = 'Bürünc';
      if (balance >= 1000) tier = 'Platin';
      else if (balance >= 500) tier = 'Qızıl';
      else if (balance >= 200) tier = 'Gümüş';

      return {
        user_id: p.id,
        name: p.full_name || 'Qeydiyyatlı İstifadəçi',
        email: p.email || '',
        balance,
        tier,
        updated_at
      };
    });

    return { success: true, participants };
  } catch (error: any) {
    return { success: false, error: error.message, participants: [] };
  }
}

// 2. Add or update manual loyalty points for user
export async function updateLoyaltyPoints(userId: string, points: number) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if record exists
    const { data: existing } = await supabase
      .from('loyalty_points')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    let res;
    if (existing) {
      res = await supabase
        .from('loyalty_points')
        .update({
          balance: Math.max(0, points),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      res = await supabase
        .from('loyalty_points')
        .insert([{
          user_id: userId,
          balance: Math.max(0, points)
        }]);
    }

    if (res.error) throw res.error;
    revalidatePath('/admin/marketing/loyalty');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Get all newsletter subscribers
export async function getNewsletterSubscribers() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, subscribers: (data as NewsletterSub[]) || [] };
  } catch (error: any) {
    return { success: false, error: error.message, subscribers: [] };
  }
}

// 4. Add newsletter subscriber (from public pages/footer)
export async function subscribeToNewsletter(email: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return { success: true, alreadySubscribed: true };
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: cleanEmail, is_active: true }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadySubscribed: true };
      }
      throw error;
    }
    return { success: true, subscriber: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Get actual referral participants and independent referral chain records
export async function getReferralParticipants() {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch profiles
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, email, referral_code');

    if (pError) throw pError;

    // Fetch referral records from table
    const { data: refRecords } = await supabase
      .from('referral_records')
      .select('*')
      .order('created_at', { ascending: false });

    const countMap = new Map<string, number>();
    const bonusMap = new Map<string, number>();

    if (refRecords) {
      for (const rec of refRecords) {
        if (rec.referrer_id) {
          const currentCount = countMap.get(rec.referrer_id) || 0;
          countMap.set(rec.referrer_id, currentCount + 1);

          const currentBonus = bonusMap.get(rec.referrer_id) || 0;
          const amt = Number(rec.reward_amount || rec.bonus_amount || 5);
          bonusMap.set(rec.referrer_id, currentBonus + amt);
        }
      }
    }

    const referralUsers: ReferralUser[] = (profiles || []).map(p => {
      const invited_count = countMap.get(p.id) || 0;
      const total_bonus_azn = bonusMap.get(p.id) || 0;
      const cleanName = (p.full_name || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const code = p.referral_code || `REF-${cleanName.slice(0, 3) || 'RUB'}-${p.id.slice(0, 4).toUpperCase()}`;

      return {
        user_id: p.id,
        name: p.full_name || 'Qeydiyyatlı İstifadəçi',
        email: p.email || '-',
        referral_code: code,
        invited_count,
        total_bonus_azn
      };
    });

    // Build chain records list
    let recordsList: ReferralRecordItem[] = [];
    if (refRecords && refRecords.length > 0) {
      const profileMap = new Map<string, any>();
      for (const p of profiles || []) {
        profileMap.set(p.id, p);
      }

      recordsList = refRecords.map(r => {
        const referrer = profileMap.get(r.referrer_id);
        const referred = profileMap.get(r.referred_id);
        return {
          id: String(r.id),
          referrer_name: referrer?.full_name || 'Dəvət Edən',
          referred_name: referred?.full_name || 'Yeni Müştəri',
          referred_email: referred?.email || '-',
          reward_amount: Number(r.reward_amount || 5),
          status: r.status === 'completed' ? 'Tamamlandı' : 'Gözləmədə',
          created_at: r.created_at || new Date().toISOString()
        };
      });
    }

    return {
      success: true,
      referralUsers,
      recordsList
    };
  } catch (error: any) {
    console.error('getReferralParticipants Error:', error.message);
    return {
      success: false,
      error: error.message,
      referralUsers: [],
      recordsList: []
    };
  }
}
