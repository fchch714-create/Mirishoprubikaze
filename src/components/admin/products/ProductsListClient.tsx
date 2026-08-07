"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, Edit3, Trash2, Download, Upload, Copy,
  CheckSquare, Square, Tag, Star, EyeOff, X, Save
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { bulkImportProductsAction, BulkImportResult } from '@/lib/actions/admin';
import { sanitizeImageUrl } from '@/lib/image';

// Helper to convert AZ/RU characters and spaces into clean URL slugs
const slugify = (text: string) => {
  const map: { [key: string]: string } = {
    'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
    'ı': 'i', 'ə': 'e', 'ö': 'o', 'ğ': 'g', 'ç': 'c', 'ş': 's', 'ü': 'u',
    'I': 'i', 'Ə': 'e', 'Ö': 'o', 'Ğ': 'g', 'Ç': 'c', 'Ş': 's', 'Ü': 'u',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return text
    .split('')
    .map(char => map[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')     // Remove non-alphanumeric except spaces/hyphens
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-');             // Replace multiple hyphens
};

export default function ProductsListClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title_az: '',
    title_en: '',
    title_ru: '',
    price_azn: 0,
    stock_quantity: 0,
    image_url: '',
    category_id: '3x3'
  });

  // Bulk Import state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Deletion confirmation state
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productToDelete);
      if (error) {
        alert('Silinmə zamanı xəta baş verdi: ' + error.message);
      } else {
        setProducts(prev => prev.filter(p => p.id !== productToDelete));
        setSelectedProducts(prev => prev.filter(pId => pId !== productToDelete));
      }
    } catch (err: any) {
      alert('Silinmə zamanı xəta baş verdi: ' + (err.message || err));
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Bulk import handler with try/catch JSON validation
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    setBulkResult(null);

    let parsedData: any[];
    try {
      parsedData = JSON.parse(bulkJsonText.trim());
      if (!Array.isArray(parsedData)) {
        throw new Error('Massiv deyil');
      }
    } catch {
      setBulkError('Düzgün JSON formatı daxil edin!');
      return;
    }

    setIsBulkImporting(true);
    try {
      const res = await bulkImportProductsAction(parsedData);
      setBulkResult(res);
      if (res.success || res.count > 0) {
        setSuccessMsg(`${res.count} məhsul uğurla daxil edildi! (${res.skipped} buraxıldı)`);
        fetchProducts();
        router.refresh();
      } else {
        setBulkError(res.errors[0] || 'Toplu daxil etmədə xəta baş verdi.');
      }
    } catch (err: any) {
      setBulkError('Gözlənilməz xəta: ' + err.message);
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Auto-generate clean, unique slug from title_az
    const generatedSlug = slugify(newProduct.title_az) + '-' + Math.floor(1000 + Math.random() * 9000);

    // Insert without ID so Supabase generates UUID
    const { data, error } = await supabase.from('products').insert([
      {
        title_az: newProduct.title_az,
        title_en: newProduct.title_en || newProduct.title_az,
        title_ru: newProduct.title_ru || newProduct.title_az,
        slug: generatedSlug,
        description_az: newProduct.title_az,
        description_en: newProduct.title_en || newProduct.title_az,
        description_ru: newProduct.title_ru || newProduct.title_az,
        price_azn: newProduct.price_azn,
        stock_quantity: newProduct.stock_quantity,
        image_url: newProduct.image_url || 'https://picsum.photos/seed/newprod/600/600',
        category_id: newProduct.category_id,
        category_slug: newProduct.category_id,
        is_active: true
      }
    ]);

    setIsSubmitting(false);
    if (!error) {
      setIsModalOpen(false);
      setNewProduct({
        title_az: '', title_en: '', title_ru: '', price_azn: 0, stock_quantity: 0, image_url: '', category_id: '3x3'
      });
      fetchProducts();
    } else {
      alert('Xəta baş verdi: ' + error.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const title = p.title_az || p.title || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const pStatus = p.is_active ? 'Publish' : 'Draft';
    const matchesStatus = statusFilter === 'All' || pStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Məhsul İdarəetməsi</h2>
          <p className="text-sm text-slate-400 mt-1">Bütün məhsullarınızı yaradın, redaktə edin və idarə edin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setBulkJsonText('');
              setBulkError('');
              setBulkResult(null);
              setIsBulkModalOpen(true);
            }} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-sm rounded-xl transition-all shadow-lg"
          >
            <Download className="w-4 h-4" /> 📥 Toplu Daxil Et
          </button>

          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all border border-slate-700"
            title="Tez şəkildə yalnız əsas məlumatları daxil edərək məhsul yarat"
          >
            <Plus className="w-4 h-4" /> Tez Əlavə Et
          </button>
          
          <Link 
            href="/az/admin/products/new" 
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
            title="SEO, kateqoriya, brend və Rubik kubu xüsusiyyətləri olan tam məhsul yarat"
          >
            <Plus className="w-4 h-4" /> Yeni Məhsul (Ətraflı)
          </Link>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-bold">
          {successMsg}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-soft-md">
        {/* Filters Bar */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
            {['All', 'Publish', 'Draft'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-transparent hover:text-white'
                }`}
              >
                {status === 'All' ? 'Hamısı' : status === 'Publish' ? 'Aktiv' : 'Qaralama'}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Məhsul adı..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-amber-500 transition-colors">
                    {selectedProducts.length > 0 && selectedProducts.length === products.length ? (
                      <CheckSquare className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Məhsul</th>
                <th className="px-6 py-4">Qiymət</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Yüklənir...</td>
                </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleSelect(product.id)} className="text-slate-500 hover:text-amber-500 transition-colors">
                      {selectedProducts.includes(product.id) ? (
                        <CheckSquare className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                        <Image src={sanitizeImageUrl(product.image_url, product.id)} alt={product.title_az || 'Product'} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {product.title_az}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">{Number(product.price_azn).toFixed(2)} AZN</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-black ${
                      product.stock_quantity > 10 ? 'text-green-400 bg-green-400/10' : 
                      product.stock_quantity > 0 ? 'text-amber-400 bg-amber-400/10' : 
                      'text-red-400 bg-red-400/10'
                    }`}>
                      {product.stock_quantity} ədəd
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                      product.is_active ? 'border-green-500/20 text-green-400 bg-green-500/10' :
                      'border-slate-500/20 text-slate-400 bg-slate-500/10'
                    }`}>
                      {product.is_active ? 'Aktiv' : 'Qaralama'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/az/admin/products/${product.id}`} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Redaktə et">
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDeleteClick(product.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-10 h-10 text-slate-700 mb-3" />
                      <p className="text-sm">No products found. Zəhmət olmasa yeni məhsul əlavə edin.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Yeni Məhsul Əlavə Et</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Başlıq (AZ)</label>
                  <input required type="text" value={newProduct.title_az} onChange={e => setNewProduct({...newProduct, title_az: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Başlıq (EN)</label>
                    <input type="text" value={newProduct.title_en} onChange={e => setNewProduct({...newProduct, title_en: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Başlıq (RU)</label>
                    <input type="text" value={newProduct.title_ru} onChange={e => setNewProduct({...newProduct, title_ru: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Qiymət (AZN)</label>
                    <input required type="number" step="0.01" value={newProduct.price_azn} onChange={e => setNewProduct({...newProduct, price_azn: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Stok Miqdarı</label>
                    <input required type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Kateqoriya</label>
                    <select
                      value={newProduct.category_id}
                      onChange={e => setNewProduct({...newProduct, category_id: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="3x3">3x3 Kub</option>
                      <option value="2x2">2x2 Kub</option>
                      <option value="4x4">4x4 Kub</option>
                      <option value="5x5">5x5 Kub</option>
                      <option value="6x6">6x6 Kub</option>
                      <option value="7x7">7x7 Kub</option>
                      <option value="pyraminx">Pyraminx</option>
                      <option value="skewb">Skewb</option>
                      <option value="megaminx">Megaminx</option>
                      <option value="square-1">Square-1</option>
                      <option value="clock">Clock</option>
                      <option value="lubes">Yağlar (Lubes)</option>
                      <option value="timers">Taymerlər (Timers)</option>
                      <option value="mats">Xalçalar (Mats)</option>
                      <option value="bags">Çantalar (Bags)</option>
                      <option value="cases">Qutular / Keyçeyn</option>
                      <option value="accessories">Aksesuarlar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Şəkil URL</label>
                    <input required type="url" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" placeholder="https://picsum.photos/seed/..." />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700">İmtina</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50">
                  {isSubmitting ? 'Saxlanılır...' : 'Yadda Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DELETE CONFIRMATION MODAL */}
      {productToDelete && (
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
                  onClick={() => setProductToDelete(null)} 
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Ləğv Et
                </button>
                <button 
                  type="button" 
                  onClick={handleConfirmDelete} 
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
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
      {/* BULK IMPORT MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-500" /> Məhsulları Toplu Daxil Et (JSON)
              </h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="p-6 space-y-5">
              {bulkError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold flex items-center gap-2">
                  <X className="w-5 h-5 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {bulkResult && (
                <div className={`p-4 rounded-xl text-sm font-bold space-y-2 border ${bulkResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                  <p>
                    Əlavə edildi: <strong>{bulkResult.count}</strong> | Buraxıldı: <strong>{bulkResult.skipped}</strong>
                  </p>
                  {bulkResult.errors.length > 0 && (
                    <ul className="text-xs list-disc list-inside space-y-1 text-red-400 max-h-32 overflow-y-auto pt-2 border-t border-slate-800">
                      {bulkResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">
                  JSON Massivi Daxil Edin
                </label>
                <textarea
                  required
                  rows={12}
                  placeholder={`[\n  {\n    "title_az": "MoYu RS3M 2020",\n    "price_azn": 24.90,\n    "category_slug": "3x3-kublar",\n    "brand_slug": "moyu",\n    "image_url": "https://picsum.photos/600/600",\n    "stock_quantity": 15\n  }\n]`}
                  value={bulkJsonText}
                  onChange={(e) => {
                    setBulkJsonText(e.target.value);
                    setBulkError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-mono rounded-xl p-4 text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm font-bold"
                >
                  Bağla
                </button>
                <button
                  type="submit"
                  disabled={isBulkImporting || !bulkJsonText.trim()}
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm uppercase flex items-center gap-2"
                >
                  {isBulkImporting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
                      Daxil Edilir...
                    </>
                  ) : (
                    '📥 Yüklə və Daxil Et'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
