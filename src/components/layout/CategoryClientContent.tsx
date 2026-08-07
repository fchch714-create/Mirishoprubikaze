'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal,
  ArrowUpDown,
  ChevronRight,
  Inbox,
  Home,
  ChevronDown,
  ChevronUp,
  X,
  Sliders,
  Check
} from 'lucide-react';
import type { ApplicationDictionary } from '@/types/application.types';
import { useCartStore } from '@/store/useCartStore';
import { ProductCard } from '@/components/ProductCard';

interface Product {
  id: string;
  title: string;
  price_azn: number;
  image_url: string;
  stock_quantity: number;
  category_slug?: string;
  brand?: string;
  brand_name?: string;
  product_type?: string;
  mechanics?: string;
  created_at?: string;
  slug?: string;
  product_variants?: any[];
  variants?: any[];
  specs?: Record<string, any>;
  specifications?: Record<string, any>;
  [key: string]: any;
}

interface CategoryClientContentProps {
  initialProducts: Product[];
  categoryItem: {
    id: string;
    slug: string;
    title: { az: string; en: string; ru: string };
    description: { az: string; en: string; ru: string };
  } | null;
  locale: string;
  dict: ApplicationDictionary;
}

const getBrandName = (p: any): string => {
  if (!p) return '';
  
  if (p.brands && typeof p.brands === 'object' && !Array.isArray(p.brands) && p.brands.name) {
    const bName = String(p.brands.name).trim();
    if (bName && !['OTHER', 'OTHER BRAND', 'UNKNOWN', 'DEFAULTS'].includes(bName.toUpperCase())) return bName;
  }
  if (Array.isArray(p.brands) && p.brands[0]?.name) {
    const bName = String(p.brands[0].name).trim();
    if (bName && !['OTHER', 'OTHER BRAND', 'UNKNOWN', 'DEFAULTS'].includes(bName.toUpperCase())) return bName;
  }
  if (typeof p.brand_name === 'string' && p.brand_name.trim()) {
    const bName = p.brand_name.trim();
    if (bName && !['OTHER', 'OTHER BRAND', 'UNKNOWN', 'DEFAULTS'].includes(bName.toUpperCase())) return bName;
  }
  if (p.brand && typeof p.brand === 'object' && p.brand.name) {
    const bName = String(p.brand.name).trim();
    if (bName && !['OTHER', 'OTHER BRAND', 'UNKNOWN', 'DEFAULTS'].includes(bName.toUpperCase())) return bName;
  }
  if (typeof p.brand === 'string' && p.brand.trim()) {
    const bName = p.brand.trim();
    if (bName && !['OTHER', 'OTHER BRAND', 'UNKNOWN', 'DEFAULTS'].includes(bName.toUpperCase())) return bName;
  }
  
  return '';
};

/**
 * Extracts normalized SpeedCubeShop attributes from product data, titles, specs & variants
 */
function extractProductAttributes(p: any) {
  const title = (p.title || p.name || p.title_az || p.name_az || '').toLowerCase();
  const desc = (p.description || p.description_az || '').toLowerCase();
  const specs = p.specs || p.specifications || {};
  const specsStr = JSON.stringify(specs).toLowerCase();

  // 1. Brand
  const brand = getBrandName(p) || (typeof p.brand === 'string' ? p.brand : 'QiYi');

  // 2. Product Type
  let productType = p.product_type || p.type || p.category_slug || '';
  if (!productType || productType === 'standard' || productType === 'puzzles') {
    if (title.includes('3x3') || title.includes('3×3')) productType = '3×3';
    else if (title.includes('2x2') || title.includes('2×2')) productType = '2×2';
    else if (title.includes('4x4') || title.includes('4×4')) productType = '4×4';
    else if (title.includes('5x5') || title.includes('5×5')) productType = '5×5';
    else if (title.includes('6x6') || title.includes('6×6')) productType = '6×6';
    else if (title.includes('7x7') || title.includes('7×7')) productType = '7×7';
    else if (title.includes('pyraminx')) productType = 'Pyraminx';
    else if (title.includes('megaminx')) productType = 'Megaminx';
    else if (title.includes('skewb')) productType = 'Skewb';
    else if (title.includes('square-1') || title.includes('sq-1')) productType = 'Square-1';
    else if (title.includes('clock')) productType = 'Clock';
    else if (title.includes('bulk set') || title.includes('bulk')) productType = 'Bulk Set';
    else if (title.includes('bundle') || title.includes('set')) productType = 'Cube Bundle';
    else if (title.includes('shape mod') || title.includes('mod')) productType = 'Shape Mod';
    else if (title.includes('string')) productType = 'String Cube';
    else productType = '3×3';
  } else if (productType === '3x3' || productType === '3x3-kub' || productType === '3x3-kublar') {
    productType = '3×3';
  } else if (productType === '2x2' || productType === '2x2-kub') {
    productType = '2×2';
  } else if (productType === '4x4' || productType === '4x4-kub') {
    productType = '4×4';
  } else if (productType === '5x5' || productType === '5x5-kub') {
    productType = '5×5';
  }

  // 3. Magnets
  let magnets = p.magnets || p.magnet_strength || specs['Magnets'] || specs['Maqnit'] || '';
  if (!magnets) {
    if (title.includes('adjustable') || title.includes('tənzimlənən')) magnets = 'Adjustable';
    else if (title.includes('strong') || title.includes('güclü maqnit')) magnets = 'Strong';
    else if (title.includes('magnetic') || title.includes('maqnit') || title.includes(' m ') || title.endsWith(' m') || p.is_magnetic) magnets = 'Moderate';
    else magnets = 'Moderate';
  }

  // 4. MagLev (Boolean)
  const isMagLev = Boolean(
    p.has_maglev || 
    p.maglev || 
    title.includes('maglev') || 
    specsStr.includes('maglev')
  );

  // 5. Core Magnets (Boolean)
  const isCoreMagnets = Boolean(
    p.has_core_magnets || 
    p.core_magnets || 
    title.includes('core magnet') || 
    title.includes('corner-core') || 
    title.includes('magnetic core') ||
    title.includes('nüvə maqnit') ||
    specsStr.includes('core magnet') ||
    specsStr.includes('magnetic core')
  );

  // 6. Ball-Core (Boolean)
  const isBallCore = Boolean(
    p.has_ball_core || 
    p.ball_core || 
    title.includes('ball-core') || 
    title.includes('ball core') || 
    title.includes('ballcore') ||
    specsStr.includes('ball-core') ||
    specsStr.includes('ball core')
  );

  // 7. Exterior Finish
  let exteriorFinish = p.exterior_finish || specs['Exterior Finish'] || specs['Xarici görünüş'] || '';
  if (!exteriorFinish) {
    if (title.includes('uv') || specsStr.includes('uv coated') || specsStr.includes('uv coating')) exteriorFinish = 'UV Coated';
    else if (title.includes('glossy') || specsStr.includes('glossy')) exteriorFinish = 'Glossy';
    else if (title.includes('frosted') || title.includes('matte') || specsStr.includes('frosted')) exteriorFinish = 'Frosted';
    else exteriorFinish = 'Frosted';
  }

  // 8. Plastic Color
  let plasticColor = p.plastic_color || p.color || specs['Plastic color'] || specs['Plastik rəngi'] || '';
  if (!plasticColor) {
    if (title.includes('stickerless (jelly)')) plasticColor = 'Stickerless (Jelly)';
    else if (title.includes('stickerless (pastel)')) plasticColor = 'Stickerless (Pastel)';
    else if (title.includes('stickerless (pink)')) plasticColor = 'Stickerless (Pink)';
    else if (title.includes('stickerless') || desc.includes('stickerless')) plasticColor = 'Stickerless';
    else if (title.includes('black') || title.includes('qara')) plasticColor = 'Black';
    else if (title.includes('white') || title.includes('ağ')) plasticColor = 'White';
    else if (title.includes('transparent green')) plasticColor = 'Transparent Green';
    else if (title.includes('transparent pink')) plasticColor = 'Transparent Pink';
    else if (title.includes('transparent')) plasticColor = 'Transparent';
    else if (title.includes('luminous green')) plasticColor = 'Luminous Green';
    else if (title.includes('luminous blue')) plasticColor = 'Luminous Blue';
    else if (title.includes('luminous orange')) plasticColor = 'Luminous Orange';
    else if (title.includes('blue')) plasticColor = 'Blue';
    else if (title.includes('gold')) plasticColor = 'Gold';
    else if (title.includes('gray') || title.includes('grey')) plasticColor = 'Gray';
    else if (title.includes('green')) plasticColor = 'Green';
    else if (title.includes('orange')) plasticColor = 'Orange';
    else if (title.includes('pink')) plasticColor = 'Pink';
    else if (title.includes('purple')) plasticColor = 'Purple';
    else if (title.includes('red')) plasticColor = 'Red';
    else if (title.includes('teal')) plasticColor = 'Teal';
    else if (title.includes('yellow')) plasticColor = 'Yellow';
    else plasticColor = 'Stickerless';
  }

  // 9. Internal Plastic Color
  let internalPlasticColor = p.internal_plastic_color || specs['Internal Plastic Color'] || specs['Daxili plastik'] || '';
  if (!internalPlasticColor) {
    if (title.includes('black internals') || title.includes('black internal')) internalPlasticColor = 'Black Internals';
    else if (title.includes('primary internals') || title.includes('primary internal')) internalPlasticColor = 'Primary Internals';
    else if (title.includes('transparent internals') || title.includes('transparent internal')) internalPlasticColor = 'Transparent Internals';
    else if (title.includes('transparent')) internalPlasticColor = 'Transparent';
    else internalPlasticColor = 'Primary Internals';
  }

  return {
    brand,
    productType,
    magnets,
    isMagLev,
    isCoreMagnets,
    isBallCore,
    exteriorFinish,
    plasticColor,
    internalPlasticColor
  };
}

export function CategoryClientContent(props: CategoryClientContentProps) {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CategoryClientContentInner {...props} />
    </React.Suspense>
  );
}

function CategoryClientContentInner({
  initialProducts,
  categoryItem,
  locale,
  dict
}: CategoryClientContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Flatten products and variants + calculate attributes
  const baseProducts = React.useMemo(() => {
    if (!initialProducts || !Array.isArray(initialProducts)) return [];

    const flattened: any[] = [];

    initialProducts.forEach((p) => {
      const pTitle = p.title || (p as any).name || '';
      const resolvedBrand = getBrandName(p) || (p as any).brand || '';
      const pVariants = (p as any).product_variants || (p as any).variants || [];
      const parentSlug = p.slug || p.id;

      if (Array.isArray(pVariants) && pVariants.length > 1) {
        pVariants.forEach((v: any, index: number) => {
          const variantName = v.name || v.title_az || v.title || v.name_az || `Variant ${index + 1}`;
          const fullTitle = variantName.toLowerCase().includes(pTitle.toLowerCase())
            ? variantName
            : `${pTitle} (${variantName})`;

          const vPrice = v.price !== undefined && v.price !== null && v.price !== ''
            ? Number(v.price)
            : (v.price_azn !== undefined ? Number(v.price_azn) : Number(p.price_azn || 0));

          const vComparePrice = v.compare_at_price_azn || v.discount_price || v.original_price || (p as any).compare_at_price_azn || (p as any).compare_at_price;

          const vStock = v.stock !== undefined && v.stock !== null
            ? Number(v.stock)
            : (v.stock_quantity !== undefined ? Number(v.stock_quantity) : Number(p.stock_quantity || 0));

          const vImage = v.image_url || v.image || (Array.isArray(v.images) ? v.images[0] : null) || p.image_url;
          const vSku = v.sku || `${(p as any).sku || 'SKU'}-${index + 1}`;

          const variantSlugParam = v.sku ? v.sku : (v.id || index);
          const cardSlug = `${parentSlug}?variant=${encodeURIComponent(variantSlugParam)}`;

          const itemObj = {
            ...p,
            id: `${p.id}__var_${v.id || v.sku || index}`,
            original_product_id: p.id,
            variant_id: v.id,
            title: fullTitle,
            name: fullTitle,
            price_azn: vPrice,
            price: vPrice,
            compare_at_price_azn: vComparePrice ? Number(vComparePrice) : undefined,
            old_price: vComparePrice ? Number(vComparePrice) : undefined,
            image_url: vImage,
            stock_quantity: vStock,
            sku: vSku,
            variant_sku: vSku,
            slug: cardSlug,
            is_variant_card: true,
            variant_name: variantName,
            brand: resolvedBrand,
          };

          const attrs = extractProductAttributes(itemObj);
          flattened.push({ ...itemObj, attrs });
        });
      } else {
        const itemObj = {
          ...p,
          category_slug: p.category_slug || null,
          brand: resolvedBrand,
        };
        const attrs = extractProductAttributes(itemObj);
        flattened.push({ ...itemObj, attrs });
      }
    });

    if (categoryItem) {
      const targetSlug = categoryItem.slug.toLowerCase();
      const targetId = categoryItem.id.toLowerCase();

      return flattened.filter(p => {
        if (!p.category_slug) return true;
        const pCat = p.category_slug.toLowerCase();
        return (
          pCat === targetSlug ||
          pCat === targetId ||
          (targetSlug === '3x3' && (pCat === '3x3-kub' || pCat === '3x3-kublar')) ||
          (targetSlug === '2x2' && (pCat === '2x2-kub' || pCat === '2x2-kublar')) ||
          (targetSlug === '4x4' && (pCat === '4x4-kub' || pCat === '4x4-kublar')) ||
          (targetSlug === '5x5' && (pCat === '5x5-kub' || pCat === '5x5-kublar'))
        );
      });
    }

    return flattened;
  }, [initialProducts, categoryItem]);

  // Read initial filter values from SearchParams for persistence
  const initialMinPrice = Number(searchParams.get('min_price')) || 0;
  const initialMaxPrice = Number(searchParams.get('max_price')) || 300;
  const initialSort = searchParams.get('sort') || 'newest';
  const initialProductTypes = searchParams.get('product_types') ? searchParams.get('product_types')!.split(',') : [];
  const initialBrands = searchParams.get('brands') ? searchParams.get('brands')!.split(',') : [];
  const initialMagnets = searchParams.get('magnets') ? searchParams.get('magnets')!.split(',') : [];
  const initialMagLev = searchParams.get('maglev') === 'true';
  const initialCoreMagnets = searchParams.get('core_magnets') === 'true';
  const initialBallCore = searchParams.get('ball_core') === 'true';
  const initialFinishes = searchParams.get('finishes') ? searchParams.get('finishes')!.split(',') : [];
  const initialColors = searchParams.get('colors') ? searchParams.get('colors')!.split(',') : [];
  const initialInternalColors = searchParams.get('internal_colors') ? searchParams.get('internal_colors')!.split(',') : [];

  // Filter States
  const [minPrice, setMinPrice] = React.useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = React.useState(initialMaxPrice);
  const [selectedProductTypes, setSelectedProductTypes] = React.useState<string[]>(initialProductTypes);
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>(initialBrands);
  const [selectedMagnets, setSelectedMagnets] = React.useState<string[]>(initialMagnets);
  const [isMagLevOnly, setIsMagLevOnly] = React.useState<boolean>(initialMagLev);
  const [isCoreMagnetsOnly, setIsCoreMagnetsOnly] = React.useState<boolean>(initialCoreMagnets);
  const [isBallCoreOnly, setIsBallCoreOnly] = React.useState<boolean>(initialBallCore);
  const [selectedFinishes, setSelectedFinishes] = React.useState<string[]>(initialFinishes);
  const [selectedColors, setSelectedColors] = React.useState<string[]>(initialColors);
  const [selectedInternalColors, setSelectedInternalColors] = React.useState<string[]>(initialInternalColors);

  const [sortOption, setSortOption] = React.useState(initialSort);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = React.useState(false);

  // Accordion open states for filter sections
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    productType: true,
    brand: true,
    magnets: true,
    toggles: true,
    finish: true,
    plasticColor: true,
    internalColor: true,
    price: true,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Compute available filter options with dynamic item counts (N)
  const filterOptions = React.useMemo(() => {
    const productTypeMap = new Map<string, number>();
    const brandMap = new Map<string, number>();
    const magnetMap = new Map<string, number>();
    const finishMap = new Map<string, number>();
    const colorMap = new Map<string, number>();
    const internalColorMap = new Map<string, number>();

    baseProducts.forEach((p) => {
      const attrs = p.attrs;
      if (!attrs) return;

      // Product Type
      if (attrs.productType) {
        productTypeMap.set(attrs.productType, (productTypeMap.get(attrs.productType) || 0) + 1);
      }
      // Brand
      if (attrs.brand && !['OTHER', 'UNKNOWN'].includes(attrs.brand.toUpperCase())) {
        brandMap.set(attrs.brand, (brandMap.get(attrs.brand) || 0) + 1);
      }
      // Magnets
      if (attrs.magnetStrength) {
        magnetMap.set(attrs.magnetStrength, (magnetMap.get(attrs.magnetStrength) || 0) + 1);
      }
      // Finish
      if (attrs.exteriorFinish) {
        finishMap.set(attrs.exteriorFinish, (finishMap.get(attrs.exteriorFinish) || 0) + 1);
      }
      // Color
      if (attrs.plasticColor) {
        colorMap.set(attrs.plasticColor, (colorMap.get(attrs.plasticColor) || 0) + 1);
      }
      // Internal Color
      if (attrs.internalColor) {
        internalColorMap.set(attrs.internalColor, (internalColorMap.get(attrs.internalColor) || 0) + 1);
      }
    });

    const sortMapByCount = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      productTypes: sortMapByCount(productTypeMap),
      brands: sortMapByCount(brandMap),
      magnets: sortMapByCount(magnetMap),
      finishes: sortMapByCount(finishMap),
      colors: sortMapByCount(colorMap),
      internalColors: sortMapByCount(internalColorMap),
    };
  }, [baseProducts]);

  // Sync state changes with URL Search Params
  const updateUrlParams = React.useCallback(() => {
    const params = new URLSearchParams();
    if (minPrice > 0) params.set('min_price', minPrice.toString());
    if (maxPrice < 300) params.set('max_price', maxPrice.toString());
    if (selectedProductTypes.length > 0) params.set('product_types', selectedProductTypes.join(','));
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (selectedMagnets.length > 0) params.set('magnets', selectedMagnets.join(','));
    if (isMagLevOnly) params.set('maglev', 'true');
    if (isCoreMagnetsOnly) params.set('core_magnets', 'true');
    if (isBallCoreOnly) params.set('ball_core', 'true');
    if (selectedFinishes.length > 0) params.set('finishes', selectedFinishes.join(','));
    if (selectedColors.length > 0) params.set('colors', selectedColors.join(','));
    if (selectedInternalColors.length > 0) params.set('internal_colors', selectedInternalColors.join(','));
    if (sortOption !== 'newest') params.set('sort', sortOption);

    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  }, [
    minPrice, maxPrice, selectedProductTypes, selectedBrands, selectedMagnets,
    isMagLevOnly, isCoreMagnetsOnly, isBallCoreOnly, selectedFinishes,
    selectedColors, selectedInternalColors, sortOption, pathname
  ]);

  React.useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Handlers for checkboxes
  const toggleArrayItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setArr(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const clearAllFilters = () => {
    setMinPrice(0);
    setMaxPrice(300);
    setSelectedProductTypes([]);
    setSelectedBrands([]);
    setSelectedMagnets([]);
    setIsMagLevOnly(false);
    setIsCoreMagnetsOnly(false);
    setIsBallCoreOnly(false);
    setSelectedFinishes([]);
    setSelectedColors([]);
    setSelectedInternalColors([]);
  };

  const hasActiveFilters = 
    selectedProductTypes.length > 0 ||
    selectedBrands.length > 0 ||
    selectedMagnets.length > 0 ||
    isMagLevOnly ||
    isCoreMagnetsOnly ||
    isBallCoreOnly ||
    selectedFinishes.length > 0 ||
    selectedColors.length > 0 ||
    selectedInternalColors.length > 0 ||
    minPrice > 0 ||
    maxPrice < 300;

  // Filter & Sort Execution Logic
  const filteredProducts = React.useMemo(() => {
    let result = [...baseProducts];

    // Filter by Price
    result = result.filter(p => {
      const price = p.price_azn || 0;
      return price >= minPrice && price <= maxPrice;
    });

    // Filter by Product Types
    if (selectedProductTypes.length > 0) {
      result = result.filter(p => p.attrs && selectedProductTypes.includes(p.attrs.productType));
    }

    // Filter by Brands
    if (selectedBrands.length > 0) {
      result = result.filter(p => p.attrs && selectedBrands.includes(p.attrs.brand));
    }

    // Filter by Magnets
    if (selectedMagnets.length > 0) {
      result = result.filter(p => p.attrs && selectedMagnets.includes(p.attrs.magnetStrength));
    }

    // Filter by MagLev
    if (isMagLevOnly) {
      result = result.filter(p => p.attrs?.isMagLev);
    }

    // Filter by Core Magnets
    if (isCoreMagnetsOnly) {
      result = result.filter(p => p.attrs?.isCoreMagnets);
    }

    // Filter by Ball-Core
    if (isBallCoreOnly) {
      result = result.filter(p => p.attrs?.isBallCore);
    }

    // Filter by Exterior Finish
    if (selectedFinishes.length > 0) {
      result = result.filter(p => p.attrs && selectedFinishes.includes(p.attrs.exteriorFinish));
    }

    // Filter by Plastic Color
    if (selectedColors.length > 0) {
      result = result.filter(p => p.attrs && selectedColors.includes(p.attrs.plasticColor));
    }

    // Filter by Internal Plastic Color
    if (selectedInternalColors.length > 0) {
      result = result.filter(p => p.attrs && selectedInternalColors.includes(p.attrs.internalColor));
    }

    // Sorting Logic
    if (sortOption === 'price_asc') {
      result.sort((a, b) => (a.price_azn || 0) - (b.price_azn || 0));
    } else if (sortOption === 'price_desc') {
      result.sort((a, b) => (b.price_azn || 0) - (a.price_azn || 0));
    } else if (sortOption === 'stock_high') {
      result.sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0));
    } else {
      // Newest default
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return result;
  }, [
    baseProducts, minPrice, maxPrice, selectedProductTypes, selectedBrands,
    selectedMagnets, isMagLevOnly, isCoreMagnetsOnly, isBallCoreOnly,
    selectedFinishes, selectedColors, selectedInternalColors, sortOption
  ]);

  const categoryTitle = categoryItem
    ? (categoryItem.title as any)[locale] || categoryItem.title.az
    : (dict.navigation?.catalog || "Kublar və Tapmacalar");

  const categoryDesc = categoryItem
    ? (categoryItem.description as any)[locale] || categoryItem.description.az
    : locale === 'en'
    ? "Professional Speedcube collection for the fastest solves, featuring adjustable magnets and MagLev flagship puzzles."
    : locale === 'ru'
    ? "Коллекция профессиональных спидкубов для самых быстрых решений, с регулируемыми магнитами и флагманскими головоломками MagLev."
    : "Ən sürətli həllər üçün peşəkar Speedcube kolleksiyası, tənzimlənən maqnitlər və MagLev texnologiyalı flaqman tapmacalar.";

  /** Reusable Filter Panel Content (Desktop & Mobile Drawer) */
  const renderFilterSections = (isMobile = false) => (
    <div className="space-y-5">
      {/* 1. Product type */}
      {filterOptions.productTypes.length > 0 && (
        <div className="border-b border-border pb-4">
          <button
            type="button"
            onClick={() => toggleSection('productType')}
            className="w-full flex items-center justify-between text-sm font-bold text-foreground py-1 text-left cursor-pointer group"
          >
            <span>{locale === 'en' ? 'Product type' : locale === 'ru' ? 'Тип товара' : 'Məhsul növü'}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.productType ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSections.productType && (
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {filterOptions.productTypes.map(({ name, count }) => (
                <label key={name} className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer group hover:text-rubik-brand">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                      selectedProductTypes.includes(name)
                        ? 'bg-rubik-brand border-rubik-brand text-white'
                        : 'border-gray-300 dark:border-gray-700 bg-muted/40 group-hover:border-rubik-brand'
                    }`}>
                      {selectedProductTypes.includes(name) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedProductTypes.includes(name)}
                      onChange={() => toggleArrayItem(selectedProductTypes, setSelectedProductTypes, name)}
                      className="sr-only"
                    />
                    <span>{name}</span>
                  </div>
                  <span className="text-muted-foreground text-[11px] font-mono">({count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Brand */}
      {filterOptions.brands.length > 0 && (
        <div className="border-b border-border pb-4">
          <button
            type="button"
            onClick={() => toggleSection('brand')}
            className="w-full flex items-center justify-between text-sm font-bold text-foreground py-1 text-left cursor-pointer group"
          >
            <span>{locale === 'en' ? 'Brand' : locale === 'ru' ? 'Бренд' : 'Brend'}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.brand ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSections.brand && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
              {filterOptions.brands.map(({ name, count }) => (
                <label key={name} className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer group hover:text-rubik-brand">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                      selectedBrands.includes(name)
                        ? 'bg-rubik-brand border-rubik-brand text-white'
                        : 'border-gray-300 dark:border-gray-700 bg-muted/40 group-hover:border-rubik-brand'
                    }`}>
                      {selectedBrands.includes(name) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(name)}
                      onChange={() => toggleArrayItem(selectedBrands, setSelectedBrands, name)}
                      className="sr-only"
                    />
                    <span>{name}</span>
                  </div>
                  <span className="text-muted-foreground text-[11px] font-mono">({count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Magnets */}
      {filterOptions.magnets.length > 0 && (
        <div className="border-b border-border pb-4">
          <button
            type="button"
            onClick={() => toggleSection('magnets')}
            className="w-full flex items-center justify-between text-sm font-bold text-foreground py-1 text-left cursor-pointer group"
          >
            <span>{locale === 'en' ? 'Magnets' : locale === 'ru' ? 'Магниты' : 'Maqnitlər'}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.magnets ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSections.magnets && (
            <div className="mt-3 space-y-2">
              {filterOptions.magnets.map(({ name, count }) => (
                <label key={name} className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer group hover:text-rubik-brand">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                      selectedMagnets.includes(name)
                        ? 'bg-rubik-brand border-rubik-brand text-white'
                        : 'border-gray-300 dark:border-gray-700 bg-muted/40 group-hover:border-rubik-brand'
                    }`}>
                      {selectedMagnets.includes(name) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMagnets.includes(name)}
                      onChange={() => toggleArrayItem(selectedMagnets, setSelectedMagnets, name)}
                      className="sr-only"
                    />
                    <span>{name}</span>
                  </div>
                  <span className="text-muted-foreground text-[11px] font-mono">({count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Speedcube Technology Toggles (MagLev, Core Magnets, Ball-Core) */}
      <div className="border-b border-border pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">MagLev</span>
          <button
            type="button"
            onClick={() => setIsMagLevOnly(!isMagLevOnly)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
              isMagLevOnly ? 'bg-rubik-brand' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              isMagLevOnly ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Core Magnets</span>
          <button
            type="button"
            onClick={() => setIsCoreMagnetsOnly(!isCoreMagnetsOnly)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
              isCoreMagnetsOnly ? 'bg-rubik-brand' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              isCoreMagnetsOnly ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Ball-Core</span>
          <button
            type="button"
            onClick={() => setIsBallCoreOnly(!isBallCoreOnly)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
              isBallCoreOnly ? 'bg-rubik-brand' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              isBallCoreOnly ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* 5. Exterior Finish */}
      {filterOptions.finishes.length > 0 && (
        <div className="border-b border-border pb-4">
          <button
            type="button"
            onClick={() => toggleSection('finish')}
            className="w-full flex items-center justify-between text-sm font-bold text-foreground py-1 text-left cursor-pointer group"
          >
            <span>{locale === 'en' ? 'Exterior Finish' : locale === 'ru' ? 'Внешнее покрытие' : 'Xarici görünüş'}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.finish ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSections.finish && (
            <div className="mt-3 space-y-2">
              {filterOptions.finishes.map(({ name, count }) => (
                <label key={name} className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer group hover:text-rubik-brand">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                      selectedFinishes.includes(name)
                        ? 'bg-rubik-brand border-rubik-brand text-white'
                        : 'border-gray-300 dark:border-gray-700 bg-muted/40 group-hover:border-rubik-brand'
                    }`}>
                      {selectedFinishes.includes(name) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedFinishes.includes(name)}
                      onChange={() => toggleArrayItem(selectedFinishes, setSelectedFinishes, name)}
                      className="sr-only"
                    />
                    <span>{name}</span>
                  </div>
                  <span className="text-muted-foreground text-[11px] font-mono">({count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Plastic color */}
      {filterOptions.colors.length > 0 && (
        <div className="border-b border-border pb-4">
          <button
            type="button"
            onClick={() => toggleSection('plasticColor')}
            className="w-full flex items-center justify-between text-sm font-bold text-foreground py-1 text-left cursor-pointer group"
          >
            <span>{locale === 'en' ? 'Plastic color' : locale === 'ru' ? 'Цвет пластика' : 'Plastik rəngi'}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.plasticColor ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSections.plasticColor && (
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {filterOptions.colors.map(({ name, count }) => (
                <label key={name} className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer group hover:text-rubik-brand">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                      selectedColors.includes(name)
                        ? 'bg-rubik-brand border-rubik-brand text-white'
                        : 'border-gray-300 dark:border-gray-700 bg-muted/40 group-hover:border-rubik-brand'
                    }`}>
                      {selectedColors.includes(name) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(name)}
                      onChange={() => toggleArrayItem(selectedColors, setSelectedColors, name)}
                      className="sr-only"
                    />
                    <span>{name}</span>
                  </div>
                  <span className="text-muted-foreground text-[11px] font-mono">({count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Internal Plastic Color */}
      {filterOptions.internalColors.length > 0 && (
        <div className="border-b border-border pb-4">
          <button
            type="button"
            onClick={() => toggleSection('internalColor')}
            className="w-full flex items-center justify-between text-sm font-bold text-foreground py-1 text-left cursor-pointer group"
          >
            <span>{locale === 'en' ? 'Internal Plastic Color' : locale === 'ru' ? 'Цвет внутреннего пластика' : 'Daxili plastik rəngi'}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.internalColor ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSections.internalColor && (
            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
              {filterOptions.internalColors.map(({ name, count }) => (
                <label key={name} className="flex items-center justify-between text-xs font-medium text-foreground cursor-pointer group hover:text-rubik-brand">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                      selectedInternalColors.includes(name)
                        ? 'bg-rubik-brand border-rubik-brand text-white'
                        : 'border-gray-300 dark:border-gray-700 bg-muted/40 group-hover:border-rubik-brand'
                    }`}>
                      {selectedInternalColors.includes(name) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedInternalColors.includes(name)}
                      onChange={() => toggleArrayItem(selectedInternalColors, setSelectedInternalColors, name)}
                      className="sr-only"
                    />
                    <span>{name}</span>
                  </div>
                  <span className="text-muted-foreground text-[11px] font-mono">({count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. Price Range Slider */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-sm font-bold text-foreground py-1 text-left cursor-pointer group"
        >
          <span>{locale === 'en' ? 'Price Range' : locale === 'ru' ? 'Диапазон цен' : 'Qiymət aralığı'}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.price ? 'rotate-180' : ''}`} />
        </button>

        {expandedSections.price && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>{minPrice} AZN</span>
              <span>{maxPrice} AZN</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-rubik-brand cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-background pb-20">
      {/* Dynamic Breadcrumbs */}
      <div className="bg-muted/40 py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-rubik-brand flex items-center gap-1">
            <Home className="h-3 w-3" />
            <span>{dict.navigation?.home || "Ana Səhifə"}</span>
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">{categoryTitle}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 space-y-8">
        {/* Page Header Title */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <span className="bg-rubik-brand w-2.5 h-10 rounded-md block shrink-0" />
            <span>{categoryTitle}</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            {categoryDesc}
          </p>
        </div>

        {/* Catalog Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* A. Sticky Filter Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 bg-card border border-border rounded-2xl p-6 shadow-soft-sm space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Sliders className="h-4 w-4 text-rubik-brand" />
                <span>{locale === 'en' ? 'Filters' : locale === 'ru' ? 'Фильтры' : 'Filtrlər'}</span>
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                >
                  {locale === 'en' ? 'Clear' : locale === 'ru' ? 'Очистить' : 'Təmizlə'}
                </button>
              )}
            </div>

            {renderFilterSections(false)}
          </aside>

          {/* B. Catalog Results and Grid */}
          <main className="col-span-1 lg:col-span-9 space-y-6">
            {/* Control Bar: Sort and Mobile triggers */}
            <div className="bg-card border border-border p-4 rounded-xl shadow-soft-sm flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-bold text-muted-foreground">
                <span className="text-foreground font-black">{filteredProducts.length}</span> {locale === 'en' ? 'products found' : locale === 'ru' ? 'товаров найдено' : 'məhsul tapıldı'}
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                {/* Mobile Filter Trigger Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 bg-muted hover:bg-muted-dark border border-border rounded-xl text-sm font-semibold text-foreground cursor-pointer"
                >
                  <SlidersHorizontal className="h-4 w-4 text-rubik-brand" />
                  <span>{locale === 'en' ? 'Filters' : locale === 'ru' ? 'Фильтры' : 'Filtrlər'}</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-rubik-brand" />
                  )}
                </button>

                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
                  {/* Desktop Select */}
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="hidden lg:block bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand font-semibold cursor-pointer"
                  >
                    <option value="newest">{locale === 'en' ? 'Newest' : locale === 'ru' ? 'Сначала новые' : 'Ən Yenilər'}</option>
                    <option value="price_asc">{locale === 'en' ? 'Price: Low to High' : locale === 'ru' ? 'Цена: по возрастанию' : 'Qiymət: Ucuzdan bahaya'}</option>
                    <option value="price_desc">{locale === 'en' ? 'Price: High to Low' : locale === 'ru' ? 'Цена: по убыванию' : 'Qiymət: Bahadan ucuza'}</option>
                    <option value="stock_high">{locale === 'en' ? 'Best Selling' : locale === 'ru' ? 'Популярные' : 'Anbarda olanlar'}</option>
                  </select>

                  {/* Mobile Sort Trigger */}
                  <button
                    onClick={() => setIsMobileSortOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 bg-muted hover:bg-muted-dark border border-border rounded-xl text-sm font-semibold text-foreground cursor-pointer"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span>{locale === 'en' ? 'Sorting' : locale === 'ru' ? 'Сортировка' : 'Sıralama'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-muted-foreground font-semibold">{locale === 'en' ? 'Active filters:' : locale === 'ru' ? 'Активные фильтры:' : 'Aktiv filtrlər:'}</span>
                {selectedProductTypes.map(pt => (
                  <span key={pt} className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    {pt}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleArrayItem(selectedProductTypes, setSelectedProductTypes, pt)} />
                  </span>
                ))}
                {selectedBrands.map(b => (
                  <span key={b} className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    {b}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleArrayItem(selectedBrands, setSelectedBrands, b)} />
                  </span>
                ))}
                {selectedMagnets.map(m => (
                  <span key={m} className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    {m}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleArrayItem(selectedMagnets, setSelectedMagnets, m)} />
                  </span>
                ))}
                {isMagLevOnly && (
                  <span className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    MagLev
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setIsMagLevOnly(false)} />
                  </span>
                )}
                {isCoreMagnetsOnly && (
                  <span className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    Core Magnets
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setIsCoreMagnetsOnly(false)} />
                  </span>
                )}
                {isBallCoreOnly && (
                  <span className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    Ball-Core
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setIsBallCoreOnly(false)} />
                  </span>
                )}
                {selectedFinishes.map(f => (
                  <span key={f} className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    {f}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleArrayItem(selectedFinishes, setSelectedFinishes, f)} />
                  </span>
                ))}
                {selectedColors.map(c => (
                  <span key={c} className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    {c}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleArrayItem(selectedColors, setSelectedColors, c)} />
                  </span>
                ))}
                {selectedInternalColors.map(ic => (
                  <span key={ic} className="px-2.5 py-1 bg-rubik-brand/10 text-rubik-brand font-bold rounded-lg flex items-center gap-1">
                    {ic}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleArrayItem(selectedInternalColors, setSelectedInternalColors, ic)} />
                  </span>
                ))}

                <button
                  onClick={clearAllFilters}
                  className="text-red-500 font-bold underline ml-1 cursor-pointer hover:text-red-600"
                >
                  {locale === 'en' ? 'Reset all' : locale === 'ru' ? 'Сбросить все' : 'Hamısını sıfırla'}
                </button>
              </div>
            )}

            {/* Grid display with empty state logic */}
            {filteredProducts.length === 0 ? (
              <div className="bg-card border border-border rounded-3xl p-16 text-center space-y-6 shadow-soft-sm flex flex-col items-center justify-center">
                <div className="p-4 bg-muted rounded-full text-muted-foreground shrink-0 animate-bounce">
                  <Inbox className="h-10 w-10 text-rubik-brand" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {locale === 'en' ? 'No products match your search' : locale === 'ru' ? 'Товары не найдены' : 'Axtarışa uyğun məhsul tapılmadı'}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mx-auto">
                    {locale === 'en'
                      ? 'No products match your selected filters. Please reset filters and try again.'
                      : locale === 'ru'
                      ? 'По выбранным фильтрам товары не найдены. Пожалуйста, сбросьте фильтры и попробуйте снова.'
                      : 'Seçdiyiniz filtrlər üzrə anbarda heç bir məhsul yoxdur. Zəhmət olmasa filtrləri sıfırlayıb yenidən sınayın.'}
                  </p>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-rubik-brand text-white font-bold rounded-xl text-sm hover:bg-rubik-brand-dark transition-all cursor-pointer shadow-md"
                >
                  {locale === 'en' ? 'Reset Filters' : locale === 'ru' ? 'Сбросить Фильтры' : 'Filtrləri Sıfırla'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} dict={dict} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Slide-up Mobile Filter Drawer (Exact SpeedCubeShop style bottom sheet with "View results" orange/red button) */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              key="backdrop-filter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[100000] lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-[100001] w-full max-h-[85dvh] bg-white text-[#17181C] rounded-t-3xl border-t border-[#E5E7EB] shadow-2xl flex flex-col lg:hidden overscroll-contain"
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 shrink-0" />
              
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 shrink-0 bg-white rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-[#D8232A]" />
                  <h3 className="font-bold text-lg text-[#17181C]">{locale === 'en' ? 'Filters' : locale === 'ru' ? 'Фильтры' : 'Filtrlər'}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-[#D8232A] font-bold hover:underline cursor-pointer"
                    >
                      {locale === 'en' ? 'Clear' : locale === 'ru' ? 'Очистить' : 'Təmizlə'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Filters Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">
                {renderFilterSections(true)}
              </div>

              {/* SpeedCubeShop "View results" Sticky CTA Button */}
              <div className="p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-[#E5E7EB] bg-white shrink-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3.5 bg-[#FF5B00] hover:bg-[#E05000] text-white font-extrabold rounded-xl text-base transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {locale === 'en'
                    ? `View results (${filteredProducts.length})`
                    : locale === 'ru'
                    ? `Показать результаты (${filteredProducts.length})`
                    : `Nəticələri göstər (${filteredProducts.length})`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sort Sheet */}
      <AnimatePresence>
        {isMobileSortOpen && (
          <>
            <motion.div
              key="sort-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSortOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100000] lg:hidden"
            />
            <motion.div
              key="sort-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[100001] bg-white text-[#17181C] rounded-t-3xl overflow-hidden lg:hidden flex flex-col max-h-[85dvh] shadow-2xl border-t border-[#E5E7EB] overscroll-contain"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-gray-50 shrink-0">
                <h3 className="font-bold text-lg text-[#17181C]">{locale === 'en' ? 'Sorting' : locale === 'ru' ? 'Сортировка' : 'Sıralama'}</h3>
                <button 
                  onClick={() => setIsMobileSortOpen(false)} 
                  className="p-1.5 bg-gray-100 border border-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2 pb-[max(2.5rem,env(safe-area-inset-bottom))] bg-white overscroll-contain">
                {[
                  { id: 'newest', label: locale === 'en' ? 'Newest' : locale === 'ru' ? 'Сначала новые' : 'Ən Yenilər' },
                  { id: 'price_asc', label: locale === 'en' ? 'Price: Low to High' : locale === 'ru' ? 'Цена: по возрастанию' : 'Qiymət: Ucuzdan bahaya' },
                  { id: 'price_desc', label: locale === 'en' ? 'Price: High to Low' : locale === 'ru' ? 'Цена: по убыванию' : 'Qiymət: Bahadan ucuza' },
                  { id: 'stock_high', label: locale === 'en' ? 'Best Selling' : locale === 'ru' ? 'Популярные' : 'Çox satılanlar' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortOption(opt.id);
                      setIsMobileSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border ${
                      sortOption === opt.id 
                        ? 'border-[#D8232A] bg-[#D8232A]/5 text-[#D8232A] font-bold' 
                        : 'border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-[#17181C]'
                    } transition-colors cursor-pointer`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
