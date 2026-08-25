'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Eye, 
  ArrowUpRight, 
  RefreshCw, 
  AlertCircle,
  Package,
  Layers,
  ArrowDownRight
} from 'lucide-react';
import { getDashboardStats } from '@/lib/actions/admin';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'monthly'>('30');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getDashboardStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
        setErrorMsg(res.error || 'Analitika məlumatları yüklənmədi');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const activeTrend = timeRange === '7' 
    ? (stats?.trend7Days || []) 
    : timeRange === '30' 
      ? (stats?.trend30Days || []) 
      : (stats?.trendMonthly || []);

  const totalSales = Number(stats?.totalSales || 0);
  const totalOrders = Number(stats?.totalOrders || 0);
  const aov = stats?.aov || '0.00 AZN';
  const conversionRate = stats?.conversionRate || '0.00%';
  const activeCartsCount = Array.isArray(stats?.abandonedCarts) ? stats.abandonedCarts.length : 0;
  const topSources = Array.isArray(stats?.topSources) ? stats.topSources : [];
  const topProducts = Array.isArray(stats?.topProducts) ? stats.topProducts : [];

  // Calculate estimated or real page views based on topSources
  let totalVisitsCalculated = 0;
  topSources.forEach((s: any) => {
    const rawTraffic = parseInt((s.traffic || '0').replace(/[^0-9]/g, ''), 10);
    if (!isNaN(rawTraffic)) {
      totalVisitsCalculated += rawTraffic;
    }
  });

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
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button 
              onClick={() => setTimeRange('7')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === '7' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Son 7 gün
            </button>
            <button 
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === '30' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Son 30 gün
            </button>
            <button 
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === 'monthly' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Aylıq
            </button>
          </div>
          <button 
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
            title="Yenilə"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pageviews / Visits */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ümumi Ziyarət</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {isLoading ? '...' : totalVisitsCalculated.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-amber-400">Canlı Loq</span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ümumi Gəlir</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-green-400">
              {isLoading ? '...' : `${totalSales.toFixed(2)} AZN`}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">
              {totalOrders} sifariş
            </span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Dönüşüm Oranı (CR)</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {isLoading ? '...' : conversionRate}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Ort. Səbət: {aov}
            </span>
          </div>
        </div>

        {/* Active / Abandoned Carts */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Aktiv Səbətlər</span>
            <ShoppingBag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">
              {isLoading ? '...' : activeCartsCount}
            </span>
            <span className="text-xs font-bold text-amber-400">Real Baza</span>
          </div>
        </div>
      </div>

      {/* Traffic Sources Chart Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black uppercase text-white tracking-wider">Trafik Mənbələri və Kanal Analizi</h3>
          <span className="text-xs text-slate-500 font-mono">Supabase `traffic_logs`</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
            <span>Kanal məlumatları hesablanır...</span>
          </div>
        ) : topSources.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="text-xs">Hələ heç bir trafik qeydə alınmayıb.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topSources.map((source: any, idx: number) => {
              const shareNum = parseInt((source.share || '0').replace('%', ''), 10) || 0;
              const colorClass = idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-green-500' : 'bg-purple-500';

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">{source.source}</span>
                    <span className="text-amber-400">{source.share} ({source.traffic}) • CR: {source.conversion}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(Math.max(shareNum, 2), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Products & Sales Activity */}
      {topProducts.length > 0 && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" /> Ən Çox Satılan Məhsullar
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                  <th className="p-3">Məhsul</th>
                  <th className="p-3">Satış Sayı</th>
                  <th className="p-3 text-right">Dövriyyə</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topProducts.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3 text-slate-300">{p.sales} ədəd</td>
                    <td className="p-3 text-right font-mono font-bold text-green-400">{p.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
