'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
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
  service_name?: string; // Derived joined name
}

// 1. Get all active & inactive services
export async function getServices() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Fallback if DB list is empty, return seed data shape
    return { success: true, services: (data as ServiceDB[]) || [] };
  } catch (error: any) {
    return { success: false, error: error.message, services: [] };
  }
}

// 2. Create service
export async function createService(payload: {
  name_az: string;
  price: number;
  description: string;
  is_active?: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .insert([{
        name_az: payload.name_az,
        price: payload.price,
        description: payload.description,
        is_active: payload.is_active ?? true
      }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/services');
    return { success: true, service: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Update service
export async function updateService(id: string, payload: {
  name_az: string;
  price: number;
  description: string;
  is_active: boolean;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('services')
      .update({
        name_az: payload.name_az,
        price: payload.price,
        description: payload.description,
        is_active: payload.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/services');
    return { success: true, service: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Delete service
export async function deleteService(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/services');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Get all service orders with joined service details
export async function getServiceOrders() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
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
    return { success: false, error: error.message, orders: [] };
  }
}

// 6. Create service order (user booking)
export async function createServiceOrder(payload: {
  service_id: string;
  customer_name: string;
  customer_phone: string;
  price: number;
  notes?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('service_orders')
      .insert([{
        service_id: payload.service_id,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        price: payload.price,
        status: 'pending',
        notes: payload.notes
      }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/services');
    return { success: true, order: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Update service order status
export async function updateServiceOrderStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('service_orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/services');
    return { success: true, order: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
