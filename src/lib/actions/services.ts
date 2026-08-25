'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  requireStaff, 
  validateId, 
  sanitizeInput, 
  validateNonNegativeNumber,
  validateEnum 
} from '@/lib/security';
import { revalidatePath } from 'next/cache';

export interface ServiceDB {
  id: string;
  name_az: string;
  name_en?: string;
  name_ru?: string;
  price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ServiceOrderDB {
  id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  service_name?: string;
}

// 1. Get all active services (Storefront & Admin)
export async function getServices() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, services: (data as ServiceDB[]) || [] };
  } catch (error: any) {
    console.error('getServices Error:', error.message);
    return { success: false, error: error.message, services: [] };
  }
}

// 2. Create service (Staff only)
export async function createService(payload: {
  name_az: string;
  price: number;
  description: string;
  is_active?: boolean;
}) {
  try {
    const authUser = await requireStaff();
    const cleanName = sanitizeInput(payload.name_az || '').trim();
    const cleanDesc = sanitizeInput(payload.description || '').trim();
    const cleanPrice = validateNonNegativeNumber(payload.price, 'Xidmət qiyməti');

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Xidmət adı minimum 2 simvol olmalıdır.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('services')
      .insert([{
        name_az: cleanName,
        price: cleanPrice,
        description: cleanDesc || null,
        is_active: payload.is_active ?? true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'create_service',
        entity_type: 'service',
        entity_id: data.id,
        details: { name_az: cleanName, price: cleanPrice }
      }]);
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/services', 'page');
    return { success: true, service: data };
  } catch (error: any) {
    console.error('createService Error:', error.message);
    return { success: false, error: error.message || 'Xidmət yaradıla bilmədi' };
  }
}

// 3. Update service (Staff only)
export async function updateService(id: string, payload: {
  name_az: string;
  price: number;
  description: string;
  is_active: boolean;
}) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(id, 'Xidmət ID');
    const cleanName = sanitizeInput(payload.name_az || '').trim();
    const cleanDesc = sanitizeInput(payload.description || '').trim();
    const cleanPrice = validateNonNegativeNumber(payload.price, 'Xidmət qiyməti');

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Xidmət adı minimum 2 simvol olmalıdır.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('services')
      .update({
        name_az: cleanName,
        price: cleanPrice,
        description: cleanDesc || null,
        is_active: Boolean(payload.is_active),
        updated_at: new Date().toISOString()
      })
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_service',
        entity_type: 'service',
        entity_id: cleanId,
        details: { name_az: cleanName, price: cleanPrice, is_active: payload.is_active }
      }]);
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/services', 'page');
    return { success: true, service: data };
  } catch (error: any) {
    console.error('updateService Error:', error.message);
    return { success: false, error: error.message || 'Xidmət yenilənmədi' };
  }
}

// 4. Delete service (Staff only)
export async function deleteService(id: string) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(id, 'Xidmət ID');

    const adminSupabase = createAdminSupabaseClient();
    const { error } = await adminSupabase
      .from('services')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;

    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'delete_service',
        entity_type: 'service',
        entity_id: cleanId,
        details: { deleted: true }
      }]);
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/services', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('deleteService Error:', error.message);
    return { success: false, error: error.message || 'Xidmət silinə bilmədi' };
  }
}

// 5. Get all service orders with joined service details (Staff only)
export async function getServiceOrders() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('service_orders')
      .select(`
        id,
        service_id,
        customer_name,
        customer_phone,
        price,
        status,
        notes,
        created_at,
        services(name_az)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((o: any) => ({
      id: o.id,
      service_id: o.service_id,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      price: Number(o.price),
      status: o.status,
      notes: o.notes,
      created_at: o.created_at,
      service_name: o.services?.name_az || 'Naməlum Xidmət'
    }));

    return { success: true, orders: formatted as ServiceOrderDB[] };
  } catch (error: any) {
    console.error('getServiceOrders Error:', error.message);
    return { success: false, error: error.message || 'Sifarişlər yüklənmədi', orders: [] };
  }
}

// 6. Create service order (Customer booking with server-side price verification)
export async function createServiceOrder(payload: {
  service_id: string;
  customer_name: string;
  customer_phone: string;
  notes?: string;
}) {
  try {
    const cleanServiceId = validateId(payload.service_id, 'Xidmət ID');
    const cleanName = sanitizeInput(payload.customer_name || '').trim();
    const cleanPhone = sanitizeInput(payload.customer_phone || '').trim();
    const cleanNotes = sanitizeInput(payload.notes || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Müştəri adı minimum 2 simvol olmalıdır.' };
    }
    if (!cleanPhone || cleanPhone.length < 7) {
      return { success: false, error: 'Düzgün telefon nömrəsi daxil edin.' };
    }

    const adminSupabase = createAdminSupabaseClient();

    // Server-authoritative price lookup (prevent price tampering)
    const { data: service, error: sError } = await adminSupabase
      .from('services')
      .select('id, price, is_active')
      .eq('id', cleanServiceId)
      .single();

    if (sError || !service) {
      return { success: false, error: 'Seçilən xidmət tapılmadı.' };
    }
    if (!service.is_active) {
      return { success: false, error: 'Bu xidmət hazırda aktiv deyil.' };
    }

    const authoritativePrice = Number(service.price || 0);

    const { data, error } = await adminSupabase
      .from('service_orders')
      .insert([{
        service_id: cleanServiceId,
        customer_name: cleanName,
        customer_phone: cleanPhone,
        price: authoritativePrice,
        status: 'pending',
        notes: cleanNotes || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/[locale]/admin/services', 'page');
    return { success: true, order: data };
  } catch (error: any) {
    console.error('createServiceOrder Error:', error.message);
    return { success: false, error: error.message || 'Xidmət sifarişi qəbul edilmədi' };
  }
}

// 7. Update service order status (Staff only)
export async function updateServiceOrderStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(id, 'Sifariş ID');
    const cleanStatus = validateEnum(
      status, 
      ['pending', 'in_progress', 'completed', 'cancelled'], 
      'Sifariş statusu'
    );

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('service_orders')
      .update({
        status: cleanStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_service_order_status',
        entity_type: 'service_order',
        entity_id: cleanId,
        details: { new_status: cleanStatus }
      }]);
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/services', 'page');
    return { success: true, order: data };
  } catch (error: any) {
    console.error('updateServiceOrderStatus Error:', error.message);
    return { success: false, error: error.message || 'Status yenilənmədi' };
  }
}

