import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getDictionary } from '@/i18n/dictionaries';

interface AccountLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <div className="bg-background pb-6 md:pb-10">
      {/* Breadcrumbs Banner */}
      <div className="bg-muted/40 py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-rubik-brand transition-colors">
            Ana Səhifə
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">Müştəri Kabineti</span>
        </div>
      </div>

      {/* Main Grid Wrappers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
        {children}
      </div>
    </div>
  );
}
