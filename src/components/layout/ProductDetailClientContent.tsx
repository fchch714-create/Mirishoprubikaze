'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Zap,
  Heart,
  GitCompare,
  Check,
  Star,
  Info,
  Truck,
  RotateCcw,
  HelpCircle,
  Play,
  Maximize2,
  AlertCircle,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  MessageSquare,
  Minus,
  Plus,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Clock,
  X
} from 'lucide-react';
import type { ApplicationDictionary } from '@/types/application.types';
import { useCartStore } from '@/store/useCartStore';
import { addProductReview } from '@/lib/actions/reviews';
import { toggleWishlist } from '@/lib/actions/wishlist';
import { sanitizeImageUrl } from '@/lib/image';

// Clean SVG Fallback for Speedcube Images
function SpeedcubeImageFallback({ alt = 'Speedcube', className = '' }: { alt?: string; className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 dark:text-slate-500 rounded-2xl p-6 ${className}`}>
      <svg className="w-20 h-20 mb-2 opacity-80 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4L56 18V46L32 60L8 46V18L32 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M32 4V60" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M8 18L56 46" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M56 18L8 46" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="32" cy="32" r="8" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="text-xs font-black tracking-wider uppercase opacity-70 text-center line-clamp-1">{alt}</span>
      <span className="text-[10px] font-bold text-rubik-brand tracking-widest uppercase mt-1">Rubikshop.az</span>
    </div>
  );
}

// Dynamic Comparison Matrix for Flagship Speedcube Series (Strictly Data-Driven Matrix)
function SpeedcubeComparisonMatrix({ product, variants, locale = 'az' }: { product: any; variants?: any[]; locale?: string }) {
  // 1. Check if product has a static or database-provided comparison table
  const compTable = product?.[`comparison_table_${locale}`] || product?.comparison_table || product?.comparison_table_az;
  if (compTable && typeof compTable === 'object' && Array.isArray(compTable.headers) && Array.isArray(compTable.rows)) {
    return (
      <div className="mt-8 border border-border/80 rounded-2xl p-4 md:p-6 bg-card shadow-soft-sm space-y-4 overflow-hidden">
        <h3 className="font-extrabold text-base md:text-lg text-foreground flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-rubik-brand" />
          <span>{locale === 'en' ? 'Version Comparison Matrix' : locale === 'ru' ? 'Сравнительная таблица версий' : 'Məhsul Versiyalarının Müqayisə Cədvəli'}</span>
        </h3>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-3 font-bold text-foreground">{locale === 'en' ? 'Feature' : locale === 'ru' ? 'Характеристика' : 'Xüsusiyyət'}</th>
                {compTable.headers?.map((h: string, idx: number) => (
                  <th key={idx} className="p-3 font-extrabold text-rubik-brand text-center whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compTable.rows?.map((row: any, rIdx: number) => (
                <tr key={rIdx} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-semibold text-foreground whitespace-nowrap">{row.feature}</td>
                  {row.values?.map((val: string, vIdx: number) => (
                    <td key={vIdx} className="p-3 text-center text-muted-foreground font-medium whitespace-nowrap">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. Build dynamic matrix table from variants (version options / siblings / product variants)
  const activeVariantsList = Array.isArray(variants) && variants.length >= 1 ? variants : [];
  if (activeVariantsList.length < 1) {
    return null;
  }

  // Extract specs for each variant based on current locale
  const variantSpecsList = activeVariantsList.map(v => {
    let rawSpecs: any = {};
    if (locale === 'en') rawSpecs = v.specs_en || v.specs || v.specs_az || {};
    else if (locale === 'ru') rawSpecs = v.specs_ru || v.specs || v.specs_az || {};
    else rawSpecs = v.specs_az || v.specs || v.specs_en || {};

    if (typeof rawSpecs === 'string') {
      try { rawSpecs = JSON.parse(rawSpecs); } catch { rawSpecs = {}; }
    }
    
    if (Object.keys(rawSpecs || {}).length === 0) {
      const fallbackSpecs: Record<string, any> = {};
      if (v.weight_g || v.weight) fallbackSpecs['Weight'] = v.weight_g ? `${v.weight_g}g` : v.weight;
      if (v.size_mm || v.size) fallbackSpecs['Size'] = v.size_mm ? `${v.size_mm}mm` : v.size;
      if (v.is_magnetic !== undefined) fallbackSpecs['Magnetic'] = v.is_magnetic ? 'Yes' : 'No';
      rawSpecs = fallbackSpecs;
    }

    return {
      variantName: v.name || v.variant_name || v.title || v.sku || 'Versiya',
      specs: rawSpecs && typeof rawSpecs === 'object' ? rawSpecs : {}
    };
  });

  // Collect all unique feature keys across all variants
  const allKeysSet = new Set<string>();
  variantSpecsList.forEach(v => {
    Object.keys(v.specs).forEach(k => allKeysSet.add(k));
  });

  if (allKeysSet.size === 0) {
    return null;
  }

  // Key translator for UI
  const translateKey = (k: string) => {
    const kLower = k.toLowerCase().trim();
    if (locale === 'en') {
      if (kLower === 'çəki' || kLower === 'weight_g') return 'Weight';
      if (kLower === 'ölçü' || kLower === 'size_mm') return 'Size';
      if (kLower === 'maqnit gücü') return 'Magnetic Strength';
      if (kLower === 'gərginlik sistemi') return 'Tension System';
      if (kLower === 'səth örtüyü') return 'Exterior finish';
      if (kLower === 'daxili növü') return 'Core type';
      if (kLower === 'maqnit nüvə') return 'Magnetic core';
      if (kLower === 'daxili plastik rəngi') return 'Internal plastic color';
      if (kLower === 'ümumi maqnitlər') return 'Total magnets';
    } else if (locale === 'ru') {
      if (kLower === 'çəki' || kLower === 'weight' || kLower === 'weight_g') return 'Вес';
      if (kLower === 'ölçü' || kLower === 'size' || kLower === 'size_mm') return 'Размер';
      if (kLower === 'maqnit gücü' || kLower === 'magnetic strength') return 'Сила магнитов';
      if (kLower === 'gərginlik sistemi' || kLower === 'tension system') return 'Система натяжения';
      if (kLower === 'səth örtüyü' || kLower === 'exterior finish') return 'Внешнее покрытие';
      if (kLower === 'daxili növü' || kLower === 'core type') return 'Тип крестовины';
      if (kLower === 'maqnit nüvə' || kLower === 'magnetic core') return 'Магнитное ядро';
      if (kLower === 'daxili plastik rəngi' || kLower === 'internal plastic color') return 'Цвет внутреннего пластика';
      if (kLower === 'ümumi maqnitlər' || kLower === 'total magnets') return 'Всего магнитов';
    } else {
      if (kLower === 'weight' || kLower === 'weight_g') return 'Çəki';
      if (kLower === 'size' || kLower === 'size_mm') return 'Ölçü';
      if (kLower === 'magnetic_strength' || kLower === 'magnetic strength') return 'Maqnit Gücü';
      if (kLower === 'tension_system' || kLower === 'tension system') return 'Gərginlik Sistemi';
      if (kLower === 'surface_finish' || kLower === 'exterior finish') return 'Səth Örtüyü';
      if (kLower === 'core_type' || kLower === 'core type') return 'Daxili Növü';
      if (kLower === 'magnetic_core' || kLower === 'magnetic core') return 'Maqnit Nüvə';
      if (kLower === 'internal_plastic_color' || kLower === 'internal plastic color') return 'Daxili Plastik Rəngi';
      if (kLower === 'total_magnets' || kLower === 'total magnets') return 'Ümumi Maqnitlər';
    }
    return k;
  };

  const translateVal = (val: any) => {
    if (val === true || val === 'true' || val === 'Yes' || val === 'Bəli' || val === 'Да') {
      return locale === 'en' ? 'Yes' : locale === 'ru' ? 'Да' : 'Bəli';
    }
    if (val === false || val === 'false' || val === 'No' || val === 'Xeyr' || val === '-' || val === '' || val === null || val === undefined) {
      return '-';
    }
    return String(val);
  };

  const keysArray = Array.from(allKeysSet);

  return (
    <div className="mt-8 border border-border/80 rounded-2xl p-4 md:p-6 bg-card shadow-soft-sm space-y-4 overflow-hidden">
      <h3 className="font-extrabold text-base md:text-lg text-foreground flex items-center gap-2">
        <GitCompare className="h-5 w-5 text-rubik-brand" />
        <span>{locale === 'en' ? 'Version Comparison Matrix' : locale === 'ru' ? 'Сравнительная таблица версий' : 'Məhsul Versiyalarının Müqayisə Cədvəli'}</span>
      </h3>
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="p-3 font-bold text-foreground">{locale === 'en' ? 'Feature' : locale === 'ru' ? 'Характеристика' : 'Xüsusiyyət'}</th>
              {variantSpecsList.map((v, idx) => (
                <th key={idx} className="p-3 font-extrabold text-rubik-brand text-center whitespace-nowrap">{v.variantName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keysArray.map((featureKey, rIdx) => {
              const rowHasValues = variantSpecsList.some(v => v.specs[featureKey] !== undefined && v.specs[featureKey] !== '' && v.specs[featureKey] !== null);
              if (!rowHasValues) return null;

              return (
                <tr key={rIdx} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-semibold text-foreground whitespace-nowrap">{translateKey(featureKey)}</td>
                  {variantSpecsList.map((v, vIdx) => {
                    const rawVal = v.specs[featureKey];
                    const displayVal = translateVal(rawVal);
                    return (
                      <td key={vIdx} className="p-3 text-center text-muted-foreground font-medium whitespace-nowrap">
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ProductDetailClientContent ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-black text-foreground mb-4">Məhsul yoxlanarkən xəta baş verdi</h1>
          <p className="text-muted-foreground mb-8">Məhsul məlumatları yüklənərkən xəta yarandı.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-rubik-brand text-white font-bold rounded-xl shadow-md hover:bg-rubik-brand-dark transition-colors"
          >
            Ana Səhifəyə Qayıt
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ProductDetailClientContentProps {
  product: {
    id: string;
    title: string;
    price_azn: number;
    image_url: string;
    stock_quantity: number;
    brand: string;
    category_slug: string;
    sku: string;
    brands?: { name?: string };
    categories?: { name_az?: string; slug?: string };
    brand_name?: string;
    category_name?: string;
    original_price?: number;
    description: string;
    specs: Record<string, string>;
    compatibility: string;
    variants?: any[];
    product_variants?: any[];
    add_ons?: any[];
    services?: any[];
    comparison_table?: any;
    gallery_images?: any;
    images?: any;
    [key: string]: any;
  };
  relatedProducts: Array<{
    id: string;
    title: string;
    price_azn: number;
    old_price?: number;
    discount_percent?: number;
    image_url: string;
    stock_quantity: number;
    allow_preorder?: boolean;
    brand: string;
  }>;
  locale: string;
  dict: ApplicationDictionary;
  initialReviews?: any[];
  siblingProducts?: any[];
  versionOptions?: any[];
}

export function ProductDetailClientContent(props: ProductDetailClientContentProps) {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
        <ProductDetailClientContentInner {...props} />
      </React.Suspense>
    </ErrorBoundary>
  );
}

function ProductDetailClientContentInner({
  product,
  siblingProducts = [],
  versionOptions = [],
  relatedProducts,
  locale,
  dict,
  initialReviews = []
}: ProductDetailClientContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const addItem = useCartStore((state) => state.addItem);

  const formatPrice = (val: number) => {
    try {
      return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(val);
    } catch {
      return `${val.toFixed(2)} ₼`;
    }
  };

  // 1. Universal Database-driven variants setup (supporting Grouped Sibling Products & Legacy variants)
  const dbVariants = React.useMemo(() => {
    let list: any[] = [];
    if (versionOptions && Array.isArray(versionOptions) && versionOptions.length > 0) {
      list = versionOptions.map((v: any) => ({
        id: String(v.id),
        sku: v.sku || `SKU-${v.id}`,
        slug: v.slug,
        group_slug: v.group_slug,
        name: String(v.name || v.variant_name || v.title || v.sku || 'Versiya'),
        title_az: v.name || v.title,
        price: Number(v.price_azn ?? v.price ?? product?.price_azn ?? 0),
        price_azn: Number(v.price_azn ?? v.price ?? product?.price_azn ?? 0),
        compare_at_price_azn: v.compare_at_price_azn ?? v.discount_price ?? v.original_price,
        stock: Number(v.stock_quantity ?? v.stock ?? 0),
        stock_quantity: Number(v.stock_quantity ?? v.stock ?? 0),
        description: String(v.description || v.description_az || v.subtitle || ''),
        image_url: v.image_url || product?.image_url,
        gallery_images: Array.isArray(v.gallery_images) ? v.gallery_images : [],
        is_sibling: Boolean(v.slug && v.slug !== product?.slug),
        specs: v.specs || {},
        specs_az: v.specs_az,
        specs_en: v.specs_en,
        specs_ru: v.specs_ru
      }));
    } else if (siblingProducts && Array.isArray(siblingProducts) && siblingProducts.length > 0) {
      list = siblingProducts.map((s: any, index: number) => ({
        id: String(s.id || s.slug || `sib_${index}`),
        sku: s.sku || `SKU-${index + 1}`,
        slug: s.slug,
        group_slug: s.group_slug,
        name: s.variant_name || s.title || s.title_az || s.name_az || `Versiya ${index + 1}`,
        title_az: s.title || s.title_az,
        price: Number(s.price_azn ?? s.price ?? product?.price_azn ?? 0),
        price_azn: Number(s.price_azn ?? s.price ?? product?.price_azn ?? 0),
        compare_at_price_azn: s.original_price ?? s.compare_at_price_azn ?? s.discount_price,
        stock: Number(s.stock_quantity ?? 0),
        stock_quantity: Number(s.stock_quantity ?? 0),
        description: String(s.description || s.description_az || s.subtitle || ''),
        image_url: s.image_url || product?.image_url,
        gallery_images: Array.isArray(s.gallery_images) ? s.gallery_images : [],
        is_sibling: true,
        specs: s.specs || {},
        specs_az: s.specs_az,
        specs_en: s.specs_en,
        specs_ru: s.specs_ru
      }));
    } else {
      const rawVariants = product?.product_variants || product?.variants || [];
      if (Array.isArray(rawVariants) && rawVariants.length > 0) {
        list = rawVariants.map((v: any, index: number) => ({
          id: String(v.id || `var_${index}`),
          sku: v.sku || `SKU-${index + 1}`,
          name: v.name || v.title_az || v.title || v.name_az || `Versiya ${index + 1}`,
          price: v.price !== undefined && v.price !== null && v.price !== ''
            ? Number(v.price)
            : (v.price_azn !== undefined ? Number(v.price_azn) : Number(product?.price_azn || product?.price || 0)),
          price_azn: v.price_azn !== undefined && v.price_azn !== null && v.price_azn !== ''
            ? Number(v.price_azn)
            : (v.price !== undefined ? Number(v.price) : Number(product?.price_azn || product?.price || 0)),
          compare_at_price_azn: v.compare_at_price_azn || v.discount_price || v.original_price,
          stock: v.stock !== undefined ? Number(v.stock) : Number(v.stock_quantity || product?.stock_quantity || 0),
          stock_quantity: v.stock_quantity !== undefined ? Number(v.stock_quantity) : Number(v.stock || product?.stock_quantity || 0),
          description: String(v.description || v.description_az || v.subtitle || ''),
          image_url: v.image_url || v.image || (Array.isArray(v.images) ? v.images[0] : null) || product?.image_url,
          gallery_images: Array.isArray(v.gallery_images) ? v.gallery_images : (Array.isArray(v.images) ? v.images : []),
          specs: v.specs || {},
          specs_az: v.specs_az,
          specs_en: v.specs_en,
          specs_ru: v.specs_ru
        }));
      }
    }

    return list.sort((a, b) => (Number(a.price_azn) || 0) - (Number(b.price_azn) || 0));
  }, [versionOptions, siblingProducts, product?.product_variants, product?.variants, product?.price_azn, product?.price, product?.stock_quantity, product?.image_url, product?.slug]);

  // Read searchParam `variant` or `version` or `sku`
  const variantParam = searchParams ? (searchParams.get('variant') || searchParams.get('version') || searchParams.get('sku')) : null;

  const initialVariantId = React.useMemo(() => {
    if (dbVariants.length === 0) return null;
    if (variantParam) {
      const qLower = variantParam.toLowerCase().trim();
      const match = dbVariants.find((v: any) =>
        String(v.sku).toLowerCase() === qLower ||
        String(v.id).toLowerCase() === qLower ||
        String(v.name).toLowerCase() === qLower
      );
      if (match) return match.id;
    }
    const slugMatch = dbVariants.find((v: any) => v.slug && String(v.slug).toLowerCase() === String(product?.slug).toLowerCase());
    if (slugMatch) return slugMatch.id;

    return dbVariants[0].id;
  }, [dbVariants, variantParam, product?.slug]);

  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(initialVariantId);

  React.useEffect(() => {
    if (initialVariantId && initialVariantId !== selectedVariantId) {
      setSelectedVariantId(initialVariantId);
    }
  }, [initialVariantId, selectedVariantId]);

  const selectedVariant = React.useMemo(() => {
    if (dbVariants.length === 0) return null;
    return dbVariants.find((v: any) => String(v.id) === String(selectedVariantId)) || dbVariants[0];
  }, [dbVariants, selectedVariantId]);

  // 2. Main Active Image & Error State
  const [activeImage, setActiveImage] = React.useState(product?.image_url || '');
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [activeImage]);

  // Auto switch main active image when selectedVariant changes or has specific image
  React.useEffect(() => {
    if (selectedVariant) {
      const vImg = selectedVariant.image_url || (Array.isArray(selectedVariant.gallery_images) && selectedVariant.gallery_images[0]) || product?.image_url;
      if (vImg) {
        setActiveImage(vImg);
      }
    }
  }, [selectedVariant, product?.image_url]);

  const handleVariantSelect = (v: any) => {
    setSelectedVariantId(v.id);
    const vImg = v.image_url || (Array.isArray(v.gallery_images) && v.gallery_images[0]) || product?.image_url;
    if (vImg) {
      setActiveImage(vImg);
    }

    if ((v.is_sibling || (v.slug && v.slug !== product?.slug)) && v.slug) {
      router.push(`/${locale}/product/${v.slug}`);
    } else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (v.sku) {
        url.searchParams.set('variant', v.sku);
      } else {
        url.searchParams.set('variant', v.id);
      }
      window.history.replaceState(null, '', url.toString());
    }
  };

  // 3. Category-aware setup service detection
  const isCubeCategory = React.useMemo(() => {
    if (!product) return false;
    if ((product as any).has_setup === true) return true;
    const cat = (product.category_slug || (product as any).category || '').toLowerCase();
    if (!cat) return true;
    const nonCubeKeywords = ['lube', 'yag', 'mat', 'bag', 'canta', 'timer', 'accessory', 'accessories', 'stand', 'parts'];
    if (nonCubeKeywords.some(k => cat.includes(k))) return false;
    return true;
  }, [product]);

  // 4. Safe & Optional Add-ons List (Strictly Null-Safe)
  const addOnsList = React.useMemo(() => {
    const list = product?.add_ons || product?.services;
    if (!list) return [];
    if (Array.isArray(list)) return list.filter((item: any) => item && (item.title || item.name || item.title_az));
    return [];
  }, [product?.add_ons, product?.services]);

  const [selectedAddonIds, setSelectedAddonIds] = React.useState<Set<string>>(new Set());

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addOnsCost = React.useMemo(() => {
    if (addOnsList.length === 0) return 0;
    return Array.from(selectedAddonIds).reduce((sum, id) => {
      const addon = addOnsList.find((a: any) => String(a.id) === String(id));
      return sum + (addon ? Number(addon.price_azn || addon.price || 0) : 0);
    }, 0);
  }, [addOnsList, selectedAddonIds]);

  // Core configuration selections
  const [addonSetup, setAddonSetup] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'description' | 'specs' | 'compatibility' | 'shipping' | 'return' | 'faq'>('description');

  // Interactive video modal & Fullscreen Image modal
  const [showVideoModal, setShowVideoModal] = React.useState(false);
  const [showImageModal, setShowImageModal] = React.useState(false);

  // Selected purchase quantity
  const [quantity, setQuantity] = React.useState<number>(1);

  // Sticky bottom mini-bar observer ref and state
  const mainAddToCartRef = React.useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = React.useState(false);

  // Review search, sort, and helpful voting states
  const [reviewSearch, setReviewSearch] = React.useState('');
  const [reviewSort, setReviewSort] = React.useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [helpfulState, setHelpfulState] = React.useState<Record<string, { up: number; down: number; userVote: 'up' | 'down' | null }>>({});

  // Dynamic estimated shipping date
  const estimatedShipDate = React.useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const months = ['İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun'];
    const monthName = months[tomorrow.getMonth()];
    const dateNum = tomorrow.getDate();
    return `sabah (${dateNum} ${monthName})`;
  }, []);

  // Intersection Observer for sticky bottom bar
  React.useEffect(() => {
    const target = mainAddToCartRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setShowStickyBar(true);
        } else {
          setShowStickyBar(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Auto-scrolling Trust Banner state & slides
  const trustSlides = React.useMemo(() => [
    {
      icon: Truck,
      color: 'text-rubik-brand',
      bg: 'bg-rubik-brand/10',
      title: locale === 'en' ? 'Fast Delivery in Baku' : locale === 'ru' ? 'Быстрая Доставка по Баку' : 'Bakı daxili Sürətli Çatdırılma',
      desc: locale === 'en' ? 'Delivered directly to your address within 1-3 hours via fast courier.' : locale === 'ru' ? 'Доставляется прямо по адресу за 1-3 часа курьером.' : '1-3 saat ərzində sürətli kuryer vasitəsilə birbaşa ünvanınıza təhvil verilir.'
    },
    {
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      title: locale === 'en' ? '100% Original & Official Warranty' : locale === 'ru' ? '100% Оригинал и Гарантия' : '100% Orijinal & Rəsmi Zəmanət',
      desc: locale === 'en' ? 'Certified original products with official manufacturer warranty.' : locale === 'ru' ? 'Сертифицированные оригинальные товары с официальной гарантией.' : 'Rəsmi istehsalçı zəmanəti ilə sertifikatlaşdırılmış orijinal məhsullar.'
    },
    {
      icon: RotateCcw,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      title: locale === 'en' ? '14-Day Money Back Guarantee' : locale === 'ru' ? 'Гарантия Возврата 14 Дней' : '14 Gün Geri Qaytarma Zəmanəti',
      desc: locale === 'en' ? 'No questions asked exchange for unused products with undamaged boxes.' : locale === 'ru' ? 'Обмен неиспользованного товара в неповрежденной упаковке без вопросов.' : 'İstifadə olunmamış və qutusu zədələnməmiş məhsulların heç bir sual verilmədən dəyişdirilməsi.'
    },
    {
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      title: locale === 'en' ? 'Free Delivery to Metro Stations' : locale === 'ru' ? 'Бесплатная Доставка до Метро' : 'Metrolara Ödənişsiz Çatdırılma',
      desc: locale === 'en' ? 'Pick up your orders at Baku metro stations completely free.' : locale === 'ru' ? 'Вы можете забрать заказ на любой станции метро Баку совершенно бесплатно.' : 'Sifarişlərinizi Bakı metro stansiyalarına tam pulsuz təhvil ala bilərsiniz.'
    }
  ], [locale]);

  const [trustSlideIndex, setTrustSlideIndex] = React.useState(0);
  const [isTrustBannerPaused, setIsTrustBannerPaused] = React.useState(false);

  React.useEffect(() => {
    if (isTrustBannerPaused) return;
    const interval = setInterval(() => {
      setTrustSlideIndex((prev) => (prev + 1) % trustSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isTrustBannerPaused, trustSlides.length]);

  // Social action toggles
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isCompared, setIsCompared] = React.useState(false);
  const [showAddedToCartToast, setShowAddedToCartToast] = React.useState(false);

  // Dynamic pricing directly from product / variant / add-ons
  const basePrice = Number(product?.price_azn || (product as any)?.price || 0);
  const addonCost = (isCubeCategory && addonSetup) ? 5 : 0;
  
  const finalPrice = (selectedVariant 
    ? Number(selectedVariant.price_azn || selectedVariant.price || basePrice)
    : basePrice) + addonCost + addOnsCost;

  const originalPrice = selectedVariant
    ? (selectedVariant.compare_at_price_azn || selectedVariant.discount_price || product?.original_price || (product as any)?.compare_at_price_azn)
    : (product?.original_price || (product as any)?.discount_price || (product as any)?.compare_at_price_azn);

  // Dynamic Discount calculation
  const numOriginalPrice = Number(originalPrice || 0);
  const numBasePrice = Number(finalPrice || basePrice || 0);
  const hasDiscount = numOriginalPrice > numBasePrice && numBasePrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((numOriginalPrice - numBasePrice) / numOriginalPrice) * 100)
    : 0;

  // Resolve Brand and Product Type for Badges
  const rawBrand = (
    product?.brands?.name ||
    (product as any)?.brand_name ||
    product?.brand ||
    ''
  ).trim();

  let resolvedBrand = '';
  if (rawBrand && !['OTHER', 'OTHER BRAND', 'UNKNOWN', 'DEFAULTS'].includes(rawBrand.toUpperCase())) {
    resolvedBrand = rawBrand;
  }

  if (!resolvedBrand) {
    resolvedBrand = (product as any)?.brand_name || product?.brand || 'Orijinal Brend';
  }

  const pTitleLower = (product?.title || (product as any)?.name_az || (product as any)?.name || '').toLowerCase();

  let typeBadge = '';
  if (pTitleLower.includes('açarlıq') || pTitleLower.includes('keychain') || pTitleLower.includes('brelok')) {
    typeBadge = 'Açarlıq';
  } else if (pTitleLower.includes('mat') || pTitleLower.includes('pad') || pTitleLower.includes('xalça') || pTitleLower.includes('kovrik')) {
    typeBadge = 'Aksessuar Matı';
  } else if (pTitleLower.includes('yağ') || pTitleLower.includes('lube')) {
    typeBadge = 'Baxım Yağı';
  } else if (pTitleLower.includes('taymer') || pTitleLower.includes('timer')) {
    typeBadge = 'Yarış Taymeri';
  } else if (product?.product_type) {
    typeBadge = product.product_type;
  }

  const currentSku = selectedVariant 
    ? (selectedVariant.sku || (product?.sku || (product?.id ? `RS-${String(product.id).substring(0, 4).toUpperCase()}` : 'RS-0000')))
    : (product?.sku || (product?.id ? `RS-${String(product.id).substring(0, 4).toUpperCase()}` : 'RS-0000'));

  // Frequently Bought Together Bundle State
  const [bundleChecked2, setBundleChecked2] = React.useState(true);
  const [bundleChecked3, setBundleChecked3] = React.useState(true);

  // Only consider real related products from DB (excluding current product, preorders, and out-of-stock items)
  const validRelatedItems = React.useMemo(() => {
    if (!relatedProducts || !Array.isArray(relatedProducts)) return [];
    return relatedProducts.filter((r: any) => 
      r && 
      r.id && 
      String(r.id) !== String(product?.id) && 
      !r.is_preorder && 
      (r.stock_quantity === undefined || r.stock_quantity === null || Number(r.stock_quantity) > 0) &&
      (r.stock === undefined || r.stock === null || Number(r.stock) > 0)
    );
  }, [relatedProducts, product?.id]);

  const hasValidBundle = validRelatedItems.length > 0;

  const bundleItem1 = React.useMemo(() => ({
    id: product?.id || '',
    title: product?.title || 'Məhsul',
    price: finalPrice || 0,
    image: activeImage || product?.image_url || '',
    required: true
  }), [product?.id, product?.title, finalPrice, activeImage, product?.image_url]);

  const bundleItem2 = React.useMemo(() => {
    if (validRelatedItems.length > 0) {
      const rel = validRelatedItems[0];
      const origPrice = Number(rel.compare_at_price_azn || rel.original_price_azn || rel.price_azn || 0);
      const currPrice = Number(rel.price_azn || 0);
      return {
        id: String(rel.id),
        title: String(rel.title),
        price: currPrice,
        original_price: origPrice > currPrice ? origPrice : currPrice,
        image: rel.image_url || '',
        required: false
      };
    }
    return null;
  }, [validRelatedItems]);

  const bundleItem3 = React.useMemo(() => {
    if (validRelatedItems.length > 1) {
      const rel = validRelatedItems[1];
      const origPrice = Number(rel.compare_at_price_azn || rel.original_price_azn || rel.price_azn || 0);
      const currPrice = Number(rel.price_azn || 0);
      return {
        id: String(rel.id),
        title: String(rel.title),
        price: currPrice,
        original_price: origPrice > currPrice ? origPrice : currPrice,
        image: rel.image_url || '',
        required: false
      };
    }
    return null;
  }, [validRelatedItems]);

  const bundleTotalPrice = React.useMemo(() => {
    let total = bundleItem1.price;
    if (bundleChecked2 && bundleItem2) total += bundleItem2.price;
    if (bundleChecked3 && bundleItem3) total += bundleItem3.price;
    return total;
  }, [bundleItem1.price, bundleItem2, bundleItem3, bundleChecked2, bundleChecked3]);

  const bundleSavings = React.useMemo(() => {
    let savings = 0;
    if (bundleChecked2 && bundleItem2 && bundleItem2.original_price > bundleItem2.price) {
      savings += (bundleItem2.original_price - bundleItem2.price);
    }
    if (bundleChecked3 && bundleItem3 && bundleItem3.original_price > bundleItem3.price) {
      savings += (bundleItem3.original_price - bundleItem3.price);
    }
    return savings;
  }, [bundleChecked2, bundleChecked3, bundleItem2, bundleItem3]);

  const handleAddBundleToCart = () => {
    addItem({
      id: bundleItem1.id,
      title: bundleItem1.title,
      price_azn: bundleItem1.price,
      quantity: 1,
      image_url: bundleItem1.image
    });
    if (bundleChecked2 && bundleItem2) {
      addItem({
        id: bundleItem2.id,
        title: bundleItem2.title,
        price_azn: bundleItem2.price,
        quantity: 1,
        image_url: bundleItem2.image
      });
    }
    if (bundleChecked3 && bundleItem3) {
      addItem({
        id: bundleItem3.id,
        title: bundleItem3.title,
        price_azn: bundleItem3.price,
        quantity: 1,
        image_url: bundleItem3.image
      });
    }
    setShowAddedToCartToast(true);
    setTimeout(() => setShowAddedToCartToast(false), 3000);
  };

  // Live Interactive Review Module
  const [reviews, setReviews] = React.useState((Array.isArray(initialReviews) && initialReviews.length > 0) ? initialReviews : []);
  const [newReviewName, setNewReviewName] = React.useState('');
  const [newReviewRating, setNewReviewRating] = React.useState(5);
  const [newReviewComment, setNewReviewComment] = React.useState('');
  const [reviewSubmitted, setReviewSubmitted] = React.useState(false);

  // Helpful / Unhelpful voting handler
  const handleVoteHelpful = (reviewId: string | number, type: 'up' | 'down') => {
    const idStr = String(reviewId);
    setHelpfulState((prev) => {
      const current = prev[idStr] || { up: 0, down: 0, userVote: null };
      if (current.userVote === type) {
        return {
          ...prev,
          [idStr]: {
            ...current,
            [type]: Math.max(0, current[type] - 1),
            userVote: null
          }
        };
      }
      const prevVote = current.userVote;
      let newUp = current.up;
      let newDown = current.down;
      if (prevVote === 'up') newUp = Math.max(0, newUp - 1);
      if (prevVote === 'down') newDown = Math.max(0, newDown - 1);
      if (type === 'up') newUp += 1;
      if (type === 'down') newDown += 1;
      return {
        ...prev,
        [idStr]: { up: newUp, down: newDown, userVote: type }
      };
    });
  };

  // Calculate Star Counts and Percentages
  const starCounts = React.useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!reviews || !Array.isArray(reviews)) return counts;
    reviews.forEach((r) => {
      const val = Math.round(r.rating || 5);
      if (val >= 1 && val <= 5) {
        counts[val as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [reviews]);

  // Filtered and Sorted Reviews
  const filteredAndSortedReviews = React.useMemo(() => {
    if (!reviews || !Array.isArray(reviews)) return [];
    let list = [...reviews];
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase();
      list = list.filter((r) => {
        const name = (r.profiles?.full_name || r.name || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        return name.includes(q) || comment.includes(q);
      });
    }

    list.sort((a, b) => {
      if (reviewSort === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (reviewSort === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (reviewSort === 'highest') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (reviewSort === 'lowest') {
        return (a.rating || 0) - (b.rating || 0);
      }
      if (reviewSort === 'helpful') {
        const aId = String(a.id);
        const bId = String(b.id);
        const aVotes = (helpfulState[aId]?.up || 0) - (helpfulState[aId]?.down || 0);
        const bVotes = (helpfulState[bId]?.up || 0) - (helpfulState[bId]?.down || 0);
        return bVotes - aVotes;
      }
      return 0;
    });

    return list;
  }, [reviews, reviewSearch, reviewSort, helpfulState]);

  const averageRating = React.useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Fallback and Sorted Related Products
  const [displayRelated, setDisplayRelated] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function processRelated() {
      let rawList: any[] = relatedProducts || [];
      if (!rawList || rawList.length === 0) {
        try {
          const { getActiveProducts } = await import('@/lib/supabase/queries/products');
          const allProds = await getActiveProducts();
          if (allProds && allProds.length > 0) {
            rawList = allProds
              .filter(p => p.id !== product?.id)
              .map(p => {
                const rawCompare = p.compare_at_price_azn ?? p.compare_at_price ?? p.original_price_azn ?? p.original_price ?? p.discount_price ?? p.old_price ?? p.old_price_azn;
                return {
                  id: p.id,
                  title: p.title_az || p.name_az || p.title || p.name || 'Məhsul',
                  price_azn: Number(p.price || p.price_azn || 0),
                  old_price: rawCompare !== undefined && rawCompare !== null ? Number(rawCompare) : undefined,
                  discount_percent: p.discount_percent ? Number(p.discount_percent) : undefined,
                  image_url: p.image_url || '',
                  stock_quantity: Number(p.stock_quantity || 0),
                  allow_preorder: p.allow_preorder,
                  brand: p.brands?.name || p.brand_name || p.brand || ''
                };
              });
          }
        } catch (err) {
          console.error("Error loading fallback related products:", err);
        }
      }

      // Sort logic: In-stock first (> 0), then pre-order (stock <= 0 & allow_preorder), then out of stock
      const sorted = [...rawList].sort((a, b) => {
        const aScore = Number(a.stock_quantity || 0) > 0 ? 2 : ((a.allow_preorder !== false && a.allow_preorder !== null) ? 1 : 0);
        const bScore = Number(b.stock_quantity || 0) > 0 ? 2 : ((b.allow_preorder !== false && b.allow_preorder !== null) ? 1 : 0);
        return bScore - aScore;
      });

      setDisplayRelated(sorted);
    }

    processRelated();
  }, [relatedProducts, product?.id]);

  // Gallery images with dynamic variation (isolated to selected variant or product)
  const galleryImages = React.useMemo(() => {
    if (!product) return [];

    // Main image for selected variant or base product
    const mainImg = selectedVariant?.image_url || product.image_url;

    // Secondary gallery images specific to selected variant or fallback to product gallery
    const variantGallery = selectedVariant?.gallery_images || selectedVariant?.images;
    const secondaryImages = (Array.isArray(variantGallery) && variantGallery.length > 0)
      ? variantGallery
      : (product.gallery_images || product.images || []);

    let extraImages: string[] = [];
    if (Array.isArray(secondaryImages)) {
      extraImages = secondaryImages;
    } else if (typeof secondaryImages === 'string') {
      const trimmed = secondaryImages.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          extraImages = JSON.parse(trimmed);
        } catch {
          extraImages = trimmed.split(',').map((img: string) => img.trim()).filter(Boolean);
        }
      } else {
        extraImages = trimmed.split(',').map((img: string) => img.trim()).filter(Boolean);
      }
    }

    // Completely purge placeholder picsum URLs (strictly excluding other variants' main images)
    const cleanExtraImages = extraImages.filter((img: string) => img && typeof img === 'string' && !img.includes('picsum.photos'));
    
    const list = [mainImg, ...cleanExtraImages].filter(Boolean);
    return Array.from(new Set(list)) as string[];
  }, [product, selectedVariant]);

  const activeImageIndex = React.useMemo(() => {
    if (!galleryImages || galleryImages.length === 0) return 0;
    const idx = galleryImages.indexOf(activeImage);
    return idx >= 0 ? idx : 0;
  }, [galleryImages, activeImage]);

  const thumbnailRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    if (thumbnailRefs.current[activeImageIndex]) {
      thumbnailRefs.current[activeImageIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeImageIndex]);

  const handlePrevImage = React.useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (galleryImages.length <= 1) return;
    const prevIdx = (activeImageIndex - 1 + galleryImages.length) % galleryImages.length;
    setActiveImage(galleryImages[prevIdx]);
  }, [activeImageIndex, galleryImages]);

  const handleNextImage = React.useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (galleryImages.length <= 1) return;
    const nextIdx = (activeImageIndex + 1) % galleryImages.length;
    setActiveImage(galleryImages[nextIdx]);
  }, [activeImageIndex, galleryImages]);

  React.useEffect(() => {
    if (!showImageModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        setShowImageModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImageModal, handlePrevImage, handleNextImage]);

  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);

  const handleGalleryTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleGalleryTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || galleryImages.length <= 1) return;
    const touchEndX = e.changedTouches[0]?.clientX;
    if (typeof touchEndX === 'number') {
      const diffX = touchStartX - touchEndX;
      if (Math.abs(diffX) > 30) {
        if (diffX > 0) {
          handleNextImage();
        } else {
          handlePrevImage();
        }
      }
    }
    setTouchStartX(null);
  };

  const effectiveStock = React.useMemo(() => {
    if (selectedVariant) {
      const vStock = selectedVariant.stock_quantity ?? selectedVariant.stock;
      return typeof vStock === 'number' ? vStock : (parseInt(String(vStock), 10) || 0);
    }
    const pStock = product?.stock_quantity ?? product?.stock;
    return typeof pStock === 'number' ? pStock : (parseInt(String(pStock), 10) || 0);
  }, [selectedVariant, product?.stock_quantity, product?.stock]);

  const isOutOfStock = effectiveStock <= 0;
  const allowPreorderVal = product?.allow_preorder !== undefined && product?.allow_preorder !== null ? Boolean(product.allow_preorder) : true;
  const isPreorder = isOutOfStock && allowPreorderVal;
  const isTrulyOutOfStock = isOutOfStock && !isPreorder;

  const specsToDisplay = React.useMemo(() => {
    if (!product) return {};
    const baseSpecs: Record<string, string> = {};
    const brandLabel = locale === 'en' ? 'Brand' : locale === 'ru' ? 'Бренд' : 'Brend';
    const catLabel = locale === 'en' ? 'Category' : locale === 'ru' ? 'Категория' : 'Kateqoriya';
    const stockLabel = locale === 'en' ? 'In Stock' : locale === 'ru' ? 'В наличии' : 'Anbardakı Sayı';
    const unitText = locale === 'en' ? 'pcs' : locale === 'ru' ? 'шт.' : 'ədəd';

    if (product.brand) baseSpecs[brandLabel] = product.brand;
    if (currentSku) baseSpecs['SKU'] = currentSku;
    if (product.category_slug) baseSpecs[catLabel] = product.category_slug;
    if (effectiveStock !== undefined) baseSpecs[stockLabel] = `${effectiveStock} ${unitText}`;
    
    let activeSpecs = selectedVariant?.specs_az || selectedVariant?.specs_en || selectedVariant?.specs_ru || selectedVariant?.specs || product?.[`specs_${locale}`] || product?.specs || product?.specs_az || {};
    
    let parsedSpecs: Record<string, string> = {};
    if (typeof activeSpecs === 'object' && activeSpecs !== null) {
      parsedSpecs = activeSpecs;
    } else if (typeof activeSpecs === 'string') {
      try {
        parsedSpecs = JSON.parse(activeSpecs);
      } catch {
        // Ignore parsing error
      }
    }
    
    const mergedSpecs = { ...baseSpecs, ...parsedSpecs };
    const translatedSpecs: Record<string, string> = {};
    
    Object.entries(mergedSpecs).forEach(([key, val]) => {
      let displayKey = key;
      const kLower = key.toLowerCase();
      if (locale === 'en') {
        if (kLower === 'weight' || kLower === 'çəki') displayKey = 'Weight';
        else if (kLower === 'size' || kLower === 'ölçü') displayKey = 'Size';
        else if (kLower === 'material') displayKey = 'Material';
        else if (kLower === 'core_type' || kLower === 'daxili növü') displayKey = 'Core Type';
        else if (kLower === 'magnetic_strength' || kLower === 'maqnit gücü') displayKey = 'Magnetic Strength';
        else if (kLower === 'tension_system' || kLower === 'gərginlik sistemi') displayKey = 'Tension System';
        else if (kLower === 'surface_finish' || kLower === 'səth örtüyü') displayKey = 'Surface Finish';
      } else if (locale === 'ru') {
        if (kLower === 'weight' || kLower === 'çəki') displayKey = 'Вес';
        else if (kLower === 'size' || kLower === 'ölçü') displayKey = 'Размер';
        else if (kLower === 'material') displayKey = 'Материал';
        else if (kLower === 'core_type' || kLower === 'daxili növü') displayKey = 'Тип крестовины';
        else if (kLower === 'magnetic_strength' || kLower === 'maqnit gücü') displayKey = 'Сила магнитов';
        else if (kLower === 'tension_system' || kLower === 'gərginlik sistemi') displayKey = 'Система натяжения';
        else if (kLower === 'surface_finish' || kLower === 'səth örtüyü') displayKey = 'Покрытие';
      } else {
        if (kLower === 'weight') displayKey = 'Çəki';
        else if (kLower === 'size') displayKey = 'Ölçü';
        else if (kLower === 'material') displayKey = 'Material';
        else if (kLower === 'core_type') displayKey = 'Daxili Növü';
        else if (kLower === 'magnetic_strength') displayKey = 'Maqnit Gücü';
        else if (kLower === 'tension_system') displayKey = 'Gərginlik Sistemi';
        else if (kLower === 'surface_finish') displayKey = 'Səth Örtüyü';
      }
      translatedSpecs[displayKey] = String(val);
    });
    
    return translatedSpecs;
  }, [product, selectedVariant, currentSku, effectiveStock, locale]);

  // Sync quantity if stock changes
  React.useEffect(() => {
    if (effectiveStock > 0 && quantity > effectiveStock) {
      setQuantity(effectiveStock);
    }
  }, [effectiveStock, quantity]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black text-foreground mb-4">Məhsul Tapılmadı</h1>
        <p className="text-muted-foreground mb-8">Axtardığınız məhsul mövcud deyil, gizlədilib və ya silinib.</p>
        <Link 
          href={`/${locale}`} 
          className="inline-flex items-center px-6 py-3 bg-rubik-brand text-white font-bold rounded-xl shadow-md hover:bg-rubik-brand-dark transition-colors"
        >
          Ana Səhifəyə Qayıt
        </Link>
      </div>
    );
  }

  const handleAddToCart = (redirect = false) => {
    const currentQty = isPreorder
      ? Math.max(1, quantity)
      : isOutOfStock 
        ? 1 
        : Math.max(1, Math.min(quantity, effectiveStock > 0 ? effectiveStock : 1));

    const variantTitle = selectedVariant 
      ? (selectedVariant.title_az || selectedVariant.name_az || selectedVariant.title_en || selectedVariant.name || selectedVariant.sku)
      : null;

    const titleAddition = variantTitle 
      ? ` - ${variantTitle}`
      : (isCubeCategory && addonSetup) ? ' (+ Premium Setup)' : '';

    const cartItemId = selectedVariant 
      ? `${product.id}__variant__${selectedVariant.id}`
      : `${product.id}${(isCubeCategory && addonSetup) ? '-setup' : ''}`;

    const cartItem = {
      id: cartItemId,
      variant_id: selectedVariant?.id || null,
      sku: currentSku,
      title: `${product.title}${titleAddition}`,
      price_azn: finalPrice,
      original_price_azn: hasDiscount ? numOriginalPrice : undefined,
      quantity: currentQty,
      image_url: activeImage || product.image_url,
      is_preorder: isPreorder,
      preorder_lead_time: product?.preorder_lead_time || '14-28 iş günü'
    };

    addItem(cartItem);

    if (redirect) {
      router.push(`/${locale}/checkout`);
    } else {
      setShowAddedToCartToast(true);
      setTimeout(() => setShowAddedToCartToast(false), 3000);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    const res = await addProductReview(product.id, newReviewRating, newReviewComment);
    if (res.success) {
      setReviews([{
        id: Date.now(),
        rating: newReviewRating,
        comment: newReviewComment,
        created_at: new Date().toISOString(),
        profiles: { full_name: newReviewName || 'Mən' }
      }, ...reviews]);
      setReviewSubmitted(true);
      setNewReviewName('');
      setNewReviewComment('');
      setTimeout(() => setReviewSubmitted(false), 4000);
    } else {
      alert(res.error || 'Xəta baş verdi.');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : i < rating
            ? 'fill-amber-400/50 text-amber-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div className="bg-background text-foreground min-h-screen py-6 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground font-medium overflow-x-auto pb-1">
          <Link href={`/${locale}`} className="hover:text-foreground flex items-center gap-1 shrink-0">
            <Home className="h-3.5 w-3.5" />
            <span>{locale === 'en' ? 'Home' : locale === 'ru' ? 'Главная' : 'Ana Səhifə'}</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <Link href={`/${locale}/catalog`} className="hover:text-foreground shrink-0">
            {locale === 'en' ? 'Catalog' : locale === 'ru' ? 'Каталог' : 'Kataloq'}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <span className="text-foreground font-bold truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
        </nav>

        {/* 1. Main Product Showcase & Control Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Gallery Showcase (Left Column) */}
          <div className="lg:col-span-6 space-y-4">
            <div 
              className="relative aspect-square w-full rounded-3xl bg-muted/40 border border-border/80 overflow-hidden group shadow-soft-sm select-none cursor-pointer"
              onTouchStart={handleGalleryTouchStart}
              onTouchEnd={handleGalleryTouchEnd}
              onClick={() => setShowImageModal(true)}
            >
              {!activeImage || imageError ? (
                <SpeedcubeImageFallback alt={product.title} />
              ) : (
                <Image
                  src={sanitizeImageUrl(activeImage, product.id)}
                  alt={product.title}
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="object-contain p-8 transform group-hover:scale-102 transition-transform duration-500"
                />
              )}

              {/* Zoom Indicator */}
              <div className="absolute top-4 left-4 z-10 p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
                <Maximize2 className="h-4 w-4" />
              </div>

              {/* Left / Right click and tap areas for image switching */}
              {galleryImages.length > 1 && (
                <>
                  <div 
                    onClick={handlePrevImage}
                    className="absolute left-0 top-0 bottom-0 w-2/5 z-20 cursor-pointer flex items-center justify-start pl-3 group/left"
                    title="Əvvəlki şəkil"
                  >
                    <div className="p-2.5 rounded-full bg-black/25 text-white opacity-0 group-hover/left:opacity-100 hover:bg-black/50 transition-all backdrop-blur-sm shadow-md">
                      <ChevronLeft className="h-5 w-5" />
                    </div>
                  </div>

                  <div 
                    onClick={handleNextImage}
                    className="absolute right-0 top-0 bottom-0 w-2/5 z-20 cursor-pointer flex items-center justify-end pr-3 group/right"
                    title="Növbəti şəkil"
                  >
                    <div className="p-2.5 rounded-full bg-black/25 text-white opacity-0 group-hover/right:opacity-100 hover:bg-black/50 transition-all backdrop-blur-sm shadow-md">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Image Counter Badge (Only visible when hovering / touching main image) */}
                  <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </div>
                </>
              )}

              {isTrulyOutOfStock && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.5px] flex items-center justify-center z-25 pointer-events-none">
                  <span className="text-white text-sm font-black tracking-widest px-4 py-2 bg-red-600 rounded-xl shadow-lg uppercase">
                    {dict?.product?.out_of_stock || 'Bitib'}
                  </span>
                </div>
              )}

              {/* Media Overlays */}
              <div className="absolute bottom-4 left-4 z-30 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="bg-background/90 hover:bg-background backdrop-blur-sm border border-border px-3.5 py-2 rounded-xl text-xs font-bold text-foreground flex items-center gap-1.5 shadow-soft-sm cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 text-rubik-brand fill-rubik-brand" />
                  <span>{locale === 'en' ? 'Overview Video' : locale === 'ru' ? 'Видео Обзор' : 'Baxış Videosu'}</span>
                </button>
              </div>
            </div>

            {/* Gallery Thumbnails - Strictly Single Row Horizontal Scroll */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory flex-nowrap min-w-0 w-full">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    ref={(el) => {
                      thumbnailRefs.current[idx] = el;
                    }}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`relative w-16 h-16 shrink-0 snap-start rounded-2xl bg-muted/40 border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
                      activeImage === img ? 'border-rubik-brand ring-2 ring-rubik-brand/20 shadow-soft-md scale-95' : 'border-transparent hover:border-border'
                    }`}
                  >
                    <Image
                      src={sanitizeImageUrl(img, `${product.id}_${idx}`)}
                      alt={`${product.title} - ${idx}`}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Core Details & Operations (Right Column) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2.5">
              {/* Dynamic Product Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-rubik-brand/10 text-rubik-brand font-black text-xs tracking-wider rounded-full uppercase">
                  {resolvedBrand} {typeBadge ? `• ${typeBadge}` : ''}
                </span>

                {hasDiscount && (
                  <span className="px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded-full uppercase tracking-wider shadow-sm">
                    -{discountPercent}% {locale === 'en' ? 'OFF' : locale === 'ru' ? 'СКИДКА' : 'ENDİRİM'}
                  </span>
                )}

                {product?.is_featured && (
                  <span className="px-2.5 py-1 bg-[#FDECEC] text-[#B31B21] border border-[#D8232A]/30 font-bold text-xs rounded-full uppercase">
                    ⭐ {locale === 'en' ? 'FLAGSHIP' : locale === 'ru' ? 'ФЛАГМАН' : 'FLAQMAN'}
                  </span>
                )}

                {!isOutOfStock && (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs rounded-full uppercase">
                    ⚡ {locale === 'en' ? 'IN STOCK' : locale === 'ru' ? 'В НАЛИЧИИ' : 'STOKDA VAR'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground line-clamp-2">
                {product.title}
              </h1>

              {/* Review Aggregate */}
              <div className="flex items-center gap-3">
                {reviews.length > 0 && averageRating ? (
                  <>
                    <div className="flex items-center">
                      {renderStars(Number(averageRating))}
                    </div>
                    <span className="text-sm font-black text-foreground">{averageRating}</span>
                    <span className="text-muted-foreground text-xs">• ({reviews.length} {locale === 'en' ? 'customer reviews' : locale === 'ru' ? 'отзывов' : 'müştəri rəyi'})</span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
                    {locale === 'en' ? 'No reviews yet' : locale === 'ru' ? 'Пока нет отзывов' : 'Hələ rəy yoxdur'}
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded border border-border">
                  SKU: {currentSku}
                </span>
              </div>
            </div>

            {/* 4. Active Price Tag */}
            <div className="bg-gradient-to-r from-muted/60 via-muted/40 to-muted/20 border border-border/80 p-4 rounded-2xl my-2 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground block uppercase tracking-wider">
                    {locale === 'en' ? 'Special Price' : locale === 'ru' ? 'Специальная Цена' : 'Xüsusi Qiymət'}
                  </span>
                  <div className="flex items-baseline flex-wrap gap-3">
                    <span className="text-3xl font-black text-foreground font-mono tracking-tight">
                      {formatPrice(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-lg text-muted-foreground/80 line-through font-semibold font-mono">
                        {formatPrice(numOriginalPrice + addonCost)}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs rounded-full uppercase tracking-wider shadow-md animate-pulse">
                        -{discountPercent}% {locale === 'en' ? 'OFF' : locale === 'ru' ? 'СКИДКА' : 'ENDİRİM'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {hasDiscount && (
                <div className="pt-2 border-t border-border/50 flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{locale === 'en' ? 'By choosing this product you save ' : locale === 'ru' ? 'Выбирая этот товар вы экономите ' : 'Bu məhsulu seçməklə '}<span className="font-mono text-sm underline">{formatPrice(numOriginalPrice - finalPrice)}</span>{locale === 'en' ? '!' : locale === 'ru' ? '!' : ' qənaət edirsiniz!'}</span>
                </div>
              )}
            </div>

            {/* 5. Vertical Variant Card Selector Component - Only displayed if product has 2 or more versions */}
            {dbVariants.length > 1 && (
              <div className="my-4 space-y-2">
                <div className="text-xs md:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span className="text-muted-foreground font-semibold">
                    {locale === 'en' ? 'Version:' : locale === 'ru' ? 'Версия:' : 'Versiya:'}
                  </span>
                  <span className="font-extrabold text-primary">
                    {selectedVariant?.name || selectedVariant?.title_az || selectedVariant?.sku || product.title}
                  </span>
                </div>
                <div className={`flex flex-col gap-2.5 ${dbVariants.length >= 6 ? 'max-h-[380px] overflow-y-auto pr-1' : ''}`}>
                  {dbVariants.map((v: any) => {
                    const isSelected = String(selectedVariant?.id) === String(v.id);
                    const vPrice = Number(v.price_azn ?? v.price ?? basePrice);
                    const vComparePrice = v.compare_at_price_azn ? Number(v.compare_at_price_azn) : null;
                    const vTitle = v.name || v.title_az || v.sku || 'Versiya';
                    const vImg = sanitizeImageUrl(v.image_url || product?.image_url, String(v.id));

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleVariantSelect(v)}
                        className={`w-full min-h-[52px] p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-2 border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
                        }`}
                      >
                        {/* LEFT: Variant Thumbnail Image + Bold Variant Name */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={vImg}
                            alt={vTitle}
                            className="w-16 h-16 object-cover rounded-lg border border-border shrink-0 bg-background"
                          />
                          <span className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                            {vTitle}
                          </span>
                        </div>

                        {/* RIGHT: Formatted Price + Strikethrough old price if discounted + Checkmark icon */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <div className="font-extrabold text-sm text-foreground whitespace-nowrap">
                              {formatPrice(vPrice)}
                            </div>
                            {vComparePrice && vComparePrice > vPrice && (
                              <div className="text-xs text-muted-foreground line-through whitespace-nowrap">
                                {formatPrice(vComparePrice)}
                              </div>
                            )}
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5 font-bold stroke-[3]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. Stock Status Indicator */}
            <div className="flex items-center gap-2.5 my-3 p-3.5 bg-muted/20 border border-border/60 rounded-xl">
              <span className={`w-3 h-3 rounded-full shrink-0 ${
                isPreorder ? 'bg-amber-500 animate-pulse' : isTrulyOutOfStock ? 'bg-red-500' : 'bg-emerald-500'
              }`} />
              <span className={`text-xs md:text-sm font-bold ${
                isPreorder ? 'text-amber-600 dark:text-amber-400' : isTrulyOutOfStock ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {isPreorder
                  ? (locale === 'en'
                      ? `On Pre-order (${(product?.preorder_lead_time || '14-28 business days').replace(/14-28 iş günü/g, '14-28 business days').replace(/iş günü/g, 'business days').replace(/gün/g, 'days')})`
                      : locale === 'ru'
                      ? `На предзаказе (${(product?.preorder_lead_time || '14-28 рабочих дней').replace(/14-28 iş günü/g, '14-28 рабочих дней').replace(/iş günü/g, 'рабочих дней').replace(/gün/g, 'дней')})`
                      : `Öncədən Sifarişdədir (${product?.preorder_lead_time || '14-28 iş günü'})`)
                  : isTrulyOutOfStock
                  ? (locale === 'en' ? 'Out of Stock' : locale === 'ru' ? 'Нет в наличии' : 'Bitib (Müvəqqəti yoxdur)')
                  : (locale === 'en' ? `In Stock (${effectiveStock} pcs)` : locale === 'ru' ? `В наличии (${effectiveStock} шт.)` : `Stokda var (${effectiveStock} ədəd)`)}
              </span>
            </div>

            {/* Pre-Order Special Warning Box */}
            {isPreorder && (
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-1.5 text-amber-900 dark:text-amber-300">
                <div className="flex items-center gap-2 font-black text-xs md:text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  <Clock className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                  <span>{locale === 'en' ? 'Pre-order Information & Terms' : locale === 'ru' ? 'Информация и Условия Предзаказа' : 'Ön Sifariş Məlumatı Və Şərtləri'}</span>
                </div>
                <p className="text-xs md:text-sm font-bold leading-relaxed">
                  {locale === 'en' 
                    ? `This product is on pre-order, delivered in ${(product?.preorder_lead_time || '14-28 business days').replace(/14-28 iş günü/g, '14-28 business days').replace(/iş günü/g, 'business days').replace(/gün/g, 'days')}. 100% advance payment required via WhatsApp.` 
                    : locale === 'ru' 
                    ? `Этот товар по предзаказу, доставка за ${(product?.preorder_lead_time || '14-28 рабочих дней').replace(/14-28 iş günü/g, '14-28 рабочих дней').replace(/iş günü/g, 'рабочих дней').replace(/gün/g, 'дней')}. Требуется 100% предоплата в WhatsApp.` 
                    : `Bu məhsul ön sifarişdədir, ${product?.preorder_lead_time || '14-28 iş gününə'} çatdırılır. WhatsApp üzərindən 100% ön ödəniş tələb olunur.`}
                </p>
              </div>
            )}

            {/* Safe & Optional Custom Add-ons List (Strictly Null-Safe, NO Hardcoded Setup) */}
            {product?.add_ons && Array.isArray(product.add_ons) && product.add_ons.length > 0 && addOnsList.length > 0 && (
              <div className="border border-dashed border-rubik-brand/50 rounded-2xl p-4 bg-rubik-brand/5 space-y-3">
                <span className="text-xs font-black text-rubik-brand block uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  {locale === 'en' ? 'Additional Services & Accessories' : locale === 'ru' ? 'Дополнительные Услуги и Аксессуары' : 'Əlavə Xidmətlər və Aksesuarlar'}
                </span>
                <div className="space-y-2">
                  {addOnsList.map((addon: any) => {
                    const addonIdStr = String(addon.id || addon.title || addon.name);
                    const isChecked = selectedAddonIds.has(addonIdStr);
                    const addonPrice = Number(addon.price_azn || addon.price || 0);
                    const addonTitle = addon.title_az || addon.title || addon.name || 'Əlavə Xidmət';
                    const addonDesc = addon.description_az || addon.description;

                    return (
                      <label
                        key={addonIdStr}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked ? 'bg-card border-rubik-brand shadow-soft-xs' : 'bg-background/60 border-border hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAddon(addonIdStr)}
                            className="h-4 w-4 rounded text-rubik-brand focus:ring-rubik-brand cursor-pointer shrink-0"
                          />
                          <div>
                            <span className="font-extrabold text-xs md:text-sm text-foreground block">
                              {addonTitle}
                            </span>
                            {addonDesc && (
                              <span className="text-[11px] text-muted-foreground leading-snug block">
                                {addonDesc}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-xs md:text-sm text-rubik-brand shrink-0 ml-2">
                          +{(addonPrice).toFixed(2)} AZN
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Stock & Delivery Urgency Notice */}
            <div className="pt-1">
              {isPreorder ? null : isTrulyOutOfStock ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3.5 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-semibold">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <span>{locale === 'en' ? 'Temporarily out of stock — contact us to get notified when available.' : locale === 'ru' ? 'Временно нет в наличии — свяжитесь с нами, чтобы узнать о поступлении.' : 'Stokda müvəqqəti yoxdur — Məhsul gələndə xəbərdar olmaq üçün bizimlə əlaqə saxlayın.'}</span>
                </div>
              ) : effectiveStock <= 5 ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs md:text-sm font-extrabold animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <Zap className="h-5 w-5 text-red-500 shrink-0 fill-red-500" />
                    <span>{locale === 'en' ? `Only ` : locale === 'ru' ? `Осталось всего ` : `Yalnız `}<u className="underline decoration-2">{effectiveStock} {locale === 'en' ? 'pcs' : locale === 'ru' ? 'шт.' : 'ədəd'}</u> {locale === 'en' ? `left — will be shipped on ${estimatedShipDate}` : locale === 'ru' ? `— будет отправлено ${estimatedShipDate}` : `qaldı — ${estimatedShipDate} tarixində göndəriləcək`}</span>
                  </div>
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase shrink-0">{locale === 'en' ? 'URGENT' : locale === 'ru' ? 'СРОЧНО' : 'TƏCİLİ'}</span>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-semibold">
                  <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{locale === 'en' ? 'In stock: ' : locale === 'ru' ? 'В наличии: ' : 'Anbarda: '}<strong className="font-extrabold">{effectiveStock} {locale === 'en' ? 'pcs' : locale === 'ru' ? 'шт.' : 'ədəd'}</strong> {locale === 'en' ? `— will be shipped on ${estimatedShipDate}` : locale === 'ru' ? `— будет отправлено ${estimatedShipDate}` : `var — ${estimatedShipDate} tarixində göndəriləcək`}</span>
                </div>
              )}
            </div>

            {/* Action Hub with Quantity Selector */}
            <div ref={mainAddToCartRef} className="space-y-4 pt-2">
              {/* Quantity Selector Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-muted/30 border border-border/80 p-3.5 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-foreground block">
                    {locale === 'en' ? 'Quantity' : locale === 'ru' ? 'Количество' : 'Miqdar'}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    {isPreorder ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{locale === 'en' ? 'Custom pre-order item' : locale === 'ru' ? 'Специальный заказ по предзаказу' : 'Ön sifariş üçün xüsusi sifariş'}</span>
                    ) : isTrulyOutOfStock ? (
                      <span className="text-red-500 font-bold">{locale === 'en' ? 'Out of stock' : locale === 'ru' ? 'Нет в наличии' : 'Stokda yoxdur'}</span>
                    ) : (
                      <>{locale === 'en' ? 'In stock: ' : locale === 'ru' ? 'В наличии: ' : 'Anbarda: '}<strong className="text-foreground font-bold">{effectiveStock} {locale === 'en' ? 'pcs' : locale === 'ru' ? 'шт.' : 'ədəd'}</strong></>
                    )}
                  </span>
                </div>

                <div className="flex items-center border border-border bg-card rounded-xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isTrulyOutOfStock}
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-foreground hover:bg-muted active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={isPreorder ? 99 : (effectiveStock > 0 ? effectiveStock : 1)}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 1) {
                        setQuantity(1);
                      } else if (!isPreorder && effectiveStock > 0 && val > effectiveStock) {
                        setQuantity(effectiveStock);
                      } else {
                        setQuantity(val);
                      }
                    }}
                    disabled={isTrulyOutOfStock}
                    className="w-12 text-center font-black text-sm bg-transparent text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => isPreorder ? q + 1 : Math.min(effectiveStock > 0 ? effectiveStock : 1, q + 1))}
                    disabled={(!isPreorder && quantity >= effectiveStock) || isTrulyOutOfStock}
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-foreground hover:bg-muted active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(false)}
                    disabled={isTrulyOutOfStock}
                    className={`w-full py-3 px-3 sm:py-4 sm:px-4 font-black rounded-[8px] text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isTrulyOutOfStock
                        ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-none'
                        : isPreorder
                        ? 'bg-[#FFFFFF] text-[#D8232A] border-[1.5px] border-[#D8232A] hover:bg-[#FDECEC] active:scale-98'
                        : 'bg-[#D8232A] text-white hover:bg-[#B31B21] active:scale-98'
                    }`}
                  >
                    {isPreorder ? (
                      <>
                        <Clock className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0" />
                        <span>{locale === 'en' ? 'Pre-order' : locale === 'ru' ? 'Предзаказ' : 'Ön sifariş et'} {quantity > 1 ? `(${quantity})` : ''}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0" />
                        <span>{locale === 'en' ? 'Add to Cart' : locale === 'ru' ? 'Добавить в корзину' : 'Səbətə Əlavə Et'} {quantity > 1 ? `(${quantity})` : ''}</span>
                      </>
                    )}
                  </button>
                  {isPreorder && (
                    <span className="text-[12px] text-[#6B7280] font-normal mt-1 text-center">
                      {locale === 'en' ? 'Delivered in 14-28 business days' : locale === 'ru' ? 'Доставка в течение 14-28 рабочих дней' : '14-28 iş günü ərzində çatdırılacaq'}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(true)}
                    disabled={isTrulyOutOfStock}
                    className={`w-full py-3 px-3 sm:py-4 sm:px-4 font-black rounded-[8px] text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isTrulyOutOfStock
                        ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed border-none'
                        : isPreorder
                        ? 'bg-[#FFFFFF] text-[#D8232A] border-[1.5px] border-[#D8232A] hover:bg-[#FDECEC] active:scale-98'
                        : 'bg-[#17181C] text-white hover:bg-[#D8232A] active:scale-98'
                    }`}
                  >
                    <Zap className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 text-[#D8232A]" />
                    <span>{isPreorder ? (locale === 'en' ? 'Pre-order Now' : locale === 'ru' ? 'Предзаказать Сейчас' : 'İndi Ön Sifariş Et') : (locale === 'en' ? 'Buy Now' : locale === 'ru' ? 'Купить Сейчас' : 'İndi Al (Sifariş et)')}</span>
                  </button>
                  {isPreorder && (
                    <span className="text-[12px] text-[#6B7280] font-normal mt-1 text-center">
                      {locale === 'en' ? 'Delivered in 14-28 business days' : locale === 'ru' ? 'Доставка в течение 14-28 рабочих дней' : '14-28 iş günü ərzində çatdırılacaq'}
                    </span>
                  )}
                </div>
              </div>

              {/* Auxiliary actions */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await toggleWishlist(product.id);
                    if (res.success) {
                      setIsWishlisted(res.wishlisted || false);
                    }
                  }}
                  className="hover:text-foreground font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Heart className={`h-4.5 w-4.5 ${isWishlisted ? 'text-red-500 fill-red-500' : ''}`} />
                  <span>{isWishlisted ? (locale === 'en' ? 'In Wishlist' : locale === 'ru' ? 'В Избранном' : 'İstək Siyahısında') : (locale === 'en' ? 'Add to Wishlist' : locale === 'ru' ? 'В Избранное' : 'İstək Siyahısına At')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCompared(true);
                    setTimeout(() => setIsCompared(false), 2500);
                  }}
                  className="hover:text-foreground font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <GitCompare className="h-4.5 w-4.5 text-blue-500" />
                  <span>{isCompared ? (locale === 'en' ? 'Added to comparison!' : locale === 'ru' ? 'Добавлено к сравнению!' : 'Müqayisəyə əlavə edildi!') : (locale === 'en' ? 'Compare' : locale === 'ru' ? 'Сравнить' : 'Müqayisə Et')}</span>
                </button>
              </div>
            </div>

            {/* Added to cart popup notifier */}
            <AnimatePresence>
              {showAddedToCartToast && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-green-600 text-white font-bold text-xs p-4 rounded-xl flex items-center justify-between shadow-soft-xl"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{locale === 'en' ? 'Product added to cart!' : locale === 'ru' ? 'Товар добавлен в корзину!' : 'Məhsul səbətinizə uğurla əlavə edildi!'}</span>
                  </div>
                  <Link href={`/${locale}/checkout`} className="underline hover:no-underline font-black ml-4 shrink-0">
                    {locale === 'en' ? 'View Cart' : locale === 'ru' ? 'В корзину' : 'Səbətə bax'}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auto-scroll Trust Banner */}
            <div
              onMouseEnter={() => setIsTrustBannerPaused(true)}
              onMouseLeave={() => setIsTrustBannerPaused(false)}
              className="bg-card border border-border/80 rounded-2xl p-4 shadow-soft-sm overflow-hidden space-y-3"
            >
              <div className="flex items-center justify-between gap-3 min-h-[50px]">
                <button
                  type="button"
                  onClick={() => setTrustSlideIndex((prev) => (prev - 1 + trustSlides.length) % trustSlides.length)}
                  className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
                  aria-label="Əvvəlki slayd"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex-1 flex items-center gap-3 overflow-hidden px-1">
                  {(() => {
                    const slide = trustSlides[trustSlideIndex];
                    const SlideIcon = slide.icon;
                    return (
                      <div className="flex items-center gap-3 w-full transition-all duration-300">
                        <div className={`p-2.5 rounded-xl ${slide.bg} shrink-0`}>
                          <SlideIcon className={`h-5 w-5 ${slide.color}`} />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-black text-xs md:text-sm text-foreground truncate">
                            {slide.title}
                          </span>
                          <span className="block text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                            {slide.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() => setTrustSlideIndex((prev) => (prev + 1) % trustSlides.length)}
                  className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
                  aria-label="Növbəti slayd"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Dot slide indicators */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {trustSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTrustSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      trustSlideIndex === idx
                        ? 'w-6 bg-rubik-brand'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Slayd ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Quick trust metrics grid */}
            <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border">
              <div className="text-center p-3 bg-muted/30 rounded-xl space-y-1">
                <Truck className="h-5 w-5 text-rubik-brand mx-auto" />
                <span className="block font-black text-[10px] text-foreground">
                  {locale === 'en' ? 'Fast Delivery' : locale === 'ru' ? 'Быстрая Доставка' : 'Sürətli Çatdırılma'}
                </span>
                <span className="block text-[8px] text-muted-foreground">
                  {locale === 'en' ? '1-3 hours in Baku' : locale === 'ru' ? '1-3 часа по Баку' : 'Bakı daxili 1-3 saat'}
                </span>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-xl space-y-1">
                <Award className="h-5 w-5 text-green-600 mx-auto" />
                <span className="block font-black text-[10px] text-foreground">
                  {locale === 'en' ? '100% Original' : locale === 'ru' ? '100% Оригинал' : '100% Orijinal'}
                </span>
                <span className="block text-[8px] text-muted-foreground">
                  {locale === 'en' ? 'Official warranty' : locale === 'ru' ? 'Официальная гарантия' : 'Rəsmi istehsalçı zəmanəti'}
                </span>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-xl space-y-1">
                <RotateCcw className="h-5 w-5 text-blue-500 mx-auto" />
                <span className="block font-black text-[10px] text-foreground">
                  {locale === 'en' ? 'Easy Return' : locale === 'ru' ? 'Простой Возврат' : 'Asan Geri Qaytarma'}
                </span>
                <span className="block text-[8px] text-muted-foreground">
                  {locale === 'en' ? 'Exchange in 14 days' : locale === 'ru' ? 'Обмен за 14 дней' : '14 gün daxilində dəyişmə'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Frequently Bought Together Bundle Section - Only rendered if real bundle products exist in DB */}
        {hasValidBundle && (
          <div className="bg-card border border-border/90 rounded-3xl p-5 md:p-6 shadow-soft-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rubik-brand/10 text-rubik-brand rounded-xl">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-foreground tracking-tight">
                    {locale === 'en' ? 'Frequently Bought Together' : locale === 'ru' ? 'С этим товаром покупают' : 'Tez-tez Birlikdə Alınır'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'en' ? 'Combine flagship cube with essentials' : locale === 'ru' ? 'Скомбинируйте кубик с нужными аксессуарами' : 'Bu məhsulla birlikdə ən çox seçilən peşəkar aksesuarlar və tamamlayıcı məhsullar'}
                  </p>
                </div>
              </div>
              {bundleSavings > 0 && (
                <span className="text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full w-fit">
                  🔥 {bundleSavings.toFixed(2)} AZN {locale === 'en' ? 'Savings' : locale === 'ru' ? 'Экономия' : 'Qənaət'}
                </span>
              )}
            </div>

            {/* Bundle Items Visual Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 flex flex-col md:flex-row items-center gap-3">
                {/* Item 1 (Main product) */}
                <div className="flex items-center gap-3 bg-muted/30 border border-border/80 rounded-2xl p-3 w-full md:w-1/3 min-h-[95px]">
                  <div className="relative h-16 w-16 shrink-0 bg-background rounded-xl overflow-hidden border border-border p-1.5">
                    {bundleItem1.image ? (
                      <Image
                        src={sanitizeImageUrl(bundleItem1.image, 'bundle1')}
                        alt={bundleItem1.title}
                        fill
                        referrerPolicy="no-referrer"
                        className="object-contain"
                      />
                    ) : (
                      <SpeedcubeImageFallback alt="Bundle item" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rubik-brand block">
                      {locale === 'en' ? 'Main Product' : locale === 'ru' ? 'Основной Товар' : 'Əsas Məhsul'}
                    </span>
                    <span className="text-xs font-bold text-foreground line-clamp-2 leading-tight block">
                      {bundleItem1.title}
                    </span>
                    <span className="text-xs font-black text-foreground block">
                      {bundleItem1.price.toFixed(2)} AZN
                    </span>
                  </div>
                </div>

                {bundleItem2 && (
                  <>
                    <span className="text-muted-foreground font-black text-lg hidden md:inline shrink-0">+</span>

                    {/* Item 2 */}
                    <label className={`flex items-center gap-3 border rounded-2xl p-3 w-full md:w-1/3 min-h-[95px] cursor-pointer transition-all select-none ${
                      bundleChecked2 ? 'bg-muted/30 border-rubik-brand/60' : 'bg-background border-border/50 opacity-60'
                    }`}>
                      <input
                        type="checkbox"
                        checked={bundleChecked2}
                        onChange={(e) => setBundleChecked2(e.target.checked)}
                        className="h-4 w-4 rounded text-rubik-brand focus:ring-rubik-brand cursor-pointer shrink-0"
                      />
                      <div className="relative h-16 w-16 shrink-0 bg-background rounded-xl overflow-hidden border border-border p-1.5">
                        {bundleItem2.image ? (
                          <Image
                            src={sanitizeImageUrl(bundleItem2.image, 'bundle2')}
                            alt={bundleItem2.title}
                            fill
                            referrerPolicy="no-referrer"
                            className="object-contain"
                          />
                        ) : (
                          <SpeedcubeImageFallback alt="Bundle item" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 block">
                          {locale === 'en' ? 'Recommended' : locale === 'ru' ? 'Рекомендуемое' : 'Tövsiyə Olunan'}
                        </span>
                        <span className="text-xs font-bold text-foreground line-clamp-2 leading-tight block">
                          {bundleItem2.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-black text-rubik-brand">
                            {bundleItem2.price.toFixed(2)} AZN
                          </span>
                          {bundleItem2.original_price > bundleItem2.price && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              {bundleItem2.original_price.toFixed(2)} AZN
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  </>
                )}

                {bundleItem3 && (
                  <>
                    <span className="text-muted-foreground font-black text-lg hidden md:inline shrink-0">+</span>

                    {/* Item 3 */}
                    <label className={`flex items-center gap-3 border rounded-2xl p-3 w-full md:w-1/3 min-h-[95px] cursor-pointer transition-all select-none ${
                      bundleChecked3 ? 'bg-muted/30 border-rubik-brand/60' : 'bg-background border-border/50 opacity-60'
                    }`}>
                      <input
                        type="checkbox"
                        checked={bundleChecked3}
                        onChange={(e) => setBundleChecked3(e.target.checked)}
                        className="h-4 w-4 rounded text-rubik-brand focus:ring-rubik-brand cursor-pointer shrink-0"
                      />
                      <div className="relative h-16 w-16 shrink-0 bg-background rounded-xl overflow-hidden border border-border p-1.5">
                        {bundleItem3.image ? (
                          <Image
                            src={sanitizeImageUrl(bundleItem3.image, 'bundle3')}
                            alt={bundleItem3.title}
                            fill
                            referrerPolicy="no-referrer"
                            className="object-contain"
                          />
                        ) : (
                          <SpeedcubeImageFallback alt="Bundle item" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-500 block">
                          {locale === 'en' ? 'Complementary' : locale === 'ru' ? 'Сопутствующее' : 'Tamamlayıcı'}
                        </span>
                        <span className="text-xs font-bold text-foreground line-clamp-2 leading-tight block">
                          {bundleItem3.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-black text-rubik-brand">
                            {bundleItem3.price.toFixed(2)} AZN
                          </span>
                          {bundleItem3.original_price > bundleItem3.price && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              {bundleItem3.original_price.toFixed(2)} AZN
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  </>
                )}
              </div>

              {/* Bundle CTA Box */}
              <div className="lg:col-span-4 bg-muted/40 border border-border/80 rounded-2xl p-4 flex flex-col justify-between gap-3 h-full">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold block">
                    {locale === 'en' ? 'Total Bundle Price:' : locale === 'ru' ? 'Итого за комплект:' : 'Paket Cəmi Məbləğ:'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-2xl font-black text-foreground">
                      {bundleTotalPrice.toFixed(2)} AZN
                    </span>
                    {bundleSavings > 0 && (
                      <span className="text-xs text-muted-foreground line-through font-bold">
                        {(bundleTotalPrice + bundleSavings).toFixed(2)} AZN
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddBundleToCart}
                  className="w-full py-3 px-4 bg-rubik-brand text-white font-black text-xs md:text-sm rounded-xl hover:bg-rubik-brand-dark transition-all flex items-center justify-center gap-2 shadow-soft-sm cursor-pointer active:scale-98"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{locale === 'en' ? 'Add Selected to Cart' : locale === 'ru' ? 'Добавить выбранное в корзину' : 'Seçilənləri Birlikdə Səbətə Əlavə Et'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Information Tabs Accordion with Description & Dynamic Comparison Table */}
        <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-soft-sm">
          {/* Tab Headers */}
          <div className="bg-muted border-b border-border flex flex-wrap">
            {[
              { id: 'description', label: locale === 'en' ? 'Description' : locale === 'ru' ? 'Описание Товара' : 'Məhsul Təsviri', icon: Info },
              { id: 'specs', label: locale === 'en' ? 'Specifications' : locale === 'ru' ? 'Характеристики' : 'Spesifikasiyalar', icon: Award },
              { id: 'compatibility', label: locale === 'en' ? 'Compatibility' : locale === 'ru' ? 'Совместимость' : 'Uyğunluq', icon: AlertCircle },
              { id: 'shipping', label: locale === 'en' ? 'Shipping Terms' : locale === 'ru' ? 'Условия Доставки' : 'Çatdırılma Şərtləri', icon: Truck },
              { id: 'return', label: locale === 'en' ? 'Warranty & Returns' : locale === 'ru' ? 'Гарантия и Возврат' : 'Zəmanət və Geri Qaytarma', icon: RotateCcw },
              { id: 'faq', label: locale === 'en' ? 'FAQ' : locale === 'ru' ? 'Вопросы и Ответы' : 'Sual-Cavab', icon: HelpCircle }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-4 text-xs md:text-sm font-bold border-r border-border transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-background text-rubik-brand'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content body */}
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-4 text-sm text-muted-foreground leading-relaxed"
                >
                  <h4 className="text-base font-bold text-foreground">{locale === 'en' ? 'Product Description' : locale === 'ru' ? 'Описание Товара' : 'Məhsul Təsviri'}</h4>
                  <p className="whitespace-pre-line">{product.description}</p>
                  
                  {/* Dynamic Version Comparison Matrix */}
                  <SpeedcubeComparisonMatrix product={product} variants={dbVariants} locale={locale} />
                </motion.div>
              )}

              {activeTab === 'specs' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-6"
                >
                  <h4 className="text-base font-bold text-foreground">{locale === 'en' ? 'Technical Specifications' : locale === 'ru' ? 'Технические Характеристики' : 'Texniki Spesifikasiyalar'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(specsToDisplay).map(([key, val]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-border/60 text-xs md:text-sm">
                        <span className="text-muted-foreground capitalize font-semibold">{key}</span>
                        <span className="text-foreground font-black font-mono">{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Version Specs Comparison Matrix */}
                  <SpeedcubeComparisonMatrix product={product} variants={dbVariants} locale={locale} />
                </motion.div>
              )}

              {activeTab === 'compatibility' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-3 text-sm text-muted-foreground leading-relaxed"
                >
                  <h4 className="text-base font-bold text-foreground">{locale === 'en' ? 'Compatibility' : locale === 'ru' ? 'Совместимость' : 'Uyğunluq Şərtləri'}</h4>
                  <p>{product.compatibility || (locale === 'en' ? 'Suitable for speedcubers of all ages and skill levels.' : locale === 'ru' ? 'Подходит для спидкуберов всех возрастов и уровней подготовки.' : 'Bütün yaş və təcrübə səviyyələrində olan speedcuberlər üçün tam uyğundur.')}</p>
                  <div className="bg-muted p-4 rounded-xl border border-border flex items-center gap-3 mt-2">
                    <Info className="h-5 w-5 text-rubik-brand shrink-0" />
                    <span className="text-xs leading-relaxed text-foreground">
                      {locale === 'en' ? 'Fully complies with WCA (World Cube Association) standards. Can be used in official competitions.' : locale === 'ru' ? 'Полностью соответствует стандартам WCA (World Cube Association). Допущено к официальным соревнованиям.' : 'WCA (World Cube Association) standartlarına tam cavab verir. Hər hansı rəsmi turnirdə limitsiz istifadə edilə bilər.'}
                    </span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'shipping' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-4 text-sm text-muted-foreground leading-relaxed"
                >
                  <h4 className="text-base font-bold text-foreground">{locale === 'en' ? 'Fast Delivery Terms' : locale === 'ru' ? 'Правила Быстрой Доставки' : 'Sürətli Çatdırılma Qaydaları'}</h4>
                  <p>
                    {locale === 'en' ? 'Rubikshop has the fastest delivery network in Azerbaijan. Delivery options are:' : locale === 'ru' ? 'Rubikshop имеет самую быструю службу доставки в Азербайджане. Варианты доставки:' : 'Rubikshop Azərbaycan daxilində ən sürətli kuryer şəbəkəsinə malikdir. Sifarişlərin çatdırılması aşağıdakı kimi təyin edilmişdir:'}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>{locale === 'en' ? 'Express delivery in Baku:' : locale === 'ru' ? 'Экспресс-доставка по Баку:' : 'Bakı daxili express çatdırılma:'}</strong> {locale === 'en' ? '1-3 hours (direct to door).' : locale === 'ru' ? '1-3 часа (курьером до двери).' : '1-3 saat ərzində (kuryer ilə birbaşa qapıya).'}</li>
                    <li><strong>{locale === 'en' ? 'Sumqayit & Absheron:' : locale === 'ru' ? 'Сумгаит и Апшерон:' : 'Sumqayıt və Abşeron yarımadası:'}</strong> {locale === 'en' ? 'Same day (within 4-6 hours).' : locale === 'ru' ? 'В тот же день (4-6 часов).' : 'Eyni gün daxilində (4-6 saat ərzində).'}</li>
                    <li><strong>{locale === 'en' ? 'Other regions of Azerbaijan:' : locale === 'ru' ? 'Другие регионы Азербайджана:' : 'Azərbaycanın digər rayon və şəhərləri:'}</strong> {locale === 'en' ? '24-48 hours via Azerpost.' : locale === 'ru' ? '24-48 часов через Azerpost.' : 'Azərpoçt və ya xüsusi poçt xidmətləri vasitəsilə 24-48 saat ərzində.'}</li>
                  </ul>
                </motion.div>
              )}

              {activeTab === 'return' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-4 text-sm text-muted-foreground leading-relaxed"
                >
                  <h4 className="text-base font-bold text-foreground">{locale === 'en' ? 'Warranty & Returns' : locale === 'ru' ? 'Гарантия и Возврат' : 'Geri Qaytarma və Müştəri Təminatı'}</h4>
                  <p>
                    {locale === 'en' ? 'Every product purchased is in its official factory sealed box and comes with an authenticity guarantee.' : locale === 'ru' ? 'Каждый товар поставляется в официальной фирменной упаковке и имеет гарантию подлинности.' : 'Alınan hər bir məhsul istehsalçı tərəfindən rəsmi qorunma qutusundadır və orijinallıq zəmanəti daşıyır.'}
                  </p>
                  <p className="text-xs">
                    {locale === 'en' ? 'If the product is unused and packaging is undamaged, you can exchange or return it within 14 days without extra charges.' : locale === 'ru' ? 'Если товар не использовался и упаковка не повреждена, вы можете обменять или вернуть его в течение 14 дней без дополнительных комиссий.' : 'Məhsulu istifadə etmədiyiniz, qutusuna və aksesuarlarına xələl gətirmədiyiniz təqdirdə 14 gün müddətində heç bir əlavə ödəniş etmədən tam geri qaytara və ya başqa modelə dəyişə bilərsiniz.'}
                  </p>
                </motion.div>
              )}

              {activeTab === 'faq' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-4"
                >
                  <h4 className="text-base font-bold text-foreground">{locale === 'en' ? 'Frequently Asked Questions' : locale === 'ru' ? 'Часто Задаваемые Вопросы' : 'Ən Çox Verilən Suallar'}</h4>
                  <div className="space-y-3">
                    <div className="bg-muted p-4 rounded-xl border border-border/60">
                      <span className="block font-bold text-foreground text-xs mb-1">{locale === 'en' ? 'Does the product come lubricated?' : locale === 'ru' ? 'Кубик поставляется смазанным?' : 'Məhsul yağlanmış gəlir?'}</span>
                      <span className="text-xs text-muted-foreground">{locale === 'en' ? 'It has factory protective lube. For optimal speed performance, we recommend ordering our professional lubrication service.' : locale === 'ru' ? 'Внутри есть заводская защита. Для идеального вращения рекомендуем заказать профессиональную смазку.' : 'Xeyr, standart zavod qutusu daxilində az miqdarda qoruyucu yağ olur. Əlavə setupsız tam professional sürət üçün rəsmi yağlama variantımızı seçməyi tövsiyə edirik.'}</span>
                    </div>
                    <div className="bg-muted p-4 rounded-xl border border-border/60">
                      <span className="block font-bold text-foreground text-xs mb-1">{locale === 'en' ? 'How can I adjust the tension?' : locale === 'ru' ? 'Как настроить натяжение?' : 'Dönmə gərginliyini necə nizamlaya bilərəm?'}</span>
                      <span className="text-xs text-muted-foreground">{locale === 'en' ? 'Use the adjustment tool included in the box to adjust elasticity and magnet strength.' : locale === 'ru' ? 'С помощью специального ключа из комплекта можно регулировать натяжение пружин и магнетизм.' : 'Qutudan çıxan xüsusi tənzimləmə açarları vasitəsilə yayların sıxlığını və maqnit gərginliyini daxili çarxlardan tənzimləmək olar.'}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 4. Interactive Review/Rating Module */}
        <section className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between border-b border-border pb-6">
            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-black text-foreground">
                {locale === 'en' ? 'Customer Reviews' : locale === 'ru' ? 'Отзывы Покупателей' : 'Müştəri Rəyləri'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {locale === 'en' ? 'Official ratings and opinions from our customers about this product' : locale === 'ru' ? 'Официальные отзывы и оценки наших покупателей об этом товаре' : 'Müştərilərimizin bu məhsul haqqında qeyd etdiyi rəsmi fikirlər və reytinqlər'}
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-border/60 shrink-0">
              {reviews.length > 0 && averageRating ? (
                <>
                  <span className="text-4xl font-black text-foreground">{averageRating}</span>
                  <div>
                    <div className="flex items-center mb-0.5">{renderStars(Number(averageRating))}</div>
                    <span className="text-xs text-muted-foreground">
                      {reviews.length} {locale === 'en' ? 'verified buyer reviews' : locale === 'ru' ? 'отзывов покупателей' : 'həqiqi alıcı rəyi'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-left">
                  <span className="text-sm font-bold text-amber-500 block">
                    {locale === 'en' ? 'No reviews yet' : locale === 'ru' ? 'Пока нет отзывов' : 'Hələ rəy yoxdur'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {locale === 'en' ? 'Be the first to write a review!' : locale === 'ru' ? 'Будьте первым, кто оставит отзыв!' : 'İlk rəyi siz yazın!'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Star Distribution Bar Chart */}
          <div className="bg-muted/20 border border-border/60 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              {locale === 'en' ? 'Rating Distribution' : locale === 'ru' ? 'Распределение Оценок' : 'Reytinq Paylanması'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starCounts[star as keyof typeof starCounts] || 0;
                const total = reviews.length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs bg-card/60 p-2.5 rounded-xl border border-border/40">
                    <span className="font-bold shrink-0 flex items-center gap-1 text-foreground min-w-[2.5rem]">
                      {star} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden border border-border/40">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono font-bold shrink-0">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={locale === 'en' ? 'Search in reviews...' : locale === 'ru' ? 'Поиск в отзывах...' : 'Rəylərdə axtarış et...'}
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                {locale === 'en' ? 'Sort by:' : locale === 'ru' ? 'Сортировка:' : 'Sıralama:'}
              </span>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as any)}
                className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand cursor-pointer"
              >
                <option value="newest">{locale === 'en' ? 'Newest' : locale === 'ru' ? 'Сначала новые' : 'Ən Yeni'}</option>
                <option value="oldest">{locale === 'en' ? 'Oldest' : locale === 'ru' ? 'Сначала старые' : 'Ən Qədim'}</option>
                <option value="highest">{locale === 'en' ? 'Highest Rating' : locale === 'ru' ? 'С высокой оценкой' : 'Ən Yüksək Reytinq'}</option>
                <option value="lowest">{locale === 'en' ? 'Lowest Rating' : locale === 'ru' ? 'С низкой оценкой' : 'Ən Aşağı Reytinq'}</option>
                <option value="helpful">{locale === 'en' ? 'Most Helpful' : locale === 'ru' ? 'Полезные' : 'Ən Faydalı'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Reviews display list */}
            <div className="lg:col-span-7 space-y-4 max-h-[460px] overflow-y-auto pr-2">
              {filteredAndSortedReviews.length === 0 ? (
                <div className="p-6 bg-muted/20 border border-border/40 rounded-2xl text-center text-xs md:text-sm text-muted-foreground">
                  {reviewSearch 
                    ? (locale === 'en' ? 'No reviews found matching search.' : locale === 'ru' ? 'Отзывов по запросу не найдено.' : 'Axtarışa uyğun rəy tapılmadı.')
                    : (locale === 'en' ? 'No reviews written for this product yet. Be the first to submit a review!' : locale === 'ru' ? 'К этому товару еще нет отзывов. Вы можете быть первым!' : 'Bu məhsul üçün hələ ki heç bir rəy yazılmayıb. İlk rəyi siz göndərə bilərsiniz!')
                  }
                </div>
              ) : (
                filteredAndSortedReviews.map((rev) => {
                  const rId = String(rev.id);
                  const vote = helpfulState[rId];
                  return (
                    <div key={rev.id} className="bg-muted/30 border border-border/40 p-4 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-rubik-brand" />
                          {rev.profiles?.full_name || rev.name || (locale === 'en' ? 'Anonymous Customer' : locale === 'ru' ? 'Анонимный Покупатель' : 'Anonim Müştəri')}
                        </span>
                        <span className="text-muted-foreground text-[11px] font-mono">
                          {rev.date || new Date(rev.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'az-AZ')}
                        </span>
                      </div>
                      <div className="flex items-center">{renderStars(rev.rating)}</div>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{rev.comment}</p>
                      
                      {/* Helpful / Unhelpful voting bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                        <span className="font-medium text-[10px]">
                          {locale === 'en' ? 'Was this review helpful?' : locale === 'ru' ? 'Был ли этот отзыв полезен?' : 'Bu rəy sizin üçün faydalı oldu?'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVoteHelpful(rev.id, 'up')}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              vote?.userVote === 'up'
                                ? 'bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400 shadow-sm'
                                : 'bg-background border-border hover:bg-muted text-muted-foreground'
                            }`}
                          >
                            <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                            <span>{locale === 'en' ? 'Helpful' : locale === 'ru' ? 'Полезно' : 'Faydalıdır'} ({vote?.up || 0})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleVoteHelpful(rev.id, 'down')}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              vote?.userVote === 'down'
                                ? 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400 shadow-sm'
                                : 'bg-background border-border hover:bg-muted text-muted-foreground'
                            }`}
                          >
                            <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                            <span>({vote?.down || 0})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Write a review form */}
            <div className="lg:col-span-5 bg-muted/20 border border-border p-6 rounded-2xl space-y-4">
              <h4 className="font-black text-sm text-foreground uppercase tracking-wider">
                {locale === 'en' ? 'Leave a Review' : locale === 'ru' ? 'Оставить Отзыв' : 'Rəy Bildirin'}
              </h4>
              
              {reviewSubmitted ? (
                <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-bold p-4 rounded-xl flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0" />
                  <span>{locale === 'en' ? 'Your review was successfully submitted! Thank you.' : locale === 'ru' ? 'Ваш отзыв успешно отправлен! Спасибо.' : 'Rəyiniz uğurla əlavə edildi! Paylaşımınız üçün təşəkkür edirik.'}</span>
                </div>
              ) : (
                <form onSubmit={handleAddReview} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                      {locale === 'en' ? 'Your Name' : locale === 'ru' ? 'Ваше Имя' : 'Adınız'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      placeholder={locale === 'en' ? 'e.g. John' : locale === 'ru' ? 'Например, Иван' : 'Məsələn, Məmməd'}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                      {locale === 'en' ? 'Rating' : locale === 'ru' ? 'Оценка' : 'Qiymətləndirmə'}
                    </label>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand"
                    >
                      <option value="5">{locale === 'en' ? '5 Stars - Amazing' : locale === 'ru' ? '5 Звезд - Отлично' : '5 Ulduz - Möhtəşəm'}</option>
                      <option value="4">{locale === 'en' ? '4 Stars - Very Good' : locale === 'ru' ? '4 Звезды - Хорошо' : '4 Ulduz - Çox yaxşı'}</option>
                      <option value="3">{locale === 'en' ? '3 Stars - Average' : locale === 'ru' ? '3 Звезды - Нормально' : '3 Ulduz - Orta'}</option>
                      <option value="2">{locale === 'en' ? '2 Stars - Poor' : locale === 'ru' ? '2 Звезды - Плохо' : '2 Ulduz - Qənaətbəxş deyil'}</option>
                      <option value="1">{locale === 'en' ? '1 Star - Terrible' : locale === 'ru' ? '1 Звезда - Ужасно' : '1 Ulduz - Zəif'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                      {locale === 'en' ? 'Your Review' : locale === 'ru' ? 'Ваш Отзыв' : 'Rəyiniz'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder={locale === 'en' ? 'Share your thoughts about the product...' : locale === 'ru' ? 'Поделитесь впечатлениями о товаре...' : 'Məhsul haqqında fikirlərinizi bölüşün...'}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rubik-brand text-white font-black text-xs rounded-xl hover:bg-rubik-brand-dark transition-colors cursor-pointer"
                  >
                    {locale === 'en' ? 'Submit Review' : locale === 'ru' ? 'Отправить Отзыв' : 'Rəyi Göndər'}
                  </button>
                </form>
              )}
            </div>

          </div>
        </section>

        {/* 5. Recommendations / Related products list */}
        <section className="space-y-6">
          <h3 className="text-xl md:text-2xl font-black text-foreground text-center md:text-left flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rubik-brand" />
            {locale === 'en' ? 'Similar & Recommended Products' : locale === 'ru' ? 'Похожие и Рекомендуемые Товары' : 'Oxşar və Tövsiyə Edilən Məhsullar'}
          </h3>

          {displayRelated.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {displayRelated.slice(0, 4).map((rel) => {
                const isPreorderRel = rel.stock_quantity <= 0 && (rel.allow_preorder !== undefined && rel.allow_preorder !== null ? Boolean(rel.allow_preorder) : true);
                const outOfStock = rel.stock_quantity <= 0 && !isPreorderRel;

                const basePrice = Number(rel.price_azn || 0);
                const rawOld = Number(rel.old_price || rel.compare_at_price_azn || rel.compare_at_price || rel.old_price_azn || 0);
                let oldPriceVal = 0;
                if (rawOld > basePrice) {
                  oldPriceVal = rawOld;
                } else if (rel.discount_percent && Number(rel.discount_percent) > 0 && basePrice > 0) {
                  oldPriceVal = Math.round((basePrice / (1 - Number(rel.discount_percent) / 100)) * 100) / 100;
                }
                const hasDiscount = oldPriceVal > basePrice;
                const discountPercent = hasDiscount
                  ? (rel.discount_percent && Number(rel.discount_percent) > 0
                      ? Math.round(Number(rel.discount_percent))
                      : Math.round(((oldPriceVal - basePrice) / oldPriceVal) * 100))
                  : 0;

                return (
                  <div
                    key={rel.id}
                    className="flex flex-col bg-card border border-border/80 rounded-2xl overflow-hidden shadow-soft-sm hover:shadow-soft-md hover:border-foreground/10 transition-all duration-300 group"
                  >
                    <Link href={`/${locale}/product/${rel.id}`} className="relative aspect-square w-full bg-muted/40 flex items-center justify-center p-4">
                      {rel.image_url ? (
                        <Image
                          src={sanitizeImageUrl(rel.image_url, rel.id)}
                          alt={rel.title}
                          fill
                          referrerPolicy="no-referrer"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-contain p-6 transform group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <SpeedcubeImageFallback alt={rel.title} />
                      )}

                      {hasDiscount && (
                        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-sm">
                          -{discountPercent}%
                        </div>
                      )}

                      {outOfStock ? (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-[10px] font-black tracking-wider px-2 py-0.5 bg-red-600 rounded-md">
                            {dict?.product?.out_of_stock || 'Bitib'}
                          </span>
                        </div>
                      ) : isPreorderRel ? (
                        <div className="absolute top-2 left-2 z-10 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shadow-sm">
                          Ön Sifariş
                        </div>
                      ) : null}
                    </Link>

                    <div className="p-4 flex flex-col flex-grow space-y-2">
                      <span className="text-[9px] uppercase font-bold text-rubik-brand tracking-wider">
                        {rel.brand}
                      </span>
                      <Link
                        href={`/${locale}/product/${rel.id}`}
                        className="text-xs md:text-sm font-bold text-foreground line-clamp-2 min-h-[2.5rem] hover:text-rubik-brand transition-colors"
                      >
                        {rel.title}
                      </Link>

                      <div className="flex items-baseline gap-2 mt-auto">
                        <span className="text-sm md:text-base font-black text-foreground">
                          {rel.price_azn.toFixed(2)} AZN
                        </span>
                        {hasDiscount && (
                          <span className="text-xs font-semibold text-muted-foreground line-through">
                            {oldPriceVal.toFixed(2)} AZN
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!outOfStock) {
                            addItem({
                              id: rel.id,
                              title: rel.title,
                              price_azn: rel.price_azn,
                              quantity: 1,
                              image_url: rel.image_url
                            });
                          }
                        }}
                        disabled={outOfStock}
                        className={`w-full py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          outOfStock
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-foreground text-card hover:bg-rubik-brand hover:text-white'
                        }`}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{outOfStock ? (dict?.product?.out_of_stock || 'Bitib') : isPreorderRel ? 'Ön Sifariş' : (dict?.product?.add_to_cart || 'Səbətə At')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border/80 rounded-2xl p-8 text-center space-y-3">
              <p className="text-xs font-bold text-muted-foreground">Tövsiyə olunan digər populyar sürət kubları yüklənir...</p>
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rubik-brand text-white text-xs font-black rounded-xl hover:bg-rubik-brand-dark transition-colors"
              >
                Kataloqa Keçin
              </Link>
            </div>
          )}
        </section>

      </div>

      {/* Video Modal Placeholder */}
      <AnimatePresence>
        {showVideoModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideoModal(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto z-50 max-w-xl h-fit max-h-[90vh] bg-card border border-border p-6 rounded-3xl shadow-soft-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-bold text-foreground text-sm md:text-base">{locale === 'en' ? 'Product Overview Video' : locale === 'ru' ? 'Видео Обзор Товара' : 'Məhsulun Baxış Videosu'}</h3>
                <button type="button" onClick={() => setShowVideoModal(false)} className="p-1 hover:bg-muted rounded-lg text-foreground cursor-pointer">X</button>
              </div>
              <div className="relative aspect-video w-full bg-slate-950 rounded-2xl flex flex-col items-center justify-center gap-3 overflow-hidden text-center p-4 border border-border/80">
                <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${product.image_url})` }} />
                <div className="p-4 bg-rubik-brand rounded-full text-white cursor-pointer relative z-10 animate-pulse">
                  <Play className="h-8 w-8 fill-white" />
                </div>
                <span className="text-white text-xs font-black relative z-10 uppercase tracking-widest">
                  Rubikshop {locale === 'en' ? 'Official Review Channel' : locale === 'ru' ? 'Официальный Канал Обзоров' : 'Rəsmi Baxış Kanalı'}
                </span>
                <p className="text-[10px] text-gray-300 max-w-xs relative z-10">
                  {locale === 'en' ? 'This video was tested and prepared by Azerbaijan\'s top speedcuber.' : locale === 'ru' ? 'Это видео протестировано и подготовлено ведущим спидкубером Азербайджана.' : 'Bu video Azərbaycanın ən məşhur sürətli kub idmançısı tərəfindən test edilərək hazırlanmışdır.'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 select-none"
            onClick={() => setShowImageModal(false)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer border border-white/20 shadow-xl"
              title={locale === 'en' ? 'Close' : locale === 'ru' ? 'Закрыть' : 'Bağla'}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Modal Content */}
            <div
              className="relative w-full max-w-5xl h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleGalleryTouchStart}
              onTouchEnd={handleGalleryTouchEnd}
            >
              {/* Left Arrow Button */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-2 sm:left-6 z-50 p-3 sm:p-4 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all duration-200 cursor-pointer border border-white/20 shadow-2xl backdrop-blur-md active:scale-90"
                  title={locale === 'en' ? 'Previous' : locale === 'ru' ? 'Предыдущая' : 'Əvvəlki'}
                >
                  <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
              )}

              {/* Main Image */}
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {!activeImage || imageError ? (
                  <SpeedcubeImageFallback alt={product.title} />
                ) : (
                  <Image
                    src={sanitizeImageUrl(activeImage, product.id)}
                    alt={product.title}
                    fill
                    unoptimized
                    priority
                    className="object-contain max-h-full max-w-full drop-shadow-2xl transition-all duration-300"
                  />
                )}
              </div>

              {/* Right Arrow Button */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-2 sm:left-auto sm:right-6 z-50 p-3 sm:p-4 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all duration-200 cursor-pointer border border-white/20 shadow-2xl backdrop-blur-md active:scale-90"
                  title={locale === 'en' ? 'Next' : locale === 'ru' ? 'Следующая' : 'Növbəti'}
                >
                  <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
              )}

              {/* Image Counter Badge */}
              {galleryImages.length > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-black/70 border border-white/20 text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-full backdrop-blur-md shadow-2xl tracking-widest">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Mini-Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-[58px] md:bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl p-3 sm:px-6"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-10 w-10 shrink-0 bg-muted rounded-xl overflow-hidden border border-border p-1">
                  {activeImage || product.image_url ? (
                    <Image
                      src={sanitizeImageUrl(activeImage || product.image_url, product.id)}
                      alt={product.title}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <SpeedcubeImageFallback alt="Mini image" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-foreground truncate max-w-[140px] sm:max-w-[300px]">
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-rubik-brand">
                      {finalPrice.toFixed(2)} AZN
                    </span>
                    {selectedVariant && (
                      <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                        • {selectedVariant.title_az || selectedVariant.name_az || selectedVariant.name || selectedVariant.sku}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={isTrulyOutOfStock}
                className={`py-2.5 px-4 font-extrabold text-xs sm:text-sm rounded-xl active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-soft-sm cursor-pointer shrink-0 ${
                  isPreorder
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-rubik-brand text-white hover:bg-rubik-brand-dark'
                }`}
              >
                {isPreorder ? (
                  <>
                    <Clock className="h-4 w-4" />
                    <span className="hidden xs:inline">{locale === 'en' ? 'Pre-order' : locale === 'ru' ? 'Предзаказ' : 'Ön sifariş et'}</span>
                    <span className="xs:hidden">{locale === 'en' ? 'Pre-order' : locale === 'ru' ? 'Предзаказ' : 'Ön sifariş et'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span className="hidden xs:inline">{locale === 'en' ? 'Add to Cart' : locale === 'ru' ? 'Добавить в корзину' : 'Səbətə Əlavə Et'}</span>
                    <span className="xs:hidden">{locale === 'en' ? 'Add' : locale === 'ru' ? 'Добавить' : 'Əlavə et'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
