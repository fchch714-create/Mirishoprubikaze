"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit3, Trash2, Check, X, Image as ImageIcon, Eye } from 'lucide-react';
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '@/lib/actions/admin';
import { MediaUploadField } from '@/components/admin/MediaUploadField';

interface BlogPost {
  id: string;
  title_az: string;
  title_en: string;
  title_ru: string;
  slug: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  featured_image: string | null;
  is_published: boolean;
  created_at: string;
}

export default function BlogClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [titleAz, setTitleAz] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [slug, setSlug] = useState('');
  const [contentAz, setContentAz] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentRu, setContentRu] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const res = await getBlogPosts();
    if (res.success && res.data) {
      setPosts(res.data as BlogPost[]);
    }
    setLoading(false);
  };

  const handleOpenForm = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setTitleAz(post.title_az || '');
      setTitleEn(post.title_en || '');
      setTitleRu(post.title_ru || '');
      setSlug(post.slug || '');
      setContentAz(post.content_az || '');
      setContentEn(post.content_en || '');
      setContentRu(post.content_ru || '');
      setFeaturedImage(post.featured_image || '');
      setIsPublished(post.is_published ?? true);
    } else {
      setEditingPost(null);
      setTitleAz('');
      setTitleEn('');
      setTitleRu('');
      setSlug('');
      setContentAz('');
      setContentEn('');
      setContentRu('');
      setFeaturedImage('');
      setIsPublished(true);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAz || !slug || !contentAz) {
      alert('Başlıq AZ, Slug və Məzmun AZ mütləq daxil edilməlidir.');
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
      featured_image: featuredImage || undefined,
      is_published: isPublished,
    };

    let res;
    if (editingPost) {
      res = await updateBlogPost(editingPost.id, payload);
    } else {
      res = await createBlogPost(payload);
    }

    if (res.success) {
      setIsFormOpen(false);
      setEditingPost(null);
      fetchPosts();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu məqaləni silmək istədiyinizdən əminsiniz?')) {
      const res = await deleteBlogPost(id);
      if (res.success) {
        fetchPosts();
      } else {
        alert('Xəta baş verdi: ' + res.error);
      }
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title_az?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="admin-blog-client" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" /> Blog İdarəetməsi
          </h2>
          <p className="text-sm text-slate-400 mt-1">Məqalələrin və xəbərlərin real Supabase üzərindən idarəedilməsi.</p>
        </div>
        <button 
          id="btn-add-post"
          onClick={() => isFormOpen ? setIsFormOpen(false) : handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? 'Ləğv Et' : 'Yeni Məqalə'}
        </button>
      </div>

      {isFormOpen && (
        <form id="blog-form" onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">
            {editingPost ? 'Məqaləni Redaktə Et' : 'Yeni Məqalə Yaradılması'}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq AZ</label>
                  <input 
                    type="text" 
                    value={titleAz}
                    onChange={e => {
                      setTitleAz(e.target.value);
                      if (!editingPost) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məqalə başlığı AZ..." 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq EN</label>
                  <input 
                    type="text" 
                    value={titleEn}
                    onChange={e => setTitleEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məqalə başlığı EN..." 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlıq RU</label>
                  <input 
                    type="text" 
                    value={titleRu}
                    onChange={e => setTitleRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məqalə başlığı RU..." 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Slug (URL)</label>
                <input 
                  type="text" 
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-400 font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                  placeholder="rubik-kubu-tez-yiqmaq" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məzmun AZ (HTML/Text)</label>
                  <textarea 
                    rows={12}
                    value={contentAz}
                    onChange={e => setContentAz(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 font-sans text-sm"
                    placeholder="Məzmun AZ..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məzmun EN (HTML/Text)</label>
                  <textarea 
                    rows={12}
                    value={contentEn}
                    onChange={e => setContentEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 font-sans text-sm"
                    placeholder="Məzmun EN..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məzmun RU (HTML/Text)</label>
                  <textarea 
                    rows={12}
                    value={contentRu}
                    onChange={e => setContentRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 font-sans text-sm"
                    placeholder="Məzmun RU..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <MediaUploadField
                  label="Ön Şəkil (Cloudinary)"
                  value={featuredImage}
                  onChange={(url) => setFeaturedImage(url)}
                  accept="image"
                  folder="rubikshop_blog"
                  placeholder="https://... məqalə şəkli URL-i yapışdırın və ya yükləyin"
                  description="Məqalə örtük şəkli Cloudinary CDN-də saxlanılır."
                />
                
                {featuredImage && (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50 p-2">
                    <img 
                      src={featuredImage} 
                      alt="Featured Önizləmə" 
                      className="w-full h-40 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/blog/800/400';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    id="post-published"
                    type="checkbox" 
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="post-published" className="text-sm font-bold text-slate-300">Yayımla (Saytda aktiv olsun)</label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800">
            <button 
              type="button" 
              onClick={() => { setIsFormOpen(false); setEditingPost(null); }}
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
              placeholder="Məqalə axtar..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition-colors" 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">Yüklənir...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">Heç bir məqalə tapılmadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Şəkil</th>
                  <th className="px-6 py-4">Başlıq AZ</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Tarix</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 rounded overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                        {post.featured_image ? (
                          <img src={post.featured_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white max-w-xs truncate">{post.title_az}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">/{post.slug}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {post.is_published 
                        ? <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Yayımlanıb</span>
                        : <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">Qaralama</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a 
                          href={`/blog/${post.slug}`} 
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
                          title="Bax"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleOpenForm(post)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" 
                          title="Redaktə"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(post.id)}
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
