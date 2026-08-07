// src/lib/actions/user.ts

'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =========================================================================
// AUTHENTICATION & SESSIONS
// =========================================================================

export async function signUpUser(payload: {
  email: string;
  password_hash: string; // The UI passes standard password here which Supabase hashes
  full_name: string;
  phone?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Register user with auth.signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password_hash,
      options: {
        data: {
          full_name: payload.full_name,
          phone: payload.phone || '',
          role: 'customer' // Default role is customer
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('İstifadəçi yaradıla bilmədi.');

    // We rely on Supabase trigger or insert the profile manually if RLS permits
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        role: 'customer',
        full_name: payload.full_name,
        phone: payload.phone || '',
        loyalty_points: 0
      });

    if (profileError) {
      console.warn('Profile sync warning during signup:', profileError.message);
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('signUpUser Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function signInUser(payload: {
  email: string;
  password_hash: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password_hash,
    });

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('signInUser Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function signOutUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('signOutUser Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getCurrentUserSession() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, session };
  } catch (error: any) {
    console.error('getCurrentUserSession Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// PROFILES & LOYALTY / REFERRALS
// =========================================================================

export async function getProfile(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*, customer_groups(*)')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getProfile Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getAllProfiles() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getAllProfiles Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateProfile(userId: string, payload: Partial<{
  full_name: string;
  phone: string;
  role: string;
}>) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Write audit log if role or details changed
    try {
      const { createAuditLog } = await import('@/lib/actions/audit');
      await createAuditLog({
        action: `İstifadəçi profili yeniləndi (Rol: ${payload.role || 'Dəyişməyib'})`,
        table_name: 'profiles',
        record_id: userId,
        new_values: payload
      });
    } catch (auditErr) {
      console.error('Audit logging failed:', auditErr);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('updateProfile Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getLoyaltyHistory(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('loyalty_points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getLoyaltyHistory Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getReferralRecords(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('referral_records')
      .select('*, referrer:profiles!referral_records_referrer_id_fkey(*), referred:profiles!referral_records_referred_id_fkey(*)')
      .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getReferralRecords Error:', error.message);
    return { success: false, error: error.message };
  }
}


// =========================================================================
// SUPPORT / CRM TICKETS
// =========================================================================

export async function createSupportTicket(payload: {
  user_id?: string;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        user_id: payload.user_id || null,
        subject: payload.subject,
        message: payload.message,
        status: 'open',
        priority: payload.priority || 'medium',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('createSupportTicket Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getSupportTickets(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getSupportTickets Error:', error.message);
    return { success: false, error: error.message };
  }
}
