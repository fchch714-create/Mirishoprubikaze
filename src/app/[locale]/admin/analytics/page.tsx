'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, ShoppingBag, DollarSign, Calendar, Eye, ArrowUpRight } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <BarChart3 className="w-3.5 h-3.5" /> Analitika & Trafik Metrikaları
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Performans Analitikası</h1>
          <p className="text-slate-400 text-xs mt-1">RubikShop.az platformasının real-time satış, baxış sayı və dönüşüm göstəriciləri.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800">
            Son 30 gün
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ümumi Baxış (Pageviews)</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">45,210</span>
            <span className="text-xs font-bold text-green-400 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> +24%</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Unikal Ziyarətçi</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">18,450</span>
            <span className="text-xs font-bold text-green-400 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> +18%</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Dönüşüm Oranı (CR)</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">4.8%</span>
            <span className="text-xs font-bold text-green-400 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> +1.2%</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Aktiv Səbətlər</span>
            <ShoppingBag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">12</span>
            <span className="text-xs font-bold text-amber-400">Canlı</span>
          </div>
        </div>
      </div>

      {/* Traffic Sources Chart Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        <h3 className="text-base font-black uppercase text-white tracking-wider">Trafik Mənbələri və Sifariş Kanal Analizi</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-300">Instagram / WhatsApp DM</span>
              <span className="text-amber-400">65% (12,100 Ziyarətçi)</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-amber-500 rounded-full w-[65%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-300">Google Axtarış (Organic SEO)</span>
              <span className="text-amber-400">22% (4,100 Ziyarətçi)</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-blue-500 rounded-full w-[22%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-300">Birbaşa Giriş (Direct rubikshop.az)</span>
              <span className="text-amber-400">13% (2,250 Ziyarətçi)</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-green-500 rounded-full w-[13%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
