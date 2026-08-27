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

        <h3 style="font-size: 1.25rem; font-weight: 700; color: #17181C; margin-top: 24px; margin-bottom: 12px;">📞 Əlaqə və Dəstək:</h3>
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
      </div>
    `,
    content_ru: `
      <div style="line-height: 1.8;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #17181C; margin-bottom: 12px;">Добро пожаловать в RubikShop.az!</h2>
        <p style="margin-bottom: 20px; color: #4B5563;"><strong>RubikShop.az</strong> — магазин скоростных кубиков и головоломок №1 в Азербайджане.</p>
      </div>
    `
  },
  'return-policy': {
    id: 'default-return-policy',
    slug: 'return-policy',
    title_az: 'Qaytarılma və Dəyişdirmə Qaydaları',
    title_en: 'Return and Exchange Policy',
    title_ru: 'Правила возврата и обмена',
    content_az: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;"><strong>RubikShop.az</strong> internet mağazasında alıcı məmnuniyyəti və şəffaflıq ən yüksək prioritetimizdir. Bütün qaytarılma və dəyişdirmə prosedurları Azərbaycan Respublikasının <strong>"İstehlakçıların hüquqlarının müdafiəsi haqqında"</strong> və <strong>"Elektron ticarət haqqında"</strong> Qanunlarına tam uyğun olaraq həyata keçirilir.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">1. Qanuni Qaytarma Müddəti:</h3>
        <p style="margin-bottom: 16px;">Alıcı qüsursuz məhsulu təhvil aldığı andan etibarən <strong>14 (on dörd) təqvim günü</strong> ərzində heç bir səbəb göstərmədən geri qaytarmaq və ya digər modelə dəyişdirmək hüququna malikdir.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">2. Məhsul Qrupları Üzrə Xüsusi Şərtlər:</h3>
        <ul style="list-style-type: disc; padding-left: 24px; margin-bottom: 16px;">
          <li style="margin-bottom: 8px;"><strong>Rubik Kubları və Mexaniki Tapmacalar:</strong> Məhsulun orijinal zavod vakuum qablaşdırması (jelatini) açılmamış, cırılmamış, mexanizm fırladılmamış, zavod tənzimləməsi dəyişdirilməmiş və sürtkü yağı tətbiq edilməmiş olmalıdır. Jelatini açılmış məhsullar fərdi istifadə və mexaniki toxunulmazlıq səbəbilə təkrar satışa yararsız hesab edildiyindən geri qaytarılmır və dəyişdirilmir.</li>
          <li style="margin-bottom: 8px;"><strong>Sürtkü Yağları (Lube):</strong> Flakonun qapağı, damcıladıcı ucluğu və ya şpris kilidi açılmış, istifadə olunmuş və ya həcm itkisi olan maye məhsullar istehlak xassəsi səbəbilə geri qaytarılmır və dəyişdirilmir.</li>
          <li style="margin-bottom: 8px;"><strong>Elektron Taymerlər və Aksesuarlar:</strong> Orijinal qutu, qoşulma kabelləri, batareya qoruyucu lentləri və ekran örtüyü zədəsiz olmalıdır.</li>
          <li style="margin-bottom: 8px;"><strong>Xalçalar (Matlar) və Çantalar:</strong> Zavod bükümündə, deformasiyaya uğramamış, qatlanmamış və ləkəsiz vəziyyətdə təqdim edilməlidir.</li>
        </ul>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">3. İstehsal (Zavod) Qüsuru Halları:</h3>
        <p style="margin-bottom: 16px;">Məhsulda zavod defekti (sınıq nüvə, qopmuş daxili maqnit, işləməyən sensor və s.) aşkar edildikdə, AR "İstehlakçıların hüquqlarının müdafiəsi haqqında" Qanununun 7-ci maddəsinə uyğun olaraq məhsul <strong>ödənişsiz olaraq dərhal dəyişdirilir və ya ödəniş tam məbləğdə geri qaytarılır</strong>.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">4. Ödənişlərin Geri Qaytarılması Qaydası:</h3>
        <p style="margin-bottom: 16px;">Bank kartı və ya onlayn ödəmə sistemləri (E-POS) vasitəsilə edilmiş ödənişlər nağd pulla geri qaytarılmır. Bank və beynəlxalq ödəniş təhlükəsizliyi qaydalarına əsasən, məbləğ <strong>3–14 iş günü</strong> ərzində yalnız ödənişin həyata keçirildiyi bank kartına/hesabına geri köçürülür.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">5. Çatdırılma və Daşınma Xərcləri:</h3>
        <p style="margin-bottom: 16px;">Zavod qüsuru olduqda bütün kuryer və poçt xərcləri <strong>RubikShop.az</strong> tərəfindən ödənilir. Qüsursuz məhsulun alıcının şəxsi təşəbbüsü ilə qaytarılması və ya dəyişdirilməsi zamanı çatdırılma xərcləri alıcı tərəfindən qarşılanır.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">6. Əlaqə və Müraciət:</h3>
        <p style="margin-bottom: 16px;">Qaytarılma və ya dəyişdirmə müraciəti üçün WhatsApp (<a href="https://wa.me/994506684925" style="color: #D8232A; font-weight: bold;">+994 50 668 49 25</a>) və ya <a href="mailto:info@rubikshop.az" style="color: #D8232A; font-weight: bold;">info@rubikshop.az</a> e-poçt ünvanı vasitəsilə əlaqə saxlaya bilərsiniz.</p>
      </div>
    `,
    content_en: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;">All return and exchange procedures at <strong>RubikShop.az</strong> strictly comply with the legislation of the Republic of Azerbaijan on consumer protection and electronic commerce.</p>
        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">1. 14-Day Return Window:</h3>
        <p style="margin-bottom: 16px;">Customers may return or exchange unopened, pristine products within 14 calendar days of receipt.</p>
        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">2. Factory Sealed Products:</h3>
        <p style="margin-bottom: 16px;">Speedcubes and mechanical puzzles must have their original vacuum factory wrap (plastic film) fully intact. Cubes with broken seals, lubricated, or adjusted mechanisms cannot be returned for resale reasons.</p>
      </div>
    `,
    content_ru: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;">Все процедуры возврата и обмена в интернет-магазине <strong>RubikShop.az</strong> осуществляются в строгом соответствии с Законом Азербайджанской Республики «О защите прав потребителей» и «Об электронной торговле».</p>
        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">1. Срок возврата:</h3>
        <p style="margin-bottom: 16px;">Покупатель имеет право вернуть или обменять качественный товар в течение 14 календарных дней со дня покупки при сохранении товарного вида и заводской упаковки.</p>
      </div>
    `
  },
  'terms-of-service': {
    id: 'default-terms-of-service',
    slug: 'terms-of-service',
    title_az: 'İctimai Oferta (İstifadə Şərtləri)',
    title_en: 'Public Offer & Terms of Service',
    title_ru: 'Публичная Оферта (Условия)',
    content_az: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;">Bu sənəd Azərbaycan Respublikası Mülki Məcəlləsinin 408-ci maddəsinə və "Elektron ticarət haqqında" Azərbaycan Respublikasının Qanununa əsasən rəsmi <strong>İctimai Oferta</strong> (müqavilə bağlamaq təklifi) hesab olunur.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">1. Müqavilənin Tərəfləri və Predmeti:</h3>
        <p style="margin-bottom: 16px;">Bu müqavilə <strong>RubikShop.az</strong> internet mağazası (Fiziki şəxs: Mirsəlim Şahbazov, VÖEN: 1307525381) ilə sayt vasitəsilə sifariş yerləşdirən və ya məhsul alan istənilən hüquqi/fiziki şəxs (Alıcı) arasında bağlanır. Müqavilənin predmeti Rubik kubları, speedcubing tapmacaları, peşəkar yağlar, taymerlər və aksessuarların alqı-satqısını təşkil edir.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">2. Müqavilənin Bağlanması (Aksept):</h3>
        <p style="margin-bottom: 16px;">Alıcı saytda sifarişi təsdiqlədiyi, "İctimai Oferta və Qaytarılma Şərtlərini qəbul edirəm" bəndini işarələdiyi və onlayn ödənişi tamamladığı andan etibarən bu Ofertanın bütün şərtlərini qeyd-şərtsiz qəbul etmiş (aksept etmiş) sayılır.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">3. Qiymətlər və Valyuta:</h3>
        <p style="margin-bottom: 16px;">Saytda qeyd olunan bütün qiymətlər <strong>Azərbaycan Manatı (AZN)</strong> ilə göstərilir. Çatdırılma qiyməti seçilmiş ünvana və kuryer tarifinə uyğun olaraq sifariş anında hesablanır.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">4. Ödəniş və Təhlükəsizlik:</h3>
        <p style="margin-bottom: 16px;">Onlayn ödənişlər yerli və beynəlxalq bankların təhlükəsiz <strong>3D-Secure E-POS</strong> şlüzləri (Visa, MasterCard, Birbank, Epoint) vasitəsilə icra edilir. Müştərinin kart məlumatları RubikShop.az serverlərində qətiyyən saxlanılmır və birbaşa bankın təhlükəsizlik sistemində emal olunur.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">5. Çatdırılma Qaydaları:</h3>
        <p style="margin-bottom: 16px;">Sifarişlər Bakı metrosunun stansiyalarına, qapıya çatdırılma və ya Azərpoçt vasitəsilə Azərbaycanın bütün bölgələrinə 1–3 iş günü ərzində çatdırılır.</p>
      </div>
    `,
    content_en: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;">This document represents a Public Offer under Article 408 of the Civil Code of the Republic of Azerbaijan and the Law on Electronic Commerce.</p>
      </div>
    `,
    content_ru: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;">Данный документ является официальной Публичной Офертой в соответствии со статьей 408 Гражданского Кодекса Азербайджанской Республики.</p>
      </div>
    `
  },
  'privacy-policy': {
    id: 'default-privacy-policy',
    slug: 'privacy-policy',
    title_az: 'Məxfilik Siyasəti (Fərdi Məlumatlar)',
    title_en: 'Privacy Policy (Personal Data)',
    title_ru: 'Политика Конфиденциальности',
    content_az: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;"><strong>RubikShop.az</strong> olaraq müştərilərimizin fərdi məlumatlarının toxunulmazlığına və məxfiliyinə tam zəmanət veririk. Fərdi məlumatların emalı Azərbaycan Respublikasının <strong>"Fərdi məlumatlar haqqında"</strong> Qanununa ciddi şəkildə uyğundur.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">1. Toplanan Fərdi Məlumatlar:</h3>
        <ul style="list-style-type: disc; padding-left: 24px; margin-bottom: 16px;">
          <li style="margin-bottom: 6px;">Ad və Soyad;</li>
          <li style="margin-bottom: 6px;">Əlaqə telefon nömrəsi;</li>
          <li style="margin-bottom: 6px;">Çatdırılma ünvanı (və ya təhvil metrostansiyası);</li>
          <li style="margin-bottom: 6px;">Elektron poçt ünvanı (istəyə bağlı).</li>
        </ul>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">2. Məlumatların İstifadə Məqsədləri:</h3>
        <p style="margin-bottom: 16px;">Toplanmış məlumatlar yalnız sifarişlərin dəqiq icrası, çatdırılması, alıcı ilə operativ əlaqə saxlanılması və müştəri xidmətinin təmin olunması üçün istifadə olunur.</p>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: #17181C; margin-top: 24px; margin-bottom: 10px;">3. Üçüncü Şəxslərə Ötürülməmə:</h3>
        <p style="margin-bottom: 16px;">Fərdi məlumatlar kuryer/çatdırılma xidməti istisna olmaqla heç bir halda üçüncü şəxslərə ötürülmür, satılmır və ya kommersiya məqsədilə yayılmır.</p>
      </div>
    `,
    content_en: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;"><strong>RubikShop.az</strong> is committed to protecting your personal data in accordance with the Law of the Republic of Azerbaijan on Personal Data.</p>
      </div>
    `,
    content_ru: `
      <div style="line-height: 1.8; color: #374151;">
        <p style="margin-bottom: 16px;"><strong>RubikShop.az</strong> гарантирует конфиденциальность ваших персональных данных в соответствии с Законом Азербайджанской Республики «О персональных данных».</p>
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

