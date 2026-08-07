export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from 'react';
import SupplierReportClient from '@/components/admin/preorders/SupplierReportClient';
import { getSupplierReportAction } from '@/lib/actions/preorders';

interface SupplierReportPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SupplierReportPage({ params }: SupplierReportPageProps) {
  const { locale } = await params;

  const res = await getSupplierReportAction();

  return (
    <SupplierReportClient
      locale={locale}
      initialReport={res.report || []}
      totalUnitsToOrder={res.total_units_to_order || 0}
    />
  );
}
