'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Truck,
  Gift,
  Building2,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Star,
  Clock,
  Check,
  X,
  Zap,
  Flame,
  Layers,
  ChevronDown
} from 'lucide-react';
import type { ApplicationDictionary } from '@/types/application.types';
import { useCartStore } from '@/store/useCartStore';
import { sanitizeImageUrl } from '@/lib/image';

export interface Product {
  id: string;
  title: string;
  description?: string;
  price_azn: number;
  compare_at_price_azn?: number;
  original_price_azn?: number;
  discount_percent?: number;
  image_url: string;
  images?: string[];
  stock_quantity: number;
  allow_preorder?: boolean | number;
  slug?: string;
  product_variants?: any[];
  variants?: any[];
  category_id?: string;
  category_name?: string;
  categories?: any;
  tags?: string[];
  [key: string]: any;
}

interface CategoryItem {
  id: string;
  name_az?: string;
  name_en?: string;
  name_ru?: string;
  name?: string;
  slug_az?: string;
  slug_en?: string;
  slug_ru?: string;
  slug?: string;
  image_url?: string;
  [key: string]: any;
}

interface ActiveCampaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  discount_percent: number;
  is_active: boolean;
  [key: string]: any;
}

interface HomepageContentProps {
  initialProducts: Product[];
  featuredProduct: Product | null;
  activeCampaign: ActiveCampaign | null;
  categories: CategoryItem[];
  dict: ApplicationDictionary;
  locale: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endDateStr?: string): TimeLeft {
  if (!endDateStr) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = new Date(endDateStr).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function HomepageContent({
  initialProducts = [],
  featuredProduct,
  activeCampaign,
  categories = [],
  dict,
  locale,
}: HomepageContentProps) {
  const [activeTab, setActiveTab] = React.useState<'new' | 'best' | 'sale'>('new');
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);

  // Variant Selection State (Bottom Sheet on Mobile / Popover on Desktop)
  const [variantModalProduct, setVariantModalProduct] = React.useState<Product | null>(null);
  const [activeDesktopPopoverId, setActiveDesktopPopoverId] = React.useState<string | null>(null);

  // Zustand Cart Actions
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  // Campaign Countdown Timer
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(() =>
    calculateTimeLeft(activeCampaign?.end_date)
  );

  React.useEffect(() => {
    if (!activeCampaign?.end_date) return;
    setTimeLeft(calculateTimeLeft(activeCampaign.end_date));
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(activeCampaign.end_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCampaign?.end_date]);

  // Localization translator helper
  const t = React.useCallback((obj: { az: string; en: string; ru: string }) => {
    return obj[locale as 'az' | 'en' | 'ru'] || obj.az;
  }, [locale]);

  // Helper for category title & slug
  const getCategoryTitle = React.useCallback((cat: CategoryItem) => {
    return cat[`name_${locale}`] || cat.name_az || cat.name || '';
  }, [locale]);

  const getCategorySlug = React.useCallback((cat: CategoryItem) => {
    return cat[`slug_${locale}`] || cat.slug_az || cat.slug || cat.id;
  }, [locale]);

  // Resolve active products list
  const currentProducts = Array.isArray(initialProducts) ? initialProducts : [];

  const newArrivals = currentProducts.slice(0, 8);
  const bestSellers = currentProducts.filter((p) => p && p.stock_quantity > 0).slice(0, 8);
  const saleProducts = currentProducts.filter((p) => {
    if (!p) return false;
    const comparePrice = p.compare_at_price_azn || p.original_price_azn;
    return (
      (comparePrice && comparePrice > p.price_azn) ||
      (p.discount_percent && p.discount_percent > 0)
    );
  });
  const activeSaleProducts = saleProducts.length > 0 ? saleProducts.slice(0, 8) : currentProducts.slice(0, 8);

  const displayedProducts = React.useMemo(() => {
    switch (activeTab) {
      case 'best':
        return bestSellers;
      case 'sale':
        return activeSaleProducts;
      default:
        return newArrivals;
    }
  }, [activeTab, bestSellers, activeSaleProducts, newArrivals]);

  // Direct purchase handler (single-variant or explicit variant)
  const handleQuickBuy = (product: Product, variant?: any) => {
    const targetPrice = variant ? (variant.price_azn ?? variant.price ?? product.price_azn) : product.price_azn;
    const targetTitle = variant
      ? `${product.title} (${variant[`name_${locale}`] || variant.name_az || variant.name || variant.variant_name || 'Variant'})`
      : product.title;
    const targetImage = variant?.image_url || product.image_url;
    const isPreorder = (variant ? variant.stock_quantity : product.stock_quantity) <= 0;

    addItem({
      id: variant ? `${product.id}-${variant.id}` : product.id,
      title: targetTitle,
      price_azn: Number(targetPrice || 0),
      original_price_azn: variant?.compare_at_price_azn || product.compare_at_price_azn,
      quantity: 1,
      image_url: sanitizeImageUrl(targetImage, product.id),
      is_preorder: isPreorder,
      variant_id: variant?.id || null,
      sku: variant?.sku || product.sku,
    });

    setVariantModalProduct(null);
    setActiveDesktopPopoverId(null);
    openCart();
  };

  // Resolved Featured Product for Hero
  const heroProduct = featuredProduct || (currentProducts.length > 0 ? currentProducts[0] : null);

  const heroCategoryName = React.useMemo(() => {
    if (!heroProduct) return '';
    if (heroProduct.category_name) return heroProduct.category_name;
    if (heroProduct.categories?.name) return heroProduct.categories.name;
    if (heroProduct.categories?.name_az) return heroProduct.categories.name_az;
    if (heroProduct.category_id && categories.length > 0) {
      const match = categories.find((c) => c.id === heroProduct.category_id);
      if (match) return getCategoryTitle(match);
    }
    return t({ az: 'Sürət Kubu', en: 'Speedcube', ru: 'Спидкубик' });
  }, [heroProduct, categories, getCategoryTitle, t]);

  const heroDiscountPercent = React.useMemo(() => {
    if (!heroProduct) return 0;
    const compare = heroProduct.compare_at_price_azn || heroProduct.original_price_azn;
    if (compare && compare > heroProduct.price_azn && heroProduct.price_azn > 0) {
      return Math.round(((compare - heroProduct.price_azn) / compare) * 100);
    }
    return heroProduct.discount_percent || 0;
  }, [heroProduct]);

  return (
    <div className="w-full bg-background overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO STRUKTURU: 100% DİNAMİK SPLİT HERO                                */}
      {/* ========================================================================= */}

      {/* A. MOBİL HERO (lg:hidden h-auto min-h-[380px] p-4) */}
      {heroProduct && (
        <section className="block lg:hidden bg-gradient-to-b from-[#FFFFFF] to-[#F9FAFB] border-b border-[#EDEDED] px-4 py-5">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            {/* Top pill row */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDECEC] border border-[#D8232A]/20 text-[#D8232A] text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>{heroCategoryName}</span>
              </span>

              {heroProduct.stock_quantity > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t({ az: 'Anbarda', en: 'In Stock', ru: 'В наличии' })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 text-amber-600" />
                  {t({ az: 'Ön Sifariş', en: 'Pre-order', ru: 'Предзаказ' })}
                </span>
              )}
            </div>

            {/* Visual Box with priority Next/Image */}
            <div className="relative aspect-square w-full max-w-[240px] mx-auto bg-[#F9FAFB] rounded-xl p-3 flex items-center justify-center my-2">
              {heroDiscountPercent > 0 && (
                <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-[#D8232A] text-white text-[11px] font-black shadow-xs">
                  -{heroDiscountPercent}%
                </span>
              )}
              <Image
                src={sanitizeImageUrl(heroProduct.image_url || heroProduct.images?.[0], heroProduct.id)}
                alt={heroProduct.title}
                fill
                priority={true}
                sizes="(max-width: 768px) 240px, 300px"
                referrerPolicy="no-referrer"
                className="object-contain p-2 hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Product Meta */}
            <div className="text-center mt-2 space-y-1">
              <Link
                href={`/${locale}/product/${heroProduct.slug || heroProduct.id}`}
                className="block font-black text-lg text-[#17181C] hover:text-[#D8232A] transition-colors leading-snug line-clamp-2"
              >
                {heroProduct.title}
              </Link>

              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-2xl font-black text-[#D8232A] font-sans">
                  {heroProduct.price_azn.toFixed(2)} AZN
                </span>
                {(heroProduct.compare_at_price_azn || heroProduct.original_price_azn) &&
                  (heroProduct.compare_at_price_azn || heroProduct.original_price_azn)! > heroProduct.price_azn && (
                    <span className="text-sm font-semibold text-gray-400 line-through">
                      {(heroProduct.compare_at_price_azn || heroProduct.original_price_azn)!.toFixed(2)} AZN
                    </span>
                  )}
              </div>
            </div>

            {/* Action buttons: "+ İndi Al" & "Kataloq ->" */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-2 border-t border-[#F3F4F6]">
              <button
                type="button"
                onClick={() => {
                  const variants = heroProduct.product_variants || heroProduct.variants || [];
                  if (variants.length > 1) {
                    setVariantModalProduct(heroProduct);
                  } else {
                    handleQuickBuy(heroProduct);
                  }
                }}
                className="w-full py-2.5 px-3 bg-[#D8232A] hover:bg-[#B31B21] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>{t({ az: '+ İndi Al', en: '+ Buy Now', ru: '+ Купить' })}</span>
              </button>

              <Link
                href={`/${locale}/catalog`}
                className="w-full py-2.5 px-3 bg-[#F6F6F8] hover:bg-[#EDEDED] text-[#17181C] font-bold rounded-xl text-xs sm:text-sm border border-[#E5E7EB] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <span>{t({ az: 'Kataloq', en: 'Catalog', ru: 'Каталог' })}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* B. DESKTOP HERO (hidden lg:block h-[480px] max-w-7xl mx-auto px-6 py-6) */}
      {heroProduct && (
        <section className="hidden lg:block bg-[#FFFFFF] border-b border-[#EDEDED] py-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-12 gap-6 items-stretch min-h-[440px]">
              {/* Sol Sütun: featuredProduct flaqman vitrini (7 sütun əgər campaign varsa, yoxdursa 12 sütun) */}
              <div
                className={`bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-8 shadow-xs flex flex-col justify-between relative overflow-hidden ${
                  activeCampaign ? 'col-span-7' : 'col-span-12'
                }`}
              >
                <div className="grid grid-cols-12 gap-6 items-center h-full">
                  {/* Text & Action column */}
                  <div className={`${activeCampaign ? 'col-span-7' : 'col-span-8'} space-y-4`}>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDECEC] border border-[#D8232A]/20 text-[#D8232A] text-xs font-black uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{heroCategoryName} • {t({ az: 'FLAQMAN VİTRİN', en: 'FLAGSHIP', ru: 'ФЛАГМАН' })}</span>
                      </span>

                      {heroProduct.stock_quantity > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          {t({ az: 'Anbarda', en: 'In Stock', ru: 'В наличии' })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {t({ az: 'Ön Sifariş • 14-20 gün', en: 'Pre-order • 14-20 days', ru: 'Предзаказ • 14-20 дней' })}
                        </span>
                      )}
                    </div>

                    <h1 className="text-3xl xl:text-4xl font-black text-[#17181C] tracking-tight leading-tight">
                      {heroProduct.title}
                    </h1>

                    <p className="text-sm text-[#4B5563] line-clamp-2 leading-relaxed">
                      {heroProduct.description ||
                        t({
                          az: 'Maksimum fırlanma bucağı, maqnit nüvə tənzimləməsi və turnir səviyyəli sürət texnologiyası.',
                          en: 'Maximum corner-cutting, magnetic core adjustment, and competition-ready speed technology.',
                          ru: 'Максимальный углорез, настройка магнитного ядра и скорость турнирного уровня.',
                        })}
                    </p>

                    {/* Specifications badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="px-2.5 py-1 bg-[#F6F6F8] text-[#374151] border border-[#E5E7EB] rounded-lg text-xs font-semibold">
                        ✨ Ball-Core & MagLev
                      </span>
                      <span className="px-2.5 py-1 bg-[#F6F6F8] text-[#374151] border border-[#E5E7EB] rounded-lg text-xs font-semibold">
                        🎯 WCA Turnir Uyğun
                      </span>
                      <span className="px-2.5 py-1 bg-[#F6F6F8] text-[#374151] border border-[#E5E7EB] rounded-lg text-xs font-semibold">
                        ⚡ 100% Orijinal
                      </span>
                    </div>

                    {/* Price Block */}
                    <div className="flex items-baseline gap-3 pt-2">
                      <span className="text-3xl xl:text-4xl font-black text-[#D8232A]">
                        {heroProduct.price_azn.toFixed(2)} AZN
                      </span>
                      {(heroProduct.compare_at_price_azn || heroProduct.original_price_azn) &&
                        (heroProduct.compare_at_price_azn || heroProduct.original_price_azn)! > heroProduct.price_azn && (
                          <span className="text-base text-gray-400 font-semibold line-through">
                            {(heroProduct.compare_at_price_azn || heroProduct.original_price_azn)!.toFixed(2)} AZN
                          </span>
                        )}
                      {heroDiscountPercent > 0 && (
                        <span className="px-2 py-0.5 bg-[#D8232A] text-white text-xs font-black rounded-md">
                          -{heroDiscountPercent}%
                        </span>
                      )}
                    </div>

                    {/* CTA buttons */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const variants = heroProduct.product_variants || heroProduct.variants || [];
                          if (variants.length > 1) {
                            setVariantModalProduct(heroProduct);
                          } else {
                            handleQuickBuy(heroProduct);
                          }
                        }}
                        className="px-6 py-3.5 bg-[#D8232A] hover:bg-[#B31B21] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-98"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t({ az: 'Sifariş Et', en: 'Order Now', ru: 'Заказать' })}</span>
                      </button>

                      <Link
                        href={`/${locale}/product/${heroProduct.slug || heroProduct.id}`}
                        className="px-5 py-3.5 bg-[#F6F6F8] hover:bg-[#EDEDED] text-[#17181C] border border-[#E5E7EB] font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>{t({ az: 'Məhsula Bax', en: 'View Details', ru: 'Подробнее' })}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Image column */}
                  <div
                    className={`${
                      activeCampaign ? 'col-span-5' : 'col-span-4'
                    } flex items-center justify-center h-full relative`}
                  >
                    <div className="relative w-full aspect-square max-w-[280px] bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6] p-4 flex items-center justify-center shadow-xs">
                      <Image
                        src={sanitizeImageUrl(heroProduct.image_url || heroProduct.images?.[0], heroProduct.id)}
                        alt={heroProduct.title}
                        fill
                        priority={true}
                        sizes="320px"
                        referrerPolicy="no-referrer"
                        className="object-contain p-4 hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ Sütun: activeCampaign varsa "Günün Təklifi" kartı (5 sütun) */}
              {activeCampaign && (
                <div className="col-span-5 bg-gradient-to-br from-[#17181C] to-[#252830] text-white border border-[#2D3139] rounded-2xl p-7 shadow-lg flex flex-col justify-between relative overflow-hidden">
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-[#D8232A]/20 blur-3xl pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8232A] text-white text-xs font-black uppercase tracking-wider">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{t({ az: 'Günün Təklifi', en: "Deal of the Day", ru: 'Предложение дня' })}</span>
                      </span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                        {activeCampaign.discount_percent}%-dək Endirim
                      </span>
                    </div>

                    <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-white leading-snug">
                      {activeCampaign.name}
                    </h2>

                    <p className="text-xs xl:text-sm text-gray-300 leading-relaxed">
                      {t({
                        az: 'Seçilmiş turnir kubları və aksesuarlara xüsusi məhdud müddətli kampaniya qiymətləri.',
                        en: 'Limited-time special discounts across selected tournament cubes and speedcube lubes.',
                        ru: 'Специальные скидки на ограниченное время на турнирные кубы и аксессуары.',
                      })}
                    </p>

                    {/* Canlı DD:HH:MM:SS Countdown Taymeri */}
                    <div className="pt-2">
                      <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider block mb-2">
                        {t({ az: 'Kampaniyanın Bitməsinə Qalır:', en: 'Time Remaining:', ru: 'До конца акции:' })}
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: timeLeft.days, label: t({ az: 'Gün', en: 'Days', ru: 'Дней' }) },
                          { val: timeLeft.hours, label: t({ az: 'Saat', en: 'Hours', ru: 'Часов' }) },
                          { val: timeLeft.minutes, label: t({ az: 'Dəq', en: 'Mins', ru: 'Мин' }) },
                          { val: timeLeft.seconds, label: t({ az: 'San', en: 'Secs', ru: 'Сек' }) },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-[#2D3139]/80 border border-white/10 rounded-xl p-2 text-center"
                          >
                            <span className="block text-xl xl:text-2xl font-black font-mono text-white">
                              {String(item.val).padStart(2, '0')}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-medium">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="pt-5 relative z-10">
                    <Link
                      href={`/${locale}/catalog?filter=sale`}
                      className="w-full py-3 px-5 bg-[#D8232A] hover:bg-[#B31B21] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-98 cursor-pointer text-center"
                    >
                      <span>{t({ az: 'Kampaniyadakı Məhsulları Kəşf Et', en: 'Shop Campaign Deals', ru: 'Смотреть товары акции' })}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. DİNAMİK KATEQORİYA ZOLAĞI                                              */}
      {/* ========================================================================= */}
      {categories.length > 0 && (
        <section className="bg-[#FFFFFF] border-b border-[#EDEDED] py-3 lg:py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Mobildə: Snap-x Horizontal Scroll */}
            <div className="flex lg:hidden items-center gap-2.5 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1">
              {categories.map((cat) => {
                const title = getCategoryTitle(cat);
                const slug = getCategorySlug(cat);
                return (
                  <Link
                    key={cat.id}
                    href={`/${locale}/catalog?category=${slug}`}
                    className="snap-start shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] hover:border-[#D8232A]/30 border border-[#E5E7EB] rounded-full shadow-2xs transition-all active:scale-95"
                  >
                    {cat.image_url ? (
                      <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 bg-white border border-[#EDEDED]">
                        <Image
                          src={sanitizeImageUrl(cat.image_url, cat.id)}
                          alt={title}
                          fill
                          sizes="20px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-red-50 text-[#D8232A] flex items-center justify-center shrink-0">
                        <Layers className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#17181C] whitespace-nowrap">{title}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktopda: 40px Zərif Sub-nav Zolağı */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-4 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
                {t({ az: 'Kateqoriyalar:', en: 'Categories:', ru: 'Категории:' })}
              </span>
              <div className="flex items-center gap-2 xl:gap-3 flex-wrap">
                {categories.map((cat) => {
                  const title = getCategoryTitle(cat);
                  const slug = getCategorySlug(cat);
                  return (
                    <Link
                      key={cat.id}
                      href={`/${locale}/catalog?category=${slug}`}
                      className="group flex items-center gap-1.5 px-3 py-1 bg-[#F9FAFB] hover:bg-[#F3F4F6] hover:border-[#D8232A]/30 border border-[#E5E7EB] rounded-full transition-all text-xs font-bold text-[#374151] hover:text-[#D8232A]"
                    >
                      {cat.image_url ? (
                        <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 bg-white">
                          <Image
                            src={sanitizeImageUrl(cat.image_url, cat.id)}
                            alt={title}
                            fill
                            sizes="16px"
                            className="object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                      ) : (
                        <Layers className="w-3.5 h-3.5 text-[#D8232A] shrink-0" />
                      )}
                      <span className="whitespace-nowrap">{title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. 2 SÜTUNLU (MOBİL) VƏ 4 SÜTUNLU (DESKTOP) MƏHSUL QRİDİ                  */}
      {/* ========================================================================= */}
      <section id="catalog-grid" className="py-8 sm:py-12 bg-[#F9FAFB] border-b border-[#EDEDED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header & Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#17181C] tracking-tight">
                {t({ az: 'Vitrin Məhsulları', en: 'Shop Showcase', ru: 'Витрина товаров' })}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                {t({
                  az: 'Rəsmi zəmanətli, orijinal sürət kubları və aksesuarları.',
                  en: 'Original tournament speedcubes with official warranty.',
                  ru: 'Оригинальные скоростные кубики с официальной гарантией.',
                })}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#EDEDED] p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
              {[
                { id: 'new', label: t({ az: 'Yeni Gələnlər', en: 'New Arrivals', ru: 'Новинки' }) },
                { id: 'best', label: t({ az: 'Çox Satılanlar', en: 'Best Sellers', ru: 'Популярное' }) },
                { id: 'sale', label: t({ az: 'Endirimlər %', en: 'Deals %', ru: 'Скидки %' }) },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-[#17181C] shadow-xs'
                      : 'text-[#6B7280] hover:text-[#17181C]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid: 2 sütun mobildə, 3 tablet, 4 desktop */}
          {displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-[#E5E7EB] rounded-2xl bg-white mt-6">
              <Sparkles className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-[#17181C]">
                {t({ az: 'Məhsul tapılmadı', en: 'No products found', ru: 'Товары не найдены' })}
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 mt-6">
              {displayedProducts.map((product) => {
                const variants = product.product_variants || product.variants || [];
                const hasMultipleVariants = variants.length > 1;

                const comparePrice = product.compare_at_price_azn || product.original_price_azn;
                const hasDiscount = comparePrice && comparePrice > product.price_azn;
                const discountPercent = hasDiscount
                  ? Math.round(((comparePrice - product.price_azn) / comparePrice) * 100)
                  : (product.discount_percent || 0);

                const isInStock = product.stock_quantity > 0;
                const isDesktopPopoverOpen = activeDesktopPopoverId === product.id;

                return (
                  <div
                    key={product.id}
                    className="bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#17181C]/20 rounded-2xl p-3 sm:p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group"
                  >
                    {/* 1:1 Kvadrat Şəkil Konteyneri */}
                    <div className="relative aspect-square w-full bg-[#F9FAFB] rounded-xl overflow-hidden mb-2.5 sm:mb-3 flex items-center justify-center">
                      {/* Endirim nişanı */}
                      {discountPercent > 0 && (
                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-[#D8232A] text-white text-[10px] sm:text-[11px] font-black shadow-xs">
                          -{discountPercent}%
                        </span>
                      )}

                      <Link
                        href={`/${locale}/product/${product.slug || product.id}`}
                        className="relative w-full h-full p-2 flex items-center justify-center"
                      >
                        <Image
                          src={sanitizeImageUrl(product.image_url || product.images?.[0], product.id)}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          referrerPolicy="no-referrer"
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="mb-1.5">
                      {isInStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {t({ az: 'Anbarda', en: 'In Stock', ru: 'В наличии' })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {t({ az: 'Ön Sifariş • 14-20 gün', en: 'Pre-order • 14-20d', ru: 'Предзаказ • 14-20д' })}
                        </span>
                      )}
                    </div>

                    {/* Line-clamp-2 Başlıq */}
                    <Link
                      href={`/${locale}/product/${product.slug || product.id}`}
                      className="block font-bold text-xs sm:text-sm text-[#17181C] hover:text-[#D8232A] transition-colors leading-snug line-clamp-2 min-h-[36px] sm:min-h-[40px]"
                      title={product.title}
                    >
                      {product.title}
                    </Link>

                    {/* İkili Qiymət Bloku */}
                    <div className="flex items-baseline gap-1.5 sm:gap-2 my-2 sm:my-2.5">
                      <span className="font-black text-sm sm:text-base text-[#D8232A]">
                        {product.price_azn.toFixed(2)} AZN
                      </span>
                      {hasDiscount && (
                        <span className="text-[11px] sm:text-xs text-gray-400 line-through">
                          {comparePrice.toFixed(2)} AZN
                        </span>
                      )}
                    </div>

                    {/* Satınalma Düyməsi */}
                    <div className="relative mt-auto">
                      {hasMultipleVariants ? (
                        <>
                          {/* Mobil: Bottom sheet açır; Desktop: inline popover açır */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                setVariantModalProduct(product);
                              } else {
                                setActiveDesktopPopoverId(isDesktopPopoverOpen ? null : product.id);
                              }
                            }}
                            className="w-full py-2 sm:py-2.5 px-3 bg-[#F6F6F8] hover:bg-[#EDEDED] text-[#17181C] font-bold text-xs sm:text-sm rounded-xl border border-[#E5E7EB] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <Layers className="w-3.5 h-3.5 text-[#D8232A]" />
                            <span>{t({ az: 'Seçim Et', en: 'Select Option', ru: 'Выбрать' })}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                          </button>

                          {/* Desktop Popover Variant Selector */}
                          <AnimatePresence>
                            {isDesktopPopoverOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-2.5 z-30 space-y-1.5 max-h-48 overflow-y-auto"
                              >
                                <div className="flex items-center justify-between pb-1 border-b border-[#F3F4F6]">
                                  <span className="text-[11px] font-bold text-gray-500">
                                    {t({ az: 'Variant seçin', en: 'Select variant', ru: 'Выберите вариант' })}
                                  </span>
                                  <button
                                    onClick={() => setActiveDesktopPopoverId(null)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                {variants.map((v: any) => (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => handleQuickBuy(product, v)}
                                    className="w-full text-left p-2 rounded-lg hover:bg-[#F6F6F8] border border-transparent hover:border-[#E5E7EB] transition-colors flex items-center justify-between cursor-pointer"
                                  >
                                    <div>
                                      <span className="block text-xs font-bold text-[#17181C]">
                                        {v[`name_${locale}`] || v.name_az || v.name || v.variant_name || 'Variant'}
                                      </span>
                                      <span className="block text-[10px] text-gray-500">
                                        {(v.stock_quantity ?? 0) > 0
                                          ? t({ az: 'Anbarda', en: 'In Stock', ru: 'В наличии' })
                                          : t({ az: 'Ön Sifariş', en: 'Pre-order', ru: 'Предзаказ' })}
                                      </span>
                                    </div>
                                    <span className="text-xs font-black text-[#D8232A]">
                                      {(v.price_azn ?? v.price ?? product.price_azn).toFixed(2)} AZN
                                    </span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickBuy(product)}
                          className="w-full py-2 sm:py-2.5 px-3 bg-[#D8232A] hover:bg-[#B31B21] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{t({ az: '+ Səbətə', en: '+ Add', ru: '+ В корзину' })}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MOBİL BOTTOM-SHEET: ÇOXVARİANTLI MƏHSUL SEÇİMİ                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {variantModalProduct && (
          <div className="fixed inset-0 z-[99999] flex items-end justify-center lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVariantModalProduct(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-h-[80vh] bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drag handle */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EDEDED]">
                <div>
                  <span className="text-[11px] font-bold text-[#D8232A] uppercase tracking-wider">
                    {t({ az: 'Variant Seçimi', en: 'Option Selection', ru: 'Выбор варианта' })}
                  </span>
                  <h3 className="text-base font-bold text-[#17181C] leading-snug line-clamp-2">
                    {variantModalProduct.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setVariantModalProduct(null)}
                  className="p-2 rounded-full bg-[#F6F6F8] hover:bg-[#EDEDED] text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Variant List */}
              <div className="py-4 space-y-2.5 overflow-y-auto flex-1">
                {(variantModalProduct.product_variants || variantModalProduct.variants || []).map((v: any) => {
                  const varTitle = v[`name_${locale}`] || v.name_az || v.name || v.variant_name || 'Variant';
                  const varPrice = Number(v.price_azn ?? v.price ?? variantModalProduct.price_azn);
                  const varStock = Number(v.stock_quantity ?? v.stock ?? 0);

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleQuickBuy(variantModalProduct, v)}
                      className="w-full p-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] hover:border-[#D8232A] rounded-xl flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                    >
                      <div>
                        <span className="block font-bold text-sm text-[#17181C]">{varTitle}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {varStock > 0 ? (
                            <span className="text-emerald-700 font-semibold">
                              ● {t({ az: 'Anbarda', en: 'In Stock', ru: 'В наличии' })}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold">
                              ● {t({ az: 'Ön Sifariş • 14-20 gün', en: 'Pre-order • 14-20d', ru: 'Предзаказ • 14-20д' })}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-sm text-[#D8232A]">{varPrice.toFixed(2)} AZN</span>
                        <span className="text-[11px] font-bold text-blue-600">
                          {t({ az: 'Seç və Al →', en: 'Select & Buy →', ru: 'Купить →' })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. GÜVƏN VƏ İNFORMATİV XİDMƏT BANNERLƏRİ                                   */}
      {/* ========================================================================= */}
      <section className="py-12 bg-white border-b border-[#EDEDED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-6 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-red-100 text-[#D8232A] rounded-xl shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#17181C]">
                  {t({ az: '24 Saat Çatdırılma', en: '24h Delivery', ru: 'Доставка за 24ч' })}
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {t({
                    az: 'Bakı daxilində eyni gün kuryer çatdırılması. Bölgələrə sürətli Azərpoçt göndərişi.',
                    en: 'Same day express delivery in Baku. Fast postage to all regions of Azerbaijan.',
                    ru: 'Экспресс-доставка по Баку в тот же день. Быстрая почта во все регионы.',
                  })}
                </p>
              </div>
            </div>

            <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-6 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#17181C]">
                  {t({ az: '100% Orijinal Brendlər', en: '100% Genuine Brands', ru: '100% Оригинальные бренды' })}
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {t({
                    az: 'GAN, MoYu, QiYi, X-Man zavodlarından birbaşa idxal və rəsmi orijinallıq zəmanəti.',
                    en: 'Direct import from GAN, MoYu, QiYi, and X-Man with authenticity guarantee.',
                    ru: 'Прямой импорт от GAN, MoYu, QiYi, X-Man с гарантией подлинности.',
                  })}
                </p>
              </div>
            </div>

            <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-6 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#17181C]">
                  {t({ az: 'Hədiyyə və Aksesuarlar', en: 'Gifts & Accessories', ru: 'Подарки и аксессуары' })}
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {t({
                    az: 'İstənilən kub üçün silikon yağlar, qoruyucu çantalar və professional matlar.',
                    en: 'Professional silicone lubes, carry bags, and timers for every cube solver.',
                    ru: 'Силиконовые смазки, чехлы и турнирные таймеры для любых спидкуберов.',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TEZ-TEZ VERİLƏN SUALLAR (FAQ)                                          */}
      {/* ========================================================================= */}
      <section className="py-12 bg-[#F9FAFB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[#17181C] tracking-tight">
              {t({ az: 'Tez-tez Verilən Suallar', en: 'Frequently Asked Questions', ru: 'Часто задаваемые вопросы' })}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {t({
                az: 'Sifariş və çatdırılma barədə ən çox soruşulan sualların cavabları.',
                en: 'Answers to the most common questions regarding orders and deliveries.',
                ru: 'Ответы на самые популярные вопросы о заказах и доставке.',
              })}
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: {
                  az: 'Sifarişlər nə qədər vaxta çatdırılır?',
                  en: 'How fast is delivery?',
                  ru: 'Как быстро осуществляется доставка?',
                },
                a: {
                  az: 'Bakı daxilində sifarişlər 24 saat ərzində kuryerlə qapınıza çatdırılır. Bölgələrə isə 2-3 iş günü ərzində Azərpoçt ilə göndərilir.',
                  en: 'Deliveries in Baku arrive within 24 hours via courier. Other regions are delivered in 2-3 business days via Azerpost.',
                  ru: 'Заказы по Баку доставляются курьером в течение 24 часов. В регионы — за 2-3 рабочих дня через Азерпочту.',
                },
              },
              {
                q: {
                  az: 'Məhsullar orijinaldır?',
                  en: 'Are the products authentic?',
                  ru: 'Продукция оригинальная?',
                },
                a: {
                  az: 'Bəli, RubikShop.az yalnız rəsmi istehsalçılarla (GAN, MoYu, QiYi və s.) birbaşa əməkdaşlıq edir və bütün məhsullara rəsmi zəmanət verir.',
                  en: 'Yes, RubikShop.az partners directly with leading manufacturers (GAN, MoYu, QiYi) ensuring 100% authenticity.',
                  ru: 'Да, RubikShop.az сотрудничает напрямую с ведущими брендами (GAN, MoYu, QiYi), гарантируя 100% подлинность.',
                },
              },
              {
                q: {
                  az: 'Ön sifariş nə qədər vaxt aparır?',
                  en: 'How long does a pre-order take?',
                  ru: 'Сколько времени занимает предзаказ?',
                },
                a: {
                  az: 'Anbarda bitən məhsullar üzrə ön sifarişlər 14-20 gün ərzində xaricdən çatdırılır və dərhal sizə təhvil verilir.',
                  en: 'Pre-ordered items take 14-20 days to arrive from abroad and are delivered immediately upon arrival.',
                  ru: 'Предзаказные товары доставляются за 14-20 дней и сразу передаются вам.',
                },
              },
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-sm sm:text-base text-[#17181C] hover:text-[#D8232A] cursor-pointer"
                  >
                    <span>{t(faq.q)}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-[#D8232A]' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-[#F3F4F6] pt-3">
                      {t(faq.a)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
