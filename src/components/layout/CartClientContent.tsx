'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { sanitizeImageUrl } from '@/lib/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Bookmark,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Ticket,
  Truck,
  Check,
  Percent,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  Zap,
  Package,
  Clock
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { createClient } from '@/lib/supabase/client';
import { validateCoupon } from '@/lib/actions/coupons';
import type { ApplicationDictionary } from '@/types/application.types';

interface CartClientContentProps {
  locale: string;
  dict: ApplicationDictionary;
}

export function CartClientContent({ locale, dict }: CartClientContentProps) {
  const [user, setUser] = React.useState<any>(null);
  const { openModal } = useAuthModalStore();

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);
  const {
    items,
    savedItems,
    appliedCoupon,
    discountType,
    discountValue,
    removeItem,
    updateQuantity,
    saveForLater,
    moveToCart,
    removeSavedItem,
    applyCoupon,
    removeCoupon,
    getTotalPrice,
    getOriginalTotalPrice,
    getProductSavings,
    getDiscountAmount,
    getFinalPrice,
    addItem
  } = useCartStore();

  const [couponInput, setCouponInput] = React.useState('');
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = React.useState(false);
  const [shippingMethod, setShippingMethod] = React.useState<'standard' | 'express'>('standard');
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const subtotal = isMounted ? getTotalPrice() : 0;
  const origSubtotal = isMounted ? getOriginalTotalPrice() : 0;
  const productSavings = isMounted ? getProductSavings() : 0;
  const discountAmount = isMounted ? getDiscountAmount() : 0;
  const freeShippingThreshold = 100; // Free above 100 AZN

  // On Cart page, shipping is calculated at Checkout based on selected station/address
  const shippingCost = 0;

  const taxEstimate = React.useMemo(() => {
    return 0; // Standard 0% direct e-comm tax in Azerbaijan currently
  }, []);

  const total = React.useMemo(() => {
    const finalProductPrice = isMounted ? getFinalPrice() : 0;
    return finalProductPrice;
  }, [isMounted, getFinalPrice]);

  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  // Dynamic real-time recommendations from Supabase DB
  const [dbUpsellProducts, setDbUpsellProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    let isSubscribed = true;
    const fetchUpsells = async () => {
      try {
        const supabaseClient = createClient();
        const { data, error } = await supabaseClient
          .from('products')
          .select('id, title_az, title_en, title_ru, price_azn, compare_at_price_azn, original_price_azn, image_url, description_az, description_en, description_ru, is_preorder, stock_quantity, stock, is_active, brand_id, brands(name)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && isSubscribed) {
          setDbUpsellProducts(data);
        }
      } catch (err) {
        console.error('Error fetching cart recommendations:', err);
      }
    };

    fetchUpsells();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Filter recommendations: Exclude items in cart, saved items, pre-orders, and out-of-stock items strictly from Supabase DB
  const filteredUpsells = React.useMemo(() => {
    const cartIds = new Set(items.map(i => String(i.id)));
    const cartTitles = new Set(items.map(i => i.title.trim().toLowerCase()));
    const savedIds = new Set(savedItems.map(s => String(s.id)));

    if (!dbUpsellProducts || dbUpsellProducts.length === 0) {
      return [];
    }

    const candidates = dbUpsellProducts.map(p => {
      const title = p[`title_${locale}`] || p.title_az || p.name_az || p.title_en || '';
      const desc = p[`description_${locale}`] || p.description_az || p.description_en || '';
      const brandName = p.brands?.name || p.brand || 'RubikShop';
      return {
        id: String(p.id),
        title: String(title),
        price_azn: Number(p.price_azn || 0),
        image_url: sanitizeImageUrl(p.image_url, p.id),
        brand: String(brandName),
        desc: String(desc).replace(/<[^>]*>/g, '').substring(0, 60),
        is_preorder: Boolean(p.is_preorder),
        stock_qty: p.stock_quantity ?? p.stock
      };
    });

    // Exclude:
    // 1. Items in cart (by ID or Title)
    // 2. Saved items (by ID)
    // 3. Pre-orders (`is_preorder === true`)
    // 4. Out-of-stock items (`stock_qty <= 0`)
    const valid = candidates.filter(prod => {
      if (!prod.title) return false;
      if (cartIds.has(String(prod.id))) return false;
      if (savedIds.has(String(prod.id))) return false;
      if (cartTitles.has(prod.title.trim().toLowerCase())) return false;
      if (prod.is_preorder === true) return false;
      if (prod.stock_qty !== undefined && prod.stock_qty !== null && Number(prod.stock_qty) <= 0) return false;
      return true;
    });

    return valid.slice(0, 3);
  }, [dbUpsellProducts, items, savedItems, locale]);

  const [isCouponLoading, setIsCouponLoading] = React.useState(false);
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(false);

    if (!couponInput.trim()) return;
    setIsCouponLoading(true);

    const res = await validateCoupon(couponInput, subtotal);
    if (res.success && res.coupon) {
      applyCoupon(res.coupon.code, res.coupon.discount_type, res.coupon.discount_value);
      setCouponSuccess(true);
      setCouponInput('');
      setTimeout(() => setCouponSuccess(false), 4000);
    } else {
      setCouponError(res.error || 'Kupon keçərsizdir.');
    }
    setIsCouponLoading(false);
  };

  const handleAddUpsell = (up: any) => {
    addItem({
      id: up.id,
      title: up.title,
      price_azn: up.price_azn,
      quantity: 1,
      image_url: up.image_url
    });
  };

  if (!isMounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-rubik-brand border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-xs text-muted-foreground font-semibold">Səbət yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-background pb-24">
      {/* Breadcrumbs */}
      <div className="bg-muted/40 py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-rubik-brand">
            Ana Səhifə
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">Alış-veriş Səbəti</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 space-y-12">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-black text-foreground">Səbətiniz</h1>
          <p className="text-xs text-muted-foreground">
            Sifarişinizi tamamlamadan öncə məhsullarınızı və fərdi xidmətləri nəzərdən keçirin.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="border border-border rounded-3xl p-12 text-center space-y-5 bg-card max-w-xl mx-auto shadow-soft-sm">
            <div className="p-4 bg-muted w-fit rounded-full mx-auto">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="font-black text-xl text-foreground">Səbətiniz boşdur</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Hazırda səbətinizdə heç bir məhsul yoxdur. Professional sürətli kub idmançıları üçün hazırladığımız flaqman kolleksiyamıza nəzər salın!
            </p>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-rubik-brand text-white font-black text-xs rounded-xl hover:bg-rubik-brand-dark transition-colors cursor-pointer shadow-soft-md"
            >
              <span>Məhsulları Araşdırın</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Cart Items & Saved items */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Interactive progress bar */}
              <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-soft-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4.5 w-4.5 text-rubik-brand animate-pulse" />
                    {remainingForFreeShipping > 0 ? (
                      <span>
                        Daha <span className="text-rubik-brand">{remainingForFreeShipping.toFixed(2)} AZN</span> dəyərində məhsul əlavə et, <span className="underline">Pulsuz Çatdırılma</span> qazan!
                      </span>
                    ) : (
                      <span className="text-green-600 font-black flex items-center gap-1.5">
                        Təbriklər! Pulsuz kuryer çatdırılması üçün tam uyğunsunuz! <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px]">{Math.round(progressToFreeShipping)}%</span>
                </div>
                <div className="w-full bg-muted border border-border h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-rubik-brand h-full transition-all duration-500"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>

              {/* Active Cart items panel */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-md">
                <div className="px-6 py-5 bg-muted/40 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Package className="h-4.5 w-4.5 text-rubik-brand" />
                    Səbətdəki məhsullar ({items.reduce((sum, i) => sum + i.quantity, 0)} ədəd)
                  </h2>
                </div>

                {items.some(i => i.is_preorder) && (
                  <div className="mx-6 mt-5 p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-300">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs font-bold leading-relaxed">
                      <p className="font-black uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        {locale === 'en' ? 'Pre-order item in cart' : locale === 'ru' ? 'В корзине есть товар по предзаказу' : 'Səbətinizdə Ön Sifariş Məhsulu Var'}
                      </p>
                      <p>
                        {locale === 'en' 
                          ? 'Delivery for pre-order items takes 14-28 business days. 100% advance payment via WhatsApp is required.' 
                          : locale === 'ru' 
                          ? 'Доставка товаров по предзаказу занимает 14-28 рабочих дней. Требуется 100% предоплата через WhatsApp.' 
                          : 'Ön sifarişlə təmin edilən məhsulların çatdırılması 14-28 iş günü çəkir. WhatsApp üzərindən 100% ön ödəniş tələb olunur.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-6 divide-y divide-border/60">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-4 py-5 first:pt-0 last:pb-0">
                      {/* Image Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl bg-muted/30 border border-border flex-shrink-0 overflow-hidden flex items-center justify-center p-1.5 self-start md:self-auto">
                        <Image
                          src={sanitizeImageUrl(item.image_url, item.id)}
                          alt={item.title}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-contain p-1"
                          sizes="64px"
                        />
                      </div>

                      {/* Title & Brand details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs md:text-sm font-bold text-foreground leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        {item.is_preorder ? (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              {locale === 'en' ? 'Pre-Order' : locale === 'ru' ? 'Предзаказ' : 'Ön Sifariş'} ({
                                locale === 'en' 
                                  ? (item.preorder_lead_time || '14-28 business days').replace(/14-28 iş günü/g, '14-28 business days').replace(/iş günü/g, 'business days').replace(/gün/g, 'days')
                                  : locale === 'ru'
                                  ? (item.preorder_lead_time || '14-28 рабочих дней').replace(/14-28 iş günü/g, '14-28 рабочих дней').replace(/iş günü/g, 'рабочих дней').replace(/gün/g, 'дней')
                                  : (item.preorder_lead_time || '14-28 iş günü')
                              })
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground font-medium">
                            <span>Original Premium</span>
                            <span>•</span>
                            <span className="text-rubik-brand">
                              {dict.cart?.pro_setup || (locale === 'en' ? 'Professional Setup Add-on' : (locale === 'ru' ? 'Профессиональная Настройка' : 'Professional İncə Tənzimləmə'))}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Operations and prices */}
                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-2 md:pt-0">
                        
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 w-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-black text-foreground min-w-[1.75rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Total item cost */}
                        <div className="text-right min-w-[5.5rem] space-y-0.5">
                          {item.original_price_azn && item.original_price_azn > item.price_azn && (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[10px] text-muted-foreground line-through font-mono">
                                {(item.original_price_azn * item.quantity).toFixed(2)} AZN
                              </span>
                              <span className="text-[9px] bg-red-500/10 text-red-600 font-extrabold px-1.5 py-0.2 rounded">
                                -{Math.round(((item.original_price_azn - item.price_azn) / item.original_price_azn) * 100)}%
                              </span>
                            </div>
                          )}
                          <span className="block text-xs font-black text-foreground font-mono">
                            {(item.price_azn * item.quantity).toFixed(2)} AZN
                          </span>
                          {item.original_price_azn && item.original_price_azn > item.price_azn && (
                            <span className="block text-[9px] text-emerald-600 font-bold font-mono">
                              Qənaət: {((item.original_price_azn - item.price_azn) * item.quantity).toFixed(2)} AZN
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveForLater(item.id)}
                            title="Sonra üçün saxla"
                            className="p-2 text-muted-foreground hover:text-rubik-brand hover:bg-muted rounded-xl transition-all cursor-pointer"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            title="Səbətdən sil"
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-muted rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save For Later Section */}
              {savedItems.length > 0 && (
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft-sm">
                  <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-rubik-brand" />
                      Sonra üçün saxlanılanlar ({savedItems.length})
                    </h3>
                  </div>

                  <div className="p-6 divide-y divide-border/60">
                    {savedItems.map((item) => (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="relative w-12 h-12 rounded-xl bg-muted/20 border border-border overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                          <Image
                            src={sanitizeImageUrl(item.image_url, item.id)}
                            alt={item.title}
                            fill
                            referrerPolicy="no-referrer"
                            className="object-contain p-1"
                            sizes="48px"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-1">{item.title}</h4>
                          <span className="text-[10px] text-muted-foreground">{item.price_azn.toFixed(2)} AZN</span>
                        </div>

                        <div className="flex items-center gap-3 pt-1 md:pt-0">
                          <button
                            onClick={() => moveToCart(item.id)}
                            className="px-3.5 py-1.5 bg-rubik-brand hover:bg-rubik-brand-dark text-white font-black text-[10px] rounded-lg transition-colors cursor-pointer"
                          >
                            Səbətə at
                          </button>
                          <button
                            onClick={() => removeSavedItem(item.id)}
                            className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted transition-all cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upsell / Cross-sell Section - Only render when valid recommendations exist */}
              {filteredUpsells.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-rubik-brand animate-bounce" />
                    Səbətinizi tamamlamaq üçün tövsiyələr
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredUpsells.map((up) => (
                      <div key={up.id} className="bg-card border border-border/80 p-4 rounded-2xl shadow-soft-sm flex flex-col justify-between hover:border-rubik-brand/40 transition-colors">
                        <div className="space-y-3">
                          <div className="relative aspect-square w-16 h-16 rounded-xl bg-muted/40 mx-auto overflow-hidden flex items-center justify-center p-1.5">
                            <Image
                              src={sanitizeImageUrl(up.image_url, up.id)}
                              alt={up.title}
                              fill
                              referrerPolicy="no-referrer"
                              className="object-contain p-1"
                              sizes="64px"
                            />
                          </div>
                          <div className="text-center space-y-1">
                            <span className="text-[9px] font-bold text-rubik-brand uppercase">{up.brand}</span>
                            <h4 className="text-[11px] font-bold text-foreground leading-snug line-clamp-2 min-h-[2.2rem]">
                              {up.title}
                            </h4>
                            {up.desc && (
                              <p className="text-[9px] text-muted-foreground leading-normal line-clamp-1">{up.desc}</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between">
                          <span className="text-xs font-black text-foreground font-mono">{up.price_azn.toFixed(2)} AZN</span>
                          <button
                            onClick={() => handleAddUpsell(up)}
                            className="px-2.5 py-1 bg-rubik-brand text-white hover:bg-rubik-brand-dark font-black text-[10px] rounded-lg transition-colors cursor-pointer"
                          >
                            + {locale === 'en' ? 'Add' : (locale === 'ru' ? 'Добавить' : 'Əlavə et')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right side: Summary panel */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Order Summary card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-sm space-y-5">
                <h3 className="text-base font-black text-foreground uppercase tracking-wider pb-3 border-b border-border">
                  {dict.cart?.summary || (locale === 'en' ? 'Order Summary' : (locale === 'ru' ? 'Итог заказа' : 'Sifariş Xülasəsi'))}
                </h3>

                {productSavings > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 animate-bounce" />
                    <p className="text-xs font-bold leading-tight">
                      🎉 {locale === 'en' 
                        ? <>Congrats! You save <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{productSavings.toFixed(2)} AZN</span> on product discounts!</>
                        : (locale === 'ru'
                          ? <>Поздравляем! Вы экономите <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{productSavings.toFixed(2)} AZN</span> на скидках!</>
                          : <>Təbriklər! Siz bu sifarişdə məhsul endirimlərindən <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{productSavings.toFixed(2)} AZN</span> qənaət edirsiniz!</>)}
                    </p>
                  </div>
                )}

                {/* Pricing Breakdowns */}
                <div className="space-y-3 text-xs">
                  {productSavings > 0 && (
                    <>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>{dict.cart?.subtotal || (locale === 'en' ? 'Initial Product Price' : (locale === 'ru' ? 'Начальная стоимость' : 'İlkin məhsul dəyəri'))}</span>
                        <span className="line-through font-mono">{origSubtotal.toFixed(2)} AZN</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-600 font-bold">
                        <span>{dict.cart?.savings || (locale === 'en' ? 'Product Discounts' : (locale === 'ru' ? 'Скидки на товары' : 'Məhsul endirimləri'))}</span>
                        <span className="font-mono">-{productSavings.toFixed(2)} AZN</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>{dict.cart?.subtotal_discounted || (locale === 'en' ? 'Subtotal' : (locale === 'ru' ? 'Подытог' : 'Səbət cəmi (Endirimli)'))}</span>
                    <span className="font-semibold text-foreground font-mono">{subtotal.toFixed(2)} AZN</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded-lg">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Percent className="h-3.5 w-3.5" />
                        <span>Kupon ({appliedCoupon} -{discountValue}{discountType === 'percentage' ? '%' : ' AZN'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">-{discountAmount.toFixed(2)} AZN</span>
                        <button
                          onClick={removeCoupon}
                          className="text-red-500 hover:text-red-700 font-black cursor-pointer text-[10px] uppercase"
                        >
                          [Sil]
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delivery type info */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex justify-between items-center">
                      <span className="block font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {dict.cart?.shipping || (locale === 'en' ? 'Delivery' : (locale === 'ru' ? 'Доставка' : 'Çatdırılma'))}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 font-mono">
                        {dict.cart?.calc_at_checkout || (locale === 'en' ? 'Calculated at checkout' : (locale === 'ru' ? 'Рассчитывается при оформлении' : 'Ödəniş addımında hesablanır'))}
                      </span>
                    </div>
                    <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground font-semibold flex items-center gap-1">📍 {locale === 'en' ? 'Metro Station:' : (locale === 'ru' ? 'Станция метро:' : 'Metro Stansiyası:')}</span>
                        <span className="text-emerald-600 font-bold font-mono">1.00 – 2.00 AZN</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                        <span>🚚 {locale === 'en' ? 'Address / Region:' : (locale === 'ru' ? 'На адрес / В регион:' : 'Ünvana / Rayona:')}</span>
                        <span>{locale === 'en' ? 'Negotiable' : (locale === 'ru' ? 'По договоренности' : 'Razılaşdırılır')}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-tight">
                      {dict.cart?.checkout_note || (locale === 'en' 
                        ? '* Exact metro station will be selected in the next step (Checkout) to add shipping fee.' 
                        : (locale === 'ru' 
                          ? '* Точная станция метро выбирается на следующем шаге (Оформление заказа) для добавления стоимости доставки.' 
                          : '* Dəqiq metro stansiyası növbəti addımda (Ödəniş addımında) seçilərək çatdırılma məbləği dəqiq əlavə edilir.'))}
                    </p>
                  </div>

                  {/* Final Total price */}
                  <div className="flex justify-between items-center text-sm font-black text-foreground pt-4 border-t border-border">
                    <span className="uppercase">{locale === 'en' ? 'Total Payment' : (locale === 'ru' ? 'Итого к оплате' : 'Yekun Ödəniş')}</span>
                    <span className="font-mono text-lg text-rubik-brand">{total.toFixed(2)} AZN</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  href={`/${locale}/checkout`}
                  className="w-full inline-flex items-center justify-center py-4 bg-rubik-brand hover:bg-rubik-brand-dark text-white font-black text-sm rounded-2xl hover:shadow-soft-lg active:scale-98 transition-all cursor-pointer flex gap-2"
                >
                  <Zap className="h-4.5 w-4.5" />
                  <span>{dict.cart?.checkout || (locale === 'en' ? 'Proceed to Checkout' : (locale === 'ru' ? 'Оформить заказ' : 'Sifarişi Tamamla'))}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Coupon input application block */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-sm space-y-4">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-rubik-brand" />
                  {locale === 'en' ? 'Coupon & Promo Code' : (locale === 'ru' ? 'Купон и Промокод' : 'Kupon və Promo Kod')}
                </h4>

                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError(null);
                    }}
                    placeholder="Məsələn: RUBIK20"
                    className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand uppercase font-mono tracking-wider placeholder:normal-case placeholder:font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isCouponLoading}
                    className="px-4 py-2.5 bg-rubik-brand text-white hover:bg-rubik-brand-dark font-black text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-sm disabled:opacity-50"
                  >
                    {isCouponLoading ? '...' : (locale === 'en' ? 'Apply' : (locale === 'ru' ? 'Применить' : 'Tətbiq Et'))}
                  </button>
                </form>

                {couponError && (
                  <p className="text-[10px] text-red-600 font-bold leading-normal">{couponError}</p>
                )}

                {couponSuccess && (
                  <p className="text-[10px] text-green-600 font-bold leading-normal flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Coupon kodu uğurla tətbiq edildi!
                  </p>
                )}

                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/60 space-y-1">
                  <span className="block text-[10px] font-bold text-foreground">Aktiv Kampaniyalar:</span>
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                    <span>RUBIK20 (-20% Flaqman)</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('RUBIK20')}
                      className="text-rubik-brand hover:underline font-black cursor-pointer"
                    >
                      Kopyala
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                    <span>SPEEDCUBE10 (-10% Hər şey)</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('SPEEDCUBE10')}
                      className="text-rubik-brand hover:underline font-black cursor-pointer"
                    >
                      Kopyala
                    </button>
                  </div>
                </div>
              </div>

              {/* Secure Trust details */}
              <div className="space-y-3.5 px-2">
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4.5 w-4.5 text-green-600 shrink-0" />
                  <span className="leading-snug">
                    <strong>Təhlükəsiz alış-veriş zəmanəti:</strong> Bütün fərdi və ödəniş məlumatları SSL şifrələmə sistemi ilə tam qorunur.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <RotateCcw className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                  <span className="leading-snug">
                    <strong>14 gün geri qaytarma:</strong> Heç bir səbəb göstərmədən istifadə edilməmiş məhsulları tam paketində geri qaytara bilərsiniz.
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
