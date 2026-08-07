"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Gift, CreditCard, Send, Search, X, Check, Loader2, Trash2 } from 'lucide-react';
import { getGiftCards, createGiftCard, updateGiftCard, deleteGiftCard, GiftCardData } from '@/lib/actions/gift-cards';

export default function GiftCardsClient() {
  const [giftCards, setGiftCards] = useState<GiftCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [code, setCode] = useState('');
  const [initialBalance, setInitialBalance] = useState<number>(50);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchGiftCards = async () => {
    setLoading(true);
    const res = await getGiftCards();
    if (res.success) {
      setGiftCards(res.giftCards as GiftCardData[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let segment1 = '';
    let segment2 = '';
    for (let i = 0; i < 4; i++) {
      segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
      segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(`RBSK-${segment1}-${segment2}`);
  };

  const handleOpenForm = () => {
    generateRandomCode();
    setInitialBalance(50);
    setExpiresAt('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || initialBalance <= 0) return;

    setSaving(true);
    const payload: GiftCardData = {
      code: code.trim().toUpperCase(),
      initial_balance: Number(initialBalance),
      current_balance: Number(initialBalance),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: isActive
    };

    const res = await createGiftCard(payload);
    setSaving(false);
    if (res.success) {
      setIsFormOpen(false);
      fetchGiftCards();
    } else {
      alert('Hədiyyə kartı yaradılarkən xəta: ' + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hədiyyə kartını silmək istədiyinizdən əminsiniz?')) return;
    const res = await deleteGiftCard(id);
    if (res.success) {
      fetchGiftCards();
    } else {
      alert('Xəta baş verdi: ' + res.error);
    }
  };

  const handleToggleActive = async (card: GiftCardData) => {
    if (!card.id) return;
    const res = await updateGiftCard(card.id, { is_active: !card.is_active });
    if (res.success) {
      fetchGiftCards();
    }
  };

  const filteredCards = giftCards.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Gift className="w-6 h-6 text-amber-500" /> Hədiyyə Kartları & Store Credit
          </h2>
          <p className="text-sm text-slate-400 mt-1">Müştərilər üçün mağaza krediti və hədiyyə kartlarının idarəedilməsi.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Yeni Hədiyyə Kartı
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md animate-in slide-in-from-top-4 duration-300 space-y-6">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">Hədiyyə Kartının Yaradılması</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Kart Kodu</label>
                <button 
                  type="button" 
                  onClick={generateRandomCode}
                  className="text-[10px] text-amber-500 font-bold hover:underline"
                >
                  Yenisini Generasiya Et
                </button>
              </div>
              <input 
                type="text" 
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 uppercase" 
                placeholder="RBSK-XXXX-XXXX" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məbləğ / Balans (AZN)</label>
              <input 
                type="number" 
                value={initialBalance || ''}
                onChange={e => setInitialBalance(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                placeholder="50" 
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
                id="isCardActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 focus:ring-2"
              />
              <label htmlFor="isCardActive" className="text-sm font-black text-white uppercase tracking-wider select-none cursor-pointer">Aktiv Statusu</label>
            </div>
          </div>

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
              Kartı Generasiya Et
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
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Kart Kodu..." 
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition-colors" 
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Hədiyyə kartları yüklənir...
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Heç bir hədiyyə kartı tapılmadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Kart Kodu</th>
                  <th className="px-6 py-4">İlkin Dəyər</th>
                  <th className="px-6 py-4">Cari Balans</th>
                  <th className="px-6 py-4">Bitmə Tarixi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white tracking-wider">{card.code}</td>
                    <td className="px-6 py-4 font-mono">{Number(card.initial_balance).toFixed(2)} ₼</td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-500">{Number(card.current_balance).toFixed(2)} ₼</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {card.expires_at ? new Date(card.expires_at).toLocaleDateString() : 'Limitsiz'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleActive(card)}
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border transition-colors ${
                          card.is_active && Number(card.current_balance) > 0
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {Number(card.current_balance) <= 0 ? 'Bitib' : card.is_active ? 'Aktiv' : 'Passiv'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => card.id && handleDelete(card.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Kartı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
