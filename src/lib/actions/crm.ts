'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CRMOrder {
  id: string;
  total: number;
  created_at: string;
}

export interface CRMCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'B2C' | 'B2B';
  segment: 'New' | 'Regular' | 'VIP' | 'Wholesale' | 'Churn Risk';
  notes: string;
  ordersCount: number;
  ltv: number;
  registered: string;
  ordersList: CRMOrder[];
}

// 1. Get unified customers CRM list
export async function getCustomersCRM() {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch all registered user profiles
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, created_at, customer_type, crm_segment, crm_notes')
      .order('created_at', { ascending: false });

    if (pError) throw pError;

    // Fetch all orders
    const { data: orders, error: oError } = await supabase
      .from('orders')
      .select('id, user_id, email, phone, full_name, total, created_at')
      .order('created_at', { ascending: false });

    if (oError) throw oError;

    // Aggregate profiles and orders
    const customerMap = new Map<string, CRMCustomer>();

    // Process profiles first
    if (profiles) {
      for (const p of profiles) {
        if (!p.email) continue;
        const key = p.email.toLowerCase().trim();
        customerMap.set(key, {
          id: p.id,
          name: p.full_name || 'Qeydiyyatlı İstifadəçi',
          email: p.email,
          phone: p.phone || '',
          type: (p.customer_type as any) || 'B2C',
          segment: (p.crm_segment as any) || 'Regular',
          notes: p.crm_notes || '',
          ordersCount: 0,
          ltv: 0,
          registered: p.created_at ? p.created_at.slice(0, 10) : '',
          ordersList: []
        });
      }
    }

    // Process orders
    if (orders) {
      for (const o of orders) {
        if (!o.email) continue;
        const key = o.email.toLowerCase().trim();

        if (!customerMap.has(key)) {
          // Unregistered/Guest buyer CRM entry
          customerMap.set(key, {
            id: `GUEST-${o.phone.replace(/[^0-9]/g, '') || o.id.slice(0, 8)}`,
            name: o.full_name || 'Qonaq Alıcı',
            email: o.email,
            phone: o.phone || '',
            type: 'B2C',
            segment: 'Regular',
            notes: '',
            ordersCount: 0,
            ltv: 0,
            registered: o.created_at ? o.created_at.slice(0, 10) : '',
            ordersList: []
          });
        }

        const cust = customerMap.get(key)!;
        cust.ordersCount += 1;
        cust.ltv += Number(o.total || 0);
        cust.ordersList.push({
          id: o.id,
          total: Number(o.total),
          created_at: o.created_at
        });

        // Dynamic CRM segmentation if not manually set before
        if (cust.segment === 'Regular' || !cust.segment) {
          if (cust.ltv >= 100) {
            cust.segment = 'VIP';
          } else if (cust.ordersCount >= 3) {
            cust.segment = 'VIP';
          } else if (cust.ordersCount === 1) {
            cust.segment = 'New';
          }
        }
      }
    }

    return { success: true, customers: Array.from(customerMap.values()) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Update CRM values (notes, segment, type) for a specific user profile
export async function updateCustomerCRM(id: string, payload: {
  customer_type?: 'B2C' | 'B2B';
  crm_segment?: 'New' | 'Regular' | 'VIP' | 'Wholesale' | 'Churn Risk';
  crm_notes?: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();

    if (id.startsWith('GUEST-')) {
      return { 
        success: false, 
        error: 'Qonaq müştərilərin qeydlərini redaktə etmək üçün əvvəlcə onların qeydiyyatdan keçməsi lazımdır.' 
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        customer_type: payload.customer_type,
        crm_segment: payload.crm_segment,
        crm_notes: payload.crm_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/customers');
    return { success: true, profile: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
