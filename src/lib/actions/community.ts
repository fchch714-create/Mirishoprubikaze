'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  requireStaff, 
  validateId, 
  sanitizeInput, 
  validateNonNegativeInt 
} from '@/lib/security';
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

/**
 * 1. Get loyalty program participants
 * BFLA Protection: Requires Staff access.
 */
export async function getLoyaltyParticipants() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    // Get profiles
    const { data: profiles, error: pError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email');

    if (pError) throw pError;

    // Get loyalty records
    const { data: loyalty, error: lError } = await adminSupabase
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
      const updated_at = loyaltyTimeMap.get(p.id) || new Date().toISOString();

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
    console.error('getLoyaltyParticipants Error:', error.message);
    return { success: false, error: error.message || 'Məlumat yüklənmədi', participants: [] };
  }
}

/**
 * 2. Add or update manual loyalty points for user
 * Security: Requires Staff access and records audit log.
 */
export async function updateLoyaltyPoints(userId: string, points: number) {
  try {
    const authUser = await requireStaff();
    const cleanUserId = validateId(userId, 'İstifadəçi ID');
    const validPoints = validateNonNegativeInt(points, 'Loyallıq balı');

    const adminSupabase = createAdminSupabaseClient();

    // Check if record exists
    const { data: existing } = await adminSupabase
      .from('loyalty_points')
      .select('balance')
      .eq('user_id', cleanUserId)
      .maybeSingle();

    let res;
    if (existing) {
      res = await adminSupabase
        .from('loyalty_points')
        .update({
          balance: validPoints,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', cleanUserId);
    } else {
      res = await adminSupabase
        .from('loyalty_points')
        .insert([{
          user_id: cleanUserId,
          balance: validPoints,
          updated_at: new Date().toISOString()
        }]);
    }

    if (res.error) throw res.error;

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_loyalty_points',
        entity_type: 'loyalty',
        entity_id: cleanUserId,
        details: { new_balance: validPoints, previous_balance: existing?.balance || 0 }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/marketing/loyalty', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('updateLoyaltyPoints Error:', error.message);
    return { success: false, error: error.message || 'Bal yenilənmədi' };
  }
}

/**
 * 3. Get all newsletter subscribers
 * BFLA Protection: Requires Staff access.
 */
export async function getNewsletterSubscribers() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, subscribers: (data as NewsletterSub[]) || [] };
  } catch (error: any) {
    console.error('getNewsletterSubscribers Error:', error.message);
    return { success: false, error: error.message || 'Abunəçilər yüklənmədi', subscribers: [] };
  }
}

/**
 * 4. Add newsletter subscriber (from public storefront footer/popups)
 * Sanitizes input and validates email format.
 */
export async function subscribeToNewsletter(email: string) {
  try {
    const cleanEmail = sanitizeInput(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length > 254) {
      return { success: false, error: 'Düzgün e-poçt ünvanı daxil edilməlidir.' };
    }

    const adminSupabase = createAdminSupabaseClient();

    // Check if email already exists
    const { data: existing } = await adminSupabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return { success: true, alreadySubscribed: true };
    }

    const { data, error } = await adminSupabase
      .from('newsletter_subscribers')
      .insert([{ 
        email: cleanEmail, 
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadySubscribed: true };
      }
      throw error;
    }

    revalidatePath('/[locale]/admin/marketing/newsletter', 'page');
    return { success: true, subscriber: data };
  } catch (error: any) {
    console.error('subscribeToNewsletter Error:', error.message);
    return { success: false, error: error.message || 'Abunə olarkən xəta baş verdi' };
  }
}

/**
 * 5. Get actual referral participants and independent referral chain records
 * BFLA Protection: Requires Staff access.
 */
export async function getReferralParticipants() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    // Fetch profiles
    const { data: profiles, error: pError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email, referral_code');

    if (pError) throw pError;

    // Fetch referral records from table
    const { data: refRecords } = await adminSupabase
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
      error: error.message || 'Məlumat yüklənmədi',
      referralUsers: [],
      recordsList: []
    };
  }
}

