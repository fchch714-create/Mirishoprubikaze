"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Save, MessageSquare, AlertCircle, Check } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/actions/settings';

export default function NotificationSettingsClient() {
  const [emailNotify, setEmailNotify] = useState(true);
  const [stockNotify, setStockNotify] = useState(true);
  const [templateReceived, setTemplateReceived] = useState('Salam {customer_name}! Sifarişiniz (# {order_number}) qəbul edildi. Tezliklə sizinlə əlaqə saxlayacağıq. Təşəkkürlər! - RubikShop');
  const [templateShipped, setTemplateShipped] = useState('Salam {customer_name}. Sifarişiniz yola düşdü. Kuryer: {courier_phone}. Bizi seçdiyiniz üçün təşəkkürlər!');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await getSettings('notifications');
        if (res.success && res.data) {
          if (res.data.emailNotify !== undefined) setEmailNotify(res.data.emailNotify);
          if (res.data.stockNotify !== undefined) setStockNotify(res.data.stockNotify);
          if (res.data.templateReceived) setTemplateReceived(res.data.templateReceived);
          if (res.data.templateShipped) setTemplateShipped(res.data.templateShipped);
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
        emailNotify,
        stockNotify,
        templateReceived,
        templateShipped
      };
      const res = await updateSettings('notifications', payload);
      if (res.success) {
        setSuccessMsg('Bildiriş tənzimləmələri uğurla yadda saxlanıldı!');
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
          <Bell className="w-6 h-6 text-amber-500" /> Bildirişlər
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
          <p className="text-slate-400 text-sm">Bildiriş tənzimləmələri yüklənir...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-8">
          
          {/* Admin Notifications */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Admin Bildirişləri</h3>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <div className="font-bold text-white text-sm">Yeni Sifariş Email Bildirişi</div>
                  <div className="text-xs text-slate-500 mt-0.5">Mağazaya yeni sifariş daxil olduqda email göndərilir.</div>
                </div>
                <button 
                  onClick={() => setEmailNotify(!emailNotify)}
                  className={`w-11 h-6 rounded-full transition-colors relative duration-200 ${emailNotify ? 'bg-amber-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${emailNotify ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <div className="font-bold text-white text-sm">Stok Xəbərdarlığı</div>
                  <div className="text-xs text-slate-500 mt-0.5">Məhsulun sayı 5-dən aşağı düşdükdə bildiriş göndər.</div>
                </div>
                <button 
                  onClick={() => setStockNotify(!stockNotify)}
                  className={`w-11 h-6 rounded-full transition-colors relative duration-200 ${stockNotify ? 'bg-amber-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${stockNotify ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* Customer SMS/WhatsApp Templates */}
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Sifariş Statusu Şablonları
            </h3>
            <p className="text-sm text-slate-400 mb-6">Müştəriyə WhatsApp və ya Email vasitəsilə göndəriləcək avtomatik mesajlar.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Sifariş Qəbul Edildi</label>
                <textarea 
                  rows={3} 
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 resize-none" 
                  value={templateReceived}
                  onChange={(e) => setTemplateReceived(e.target.value)}
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Sifariş Göndərildi (Kuryerdə)</label>
                <textarea 
                  rows={3} 
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 resize-none" 
                  value={templateShipped}
                  onChange={(e) => setTemplateShipped(e.target.value)}
                ></textarea>
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
