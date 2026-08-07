'use client';

import * as React from 'react';
import Link from 'next/link';
import { Send, Mail, MapPin, Phone, ShieldCheck, Heart, AlertCircle, Package } from 'lucide-react';
import type { ApplicationDictionary } from '@/types/application.types';
import { useAuthUser } from '@/hooks/useAuthUser';
import { subscribeToNewsletter } from '@/lib/actions/community';

import { supabase } from '@/lib/supabase/client';

interface FooterProps {
  dict: ApplicationDictionary;
  locale: string;
}

export function Footer({ dict, locale }: FooterProps) {
  const { userRole } = useAuthUser();
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  const [subscribing, setSubscribing] = React.useState(false);
  
  const [phone, setPhone] = React.useState('+994 50 668 49 25');
  const [emailVal, setEmailVal] = React.useState('info@rubikshop.az');
  const [addressVal, setAddressVal] = React.useState('Bakı şəhəri, Azərbaycan');

  const t = (obj: { az: string; en: string; ru: string }) => {
    return obj[locale as keyof typeof obj] || obj.az;
  };

  React.useEffect(() => {
    async function loadFooterSettings() {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'general')
          .maybeSingle();

        if (!error && data?.value) {
          const val = data.value;
          if (val.contactPhone && !val.contactPhone.includes('000 00') && val.contactPhone !== '+994 50 000 00 00') {
            setPhone(val.contactPhone);
          }
          if (val.contactEmail) setEmailVal(val.contactEmail);
          if (val.address) setAddressVal(val.address);
        }
      } catch (err: any) {
        console.warn('Could not load footer settings, using default:', err?.message || err);
      }
    }
    loadFooterSettings();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || subscribing) return;
    setSubscribing(true);
    
    try {
      const res = await subscribeToNewsletter(email);
      if (res.success) {
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 5000);
      } else {
        alert(res.error || 'Xəta baş verdi, xahiş olunur yenidən cəhd edin.');
      }
    } catch (err) {
      console.error('Error subscribing to newsletter:', err);
    } finally {
      setSubscribing(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#FFFFFF] text-[#17181C] font-sans border-t border-[#E5E7EB]">
      {/* Newsletter Accent Segment */}
      <div className="border-b border-[#E5E7EB] bg-[#F6F6F8]">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <h3 className="text-lg md:text-xl font-bold text-[#17181C] flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#D8232A]" />
              <span>{dict.footer?.newsletter_title || "Yeniliklərdən xəbərdar olun"}</span>
            </h3>
            <p className="text-xs md:text-sm text-[#6B7280] mt-1.5">
              {dict.footer?.newsletter_desc || "Yeni gələn professional kublar, endirimlər və Azərbaycan speedcubing turnirləri haqqında ilk siz eşidin."}
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full max-w-md flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              aria-label="E-poçt ünvanı"
              placeholder={dict.footer?.newsletter_placeholder || "E-poçt ünvanınızı daxil edin"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-[#17181C] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D8232A] focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={subscribing || subscribed}
              className="px-6 py-3 bg-[#D8232A] text-white text-sm font-semibold rounded-lg hover:bg-[#B31B21] active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>
                {subscribing
                  ? 'Gözləyin...'
                  : subscribed
                  ? (dict.footer?.newsletter_subscribed || 'Abunə olundu!')
                  : (dict.footer?.newsletter_button || 'Abunə ol')}
              </span>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Company Bio column */}
        <div className="space-y-4">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#D8232A] text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="font-sans font-black text-[#D8232A] text-xl md:text-2xl tracking-tight">
              RubikShop<span className="text-[#17181C] text-sm md:text-base font-bold ml-0.5">.az</span>
            </span>
          </Link>
          <p className="text-xs md:text-sm text-[#374151] leading-relaxed max-w-sm">
            {dict.footer?.bio_desc || (locale === 'en' ? "Azerbaijan's first and only specialized professional speedcubing platform. Fast delivery." : (locale === 'ru' ? "Первая и единственная специализированная профессиональная платформа для спидкубинга в Азербайджане. Быстрая доставка." : "Azərbaycanın ilk və tək ixtisaslaşmış professional sürətli kub yarışı (speedcubing) platforması. Dünya səviyyəli brendlər və xidmət keyfiyyəti."))}
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-[#1F2937] mt-3 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{dict.footer?.wca_notice || (locale === 'en' ? "Products fully compliant with official WCA regulations." : "WCA rəsmi qaydaları ilə tam uyğun məhsullar.")}</span>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[#17181C] uppercase tracking-wider">{dict.footer?.useful_links || (locale === 'en' ? "Useful Links" : (locale === 'ru' ? "Полезные Ссылки" : "Faydalı Keçidlər"))}</h4>
          <ul className="space-y-2.5 text-xs md:text-sm">
            <li>
              <Link href={`/${locale}`} className="text-[#374151] hover:text-[#D8232A] font-medium transition-colors flex items-center gap-1.5">
                <span>{dict.navigation?.home || (locale === 'en' ? 'Home' : (locale === 'ru' ? 'Главная' : 'Ana Səhifə'))}</span>
              </Link>
            </li>
            {(userRole === 'admin' || userRole === 'manager') && (
              <li>
                <Link href={`/${locale}/admin`} className="text-[#374151] hover:text-[#D8232A] font-medium transition-colors flex items-center gap-1.5">
                  <span>{dict.navigation?.admin || (locale === 'en' ? 'Admin Panel' : (locale === 'ru' ? 'Админ Панель' : 'İdarəetmə Paneli'))}</span>
                </Link>
              </li>
            )}
            <li>
              <Link href={`/${locale}/track-order`} className="text-[#374151] hover:text-[#D8232A] font-medium transition-colors flex items-center gap-1.5">
                <span>{dict.footer?.track_order || (locale === 'en' ? 'Track Order' : (locale === 'ru' ? 'Отследить заказ' : 'Sifarişi İzlə'))}</span>
              </Link>
            </li>
            <li>
              <Link href={`/${locale}?category=learning-content`} className="text-[#374151] hover:text-[#D8232A] font-medium transition-colors flex items-center gap-1.5">
                <span>{dict.footer?.learning || dict.header?.nav_learning || (locale === 'en' ? 'Algorithms & Learning' : (locale === 'ru' ? 'Алгоритмы и Обучение' : 'Alqoritmlər & Öyrənmə'))}</span>
              </Link>
            </li>
            <li>
              <Link href={`/${locale}?category=bundles`} className="text-[#374151] hover:text-[#D8232A] font-medium transition-colors flex items-center gap-1.5">
                <span>{dict.footer?.discount_bundles || (locale === 'en' ? 'Discount Bundles' : (locale === 'ru' ? 'Наборы со скидкой' : 'Endirimli Dəstlər'))}</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Support & Policies column */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[#17181C] uppercase tracking-wider">{dict.footer?.support_policies || (locale === 'en' ? "Support & Policies" : (locale === 'ru' ? "Поддержка и Условия" : "Dəstək və Şərtlər"))}</h4>
          <ul className="space-y-2.5 text-xs md:text-sm">
            <li>
              <Link href={`/${locale}/pages/terms-of-service`} className="text-[#374151] hover:text-[#D8232A] font-medium transition-colors flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                <span>{dict.footer?.terms_of_service || (locale === 'en' ? "Terms of Service" : (locale === 'ru' ? "Условия Использования" : "İstifadə Şərtləri"))}</span>
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/pages/privacy-policy`} className="text-[#374151] hover:text-[#D8232A] font-medium transition-colors flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                <span>{dict.footer?.privacy_policy || (locale === 'en' ? "Privacy Policy" : (locale === 'ru' ? "Политика Конфиденциальности" : "Məxfilik Siyasəti"))}</span>
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/pages/return-policy`} className="text-[#374151] hover:text-[#D8232A] font-medium transition-colors flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                <span>{dict.footer?.return_policy || (locale === 'en' ? "Return Policy" : (locale === 'ru' ? "Правила Возврата" : "Geri Qaytarma Qaydaları"))}</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact column */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[#17181C] uppercase tracking-wider">{dict.footer?.contact_us || (locale === 'en' ? "Contact Us" : (locale === 'ru' ? "Связаться с нами" : "Bizimlə Əlaqə"))}</h4>
          <ul className="space-y-3.5 text-xs md:text-sm text-[#374151]">
            <li className="flex items-start gap-2.5">
              <MapPin className="h-5 w-5 text-[#D8232A] shrink-0" />
              <span>{addressVal}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-[#374151] shrink-0" />
              <span>{emailVal}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-[#16A34A] shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-[#D8232A] transition-colors">{phone}</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal & Payments bar */}
      <div className="border-t border-[#E5E7EB] bg-[#F6F6F8] pt-8 pb-32 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-[#4B5563] text-center md:text-left leading-relaxed font-medium">
            © {currentYear} RubikShop.az. {dict.footer?.all_rights_reserved || (locale === 'en' ? "All rights reserved." : (locale === 'ru' ? "Все права защищены." : "Bütün hüquqlar qorunur."))} <br className="hidden sm:block" />
            {locale === 'en' ? (
              <>Crafted with <Heart className="h-3 w-3 text-[#D8232A] inline fill-[#D8232A] mx-0.5" /> for speedcubers in Azerbaijan.</>
            ) : locale === 'ru' ? (
              <>Сделано с <Heart className="h-3 w-3 text-[#D8232A] inline fill-[#D8232A] mx-0.5" /> для спидкуберов Азербайджана.</>
            ) : (
              <>Azərbaycanlı sürətli kubçular üçün <Heart className="h-3 w-3 text-[#D8232A] inline fill-[#D8232A] mx-0.5" /> ilə hazırlanıb.</>
            )}
          </p>

          {/* Secure Payment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pr-16 md:pr-0">
            <span className="text-[10px] uppercase text-[#374151] font-bold tracking-widest mr-2">
              {dict.footer?.secure_payment || (locale === 'en' ? "Secure Payment" : (locale === 'ru' ? "Безопасная Оплата" : "Təhlükəsiz Ödəniş"))}
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="bg-[#FFFFFF] text-[#17181C] text-[10px] font-bold px-2.5 py-1.5 rounded border border-[#E5E7EB] tracking-wider shadow-sm">
                💳 Visa / MasterCard
              </span>
              <span className="bg-[#FFFFFF] text-[#17181C] text-[10px] font-bold px-2.5 py-1.5 rounded border border-[#E5E7EB] tracking-wider shadow-sm">
                📱 Apple Pay
              </span>
              <span className="bg-[#FFFFFF] text-[#17181C] text-[10px] font-bold px-2.5 py-1.5 rounded border border-[#E5E7EB] tracking-wider shadow-sm">
                💵 {locale === 'en' ? 'Cash on Delivery' : locale === 'ru' ? 'Оплата при получении' : 'Qapıda Ödəniş'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
