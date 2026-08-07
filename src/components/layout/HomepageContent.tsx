'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  ShoppingBag,
  Truck,
  Gift,
  Building2,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Star,
  Users,
  BookOpen,
  MessageSquare,
  Flame,
  Search,
  Grid3X3,
  Droplet,
  Timer,
  Layers,
  ChevronDown,
  Clock
} from 'lucide-react';
import type { ApplicationDictionary } from '@/types/application.types';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/lib/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { sanitizeImageUrl } from '@/lib/image';

interface Product {
  id: string;
  title: string;
  price_azn: number;
  image_url: string;
  stock_quantity: number;
  compare_at_price_azn?: number;
  original_price_azn?: number;
  discount_percent?: number;
}

interface HomepageContentProps {
  products: Product[];
  dict: ApplicationDictionary;
  locale: string;
  banners?: any[];
}

export function HomepageContent({ products = [], dict, locale, banners = [] }: HomepageContentProps) {
  const [activeTab, setActiveTab] = React.useState<'new' | 'best' | 'sale'>('new');
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = React.useState(0);

  // Dynamic DB States
  const [heroProduct, setHeroProduct] = React.useState<any | null>(null);
  const [bundleProduct, setBundleProduct] = React.useState<any | null>(null);
  const [activeCampaign, setActiveCampaign] = React.useState<any | null>(null);
  const [approvedReviews, setApprovedReviews] = React.useState<any[]>([]);
  const [dbBlogPosts, setDbBlogPosts] = React.useState<any[]>([]);
  const [dbLoading, setDbLoading] = React.useState(true);

  React.useEffect(() => {
    if (banners && banners.length > 1) {
      const interval = setInterval(() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length), 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const addItem = useCartStore((state) => state.addItem);

  // Localization translator helper
  const t = (obj: { az: string; en: string; ru: string }) => {
    return obj[locale as 'az' | 'en' | 'ru'] || obj.az;
  };

  const currentProducts = Array.isArray(products) ? products : [];

  // Filter products into tab items
  const newArrivals = currentProducts.slice(0, 4);
  const bestSellers = currentProducts.filter(p => p && p.stock_quantity > 0).slice(0, 4);
  
  const saleProducts = currentProducts
    .filter(p => {
      if (!p) return false;
      const candidates = [
        p.original_price_azn,
        p.compare_at_price_azn,
        (p as any).compare_at_price,
        (p as any).discount_price,
        (p as any).old_price,
        (p as any).original_price
      ]
        .map(v => (v !== undefined && v !== null && v !== '') ? Number(v) : NaN)
        .filter(v => !isNaN(v) && v > Number(p.price_azn || 0));

      return candidates.length > 0 || ((p as any).discount_percent && Number((p as any).discount_percent) > 0);
    });

  const activeSaleProducts = saleProducts.length > 0 ? saleProducts.slice(0, 4) : currentProducts.slice(0, 4);

  const getActiveProducts = () => {
    switch (activeTab) {
      case 'best': return bestSellers;
      case 'sale': return activeSaleProducts;
      default: return newArrivals;
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;
    addItem({
      id: product.id,
      title: product.title,
      price_azn: product.price_azn,
      quantity: 1,
      image_url: product.image_url,
    });
  };

  const handleAddBundleToCart = (bundle: any) => {
    if (bundle.stock_quantity <= 0) return;
    addItem({
      id: bundle.id,
      title: bundle.title,
      price_azn: bundle.price_azn,
      quantity: 1,
      image_url: bundle.image_url,
    });
  };

  // Fetch dynamic real-time data from Supabase client
  React.useEffect(() => {
    async function fetchDbData() {
      try {
        const supabaseClient = createClient();

        // 1. Fetch Approved Reviews
        const { data: reviewsData, error: reviewsError } = await supabaseClient
          .from('reviews')
          .select('id, rating, comment, created_at, profiles(full_name, avatar_url), products(title_az, title_en, title_ru)')
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (!reviewsError && reviewsData) {
          setApprovedReviews(reviewsData);
        }

        // 2. Fetch Featured / Recent Product for Hero Preview Card
        const { data: featuredProducts, error: featuredError } = await supabaseClient
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false });

        let chosenHero: any = null;
        if (!featuredError && featuredProducts && featuredProducts.length > 0) {
          chosenHero = featuredProducts[0];
        } else {
          const { data: recentProducts, error: recentError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!recentError && recentProducts && recentProducts.length > 0) {
            chosenHero = recentProducts[0];
          }
        }

        if (chosenHero) {
          const titleKey = `title_${locale}` as keyof typeof chosenHero;
          const descKey = `description_${locale}` as keyof typeof chosenHero;

          setHeroProduct({
            id: chosenHero.id,
            title: (chosenHero[titleKey] || chosenHero.title_az || '') as string,
            description: (chosenHero[descKey] || chosenHero.description_az || '') as string,
            price_azn: Number(chosenHero.price_azn || 0),
            image_url: sanitizeImageUrl(chosenHero.image_url, chosenHero.id),
            stock_quantity: Number(chosenHero.stock_quantity || 0),
            compare_at_price_azn: chosenHero.compare_at_price_azn ? Number(chosenHero.compare_at_price_azn) : undefined,
            original_price_azn: chosenHero.original_price_azn ? Number(chosenHero.original_price_azn) : undefined,
            discount_percent: chosenHero.discount_percent ? Number(chosenHero.discount_percent) : undefined,
            tags: chosenHero.tags || [],
          });
        }

        // 3. Fetch Bundle Products (Category: bundles)
        const { data: categoriesData } = await supabaseClient
          .from('categories')
          .select('id, slug_az, slug_en, slug_ru, name_az, name_en, name_ru');

        let bundleCatIds: string[] = [];
        if (categoriesData) {
          bundleCatIds = categoriesData
            .filter(c => 
              c.slug_az?.toLowerCase() === 'bundles' ||
              c.slug_en?.toLowerCase() === 'bundles' ||
              c.slug_ru?.toLowerCase() === 'bundles' ||
              c.name_az?.toLowerCase().includes('dəst') ||
              c.name_en?.toLowerCase().includes('bundle')
            )
            .map(c => c.id);
        }

        let foundBundle: any = null;
        if (bundleCatIds.length > 0) {
          const { data: prodCats } = await supabaseClient
            .from('product_categories')
            .select('product_id')
            .in('category_id', bundleCatIds);

          if (prodCats && prodCats.length > 0) {
            const prodIds = prodCats.map(pc => pc.product_id);
            const { data: pData } = await supabaseClient
              .from('products')
              .select('*')
              .eq('is_active', true)
              .in('id', prodIds)
              .order('created_at', { ascending: false })
              .limit(1);

            if (pData && pData.length > 0) {
              const bProd = pData[0];
              const titleKey = `title_${locale}` as keyof typeof bProd;
              const descKey = `description_${locale}` as keyof typeof bProd;

              foundBundle = {
                id: bProd.id,
                title: (bProd[titleKey] || bProd.title_az || '') as string,
                description: (bProd[descKey] || bProd.description_az || '') as string,
                price_azn: Number(bProd.price_azn || 0),
                image_url: sanitizeImageUrl(bProd.image_url, bProd.id),
                stock_quantity: Number(bProd.stock_quantity || 0),
                compare_at_price_azn: bProd.compare_at_price_azn ? Number(bProd.compare_at_price_azn) : undefined,
                original_price_azn: bProd.original_price_azn ? Number(bProd.original_price_azn) : undefined,
                discount_percent: bProd.discount_percent ? Number(bProd.discount_percent) : undefined,
              };
            }
          }
        }
        setBundleProduct(foundBundle);

        // 4. Fetch Active Campaigns
        const nowStr = new Date().toISOString();
        const { data: campaignsData } = await supabaseClient
          .from('campaigns')
          .select('*')
          .eq('is_active', true)
          .lte('start_date', nowStr)
          .gte('end_date', nowStr)
          .order('created_at', { ascending: false })
          .limit(1);

        if (campaignsData && campaignsData.length > 0) {
          setActiveCampaign(campaignsData[0]);
        }

        // 5. Fetch Published Blog Posts
        const { data: blogData } = await supabaseClient
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (blogData) {
          setDbBlogPosts(blogData);
        }

      } catch (err) {
        console.error('Error fetching dynamic homepage db data:', err);
      } finally {
        setDbLoading(false);
      }
    }

    fetchDbData();
  }, [locale]);

  const renderPromotionalSection = () => {
    if (dbLoading) return null;

    if (!bundleProduct && !activeCampaign) {
      return null;
    }

    // Prefer bundleProduct if it exists
    if (bundleProduct) {
      const originalPrice = bundleProduct.original_price_azn || bundleProduct.compare_at_price_azn;
      const hasSale = originalPrice && originalPrice > bundleProduct.price_azn;

      return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-rubik-charcoal to-rubik-charcoal-dark border border-border/10 rounded-xl p-8 lg:p-12 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="px-3 py-1 bg-rubik-brand/20 border border-rubik-brand/40 text-rubik-brand text-xs font-bold rounded-full uppercase tracking-wider">
                {t({ az: 'MƏHDUD DƏST TEKLİFİ', en: 'LIMITED EDITION BUNDLE', ru: 'ЛИМИТИРОВАННЫЙ НАБОР' })}
              </span>
              <h2 className="text-2xl lg:text-3xl font-black text-white">
                {bundleProduct.title}
              </h2>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed max-w-xl">
                {bundleProduct.description || t({
                  az: 'Xüsusi endirimlə təqdim olunan kub dəstləri.',
                  en: 'Exclusive puzzle packages available for a limited time.',
                  ru: 'Эксклюзивные наборы кубиков, доступные в течение ограниченного времени.'
                })}
              </p>
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl md:text-3xl font-black text-rubik-brand">{bundleProduct.price_azn.toFixed(2)} AZN</span>
                {hasSale && (
                  <span className="text-sm text-gray-500 line-through">{(originalPrice as number).toFixed(2)} AZN</span>
                )}
              </div>
              <button
                onClick={() => handleAddBundleToCart(bundleProduct)}
                disabled={bundleProduct.stock_quantity <= 0}
                className="px-6 py-3 bg-rubik-brand hover:bg-rubik-brand-dark disabled:bg-muted disabled:text-muted-foreground text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{bundleProduct.stock_quantity <= 0 ? dict.product.out_of_stock : t({ az: 'Paketi Səbətə Əlavə Et', en: 'Add Bundle to Cart', ru: 'Добавить набор в корзину' })}</span>
              </button>
            </div>
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-64 h-64 bg-black/40 rounded-2xl border border-border/10 p-4 flex items-center justify-center">
                <Image
                  src={sanitizeImageUrl(bundleProduct.image_url, bundleProduct.id)}
                  alt={bundleProduct.title}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-contain p-6 hover:scale-105 transition-transform"
                />
              </div>
            </div>
          </div>
        </section>
      );
    }

    // Active Campaign display
    if (activeCampaign) {
      return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-8 lg:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-center max-w-4xl mx-auto space-y-6">
            <span className="px-3 py-1 bg-[#FDECEC] border border-[#D8232A]/30 text-[#D8232A] text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">
              {t({ az: 'XÜSUSİ KAMPANİYA', en: 'SPECIAL CAMPAIGN', ru: 'СПЕЦИАЛЬНАЯ КАМПАНИЯ' })}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-[#17181C]">
              {activeCampaign.name}
            </h2>
            <p className="text-[#6B7280] text-sm md:text-base leading-relaxed max-w-xl mx-auto">
              {t({
                az: `Mağazamızdakı məhsullara ${activeCampaign.discount_percent}%-dək möhtəşəm endirim kampaniyası başladı! Fürsəti qaçırmayın.`,
                en: `A magnificent campaign has started with up to ${activeCampaign.discount_percent}% off on select products!`,
                ru: `Началась великолепная кампания со скидками до ${activeCampaign.discount_percent}% на выделенные товары!`
              })}
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  const element = document.getElementById('catalog-grid');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-[#D8232A] hover:bg-[#B31B21] text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                <span>{t({ az: 'Kampaniyadakı Məhsulları Kəşf Et', en: 'Explore Campaign Products', ru: 'Посмотреть товары кампании' })}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      );
    }

    return null;
  };

  const renderReviewsSection = () => {
    if (dbLoading || approvedReviews.length === 0) {
      return null;
    }

    return (
      <div className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-foreground font-sans tracking-tight">
            {t({ az: 'Yerli Speedcuberlərin Rəyləri', en: 'Loved by Local Cubers', ru: 'Отзывы местных спидкуберов' })}
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            {t({
              az: 'Azərbaycanın fərqli yaş qruplarından olan rəsmi yarış iştirakçılarının rəyləri.',
              en: 'Hear from official Azerbaijani tournament speedcubers who solve with our gear.',
              ru: 'Отзывы официальных участников соревнований из Азербайджана.'
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {approvedReviews.slice(0, 6).map((review, idx) => {
            const userName = review.profiles?.full_name || t({ az: 'Anonim Müştəri', en: 'Anonymous Customer', ru: 'Анонимный клиент' });
            const productName = review.products ? (review.products[`title_${locale}`] || review.products.title_az) : '';
            
            return (
              <div key={review.id || idx} className="bg-card border border-border p-6 rounded-3xl relative shadow-soft-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-1 text-rubik-yellow">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/80 italic leading-relaxed">&quot;{review.comment}&quot;</p>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-6">
                  <div>
                    <span className="block text-sm font-bold text-foreground">{userName}</span>
                    {productName && (
                      <span className="block text-[10px] text-muted-foreground line-clamp-1">{productName}</span>
                    )}
                  </div>
                  <span className="text-xs font-black bg-rubik-brand/10 text-rubik-brand px-2.5 py-1 rounded-md">
                    ★ {review.rating}.0
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // FAQ contents
  const faqs = [
    {
      q: {
        az: 'Sifarişlər nə qədər vaxta çatdırılır?',
        en: 'How long does delivery take?',
        ru: 'Сколько времени занимает доставка?'
      },
      a: {
        az: 'Bakı daxilində sifarişləriniz 24 saat ərzində sürətli kuryer vasitəsilə çatdırılır. Azərbaycanın digər rayon və şəhərlərinə isə "Azərpoçt" ilə 2-3 iş günü ərzində etibarlı şəkildə göndərilir.',
        en: 'Orders in Baku are delivered within 24 hours via express courier. For other regions and cities of Azerbaijan, it is safely shipped via "Azerpost" within 2-3 business days.',
        ru: 'Заказы в Баку доставляются в течение 24 часов экспресс-курьером. В другие регионы и города Азербайджана отправка осуществляется надежно через «Азерпочта» в течение 2-3 рабочих дней.'
      }
    },
    {
      q: {
        az: 'Mağazada satılan məhsullar orijinaldır?',
        en: 'Are the products sold in the store original?',
        ru: 'Оригинальные ли товары продаются в магазине?'
      },
      a: {
        az: 'Bəli, tamamilə! Biz yalnız GAN, MoYu, QiYi, X-Man və DaYan kimi dünyanın lider speedcubing istehsalçıları ilə birbaşa əməkdaşlıq edirik və bütün məhsullara rəsmi orijinallıq zəmanəti veririk.',
        en: 'Yes, absolutely! We only cooperate directly with the worlds leading speedcubing manufacturers such as GAN, MoYu, QiYi, X-Man, and DaYan, providing an official guarantee of authenticity for all items.',
        ru: 'Да, абсолютно! Мы сотрудничаем напрямую только с ведущими мировыми производителями спидкубинга, такими как GAN, MoYu, QiYi, X-Man и DaYan, предоставляя официальную гарантию подлинности на все товары.'
      }
    },
    {
      q: {
        az: 'Yeni başlayanlar üçün hansı kubu tövsiyə edirsiniz?',
        en: 'Which cube do you recommend for beginners?',
        ru: 'Какой кубик вы рекомендуете новичкам?'
      },
      a: {
        az: 'Yeni başlayanlar üçün həm qiyməti uyğun, həm də içində maqnit sistemi olan QiYi MS Magnetic və ya MoYu RS3M V2 modelini tövsiyə edirik. Maqnit sistemi kubu daha asan idarə etməyə və öyrənməyə kömək edir.',
        en: 'For beginners, we highly recommend the QiYi MS Magnetic or MoYu RS3M V2, which are both budget-friendly and equipped with magnetic alignment systems. Magnets help you control and learn the cube much easier.',
        ru: 'Для новичков мы рекомендуем QiYi MS Magnetic или MoYu RS3M V2, которые экономичны и оснащены системами магнитного позиционирования. Магниты помогают легче контролировать и осваивать куб.'
      }
    },
    {
      q: {
        az: 'Professional kubların gərginliyini necə nizamlamaq olar?',
        en: 'How to adjust the tension of professional cubes?',
        ru: 'Как отрегулировать натяжение профессиональных кубиков?'
      },
      a: {
        az: 'Bizim Rubikshop Premium Quraşdırma (Setup) xidmətimizdən istifadə edə bilərsiniz! Ekspertlərimiz kubun yaylarını və maqnit gərginliyini sizin fırlatma tərzinizə uyğun şəkildə xüsusi alətlərlə tam pulsuz tənzimləyəcək.',
        en: 'You can use our Rubikshop Premium Setup service! Our experts will fine-tune the springs and magnet tension of your cube to perfectly match your turning style using professional tools.',
        ru: 'Вы можете воспользоваться нашей услугой премиум-настройки Rubikshop! Наши специалисты бесплатно настроят пружины и натяжение магнитов вашего кубика в соответствии с вашим стилем вращения.'
      }
    }
  ];

  // Blog posts
  const blogPosts = [
    {
      id: 1,
      title: {
        az: '2026-cı ilin Ən Sürətli Flaqman Kubları: Müqayisəli Təhlil',
        en: 'The Fastest Flagship Cubes of 2026: Comparative Analysis',
        ru: 'Самые быстрые флагманские кубики 2026 года: сравнительный анализ'
      },
      desc: {
        az: 'GAN 14, MoYu WeiLong V9 və Tornado V3 modellərinin ətraflı testi. Hansı kub sizin sürətiniz üçün daha uyğundur?',
        en: 'In-depth test of GAN 14, MoYu WeiLong V9, and Tornado V3 models. Which cube matches your turning style best?',
        ru: 'Подробный тест моделей GAN 14, МоYu WeiLong V9 и Tornado V3. Какой куб лучше всего подходит для вашей скорости?'
      },
      date: '11.07.2026',
      readTime: '5 min',
      image: 'https://picsum.photos/seed/blog1/800/500'
    },
    {
      id: 2,
      title: {
        az: 'MagLev Texnologiyası Nədir və Sürətə Necə Təsir Edir?',
        en: 'What is MagLev Technology and How Does It Affect Speed?',
        ru: 'Что такое технология MagLev и как она влияет на скорость?'
      },
      desc: {
        az: 'Klassik yay mexanizmini əvəz edən maqnit asqısı sayəsində sürtünmənin minimuma enməsi və rekord həll sirləri.',
        en: 'Friction reduction through magnetic repulsion replacing standard springs, leading to record-breaking solves.',
        ru: 'Снижение трения за счет магнитной подвески, заменяющей стандартные пружины, что ведет к рекордным сборкам.'
      },
      date: '08.07.2026',
      readTime: '4 min',
      image: 'https://picsum.photos/seed/blog2/800/500'
    },
    {
      id: 3,
      title: {
        az: 'Kubun Düzgün Yağlanması Qaydaları: Silikon vs Su Əsaslı',
        en: 'Proper Cube Lubrication: Silicone vs Water-Based Lubes',
        ru: 'Правильная смазка куба: силиконовая против водной'
      },
      desc: {
        az: 'Kubun həm daxili nüvəsini, həm də üzlərini hansı ardıcıllıqla yağlamalıyıq? Professional məsləhətlər.',
        en: 'How to properly apply core and piece lubes in a precise step-by-step sequence. Professional tips.',
        ru: 'Как правильно наносить смазку на крестовину и детали кубика в точной последовательности. Советы профи.'
      },
      date: '05.07.2026',
      readTime: '6 min',
      image: 'https://picsum.photos/seed/blog3/800/500'
    }
  ];

  return (
    <div className="w-full bg-background overflow-hidden">
      {/* 1. HERO SECTION (Light Theme) */}
      <section className="relative bg-[#FFFFFF] text-[#17181C] py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB] overflow-hidden">
        {banners.length > 0 && banners[currentBannerIndex] ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentBannerIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-7 space-y-6 md:space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDECEC] border border-[#D8232A]/30 text-[#B31B21] text-xs font-bold uppercase tracking-wider animate-pulse">
                  <Sparkles className="h-4 w-4" />
                  <span>{banners[currentBannerIndex][`subtitle_${locale}`] || banners[currentBannerIndex].subtitle_az || t({ az: 'Xüsusi Təklif', en: 'Special Offer', ru: 'Специальное предложение' })}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-[#17181C] font-sans">
                  {banners[currentBannerIndex][`title_${locale}`] || banners[currentBannerIndex].title_az}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href={banners[currentBannerIndex].link_url || '#'}
                    className="px-8 py-4 bg-[#D8232A] hover:bg-[#B31B21] text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                  >
                    <span>{banners[currentBannerIndex][`button_text_${locale}`] || banners[currentBannerIndex].button_text_az || t({ az: 'Kəşf Et', en: 'Explore', ru: 'Исследовать' })}</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="lg:col-span-5 flex justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBannerIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-sm rounded-3xl overflow-hidden shadow-soft-2xl relative aspect-square"
                >
                  <Image
                    src={sanitizeImageUrl(banners[currentBannerIndex].image_url, 'banner')}
                    alt={banners[currentBannerIndex][`title_${locale}`] || 'Banner Image'}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {banners.length > 1 && (
              <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`h-2 rounded-full transition-all ${idx === currentBannerIndex ? 'w-8 bg-[#D8232A]' : 'w-2 bg-gray-300 hover:bg-gray-400'}`} 
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDECEC] border border-[#D8232A]/30 text-[#B31B21] text-xs font-bold uppercase tracking-wider animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span>{t({ az: 'Azərbaycan Speedcubing Flaqmanı', en: 'Azerbaijan Speedcubing Flagship', ru: 'Флагман Спидкубинга в Азербайджане' })}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-[#17181C] font-sans">
              <span>
                {t({
                  az: 'Sürətli Həllin Yeni Sərhədləri!',
                  en: 'New Frontiers of Speedcubing!',
                  ru: 'Новые рубежи спидкубинга!'
                })}
              </span>
              {" "}
              <br />
              <span className="text-[#D8232A]">
                RubikShop.az
              </span>
            </h1>
            <p className="text-base md:text-xl text-[#4B5563] font-sans leading-relaxed max-w-2xl mx-auto">
              {t({
                az: 'Azərbaycanın ilk və tək ixtisaslaşmış mağazasında 100% orijinal GAN, MoYu və QiYi flaqmanlarını kəşf edin. Premium tənzimləmə xidməti ilə rekordlarınızı alt-üst edin!',
                en: 'Discover 100% genuine GAN, MoYu, and QiYi flagships in Azerbaijan’s premier puzzle boutique. Destroy your personal records with our fine-tuning service!',
                ru: 'Откройте для себя 100% оригинальные флагманы GAN, MoYu и QiYi в первом специализированном магазине Азербайджана. Побейте рекорды!'
              })}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 justify-center">
              <button
                onClick={() => {
                  const element = document.getElementById('catalog-grid');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-[#D8232A] hover:bg-[#B31B21] text-white font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
              >
                <span>{t({ az: 'Kataloqu Kəşf Et', en: 'Explore Catalog', ru: 'Исследовать каталог' })}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('learning-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#17181C] border border-[#E5E7EB] font-bold rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <span>{t({ az: 'Alqoritmlər & Öyrənmə', en: 'Learn Algorithms', ru: 'Изучить алгоритмы' })}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 1.5. STATS & FEATURED FLAGSHIP PRODUCT SECTION (Light Section Backdrop) */}
      <section className="bg-[#F6F6F8] border-b border-[#E5E7EB] py-10 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Quick Stats Banner */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-4 p-6 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[#17181C]">
              <div>
                <span className="block text-2xl md:text-3xl font-black text-[#D8232A] font-mono">24h</span>
                <span className="text-xs text-[#6B7280] font-sans font-medium">{t({ az: 'Sürətli Çatdırılma', en: 'Fast Delivery', ru: 'Быстрая доставка' })}</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-black text-[#D8232A] font-mono">100%</span>
                <span className="text-xs text-[#6B7280] font-sans font-medium">{t({ az: 'Orijinal Brendlər', en: 'Genuine Brand', ru: 'Оригинальные бренды' })}</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-black text-[#16A34A] font-mono">5k+</span>
                <span className="text-xs text-[#6B7280] font-sans font-medium">{t({ az: 'Məmnun Müştəri', en: 'Happy Cubers', ru: 'Довольные клиенты' })}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Featured Hero Product Card slot */}
          {heroProduct ? (
            <div className="lg:col-span-5 flex justify-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] relative text-[#17181C]"
              >
                <div className="relative aspect-square w-full bg-[#F9FAFB] border border-[#F3F4F6] rounded-xl overflow-hidden p-4 mb-4 flex items-center justify-center">
                  <div className="absolute top-2.5 right-2.5 z-10 bg-[#FDECEC] border border-[#D8232A]/30 text-[#B31B21] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                    {t({ az: 'FLAQMAN', en: 'FLAGSHIP', ru: 'ФЛАГМАН' })}
                  </div>
                  <Image
                    src={sanitizeImageUrl(heroProduct.image_url, heroProduct.id)}
                    alt={heroProduct.title}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-contain p-6 transform hover:rotate-12 transition-transform duration-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-[#17181C] leading-tight line-clamp-1">{heroProduct.title}</h3>
                      <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">
                        {heroProduct.description || t({ az: 'Premium Sürət Kubu', en: 'Premium Speedcube', ru: 'Премиум кубик' })}
                      </p>
                    </div>
                    <span className="text-xl font-black text-[#D8232A] shrink-0">{heroProduct.price_azn.toFixed(2)} AZN</span>
                  </div>

                  {(heroProduct.allow_preorder !== false && heroProduct.allow_preorder !== 0) && heroProduct.stock_quantity <= 0 ? (
                    <div className="flex flex-col w-full mt-3">
                      <button
                        onClick={() => handleAddToCart(heroProduct)}
                        className="w-full bg-[#FFFFFF] text-[#D8232A] border-[1.5px] border-[#D8232A] hover:bg-[#FDECEC] font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm"
                      >
                        <Clock className="h-4 w-4" />
                        <span>{locale === 'en' ? 'Pre-order' : locale === 'ru' ? 'Предзаказать' : 'Ön sifariş et'}</span>
                      </button>
                      <p className="text-[12px] text-[#6B7280] text-center mt-1 font-normal">
                        {locale === 'en' ? 'Delivered in 14-28 business days' : locale === 'ru' ? 'Доставка в течение 14-28 рабочих дней' : '14-28 iş günü ərzində çatdırılacaq'}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(heroProduct)}
                      disabled={heroProduct.stock_quantity <= 0}
                      className={`w-full mt-3 font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        heroProduct.stock_quantity <= 0
                          ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-none'
                          : 'bg-[#D8232A] hover:bg-[#B31B21] text-white active:scale-98'
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>{heroProduct.stock_quantity <= 0 ? dict.product.out_of_stock : dict.product.add_to_cart}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          ) : null}
        </div>
      </section>
      
      {/* 2. FEATURED CATEGORIES SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground font-sans">
            {t({ az: 'Kateqoriyalar üzrə Kəşf Edin', en: 'Explore by Category', ru: 'Исследуйте по категориям' })}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            {t({
              az: 'İstər sürət kubları, istərsə də professional taymer və aksesuarlar — bütün seçimlər bir kliklə qapınızda.',
              en: 'From high speed cubes to professional timers and lubes — find everything you need instantly.',
              ru: 'От скоростных кубиков до профессиональных таймеров и смазок — найдите все, что вам нужно.'
            })}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { id: '3x3', slug: '3x3', icon: Grid3X3, title: { az: '3x3', en: '3x3', ru: '3x3' } },
            { id: 'big-cubes', slug: '4x4', icon: Layers, title: { az: 'Böyük Kublar', en: 'Big Cubes', ru: 'Большие кубики' } },
            { id: 'minx-skewb', slug: 'pyraminx', icon: Award, title: { az: 'Piramida / Skewb', en: 'Pyraminx & Skewb', ru: 'Пирамидка / Скьюб' } },
            { id: 'lubes', slug: 'lubes', icon: Droplet, title: { az: 'Kub Yağları', en: 'Silicone Lubes', ru: 'Смазки для куба' } },
            { id: 'timers-mats', slug: 'timers', icon: Timer, title: { az: 'Taymer & Mat', en: 'Timer & Mats', ru: 'Таймеры и маты' } },
            { id: 'bundles', slug: 'bundles', icon: Gift, title: { az: 'Endirimli Dəstlər', en: 'Special Bundles', ru: 'Наборы со скидкой' } }
          ].map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/${locale}?category=${cat.slug}`}
                className="group flex flex-col items-center justify-center p-6 bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#17181C]/20 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-300 text-center space-y-4"
              >
                <div className="p-4 rounded-full bg-[#F3F4F6] text-[#17181C] transition-transform duration-300 group-hover:scale-110">
                  <IconComponent className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-[#17181C] group-hover:text-[#D8232A] transition-colors">
                  {t(cat.title)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. PRODUCT SHOWCASES SECTION */}
      <section id="catalog-grid" className="py-20 bg-muted/35 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border pb-6">
            <div className="space-y-1.5 text-center md:text-left">
              <h2 className="text-3xl font-black text-foreground font-sans tracking-tight">
                {t({ az: 'Mağaza Vitrini', en: 'Our Showcase', ru: 'Витрина магазина' })}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t({
                  az: 'Professional turnir sertifikatlı orijinal yarış kubları.',
                  en: 'Professional tournament-certified genuine speedcubes.',
                  ru: 'Оригинальные кубики с профессиональной сертификацией.'
                })}
              </p>
            </div>

            {/* Showcase Tabs */}
            <div role="tablist" aria-label="Məhsul nümayişi" className="flex items-center gap-1.5 bg-card p-1 border border-border rounded-xl shadow-soft-sm">
              {[
                { id: 'new', title: { az: 'Yeni Gələnlər', en: 'New Arrivals', ru: 'Новинки' } },
                { id: 'best', title: { az: 'Çox Satılanlar', en: 'Best Sellers', ru: 'Популярное' } },
                { id: 'sale', title: { az: 'Endirimlər', en: 'Special Deals', ru: 'Скидки' } }
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-rubik-brand text-white shadow-soft-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(tab.title)}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Loop Grid */}
          {getActiveProducts().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-muted/20">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t({ az: 'Məhsullar tapılmadı', en: 'No products found', ru: 'Продукты не найдены' })}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t({ az: 'Tezliklə yeni məhsullar əlavə ediləcək.', en: 'New products will be added soon.', ru: 'Скоро будут добавлены новые продукты.' })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {getActiveProducts().map((product) => (
                <ProductCard key={product.id} product={product} dict={dict} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. PROMO BANNERS & BUNDLE SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Shipping Banner */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] text-[#17181C] p-8 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-[#17181C]/20 flex flex-col justify-between space-y-6 group transition-all duration-300">
            <div className="p-3 bg-[#F3F4F6] text-[#17181C] rounded-xl w-fit">
              <Truck className="h-6 w-6 text-[#D8232A]" />
            </div>
            <div>
              <h3 className="text-xl font-bold leading-tight text-[#17181C]">
                {t({ az: '24 Saat Daxilində Sürətli Çatdırılma!', en: '24-Hour Express Courier!', ru: 'Экспресс курьер за 24 часа!' })}
              </h3>
              <p className="text-xs md:text-sm text-[#6B7280] mt-2">
                {t({
                  az: 'Bakı daxilində eyni gün kuryer çatdırılması. Sifarişi qapıda yoxlayaraq, nağd və ya kartla ödəniş imkanı.',
                  en: 'Same day shipping within Baku. Double-check your cube at your door, then pay cash or card.',
                  ru: 'Доставка в тот же день по Баку. Проверьте заказ на пороге и оплатите наличными или картой.'
                })}
              </p>
            </div>
          </div>

          {/* Gift Card Banner */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] text-[#17181C] p-8 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-[#17181C]/20 flex flex-col justify-between space-y-6 group transition-all duration-300">
            <div className="p-3 bg-[#F3F4F6] text-[#17181C] rounded-xl w-fit">
              <Gift className="h-6 w-6 text-[#D8232A]" />
            </div>
            <div>
              <h3 className="text-xl font-bold leading-tight text-[#17181C]">
                {t({ az: 'RubikShop Hədiyyə Kartları', en: 'Premium Gift Cards', ru: 'Подарочные карты' })}
              </h3>
              <p className="text-xs md:text-sm text-[#6B7280] mt-2">
                {t({
                  az: 'Doğmalarınız və speedcuber dostlarınız üçün ideal intellektual hədiyyə kartları. 20 - 200 AZN dəyərində.',
                  en: 'Perfect intellectual gift cards for speedcubers and family. Value from 20 to 200 AZN.',
                  ru: 'Идеальные интеллектуальные подарочные карты для спидкуберов. Номинал от 20 до 200 AZN.'
                })}
              </p>
            </div>
          </div>

          {/* Wholesale Banner */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] text-[#17181C] p-8 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-[#17181C]/20 flex flex-col justify-between space-y-6 group transition-all duration-300 md:col-span-2 lg:col-span-1">
            <div className="p-3 bg-[#F3F4F6] text-[#17181C] rounded-xl w-fit">
              <Building2 className="h-6 w-6 text-[#16A34A]" />
            </div>
            <div>
              <h3 className="text-xl font-bold leading-tight text-[#17181C]">
                {t({ az: 'Məktəblər & Klublar üçün Topdan Satış', en: 'Schools & Clubs Wholesale', ru: 'Опт для школ и клубов' })}
              </h3>
              <p className="text-xs md:text-sm text-[#6B7280] mt-2">
                {t({
                  az: 'Dərnəklər, məktəb layihələri və intellektual oyun qrupları üçün xüsusi endirimli topdan qiymətlər və əlaqə.',
                  en: 'Special high-volume discounts for classrooms, puzzle clubs, and intellect leagues with full supply.',
                  ru: 'Специальные скидки на большие объемы для учебных заведений, кружков и интеллектуальных лиг.'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Promotional Campaign / Bundle Section */}
        {renderPromotionalSection()}
      </section>

      {/* 5. TRUST & COMMUNITY SECTION */}
      <section className="py-20 bg-muted/20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Trust Badges Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: CheckCircle, title: { az: '100% Orijinal Brendlər', en: '100% Authentic Brands', ru: '100% Оригинальные бренды' }, desc: { az: 'Birbaşa rəsmi GAN, MoYu, QiYi zavodlarından idxal.', en: 'Direct source importing from manufacturers.', ru: 'Прямой импорт от производителей.' }, color: 'text-rubik-brand' },
              { icon: Award, title: { az: 'WCA Sertifikatlı', en: 'WCA Tournament Ready', ru: 'Сертифицировано WCA' }, desc: { az: 'Beynəlxalq yarış qaydaları ilə tam uyğun kublar.', en: 'Completely tournament legal puzzles.', ru: 'Кубики полностью соответствуют турнирным правилам.' }, color: 'text-rubik-green' },
              { icon: Truck, title: { az: 'Sürətli Çatdırılma', en: 'Lightning Fast Shipping', ru: 'Молниеносная доставка' }, desc: { az: 'Bütün sifarişlər 24 saat ərzində qapınızda.', en: 'Express courier delivery right to your door.', ru: 'Курьерская доставка прямо до вашей двери.' }, color: 'text-rubik-yellow' },
              { icon: Sparkles, title: { az: 'Ekspert Dəstəyi', en: 'Expert Support Line', ru: 'Экспертная поддержка' }, desc: { az: 'Speedcubing ustaları tərəfindən məsləhətlər.', en: 'Get advices from experienced local masters.', ru: 'Советы от опытных местных спидкуберов.' }, color: 'text-indigo-500' }
            ].map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="bg-card border border-border p-6 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-soft-sm">
                  <div className={`p-3 bg-muted rounded-xl ${badge.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm md:text-base font-bold text-foreground">{t(badge.title)}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(badge.desc)}</p>
                </div>
              );
            })}
          </div>

          {/* Brand Logos */}
          <div className="text-center space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {t({ az: 'RƏSMİ DISTRİBYUTOR BRENDLƏRİ', en: 'OFFICIAL DISTRIBUTED BRANDS', ru: 'ОФИЦИАЛЬНО ДИСТРИБЬЮТИРУЕМЫЕ БРЕНДЫ' })}
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-65 grayscale hover:grayscale-0 transition-all duration-500">
              {['GAN Cube', 'MoYu Culture', 'QiYi Toys', 'DaYan', 'X-Man Design', 'YuXin'].map((brand, idx) => (
                <span key={idx} className="text-lg md:text-xl font-sans font-black tracking-wider hover:text-rubik-brand transition-colors cursor-default">
                  {brand}
                </span>
              ))}
            </div>
          </div>

          {/* Dynamic Approved Reviews Section */}
          {renderReviewsSection()}

          {/* Community Team Sponsorship */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-8 lg:p-12 text-[#17181C] text-center space-y-6 max-w-4xl mx-auto shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <Users className="h-10 w-10 text-[#D8232A] mx-auto animate-bounce" />
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#17181C]">
                {t({ az: 'Sponsorluq Proqramına Qoşulun!', en: 'Apply for Team Sponsorship!', ru: 'Подайте заявку на спонсорство!' })}
              </h2>
              <p className="text-xs md:text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
                {t({
                  az: 'Siz rəsmi WCA yarışlarında iştirak edirsiniz? Ölkə rekordçusunuz yoxsa gələcək vəd edən gənc speedcubersiniz? Rubikshop AZ sizə peşəkar kub dəstəyi təklif edir.',
                  en: 'Do you participate in official WCA events or hold national records? Apply to join Rubikshop AZ professional racing team!',
                  ru: 'Участвуете в официальных соревнованиях WCA? Подайте заявку в команду Rubikshop AZ!'
                })}
              </p>
            </div>
            <button className="px-6 py-3 bg-[#D8232A] hover:bg-[#B31B21] text-white text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer">
              {t({ az: 'İndi Müraciət Et', en: 'Apply Now', ru: 'Подать заявку сейчас' })}
            </button>
          </div>

          {/* Learning Section */}
          <div id="learning-section" className="bg-card border border-border rounded-3xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <span className="px-3 py-1 bg-rubik-green/15 text-rubik-green text-[10px] font-black rounded-full uppercase tracking-wider">
                CUBING ACADEMY
              </span>
              <h2 className="text-2xl lg:text-3xl font-black text-foreground">
                {t({ az: 'Kubun Sirrlərini Pulsuz Öyrənin!', en: 'Master the Cube for Free!', ru: 'Освойте сборку кубика бесплатно!' })}
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                {t({
                  az: 'Peşəkar speedcubing-ə ilk addımlarınızı atın. Bizim öyrədici materiallarımız və alqoritm cədvəllərimiz vasitəsilə 3x3 kubu 1 dəqiqənin altında həll etməyi asanlıqla öyrənin. Dərsliklər və WCA rəsmi qaydaları burada.',
                  en: 'Get your official speedcubing journey started. Use our charts to learn CFOP (F2L, OLL, PLL) algorithms and solve the cube in under 1 minute.',
                  ru: 'Начните свое официальное путешествие спидкубера. С нашими схемами вы научитесь собирать кубик менее чем за 1 минуту.'
                })}
              </p>
              <div className="space-y-2 text-xs md:text-sm font-semibold">
                <div className="flex items-center gap-2 text-rubik-brand">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t({ az: '3x3 Başlanğıc LBL Metodu', en: '3x3 Beginner LBL Method', ru: 'Метод LBL для начинающих 3x3' })}</span>
                </div>
                <div className="flex items-center gap-2 text-rubik-green">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t({ az: 'Peşəkar CFOP Alqoritmlər siyahısı (F2L/OLL/PLL)', en: 'Professional CFOP Algorithms List (F2L/OLL/PLL)', ru: 'Профессиональные алгоритмы CFOP (F2L/OLL/PLL)' })}</span>
                </div>
                <div className="flex items-center gap-2 text-rubik-yellow">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t({ az: 'Fingertricks (Sürətli barmaq hərəkətləri) qaydaları', en: 'Fingertricks (Fast Finger Movements) Rules', ru: 'Правила Фингертриксов (быстрые движения пальцев)' })}</span>
                </div>
              </div>
            </div>
            <div className="bg-muted p-6 rounded-2xl border border-border">
              <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-center">F2L Cheat-Sheet Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-muted-foreground">
                <div className="bg-card border border-border p-3 rounded-xl">
                  <span className="block font-bold text-rubik-brand">Case 1: R U R&apos;</span>
                  <span className="text-[10px]">Corner in top layer, edge in middle</span>
                </div>
                <div className="bg-card border border-border p-3 rounded-xl">
                  <span className="block font-bold text-rubik-green">Case 2: R U&apos; R&apos; U2 R U&apos; R&apos;</span>
                  <span className="text-[10px]">Opposite colors on top</span>
                </div>
                <div className="bg-card border border-border p-3 rounded-xl">
                  <span className="block font-bold text-rubik-yellow">Case 3: U&apos; R U R&apos; U R U R&apos;</span>
                  <span className="text-[10px]">Same colors on top layer</span>
                </div>
                <div className="bg-card border border-border p-3 rounded-xl">
                  <span className="block font-bold text-indigo-500">Case 4: R U2 R&apos; U&apos; R U R&apos;</span>
                  <span className="text-[10px]">Corner facing up</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONTENT TEASERS SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 border-t border-border/40">
        {/* Blog Teasers - Only render if posts exist */}
        {dbBlogPosts && dbBlogPosts.length > 0 && (
          <div className="space-y-10">
            <div className="flex items-end justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-foreground font-sans tracking-tight">
                  {t({ az: 'Bloq və Xəbərnəvislik', en: 'Blog & News Hub', ru: 'Блог и центр новостей' })}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {t({ az: 'Speedcubing sənətinin sirləri, gərginlik ayarları və son xəbərlər.', en: 'Tips, setup tutorials, and major speedcubing news.', ru: 'Советы, руководства по настройке и спидкубинг-новости.' })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dbBlogPosts.map((post) => {
                const title = post[`title_${locale}`] || post.title_az || '';
                const content = post[`content_${locale}`] || post.content_az || '';
                const snippet = content ? content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '';
                const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString() : '';

                return (
                  <Link
                    key={post.id}
                    href={`/${locale}/blog/${post.slug}`}
                    className="group flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-video bg-muted">
                      <Image
                        src={post.featured_image || 'https://picsum.photos/seed/blog/800/450'}
                        alt={String(title)}
                        fill
                        referrerPolicy="no-referrer"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-grow space-y-3">
                      <span className="text-[10px] font-bold text-rubik-brand tracking-wider">{dateStr}</span>
                      <h3 className="text-base font-bold text-foreground group-hover:text-rubik-brand transition-colors line-clamp-2 leading-snug">
                        {String(title)}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {snippet}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ Teaser Accordion */}
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <HelpCircle className="h-8 w-8 text-rubik-brand mx-auto animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black text-foreground font-sans">
              {t({ az: 'Tez-Tez Verilən Suallar', en: 'Frequently Asked Questions', ru: 'Часто задаваемые вопросы' })}
            </h2>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-sm md:text-base text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <span>{t(faq.q)}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-300 text-muted-foreground ${
                      activeFaq === idx ? 'rotate-180 text-rubik-brand' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-muted-foreground border-t border-border/30 leading-relaxed bg-muted/10">
                        {t(faq.a)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-8 lg:p-16 text-[#17181C] text-center space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-4xl mx-auto relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-[#17181C] leading-tight">
              {t({
                az: 'Saniyələrinizi Qənaət Etməyə Hazırsınız?',
                en: 'Ready to Save Your Precious Seconds?',
                ru: 'Готовы сэкономить драгоценные секунды?'
              })}
            </h2>
            <p className="text-sm md:text-base text-[#6B7280] max-w-lg mx-auto leading-relaxed">
              {t({
                az: 'Daha yaxşı kəsiklər, daha hamar fırlanma mexanizmi və peşəkar tənzimləmə sayəsində növbəti PB-nizi təyin edin.',
                en: 'Get your next personal best today. Enjoy fast corner cuttings, smooth rotations, and official setup services.',
                ru: 'Получите свой следующий личный рекорд уже сегодня. Наслаждайтесь быстрыми поворотами и плавной сборкой.'
              })}
            </p>
          </div>
          <div className="relative z-10 pt-2">
            <button
              onClick={() => {
                const element = document.getElementById('catalog-grid');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-[#D8232A] hover:bg-[#B31B21] text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 mx-auto cursor-pointer text-sm"
            >
              <span>{t({ az: 'Məhsulları Alın', en: 'Shop Speedcubes', ru: 'Купить кубики' })}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
