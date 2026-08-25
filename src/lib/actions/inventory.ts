'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { 
  requireStaff, 
  validateId, 
  sanitizeInput, 
  validateNonNegativeInt,
  validateEnum
} from '@/lib/security';
import { revalidatePath } from 'next/cache';
import { getSettings, updateSettings } from '@/lib/actions/settings';

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  warehouse_id: string;
  variant_id: string;
  quantity: number;
  warehouse_name?: string;
  variant_sku?: string;
  product_name?: string;
  variant_stock?: number;
}

export interface InventoryMovement {
  id: string;
  warehouse_id: string;
  target_warehouse_id?: string | null;
  variant_id: string;
  movement_type: 'in' | 'out' | 'transfer' | 'damaged' | 'reserve';
  quantity: number;
  reason: string | null;
  created_at: string;
}

// 1. Get Warehouses
export async function getWarehouses() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('warehouses')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, warehouses: (data || []) as Warehouse[] };
  } catch (error: any) {
    console.error('getWarehouses Error:', error.message);
    return { success: false, error: error.message || 'Anbarlar yüklənmədi', warehouses: [] };
  }
}

// 2. Create Warehouse
export async function createWarehouse(name: string, location: string) {
  try {
    const authUser = await requireStaff();
    const cleanName = sanitizeInput(name || '').trim();
    const cleanLocation = sanitizeInput(location || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Anbar adı minimum 2 simvol olmalıdır.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('warehouses')
      .insert({ 
        name: cleanName, 
        location: cleanLocation || null, 
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'create_warehouse',
        entity_type: 'warehouse',
        entity_id: data.id,
        details: { name: cleanName, location: cleanLocation }
      }]);
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/inventory', 'page');
    return { success: true, warehouse: data };
  } catch (error: any) {
    console.error('createWarehouse Error:', error.message);
    return { success: false, error: error.message || 'Anbar yaradıla bilmədi' };
  }
}

// 3. Update Warehouse
export async function updateWarehouse(id: string, name: string, location: string, is_active: boolean) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(id, 'Anbar ID');
    const cleanName = sanitizeInput(name || '').trim();
    const cleanLocation = sanitizeInput(location || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Anbar adı minimum 2 simvol olmalıdır.' };
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from('warehouses')
      .update({ 
        name: cleanName, 
        location: cleanLocation || null, 
        is_active: Boolean(is_active), 
        updated_at: new Date().toISOString() 
      })
      .eq('id', cleanId)
      .select()
      .single();

    if (error) throw error;

    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'update_warehouse',
        entity_type: 'warehouse',
        entity_id: cleanId,
        details: { name: cleanName, is_active }
      }]);
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/inventory', 'page');
    return { success: true, warehouse: data };
  } catch (error: any) {
    console.error('updateWarehouse Error:', error.message);
    return { success: false, error: error.message || 'Anbar yenilənmədi' };
  }
}

// 4. Delete Warehouse
export async function deleteWarehouse(id: string) {
  try {
    const authUser = await requireStaff();
    const cleanId = validateId(id, 'Anbar ID');

    const adminSupabase = createAdminSupabaseClient();
    const { error } = await adminSupabase
      .from('warehouses')
      .delete()
      .eq('id', cleanId);

    if (error) throw error;

    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'delete_warehouse',
        entity_type: 'warehouse',
        entity_id: cleanId,
        details: { deleted: true }
      }]);
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/inventory', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('deleteWarehouse Error:', error.message);
    return { success: false, error: error.message || 'Anbar silinə bilmədi' };
  }
}

// 5. Get Inventory Status (with Warehouse & Variant details joined)
export async function getInventoryStatus() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();
    
    // First fetch inventory
    const { data: inv, error: invError } = await adminSupabase
      .from('inventory')
      .select(`
        id,
        warehouse_id,
        variant_id,
        quantity,
        warehouses ( name ),
        variants ( sku, stock, products ( title_az ) )
      `);

    if (invError) throw invError;

    const formatted = (inv || []).map((item: any) => ({
      id: item.id,
      warehouse_id: item.warehouse_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      warehouse_name: item.warehouses?.name || 'Bilinməyən Anbar',
      variant_sku: item.variants?.sku || 'N/A',
      product_name: item.variants?.products?.title_az || 'Bilinməyən Məhsul',
      variant_stock: item.variants?.stock || 0,
    }));

    return { success: true, inventory: formatted as InventoryItem[] };
  } catch (error: any) {
    console.error('getInventoryStatus Error:', error.message);
    return { success: false, error: error.message || 'Stok məlumatları yüklənmədi', inventory: [] };
  }
}

// 6. Record Inventory Movement & Update stock balances
export async function addInventoryMovement(payload: {
  warehouse_id: string;
  variant_id: string;
  movement_type: 'in' | 'out' | 'transfer' | 'damaged' | 'reserve';
  quantity: number;
  reason: string;
  target_warehouse_id?: string;
}) {
  try {
    const authUser = await requireStaff();
    const cleanWarehouseId = validateId(payload.warehouse_id, 'Anbar ID');
    const cleanVariantId = validateId(payload.variant_id, 'Variant ID');
    const cleanType = validateEnum(
      payload.movement_type, 
      ['in', 'out', 'transfer', 'damaged', 'reserve'], 
      'Hərəkət növü'
    );
    const cleanQty = validateNonNegativeInt(payload.quantity, 'Miqdar');
    const cleanReason = sanitizeInput(payload.reason || '').trim();

    if (cleanQty <= 0) {
      return { success: false, error: 'Miqdar 0-dan böyük olmalıdır.' };
    }

    let cleanTargetWarehouseId: string | null = null;
    if (cleanType === 'transfer') {
      if (!payload.target_warehouse_id) {
        return { success: false, error: 'Transfer üçün hədəf anbar seçilməlidir.' };
      }
      cleanTargetWarehouseId = validateId(payload.target_warehouse_id, 'Hədəf Anbar ID');
      if (cleanTargetWarehouseId === cleanWarehouseId) {
        return { success: false, error: 'Hədəf anbar mənbə anbarla eyni ola bilməz.' };
      }
    }

    const adminSupabase = createAdminSupabaseClient();

    // 1. Insert movement record
    const { data: movement, error: mError } = await adminSupabase
      .from('inventory_movements')
      .insert({
        warehouse_id: cleanWarehouseId,
        target_warehouse_id: cleanTargetWarehouseId,
        variant_id: cleanVariantId,
        movement_type: cleanType,
        quantity: cleanQty,
        reason: cleanReason || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (mError) throw mError;

    // 2. Adjust warehouse inventory quantities and variant quantities
    if (cleanType === 'in') {
      await adjustWarehouseStock(adminSupabase, cleanWarehouseId, cleanVariantId, cleanQty);
      await adjustVariantStock(adminSupabase, cleanVariantId, cleanQty);
    } else if (cleanType === 'out' || cleanType === 'damaged') {
      await adjustWarehouseStock(adminSupabase, cleanWarehouseId, cleanVariantId, -cleanQty);
      await adjustVariantStock(adminSupabase, cleanVariantId, -cleanQty);
    } else if (cleanType === 'transfer' && cleanTargetWarehouseId) {
      // Deduct from source warehouse
      await adjustWarehouseStock(adminSupabase, cleanWarehouseId, cleanVariantId, -cleanQty);
      // Add to target warehouse
      await adjustWarehouseStock(adminSupabase, cleanTargetWarehouseId, cleanVariantId, cleanQty);
    } else if (cleanType === 'reserve') {
      await adjustWarehouseStock(adminSupabase, cleanWarehouseId, cleanVariantId, -cleanQty);
      await adjustVariantStock(adminSupabase, cleanVariantId, -cleanQty);
    }

    // Audit log
    try {
      await adminSupabase.from('audit_logs').insert([{
        user_id: authUser.id,
        action: 'inventory_movement',
        entity_type: 'inventory',
        entity_id: cleanVariantId,
        details: { movement_type: cleanType, quantity: cleanQty, warehouse_id: cleanWarehouseId, target_warehouse_id: cleanTargetWarehouseId }
      }]);
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    revalidatePath('/[locale]/admin/inventory', 'page');
    return { success: true, movement };
  } catch (error: any) {
    console.error('addInventoryMovement Error:', error.message);
    return { success: false, error: error.message || 'Hərəkət qeydə alına bilmədi' };
  }
}

// Helper: Adjust warehouse-specific inventory stock
async function adjustWarehouseStock(supabase: any, warehouseId: string, variantId: string, delta: number) {
  const { data: inv, error: fError } = await supabase
    .from('inventory')
    .select('id, quantity')
    .eq('warehouse_id', warehouseId)
    .eq('variant_id', variantId)
    .maybeSingle();

  if (fError) throw fError;

  if (inv) {
    const newQty = Math.max(0, Number(inv.quantity) + delta);
    await supabase
      .from('inventory')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', inv.id);
  } else {
    const qty = Math.max(0, delta);
    await supabase
      .from('inventory')
      .insert({
        warehouse_id: warehouseId,
        variant_id: variantId,
        quantity: qty
      });
  }
}

// Helper: Adjust central variant stock
async function adjustVariantStock(supabase: any, variantId: string, delta: number) {
  const { data: variant, error: fError } = await supabase
    .from('variants')
    .select('id, stock')
    .eq('id', variantId)
    .maybeSingle();

  if (fError) throw fError;
  if (variant) {
    const newStock = Math.max(0, Number(variant.stock) + delta);
    await supabase
      .from('variants')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', variantId);
  }
}

// 7. Get all products with variants for the operations dropdown selectors
export async function getProductsAndVariants() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();
    const { data: variants, error } = await adminSupabase
      .from('variants')
      .select(`
        id,
        sku,
        stock,
        product_id,
        products ( title_az )
      `);

    if (error) throw error;

    const formatted = (variants || []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      stock: v.stock,
      product_id: v.product_id,
      product_name: v.products?.title_az || 'Bilinməyən Məhsul',
    }));

    return { success: true, variants: formatted };
  } catch (error: any) {
    console.error('getProductsAndVariants Error:', error.message);
    return { success: false, error: error.message || 'Məhsullar yüklənmədi', variants: [] };
  }
}

// 8. Get Recent Movements list
export async function getRecentMovements() {
  try {
    await requireStaff();
    const adminSupabase = createAdminSupabaseClient();
    const { data: movements, error } = await adminSupabase
      .from('inventory_movements')
      .select(`
        id,
        warehouse_id,
        target_warehouse_id,
        variant_id,
        movement_type,
        quantity,
        reason,
        created_at,
        warehouses!warehouse_id ( name ),
        target:warehouses!target_warehouse_id ( name ),
        variants ( sku, products ( title_az ) )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const formatted = (movements || []).map((m: any) => ({
      id: m.id,
      warehouse_name: m.warehouses?.name || 'Bilinməyən Anbar',
      target_warehouse_name: m.target?.name || null,
      variant_sku: m.variants?.sku || 'N/A',
      product_name: m.variants?.products?.title_az || 'Bilinməyən Məhsul',
      movement_type: m.movement_type,
      quantity: m.quantity,
      reason: m.reason || '',
      created_at: m.created_at,
    }));

    return { success: true, movements: formatted };
  } catch (error: any) {
    console.error('getRecentMovements Error:', error.message);
    return { success: false, error: error.message || 'Hərəkətlər yüklənmədi', movements: [] };
  }
}

// 9. Get Global Reorder Point
export async function getGlobalReorderPoint() {
  try {
    const res = await getSettings('inventory');
    if (res.success && res.data && typeof res.data.global_reorder_point === 'number') {
      return { success: true, reorderPoint: res.data.global_reorder_point };
    }
    return { success: true, reorderPoint: 10 };
  } catch (error: any) {
    return { success: false, reorderPoint: 10, error: error.message };
  }
}

// 10. Update Global Reorder Point
export async function updateGlobalReorderPoint(reorderPoint: number) {
  try {
    await requireStaff();
    const validPoint = validateNonNegativeInt(reorderPoint, 'Kritik stok həddi');
    const current = await getSettings('inventory');
    const existingData = (current.success && current.data) ? current.data : {};
    const updatedData = { ...existingData, global_reorder_point: validPoint };
    const res = await updateSettings('inventory', updatedData);
    if (!res.success) throw new Error(res.error);
    revalidatePath('/[locale]/admin/inventory', 'page');
    return { success: true, reorderPoint: validPoint };
  } catch (error: any) {
    console.error('updateGlobalReorderPoint Error:', error.message);
    return { success: false, error: error.message };
  }
}

