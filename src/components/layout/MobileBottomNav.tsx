'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutGrid, Heart, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { useAuthUser } from '@/hooks/useAuthUser';
import type { ApplicationDictionary } from '@/types/application.types';

export function MobileBottomNav({ dict, locale }: { dict: ApplicationDictionary; locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  const items = useCartStore((state) => state.items);
  const totalItems = useMemo(() => items.reduce((total, item) => total + (item.quantity || 1), 0), [items]);
  
  const { user, userRole } = useAuthUser();
  const openModal = useAuthModalStore((state) => state.openModal);

  const handleAccountClick = React.useCallback(() => {
    if (!user) {
      openModal('login');
    } else if (userRole === 'admin' || userRole === 'manager') {
      router.push(`/${locale}/admin`);
    } else {
      router.push(`/${locale}/account`);
    }
  }, [user, userRole, locale, openModal, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      id: 'home',
      name: dict?.navigation?.home || (locale === 'en' ? 'Home' : (locale === 'ru' ? 'Главная' : 'Ana Səhifə')),
      href: `/${locale}`,
      icon: Home,
    },
    {
      id: 'catalog',
      name: dict?.navigation?.catalog || (locale === 'en' ? 'Catalog' : (locale === 'ru' ? 'Каталог' : 'Kataloq')), 
      href: `/${locale}/category`, 
      icon: LayoutGrid,
    },
    {
      id: 'wishlist',
      name: dict?.navigation?.wishlist || (locale === 'en' ? 'Wishlist' : (locale === 'ru' ? 'Избранное' : 'Seçilmişlər')),
      href: `/${locale}/wishlist`,
      icon: Heart,
    },
    {
      id: 'cart',
      name: dict?.navigation?.cart || (locale === 'en' ? 'Cart' : (locale === 'ru' ? 'Корзина' : 'Səbət')),
      href: `/${locale}/cart`,
      icon: ShoppingCart,
      badge: mounted && totalItems > 0 ? totalItems : undefined,
    },
    {
      id: 'account',
      name: dict?.navigation?.account || (locale === 'en' ? 'Account' : (locale === 'ru' ? 'Кабинет' : 'Kabinet')),
      href: `/${locale}/account`,
      icon: User,
    }
  ];

  if (!mounted) return null;

  const navContent = (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-[#FFFFFF] border-t border-[#EDEDED] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pointer-events-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-[64px] px-1 w-full max-w-7xl mx-auto">
        {navItems.map((item) => {
          // Stable, key-based route matching
          const isActive = item.id === 'home'
            ? pathname === `/${locale}` || pathname === `/${locale}/`
            : item.id === 'account'
              ? pathname.startsWith(`/${locale}/account`) || pathname.startsWith(`/${locale}/admin`)
              : pathname.startsWith(item.href);
          
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'account') {
                  handleAccountClick();
                } else {
                  router.push(item.href);
                }
              }}
              className={`relative flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] py-1 px-1 transition-all cursor-pointer ${
                isActive ? 'text-[#D8232A] font-semibold' : 'text-[#6B7280] hover:text-[#17181C]'
              }`}
              aria-label={item.name}
            >
              <div className="relative flex items-center justify-center p-1 rounded-full group-active:scale-95 transition-transform duration-100">
                <Icon className={`w-[22px] h-[22px] transition-transform ${isActive ? 'scale-110 text-[#D8232A]' : 'group-hover:scale-105'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black text-white bg-[#D8232A] border-2 border-[#FFFFFF] rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase mt-1 transition-all">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return createPortal(navContent, document.body);
}

