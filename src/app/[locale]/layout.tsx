import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/dictionaries';
import { StorefrontLayout } from '@/components/layout/StorefrontLayout';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rubikshop.az | Speedcubing E-Commerce',
  description: 'Premium speedcubing products.',
  manifest: '/manifest.json',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-only-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-orange-600 focus:text-white focus:p-3 focus:rounded-md focus:z-50">Skip to content</a>
      <StorefrontLayout dict={dict} locale={locale}>{children}</StorefrontLayout>
    </>
  );
}
