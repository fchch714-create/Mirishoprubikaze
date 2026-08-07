"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Zap, Calendar, Play, Square, Trash2, X, Check, Loader2, Edit3 } from 'lucide-react';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, CampaignData } from '@/lib/actions/campaigns';
import { createClient } from '@/lib/supabase/client';

export default function CampaignsClient() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Selection sources
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [targetType, setTargetType] = useState<'all' | 'category' | 'product'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  
  const [saving, setSaving] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    const res = await getCampaigns();
    if (res.success) {
      setCampaigns(res.campaigns as CampaignData[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const supabaseClient = createClient();

    const fetchCampaignsInternal = async () => {
      setLoading(true);
      const res = await getCampaigns();
      if (res.success) {
        setCampaigns(res.campaigns as CampaignData[]);
      }
      setLoading(false);
    };

    const fetchTargetOptionsInternal = async () => {
      // Fetch products
      const { data: pData } = await supabaseClient.from('products').select('id, title_az').eq('is_active', true);
      setProducts(pData || []);
      
      // Fetch categories
      const { data: cData } = await supabaseClient.from('categories').select('id, name_az');
      setCategories(cData || []);
    };

    fetchCampaignsInternal();
    fetchTargetOptionsInternal();
  }, []);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setName('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(tomorrow.toISOString().split('T')[0]);
    setDiscountPercent(15);
    setTargetType('all');
    setSelectedIds([]);
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (camp: CampaignData) => {
    setEditingId(camp.id || null);
    setName(camp.name);
    setStartDate(camp.start_date ? new Date(camp.start_date).toISOString().split('T')[0] : '');
    setEndDate(camp.end_date ? new Date(camp.end_date).toISOString().split('T')[0] : '');
    setDiscountPercent(Number(camp.discount_percent));
    setTargetType(camp.target_type);
    setSelectedIds(camp.target_ids || []);
    setIsActive(camp.is_active !== undefined ? camp.is_active : true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || discountPercent <= 0 || discountPercent > 100 || !startDate || !endDate) return;

    setSaving(true);
    const payload: CampaignData = {
      name: name.trim(),
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      discount_percent: Number(discountPercent),
      target_type: targetType,
      target_ids: targetType === 'all' ? [] : selectedIds,
      is_active: isActive
    };

    let res;
    if (editingId) {
      res = await updateCampaign(editingId, payload);
    } else {
      res = await createCampaign(payload);
    }

    setSaving(false);
    if (res.success) {
      setIsFormOpen(false);
      fetchCampaigns();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kampaniyanı silmək istədiyinizdən əminsiniz?')) return;
    const res = await deleteCampaign(id);
    if (res.success) {
      fetchCampaigns();
    } else {
      alert('Kampaniya silinərkən xəta: ' + res.error);
    }
  };

  const handleToggleActive = async (camp: CampaignData) => {
    if (!camp.id) return;
    const res = await updateCampaign(camp.id, { is_active: !camp.is_active });
    if (res.success) {
      fetchCampaigns();
    }
  };

  const handleCheckboxChange = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getCampaignStatus = (camp: CampaignData) => {
    if (!camp.is_active) return 'inactive';
    const now = new Date();
    const start = new Date(camp.start_date);
    const end = new Date(camp.end_date);
    if (now < start) return 'scheduled';
    if (now > end) return 'ended';
    return 'active';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" /> Kampaniyalar & Flash Satışlar
          </h2>
          <p className="text-sm text-slate-400 mt-1">Avtomatik endirimlər və xüsusi tədbirlərin idarəedilməsi.</p>
        </div>
        <button 
          onClick={isFormOpen ? () => setIsFormOpen(false) : handleOpenCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? 'Ləğv Et' : 'Yeni Kampaniya'}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md animate-in slide-in-from-top-4 duration-300 space-y-6">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            {editingId ? 'Kampaniya Düzəlişi' : 'Yeni Kampaniya Yaradılması'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Kampaniya Adı</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Məs: Black Friday 2026, Yay Endirimi"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Endirim Faizi (%)</label>
              <input 
                type="number" 
                value={discountPercent || ''}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                required
                min="1"
                max="100"
                placeholder="15"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Başlama Tarixi</label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Bitmə Tarixi</label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Tətbiq Sahəsi (Hədəf)</label>
              <select 
                value={targetType}
                onChange={e => {
                  setTargetType(e.target.value as any);
                  setSelectedIds([]);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 appearance-none font-medium"
              >
                <option value="all">Bütün Məhsullar</option>
                <option value="category">Müəyyən Kateqoriyalar</option>
                <option value="product">Müəyyən Məhsullar</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input 
                type="checkbox" 
                id="isCampActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 focus:ring-2"
              />
              <label htmlFor="isCampActive" className="text-sm font-black text-white uppercase tracking-wider select-none cursor-pointer">Aktiv Statusu</label>
            </div>
          </div>

          {/* Multi-Selection targets */}
          {targetType !== 'all' && (
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                Hədəf {targetType === 'category' ? 'Kateqoriyaları' : 'Məhsulları'} Seçin:
              </label>
              <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {targetType === 'category' ? (
                  categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2.5 text-slate-300 hover:text-white text-xs font-bold cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(cat.id)}
                        onChange={() => handleCheckboxChange(cat.id)}
                        className="w-4 h-4 rounded border-slate-850 bg-slate-900 text-amber-500 focus:ring-amber-500"
                      />
                      <span>{cat.name_az}</span>
                    </label>
                  ))
                ) : (
                  products.map(prod => (
                    <label key={prod.id} className="flex items-center gap-2.5 text-slate-300 hover:text-white text-xs font-bold cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(prod.id)}
                        onChange={() => handleCheckboxChange(prod.id)}
                        className="w-4 h-4 rounded border-slate-850 bg-slate-900 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="truncate">{prod.title_az}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl uppercase transition-all"
            >
              Ləğv Et
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Yadda Saxla
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-soft-md">
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Kampaniyalar yüklənir...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Heç bir kampaniya tapılmadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Kampaniya Adı</th>
                  <th className="px-6 py-4">Hədəf növü</th>
                  <th className="px-6 py-4">Endirim Şərti</th>
                  <th className="px-6 py-4">Müddət</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {campaigns.map((camp) => {
                  const status = getCampaignStatus(camp);
                  return (
                    <tr key={camp.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4 font-bold text-white">{camp.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded border border-slate-700">
                          {camp.target_type === 'all' ? 'Bütün məhsullar' : camp.target_type === 'category' ? 'Kateqoriya' : 'Məhsullar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-amber-500">
                        {camp.discount_percent}% ENDİRİM
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                          <Calendar className="w-3 h-3" /> 
                          {camp.start_date ? new Date(camp.start_date).toLocaleDateString() : ''} - {camp.end_date ? new Date(camp.end_date).toLocaleDateString() : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {status === 'active' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Aktiv</span>}
                        {status === 'scheduled' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">Planlanıb</span>}
                        {status === 'ended' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-500 border border-slate-700">Bitib</span>}
                        {status === 'inactive' && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Deaktiv</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleToggleActive(camp)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" 
                            title={camp.is_active ? "Deaktiv Et" : "Aktiv Et"}
                          >
                            {camp.is_active ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleOpenEditForm(camp)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" 
                            title="Düzəliş et"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => camp.id && handleDelete(camp.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
