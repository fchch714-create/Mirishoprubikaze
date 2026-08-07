"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, Save, Smartphone, AlertCircle, Check } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/actions/settings';

export default function PaymentSettingsClient() {
  const [cashOnDelivery, setCashOnDelivery] = useState(true);
  const [cardToCard, setCardToCard] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('+994506684925');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await getSettings('payment');
        if (res.success && res.data) {
          if (res.data.cashOnDelivery !== undefined) setCashOnDelivery(res.data.cashOnDelivery);
          if (res.data.cardToCard !== undefined) setCardToCard(res.data.cardToCard);
          if (res.data.whatsappNumber) setWhatsappNumber(res.data.whatsappNumber);
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
        cashOnDelivery,
        cardToCard,
        whatsappNumber
      };
      const res = await updateSettings('payment', payload);
      if (res.success) {
        setSuccessMsg('Ödəniş və Checkout tənzimləmələri uğurla yadda saxlanıldı!');
      } else {
        setErrorMsg(res.error || 'Xəta baş verdi');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gözlənilməz xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-500" /> Ödəniş & Checkout
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
          <p className="text-slate-400 text-sm">Ödəniş tənzimləmələri yüklənir...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-8">
          
          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Aktiv Ödəniş Metodları</h3>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-amber-500/20 rounded-xl">
                <div>
                  <div className="font-bold text-white text-sm">Qapıda Ödəniş (Cash on Delivery)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Sifariş təhvil veriləndə nağd ödəniş</div>
                </div>
                <button 
                  onClick={() => setCashOnDelivery(!cashOnDelivery)}
                  className={`w-11 h-6 rounded-full transition-colors relative duration-200 ${cashOnDelivery ? 'bg-amber-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${cashOnDelivery ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 border border-amber-500/20 rounded-xl">
                <div>
                  <div className="font-bold text-white text-sm">Bank Köçürməsi (Card to Card)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Sifarişdən sonra WhatsApp vasitəsilə kart məlumatları göndərilir</div>
                </div>
                <button 
                  onClick={() => setCardToCard(!cardToCard)}
                  className={`w-11 h-6 rounded-full transition-colors relative duration-200 ${cardToCard ? 'bg-amber-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${cardToCard ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl opacity-60">
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">Onlayn Kartla Ödəniş <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded uppercase">Tezliklə</span></div>
                  <div className="text-xs text-slate-500 mt-0.5">Stripe və ya yerli bank inteqrasiyası</div>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer"></div>
                </label>
              </div>

            </div>
          </div>

          {/* WhatsApp Integration */}
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-500" /> WhatsApp İnteqrasiyası
            </h3>
            <p className="text-sm text-slate-400 mb-6">Sifarişlərin manual idarəolunması və müştəri xidmətləri üçün nömrə.</p>
            
            <div className="max-w-md">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Aktiv WhatsApp Nömrəsi</label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-green-500" 
                value={whatsappNumber} 
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-wider">Beynəlxalq formatda (Məs: +994501234567)</p>
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
