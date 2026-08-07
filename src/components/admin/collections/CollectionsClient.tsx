"use client";

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit3, Trash2, Check, X, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';
import { getCollections, createCollection, updateCollection, deleteCollection } from '@/lib/actions/admin';
import { getProducts } from '@/lib/actions/catalog';
import { MediaUploadField } from '@/components/admin/MediaUploadField';

interface Collection {
  id: string;
  name_az: string;
  name_en: string;
  name_ru: string;
  slug: string;
  description_az: string | null;
  description_en: string | null;
  description_ru: string | null;
  image_url: string | null;
  is_active: boolean;
  collection_products?: { product_id: string }[];
}

interface Product {
  id: string;
  name_az: string;
  sku: string;
}

export default function CollectionsClient() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [nameAz, setNameAz] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionAz, setDescriptionAz] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch collections
    const colRes = await getCollections();
    if (colRes.success && colRes.data) {
      setCollections(colRes.data as Collection[]);
    }

    // Fetch products
    const prodRes = await getProducts({ limit: 100 });
    if (prodRes.success && prodRes.data) {
      setProducts(prodRes.data as Product[]);
    }
    setLoading(false);
  };

  const handleOpenForm = (col?: Collection) => {
    if (col) {
      setEditingCollection(col);
      setNameAz(col.name_az || '');
      setNameEn(col.name_en || '');
      setNameRu(col.name_ru || '');
      setSlug(col.slug || '');
      setDescriptionAz(col.description_az || '');
      setDescriptionEn(col.description_en || '');
      setDescriptionRu(col.description_ru || '');
      setImageUrl(col.image_url || '');
      setIsActive(col.is_active ?? true);
      
      const mappedIds = col.collection_products?.map(cp => cp.product_id) || [];
      setSelectedProductIds(mappedIds);
    } else {
      setEditingCollection(null);
      setNameAz('');
      setNameEn('');
      setNameRu('');
      setSlug('');
      setDescriptionAz('');
      setDescriptionEn('');
      setDescriptionRu('');
      setImageUrl('');
      setIsActive(true);
      setSelectedProductIds([]);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAz || !slug) {
      alert('Kolleksiya adı AZ və Slug mütləq doldurulmalıdır.');
      return;
    }

    const payload = {
      name_az: nameAz,
      name_en: nameEn || nameAz,
      name_ru: nameRu || nameAz,
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description_az: descriptionAz || undefined,
      description_en: descriptionEn || undefined,
      description_ru: descriptionRu || undefined,
      image_url: imageUrl || undefined,
      is_active: isActive,
      product_ids: selectedProductIds,
    };

    let res;
    if (editingCollection) {
      res = await updateCollection(editingCollection.id, payload);
    } else {
      res = await createCollection(payload);
    }

    if (res.success) {
      setIsFormOpen(false);
      setEditingCollection(null);
      fetchData();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu kolleksiyanı silmək istədiyinizdən əminsiniz?')) {
      const res = await deleteCollection(id);
      if (res.success) {
        fetchData();
      } else {
        alert('Xəta baş verdi: ' + res.error);
      }
    }
  };

  const toggleProductSelect = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const filteredCollections = collections.filter(c => 
    c.name_az?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name_az?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div id="admin-collections-client" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" /> Kolleksiyalar
          </h2>
          <p className="text-sm text-slate-400 mt-1">Xüsusi qruplaşdırılmış kolleksiyaların idarəedilməsi və məhsullarla əlaqələndirilməsi.</p>
        </div>
        <button 
          id="btn-add-collection"
          onClick={() => isFormOpen ? setIsFormOpen(false) : handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? 'Ləğv Et' : 'Yeni Kolleksiya'}
        </button>
      </div>

      {isFormOpen && (
        <form id="collections-form" onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">
            {editingCollection ? 'Kolleksiyanı Redaktə Et' : 'Yeni Kolleksiya Yaradılması'}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Ad AZ</label>
                  <input 
                    type="text" 
                    value={nameAz}
                    onChange={e => {
                      setNameAz(e.target.value);
                      if (!editingCollection) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məs: Hədiyyəlik Kublar" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Ad EN</label>
                  <input 
                    type="text" 
                    value={nameEn}
                    onChange={e => setNameEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məs: Gift Cubes" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Ad RU</label>
                  <input 
                    type="text" 
                    value={nameRu}
                    onChange={e => setNameRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                    placeholder="Məs: Подарочные кубы" 
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
                  placeholder="hediyyelik-kublar" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Təsvir AZ</label>
                  <textarea 
                    rows={4}
                    value={descriptionAz}
                    onChange={e => setDescriptionAz(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 text-sm"
                    placeholder="Azərbaycan dilində təsviri..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Təsvir EN</label>
                  <textarea 
                    rows={4}
                    value={descriptionEn}
                    onChange={e => setDescriptionEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 text-sm"
                    placeholder="İngilis dilində təsviri..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Təsvir RU</label>
                  <textarea 
                    rows={4}
                    value={descriptionRu}
                    onChange={e => setDescriptionRu(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:outline-none focus:border-amber-500 text-sm"
                    placeholder="Rus dilində təsviri..."
                  ></textarea>
                </div>
              </div>
              
              <div>
                <MediaUploadField
                  label="Kolleksiya Şəkli (Cloudinary)"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  accept="image"
                  folder="rubikshop_collections"
                  placeholder="https://... kolleksiya şəkil URL-i yapışdırın və ya yükləyin"
                  description="Kolleksiya örtük görüntüsü Cloudinary CDN-də saxlanılır."
                />
                
                {imageUrl && (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50 p-2 max-w-sm">
                    <img 
                      src={imageUrl} 
                      alt="Collection Preview" 
                      className="w-full h-32 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/coll/800/400';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Məhsul Seçimi</h4>
                <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {selectedProductIds.length} Seçilib
                </span>
              </div>
              
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Məhsul axtar..." 
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredProducts.map(p => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleProductSelect(p.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-850 hover:border-slate-800 hover:bg-slate-900 text-left transition-all"
                    >
                      <div className="truncate pr-2">
                        <span className="block text-xs font-bold text-white truncate">{p.name_az}</span>
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">SKU: {p.sku}</span>
                      </div>
                      <div>
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-700 hover:text-slate-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-850">
                <div className="flex items-center gap-2">
                  <input 
                    id="col-active"
                    type="checkbox" 
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="col-active" className="text-xs font-bold text-slate-300">Aktiv Kolleksiya (Səhifədə göstərilsin)</label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-800">
            <button 
              type="button" 
              onClick={() => { setIsFormOpen(false); setEditingCollection(null); }}
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
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Kolleksiya axtar..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition-colors" 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">Yüklənir...</div>
        ) : filteredCollections.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">Heç bir kolleksiya tapılmadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Şəkil</th>
                  <th className="px-6 py-4">Kolleksiya Adı AZ</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Məhsul Sayı</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredCollections.map((col) => (
                  <tr key={col.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 rounded overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                        {col.image_url ? (
                          <img src={col.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{col.name_az}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">/collection/{col.slug}</td>
                    <td className="px-6 py-4 font-bold text-amber-500 font-mono">
                      {col.collection_products?.length || 0} məhsul
                    </td>
                    <td className="px-6 py-4">
                      {col.is_active 
                        ? <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Aktiv</span>
                        : <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">Passiv</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenForm(col)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" 
                          title="Redaktə"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(col.id)}
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
