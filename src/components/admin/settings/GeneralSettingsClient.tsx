"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/actions/settings';

export default function GeneralSettingsClient() {
  const [storeName, setStoreName] = useState('RubikShop.az');
  const [contactEmail, setContactEmail] = useState('info@rubikshop.az');
  const [contactPhone, setContactPhone] = useState('+994 50 668 49 25');
  const [address, setAddress] = useState('Bakı şəhəri...');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await getSettings('general');
        if (res.success && res.data) {
          if (res.data.storeName) setStoreName(res.data.storeName);
          if (res.data.contactEmail) setContactEmail(res.data.contactEmail);
          if (res.data.contactPhone) setContactPhone(res.data.contactPhone);
          if (res.data.address) setAddress(res.data.address);
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
        storeName,
        contactEmail,
        contactPhone,
        address
      };
      const res = await updateSettings('general', payload);
      if (res.success) {
        setSuccessMsg('Ümumi tənzimləmələr uğurla yadda saxlanıldı!');
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
          <Settings className="w-6 h-6 text-amber-500" /> Ümumi Tənzimləmələr
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
          <p className="text-slate-400 text-sm">Tənzimləmələr yüklənir...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Mağaza Məlumatları</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Mağaza Adı</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Əlaqə Email</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                  value={contactEmail} 
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Əlaqə Nömrəsi</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                  value={contactPhone} 
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Ünvan</label>
                <textarea 
                  rows={3} 
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 resize-none" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Mağaza Loqosu</label>
                <div className="border-2 border-dashed border-slate-700 rounded-2xl h-40 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500 hover:text-amber-500 transition-colors cursor-pointer bg-slate-950/50">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm font-bold">Loqo Yüklə (PNG, SVG)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Favicon</label>
                <div className="border-2 border-dashed border-slate-700 rounded-2xl h-24 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500 hover:text-amber-500 transition-colors cursor-pointer bg-slate-950/50 w-32">
                  <ImageIcon className="w-5 h-5 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">32x32 ICO</span>
                </div>
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
