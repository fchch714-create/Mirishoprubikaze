'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  requireStaff, 
  sanitizeInput, 
  validateId, 
  validateEnum 
} from '@/lib/security';
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

/**
 * 1. Get unified customers CRM list
 * BFLA / PII Protection: Requires Staff (Admin / Manager) access.
 */
export async function getCustomersCRM() {
  try {
    const authUser = await requireStaff();
    const adminSupabase = createAdminSupabaseClient();

    // Fetch all registered user profiles
    const { data: profiles, error: pError } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, phone, created_at, customer_type, crm_segment, crm_notes')
      .order('created_at', { ascending: false });

    if (pError) throw pError;

    // Fetch all orders
    const { data: orders, error: oError } = await adminSupabase
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
          type: (p.customer_type as 'B2C' | 'B2B') || 'B2C',
          segment: (p.crm_segment as 'New' | 'Regular' | 'VIP' | 'Wholesale' | 'Churn Risk') || 'Regular',
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
          const guestPhoneClean = o.phone ? o.phone.replace(/[^0-9]/g, '') : '';
          customerMap.set(key, {
            id: `GUEST-${guestPhoneClean || o.id.slice(0, 8)}`,
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
        cust.ltv += Math.max(0, Number(o.total || 0));
        cust.ordersList.push({
          id: o.id,
          total: Math.max(0, Number(o.total || 0)),
          created_at: o.created_at
        });

        // Dynamic CRM segmentation if not manually set before
        if (cust.segment === 'Regular' || !cust.segment) {
          if (cust.ltv >= 100 || cust.ordersCount >= 3) {
            cust.segment = 'VIP';
          } else if (cust.ordersCount === 1) {
            cust.segment = 'New';
          }
        }
      }
    }

    return { success: true, customers: Array.from(customerMap.values()) };
  } catch (error: any) {
    console.error('getCustomersCRM Error:', error.message);
    return { success: false, error: error.message || 'Müştəri CRM məlumatları yüklənərkən xəta baş verdi' };
  }
}

/**
 * 2. Update CRM values (notes, segment, type) for a specific user profile
 * Security: Requires Staff access, validates enum values, sanitizes notes, and records audit logs.
 */
export async function updateCustomerCRM(id: string, payload: {
  customer_type?: 'B2C' | 'B2B';
  crm_segment?: 'New' | 'Regular' | 'VIP' | 'Wholesale' | 'Churn Risk';
  crm_notes?: string;
}) {
  try {
    const authUser = await requireStaff();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Müştəri ID mütləqdir.' };
    }

    if (id.startsWith('GUEST-')) {
      return { 
        success: false, 
        error: 'Qonaq müştərilərin qeydlərini redaktə etmək üçün əvvəlcə onların qeydiyyatdan keçməsi lazımdır.' 
      };
    }

    const cleanId = validateId(id, 'Müştəri ID');
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (payload.customer_type !== undefined) {
      updateData.customer_type = validateEnum(payload.customer_type, ['B2C', 'B2B'], 'Müştəri Növü');
    }

    if (payload.crm_segment !== undefined) {
      updateData.crm_segment = validateEnum(
        payload.crm_segment, 
        ['New', 'Regular', 'VIP', 'Wholesale', 'Churn Risk'], 
        'CRM Seqmenti'
      );
    }

    if (payload.crm_notes !== undefined) {
      updateData.crm_notes = sanitizeInput(payload.crm_notes).trim();
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    // Record Audit Log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_crm_profile',
        entity_type: 'customer_crm',
        entity_id: cleanId,
        details: { updated_fields: Object.keys(updateData), values: updateData }
      }]);
    } catch (auditErr) {
      console.warn('Audit logging warning in updateCustomerCRM:', auditErr);
    }

    revalidatePath('/[locale]/admin/customers', 'page');
    revalidatePath('/[locale]/admin/customers/[id]', 'page');
    
    return { success: true, profile: data };
  } catch (error: any) {
    console.error('updateCustomerCRM Error:', error.message);
    return { success: false, error: error.message || 'CRM məlumatları yenilənərkən xəta baş verdi' };
  }
}
