'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  sanitizeInput, 
  validateId, 
  validateEnum, 
  requireAuth, 
  requireStaff 
} from '@/lib/security';
import { revalidatePath } from 'next/cache';

/**
 * Submit a customer support ticket.
 * Allows authenticated users or guest submissions with a valid email.
 */
export async function createSupportTicket(subject: string, message: string, email?: string) {
  try {
    const cleanSubject = sanitizeInput(subject || '').trim();
    const cleanMessage = sanitizeInput(message || '').trim();

    if (!cleanSubject || cleanSubject.length < 3) {
      return { success: false, error: 'Mövzu ən azı 3 simvol olmalıdır.' };
    }
    if (cleanSubject.length > 200) {
      return { success: false, error: 'Mövzu maksimum 200 simvol ola bilər.' };
    }

    if (!cleanMessage || cleanMessage.length < 5) {
      return { success: false, error: 'Müraciət mətni ən azı 5 simvol olmalıdır.' };
    }
    if (cleanMessage.length > 5000) {
      return { success: false, error: 'Müraciət mətni maksimum 5000 simvol ola bilər.' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let cleanEmail = email ? sanitizeInput(email).trim().toLowerCase() : null;
    if (cleanEmail && !cleanEmail.includes('@')) {
      return { success: false, error: 'Düzgün əlaqə e-poçtu daxil edilməlidir.' };
    }

    const contactEmail = cleanEmail || user?.email || null;
    if (!user && !contactEmail) {
      return { success: false, error: 'Qonaq müraciəti üçün əlaqə e-poçt ünvanı mütləqdir.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('tickets')
      .insert({
        user_id: user?.id || null,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'open',
        priority: 'medium',
        contact_email: contactEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath('/[locale]/account', 'page');
    revalidatePath('/[locale]/admin/support', 'page');

    return { success: true, ticket: data };
  } catch (error: any) {
    console.error('createSupportTicket Error:', error.message);
    return { success: false, error: error.message || 'Sorğu göndərilərkən xəta baş verdi.' };
  }
}

/**
 * Get current authenticated user's support tickets.
 * IDOR Protection: Strictly fetches tickets for the authenticated caller.
 */
export async function getUserTicketsAction() {
  try {
    const authUser = await requireAuth();
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from('tickets')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, tickets: data || [] };
  } catch (error: any) {
    console.error('getUserTicketsAction Error:', error.message);
    return { success: false, tickets: [], error: error.message || 'Müraciətlər yüklənmədi' };
  }
}

/**
 * Get all support tickets for administration.
 * BFLA Protection: Requires Staff (Admin / Manager) access.
 */
export async function getAllTicketsAdminAction(statusFilter?: string) {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    let query = adminSupabase
      .from('tickets')
      .select('*, profiles(full_name, email, phone)')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', sanitizeInput(statusFilter));
    }

    const { data, error } = await query;
    if (error) {
      // Fallback if profiles FK is missing
      const { data: fbData, error: fbErr } = await adminSupabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fbErr) throw fbErr;
      return { success: true, tickets: fbData || [] };
    }

    return { success: true, tickets: data || [] };
  } catch (error: any) {
    console.error('getAllTicketsAdminAction Error:', error.message);
    return { success: false, tickets: [], error: error.message || 'Dəstək müraciətləri yüklənmədi' };
  }
}

/**
 * Update support ticket status and priority.
 * Security: Requires Staff access and records audit log.
 */
export async function updateTicketStatusAction(
  ticketId: string, 
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  priority?: 'low' | 'medium' | 'high' | 'critical'
) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(ticketId, 'Müraciət ID');

    const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'] as const;
    const validatedStatus = validateEnum(status, allowedStatuses, 'Status');

    const updatePayload: Record<string, any> = {
      status: validatedStatus,
      updated_at: new Date().toISOString()
    };

    if (priority) {
      const allowedPriorities = ['low', 'medium', 'high', 'critical'] as const;
      updatePayload.priority = validateEnum(priority, allowedPriorities, 'Prioritet');
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    // Record audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_ticket_status',
        entity_type: 'ticket',
        entity_id: cleanId,
        details: updatePayload
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/support', 'page');
    revalidatePath('/[locale]/account', 'page');

    return { success: true, ticket: data };
  } catch (error: any) {
    console.error('updateTicketStatusAction Error:', error.message);
    return { success: false, error: error.message || 'Müraciət statusu yenilənmədi' };
  }
}
