// src/app/api/webhooks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/security';

/**
 * Enterprise Webhook Route Handler
 * Supports external integrations like Payment Processors (Stripe, GoldenPay),
 * Accounting software (1C ERP), or Courier service updates (Azerpost).
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;
    
    // 1. Signature or Token Verification
    const authHeader = headers.get('authorization') || '';
    const webhookSecret = process.env.WEBHOOK_SECRET || 'fallback_secret_key_for_dev';
    
    // Basic verification check
    if (authHeader !== `Bearer ${webhookSecret}`) {
      console.warn('Webhook Unauthorized: Signatures do not match.');
      return NextResponse.json({ error: 'İcazəsiz daxilolma. Webhook açarı yanlışdır.' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = sanitizeInput(payload.event || '');

    // Initialize elevated Admin Supabase client to bypass standard RLS for backend integrations
    const supabaseAdmin = createAdminSupabaseClient();

    // 2. Route event to corresponding integration domain
    switch (event) {
      case 'payment.succeeded': {
        const { order_id, transaction_id, amount, payment_method } = payload.data || {};
        if (!order_id || !amount) {
          return NextResponse.json({ error: 'payment.succeeded hadisəsi üçün məlumat əskikdir.' }, { status: 400 });
        }

        // Insert payment log
        const { error: payError } = await supabaseAdmin.from('payments').insert({
          order_id,
          payment_method: payment_method || 'online',
          transaction_id: transaction_id || null,
          status: 'completed',
          amount: Number(amount),
        });

        if (payError) throw payError;

        // Update Order payment_status
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'paid' })
          .eq('id', order_id);

        if (orderError) throw orderError;

        // Log to Audit logs
        await supabaseAdmin.from('audit_logs').insert({
          action: 'payment_webhook_succeeded',
          table_name: 'orders',
          record_id: order_id,
          new_values: { order_id, amount, transaction_id },
        });

        break;
      }

      case 'inventory.sync_1c': {
        const { warehouse_id, variant_sku, stock_quantity } = payload.data || {};
        if (!warehouse_id || !variant_sku || stock_quantity === undefined) {
          return NextResponse.json({ error: 'inventory.sync_1c hadisəsi üçün məlumat əskikdir.' }, { status: 400 });
        }

        // Lookup variant by SKU
        const { data: variant, error: varError } = await supabaseAdmin
          .from('variants')
          .select('id')
          .eq('sku', variant_sku)
          .single();

        if (varError || !variant) {
          return NextResponse.json({ error: `Variant SKU tapılmadı: ${variant_sku}` }, { status: 404 });
        }

        // Update inventory count
        const { error: invError } = await supabaseAdmin
          .from('inventory')
          .upsert({
            warehouse_id,
            variant_id: variant.id,
            quantity: Number(stock_quantity),
          }, { onConflict: 'warehouse_id,variant_id' });

        if (invError) throw invError;

        // Sync main variant aggregate count as well
        await supabaseAdmin
          .from('variants')
          .update({ stock: Number(stock_quantity) })
          .eq('id', variant.id);

        // Audit action
        await supabaseAdmin.from('audit_logs').insert({
          action: 'inventory_webhook_sync_1c',
          table_name: 'inventory',
          record_id: variant.id,
          new_values: { warehouse_id, variant_sku, stock_quantity },
        });

        break;
      }

      case 'shipping.status_update': {
        const { tracking_number, status, carrier, order_id } = payload.data || {};
        if (!order_id || !status) {
          return NextResponse.json({ error: 'shipping.status_update hadisəsi üçün məlumat əskikdir.' }, { status: 400 });
        }

        // Acceptable shipping status formats mapping to DB enum
        const mappedStatusMap: Record<string, 'pending' | 'shipped' | 'delivered' | 'returned'> = {
          'shipped': 'shipped',
          'in_transit': 'shipped',
          'delivered': 'delivered',
          'completed': 'delivered',
          'returned': 'returned',
          'failed': 'returned',
        };

        const mappedStatus = mappedStatusMap[status.toLowerCase()] || 'pending';

        // Update shipment
        const { error: shipError } = await supabaseAdmin
          .from('shipments')
          .upsert({
            order_id,
            tracking_number: tracking_number || null,
            carrier: carrier || 'post_delivery',
            status: mappedStatus,
          }, { onConflict: 'order_id' });

        if (shipError) throw shipError;

        // Sync main Order status
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .update({ shipping_status: mappedStatus })
          .eq('id', order_id);

        if (orderError) throw orderError;

        // Audit action
        await supabaseAdmin.from('audit_logs').insert({
          action: 'shipping_webhook_status_update',
          table_name: 'orders',
          record_id: order_id,
          new_values: { order_id, tracking_number, status, mappedStatus },
        });

        break;
      }

      default:
        console.warn(`Dəstəklənməyən Webhook Hadisəsi: ${event}`);
        return NextResponse.json({ error: `Dəstəklənməyən hadisə tipi: ${event}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Webhook hadisəsi (${event}) uğurla emal edildi.` });
  } catch (error: any) {
    console.error('Webhook process error:', error);
    return NextResponse.json({ error: error.message || 'Daxili sistem xətası' }, { status: 500 });
  }
}
