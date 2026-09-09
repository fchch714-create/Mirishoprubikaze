'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/auth/AuthModal';
import TrafficTracker from '@/components/analytics/TrafficTracker';
import type { ApplicationDictionary } from '@/types/application.types';
import { MessageCircle, Lock, Package } from 'lucide-react';

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

  const isCheckout = pathname ? pathname.includes('/checkout') : false;
  const isCart = pathname ? pathname.includes('/cart') : false;
  const isCartOrCheckout = isCheckout || isCart;
  const isProductPage = pathname ? pathname.includes('/product/') : false;

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen pb-[env(safe-area-inset-bottom,0px)]">
        <main id="main-content" className="flex-grow pb-[env(safe-area-inset-bottom,0px)]">{children}</main>
      </div>
    );
  }

  // Distraction-Free Closed Checkout Layout
  if (isCheckout) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-[env(safe-area-inset-bottom,0px)] relative">
        <TrafficTracker />
        
        {/* Minimal Distraction-Free Checkout Header */}
        <header className="w-full bg-card border-b border-border/80 sticky top-0 z-30 shadow-xs">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link 
              href={`/${locale}`} 
              className="flex items-center gap-2 group transition-opacity hover:opacity-90"
              title="Əsas Səhifəyə Qayıt"
            >
              <div className="w-7.5 h-7.5 rounded-lg bg-[#D8232A] text-white flex items-center justify-center font-black text-xs shadow-sm group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
              <span className="font-sans font-black text-[#D8232A] text-lg tracking-tight">
                RubikShop<span className="text-foreground text-xs font-bold ml-0.5">.az</span>
              </span>
            </Link>

            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{locale === 'en' ? '256-Bit SSL Secure Checkout' : locale === 'ru' ? 'Безопасная оплата 256-Bit SSL' : '256-Bit SSL Təhlükəsiz Sifariş'}</span>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-grow pb-[env(safe-area-inset-bottom,0px)]">
          {children}
        </main>

        {/* Minimal Checkout Footer */}
        <footer className="w-full border-t border-border/60 py-4 text-center text-xs text-muted-foreground bg-muted/20">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} RubikShop.az — Bütün hüquqlar qorunur.</span>
            <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
              <span>256-Bit SSL Şifrələmə</span>
              <span>100% Orijinal Məhsullar</span>
              <span>Sürətli Çatdırılma</span>
            </div>
          </div>
        </footer>

        <AuthModal />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[env(safe-area-inset-bottom,0px)] relative">
      <TrafficTracker />
      <Header dict={dict} locale={locale} />
      <main id="main-content" className="flex-grow pb-[env(safe-area-inset-bottom,0px)]">{children}</main>
      <Footer dict={dict} locale={locale} />
      
      {/* Floating WhatsApp Support Button (Strictly hidden on Cart and Checkout) */}
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
