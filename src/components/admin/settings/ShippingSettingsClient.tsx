"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Save, Plus, Edit3, Trash2, AlertCircle, Check } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/actions/settings';

export default function ShippingSettingsClient() {
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [taxRate, setTaxRate] = useState('18');
  
  const [deliveryMethods, setDeliveryMethods] = useState([
    { id: 1, name: 'Metroya Çatdırılma', price: 2.00, time: '1-2 iş günü' },
    { id: 2, name: 'Ünvana Çatdırılma (Kuryer)', price: 5.00, time: '1-2 iş günü' },
    { id: 3, name: 'Poçtla Çatdırılma (Rayonlar)', price: 3.50, time: '3-5 iş günü' },
    { id: 4, name: 'Mağazadan Götürmə', price: 0.00, time: 'Eyni gün' },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing Methods
  const [editingMethodId, setEditingMethodId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editTime, setEditTime] = useState('');

  const [nearMetroPrice, setNearMetroPrice] = useState('1.00');
  const [farMetroPrice, setFarMetroPrice] = useState('2.00');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await getSettings('shipping');
        if (res.success && res.data) {
          if (res.data.taxIncluded !== undefined) setTaxIncluded(res.data.taxIncluded);
          if (res.data.taxRate !== undefined) setTaxRate(res.data.taxRate);
          if (res.data.deliveryMethods) setDeliveryMethods(res.data.deliveryMethods);
          if (res.data.nearMetroPrice !== undefined) setNearMetroPrice(String(res.data.nearMetroPrice));
          if (res.data.farMetroPrice !== undefined) setFarMetroPrice(String(res.data.farMetroPrice));
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        taxIncluded,
        taxRate,
        deliveryMethods,
        nearMetroPrice: parseFloat(nearMetroPrice) || 1.00,
        farMetroPrice: parseFloat(farMetroPrice) || 2.00
      };
      const res = await updateSettings('shipping', payload);
      if (res.success) {
        setSuccessMsg('Çatdırılma tənzimləmələri uğurla yadda saxlanıldı!');
      } else {
        setErrorMsg(res.error || 'Xəta baş verdi');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gözlənilməz xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (method: any) => {
    setEditingMethodId(method.id);
    setEditName(method.name);
    setEditPrice(String(method.price));
    setEditTime(method.time);
  };

  const saveMethodEdit = () => {
    setDeliveryMethods(prev => prev.map(m => {
      if (m.id === editingMethodId) {
        return {
          ...m,
          name: editName,
          price: parseFloat(editPrice) || 0,
          time: editTime
        };
      }
      return m;
    }));
    setEditingMethodId(null);
  };

  const addNewMethod = () => {
    const nextId = deliveryMethods.length > 0 ? Math.max(...deliveryMethods.map(m => m.id)) + 1 : 1;
    const newMethod = {
      id: nextId,
      name: 'Yeni Çatdırılma Metodu',
      price: 0,
      time: '1-3 iş günü'
    };
    setDeliveryMethods([...deliveryMethods, newMethod]);
    startEdit(newMethod);
  };

  const deleteMethod = (id: number) => {
    setDeliveryMethods(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-6 h-6 text-amber-500" /> Çatdırılma & Vergi
        </h2>
        <button 
          onClick={handleSave}
          disabled={loading || saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Save className="w-4 h-4" /> {saving ? 'Gözləyin...' : 'Yadda Saxla'}
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl">
          <Check className="w-5 h-5 flex-shrink-0 text-green-400" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Çatdırılma tənzimləmələri yüklənir...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-8">
          
          {/* Delivery Methods */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Çatdırılma Metodları</h3>
                <p className="text-xs text-slate-400 mt-1">Ödəniş zamanı aktiv olan kuryer və metro tarifləri.</p>
              </div>
              <button 
                onClick={addNewMethod}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-slate-700"
              >
                <Plus className="w-3 h-3" /> Yeni Metod
              </button>
            </div>
            
            <div className="space-y-3">
              {deliveryMethods.map(method => (
                <div key={method.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                  {editingMethodId === method.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Metod Adı</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Qiymət (AZN)</label>
                        <input 
                          type="text" 
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Müddət</label>
                        <input 
                          type="text" 
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 mb-2 md:mb-0"
                        />
                      </div>
                      <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => setEditingMethodId(null)}
                          className="px-3 py-1 bg-slate-800 text-xs font-bold text-white rounded hover:bg-slate-700"
                        >
                          Ləğv Et
                        </button>
                        <button 
                          onClick={saveMethodEdit}
                          className="px-3 py-1 bg-amber-500 text-xs font-bold text-slate-950 rounded hover:bg-amber-600"
                        >
                          Saxla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{method.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Müddət: {method.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="font-mono font-bold text-amber-500">{Number(method.price).toFixed(2)} ₼</div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => startEdit(method)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteMethod(method.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metro Station Tariffs */}
          <div className="pt-6 border-t border-slate-800">
            <div className="mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                🚇 Metro Stansiyaları - Tarif Qaydaları
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Metro stansiyalarına görə avtomatik hesablanan sabit çatdırılma tarifləri.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Yaxın Stansiyalar Tarifi</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">10 Stansiya</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Dərnəgül, Azadlıq prospekti, Nəsimi, Memar Əcəmi (Yaşıl), 20 Yanvar, İnşaatçılar, Elmlər Akademiyası, Nizami, 28 May, Gənclik
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tarif Qiyməti (AZN)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nearMetroPrice}
                    onChange={(e) => setNearMetroPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-blue-400 uppercase tracking-wider">Uzaq Stansiyalar Tarifi</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">17 Stansiya</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Nərimanov, Bakmil, Ulduz, Koroğlu, Qara Qarayev, Neftçilər, Xalqlar Dostluğu, Əhmədli, Həzi Aslanov, Sahil, İçərişəhər, Cəfər Cabbarlı, Xətai, Xocəsən, Avtovağzal, Memar Əcəmi (Bənövşəyi), 8 Noyabr
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tarif Qiyməti (AZN)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={farMetroPrice}
                    onChange={(e) => setFarMetroPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Taxes */}
          <div className="pt-6 border-t border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Vergi Tənzimləmələri</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <div className="font-bold text-white text-sm">Qiymətlərə vergi daxildir</div>
                  <div className="text-xs text-slate-500 mt-0.5">Məhsul qiymətlərində ƏDV hesablanıb</div>
                </div>
                <button 
                  onClick={() => setTaxIncluded(!taxIncluded)}
                  className={`w-11 h-6 rounded-full transition-colors relative duration-200 ${taxIncluded ? 'bg-amber-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${taxIncluded ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Standart Vergi Dərəcəsi (%)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-800">
            <button 
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" /> {saving ? 'Gözləyin...' : 'Yadda Saxla'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
