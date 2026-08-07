import * as React from 'react';
import { TrackOrderClient } from '@/components/track-order/TrackOrderClient';

export default async function TrackOrderPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <TrackOrderClient locale={locale} />;
}
