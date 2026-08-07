"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, AlertCircle, ArrowLeft, Truck, PhoneCall, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface CMSPage {
  id: string;
  slug: string;
  title_az: string;
  title_en: string;
  title_ru: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  meta_title_az?: string;
  meta_title_en?: string;
  meta_title_ru?: string;
  meta_description_az?: string;
  meta_description_en?: string;
  meta_description_ru?: string;
}

const DEFAULT_PAGES: Record<string, CMSPage> = {
  about: {
    id: 'default-about',
    slug: 'about',
    title_az: 'Haqqımızda və Çatdırılma Məlumatı',
    title_en: 'About Us & Delivery Information',
    title_ru: 'О нас и Информация о Доставке',
    content_az: `
      <div style="line-height: 1.8;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #17181C; margin-bottom: 12px;">RubikShop.az-a Xoş Gəlmisiniz!</h2>
        <p style="margin-bottom: 20px; color: #4B5563;"><strong>RubikShop.az</strong> — Azərbaycanda 1 nömrəli sürətli kub yarışı (Speedcubing) və tapmaca mağazasıdır. Bizim əsas məqsədimiz hər kəs üçün keyfiyyətli, orijinal və büdcəyə uyğun sürət kublarını (3x3, 2x2, 4x4, Pyraminx, Megaminx), peşəkar silikon yağları və aksessuarları əlçatan etməkdir.</p>
        
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #D8232A; margin-top: 24px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">🚀 Çatdırılma Şərtləri:</h3>
        <ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 24px; color: #374151;">
          <li style="margin-bottom: 8px;"><strong>Bakı Metrostansiyalarına Çatdırılma:</strong> Sifarişləriniz Bakı metrosunun istənilən stansiyasına tez və rahat şəkildə təhvil verilir.</li>
          <li style="margin-bottom: 8px;"><strong>Sürətli Sifariş:</strong> Saytımızda bəyəndiyiniz məhsulları səbətə əlavə edərək birbaşa WhatsApp vasitəsilə 1 kliklə sifariş edə bilərsiniz.</li>
          <li style="margin-bottom: 8px;"><strong>Ödəniş Üsulu:</strong> Metroda məhsulu təhvil alarkən rahat nağd və ya köçürmə ilə ödəniş.</li>
        </ul>

        <h3 style="font-size: 1.25rem; font-weight: 700; color: #17181C; margin-top: 24px; margin-bottom: 12px;">📞 Əlaqə və Destək:</h3>
        <p style="margin-bottom: 12px; color: #4B5563;">Hər hansı sualınız, tövsiyəyə ehtiyacınız və ya xüsusi kub sifarişiniz olarsa, bizim komanda ilə birbaşa əlaqə saxlaya bilərsiniz:</p>
        <ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px; color: #374151;">
          <li style="margin-bottom: 6px;">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/994506684925" style="color: #D8232A; text-decoration: underline;">+994 50 668 49 25</a></li>
          <li style="margin-bottom: 6px;">📸 <strong>Instagram:</strong> <a href="https://instagram.com/rubikshop.az" style="color: #D8232A; text-decoration: underline;">@rubikshop.az</a></li>
        </ul>
      </div>
    `,
    content_en: `
      <div style="line-height: 1.8;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #17181C; margin-bottom: 12px;">Welcome to RubikShop.az!</h2>
        <p style="margin-bottom: 20px; color: #4B5563;"><strong>RubikShop.az</strong> is Azerbaijan's #1 speedcubing and puzzle store. Our goal is to bring top-quality, original, and budget-friendly speedcubes (3x3, 2x2, 4x4, Pyraminx, Megaminx), premium lubes, and accessories to speedcubers across the country.</p>
        
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #D8232A; margin-top: 24px; margin-bottom: 12px;">🚀 Delivery Terms:</h3>
        <ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 24px; color: #374151;">
          <li style="margin-bottom: 8px;"><strong>Baku Metro Station Delivery:</strong> Fast pick-up delivery to any Baku Metro station.</li>
          <li style="margin-bottom: 8px;"><strong>Easy Ordering:</strong> Add items to cart and order instantly via WhatsApp in 1 click.</li>
          <li style="margin-bottom: 8px;"><strong>Payment:</strong> Cash on delivery or transfer upon station pick-up.</li>
        </ul>

        <h3 style="font-size: 1.25rem; font-weight: 700; color: #17181C; margin-top: 24px; margin-bottom: 12px;">📞 Contact & Support:</h3>
        <ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px; color: #374151;">
          <li style="margin-bottom: 6px;">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/994506684925" style="color: #D8232A; text-decoration: underline;">+994 50 668 49 25</a></li>
          <li style="margin-bottom: 6px;">📸 <strong>Instagram:</strong> <a href="https://instagram.com/rubikshop.az" style="color: #D8232A; text-decoration: underline;">@rubikshop.az</a></li>
        </ul>
      </div>
    `,
    content_ru: `
      <div style="line-height: 1.8;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #17181C; margin-bottom: 12px;">Добро пожаловать в RubikShop.az!</h2>
        <p style="margin-bottom: 20px; color: #4B5563;"><strong>RubikShop.az</strong> — магазин скоростных кубиков и головоломок №1 в Азербайджане. Наша цель — предоставить доступные, оригинальные и качественные кубики Рубика, смазки и аксессуары.</p>
        
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #D8232A; margin-top: 24px; margin-bottom: 12px;">🚀 Условия Доставки:</h3>
        <ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 24px; color: #374151;">
          <li style="margin-bottom: 8px;"><strong>Доставка до станций метро Баку:</strong> Быстрая передача на любой станции метро.</li>
          <li style="margin-bottom: 8px;"><strong>Быстрый Заказ:</strong> Оформление заказа в 1 клик через WhatsApp из корзины.</li>
        </ul>

        <h3 style="font-size: 1.25rem; font-weight: 700; color: #17181C; margin-top: 24px; margin-bottom: 12px;">📞 Контакты:</h3>
        <ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px; color: #374151;">
          <li style="margin-bottom: 6px;">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/994506684925" style="color: #D8232A; text-decoration: underline;">+994 50 668 49 25</a></li>
          <li style="margin-bottom: 6px;">📸 <strong>Instagram:</strong> <a href="https://instagram.com/rubikshop.az" style="color: #D8232A; text-decoration: underline;">@rubikshop.az</a></li>
        </ul>
      </div>
    `
  }
};

export default function DynamicCMSPage({ params }: { params: { locale: string; slug: string } }) {
  const resolvedParams = params && typeof (params as any).then === 'function' ? React.use(params as any) as any : params;
  const locale = resolvedParams?.locale || 'az';
  const slug = resolvedParams?.slug || '';

  const [pageData, setPageData] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();
        
        if (!error && data) {
          setPageData(data as CMSPage);
        } else if (DEFAULT_PAGES[slug]) {
          setPageData(DEFAULT_PAGES[slug]);
        }
      } catch (err) {
        if (DEFAULT_PAGES[slug]) {
          setPageData(DEFAULT_PAGES[slug]);
        }
      }
      setLoading(false);
    }
    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-[#17181C] flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-[#D8232A]">
          <div className="w-5 h-5 border-2 border-[#D8232A] border-t-transparent rounded-full animate-spin" />
          <span>Yüklənir...</span>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-[#17181C] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-[#D8232A] mb-4 animate-bounce" />
        <h1 className="text-2xl font-black uppercase tracking-wider text-[#17181C]">Səhifə Tapılmadı</h1>
        <p className="text-[#6B7280] mt-2 max-w-sm text-sm">
          Axtardığınız səhifə silinib və ya mövcud deyil.
        </p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#D8232A] text-white font-bold text-sm rounded-xl hover:bg-[#B31B21] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Ana Səhifəyə Qayıt
        </Link>
      </div>
    );
  }

  const title = pageData[`title_${locale}` as keyof CMSPage] || pageData.title_az;
  const content = pageData[`content_${locale}` as keyof CMSPage] || pageData.content_az;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#17181C] py-10 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto space-y-6">
        
        {/* Breadcrumb / Back button */}
        <div>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#D8232A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Ana Səhifə
          </Link>
        </div>

        {/* Card Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDEDED] shadow-sm space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D8232A]/10 border border-[#D8232A]/20 rounded-full text-xs font-black text-[#D8232A] uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> RubikShop Məlumat
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#17181C]">
            {String(title)}
          </h1>
        </div>

        {/* Main Content Body */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDEDED] shadow-sm">
          <div 
            className="prose max-w-none text-[#374151] leading-relaxed text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: String(content) }}
          />
        </div>

      </article>
    </div>
  );
}

