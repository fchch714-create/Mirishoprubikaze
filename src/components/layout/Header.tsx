'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthUser } from '@/hooks/useAuthUser';
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Sparkles,
  Package,
  Heart,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Compass,
  HelpCircle,
  PhoneCall,
  MessageCircle,
  Layers,
} from 'lucide-react';
import { rubikTaxonomyGroups } from '@/lib/config/catalog';
import { useCartStore } from '@/store/useCartStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import type { ApplicationDictionary } from '@/types/application.types';
import { CartDrawer } from '@/components/CartDrawer';
import { SearchBar } from '@/components/layout/SearchBar';

interface HeaderProps {
  dict: ApplicationDictionary;
  locale: 'az' | 'en' | 'ru' | string;
}

export function Header({ dict, locale }: HeaderProps) {
  const [mounted, setMounted] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [openAccordion, setOpenAccordion] = React.useState<'cubes' | 'brands' | null>(null);
  const [isDrawerSearchOpen, setIsDrawerSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const isCubesExpanded = openAccordion === 'cubes';
  const isBrandsExpanded = openAccordion === 'brands';

  const toggleCubes = () => {
    setOpenAccordion((prev) => (prev === 'cubes' ? null : 'cubes'));
  };

  const toggleBrands = () => {
    setOpenAccordion((prev) => (prev === 'brands' ? null : 'brands'));
  };
  
  const { user, userRole, signOut: authSignOut } = useAuthUser();
  const openModal = useAuthModalStore((state) => state.openModal);

  const router = useRouter();
  const pathname = usePathname();

  const items = useCartStore((state) => state.items);
  const totalItems = React.useMemo(() => items.reduce((total, item) => total + (item.quantity || 1), 0), [items]);

  // Determine whether to show the mobile search sub-header
  const showMobileSearch = React.useMemo(() => {
    const cleanPath = pathname || '';
    const isHome = 
      cleanPath === '/' || 
      cleanPath === `/${locale}` || 
      cleanPath === `/${locale}/`;
    const isCategory = cleanPath.includes('/category');
    return isHome || isCategory;
  }, [pathname, locale]);

  const handleAccountClick = React.useCallback(() => {
    if (!user) {
      openModal('login');
    } else if (userRole === 'admin' || userRole === 'manager') {
      router.push(`/${locale}/admin`);
    } else {
      router.push(`/${locale}/account`);
    }
  }, [user, userRole, locale, openModal, router]);

  const handleSignOut = React.useCallback(async () => {
    await authSignOut(locale, router);
  }, [authSignOut, locale, router]);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    if (segments[1] === locale) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join('/'));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery)}`);
  };

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const t = (obj: { az: string; en: string; ru: string }) => {
    return obj[locale as keyof typeof obj] || obj.az;
  };

  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMenuOpen]);

  return (
    <React.Fragment>
      {/* Top Banner Accent - Hidden when mobile hamburger drawer is open */}
      {!isMenuOpen && (
        <div className="bg-[#D8232A] text-white text-[11px] sm:text-xs font-semibold py-2 px-3 sm:px-6 text-center tracking-wide flex items-center justify-center gap-2 leading-tight shadow-sm">
          <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-yellow-300" />
          <span className="whitespace-normal break-words">{dict.header?.promo_banner || "Rubikshop AZ — Azərbaycanda 1 nömrəli sürətli kub yarışı mağazası! Sürətli çatdırılma."}</span>
        </div>
      )}

      <header className={`sticky top-0 w-full bg-[#FFFFFF] border-b border-[#EDEDED] shadow-sm backdrop-blur-md ${isMenuOpen ? 'z-[99999]' : 'z-40'}`}>
        
        {/* DESKTOP LAYOUT ARCHITECTURE RULES */}
        <div className="hidden md:flex items-center justify-between bg-[#FFFFFF] border-b border-[#EDEDED] px-6 py-3.5 w-full gap-6">
          
          {/* LEFT SECTION */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 text-[#17181C] hover:text-[#D8232A] hover:bg-[#F6F6F8] rounded-lg transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Desktop Menu Toggle"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Brand Logo Link per Section I */}
            <Link href={`/${locale}`} className="flex items-center gap-2 group">
              {/* Mascot Icon */}
              <div className="w-8 h-8 rounded-lg bg-[#D8232A] text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <span className="font-sans font-black text-[#D8232A] text-xl md:text-2xl tracking-tight">
                RubikShop<span className="text-[#17181C] text-sm md:text-base font-bold ml-0.5">.az</span>
              </span>
            </Link>
          </div>

          {/* MIDDLE SECTION */}
          <div className="flex-1 max-w-xl mx-auto">
            <SearchBar
              locale={locale}
              placeholder={dict.header?.search_placeholder || "Məhsul axtar..."}
              buttonText={dict.header?.search_button || "Axtar"}
            />
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Account Shortcut */}
            <button
              onClick={handleAccountClick}
              className="p-3 text-[#17181C] hover:text-[#D8232A] hover:bg-[#F6F6F8] rounded-full transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={dict.navigation.account || "Kabinet"}
            >
              <User className="h-5 w-5" />
            </button>

            {/* Wishlist Shortcut */}
            <Link
              href={`/${locale}/wishlist`}
              className="p-3 text-[#17181C] hover:text-[#D8232A] hover:bg-[#F6F6F8] rounded-full transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={dict.navigation.wishlist || "Seçilmişlər"}
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* Səbət Shortcut */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 text-[#17181C] hover:text-[#D8232A] hover:bg-[#F6F6F8] rounded-full transition-all duration-200 items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer"
              aria-label={dict.navigation.cart || "Səbət"}
            >
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-black text-white bg-[#D8232A] border-2 border-[#FFFFFF] rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* MOBILE LAYOUT ARCHITECTURE RULES */}
        <div className="flex md:hidden items-center justify-between bg-[#FFFFFF] border-b border-[#EDEDED] px-4 py-3 w-full">
          {/* Left: Brand logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#D8232A] text-white flex items-center justify-center font-black text-xs shadow-sm">
              <Package className="w-4 h-4" />
            </div>
            <span className="font-sans font-black text-[#D8232A] text-xl tracking-tight">
              RubikShop<span className="text-[#17181C] text-xs font-bold ml-0.5">.az</span>
            </span>
          </Link>

          {/* Right: Hamburger navigation toggle trigger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 text-[#17181C] hover:text-[#D8232A] hover:bg-[#F6F6F8] rounded-lg transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t({ az: 'Menyu', en: 'Menu', ru: 'Меню' })}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Conditional Sub-Row Search visibility (Mobile only) */}
        {showMobileSearch && (
          <div className="md:hidden px-4 pb-3 pt-1 bg-[#FFFFFF]">
            <SearchBar
              locale={locale}
              placeholder={dict.header?.search_placeholder || "Məhsul axtar..."}
              showButton={false}
            />
          </div>
        )}

        {/* LEFT-ALIGNED SLIDE-OUT OFF-CANVAS NAVIGATION DRAWER */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop Overlay (Solid dark backdrop preventing background text bleed-through) */}
              <motion.div
                key="left-drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed top-0 left-0 inset-0 w-screen h-dvh bg-black/95 backdrop-blur-md z-[99998]"
                aria-hidden="true"
              />

              {/* Left Side Drawer Container */}
              <motion.div
                key="left-drawer-container"
                initial={{ opacity: 0, x: '-100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed top-0 left-0 inset-y-0 h-dvh w-[380px] max-w-[88vw] sm:w-[380px] bg-[#FFFFFF] z-[99999] flex flex-col overflow-hidden text-[#17181C] shadow-2xl border-r border-[#EDEDED]"
              >
                {/* 1. Header Block (Sticky Top) with Search, Cart & Close icons */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#EDEDED] flex items-center justify-between shrink-0 gap-2">
                  <Link 
                    href={`/${locale}`} 
                    className="flex items-center gap-1.5 group min-w-0 shrink"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-7.5 h-7.5 rounded-lg bg-[#D8232A] text-white flex items-center justify-center font-black text-xs shadow-sm group-hover:scale-105 transition-transform shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="font-sans font-black text-[#D8232A] text-lg tracking-tight truncate">
                      RubikShop<span className="text-[#17181C] text-xs font-bold ml-0.5">.az</span>
                    </span>
                  </Link>

                  {/* Top Header Actions (Requirement #1) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Axtarış (Lupa) İkonu */}
                    <button
                      type="button"
                      onClick={() => setIsDrawerSearchOpen(!isDrawerSearchOpen)}
                      className="p-2 bg-[#F6F6F8] hover:bg-[#EDEDED] border border-[#E5E7EB] rounded-full text-[#17181C] transition-colors cursor-pointer w-9 h-9 flex items-center justify-center"
                      aria-label={t({ az: 'Axtarış', en: 'Search', ru: 'Поиск' })}
                    >
                      <Search className="h-4 w-4 text-[#17181C]" />
                    </button>

                    {/* Səbət (Cart) İkonu + Say Göstəricisi */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="relative p-2 bg-[#F6F6F8] hover:bg-[#EDEDED] border border-[#E5E7EB] rounded-full text-[#17181C] transition-colors cursor-pointer w-9 h-9 flex items-center justify-center"
                      aria-label={t({ az: 'Səbət', en: 'Cart', ru: 'Корзина' })}
                    >
                      <ShoppingCart className="h-4 w-4 text-[#17181C]" />
                      {mounted && totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black text-white bg-[#D8232A] border-2 border-white rounded-full">
                          {totalItems}
                        </span>
                      )}
                    </button>

                    {/* Bağlama (X) Düyməsi */}
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 bg-[#F6F6F8] hover:bg-[#EDEDED] border border-[#E5E7EB] rounded-full text-[#17181C] transition-colors cursor-pointer w-9 h-9 flex items-center justify-center"
                      aria-label={t({ az: 'Bağla', en: 'Close', ru: 'Закрыть' })}
                    >
                      <X className="h-4 w-4 text-[#17181C]" />
                    </button>
                  </div>
                </div>

                {/* Inline Quick Search Field when Search Icon clicked */}
                {isDrawerSearchOpen && (
                  <div className="px-4 py-2 bg-[#F9FAFB] border-b border-[#EDEDED] shrink-0">
                    <SearchBar
                      locale={locale}
                      placeholder={dict.header?.search_placeholder || "Məhsul axtar..."}
                      showButton={false}
                      autoFocus
                      onSearchSubmit={() => setIsMenuOpen(false)}
                    />
                  </div>
                )}

                {/* 2 & 3. Menu Navigation Items in exact specified order (No left icons, clean text + chevrons for expandable) */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 overscroll-contain">
                  <nav className="flex flex-col space-y-0.5">
                    
                    {/* 1. Kataloq (Bütün Məhsullar) */}
                    <Link
                      href={`/${locale}/category`}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer"
                    >
                      <span className="truncate">{t({ az: 'Kataloq (Bütün Məhsullar)', en: 'Catalog (All Products)', ru: 'Каталог (Все товары)' })}</span>
                    </Link>

                    {/* Ən Çox Satılanlar (Best Sellers) */}
                    <Link
                      href={`/${locale}/category?sort=bestselling`}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer"
                    >
                      <span className="truncate">{t({ az: 'Ən Çox Satılanlar', en: 'Best Sellers', ru: 'Хиты продаж' })}</span>
                    </Link>

                    {/* 2. Kublar - Accordion */}
                    <div>
                      <button
                        type="button"
                        onClick={toggleCubes}
                        className="w-full group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer text-left"
                      >
                        <span className="truncate">{t({ az: 'Kublar', en: 'Speedcubes', ru: 'Кубики' })}</span>
                        <ChevronDown className={`h-4 w-4 text-[#9CA3AF] group-hover:text-[#D8232A] transition-transform duration-200 shrink-0 ml-2 ${isCubesExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isCubesExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-4 pr-2 py-1 space-y-1 border-l-2 border-[#E5E7EB] ml-3 my-1"
                          >
                            {[
                              { name: t({ az: '2x2', en: '2x2', ru: '2x2' }), slug: '2x2' },
                              { name: t({ az: '3x3', en: '3x3', ru: '3x3' }), slug: '3x3' },
                              { name: t({ az: '4x4', en: '4x4', ru: '4x4' }), slug: '4x4' },
                              { name: t({ az: '5x5', en: '5x5', ru: '5x5' }), slug: '5x5' },
                              { name: t({ az: '6x6', en: '6x6', ru: '6x6' }), slug: '6x6' },
                              { name: t({ az: '7x7', en: '7x7', ru: '7x7' }), slug: '7x7' },
                              { name: t({ az: 'Böyük Kublar', en: 'Big Cubes', ru: 'Большие кубики' }), slug: 'big-cubes' },
                              { name: t({ az: 'Pyraminx', en: 'Pyraminx', ru: 'Пираминкс' }), slug: 'pyraminx' },
                              { name: t({ az: 'Megaminx', en: 'Megaminx', ru: 'Мегаминкс' }), slug: 'megaminx' },
                              { name: t({ az: 'Skewb', en: 'Skewb', ru: 'Скьюб' }), slug: 'skewb' },
                              { name: t({ az: 'Square-1', en: 'Square-1', ru: 'Скуэр-1' }), slug: 'square-1' },
                              { name: t({ az: 'FTO', en: 'FTO', ru: 'FTO' }), slug: 'fto' },
                            ].map((sub) => (
                              <Link
                                key={sub.slug}
                                href={`/${locale}/category/${sub.slug}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="block py-2 px-2.5 rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#D8232A] hover:bg-[#F6F6F8] transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 3. Endirimlər */}
                    <Link
                      href={`/${locale}/category?sale=true`}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer"
                    >
                      <span className="truncate">{t({ az: 'Endirimlər', en: 'Discounts', ru: 'Скидки' })}</span>
                    </Link>

                    {/* 4. Yeni Məhsullar */}
                    <Link
                      href={`/${locale}/category?sort=newest`}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer"
                    >
                      <span className="truncate">{t({ az: 'Yeni Məhsullar', en: 'New Products', ru: 'Новинки' })}</span>
                    </Link>

                    {/* 5. Markalar (GAN, MoYu, QiYi və s.) - Accordion */}
                    <div>
                      <button
                        type="button"
                        onClick={toggleBrands}
                        className="w-full group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer text-left"
                      >
                        <span className="truncate">{t({ az: 'Markalar', en: 'Brands', ru: 'Бренды' })}</span>
                        <ChevronDown className={`h-4 w-4 text-[#9CA3AF] group-hover:text-[#D8232A] transition-transform duration-200 shrink-0 ml-2 ${isBrandsExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isBrandsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-4 pr-2 py-1 space-y-1 border-l-2 border-[#E5E7EB] ml-3 my-1"
                          >
                            {[
                              { name: 'GAN Cubes', brand: 'GAN' },
                              { name: 'MoYu', brand: 'MoYu' },
                              { name: 'QiYi MoFangGe', brand: 'QiYi' },
                              { name: 'YJ (YongJun)', brand: 'YJ' },
                              { name: 'YuXin', brand: 'YuXin' },
                              { name: 'DaYan', brand: 'DaYan' },
                              { name: 'Z-Cube', brand: 'Z-Cube' },
                            ].map((b) => (
                              <Link
                                key={b.brand}
                                href={`/${locale}/category?brand=${encodeURIComponent(b.brand)}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="block py-2 px-2.5 rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#D8232A] hover:bg-[#F6F6F8] transition-colors"
                              >
                                {b.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 6. Yağlar və Baxım (Lube) */}
                    <Link
                      href={`/${locale}/category/lube`}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer"
                    >
                      <span className="truncate">{t({ az: 'Yağlar və Baxım (Lube)', en: 'Lubes & Care', ru: 'Смазки и Уход' })}</span>
                    </Link>

                    {/* 7. Taymerlər və Aksessuarlar */}
                    <Link
                      href={`/${locale}/category/accessories`}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer"
                    >
                      <span className="truncate">{t({ az: 'Taymerlər və Aksessuarlar', en: 'Timers & Accessories', ru: 'Таймеры и Аксессуары' })}</span>
                    </Link>

                    {/* 8. Alqoritmlər & Öyrənmə */}
                    <Link
                      href={`/${locale}/blog`}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer"
                    >
                      <span className="truncate">{t({ az: 'Alqoritmlər & Öyrənmə', en: 'Algorithms & Learning', ru: 'Алгоритмы и Обучение' })}</span>
                    </Link>

                    {/* 9. Əlaqə */}
                    <Link
                      href={`/${locale}/faq`}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#17181C] hover:bg-[#F6F6F8] hover:text-[#D8232A] transition-all cursor-pointer"
                    >
                      <span className="truncate">{t({ az: 'Əlaqə', en: 'Contact', ru: 'Контакты' })}</span>
                    </Link>
                  </nav>
                </div>

                {/* 4. Bottom Footer Block with Outline Button & Neutral Language Switcher */}
                <div className="sticky bottom-0 z-10 bg-white border-t border-[#EDEDED] px-4 py-3 pb-6 space-y-3 shrink-0 shadow-lg">
                  
                  {/* Account / Login Outline Button (Requirement #7) */}
                  <div>
                    {mounted && user ? (
                      <div className="space-y-2">
                        {(userRole === 'admin' || userRole === 'manager') && (
                          <Link
                            href={`/${locale}/admin`}
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#F6F6F8] text-[#17181C] border border-[#E5E7EB] text-xs font-bold rounded-xl hover:bg-[#EDEDED] transition-colors cursor-pointer uppercase tracking-wider"
                          >
                            <ShieldCheck className="h-4 w-4 text-[#D8232A]" />
                            {t({ az: 'Admin Panel', en: 'Admin Dashboard', ru: 'Админ Панель' })}
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleAccountClick();
                          }}
                          className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-transparent border-2 border-[#17181C] text-[#17181C] hover:bg-[#17181C] hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          {t({ az: 'Şəxsi Kabinet', en: 'My Account', ru: 'Личный Кабинет' })}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          openModal('login');
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-transparent border-2 border-[#17181C] text-[#17181C] hover:bg-[#17181C] hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        {t({ az: 'Şəxsi Kabinet / Giriş', en: 'My Account / Login', ru: 'Кабинет / Войти' })}
                      </button>
                    )}
                  </div>

                  {/* Neutral Language Selector (Requirement #6) */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#F3F4F6]">
                    <span className="text-[11px] font-medium text-[#6B7280]">
                      {t({ az: 'Dil', en: 'Language', ru: 'Язык' })}:
                    </span>
                    <div className="flex items-center gap-1 bg-[#F6F6F8] p-0.5 rounded-lg border border-[#E5E7EB]">
                      {(['az', 'en', 'ru'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            changeLanguage(lang);
                            setIsMenuOpen(false);
                          }}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all uppercase cursor-pointer ${
                            locale === lang
                              ? 'bg-[#17181C] text-white shadow-xs'
                              : 'text-[#4B5563] hover:text-[#17181C] hover:bg-[#EDEDED]'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Small Neutral WhatsApp Chat link (Requirement #8) */}
                  <div className="flex items-center justify-center pt-1">
                    <a
                      href="https://wa.me/994506684925"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#17181C] transition-colors"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-[#9CA3AF]" />
                      <span>{t({ az: 'WhatsApp Dəstək', en: 'WhatsApp Support', ru: 'WhatsApp Поддержка' })}</span>
                    </a>
                  </div>

                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        dict={dict}
        locale={locale}
      />
    </React.Fragment>
  );
}
