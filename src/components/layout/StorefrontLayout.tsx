'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/CartDrawer';
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

  const isCartOrCheckout = pathname ? (pathname.includes('/cart') || pathname.includes('/checkout')) : false;
  const isProductPage = pathname ? pathname.includes('/product/') : false;

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen pb-[env(safe-area-inset-bottom,0px)]">
        <main id="main-content" className="flex-grow pb-[env(safe-area-inset-bottom,0px)]">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[env(safe-area-inset-bottom,0px)] relative">
      <TrafficTracker />
      <Header dict={dict} locale={locale} />
      <main id="main-content" className="flex-grow pb-[env(safe-area-inset-bottom,0px)]">{children}</main>
      <Footer dict={dict} locale={locale} />
      
      {/* Floating WhatsApp Support Button */}
      {!isCartOrCheckout && (
        <a
          href="https://wa.me/994506684925"
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed right-3 sm:right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white p-2.5 sm:p-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center group border border-white/30 backdrop-blur-xs ring-4 ring-black/5 ${
            isProductPage
              ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-8'
              : 'bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:bottom-8'
          }`}
          aria-label="Köməkçi WhatsApp Dəstək"
          title="Köməkçi Dəstək Xətti"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
            Dəstək
          </span>
        </a>
      )}

      <CartDrawer dict={dict} locale={locale} />
      <AuthModal />
    </div>
  );
}
