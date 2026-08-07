"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Edit3, Trash2, X, Package, Save, RefreshCw, Folder, ArrowRight, AlertTriangle, Download
} from 'lucide-react';
import Image from 'next/image';
import { 
  getBrands, 
  createBrand, 
  updateBrand, 
  deleteBrand,
  getProducts
} from '@/lib/actions/catalog';
import { bulkImportBrandsAction, BulkImportResult } from '@/lib/actions/admin';

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

export default function BrandsListClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bulk Import state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Form states for adding
  const [addForm, setAddForm] = useState({
    name: '',
    slug: '',
    logo_url: '',
    description: ''
  });

  // Tracking if user manually modified slugs during add
  const [addSlugEdited, setAddSlugEdited] = useState(false);

  // Form states for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    logo_url: '',
    description: ''
  });

  // Deletion confirmation state
  const [brandToDelete, setBrandToDelete] = useState<any | null>(null);
  const [isCheckingProducts, setIsCheckingProducts] = useState(false);
  const [associatedProductsCount, setAssociatedProductsCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all brands
  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await getBrands();
      if (res.success && res.data) {
        setBrands(res.data);
      } else {
        setErrorMsg('Brendlər yüklənərkən xəta baş verdi.');
      }
    } catch (err: any) {
      setErrorMsg('Gözlənilməz xəta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Sync adding form name to slugs
  useEffect(() => {
    if (!addSlugEdited) {
      setAddForm(prev => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [addForm.name, addSlugEdited]);

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
      const res = await bulkImportBrandsAction(parsedData);
      setBulkResult(res);
      if (res.success || res.count > 0) {
        setSuccessMsg(`${res.count} brend uğurla daxil edildi! (${res.skipped} buraxıldı)`);
        fetchBrands();
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

  // Open Edit modal and populate
  const handleEditClick = (brand: any) => {
    setEditingId(brand.id);
    setEditForm({
      name: brand.name || '',
      slug: brand.slug || '',
      logo_url: brand.logo_url || '',
      description: brand.description || ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditModalOpen(true);
  };

  // Handle brand deletion check
  const handleDeleteClick = async (brand: any) => {
    setBrandToDelete(brand);
    setIsCheckingProducts(true);
    setAssociatedProductsCount(null);
    setErrorMsg('');

    try {
      // Fetch products with this brand ID to check if we can delete it
      const res = await getProducts({ brandId: brand.id, limit: 1 });
      if (res.success) {
        // If count is not explicitly set, we check if data has items
        const count = res.count !== undefined ? res.count : (res.data ? res.data.length : 0);
        setAssociatedProductsCount(count);
      } else {
        setAssociatedProductsCount(0); // fallback
      }
    } catch (err) {
      console.error('Error checking associated products:', err);
      setAssociatedProductsCount(0);
    } finally {
      setIsCheckingProducts(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!brandToDelete) return;
    setIsDeleting(true);
    setErrorMsg('');
    try {
      const res = await deleteBrand(brandToDelete.id);
      if (res.success) {
        setBrands(prev => prev.filter(b => b.id !== brandToDelete.id));
        setBrandToDelete(null);
        setSuccessMsg('Brend uğurla silindi!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('Silinmə xətası: ' + (res.error || 'Naməlum xəta'));
      }
    } catch (err: any) {
      setErrorMsg('Silinmə zamanı xəta: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit new brand
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: addForm.name.trim(),
        slug: addForm.slug.trim() || slugify(addForm.name),
        logo_url: addForm.logo_url.trim() || undefined,
        description: addForm.description.trim() || undefined
      };

      const res = await createBrand(payload);
      if (res.success && res.data) {
        setBrands(prev => [res.data, ...prev]);
        setIsAddModalOpen(false);
        setAddForm({
          name: '', slug: '', logo_url: '', description: ''
        });
        setAddSlugEdited(false);
        setSuccessMsg('Brend uğurla yaradıldı!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('Yaradılma xətası: ' + (res.error || 'Naməlum xəta'));
      }
    } catch (err: any) {
      setErrorMsg('Xəta baş verdi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit brand edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        logo_url: editForm.logo_url.trim() || '',
        description: editForm.description.trim() || ''
      };

      const res = await updateBrand(editingId, payload);
      if (res.success && res.data) {
        setBrands(prev => prev.map(b => b.id === editingId ? res.data : b));
        setIsEditModalOpen(false);
        setEditingId(null);
        setSuccessMsg('Brend uğurla yeniləndi!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('Yenilənmə xətası: ' + (res.error || 'Naməlum xəta'));
      }
    } catch (err: any) {
      setErrorMsg('Xəta baş verdi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered brands lists
  const filteredBrands = brands.filter(b => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (b.name || '').toLowerCase().includes(searchLower) ||
      (b.slug || '').toLowerCase().includes(searchLower) ||
      (b.description || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 text-white font-sans p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" /> Brendlərin İdarə Edilməsi
          </h2>
          <p className="text-sm text-slate-400 mt-1">Sistemdə olan bütün sürət kubu istehsalçıları və brendləri.</p>
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
            onClick={() => setIsAddModalOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Yeni Brend
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-bold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Filters Bar */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Cəmi:</span>
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-xs font-bold text-amber-500">
              {filteredBrands.length} brend
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Brend axtar..."
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
                <th className="px-6 py-4 w-16">Loqo</th>
                <th className="px-6 py-4">Brend Adı</th>
                <th className="px-6 py-4">Link (Slug)</th>
                <th className="px-6 py-4">Təsvir</th>
                <th className="px-6 py-4 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                      Yüklənir...
                    </div>
                  </td>
                </tr>
              ) : filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      {brand.logo_url ? (
                        <Image 
                          src={brand.logo_url} 
                          alt={brand.name} 
                          fill 
                          className="object-contain p-1 bg-white"
                          unoptimized
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-sm">
                      {brand.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-amber-500">
                    /{brand.slug || '—'}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-slate-400">
                    {brand.description || <span className="text-slate-600 italic">Təsvir yoxdur</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(brand)} 
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" 
                        title="Redaktə et"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(brand)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {!loading && filteredBrands.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Package className="w-12 h-12 text-slate-700 mb-3" />
                      <p className="text-sm">Heç bir brend tapılmadı.</p>
                      <p className="text-xs text-slate-600 mt-1">Yuxarıdakı düymədən yeni brend yarada bilərsiniz.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD BRAND MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" /> Yeni Brend
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Brend Adı <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    placeholder="məs. GAN Cube"
                    value={addForm.name} 
                    onChange={e => setAddForm({...addForm, name: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Slug (Link üçün)</label>
                  <input 
                    type="text" 
                    placeholder="məs. gan-cube"
                    value={addForm.slug} 
                    onChange={e => {
                      setAddSlugEdited(true);
                      setAddForm({...addForm, slug: e.target.value});
                    }} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Loqo Şəkil URL</label>
                  <input 
                    type="url" 
                    placeholder="https://picsum.photos/seed/..."
                    value={addForm.logo_url} 
                    onChange={e => setAddForm({...addForm, logo_url: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Təsvir (Description)</label>
                  <textarea 
                    rows={3}
                    placeholder="Brend haqqında qısa məlumat..."
                    value={addForm.description} 
                    onChange={e => setAddForm({...addForm, description: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-5 border-t border-slate-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm font-bold"
                >
                  İmtina
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm uppercase flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
                      Yaradılır...
                    </>
                  ) : (
                    'Yarat'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRAND MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" /> Brendi Redaktə Et
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Brend Adı <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Slug (Link üçün)</label>
                  <input 
                    required
                    type="text" 
                    value={editForm.slug} 
                    onChange={e => setEditForm({...editForm, slug: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Loqo Şəkil URL</label>
                  <input 
                    type="url" 
                    value={editForm.logo_url} 
                    onChange={e => setEditForm({...editForm, logo_url: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Təsvir (Description)</label>
                  <textarea 
                    rows={3}
                    value={editForm.description} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-5 border-t border-slate-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingId(null);
                  }} 
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm font-bold"
                >
                  İmtina
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm uppercase flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
                      Yadda saxlanılır...
                    </>
                  ) : (
                    'Yadda Saxla'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {brandToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 text-center">
              
              {isCheckingProducts ? (
                <div className="py-12">
                  <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Məhsul əlaqələri yoxlanılır...</p>
                </div>
              ) : associatedProductsCount && associatedProductsCount > 0 ? (
                // BLOCKED: Brand has associated products
                <div>
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Silinmə Blokedildi!</h3>
                  <p className="text-sm text-slate-400 mb-2">
                    <strong className="text-white">&quot;{brandToDelete.name}&quot;</strong> brendinə aid <span className="text-amber-500 font-bold">{associatedProductsCount} məhsul</span> tapıldı.
                  </p>
                  <p className="text-xs text-slate-500 mb-6">
                    Bu brendi silmək üçün, ilk öncə bu brendə bağlı olan məhsulları başqa brendə köçürməli və ya həmin məhsulları silməlisiniz.
                  </p>
                  
                  <button 
                    type="button" 
                    onClick={() => setBrandToDelete(null)} 
                    className="w-full py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-bold uppercase"
                  >
                    Bağla
                  </button>
                </div>
              ) : (
                // SAFE TO DELETE
                <div>
                  <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Brendi Sil</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    <strong className="text-white">&quot;{brandToDelete.name}&quot;</strong> brendini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
                  </p>
                  
                  <div className="flex justify-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => setBrandToDelete(null)} 
                      disabled={isDeleting}
                      className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-bold"
                    >
                      Ləğv Et
                    </button>
                    <button 
                      type="button" 
                      onClick={handleConfirmDelete} 
                      disabled={isDeleting}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm uppercase"
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
              )}
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
                <Download className="w-5 h-5 text-amber-500" /> Brendləri Toplu Daxil Et (JSON)
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
                  rows={10}
                  placeholder={`[\n  {\n    "name": "GAN Cube",\n    "slug": "gan-cube",\n    "description": "Speedcube manufacturer"\n  }\n]`}
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
