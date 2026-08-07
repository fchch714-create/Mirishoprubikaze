"use client";

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Edit3, Trash2, Check, X, MoveUp, MoveDown, LayoutTemplate } from 'lucide-react';
import { getBanners, createBanner, updateBanner, deleteBanner } from '@/lib/actions/admin';
import { MediaUploadField } from '@/components/admin/MediaUploadField';

interface Banner {
  id: string;
  title_az: string | null;
  title_en: string | null;
  title_ru: string | null;
  subtitle_az: string | null;
  subtitle_en: string | null;
  subtitle_ru: string | null;
  image_url: string;
  link_url: string | null;
  location: 'hero' | 'promo' | 'sidebar' | 'footer';
  sort_order: number;
  is_active: boolean;
}

export default function BannersClient() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form Fields
  const [titleAz, setTitleAz] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [subtitleAz, setSubtitleAz] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [subtitleRu, setSubtitleRu] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [location, setLocation] = useState<'hero' | 'promo' | 'sidebar' | 'footer'>('hero');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const res = await getBanners();
    if (res.success && res.data) {
      setBanners(res.data as Banner[]);
    }
    setLoading(false);
  };

  const handleOpenForm = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setTitleAz(banner.title_az || '');
      setTitleEn(banner.title_en || '');
      setTitleRu(banner.title_ru || '');
      setSubtitleAz(banner.subtitle_az || '');
      setSubtitleEn(banner.subtitle_en || '');
      setSubtitleRu(banner.subtitle_ru || '');
      setImageUrl(banner.image_url || '');
      setLinkUrl(banner.link_url || '');
      setLocation(banner.location);
      setSortOrder(banner.sort_order);
      setIsActive(banner.is_active);
    } else {
      setEditingBanner(null);
      setTitleAz('');
      setTitleEn('');
      setTitleRu('');
      setSubtitleAz('');
      setSubtitleEn('');
      setSubtitleRu('');
      setImageUrl('');
      setLinkUrl('');
      setLocation('hero');
      setSortOrder(0);
      setIsActive(true);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Şəkil URL daxil edilməlidir');
      return;
    }

    const payload = {
      title_az: titleAz || undefined,
      title_en: titleEn || undefined,
      title_ru: titleRu || undefined,
      subtitle_az: subtitleAz || undefined,
      subtitle_en: subtitleEn || undefined,
      subtitle_ru: subtitleRu || undefined,
      image_url: imageUrl,
      link_url: linkUrl || undefined,
      location,
      sort_order: sortOrder,
      is_active: isActive,
    };

    let res;
    if (editingBanner) {
      res = await updateBanner(editingBanner.id, payload);
    } else {
      res = await createBanner(payload);
    }

    if (res.success) {
      setIsFormOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu banneri silmək istədiyinizdən əminsiniz?')) {
      const res = await deleteBanner(id);
      if (res.success) {
        fetchBanners();
      } else {
        alert('Xəta baş verdi: ' + res.error);
      }
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];

    const currentOrder = currentBanner.sort_order;
    const targetOrder = targetBanner.sort_order;

    // Swap orders
    const res1 = await updateBanner(currentBanner.id, { sort_order: targetOrder });
    const res2 = await updateBanner(targetBanner.id, { sort_order: currentOrder });

    if (res1.success && res2.success) {
      fetchBanners();
    }
  };

  return (
    <div id="admin-banners-client" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-amber-500" /> Bannerlər & Slayderlər
          </h2>
          <p className="text-sm text-slate-400 mt-1">Ana səhifə hero bölməsi və promo bannerlərin idarəedilməsi.</p>
        </div>
        <button 
          id="btn-add-banner"
          onClick={() => isFormOpen ? setIsFormOpen(false) : handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? 'Ləğv Et' : 'Yeni Banner'}
        </button>
      </div>

      {isFormOpen && (
        <form id="banner-form" onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">
            {editingBanner ? 'Banneri Redaktə Et' : 'Yeni Banner Yaradılması'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq AZ</label>
                  <input 
                    id="banner-title-az"
                    type="text" 
                    value={titleAz} 
                    onChange={e => setTitleAz(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Başlıq AZ" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq EN</label>
                  <input 
                    id="banner-title-en"
                    type="text" 
                    value={titleEn} 
                    onChange={e => setTitleEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Başlıq EN" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq RU</label>
                  <input 
                    id="banner-title-ru"
                    type="text" 
                    value={titleRu} 
                    onChange={e => setTitleRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Başlıq RU" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Alt Başlıq AZ</label>
                  <input 
                    id="banner-sub-az"
                    type="text" 
                    value={subtitleAz} 
                    onChange={e => setSubtitleAz(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Alt Başlıq AZ" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Alt Başlıq EN</label>
                  <input 
                    id="banner-sub-en"
                    type="text" 
                    value={subtitleEn} 
                    onChange={e => setSubtitleEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Alt Başlıq EN" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Alt Başlıq RU</label>
                  <input 
                    id="banner-sub-ru"
                    type="text" 
                    value={subtitleRu} 
                    onChange={e => setSubtitleRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Alt Başlıq RU" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Yerləşmə (Location)</label>
                  <select 
                    id="banner-location"
                    value={location}
                    onChange={e => setLocation(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="hero">Ana Səhifə (Hero Slider)</option>
                    <option value="promo">Promo Səhifə</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Sıralama (Sort Order)</label>
                  <input 
                    id="banner-sort"
                    type="number" 
                    value={sortOrder} 
                    onChange={e => setSortOrder(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Keçid Linki (URL)</label>
                <input 
                  id="banner-link"
                  type="text" 
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                  placeholder="/category/rubik-cubes" 
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  id="banner-active"
                  type="checkbox" 
                  checked={isActive} 
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-opacity-50"
                />
                <label htmlFor="banner-active" className="text-sm font-bold text-slate-300">Aktivdir (Səhifədə göstərilsin)</label>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <MediaUploadField
                  label="Banner Şəkli (Cloudinary)"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  accept="image"
                  folder="rubikshop_banners"
                  placeholder="https://... banner şəkil URL-i yapışdırın və ya kompyuterdən yükləyin"
                  description="Yüksək keyfiyyətli banner şəkilləri Cloudinary CDN vasitəsilə sürətli yüklənəcək."
                />
                
                {imageUrl && (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50 p-2">
                    <img 
                      src={imageUrl} 
                      alt="Banner Önizləmə" 
                      className="w-full h-40 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/placeholder/800/400';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800">
            <button 
              type="button"
              onClick={() => { setIsFormOpen(false); setEditingBanner(null); }}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
            >
              Ləğv Et
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <Check className="w-5 h-5" /> Yaddaşda Saxla
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-soft-md">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">Yüklənir...</div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">Heç bir banner yoxdur.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Şəkil</th>
                  <th className="px-6 py-4">Başlıq AZ</th>
                  <th className="px-6 py-4">Yerləşmə</th>
                  <th className="px-6 py-4">Sıra</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {banners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 rounded overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                        {banner.image_url ? (
                          <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {banner.title_az || 'Başlıqsız'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded border border-slate-700">
                        {banner.location}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white bg-slate-950 border border-slate-800 w-8 h-8 flex items-center justify-center rounded-lg">
                          {banner.sort_order}
                        </span>
                        <div className="flex flex-col">
                          <button 
                            type="button"
                            className="text-slate-500 hover:text-white disabled:opacity-30" 
                            disabled={index === 0}
                            onClick={() => handleMove(index, 'up')}
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button 
                            type="button"
                            className="text-slate-500 hover:text-white disabled:opacity-30" 
                            disabled={index === banners.length - 1}
                            onClick={() => handleMove(index, 'down')}
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {banner.is_active 
                        ? <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Aktiv</span>
                        : <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">Passiv</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenForm(banner)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" 
                          title="Redaktə"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
