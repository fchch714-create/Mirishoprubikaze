"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit3, Trash2, Check, X, Eye } from 'lucide-react';
import { getCMSPages, createCMSPage, updateCMSPage, deleteCMSPage } from '@/lib/actions/admin';

interface CMSPage {
  id: string;
  title_az: string;
  title_en: string;
  title_ru: string;
  slug: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  meta_title_az?: string;
  meta_title_en?: string;
  meta_title_ru?: string;
  meta_description_az?: string;
  meta_description_en?: string;
  meta_description_ru?: string;
  is_published: boolean;
  updated_at: string;
}

export default function PagesClient() {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [titleAz, setTitleAz] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [slug, setSlug] = useState('');
  const [contentAz, setContentAz] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentRu, setContentRu] = useState('');
  const [metaTitleAz, setMetaTitleAz] = useState('');
  const [metaTitleEn, setMetaTitleEn] = useState('');
  const [metaTitleRu, setMetaTitleRu] = useState('');
  const [metaDescAz, setMetaDescAz] = useState('');
  const [metaDescEn, setMetaDescEn] = useState('');
  const [metaDescRu, setMetaDescRu] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    const res = await getCMSPages();
    if (res.success && res.data) {
      setPages(res.data as CMSPage[]);
    }
    setLoading(false);
  };

  const handleOpenForm = (page?: CMSPage) => {
    if (page) {
      setEditingPage(page);
      setTitleAz(page.title_az || '');
      setTitleEn(page.title_en || '');
      setTitleRu(page.title_ru || '');
      setSlug(page.slug || '');
      setContentAz(page.content_az || '');
      setContentEn(page.content_en || '');
      setContentRu(page.content_ru || '');
      setMetaTitleAz(page.meta_title_az || '');
      setMetaTitleEn(page.meta_title_en || '');
      setMetaTitleRu(page.meta_title_ru || '');
      setMetaDescAz(page.meta_description_az || '');
      setMetaDescEn(page.meta_description_en || '');
      setMetaDescRu(page.meta_description_ru || '');
      setIsPublished(page.is_published ?? true);
    } else {
      setEditingPage(null);
      setTitleAz('');
      setTitleEn('');
      setTitleRu('');
      setSlug('');
      setContentAz('');
      setContentEn('');
      setContentRu('');
      setMetaTitleAz('');
      setMetaTitleEn('');
      setMetaTitleRu('');
      setMetaDescAz('');
      setMetaDescEn('');
      setMetaDescRu('');
      setIsPublished(true);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAz || !slug || !contentAz) {
      alert('Başlıq AZ, Slug və Məzmun AZ mütləq doldurulmalıdır.');
      return;
    }

    const payload = {
      title_az: titleAz,
      title_en: titleEn || titleAz,
      title_ru: titleRu || titleAz,
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      content_az: contentAz,
      content_en: contentEn || contentAz,
      content_ru: contentRu || contentAz,
      meta_title_az: metaTitleAz || undefined,
      meta_title_en: metaTitleEn || undefined,
      meta_title_ru: metaTitleRu || undefined,
      meta_description_az: metaDescAz || undefined,
      meta_description_en: metaDescEn || undefined,
      meta_description_ru: metaDescRu || undefined,
      is_published: isPublished,
    };

    let res;
    if (editingPage) {
      res = await updateCMSPage(editingPage.id, payload);
    } else {
      res = await createCMSPage(payload);
    }

    if (res.success) {
      setIsFormOpen(false);
      setEditingPage(null);
      fetchPages();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu səhifəni silmək istədiyinizdən əminsiniz?')) {
      const res = await deleteCMSPage(id);
      if (res.success) {
        fetchPages();
      } else {
        alert('Xəta baş verdi: ' + res.error);
      }
    }
  };

  const filteredPages = pages.filter(p => 
    p.title_az?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="admin-pages-client" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" /> Səhifələr & Hüquqi
          </h2>
          <p className="text-sm text-slate-400 mt-1">Statik və dinamik səhifələrin idarəedilməsi.</p>
        </div>
        <button 
          id="btn-add-page"
          onClick={() => isFormOpen ? setIsFormOpen(false) : handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? 'Ləğv Et' : 'Yeni Səhifə'}
        </button>
      </div>

      {isFormOpen && (
        <form id="pages-form" onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">
            {editingPage ? 'Səhifəni Redaktə Et' : 'Yeni Səhifə Yaradılması'}
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq AZ</label>
                  <input 
                    id="page-title-az"
                    type="text" 
                    value={titleAz}
                    onChange={e => {
                      setTitleAz(e.target.value);
                      if (!editingPage) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məs: Haqqımızda" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq EN</label>
                  <input 
                    id="page-title-en"
                    type="text" 
                    value={titleEn}
                    onChange={e => setTitleEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məs: About Us" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq RU</label>
                  <input 
                    id="page-title-ru"
                    type="text" 
                    value={titleRu}
                    onChange={e => setTitleRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məs: О нас" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Slug (URL)</label>
                  <input 
                    id="page-slug"
                    type="text" 
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-400 font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="haqqimizda" 
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input 
                    id="page-published"
                    type="checkbox" 
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-opacity-50"
                  />
                  <label htmlFor="page-published" className="text-sm font-bold text-slate-300">Yayımla (Səhifə saytda aktiv olsun)</label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məzmun AZ (Rich Text/HTML)</label>
                <textarea 
                  id="page-content-az"
                  rows={10}
                  value={contentAz}
                  onChange={e => setContentAz(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 font-sans"
                  placeholder="Səhifənin Azərbaycan dilində məzmununu bura yazın (HTML istifadə oluna bilər)..."
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məzmun EN (Rich Text/HTML)</label>
                <textarea 
                  id="page-content-en"
                  rows={10}
                  value={contentEn}
                  onChange={e => setContentEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 font-sans"
                  placeholder="Səhifənin İngilis dilində məzmununu bura yazın..."
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məzmun RU (Rich Text/HTML)</label>
                <textarea 
                  id="page-content-ru"
                  rows={10}
                  value={contentRu}
                  onChange={e => setContentRu(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 font-sans"
                  placeholder="Səhifənin Rus dilində məzmununu bura yazın..."
                ></textarea>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">SEO Metadata</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">SEO Başlıq AZ</label>
                  <input 
                    id="page-meta-title-az"
                    type="text" 
                    value={metaTitleAz}
                    onChange={e => setMetaTitleAz(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-xs" 
                    placeholder="SEO Title AZ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">SEO Başlıq EN</label>
                  <input 
                    id="page-meta-title-en"
                    type="text" 
                    value={metaTitleEn}
                    onChange={e => setMetaTitleEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-xs" 
                    placeholder="SEO Title EN"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">SEO Başlıq RU</label>
                  <input 
                    id="page-meta-title-ru"
                    type="text" 
                    value={metaTitleRu}
                    onChange={e => setMetaTitleRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-xs" 
                    placeholder="SEO Title RU"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">SEO Açıqlama AZ</label>
                  <input 
                    id="page-meta-desc-az"
                    type="text" 
                    value={metaDescAz}
                    onChange={e => setMetaDescAz(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-xs" 
                    placeholder="SEO Description AZ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">SEO Açıqlama EN</label>
                  <input 
                    id="page-meta-desc-en"
                    type="text" 
                    value={metaDescEn}
                    onChange={e => setMetaDescEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-xs" 
                    placeholder="SEO Description EN"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">SEO Açıqlama RU</label>
                  <input 
                    id="page-meta-desc-ru"
                    type="text" 
                    value={metaDescRu}
                    onChange={e => setMetaDescRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-xs" 
                    placeholder="SEO Description RU"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800">
            <button 
              type="button"
              onClick={() => { setIsFormOpen(false); setEditingPage(null); }}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
            >
              Ləğv Et
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <Check className="w-5 h-5" /> Yaddaşda Saxla & Yayımla
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-soft-md">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Səhifə axtar..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition-colors" 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">Yüklənir...</div>
        ) : filteredPages.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">Heç bir səhifə tapılmadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Səhifə Adı AZ</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Son Redaktə</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white">{page.title_az}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">/{page.slug}</td>
                    <td className="px-6 py-4">
                      {page.is_published 
                        ? <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Yayımlanıb</span>
                        : <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">Qaralama</span>
                      }
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a 
                          href={`/category/${page.slug}`} 
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
                          title="Bax"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleOpenForm(page)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" 
                          title="Redaktə"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(page.id)}
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
