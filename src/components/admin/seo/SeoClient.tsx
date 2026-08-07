"use client";

import React, { useState, useEffect } from 'react';
import { Search, Save, Image as ImageIcon, Link2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/actions/settings';

interface SeoData {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  autoSitemap: boolean;
  autoRobots: boolean;
}

const DEFAULT_SEO: SeoData = {
  title: "RubikShop.az - Ən yaxşı rubik kubları və puzzle oyuncaqlar",
  description: "RubikShop.az Azərbaycanda ən böyük zəka oyuncaqları və rubik kubları mağazasıdır. Orijinal məhsullar və sürətli çatdırılma.",
  keywords: "rubik kub, puzzle, zəka oyuncaqları, moyu, gan, bakı",
  ogTitle: "RubikShop.az - Zəka Oyuncaqları Mərkəzi",
  ogDescription: "Ən yeni və keyfiyyətli zəka oyuncaqlarını bizdən kəşf edin.",
  ogImage: "https://rubikshop.az/og-image.jpg",
  autoSitemap: true,
  autoRobots: true,
};

export default function SeoClient() {
  const [seo, setSeo] = useState<SeoData>(DEFAULT_SEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    async function loadSeo() {
      setLoading(true);
      const res = await getSettings('seo_global');
      if (res.success && res.data && Object.keys(res.data).length > 0) {
        setSeo({
          ...DEFAULT_SEO,
          ...res.data
        });
      }
      setLoading(false);
    }
    loadSeo();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: null, message: '' });
    
    // Also write an audit log
    const { createAuditLog } = await import('@/lib/actions/audit');

    const res = await updateSettings('seo_global', seo);
    if (res.success) {
      setStatus({ type: 'success', message: 'SEO Parametrləri uğurla yadda saxlanıldı!' });
      await createAuditLog({
        action: 'Qlobal SEO parametrləri yeniləndi',
        table_name: 'settings',
        record_id: undefined,
        new_values: seo
      });
    } else {
      setStatus({ type: 'error', message: res.error || 'Xəta baş verdi, yadda saxlamaq mümkün olmadı.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">SEO Parametrləri yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Search className="w-6 h-6 text-amber-500" /> Qlobal SEO Meneceri
        </h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saxlanılır...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Yadda Saxla
            </>
          )}
        </button>
      </div>

      {status.type && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${
          status.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-bold">{status.message}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-8">
        
        {/* Global Meta Tags */}
        <div>
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Qlobal Meta Teqlər</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Əsas Səhifə Başlığı (Title)</label>
              <input 
                type="text" 
                value={seo.title}
                onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-sm" 
              />
              <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-wider">Tövsiyə edilən uzunluq: 50-60 simvol (Cari: {seo.title.length})</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Qlobal Meta Açıqlama (Description)</label>
              <textarea 
                rows={3} 
                value={seo.description}
                onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 resize-none text-sm" 
              ></textarea>
              <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-wider">Tövsiyə edilən uzunluq: 150-160 simvol (Cari: {seo.description.length})</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Açar Sözlər (Keywords)</label>
              <input 
                type="text" 
                value={seo.keywords}
                onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-sm" 
              />
              <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-wider">Vergüllə ayırın</p>
            </div>
          </div>
        </div>

        {/* Social Sharing (OpenGraph) */}
        <div className="pt-6 border-t border-slate-800">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <Link2 className="w-5 h-5 text-amber-500" /> Sosial Şəbəkə Paylaşımı (OpenGraph)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">OG:Title</label>
                <input 
                  type="text" 
                  value={seo.ogTitle}
                  onChange={(e) => setSeo({ ...seo, ogTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">OG:Description</label>
                <textarea 
                  rows={2} 
                  value={seo.ogDescription}
                  onChange={(e) => setSeo({ ...seo, ogDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 resize-none text-sm" 
                ></textarea>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">OG:Image (Şəkil URL-i)</label>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={seo.ogImage}
                  onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                  placeholder="https://rubikshop.az/og-image.jpg"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-sm" 
                />
                <div className="border border-dashed border-slate-800 rounded-2xl h-24 flex flex-col items-center justify-center text-slate-500 bg-slate-950/20">
                  {seo.ogImage ? (
                    <img src={seo.ogImage} alt="OG Preview" className="h-full w-full object-contain rounded-2xl p-2" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Şəkil önizləməsi</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical SEO */}
        <div className="pt-6 border-t border-slate-800">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Texniki SEO</h3>
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2">Sitemap.xml Avtomatik Yaradılma</div>
                <div className="text-xs text-slate-500 mt-0.5">Məhsul və kateqoriya dəyişdikdə sitemap avtomatik güncəllənir</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={seo.autoSitemap}
                  onChange={(e) => setSeo({ ...seo, autoSitemap: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <div className="font-bold text-white text-sm">Robots.txt İdarəetməsi</div>
                <div className="text-xs text-slate-500 mt-0.5">Axtarış motorları üçün icazələri tənzimləyir</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={seo.autoRobots}
                  onChange={(e) => setSeo({ ...seo, autoRobots: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
