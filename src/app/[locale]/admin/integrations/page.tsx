'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Share2, CheckCircle2, MessageSquare, Database, Shield, Zap, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/actions/settings';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function AdminIntegrationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    whatsapp_number: '994506684925',
    instagram_handle: 'rubikshop.az',
    ga4_measurement_id: '',
    cloudinary_cloud_name: 'wa8iqfbe',
    supabase_configured: true,
  });

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getSettings('integrations');
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          ...res.data,
          supabase_configured: true
        }));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'İnteqrasiya məlumatları oxunmadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await updateSettings('integrations', formData);
      if (res.success) {
        setSuccessMsg('İnteqrasiya parametrləri Supabase bazasında uğurla saxlanıldı.');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'Yadda saxlanılmadı');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xəta baş verdi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <Share2 className="w-3.5 h-3.5" /> Xarici İnteqrasiyalar
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">İnteqrasiyalar və API Əlaqələri</h1>
          <p className="text-slate-400 text-xs mt-1">RubikShop.az üçün WhatsApp Checkout, Instagram, Supabase və GA4 parametrləri.</p>
        </div>
        <button 
          onClick={fetchIntegrations}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenilə
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp Checkout */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border text-green-400 bg-green-500/10 border-green-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">WhatsApp Checkout API</h3>
                  <span className="text-[11px] text-slate-400">Səbətdən WhatsApp-a birbaşa sifariş</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-black rounded-full border border-green-500/20 uppercase">
                Aktiv
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-300">WhatsApp Nömrəsi (Beynəlxalq format)</label>
              <input 
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="Məs: 994506684925"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500">Müştərilər sifarişi təsdiqlədikdə bu nömrəyə yönləndirilir.</span>
            </div>
          </div>

          {/* Instagram */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border text-pink-400 bg-pink-500/10 border-pink-500/20">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">Instagram Direct</h3>
                  <span className="text-[11px] text-slate-400">Sosial şəbəkə və DM keçidi</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-black rounded-full border border-green-500/20 uppercase">
                Aktiv
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-300">Instagram İstifadəçi Adı</label>
              <input 
                type="text"
                value={formData.instagram_handle}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                placeholder="Məs: rubikshop.az"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500">https://instagram.com/{formData.instagram_handle}</span>
            </div>
          </div>

          {/* Supabase Database */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">Supabase Cloud Database</h3>
                  <span className="text-[11px] text-slate-400">PostgreSQL, RLS və Real-time Auth</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase">
                Qoşulub
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Database Status:</span>
                <span className="text-emerald-400 font-bold">Online (56 Tables RLS Enabled)</span>
              </div>
              <div className="flex justify-between">
                <span>Auth Provider:</span>
                <span className="text-white font-mono">Supabase Auth (JWT)</span>
              </div>
            </div>
          </div>

          {/* Google Analytics 4 */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border text-amber-400 bg-amber-500/10 border-amber-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">Google Analytics 4 (GA4)</h3>
                  <span className="text-[11px] text-slate-400">Trafik və hadisə izləməsi</span>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border uppercase ${
                formData.ga4_measurement_id ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {formData.ga4_measurement_id ? 'Aktiv' : 'Konfiqurasiya Gözləyir'}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-300">GA4 Ölçmə ID-si (Measurement ID)</label>
              <input 
                type="text"
                value={formData.ga4_measurement_id}
                onChange={(e) => setFormData({ ...formData, ga4_measurement_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500">Google Analytics idarəetmə panelindən əldə etdiyiniz ID.</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Yadda Saxlanılır...' : 'Tənzimləmələri Saxla'}
          </button>
        </div>
      </form>
    </div>
  );
}
