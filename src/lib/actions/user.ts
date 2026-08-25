// src/lib/actions/user.ts

'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  sanitizeInput, 
  validateId, 
  validateEnum, 
  requireAuth, 
  requireStaff, 
  requireAdmin 
} from '@/lib/security';
import { revalidatePath } from 'next/cache';

// =========================================================================
// AUTHENTICATION & SESSIONS
// =========================================================================

export async function signUpUser(payload: {
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
}) {
  try {
    const cleanEmail = sanitizeInput(payload.email || '').trim().toLowerCase();
    const cleanName = sanitizeInput(payload.full_name || '').trim();
    const cleanPhone = payload.phone ? sanitizeInput(payload.phone).trim().replace(/[^0-9+]/g, '') : '';
    const password = payload.password_hash || '';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Düzgün e-poçt ünvanı daxil edilməlidir.' };
    }
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Ad və soyad ən azı 2 simvoldan ibarət olmalıdır.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır.' };
    }

    const supabase = await createServerSupabaseClient();
    
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone,
          role: 'customer' // Enforce customer role
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('İstifadəçi qeydiyyatdan keçirilə bilmədi.');

    // Ensure profile row exists in profiles table using Admin Client
    const adminSupabase = createAdminSupabaseClient();
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        role: 'customer',
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        loyalty_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      console.warn('Profile sync warning during signup:', profileError.message);
    }

    return { success: true, user: authData.user };
  } catch (error: any) {
    console.error('signUpUser Error:', error.message);
    return { success: false, error: error.message || 'Qeydiyyat zamanı xəta baş verdi' };
  }
}

export async function signInUser(payload: {
  email: string;
  password_hash: string;
}) {
  try {
    const cleanEmail = sanitizeInput(payload.email || '').trim().toLowerCase();
    const password = payload.password_hash || '';

    if (!cleanEmail || !password) {
      return { success: false, error: 'E-poçt və şifrə daxil edilməlidir.' };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (error) throw error;
    revalidatePath('/[locale]', 'layout');
    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('signInUser Error:', error.message);
    return { success: false, error: error.message || 'Giriş uğursuz oldu' };
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
    return { success: false, error: error.message || 'Çıxış zamanı xəta baş verdi' };
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

/**
 * Get profile details by user ID.
 * IDOR Protection: Caller must be the account owner or staff (admin/manager).
 */
export async function getProfile(userId: string) {
  try {
    const cleanId = validateId(userId, 'İstifadəçi ID');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: 'Giriş edilməyib (401 Unauthorized)' };
    }

    const adminSupabase = createAdminSupabaseClient();

    // If requesting another user's profile, check if caller is staff
    if (authUser.id !== cleanId) {
      const { data: callerProfile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'manager')) {
        return { success: false, error: 'İcazəsiz əməliyyat: Başqa istifadəçinin profilinə baxış icazəniz yoxdur (403 Forbidden)' };
      }
    }

    const { data, error } = await adminSupabase
      .from('profiles')
      .select('*, customer_groups(*)')
      .eq('id', cleanId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('getProfile Error:', error.message);
    return { success: false, error: error.message || 'Profil məlumatı tapılmadı' };
  }
}

/**
 * Get all profiles for user management.
 * BFLA Protection: Requires Staff (Admin / Manager) access.
 */
export async function getAllProfiles() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();
    
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getAllProfiles Error:', error.message);
    return { success: false, error: error.message || 'İstifadəçilər yüklənərkən xəta baş verdi' };
  }
}

/**
 * Update Profile Information & Roles
 * Security Protections:
 * - Regular users can ONLY update their own name/phone (role changes are strictly ignored/stripped).
 * - Role escalation (changing role to manager, admin, courier) requires Super-Admin (`requireAdmin`).
 * - All changes are validated, sanitized, and logged to audit_logs.
 */
export async function updateProfile(userId: string, payload: Partial<{
  full_name: string;
  phone: string;
  role: string;
}>) {
  try {
    const cleanId = validateId(userId, 'İstifadəçi ID');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: 'Giriş edilməyib (401 Unauthorized)' };
    }

    const adminSupabase = createAdminSupabaseClient();

    // Check caller profile
    const { data: callerProfile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single();

    const isSelf = authUser.id === cleanId;
    const isCallerAdmin = callerProfile?.role === 'admin';
    const isCallerStaff = callerProfile?.role === 'admin' || callerProfile?.role === 'manager';

    if (!isSelf && !isCallerStaff) {
      return { success: false, error: 'İcazəsiz əməliyyat: Bu profili redaktə etmək icazəniz yoxdur (403 Forbidden)' };
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (payload.full_name !== undefined) {
      const cleanName = sanitizeInput(payload.full_name).trim();
      if (cleanName.length < 2) throw new Error('Ad və soyad ən azı 2 simvol olmalıdır.');
      updateData.full_name = cleanName;
    }

    if (payload.phone !== undefined) {
      updateData.phone = sanitizeInput(payload.phone).trim().replace(/[^0-9+]/g, '');
    }

    // Role change protection (Privilege Escalation prevention)
    if (payload.role !== undefined) {
      if (!isCallerAdmin) {
        if (!isSelf) {
          throw new Error('İcazəsiz əməliyyat: Yalnız baş admin istifadəçi rollarını dəyişə bilər (403 Forbidden)');
        }
        // If self-update by non-admin, silently ignore role manipulation attempt
      } else {
        const allowedRoles = ['customer', 'manager', 'admin', 'courier'] as const;
        updateData.role = validateEnum(payload.role, allowedRoles, 'İstifadəçi Rolu');
      }
    }

    const { data, error } = await adminSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    // Write audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_profile',
        entity_type: 'profile',
        entity_id: cleanId,
        details: { updated_fields: Object.keys(updateData), new_values: updateData }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning in updateProfile:', auditErr);
    }

    revalidatePath('/[locale]/admin/users', 'page');
    return { success: true, data };
  } catch (error: any) {
    console.error('updateProfile Error:', error.message);
    return { success: false, error: error.message || 'Profil yenilənərkən xəta baş verdi' };
  }
}

/**
 * Get Loyalty Points History
 * IDOR Protection: User can only see their own loyalty history, unless staff.
 */
export async function getLoyaltyHistory(userId: string) {
  try {
    const cleanId = validateId(userId, 'İstifadəçi ID');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: 'Giriş edilməyib (401 Unauthorized)' };
    }

    const adminSupabase = createAdminSupabaseClient();

    if (authUser.id !== cleanId) {
      const { data: callerProfile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'manager')) {
        return { success: false, error: 'İcazəsiz əməliyyat (403 Forbidden)' };
      }
    }

    const { data, error } = await adminSupabase
      .from('loyalty_points_history')
      .select('*')
      .eq('user_id', cleanId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getLoyaltyHistory Error:', error.message);
    return { success: false, error: error.message || 'Loyallıq tarixçəsi yüklənmədi' };
  }
}

/**
 * Get Referral Records
 * IDOR Protection: User can only see their own referral records, unless staff.
 */
export async function getReferralRecords(userId: string) {
  try {
    const cleanId = validateId(userId, 'İstifadəçi ID');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: 'Giriş edilməyib (401 Unauthorized)' };
    }

    const adminSupabase = createAdminSupabaseClient();

    if (authUser.id !== cleanId) {
      const { data: callerProfile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'manager')) {
        return { success: false, error: 'İcazəsiz əməliyyat (403 Forbidden)' };
      }
    }

    const { data, error } = await adminSupabase
      .from('referral_records')
      .select('*, referrer:profiles!referral_records_referrer_id_fkey(id, full_name, email), referred:profiles!referral_records_referred_id_fkey(id, full_name, email)')
      .or(`referrer_id.eq.${cleanId},referred_id.eq.${cleanId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getReferralRecords Error:', error.message);
    return { success: false, error: error.message || 'Dəvət qeydləri yüklənmədi' };
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
    const cleanSubject = sanitizeInput(payload.subject || '').trim();
    const cleanMessage = sanitizeInput(payload.message || '').trim();

    if (!cleanSubject || cleanSubject.length < 3) {
      return { success: false, error: 'Mövzu ən azı 3 simvol olmalıdır.' };
    }
    if (!cleanMessage || cleanMessage.length < 5) {
      return { success: false, error: 'Müraciət mətni ən azı 5 simvol olmalıdır.' };
    }

    const allowedPriorities = ['low', 'medium', 'high', 'critical'] as const;
    const priority = payload.priority ? validateEnum(payload.priority, allowedPriorities, 'Prioritet') : 'medium';

    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Authenticated user_id resolution prevents spoofing
    const effectiveUserId = authUser?.id || (payload.user_id ? validateId(payload.user_id) : null);

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('tickets')
      .insert({
        user_id: effectiveUserId,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'open',
        priority: priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('createSupportTicket Error:', error.message);
    return { success: false, error: error.message || 'Müraciət göndərilərkən xəta baş verdi' };
  }
}

export async function getSupportTickets(userId: string) {
  try {
    const cleanId = validateId(userId, 'İstifadəçi ID');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: 'Giriş edilməyib (401 Unauthorized)' };
    }

    const adminSupabase = createAdminSupabaseClient();

    if (authUser.id !== cleanId) {
      const { data: callerProfile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'manager')) {
        return { success: false, error: 'İcazəsiz əməliyyat (403 Forbidden)' };
      }
    }

    const { data, error } = await adminSupabase
      .from('tickets')
      .select('*')
      .eq('user_id', cleanId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getSupportTickets Error:', error.message);
    return { success: false, error: error.message || 'Müraciətlər yüklənmədi' };
  }
}
