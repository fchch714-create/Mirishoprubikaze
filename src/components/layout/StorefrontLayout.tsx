'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { AuthModal } from '@/components/auth/AuthModal';
import TrafficTracker from '@/components/analytics/TrafficTracker';
import type { ApplicationDictionary } from '@/types/application.types';
import { MessageCircle } from 'lucide-react';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  dict: ApplicationDictionary;
  locale: string;
}

export function StorefrontLayout({ children, dict, locale }: StorefrontLayoutProps) {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = pathname ? pathname.split('/').includes('admin') : false;

  if (isAdmin) {
    return <main id="main-content">{children}</main>;
  }

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen pb-[96px] md:pb-0">
        <main id="main-content" className="flex-grow pb-[96px] md:pb-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[96px] md:pb-0 relative">
      <TrafficTracker />
      <Header dict={dict} locale={locale} />
      <main id="main-content" className="flex-grow pb-[96px] md:pb-0">{children}</main>
      <Footer dict={dict} locale={locale} />
      
      {/* Floating Support Button situated cleanly above fixed mobile bottom nav with safe area spacing */}
      <a
        href="https://wa.me/994506684925"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[80px] sm:bottom-24 md:bottom-8 right-3 sm:right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white p-2.5 sm:p-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center group border border-white/30 backdrop-blur-xs ring-4 ring-black/5"
        aria-label="Köməkçi WhatsApp Dəstək"
        title="Köməkçi Dəstək Xətti"
      >
        <MessageCircle className="w-5 h-5 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
          Dəstək
        </span>
      </a>

      <MobileBottomNav dict={dict} locale={locale} />
      <AuthModal />
    </div>
  );
}
