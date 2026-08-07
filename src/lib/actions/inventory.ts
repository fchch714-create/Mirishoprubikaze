'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
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
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, warehouses: data as Warehouse[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Create Warehouse
export async function createWarehouse(name: string, location: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('warehouses')
      .insert({ name, location, is_active: true })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/inventory');
    return { success: true, warehouse: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Update Warehouse
export async function updateWarehouse(id: string, name: string, location: string, is_active: boolean) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('warehouses')
      .update({ name, location, is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/admin/inventory');
    return { success: true, warehouse: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Delete Warehouse
export async function deleteWarehouse(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/inventory');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Get Inventory Status (with Warehouse & Variant details joined)
export async function getInventoryStatus() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // First fetch inventory
    const { data: inv, error: invError } = await supabase
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
    return { success: false, error: error.message };
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
    const supabase = await createServerSupabaseClient();

    // Verify quantity is positive
    if (payload.quantity <= 0) {
      return { success: false, error: 'Miqdar sıfırdan böyük olmalıdır.' };
    }

    // 1. Insert movement record
    const { data: movement, error: mError } = await supabase
      .from('inventory_movements')
      .insert({
        warehouse_id: payload.warehouse_id,
        target_warehouse_id: payload.target_warehouse_id || null,
        variant_id: payload.variant_id,
        movement_type: payload.movement_type,
        quantity: payload.quantity,
        reason: payload.reason,
      })
      .select()
      .single();

    if (mError) throw mError;

    // 2. Adjust warehouse inventory quantities and variant quantities
    if (payload.movement_type === 'in') {
      await adjustWarehouseStock(supabase, payload.warehouse_id, payload.variant_id, payload.quantity);
      await adjustVariantStock(supabase, payload.variant_id, payload.quantity);
    } else if (payload.movement_type === 'out' || payload.movement_type === 'damaged') {
      await adjustWarehouseStock(supabase, payload.warehouse_id, payload.variant_id, -payload.quantity);
      await adjustVariantStock(supabase, payload.variant_id, -payload.quantity);
    } else if (payload.movement_type === 'transfer' && payload.target_warehouse_id) {
      // Deduct from source warehouse
      await adjustWarehouseStock(supabase, payload.warehouse_id, payload.variant_id, -payload.quantity);
      // Add to target warehouse
      await adjustWarehouseStock(supabase, payload.target_warehouse_id, payload.variant_id, payload.quantity);
      // Total central stock remains unchanged for transfer
    } else if (payload.movement_type === 'reserve') {
      // Reserve items (deduct from available warehouse stock, deduct from variant stock)
      await adjustWarehouseStock(supabase, payload.warehouse_id, payload.variant_id, -payload.quantity);
      await adjustVariantStock(supabase, payload.variant_id, -payload.quantity);
    }

    revalidatePath('/admin/inventory');
    return { success: true, movement };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    // If it doesn't exist, insert new inventory record (only if positive delta)
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
    const supabase = await createServerSupabaseClient();
    const { data: variants, error } = await supabase
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
    return { success: false, error: error.message };
  }
}

// 8. Get Recent Movements list
export async function getRecentMovements() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: movements, error } = await supabase
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
    return { success: false, error: error.message };
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
    const current = await getSettings('inventory');
    const existingData = (current.success && current.data) ? current.data : {};
    const updatedData = { ...existingData, global_reorder_point: reorderPoint };
    const res = await updateSettings('inventory', updatedData);
    if (!res.success) throw new Error(res.error);
    revalidatePath('/[locale]/admin/inventory', 'page');
    return { success: true, reorderPoint };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
