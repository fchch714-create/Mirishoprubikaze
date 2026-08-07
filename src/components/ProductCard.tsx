'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import type { ApplicationDictionary } from '@/types/application.types';
import { Heart, Loader2, Clock, Sparkles } from 'lucide-react';
import { toggleWishlist } from '@/lib/actions/wishlist';
import { sanitizeImageUrl } from '@/lib/image';

interface ProductCardProps {
  product: {
    id: string;
    slug?: string;
    title?: string;
    name?: string;
    price_azn?: number;
    price?: number;
    discount_price?: number;
    compare_at_price?: number;
    old_price?: number;
    compare_at_price_azn?: number;
    original_price_azn?: number;
    discount_percent?: number;
    image_url: string;
    stock_quantity: number;
    allow_preorder?: boolean;
    preorder_lead_time?: string;
    brands?: { name?: string };
    brand_name?: string;
    brand?: string;
    product_type?: string;
    is_magnetic?: boolean;
    [key: string]: any;
  };
  dict: ApplicationDictionary;
}

export function ProductCard({ product, dict }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const rawStock = product.stock_quantity ?? 0;
  const allowPreorderVal = product.allow_preorder !== undefined && product.allow_preorder !== null ? Boolean(product.allow_preorder) : true;
  const isPreorder = rawStock <= 0 && allowPreorderVal;
  const isTrulyOutOfStock = rawStock <= 0 && !isPreorder;
  
  const params = useParams();
  const locale = params?.locale || 'az';

  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = React.useState(false);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlistLoading(true);
    const res = await toggleWishlist(product.id);
    if (res.success) {
      setIsWishlisted(res.wishlisted || false);
    } else {
      console.error(res.error);
    }
    setIsWishlistLoading(false);
  };

  const basePrice = Number(product.price_azn ?? product.price ?? 0);
  const rawCompareCandidates = [
    product.compare_at_price_azn,
    product.compare_at_price,
    product.original_price_azn,
    product.original_price,
    product.discount_price,
    product.old_price,
  ]
    .map(v => (v !== undefined && v !== null && v !== '') ? Number(v) : NaN)
    .filter(v => !isNaN(v) && v > 0);

  const oldPriceCandidate = rawCompareCandidates.find(v => v !== basePrice);

  let currentPrice = basePrice;
  let oldPrice = 0;

  if (oldPriceCandidate) {
    if (oldPriceCandidate > basePrice) {
      currentPrice = basePrice;
      oldPrice = oldPriceCandidate;
    } else if (oldPriceCandidate < basePrice) {
      currentPrice = oldPriceCandidate;
      oldPrice = basePrice;
    }
  } else if (product.discount_percent && Number(product.discount_percent) > 0 && basePrice > 0) {
    currentPrice = basePrice;
    oldPrice = Math.round((basePrice / (1 - Number(product.discount_percent) / 100)) * 100) / 100;
  }

  const hasDiscount = oldPrice > currentPrice && currentPrice > 0;
  const discountPercent = hasDiscount
    ? (product.discount_percent && Number(product.discount_percent) > 0 
        ? Math.round(Number(product.discount_percent)) 
        : Math.round(((oldPrice - currentPrice) / oldPrice) * 100))
    : 0;

  // 1. Resolve Brand Name safely (Never show 'OTHER')
  const rawBrand = (
    product.brands?.name ||
    product.brand_name ||
    product.brand ||
    ''
  ).trim();

  let brandName = '';
  if (rawBrand && !['OTHER', 'OTHER BRAND', 'UNKNOWN', 'DEFAULTS'].includes(rawBrand.toUpperCase())) {
    brandName = rawBrand;
  }

  const productTitle = product.name || product.title || 'Məhsul';
  const titleLower = productTitle.toLowerCase();

  if (!brandName) {
    if (titleLower.includes('z-cube') || titleLower.includes('zcube') || titleLower.includes('z cube')) brandName = 'Z-Cube';
    else if (titleLower.includes('moyu')) brandName = 'MoYu';
    else if (titleLower.includes('qiyi')) brandName = 'QiYi';
    else if (/\bgan\b/.test(titleLower)) brandName = 'GAN';
    else if (titleLower.includes('shengshou')) brandName = 'ShengShou';
    else if (titleLower.includes('yuxin')) brandName = 'YuXin';
    else if (titleLower.includes('diansheng')) brandName = 'DianSheng';
    else if (titleLower.includes('dayan')) brandName = 'DaYan';
    else if (titleLower.includes('monster go') || titleLower.includes('monstergo')) brandName = 'Monster Go';
    else brandName = '';
  }

  // 2. Resolve Type / Category / Magnetic label accurately
  let typeLabel = '';

  if (titleLower.includes('açarlıq') || titleLower.includes('keychain') || titleLower.includes('key chain') || titleLower.includes('acarliq') || titleLower.includes('brelok') || titleLower.includes('брелок')) {
    typeLabel = locale === 'en' ? 'Keychain' : locale === 'ru' ? 'Брелок' : 'Açarlıq';
  } else if (titleLower.includes('mat') || titleLower.includes('pad') || titleLower.includes('xalça') || titleLower.includes('xalca') || titleLower.includes('kovrik') || titleLower.includes('коврик')) {
    typeLabel = locale === 'en' ? 'Mat' : locale === 'ru' ? 'Коврик' : 'Mat';
  } else if (titleLower.includes('yağ') || titleLower.includes('yag') || titleLower.includes('lube') || titleLower.includes('lubricant') || titleLower.includes('смазка')) {
    typeLabel = locale === 'en' ? 'Lube' : locale === 'ru' ? 'Смазка' : 'Yağ';
  } else if (titleLower.includes('taymer') || titleLower.includes('timer') || titleLower.includes('секундомер')) {
    typeLabel = locale === 'en' ? 'Timer' : locale === 'ru' ? 'Таймер' : 'Taymer';
  } else if (titleLower.includes('stend') || titleLower.includes('stand ') || titleLower.includes('çanta') || titleLower.includes('canta') || titleLower.includes('pouch') || titleLower.includes('törpü')) {
    typeLabel = locale === 'en' ? 'Accessory' : locale === 'ru' ? 'Аксессуар' : 'Aksessuar';
  } else if (/\b3x3(x3)?\b/i.test(productTitle)) {
    typeLabel = '3x3';
  } else if (/\b2x2(x2)?\b/i.test(productTitle)) {
    typeLabel = '2x2';
  } else if (/\b4x4(x4)?\b/i.test(productTitle)) {
    typeLabel = '4x4';
  } else if (/\b5x5(x5)?\b/i.test(productTitle)) {
    typeLabel = '5x5';
  } else if (/\b6x6(x6)?\b/i.test(productTitle)) {
    typeLabel = '6x6';
  } else if (/\b7x7(x7)?\b/i.test(productTitle)) {
    typeLabel = '7x7';
  } else if (titleLower.includes('megaminx')) {
    typeLabel = 'Megaminx';
  } else if (titleLower.includes('pyraminx')) {
    typeLabel = 'Pyraminx';
  } else if (titleLower.includes('skewb')) {
    typeLabel = 'Skewb';
  } else if (titleLower.includes('square-1') || titleLower.includes('square 1') || titleLower.includes('sq-1')) {
    typeLabel = 'Square-1';
  } else if (titleLower.includes('clock')) {
    typeLabel = 'Clock';
  } else if (product.category_slug && ['3x3', '2x2', '4x4', '5x5', '6x6', '7x7', 'megaminx', 'pyraminx', 'skewb', 'square-1'].includes(String(product.category_slug).toLowerCase())) {
    typeLabel = String(product.category_slug).toUpperCase();
  } else if (product.product_type && !['speedcube', 'other', 'default', 'puzzle', 'magnetic', 'maqnitli', 'standart', 'standard'].includes(product.product_type.toLowerCase())) {
    typeLabel = product.product_type;
  } else {
    const isExplicitlyNonMagnetic = product.is_magnetic === false || String(product.is_magnetic) === 'false';
    const hasMagneticText = 
      titleLower.includes('magnetic') ||
      titleLower.includes('maqnit') ||
      titleLower.includes('maglev') ||
      titleLower.includes('ball-core') ||
      /\b\d+x\d+\s*m\b/i.test(productTitle);

    const isMagnetic = !isExplicitlyNonMagnetic && ((product.is_magnetic === true || String(product.is_magnetic) === 'true') || hasMagneticText);

    typeLabel = isMagnetic 
      ? (locale === 'en' ? 'Magnetic' : locale === 'ru' ? 'Магнитный' : 'Maqnitli')
      : (locale === 'en' ? 'Standard' : locale === 'ru' ? 'Стандартный' : 'Standart');
  }

  const badgeSubtitle = [brandName, typeLabel].filter(Boolean).join(' • ');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTrulyOutOfStock) return;
    addItem({
      id: product.id,
      title: product.name || product.title || 'Məhsul',
      price_azn: currentPrice,
      original_price_azn: hasDiscount ? oldPrice : undefined,
      quantity: 1,
      image_url: product.image_url,
      is_preorder: isPreorder,
      preorder_lead_time: product.preorder_lead_time || '14-28 iş günü',
    });
  };

  let productUrl = `/${locale}/product/${product.id}`;
  if (product.slug) {
    if (product.slug.includes('?')) {
      const [path, query] = product.slug.split('?');
      productUrl = `/${locale}/product/${encodeURIComponent(path.trim())}?${query}`;
    } else {
      productUrl = `/${locale}/product/${encodeURIComponent(product.slug.trim())}`;
    }
  }

  return (
    <Link 
      href={productUrl} 
      className="flex flex-col bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow duration-300 relative group cursor-pointer block"
    >
      {isPreorder ? (
        <div className="absolute top-2.5 left-2.5 z-20 bg-[#FDECEC] text-[#B31B21] text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider shadow-sm pointer-events-none flex items-center gap-1 whitespace-nowrap">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{locale === 'en' ? 'Pre-order' : (locale === 'ru' ? 'Предзаказ' : 'Ön Sifariş')}</span>
        </div>
      ) : hasDiscount && discountPercent > 0 ? (
        <div className="absolute top-2.5 left-2.5 z-20 bg-[#D8232A] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider shadow-sm pointer-events-none flex items-center gap-1 whitespace-nowrap">
          <Sparkles className="w-3 h-3 animate-bounce shrink-0" />
          <span>-{discountPercent}% {locale === 'en' ? 'OFF' : locale === 'ru' ? 'СКИДКА' : 'ENDİRİM'}</span>
        </div>
      ) : null}

      <div className="absolute top-2.5 right-2.5 z-20">
        <button
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          className="p-1.5 sm:p-2 bg-white/80 backdrop-blur-md rounded-full shadow hover:scale-110 transition-transform flex items-center justify-center text-[#D8232A] cursor-pointer relative z-20"
          aria-label={isWishlisted ? "Seçilmişlərdən sil" : "Seçilmişlərə əlavə et"}
        >
          {isWishlistLoading ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          )}
        </button>
      </div>

      <div className="relative aspect-square w-full bg-[#FFFFFF] flex items-center justify-center p-2 overflow-hidden">
        <Image
          src={sanitizeImageUrl(product.image_url, product.id || 'default')}
          alt={productTitle}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className="object-contain p-1 transition-transform duration-300 group-hover:scale-[1.03]"
          priority={false}
          referrerPolicy="no-referrer"
        />
        {isTrulyOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-20 pointer-events-none">
            <span className="text-white font-bold tracking-wider px-3 py-1 bg-[#D8232A] rounded-xl">
              {dict.product.out_of_stock}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow relative">
        <div className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mb-1 line-clamp-1">
          {badgeSubtitle}
        </div>

        <h2 className="text-xs sm:text-sm md:text-base font-semibold text-[#17181C] line-clamp-3 min-h-[3rem] sm:min-h-[2.5rem] md:min-h-[3rem] group-hover:text-[#D8232A] transition-colors leading-snug">
          {productTitle}
        </h2>
        
        <div className="mt-2 space-y-0.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg font-black font-mono text-[#D8232A]">
              {currentPrice.toFixed(2)} AZN
            </span>
            {hasDiscount && (
              <span className="line-through text-[#9CA3AF] text-xs font-mono ml-1">
                {oldPrice.toFixed(2)} AZN
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="block text-[10px] font-bold text-[#16A34A] font-mono">
              {locale === 'en' ? 'Save:' : locale === 'ru' ? 'Экономия:' : 'Qənaət:'} {(oldPrice - currentPrice).toFixed(2)} AZN
            </span>
          )}
        </div>
        
        <div className="mt-4 flex flex-col">
          <button
            onClick={handleAddToCart}
            disabled={isTrulyOutOfStock}
            className={`w-full py-2.5 rounded-[8px] text-sm font-black transition-all duration-200 relative z-20 cursor-pointer flex items-center justify-center gap-1.5 ${
              isTrulyOutOfStock
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-none font-semibold'
                : isPreorder
                ? 'bg-[#FFFFFF] text-[#D8232A] border-[1.5px] border-[#D8232A] hover:bg-[#FDECEC] active:scale-[0.98]'
                : 'bg-[#D8232A] text-white hover:bg-[#B31B21] active:scale-[0.98]'
            }`}
          >
            {isTrulyOutOfStock ? (
              dict.product.out_of_stock
            ) : isPreorder ? (
              <>
                <Clock className="w-4 h-4" />
                {locale === 'en' ? 'Pre-order' : locale === 'ru' ? 'Предзаказать' : 'Ön sifariş et'}
              </>
            ) : (
              dict.product.add_to_cart
            )}
          </button>

          {isPreorder && (
            <p className="text-[12px] text-[#6B7280] text-center mt-1 font-normal">
              {product.preorder_lead_time && product.preorder_lead_time !== '14-28 iş günü' ? (
                locale === 'en'
                  ? `Delivered in ${product.preorder_lead_time.replace(/iş günü/g, 'business days').replace(/gün/g, 'days')}`
                  : locale === 'ru'
                  ? `Доставка в течение ${product.preorder_lead_time.replace(/iş günü/g, 'рабочих дней').replace(/gün/g, 'дней')}`
                  : `${product.preorder_lead_time} ərzində çatdırılacaq`
              ) : (
                locale === 'en' ? 'Delivered in 14-28 business days' : locale === 'ru' ? 'Доставка в течение 14-28 рабочих дней' : '14-28 iş günü ərzində çatdırılacaq'
              )}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

