"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Trash2, 
  Settings, 
  Tag, 
  Globe, 
  Eye, 
  Calendar,
  AlertCircle,
  Sliders,
  FileJson,
  Copy,
  Check,
  Wand2,
  Loader2,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import Image from 'next/image';
import { removeBackgroundClient } from '@/lib/client-remove-bg';
import { uploadMediaClient } from '@/lib/client-upload';
import { MediaUploadField } from '@/components/admin/MediaUploadField';
import { 
  createProduct, 
  updateProduct, 
  getProductById, 
  deleteProduct, 
  getCategories, 
  getBrands 
} from '@/lib/actions/catalog';

interface ProductFormClientProps {
  isNew: boolean;
  productId?: string;
}

export default function ProductFormClient({ isNew, productId }: ProductFormClientProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'az';
  const [activeTab, setActiveTab] = useState('core');
  
  // Form State
  const [title_az, setTitle_az] = useState(isNew ? '' : 'GAN 14 MagLev flagship 3x3');
  const [title_en, setTitle_en] = useState(isNew ? '' : 'GAN 14 MagLev flagship 3x3');
  const [title_ru, setTitle_ru] = useState(isNew ? '' : 'GAN 14 MagLev флагманский 3x3');
  const [description_az, setDescription_az] = useState(isNew ? '' : 'Dünyanın ən qabaqcıl sürət kubu.');
  const [description_en, setDescription_en] = useState(isNew ? '' : "The world's most advanced speed cube.");
  const [description_ru, setDescription_ru] = useState(isNew ? '' : 'Самый продвинутый скоростной куб в мире.');
  const [price_azn, setPrice_azn] = useState(isNew ? '' : '145.00');
  const [compareAtPrice_azn, setCompareAtPrice_azn] = useState(isNew ? '' : '155.00');
  const [slug, setSlug] = useState(isNew ? '' : 'gan-14-maglev-flagship-3x3');
  const [groupSlug, setGroupSlug] = useState(isNew ? '' : '');
  const [variantName, setVariantName] = useState(isNew ? '' : '');
  const [productType, setProductType] = useState('standard');
  const [status, setStatus] = useState('draft');
  const [imageUrl, setImageUrl] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [stock_quantity, setStock_quantity] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowPreorder, setAllowPreorder] = useState(true);
  const [preorderLeadTime, setPreorderLeadTime] = useState('14-28 iş günü');
  const [tags, setTags] = useState('gan, flagship, maglev');

  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Background removal state
  const [removingBg, setRemovingBg] = useState(false);
  const [removeBgError, setRemoveBgError] = useState('');
  const [removeBgSuccess, setRemoveBgSuccess] = useState('');

  const handleRemoveBg = async (targetUrl: string, applyFn: (newUrl: string) => void) => {
    if (!targetUrl) {
      alert("Zəhmət olmasa düzgün və aktiv şəkil URL-i daxil edin.");
      return;
    }
    if (!originalImageUrl && !targetUrl.startsWith('data:image/')) {
      setOriginalImageUrl(targetUrl);
    }
    setRemovingBg(true);
    setRemoveBgError('');
    setRemoveBgSuccess('');

    try {
      const transparentDataUrl = await removeBackgroundClient(targetUrl);
      
      // Upload transparent PNG to Cloudinary to save Supabase storage space
      try {
        const cloudRes = await uploadMediaClient(transparentDataUrl, {
          folder: 'rubikshop_products',
          resourceType: 'image',
        });
        applyFn(cloudRes.url);
        setRemoveBgSuccess('Fon təmizləndi və şəffaf şəkil Cloudinary-yə yükləndi! ✨☁️');
      } catch (cloudErr) {
        // Fallback to base64 if Cloudinary API keys are not configured yet
        applyFn(transparentDataUrl);
        setRemoveBgSuccess('Fon intellektual AI (@imgly/background-removal) tərəfindən təmizləndi! ✨');
      }
    } catch (clientErr: any) {
      console.error("AI remove bg error:", clientErr);
      setRemoveBgError('Fon silinərkən xəta baş verdi: ' + (clientErr.message || 'Lütfən URL-i yoxlayın'));
    }

    setRemovingBg(false);
  };

  // Categories and Brands lists from Database
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');

  // SEO, Specs & Add-ons state
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [weight_g, setWeight_g] = useState('');
  const [isMagnetic, setIsMagnetic] = useState(false);
  const [size_mm, setSize_mm] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('başlanğıc');
  const [addOns, setAddOns] = useState<any[]>([]);
  const [specRows, setSpecRows] = useState<Array<{ id: string; key: string; val_az: string; val_en: string; val_ru: string }>>([
    { id: 'spec_1', key: 'Çəki (Weight)', val_az: '65g', val_en: '65g', val_ru: '65g' },
    { id: 'spec_2', key: 'Ölçü (Size)', val_az: '55.5mm', val_en: '55.5mm', val_ru: '55.5mm' },
    { id: 'spec_3', key: 'Maqnit nüvə', val_az: 'Bəli', val_en: 'Yes', val_ru: 'Да' },
    { id: 'spec_4', key: 'Gərginlik sistemi', val_az: 'MagLev', val_en: 'MagLev', val_ru: 'MagLev' }
  ]);

  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [jsonCopied, setJsonCopied] = useState(false);

  const handleApplyJson = () => {
    try {
      setJsonError('');
      if (!jsonInput.trim()) {
        setJsonError('Xahiş olunur JSON mətnini daxil edin');
        return;
      }
      const parsed = JSON.parse(jsonInput.trim());
      const newRows: Array<{ id: string; key: string; val_az: string; val_en: string; val_ru: string }> = [];

      if (Array.isArray(parsed)) {
        parsed.forEach((item, idx) => {
          if (typeof item === 'object' && item !== null) {
            const key = item.key || item.name || item.title || item.attribute || `Atribut ${idx + 1}`;
            const val_az = item.val_az || item.val || item.value || item.az || '';
            const val_en = item.val_en || item.en || val_az;
            const val_ru = item.val_ru || item.ru || val_az;
            newRows.push({
              id: `spec_json_${Date.now()}_${idx}`,
              key: String(key),
              val_az: String(val_az),
              val_en: String(val_en),
              val_ru: String(val_ru)
            });
          }
        });
      } else if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.specs_az || parsed.specs_en || parsed.specs_ru || parsed.specs) {
          const sAz = parsed.specs_az || parsed.specs || {};
          const sEn = parsed.specs_en || {};
          const sRu = parsed.specs_ru || {};
          const allKeys = Array.from(new Set([
            ...Object.keys(sAz || {}),
            ...Object.keys(sEn || {}),
            ...Object.keys(sRu || {})
          ]));
          allKeys.forEach((k, idx) => {
            newRows.push({
              id: `spec_json_${Date.now()}_${idx}`,
              key: k,
              val_az: String(sAz[k] ?? ''),
              val_en: String(sEn[k] ?? ''),
              val_ru: String(sRu[k] ?? '')
            });
          });
        } else {
          Object.entries(parsed).forEach(([k, v], idx) => {
            let valStr = '';
            if (typeof v === 'object' && v !== null) {
              valStr = JSON.stringify(v);
            } else {
              valStr = String(v ?? '');
            }
            newRows.push({
              id: `spec_json_${Date.now()}_${idx}`,
              key: k,
              val_az: valStr,
              val_en: valStr,
              val_ru: valStr
            });
          });
        }
      }

      if (newRows.length === 0) {
        setJsonError('JSON formatında heç bir keçərli atribut tapılmadı');
        return;
      }

      setSpecRows((prev) => [...prev.filter(r => r.key.trim() !== ''), ...newRows]);
      setShowJsonModal(false);
      setJsonInput('');
    } catch (err: any) {
      setJsonError('Xətalı JSON formatı: ' + (err?.message || 'Sintaksis xətası'));
    }
  };

  const [showProductDeleteConfirm, setShowProductDeleteConfirm] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Fetch metadata on mount
  React.useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          getCategories(),
          getBrands()
        ]);
        if (catsRes.success && catsRes.data) {
          setCategoriesList(catsRes.data);
        }
        if (brandsRes.success && brandsRes.data) {
          setBrandsList(brandsRes.data);
        }
      } catch (err) {
        console.error('Metadata loading error:', err);
      }
    };
    loadMetadata();
  }, []);

  // Hydrate product details when editing
  React.useEffect(() => {
    if (!isNew && productId) {
      const loadProduct = async () => {
        setLoadingProduct(true);
        setErrorMsg('');
        try {
          const res = await getProductById(productId);
          if (res.success && res.data) {
            const prod = res.data;
            setTitle_az(prod.title_az || prod.title || prod.name_az || prod.name || '');
            setTitle_en(prod.title_en || prod.title || prod.name_en || prod.name || '');
            setTitle_ru(prod.title_ru || prod.title || prod.name_ru || prod.name || '');
            setDescription_az(prod.description_az || prod.description || '');
            setDescription_en(prod.description_en || prod.description || '');
            setDescription_ru(prod.description_ru || prod.description || '');
            
            const rawPrice = prod.price_azn ?? prod.price ?? '';
            setPrice_azn(rawPrice !== undefined && rawPrice !== null ? String(rawPrice) : '');
            
            const rawComparePrice = prod.compare_at_price_azn ?? prod.discount_price ?? prod.compare_at_price ?? prod.old_price;
            setCompareAtPrice_azn(rawComparePrice !== undefined && rawComparePrice !== null ? String(rawComparePrice) : '');
            
            setSlug(prod.slug || '');
            setGroupSlug(prod.group_slug || '');
            setVariantName(prod.variant_name || '');
            setStatus(prod.status || (prod.is_active ? 'publish' : 'draft'));
            setImageUrl(prod.image_url || prod.image || '');
            
            if (prod.gallery_images) {
              if (Array.isArray(prod.gallery_images)) {
                setGalleryImages(prod.gallery_images);
              } else if (typeof prod.gallery_images === 'string') {
                try {
                  const parsed = JSON.parse(prod.gallery_images);
                  setGalleryImages(Array.isArray(parsed) ? parsed : [prod.gallery_images]);
                } catch {
                  setGalleryImages(prod.gallery_images.split(',').map((s: string) => s.trim()).filter(Boolean));
                }
              }
            } else {
              setGalleryImages([]);
            }

            setVideoUrl(prod.video_url || '');
            const rawStock = prod.stock_quantity ?? prod.stock ?? 0;
            setStock_quantity(Number(rawStock) || 0);
            setIsFeatured(prod.is_featured || false);
            setSelectedBrandId(prod.brand_id || '');
            setProductType(prod.product_type || 'standard');
            setTags(Array.isArray(prod.tags) ? prod.tags.join(', ') : (prod.tags || ''));
            setSeoTitle(prod.seo_title || '');
            setSeoDesc(prod.seo_description || '');
            setWeight_g(prod.weight_g !== undefined && prod.weight_g !== null ? String(prod.weight_g) : '');
            setIsMagnetic(prod.is_magnetic || false);
            setAllowPreorder(prod.allow_preorder !== undefined && prod.allow_preorder !== null ? Boolean(prod.allow_preorder) : true);
            setPreorderLeadTime(prod.preorder_lead_time || '14-28 iş günü');
            setSize_mm(prod.size_mm !== undefined && prod.size_mm !== null ? String(prod.size_mm) : '');
            setDifficultyLevel(prod.difficulty_level || 'başlanğıc');

            if (prod.product_categories && Array.isArray(prod.product_categories) && prod.product_categories.length > 0) {
              setSelectedCategoryId(prod.product_categories[0].category_id || '');
            } else {
              setSelectedCategoryId('');
            }
            
            let parsedAddOns: any[] = [];
            if (Array.isArray(prod.add_ons)) {
              parsedAddOns = prod.add_ons;
            } else if (typeof prod.add_ons === 'string') {
              try {
                const p = JSON.parse(prod.add_ons);
                if (Array.isArray(p)) parsedAddOns = p;
              } catch {
                parsedAddOns = [];
              }
            }
            setAddOns(parsedAddOns);

            let sAz = prod.specs_az || prod.specs || {};
            let sEn = prod.specs_en || {};
            let sRu = prod.specs_ru || {};

            if (typeof sAz === 'string') { try { sAz = JSON.parse(sAz); } catch { sAz = {}; } }
            if (typeof sEn === 'string') { try { sEn = JSON.parse(sEn); } catch { sEn = {}; } }
            if (typeof sRu === 'string') { try { sRu = JSON.parse(sRu); } catch { sRu = {}; } }

            const allKeys = Array.from(new Set([
              ...Object.keys(sAz || {}),
              ...Object.keys(sEn || {}),
              ...Object.keys(sRu || {})
            ]));

            if (allKeys.length > 0) {
              const rows = allKeys.map((k, idx) => ({
                id: `spec_row_${idx}_${Date.now()}`,
                key: k,
                val_az: String(sAz[k] ?? ''),
                val_en: String(sEn[k] ?? ''),
                val_ru: String(sRu[k] ?? '')
              }));
              setSpecRows(rows);
            }
          } else {
            setErrorMsg(res.error || 'Məhsul yüklənərkən xəta baş verdi');
          }
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Gözlənilməz xəta baş verdi');
        } finally {
          setLoadingProduct(false);
        }
      };
      loadProduct();
    }
  }, [isNew, productId]);

  const handleConfirmDeleteProduct = async () => {
    if (!productId) return;
    setIsDeletingProduct(true);
    try {
      const res = await deleteProduct(productId);
      if (!res.success) {
        setErrorMsg('Silinmə zamanı xəta baş verdi: ' + (res.error || 'Xəta baş verdi'));
      } else {
        setSuccessMsg('Məhsul uğurla silindi!');
        setTimeout(() => {
          window.location.href = '/az/admin/products';
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg('Silinmə zamanı xəta baş verdi: ' + (err.message || err));
    } finally {
      setIsDeletingProduct(false);
      setShowProductDeleteConfirm(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!selectedCategoryId) {
        setErrorMsg('Kateqoriya seçimi məcburidir! Zəhmət olmasa sağ menyudan düzgün kateqoriyanı seçin.');
        setLoading(false);
        return;
      }
      // Normalize decimal (accepts "8,90" or "8.90"), keep two decimals
      const parsedPrice = parseFloat(String(price_azn).replace(',', '.'));
      const priceNumber = !isNaN(parsedPrice) && isFinite(parsedPrice) ? Math.round(parsedPrice * 100) / 100 : 0;

      const payloadAddOns = addOns.map(a => ({
        id: a.id || `addon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title_az: a.title_az || a.title || 'Əlavə xidmət',
        title_en: a.title_en || a.title_az || '',
        title_ru: a.title_ru || a.title_az || '',
        price_azn: Number(a.price_azn || a.price || 0),
        description_az: a.description_az || ''
      }));

      const parsedComparePrice = parseFloat(String(compareAtPrice_azn).replace(',', '.'));
      const comparePriceNumber = !isNaN(parsedComparePrice) && isFinite(parsedComparePrice) ? Math.round(parsedComparePrice * 100) / 100 : null;

      const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const weightNumber = weight_g !== '' ? parseFloat(weight_g) : null;
      const sizeNumber = size_mm !== '' ? parseFloat(size_mm) : null;

      const specs_azObj: Record<string, string> = {};
      const specs_enObj: Record<string, string> = {};
      const specs_ruObj: Record<string, string> = {};

      specRows.forEach(row => {
        const k = row.key.trim();
        if (k) {
          if (row.val_az) specs_azObj[k] = row.val_az.trim();
          if (row.val_en) specs_enObj[k] = row.val_en.trim();
          if (row.val_ru) specs_ruObj[k] = row.val_ru.trim();
        }
      });

      const payload = {
        title_az,
        title_en,
        title_ru,
        description_az,
        description_en,
        description_ru,
        slug: slug || title_az.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        group_slug: groupSlug || undefined,
        variant_name: variantName || undefined,
        price_azn: priceNumber,
        compare_at_price_azn: comparePriceNumber || undefined,
        is_active: status === 'publish',
        status: status,
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
        stock_quantity: Number(stock_quantity) || 0,
        allow_preorder: allowPreorder,
        preorder_lead_time: preorderLeadTime || '14-28 iş günü',
        add_ons: payloadAddOns,
        category_ids: selectedCategoryId ? [selectedCategoryId] : [],
        brand_id: selectedBrandId || undefined,
        is_featured: isFeatured,
        product_type: productType,
        tags: tagsArray,
        gallery_images: galleryImages.map(img => img.trim()).filter(Boolean),
        seo_title: seoTitle || undefined,
        seo_description: seoDesc || undefined,
        weight_g: weightNumber !== null ? weightNumber : undefined,
        is_magnetic: isMagnetic,
        size_mm: sizeNumber !== null ? sizeNumber : undefined,
        difficulty_level: difficultyLevel,
        specs: specs_azObj,
        specs_az: specs_azObj,
        specs_en: specs_enObj,
        specs_ru: specs_ruObj,
      };

      let res;
      if (isNew) {
        res = await createProduct(payload);
      } else if (productId) {
        res = await updateProduct(productId, payload);
      }

      if (res && res.success) {
        setSuccessMsg(isNew ? 'Məhsul uğurla yaradıldı!' : 'Məhsul uğurla yeniləndi!');
      } else {
        setErrorMsg(res?.error || 'Xəta baş verdi');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gözlənilməz xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!slug) {
      alert("Zəhmət olmasa, önizləmə etmək üçün əvvəlcə məhsul linkini (slug) daxil edin.");
      return;
    }
    window.open(`/${locale}/product/${slug}`, '_blank');
  };

  const tabs = [
    { id: 'core', label: 'Əsas Məlumatlar', icon: Settings },
    { id: 'specs', label: 'Spesifikasiyalar (Matris)', icon: Sliders },
    { id: 'media', label: 'Şəkil Meneceri', icon: ImageIcon },
    { id: 'addons', label: 'Əlavə Xidmətlər', icon: Tag },
    { id: 'seo', label: 'SEO & Meta', icon: Globe },
  ];

  if (loadingProduct) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Məhsul məlumatları yüklənir...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/az/admin/products" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              {isNew ? 'Yeni Məhsul' : 'Məhsulu Redaktə Et'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Məhsul detallarını konfiqurasiya edin.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition-colors border border-slate-700"
          >
            <Eye className="w-4 h-4" /> Önizləmə
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" /> {loading ? 'Gözləyin...' : (isNew ? 'Yarat' : 'Yadda Saxla')}
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar bg-slate-900 p-2 rounded-2xl border border-slate-800">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content: Core */}
          {activeTab === 'core' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məhsul Adı (AZ)</label>
                    <input 
                      type="text" 
                      value={title_az}
                      onChange={(e) => setTitle_az(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Məsələn: MoYu RS3M 2020"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Product Name (EN)</label>
                    <input 
                      type="text" 
                      value={title_en}
                      onChange={(e) => setTitle_en(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g. MoYu RS3M 2020"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Название товара (RU)</label>
                    <input 
                      type="text" 
                      value={title_ru}
                      onChange={(e) => setTitle_ru(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Например: MoYu RS3M 2020"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məhsul Linki (Slug)</label>
                  <input 
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="moyu-rs3m-2020"
                  />
                </div>

                {/* Grouped Sibling Products Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Qrup Slug (group_slug)
                    </label>
                    <input 
                      type="text" 
                      value={groupSlug}
                      onChange={(e) => setGroupSlug(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors font-mono text-sm"
                      placeholder="moyu-rs3m-v5-3x3"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Eyni məhsul ailəsinin versiyalarını birləşdirən ortaq slug</p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Versiya Adı (variant_name)
                    </label>
                    <input 
                      type="text" 
                      value={variantName}
                      onChange={(e) => setVariantName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="MagLev + Robot Stend Qutulu"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Məhsul səhifəsində versiya sevim knopkasında görünən ad</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Açıqlama (Azərbaycan dili)</label>
                    <textarea 
                      value={description_az}
                      onChange={(e) => setDescription_az(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      placeholder="Məhsul haqqında ətraflı məlumat (AZ)..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Description (English)</label>
                    <textarea 
                      value={description_en}
                      onChange={(e) => setDescription_en(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      placeholder="Detailed product information (EN)..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Описание (Русский)</label>
                    <textarea 
                      value={description_ru}
                      onChange={(e) => setDescription_ru(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      placeholder="Подробная информация о товаре (RU)..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Qiymət (AZN)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      step="0.01"
                      value={price_azn}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                          setPrice_azn(val);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Məs.: 145.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Endirimdən əvvəlki qiymət (AZN)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      step="0.01"
                      value={compareAtPrice_azn}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                          setCompareAtPrice_azn(val);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Məs.: 155.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Stok sayı</label>
                    <input
                      type="number"
                      min="0"
                      value={stock_quantity}
                      onChange={(e) => setStock_quantity(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Məs.: 10"
                    />
                  </div>

                  {/* Pre-Order Toggle Box */}
                  <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">Öncədən Sifariş (Pre-Order)</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Stok bitdikdə məhsul avtomatik ön sifariş düyməsi ilə satışa davam edəcəkdir</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowPreorder}
                          onChange={(e) => setAllowPreorder(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {allowPreorder && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Çatdırılma Müddəti (Səhifədə göstəriləcək)</label>
                        <input
                          type="text"
                          value={preorderLeadTime}
                          onChange={(e) => setPreorderLeadTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Məs.: 14-28 iş günü"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Açar Sözlər (Tags)</label>
                    <div className="relative">
                      <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Vergüllə ayırın..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məhsul Tipi</label>
                    <select 
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                    >
                      <option value="standard">Standard Məhsul</option>
                      <option value="speedcube">Rubik Kubu / Puzzle</option>
                      <option value="service">Xidmət Məhsulu (Məsələn: Setup)</option>
                      <option value="bundle">Bundle (Paket)</option>
                      <option value="preorder">Pre-order (Ön Sifariş)</option>
                      <option value="wholesale">Topdan Satış</option>
                    </select>
                  </div>
                </div>

                {/* Speedcubing Specifications */}
                <div className="pt-6 mt-6 border-t border-slate-800 space-y-4">
                  <h4 className="text-sm font-black text-amber-500 uppercase tracking-wider">Rubik Kubu & Sürət Kubu Göstəriciləri</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Çəki (qram)</label>
                      <input 
                        type="number" 
                        value={weight_g}
                        onChange={(e) => setWeight_g(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors animate-fade-in"
                        placeholder="Məs.: 71"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Ölçü (mm)</label>
                      <input 
                        type="number" 
                        value={size_mm}
                        onChange={(e) => setSize_mm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Məs.: 56"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Çətinlik Səviyyəsi</label>
                      <select 
                        value={difficultyLevel}
                        onChange={(e) => setDifficultyLevel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="başlanğıc">Başlanğıc (Beginner)</option>
                        <option value="orta">Orta (Intermediate)</option>
                        <option value="peşəkar">Peşəkar (Professional)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Maqnit xüsusiyyəti</label>
                      <div 
                        onClick={() => setIsMagnetic(!isMagnetic)}
                        className="flex items-center justify-between cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors h-[50px]"
                      >
                        <span className="text-xs font-bold text-slate-300">Maqnitlidir</span>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isMagnetic ? 'bg-amber-500' : 'bg-slate-700'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isMagnetic ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab Content: Specs Matrix */}
          {activeTab === 'specs' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-500" /> Spesifikasiyalar & Variant Matrisi
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bu məhsul və ya onun variantları üçün istənilən sayda dinamik atribut daxil edin. Məhsul səhifəsindəki <strong>Müqayisə Matrisi</strong> avtomatik olaraq bu atributlardan təşkil olunacaq.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const template = [
                        { id: `spec_${Date.now()}_1`, key: 'Weight', val_az: '65g', val_en: '65g', val_ru: '65g' },
                        { id: `spec_${Date.now()}_2`, key: 'Size', val_az: '55.5mm', val_en: '55.5mm', val_ru: '55.5mm' },
                        { id: `spec_${Date.now()}_3`, key: 'Magnetic core', val_az: 'Bəli', val_en: 'Yes', val_ru: 'Да' },
                        { id: `spec_${Date.now()}_4`, key: 'Tension system', val_az: 'MagLev', val_en: 'MagLev', val_ru: 'MagLev' },
                        { id: `spec_${Date.now()}_5`, key: 'Surface finish', val_az: 'UV Coated', val_en: 'UV Coated', val_ru: 'UV Coated' }
                      ];
                      setSpecRows(template);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors border border-slate-700"
                  >
                    ⚡ Speedcube Şablonu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJsonModal(!showJsonModal);
                      setJsonError('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold text-xs rounded-xl transition-all border border-amber-500/30"
                  >
                    <FileJson className="w-4 h-4 text-amber-400" /> 📋 JSON ilə Import
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecRows([...specRows, { id: `spec_${Date.now()}`, key: '', val_az: '', val_en: '', val_ru: '' }])}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" /> + Atribut Əlavə Et
                  </button>
                </div>
              </div>

              {/* JSON Import / Export Drawer */}
              {showJsonModal && (
                <div className="p-5 bg-slate-950 border border-amber-500/40 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-black text-white">JSON Əsaslı Atribut Daxil Etmə Və Ya İxrac Etmə</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowJsonModal(false)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
                    >
                      Ləğv et
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Məhsulun spesifikasiya və atributlarını birbaşa JSON mətn olaraq yapışdırın (məs: <code className="text-amber-400">{`{"Weight": "65g", "Size": "55.5mm"}`}</code>) və ya mövcud atributları kopyalayın.
                  </p>

                  <textarea
                    rows={5}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      setJsonError('');
                    }}
                    placeholder={`Məsələn, sadə JSON:\n{\n  "Weight": "65g",\n  "Size": "55.5mm",\n  "Magnetic core": "Yes"\n}`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                  />

                  {jsonError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{jsonError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const sample = JSON.stringify({
                            "Weight": "65g",
                            "Size": "55.5mm",
                            "Magnetic core": "Yes",
                            "Tension system": "MagLev",
                            "Surface finish": "Frosted"
                          }, null, 2);
                          setJsonInput(sample);
                          setJsonError('');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-bold border border-slate-700"
                      >
                        📄 Nümunə Yüklə
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentObj: Record<string, any> = {};
                          specRows.forEach(r => {
                            if (r.key.trim()) {
                              currentObj[r.key.trim()] = r.val_az || r.val_en || r.val_ru;
                            }
                          });
                          const exported = JSON.stringify(currentObj, null, 2);
                          setJsonInput(exported);
                          navigator.clipboard.writeText(exported);
                          setJsonCopied(true);
                          setTimeout(() => setJsonCopied(false), 2000);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-bold border border-slate-700"
                      >
                        {jsonCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{jsonCopied ? 'Kopyalandı!' : 'Cədvəli JSON Kimi İxrac Et'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyJson}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all"
                    >
                      ✅ JSON-u Cədvələ Əlavə Et
                    </button>
                  </div>
                </div>
              )}

              {specRows.length === 0 ? (
                <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-2xl text-center space-y-2">
                  <p className="text-sm font-bold text-slate-300">Heç bir dinamik spesifikasiya əlavə edilməyib</p>
                  <p className="text-xs text-slate-500">
                    &quot;Atribut Əlavə Et&quot; düyməsini klikləyərək və ya Speedcube Şablonunu seçərək cədvəl sətirlərini yarada bilərsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {specRows.map((row, index) => (
                    <div key={row.id || index} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1">Atribut Adı (Məs: Weight, Size)</label>
                          <input
                            type="text"
                            placeholder="Məs: Magnetic core"
                            value={row.key}
                            onChange={(e) => {
                              const updated = [...specRows];
                              updated[index] = { ...updated[index], key: e.target.value };
                              setSpecRows(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dəyər (AZ)</label>
                          <input
                            type="text"
                            placeholder="Məs: Bəli / MagLev / 65g"
                            value={row.val_az}
                            onChange={(e) => {
                              const updated = [...specRows];
                              updated[index] = { ...updated[index], val_az: e.target.value };
                              setSpecRows(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dəyər (EN)</label>
                          <input
                            type="text"
                            placeholder="Məs: Yes / MagLev / 65g"
                            value={row.val_en}
                            onChange={(e) => {
                              const updated = [...specRows];
                              updated[index] = { ...updated[index], val_en: e.target.value };
                              setSpecRows(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dəyər (RU)</label>
                              <input
                                type="text"
                                placeholder="Məs: Да / MagLev / 65g"
                                value={row.val_ru}
                                onChange={(e) => {
                                  const updated = [...specRows];
                                  updated[index] = { ...updated[index], val_ru: e.target.value };
                                  setSpecRows(updated);
                                }}
                                className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setSpecRows(specRows.filter((_, i) => i !== index))}
                              className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors shrink-0 mt-5 border border-transparent hover:border-red-500/20"
                              title="Sətiri Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-500" /> Əsas Məhsul Şəkli
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {originalImageUrl && imageUrl !== originalImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl(originalImageUrl);
                          setRemoveBgSuccess('Orijinal şəkil bərpa olundu! ↩️');
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700 shrink-0"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-400" />
                        <span>Orijinalı Bərpa Et</span>
                      </button>
                    )}
                    {imageUrl && (
                      <button
                        type="button"
                        disabled={removingBg}
                        onClick={() => handleRemoveBg(imageUrl, (newUrl) => setImageUrl(newUrl))}
                        className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-purple-900/30 shrink-0"
                      >
                        {removingBg ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>AI Fon Silinir...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 text-purple-200" />
                            <span>✨ Fonu Sil (@imgly AI)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {removeBgSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{removeBgSuccess}</span>
                  </div>
                )}

                {removeBgError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{removeBgError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <MediaUploadField
                    label=""
                    value={imageUrl}
                    onChange={(newUrl) => setImageUrl(newUrl)}
                    accept="image"
                    folder="rubikshop_products"
                    placeholder="https://... şəkil URL-i yapışdırın və ya kompyuterdən Cloudinary-yə yükləyin"
                    description="Məhsulun əsas görüntüsü Cloudinary CDN üzərində saxlanılacaq."
                  />

                  {imageUrl ? (
                    <div className="mt-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Önizləmə</p>
                      <div className="relative w-48 aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group">
                        <Image 
                          src={imageUrl} 
                          alt="Önizləmə" 
                          fill 
                          className="object-contain p-2" 
                          unoptimized={true}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded uppercase tracking-wider shadow-md">
                          Əsas Şəkil
                        </div>
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={removingBg}
                            onClick={() => handleRemoveBg(imageUrl, (newUrl) => setImageUrl(newUrl))}
                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            title="Fonu Sil (@imgly AI)"
                          >
                            <Wand2 className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="Şəkli Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-800 bg-slate-950/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-white mb-1">Şəkil URL-i və ya fayl seçilməyib</p>
                      <p className="text-[11px] text-slate-500">
                        Şəkil URL-ini yapışdırın və ya &quot;Cloudinary-yə Yüklə&quot; düyməsini sıxaraq kompyuterinizdən şəkil yükləyin.
                      </p>
                    </div>
                  )}
                </div>

                {/* QALEREYA ŞƏKİLLƏRİ */}
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                        Qalereya Şəkilləri (Cloudinary CDN)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">Məhsul detalları səhifəsində mini karusel şəkilləri</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGalleryImages([...galleryImages, ''])}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-500 hover:text-amber-400 font-bold text-xs rounded-xl transition-colors border border-slate-700 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> + Əlavə Şəkil Sətiri
                    </button>
                  </div>

                  {galleryImages.length === 0 ? (
                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                      Əlavə qalereya şəkli yoxdur.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {galleryImages.map((imgUrl, index) => (
                        <div key={index} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                          <MediaUploadField
                            label={`Qalereya ${index + 1}`}
                            value={imgUrl}
                            onChange={(newUrl) => {
                              const updated = [...galleryImages];
                              updated[index] = newUrl;
                              setGalleryImages(updated);
                            }}
                            accept="image"
                            folder="rubikshop_products"
                            placeholder="Qalereya şəkil URL-i yapışdırın və ya yükləyin"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-400" /> Video Və ya YouTube Meneceri (Cloudinary Video)
                </h3>
                <MediaUploadField
                  label="Məhsul Videosu (Cloudinary / YouTube / MP4)"
                  value={videoUrl}
                  onChange={(newUrl) => setVideoUrl(newUrl)}
                  accept="video"
                  folder="rubikshop_videos"
                  placeholder="https://youtube.com/... və ya kompyuterinizdən video (.mp4) yükləyin"
                  description="Gamer kub videoları Cloudinary video serverinə yüklənib yayımlanacaq."
                />
              </div>
            </div>
          )}

          {/* Tab Content: Add-ons (Əlavə Xidmətlər) */}
          {activeTab === 'addons' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-500" /> Əlavə Xidmətlər (Add-ons)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Məhsul səhifəsində alıcılara təklif olunan əlavə xidmətlər (məs. Premium Setup xidməti, Qoruyucu çanta və s.).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddOns([...addOns, { id: `addon_${Date.now()}`, title_az: '', price_azn: 5.0, description_az: '' }])}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-500 font-bold text-xs rounded-xl transition-colors border border-slate-700 shrink-0"
                >
                  <Plus className="w-4 h-4" /> + Yeni Əlavə Xidmət
                </button>
              </div>

              {addOns.length === 0 ? (
                <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-2xl text-center space-y-1">
                  <p className="text-sm font-bold text-slate-300">Bu məhsul üçün heç bir əlavə xidmət təyin edilməyib</p>
                  <p className="text-xs text-slate-500">Məhsul səhifəsində əlavə xidmət checkbox/bölməsi ÜMUMİYYƏTLƏ göstərilməyəcək.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addOns.map((addon, index) => (
                    <div key={addon.id || index} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Xidmətin Adı (AZ)</label>
                          <input
                            type="text"
                            placeholder="Məs: Rubikshop Premium Setup xidməti"
                            value={addon.title_az || ''}
                            onChange={(e) => {
                              const updated = [...addOns];
                              updated[index] = { ...updated[index], title_az: e.target.value };
                              setAddOns(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Qiymət (AZN)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="5.00"
                            value={addon.price_azn !== undefined ? addon.price_azn : ''}
                            onChange={(e) => {
                              const updated = [...addOns];
                              updated[index] = { ...updated[index], price_azn: parseFloat(e.target.value) || 0 };
                              setAddOns(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Təsviri (Məhsul səhifəsində görünən məlumat)</label>
                        <input
                          type="text"
                          placeholder="Məs: Kubun hər tərəfli yağlanması və gərginliyin tənzimlənməsi"
                          value={addon.description_az || ''}
                          onChange={(e) => {
                            const updated = [...addOns];
                            updated[index] = { ...updated[index], description_az: e.target.value };
                            setAddOns(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setAddOns(addOns.filter((_, i) => i !== index))}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold px-3 py-1.5 bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xidməti Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: SEO */}
          {activeTab === 'seo' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-lg font-black text-white">SEO & Axtarış Optimizasiyası</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Meta Title</label>
                  <input 
                    type="text" 
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Maksimum 60 simvol..."
                  />
                  <div className="text-right text-[10px] text-slate-500 mt-1">{seoTitle.length} / 60</div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Meta Description</label>
                  <textarea 
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    placeholder="Maksimum 160 simvol..."
                  />
                  <div className="text-right text-[10px] text-slate-500 mt-1">{seoDesc.length} / 160</div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl mt-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Google Önizləmə</h4>
                  <div className="space-y-1">
                    <div className="text-blue-400 text-lg font-medium hover:underline cursor-pointer truncate">
                      {seoTitle || title_az || 'Məhsul Adı Burada Görünəcək'}
                    </div>
                    <div className="text-green-500 text-sm truncate">
                      https://rubikshop.az/products/{slug || 'məhsul-linki'}
                    </div>
                    <div className="text-slate-300 text-sm line-clamp-2">
                      {seoDesc || description_az || 'Məhsul haqqında qısa açıqlama burada görünəcək. Google axtarışlarında müştəriləri cəlb etmək üçün maraqlı mətn yazın.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Status Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-soft-md space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3">Nəşr Statusu</h3>
            
            <div className="space-y-3">
              <label 
                onClick={() => setStatus('publish')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  status === 'publish' ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${status === 'publish' ? 'border-green-500' : 'border-slate-600'}`}>
                    {status === 'publish' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${status === 'publish' ? 'text-green-400' : 'text-slate-300'}`}>Aktiv (Publish)</div>
                    <div className="text-[10px] text-slate-500">Müştərilər görə bilər</div>
                  </div>
                </div>
              </label>

              <label 
                onClick={() => setStatus('draft')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  status === 'draft' ? 'bg-slate-800 border-slate-600' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${status === 'draft' ? 'border-slate-400' : 'border-slate-600'}`}>
                    {status === 'draft' && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${status === 'draft' ? 'text-white' : 'text-slate-300'}`}>Qaralama (Draft)</div>
                    <div className="text-[10px] text-slate-500">Hazırlanma mərhələsində</div>
                  </div>
                </div>
              </label>

              <label 
                onClick={() => setStatus('archive')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  status === 'archive' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${status === 'archive' ? 'border-amber-500' : 'border-slate-600'}`}>
                    {status === 'archive' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${status === 'archive' ? 'text-amber-500' : 'text-slate-300'}`}>Arxiv (Archive)</div>
                    <div className="text-[10px] text-slate-500">Satışdan çıxarılıb</div>
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors">
                <Calendar className="w-4 h-4" /> Nəşri Planla (Schedule)
              </button>
            </div>
            
            {!isNew && (
              <div className="pt-3 mt-3 border-t border-slate-800">
                <button 
                  onClick={() => setShowProductDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Məhsulu Sil
                </button>
              </div>
            )}
          </div>

          {/* Visibility & Organization */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-soft-md space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-800 pb-3">Təşkilatlandırma</h3>
            
            <label 
              onClick={() => setIsFeatured(!isFeatured)}
              className="flex items-center justify-between cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="text-sm font-bold text-white">Önə Çıxarılan</div>
                <div className="text-[10px] text-slate-500">Ana səhifədə göstər</div>
              </div>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isFeatured ? 'bg-amber-500' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isFeatured ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </label>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Kateqoriya <span className="text-amber-500 font-bold">* (Məcburi)</span>
              </label>
              <select 
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">— Seçin —</option>
                {categoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_az} {cat.parent_id ? `(Alt)` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Brend</label>
              <select 
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">— Seçin —</option>
                {brandsList.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* PRODUCT DELETE CONFIRMATION MODAL */}
      {showProductDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Məhsulu silmək</h3>
              <p className="text-sm text-slate-400 mb-6">Bu elementi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.</p>
              
              <div className="flex justify-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowProductDeleteConfirm(false)} 
                  disabled={isDeletingProduct}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Ləğv Et
                </button>
                <button 
                  type="button" 
                  onClick={handleConfirmDeleteProduct} 
                  disabled={isDeletingProduct}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeletingProduct ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      Silinir...
                    </>
                  ) : (
                    'Sil'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
