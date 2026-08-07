export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from 'react';
import PreordersAdminClient from '@/components/admin/preorders/PreordersAdminClient';
import { getAdminPreordersAction } from '@/lib/actions/preorders';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface PreordersPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PreordersPage({ params }: PreordersPageProps) {
  const { locale } = await params;

  const [preordersRes, supabase] = await Promise.all([
    getAdminPreordersAction({ status: 'all' }),
    createServerSupabaseClient()
  ]);

  // Fetch products list for manual pre-order creation dropdown
  const { data: products } = await supabase
    .from('products')
    .select('id, title_az, title_en, price_azn, stock_quantity')
    .order('title_az', { ascending: true });

  return (
    <PreordersAdminClient
      locale={locale}
      initialPreorders={preordersRes.data || []}
      productsList={products || []}
    />
  );
}
