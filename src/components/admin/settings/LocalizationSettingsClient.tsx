"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Save, Check, AlertCircle } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/actions/settings';

export default function LocalizationSettingsClient() {
  const [currency, setCurrency] = useState('AZN');
  const [currencyFormat, setCurrencyFormat] = useState('{{amount}} ₼');
  const [languages, setLanguages] = useState([
    { code: 'az', name: 'Azərbaycan', active: true, default: true },
    { code: 'en', name: 'İngilis (English)', active: true, default: false },
    { code: 'ru', name: 'Rus (Русский)', active: true, default: false },
    { code: 'tr', name: 'Türk (Türkçe)', active: false, default: false },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await getSettings('localization');
        if (res.success && res.data) {
          if (res.data.currency) setCurrency(res.data.currency);
          if (res.data.currencyFormat) setCurrencyFormat(res.data.currencyFormat);
          if (res.data.languages) setLanguages(res.data.languages);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleLanguageToggle = (code: string) => {
    setLanguages(prev => prev.map(lang => {
      if (lang.code === code) {
        if (lang.default) return lang; // cannot deactivate default language
        return { ...lang, active: !lang.active };
      }
      return lang;
    }));
  };

  const handleMakeDefault = (code: string) => {
    setLanguages(prev => prev.map(lang => ({
      ...lang,
      default: lang.code === code,
      active: lang.code === code ? true : lang.active
    })));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        currency,
        currencyFormat,
        languages
      };
      const res = await updateSettings('localization', payload);
      if (res.success) {
        setSuccessMsg('Dil və Lokalizasiya tənzimləmələri uğurla yadda saxlanıldı!');
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
          <Globe className="w-6 h-6 text-amber-500" /> Dil və Valyuta
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
          <p className="text-slate-400 text-sm">Lokalizasiya yüklənir...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-8">
          
          {/* Languages */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Dəstəklənən Dillər</h3>
            <div className="space-y-3">
              {languages.map(lang => (
                <div key={lang.code} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${lang.active ? 'bg-slate-950 border-slate-700' : 'bg-slate-950/50 border-slate-850 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleLanguageToggle(lang.code)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${lang.active ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-600'}`}
                    >
                      {lang.active && <Check className="w-3 h-3 font-bold" />}
                    </button>
                    <div>
                      <span className="font-bold text-white text-sm">{lang.name}</span>
                      <span className="ml-2 text-xs font-mono text-slate-500 uppercase tracking-wider">({lang.code})</span>
                    </div>
                  </div>
                  {lang.default ? (
                    <span className="inline-block px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">
                      Əsas Dil
                    </span>
                  ) : (
                    lang.active && (
                      <button 
                        onClick={() => handleMakeDefault(lang.code)}
                        className="text-xs text-slate-400 hover:text-white font-bold transition-colors"
                      >
                        Əsas Et
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Əsas Valyuta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Mağaza Valyutası</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 appearance-none font-medium cursor-pointer"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="AZN">AZN (₼) - Azərbaycan Manatı</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Valyuta Formatı</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500" 
                  value={currencyFormat} 
                  onChange={(e) => setCurrencyFormat(e.target.value)}
                />
                <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-wider">Nümunə: 15.00 ₼</p>
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
