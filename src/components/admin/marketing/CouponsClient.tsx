"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Calendar, Percent, Edit3, Trash2, Check, X, Loader2 } from 'lucide-react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, CouponData } from '@/lib/actions/coupons';

export default function CouponsClient() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [minSpend, setMinSpend] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    const res = await getCoupons();
    if (res.success) {
      setCoupons(res.coupons as CouponData[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(0);
    setMinSpend(0);
    setUsageLimit(0);
    setExpiresAt('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (coupon: CouponData) => {
    setEditingId(coupon.id || null);
    setCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setDiscountValue(Number(coupon.discount_value));
    setMinSpend(Number(coupon.min_spend || 0));
    setUsageLimit(Number(coupon.usage_limit || 0));
    setExpiresAt(coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '');
    setIsActive(coupon.is_active !== undefined ? coupon.is_active : true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || discountValue <= 0) return;

    setSaving(true);
    const couponPayload: CouponData = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_spend: Number(minSpend),
      usage_limit: usageLimit > 0 ? Number(usageLimit) : undefined,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: isActive
    };

    let res;
    if (editingId) {
      res = await updateCoupon(editingId, couponPayload);
    } else {
      res = await createCoupon(couponPayload);
    }

    setSaving(false);
    if (res.success) {
      setIsFormOpen(false);
      fetchCoupons();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kuponu silmək istədiyinizdən əminsiniz?')) return;
    const res = await deleteCoupon(id);
    if (res.success) {
      fetchCoupons();
    } else {
      alert('Kupon silinərkən xəta: ' + res.error);
    }
  };

  const handleToggleActive = async (coupon: CouponData) => {
    if (!coupon.id) return;
    const res = await updateCoupon(coupon.id, { is_active: !coupon.is_active });
    if (res.success) {
      fetchCoupons();
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-500" /> Kuponlar & Endirimlər
          </h2>
          <p className="text-sm text-slate-400 mt-1">Promo kodların yaradılması və idarəedilməsi.</p>
        </div>
        <button 
          onClick={isFormOpen ? () => setIsFormOpen(false) : handleOpenCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? 'Ləğv Et' : 'Yeni Kupon'}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md animate-in slide-in-from-top-4 duration-300 space-y-6">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            {editingId ? 'Kupon Düzəlişi' : 'Kupon Yaradılması'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Kupon Kodu</label>
              <input 
                type="text" 
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 uppercase" 
                placeholder="Məs: YAY2024" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Endirim Tipi</label>
              <select 
                value={discountType}
                onChange={e => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 appearance-none font-medium"
              >
                <option value="percentage">Faiz Endirimi (%)</option>
                <option value="fixed">Sabit Məbləğ (₼)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Dəyər ({discountType === 'percentage' ? '%' : '₼'})
              </label>
              <input 
                type="number" 
                value={discountValue || ''}
                onChange={e => setDiscountValue(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                placeholder="10" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Minimum Sifariş (₼)</label>
              <input 
                type="number" 
                value={minSpend || ''}
                onChange={e => setMinSpend(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                placeholder="50" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">İstifadə Limiti (Ümumi)</label>
              <input 
                type="number" 
                value={usageLimit || ''}
                onChange={e => setUsageLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                placeholder="Məs: 100 (Boş = Limitsiz)" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Bitmə Tarixi</label>
              <input 
                type="date" 
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input 
                type="checkbox" 
                id="isActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 focus:ring-2"
              />
              <label htmlFor="isActive" className="text-sm font-black text-white uppercase tracking-wider select-none cursor-pointer">Aktiv Statusu</label>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Yadda Saxla
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-soft-md">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-950/50">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Aktiv & Keçmiş Kuponlar</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Kod axtar..." 
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition-colors" 
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Kuponlar yüklənir...
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Heç bir kupon tapılmadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Kod</th>
                  <th className="px-6 py-4">Endirim</th>
                  <th className="px-6 py-4">Min. Sifariş</th>
                  <th className="px-6 py-4">İstifadə</th>
                  <th className="px-6 py-4">Bitmə Tarixi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-slate-800 text-white font-mono font-bold rounded-lg border border-slate-700">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ₼`}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {Number(coupon.min_spend) > 0 ? `${coupon.min_spend} ₼` : 'Yoxdur'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {coupon.used_count || 0} / {coupon.usage_limit || '∞'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Limitsiz'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleActive(coupon)}
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border transition-colors ${
                          coupon.is_active 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {coupon.is_active ? 'Aktiv' : 'Deaktiv'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEditForm(coupon)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => coupon.id && handleDelete(coupon.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
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
