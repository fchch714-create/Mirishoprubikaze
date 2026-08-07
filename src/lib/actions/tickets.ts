'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function createSupportTicket(subject: string, message: string, email?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('tickets')
      .insert({
        user_id: user?.id || null,
        subject,
        message,
        status: 'open',
        contact_email: email || user?.email || null,
      });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('createSupportTicket Error:', error.message);
    return { success: false, error: 'Sorğu göndərilərkən xəta baş verdi.' };
  }
}
