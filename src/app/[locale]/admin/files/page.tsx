'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Image as ImageIcon, Upload, File, HardDrive, Trash2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { getProducts } from '@/lib/actions/catalog';
import { getBanners, getBlogPosts } from '@/lib/actions/admin';
import Image from 'next/image';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  source: string;
  type: string;
}

export default function AdminFilesPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [prodsRes, bannersRes, blogRes] = await Promise.all([
        getProducts(),
        getBanners(),
        getBlogPosts()
      ]);

      const items: MediaItem[] = [];
      const prods = Array.isArray(prodsRes) ? prodsRes : (prodsRes as any)?.products || [];
      prods.forEach((p: any) => {
        if (p.images && Array.isArray(p.images)) {
          p.images.forEach((img: string, idx: number) => {
            if (img && typeof img === 'string') {
              items.push({
                id: `prod-${p.id}-${idx}`,
                url: img,
                name: `${p.name_az || p.title_az || 'Məhsul'} - Şəkil #${idx + 1}`,
                source: 'Məhsul Kataloqu',
                type: 'Məhsul Şəkli'
              });
            }
          });
        }
      });

      const banners = bannersRes?.banners || [];
      banners.forEach((b: any) => {
        if (b.image_url) {
          items.push({
            id: `banner-${b.id}`,
            url: b.image_url,
            name: b.title_az || 'CMS Banner',
            source: 'CMS Banner',
            type: 'Banner Şəkli'
          });
        }
      });

      const blogs = blogRes?.posts || [];
      blogs.forEach((post: any) => {
        if (post.image_url) {
          items.push({
            id: `blog-${post.id}`,
            url: post.image_url,
            name: post.title_az || 'Bloq Şəkli',
            source: 'Bloq',
            type: 'Məqalə Şəkli'
          });
        }
      });

      setMediaFiles(items);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Media faylları yüklənərkən xəta baş verdi');
      setMediaFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <FolderOpen className="w-3.5 h-3.5" /> Media & Fayl İdarəetməsi
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Fayllar və Şəkillər</h1>
          <p className="text-slate-400 text-xs mt-1">Bazada saxlanılan bütün real məhsul şəkilləri, bannerlər və bloq vizualları.</p>
        </div>
        <button 
          onClick={fetchMedia}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenilə
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Files List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                <th className="p-4">Vizual</th>
                <th className="p-4">Fayl / Məzmun Adı</th>
                <th className="p-4">Mənbə</th>
                <th className="p-4">Növ</th>
                <th className="p-4 text-right">Keçid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Media faylları bazadan oxunur...</span>
                  </td>
                </tr>
              ) : mediaFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-bold text-sm text-slate-300">Hələ heç bir media faylı yüklənməyib</p>
                    <p className="text-xs text-slate-500 mt-1">Məhsullar, bannerlər və ya məqalələr əlavə edildikdə onların şəkilləri burada qeyd olunacaq.</p>
                  </td>
                </tr>
              ) : (
                mediaFiles.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center">
                        {f.url ? (
                          <img 
                            src={f.url} 
                            alt={f.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white max-w-xs truncate">
                      {f.name}
                    </td>
                    <td className="p-4 text-slate-300">{f.source}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[10px] font-bold border border-amber-500/20">
                        {f.type}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <a 
                        href={f.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                        title="Orijinal faylı aç"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
