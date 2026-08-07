"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Edit3, Trash2, X, Layers, Save, RefreshCw, Folder, ArrowRight, Download, FileText
} from 'lucide-react';
import Image from 'next/image';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '@/lib/actions/catalog';
import { bulkImportCategoriesAction, BulkImportResult } from '@/lib/actions/admin';

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

export default function CategoriesListClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
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
    name_az: '',
    name_en: '',
    name_ru: '',
    slug_az: '',
    slug_en: '',
    slug_ru: '',
    parent_id: '',
    image_url: ''
  });

  // Tracking if user manually modified slugs during add
  const [addSlugEdited, setAddSlugEdited] = useState({ az: false, en: false, ru: false });

  // Form states for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name_az: '',
    name_en: '',
    name_ru: '',
    slug_az: '',
    slug_en: '',
    slug_ru: '',
    parent_id: '',
    image_url: ''
  });

  // Deletion confirmation state
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      } else {
        setErrorMsg('Kateqoriyalar yüklənərkən xəta baş verdi.');
      }
    } catch (err: any) {
      setErrorMsg('Gözlənilməz xəta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Sync adding form name to slugs
  useEffect(() => {
    if (!addSlugEdited.az) {
      setAddForm(prev => ({ ...prev, slug_az: slugify(prev.name_az) }));
    }
  }, [addForm.name_az, addSlugEdited.az]);

  useEffect(() => {
    if (!addSlugEdited.en) {
      setAddForm(prev => ({ ...prev, slug_en: slugify(prev.name_en) }));
    }
  }, [addForm.name_en, addSlugEdited.en]);

  useEffect(() => {
    if (!addSlugEdited.ru) {
      setAddForm(prev => ({ ...prev, slug_ru: slugify(prev.name_ru) }));
    }
  }, [addForm.name_ru, addSlugEdited.ru]);

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
      const res = await bulkImportCategoriesAction(parsedData);
      setBulkResult(res);
      if (res.success || res.count > 0) {
        setSuccessMsg(`${res.count} kateqoriya uğurla daxil edildi! (${res.skipped} buraxıldı)`);
        fetchCategories();
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
  const handleEditClick = (category: any) => {
    setEditingId(category.id);
    setEditForm({
      name_az: category.name_az || '',
      name_en: category.name_en || '',
      name_ru: category.name_ru || '',
      slug_az: category.slug_az || '',
      slug_en: category.slug_en || '',
      slug_ru: category.slug_ru || '',
      parent_id: category.parent_id || '',
      image_url: category.image_url || ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditModalOpen(true);
  };

  // Handle category deletion
  const handleDeleteClick = (category: any) => {
    setCategoryToDelete(category);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setErrorMsg('');
    try {
      const res = await deleteCategory(categoryToDelete.id);
      if (res.success) {
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        setCategoryToDelete(null);
        setSuccessMsg('Kateqoriya uğurla silindi!');
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

  // Submit new category
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name_az: addForm.name_az.trim(),
        name_en: addForm.name_en.trim() || addForm.name_az.trim(),
        name_ru: addForm.name_ru.trim() || addForm.name_az.trim(),
        slug_az: addForm.slug_az.trim() || slugify(addForm.name_az),
        slug_en: addForm.slug_en.trim() || slugify(addForm.name_en || addForm.name_az),
        slug_ru: addForm.slug_ru.trim() || slugify(addForm.name_ru || addForm.name_az),
        parent_id: addForm.parent_id || null,
        image_url: addForm.image_url.trim() || undefined
      };

      const res = await createCategory(payload);
      if (res.success && res.data) {
        setCategories(prev => [res.data, ...prev]);
        setIsAddModalOpen(false);
        setAddForm({
          name_az: '', name_en: '', name_ru: '',
          slug_az: '', slug_en: '', slug_ru: '',
          parent_id: '', image_url: ''
        });
        setAddSlugEdited({ az: false, en: false, ru: false });
        setSuccessMsg('Kateqoriya uğurla yaradıldı!');
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

  // Submit category edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name_az: editForm.name_az.trim(),
        name_en: editForm.name_en.trim() || editForm.name_az.trim(),
        name_ru: editForm.name_ru.trim() || editForm.name_az.trim(),
        slug_az: editForm.slug_az.trim(),
        slug_en: editForm.slug_en.trim(),
        slug_ru: editForm.slug_ru.trim(),
        parent_id: editForm.parent_id || null,
        image_url: editForm.image_url.trim() || ''
      };

      const res = await updateCategory(editingId, payload);
      if (res.success && res.data) {
        setCategories(prev => prev.map(c => c.id === editingId ? res.data : c));
        setIsEditModalOpen(false);
        setEditingId(null);
        setSuccessMsg('Kateqoriya uğurla yeniləndi!');
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

  // Filtered categories lists
  const filteredCategories = categories.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (c.name_az || '').toLowerCase().includes(searchLower) ||
      (c.name_en || '').toLowerCase().includes(searchLower) ||
      (c.name_ru || '').toLowerCase().includes(searchLower) ||
      (c.slug_az || '').toLowerCase().includes(searchLower)
    );
  });

  // Get parent category name
  const getParentName = (parentId: string) => {
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name_az : '—';
  };

  return (
    <div className="space-y-6 text-white font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-500" /> Kateqoriya İdarəetməsi
          </h2>
          <p className="text-sm text-slate-400 mt-1">Sürət kubları və tapmacaların kateqoriyalarını idarə edin.</p>
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
            <Plus className="w-4 h-4" /> Yeni Kateqoriya
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
              {filteredCategories.length} kateqoriya
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Axtar..."
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
                <th className="px-6 py-4 w-16">Şəkil</th>
                <th className="px-6 py-4">Kateqoriya Adı (AZ / EN / RU)</th>
                <th className="px-6 py-4">Link (Slug AZ)</th>
                <th className="px-6 py-4">Üst Kateqoriya</th>
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
              ) : filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      {category.image_url ? (
                        <Image 
                          src={category.image_url} 
                          alt={category.name_az} 
                          fill 
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Folder className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2 text-sm">
                        {category.name_az}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                        <span>{category.name_en || '—'}</span>
                        <span className="text-slate-600">•</span>
                        <span>{category.name_ru || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-amber-500">
                    /{category.slug_az || '—'}
                  </td>
                  <td className="px-6 py-4">
                    {category.parent_id ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60 font-semibold">
                        <Folder className="w-3.5 h-3.5 text-amber-500" /> {getParentName(category.parent_id)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Əsas Bölmə</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(category)} 
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" 
                        title="Redaktə et"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(category)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {!loading && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Layers className="w-12 h-12 text-slate-700 mb-3" />
                      <p className="text-sm">Heç bir kateqoriya tapılmadı.</p>
                      <p className="text-xs text-slate-600 mt-1">Yuxarıdakı düymədən yeni birini yarada bilərsiniz.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CATEGORY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" /> Yeni Kateqoriya
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                {/* Name fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Adı (AZ) <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      placeholder="məs. Sürət Kubları"
                      value={addForm.name_az} 
                      onChange={e => setAddForm({...addForm, name_az: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Adı (EN)</label>
                    <input 
                      type="text" 
                      placeholder="məs. Speed Cubes"
                      value={addForm.name_en} 
                      onChange={e => setAddForm({...addForm, name_en: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Adı (RU)</label>
                    <input 
                      type="text" 
                      placeholder="məs. Скоростные Кубы"
                      value={addForm.name_ru} 
                      onChange={e => setAddForm({...addForm, name_ru: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                </div>

                {/* Slug fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Slug (AZ)</label>
                    <input 
                      type="text" 
                      value={addForm.slug_az} 
                      onChange={e => {
                        setAddSlugEdited({...addSlugEdited, az: true});
                        setAddForm({...addForm, slug_az: e.target.value});
                      }} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Slug (EN)</label>
                    <input 
                      type="text" 
                      value={addForm.slug_en} 
                      onChange={e => {
                        setAddSlugEdited({...addSlugEdited, en: true});
                        setAddForm({...addForm, slug_en: e.target.value});
                      }} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Slug (RU)</label>
                    <input 
                      type="text" 
                      value={addForm.slug_ru} 
                      onChange={e => {
                        setAddSlugEdited({...addSlugEdited, ru: true});
                        setAddForm({...addForm, slug_ru: e.target.value});
                      }} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                </div>

                {/* Parent category and Image URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Üst Kateqoriya</label>
                    <select 
                      value={addForm.parent_id} 
                      onChange={e => setAddForm({...addForm, parent_id: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                    >
                      <option value="">— Əsas Bölmə (Üst kateqoriyası yoxdur) —</option>
                      {categories.filter(c => !c.parent_id).map(c => (
                        <option key={c.id} value={c.id}>{c.name_az}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Şəkil URL</label>
                    <input 
                      type="url" 
                      placeholder="https://picsum.photos/seed/..."
                      value={addForm.image_url} 
                      onChange={e => setAddForm({...addForm, image_url: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
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

      {/* EDIT CATEGORY MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" /> Kateqoriyanı Redaktə Et
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                {/* Name fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Adı (AZ) <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      value={editForm.name_az} 
                      onChange={e => setEditForm({...editForm, name_az: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Adı (EN)</label>
                    <input 
                      type="text" 
                      value={editForm.name_en} 
                      onChange={e => setEditForm({...editForm, name_en: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Adı (RU)</label>
                    <input 
                      type="text" 
                      value={editForm.name_ru} 
                      onChange={e => setEditForm({...editForm, name_ru: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                </div>

                {/* Slug fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Slug (AZ)</label>
                    <input 
                      required
                      type="text" 
                      value={editForm.slug_az} 
                      onChange={e => setEditForm({...editForm, slug_az: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Slug (EN)</label>
                    <input 
                      required
                      type="text" 
                      value={editForm.slug_en} 
                      onChange={e => setEditForm({...editForm, slug_en: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Slug (RU)</label>
                    <input 
                      required
                      type="text" 
                      value={editForm.slug_ru} 
                      onChange={e => setEditForm({...editForm, slug_ru: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-amber-500" 
                    />
                  </div>
                </div>

                {/* Parent category and Image URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Üst Kateqoriya</label>
                    <select 
                      value={editForm.parent_id} 
                      onChange={e => setEditForm({...editForm, parent_id: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
                    >
                      <option value="">— Əsas Bölmə (Üst kateqoriyası yoxdur) —</option>
                      {categories
                        // Filter out self and any category that has self as parent (to prevent cyclic / infinite loops)
                        .filter(c => c.id !== editingId && c.parent_id !== editingId)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name_az}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1 tracking-wider">Şəkil URL</label>
                    <input 
                      type="url" 
                      value={editForm.image_url} 
                      onChange={e => setEditForm({...editForm, image_url: e.target.value})} 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500" 
                    />
                  </div>
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
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Kateqoriyanı Sil</h3>
              <p className="text-sm text-slate-400 mb-1">
                <strong className="text-white">&quot;{categoryToDelete.name_az}&quot;</strong> kateqoriyasını silmək istədiyinizə əminsiniz?
              </p>
              <p className="text-xs text-slate-500 mb-6">
                Bu kateqoriyaya aid olan məhsulların kateqoriya əlaqələri avtomatik olaraq təmizlənəcək. Bu əməliyyat geri qaytarıla bilməz.
              </p>
              
              <div className="flex justify-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setCategoryToDelete(null)} 
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
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-500" /> Kateqoriyaları Toplu Daxil Et (JSON)
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
                  placeholder={`[\n  {\n    "name_az": "3x3 Kublar",\n    "name_en": "3x3 Cubes",\n    "slug_az": "3x3-kublar"\n  }\n]`}
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
