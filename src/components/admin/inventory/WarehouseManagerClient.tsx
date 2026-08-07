"use client";

import React, { useState, useEffect } from 'react';
import { Building, MapPin, Truck, Shield, Bell, Plus, Edit3, Trash2, Loader2, X, Check } from 'lucide-react';
import { 
  getWarehouses, 
  createWarehouse, 
  updateWarehouse, 
  deleteWarehouse, 
  getGlobalReorderPoint, 
  updateGlobalReorderPoint, 
  Warehouse 
} from '@/lib/actions/inventory';

export default function WarehouseManagerClient() {
  const [globalReorder, setGlobalReorder] = useState(10);
  const [savingReorder, setSavingReorder] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const [resWh, resReorder] = await Promise.all([
      getWarehouses(),
      getGlobalReorderPoint()
    ]);

    if (resWh.success && resWh.warehouses) {
      setWarehouses(resWh.warehouses);
    } else {
      setError(resWh.error || 'Anbarları yükləmək mümkün olmadı.');
    }

    if (resReorder.success && typeof resReorder.reorderPoint === 'number') {
      setGlobalReorder(resReorder.reorderPoint);
    }

    setLoading(false);
  };

  const handleSaveReorder = async () => {
    setSavingReorder(true);
    setSaveSuccessMsg('');
    const res = await updateGlobalReorderPoint(globalReorder);
    if (res.success) {
      setSaveSuccessMsg('Qlobal Kritik Stok Həddi bazada uğurla saxlanıldı!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } else {
      alert(res.error || 'Yadda saxlamaq mümkün olmadı.');
    }
    setSavingReorder(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setNameInput('');
    setLocationInput('');
    setIsActiveInput(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingId(wh.id);
    setNameInput(wh.name);
    setLocationInput(wh.location || '');
    setIsActiveInput(wh.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSubmitting(true);
    if (editingId) {
      const res = await updateWarehouse(editingId, nameInput.trim(), locationInput.trim(), isActiveInput);
      if (res.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(res.error || 'Anbarı yeniləmək mümkün olmadı.');
      }
    } else {
      const res = await createWarehouse(nameInput.trim(), locationInput.trim());
      if (res.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(res.error || 'Yeni anbar yaratmaq mümkün olmadı.');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu anbarı silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarıla bilməz.')) return;
    const res = await deleteWarehouse(id);
    if (res.success) {
      fetchData();
    } else {
      alert(res.error || 'Anbarı silmək mümkün olmadı.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Global Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" /> Qlobal Stok Alarmları
            </h3>
            <p className="text-sm text-slate-400 mt-1">Sistem üzrə standart reorder point (minimum stok səviyyəsi) konfiqurasiyası.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Global Reorder Point</label>
            <input 
              type="number" 
              min="0"
              value={globalReorder}
              onChange={(e) => setGlobalReorder(Number(e.target.value))}
              className="w-24 bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors text-center" 
            />
            <button 
              onClick={handleSaveReorder}
              disabled={savingReorder}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl transition-colors flex items-center gap-2"
            >
              {savingReorder && <Loader2 className="w-4 h-4 animate-spin" />}
              Yadda Saxla
            </button>
          </div>
        </div>
        {saveSuccessMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            {saveSuccessMsg}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-white">Anbarlar & Lokasiyalar</h3>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" /> Yeni Anbar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Anbarlar yüklənir...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {warehouses.map(wh => (
            <div key={wh.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${wh.is_active ? 'bg-slate-800 text-amber-500' : 'bg-slate-950 text-slate-600'}`}>
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg flex items-center gap-2">
                      {wh.name}
                      {!wh.is_active && (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] uppercase font-black tracking-wider rounded border border-red-500/20">Deaktiv</span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-400 font-mono mt-0.5">{wh.location || 'Ünvan qeyd edilməyib'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(wh)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(wh.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Təhvil Məntəqəsi</div>
                      <div className="text-[9px] text-slate-500">Müştəri təhvil ala bilər</div>
                    </div>
                  </div>
                  <div className={`w-8 h-5 rounded-full p-1 transition-colors bg-green-500`}>
                    <div className="w-3 h-3 bg-white rounded-full translate-x-3" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Drop Ship</div>
                      <div className="text-[9px] text-slate-500">Birbaşa çatdırılma</div>
                    </div>
                  </div>
                  <div className={`w-8 h-5 rounded-full p-1 transition-colors bg-purple-500`}>
                    <div className="w-3 h-3 bg-white rounded-full translate-x-3" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> İcazəli Rollar (Warehouse Roles)
                </h5>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
                    Admin
                  </span>
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
                    Stok Meneceri
                  </span>
                </div>
              </div>
            </div>
          ))}
          {warehouses.length === 0 && (
            <div className="col-span-2 text-center p-12 bg-slate-900 border border-slate-800 rounded-3xl text-slate-500">
              Anbar məlumatı tapılmadı. Yeni anbar yaradın.
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">
              {editingId ? 'Anbarı Yenilə' : 'Yeni Anbar Əlavə Et'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Anbar Adı</label>
                <input 
                  type="text" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Məsələn: Gənclik Filialı"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Ünvan / Lokasiya</label>
                <input 
                  type="text" 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Məsələn: Atatürk prospekti 45"
                />
              </div>

              {editingId && (
                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={isActiveInput}
                    onChange={(e) => setIsActiveInput(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-white select-none">Aktiv anbar</label>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors hover:bg-slate-700"
                >
                  Ləğv Et
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Check className="w-4 h-4" /> Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
