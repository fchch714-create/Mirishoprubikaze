'use client';

import * as React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Percent,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShoppingBag as BagIcon,
  Globe,
  Link as LinkIcon,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  Ban,
  ArrowUpDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Top Sources Data
const topSources = [
  { source: 'Instagram / Sosial', share: '54%', traffic: '12,450', conversion: '4.8%' },
  { source: 'Birbaşa Giriş (Direct)', share: '22%', traffic: '5,100', conversion: '3.9%' },
  { source: 'Google Axtarış (SEO)', share: '18%', traffic: '4,200', conversion: '2.5%' },
  { source: 'Referral / Keçidlər', share: '6%', traffic: '1,400', conversion: '1.2%' }
];

interface AdminDashboardProps {
  stats: {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    openSupportTickets: number;
    trend7Days?: any[];
    trend30Days?: any[];
    trendMonthly?: any[];
    topProducts?: any[];
    topCategories?: any[];
    topCountries?: any[];
    topSources?: any[];
    operationalAlerts?: {
      refunds: string;
      returns: string;
      lowStock: string;
      outOfStock: string;
    };
    abandonedCarts?: any[];
    activeTickets?: any[];
    pendingApprovals?: any[];
    recentCustomers?: any[];
  };
  recentOrders: any[];
}

export default function AdminDashboardClient({ stats, recentOrders }: AdminDashboardProps) {
  const [mounted, setMounted] = React.useState(false);
  const [activeChart, setActiveChart] = React.useState<'revenue' | 'orders'>('revenue');
  const [trendDays, setTrendDays] = React.useState<7 | 30 | 12>(12);
  
  const chartData = React.useMemo(() => {
    if (trendDays === 7) {
      return stats.trend7Days || [];
    }
    if (trendDays === 12) {
      return stats.trendMonthly || [];
    }
    return stats.trend30Days || [];
  }, [stats.trend7Days, stats.trend30Days, stats.trendMonthly, trendDays]);
  
  const aov = stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders) : 0;

  // Prevent Recharts hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-8 text-left">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
            Süper Admin İdarəetmə Paneli
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            RubikShop platformasının real-time maliyyə tərəqqisi, kuryer əməliyyatları, müştəri loyallığı və sistem sağlamlığı idarəetmə mərkəzi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400">
            <Clock className="h-4 w-4 text-amber-500 animate-spin" /> Yenilənmə: Real-Time Aktiv
          </span>
          <button className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 uppercase tracking-wider">
            Hesabatı Yüklə (PDF/CSV)
          </button>
        </div>
      </div>

      {/* 1. Top Level KPIs (Total sales, Orders, Conversion, AOV) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Total Sales */}
        <div className="bg-slate-900 border border-slate-805/80 rounded-3xl p-6 shadow-md relative overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Ümumi Satış (Total Sales)</span>
              <span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">{stats.totalSales.toFixed(2)} AZN</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-5 text-[11px]">
            <span className="inline-flex items-center gap-0.5 font-black text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="h-3 w-3" /> +18.4%
            </span>
            <span className="text-slate-400">Keçən aya nəzərən artım</span>
          </div>
        </div>

        {/* KPI: Orders */}
        <div className="bg-slate-900 border border-slate-805/80 rounded-3xl p-6 shadow-md relative overflow-hidden group hover:border-blue-500/20 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Sifarişlər (Orders)</span>
              <span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">{stats.totalOrders} Sifariş</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-5 text-[11px]">
            <span className="inline-flex items-center gap-0.5 font-black text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="h-3 w-3" /> +12.1%
            </span>
            <span className="text-slate-400">Son 30 günlük dinamika</span>
          </div>
        </div>

        {/* KPI: Conversion */}
        <div className="bg-slate-900 border border-slate-805/80 rounded-3xl p-6 shadow-md relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Dönüşüm Oranı</span>
              <span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">
                {stats?.conversionRate || '0.00%'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-5 text-[11px]">
            <span className="inline-flex items-center gap-0.5 font-black text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="h-3 w-3" /> Canlı
            </span>
            <span className="text-slate-400">Sifariş / Trafik nisbəti</span>
          </div>
        </div>

        {/* KPI: AOV */}
        <div className="bg-slate-900 border border-slate-805/80 rounded-3xl p-6 shadow-md relative overflow-hidden group hover:border-purple-500/20 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Ortalama Səbət (AOV)</span>
              <span className="text-2xl md:text-3xl font-black text-white font-mono block tracking-tight">
                {stats?.aov || '0.00 AZN'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ArrowUpDown className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-5 text-[11px]">
            <span className="inline-flex items-center gap-0.5 font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="h-3 w-3" /> Canlı
            </span>
            <span className="text-slate-400">Məbləğ / Sifariş sayı</span>
          </div>
        </div>

      </div>

      {/* 2. Financial Charts & Operational Alerts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 8 Columns: Revenue Trend Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-amber-400" />
                Maliyyə Artım Trendi
              </h3>
              <p className="text-[11px] text-slate-400">Platformanın dinamik dövriyyə və kəmiyyət qrafiki (Supabase).</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period Selector (7, 30 Days or 12 Months) */}
              <div className="flex items-center bg-slate-950 p-1 border border-slate-850 rounded-xl">
                <button
                  onClick={() => setTrendDays(7)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    trendDays === 7 ? 'bg-indigo-600 text-white shadow-soft-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  7 Gün
                </button>
                <button
                  onClick={() => setTrendDays(30)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    trendDays === 30 ? 'bg-indigo-600 text-white shadow-soft-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  30 Gün
                </button>
                <button
                  onClick={() => setTrendDays(12)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    trendDays === 12 ? 'bg-indigo-600 text-white shadow-soft-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  12 Ay (Aylıq)
                </button>
              </div>

              {/* Metric Selector (Revenue or Orders) */}
              <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveChart('revenue')}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    activeChart === 'revenue' ? 'bg-amber-500 text-slate-950 shadow-soft-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gəlir (AZN)
                </button>
                <button
                  onClick={() => setActiveChart('orders')}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    activeChart === 'orders' ? 'bg-amber-500 text-slate-950 shadow-soft-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sifariş
                </button>
              </div>
            </div>
          </div>

          <div className="h-80 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff', fontSize: '11px' }}
                  />
                  {activeChart === 'revenue' ? (
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Gəlir (AZN)"
                    />
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorOrders)"
                      name="Sifarişlər"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-950/40 rounded-2xl flex items-center justify-center border border-slate-800">
                <span className="text-xs text-slate-500 animate-pulse">Qrafik Yüklənir...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Columns: Operational Alerts (Refunds, Returns, Low Stock, Out of Stock) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex-1 flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-red-400" />
                Operativ Sistem Alarmları
              </h3>
              <p className="text-[11px] text-slate-400">Təcili həll və tədbir gözləyən əməliyyat məntəqələri.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              
              {/* Refund alarm */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between min-h-[110px] group hover:border-red-500/20 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">İadə Tələbi (Refunds)</span>
                <span className="text-2xl font-black text-red-400 font-mono mt-2 block">{stats?.operationalAlerts?.refunds || '0 Aktiv'}</span>
                <span className="text-[9px] text-slate-500 font-medium mt-1">Gecikmə riski var</span>
              </div>

              {/* Return Alarm */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between min-h-[110px] group hover:border-amber-500/20 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Geri Qaytarma (Returns)</span>
                <span className="text-2xl font-black text-amber-500 font-mono mt-2 block">{stats?.operationalAlerts?.returns || '0 Gözləyən'}</span>
                <span className="text-[9px] text-slate-500 font-medium mt-1">Kuryer təyini lazımdır</span>
              </div>

              {/* Low stock Alarm */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between min-h-[110px] group hover:border-orange-500/20 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Azalan Stok (Low Stock)</span>
                <span className="text-2xl font-black text-orange-400 font-mono mt-2 block">{stats?.operationalAlerts?.lowStock || '0 Məhsul'}</span>
                <span className="text-[9px] text-slate-500 font-medium mt-1">Min limit altındadır</span>
              </div>

              {/* Out of stock Alarm */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between min-h-[110px] group hover:border-rose-500/20 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tükənmiş (Out of stock)</span>
                <span className="text-2xl font-black text-rose-500 font-mono mt-2 block">{stats?.operationalAlerts?.outOfStock || '0 Model'}</span>
                <span className="text-[9px] text-slate-500 font-medium mt-1">Satışı dayandırılıb</span>
              </div>

            </div>

            <div className="mt-5 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center gap-2 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span>Bütün digər kuryer və anbarlar optimal işləyir.</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Performance Metrics Area (Top products, Top categories, Demographics, Traffic, etc.) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Metric Card: Top Products */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BagIcon className="h-4.5 w-4.5 text-amber-500" />
              Ən Çox Satanlar (Top Products)
            </h4>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Son 30 gün</span>
          </div>

          <div className="space-y-3.5">
            {(stats.topProducts && stats.topProducts.length > 0) ? (
              stats.topProducts.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs">
                  <div className="space-y-0.5 max-w-[170px]">
                    <span className="font-bold text-slate-200 block truncate" title={p.name}>{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white font-mono block">{p.sales} ədəd</span>
                    <span className="text-[9px] text-amber-500 font-bold block">{p.revenue}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs py-4 text-center">Hələ heç bir satış qeydə alınmayıb</div>
            )}
          </div>
        </div>

        {/* Metric Card: Top Categories */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-blue-400" />
              Kateqoriya Payları
            </h4>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Həcm</span>
          </div>

          <div className="space-y-4">
            {(stats.topCategories && stats.topCategories.length > 0) ? (
              stats.topCategories.map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>{c.name}</span>
                    <span className="font-mono text-white">{c.share}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: c.share, backgroundColor: c.color }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{c.orders} sifariş</span>
                    <span>{c.value}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs py-4 text-center">Kateqoriya məlumatı tapılmadı</div>
            )}
          </div>
        </div>

        {/* Metric Card: Top Demographics / Countries */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-emerald-400" />
              Demoqrafiya (Top Locations)
            </h4>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ölkə/Şəhər</span>
          </div>

          <div className="space-y-4.5">
            {(stats.topCountries && stats.topCountries.length > 0) ? (
              stats.topCountries.map((c) => (
                <div key={c.country} className="flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 block">{c.country}</span>
                    <span className="text-[10px] text-slate-500">{c.users}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white font-mono block">{c.share}</span>
                    <span className="text-[9px] text-green-400 font-bold block">Artan Artım</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs py-4 text-center">Məkan məlumatı tapılmadı</div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Traffic & Abandoned Carts & Ticket Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 4 Columns: Top Traffic Sources */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <LinkIcon className="h-4.5 w-4.5 text-purple-400" />
                Trafik Mənbələri (Top Sources)
              </h4>
            </div>

            <div className="space-y-4">
              {topSources.map((s) => (
                <div key={s.source} className="flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 block">{s.source}</span>
                    <span className="text-[10px] text-slate-500">{s.traffic} klik • CR {s.conversion}</span>
                  </div>
                  <span className="font-mono text-white font-black bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">{s.share}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center leading-relaxed">
            İnteqrasiya olunmuş Google Analytics-4 üzərindən gələn verilənlər.
          </div>
        </div>

        {/* Middle 4 Columns: Abandoned Carts Tracker */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
                Tərk Edilmiş Səbətlər
              </h4>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded">Bərpa gözləyir</span>
            </div>

            <div className="divide-y divide-slate-800/40">
              {(stats.abandonedCarts && stats.abandonedCarts.length > 0) ? (
                stats.abandonedCarts.map((cart) => (
                  <div key={cart.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block">{cart.customer}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">{cart.email}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-white font-mono block">{cart.value}</span>
                      <span className="text-[9px] text-slate-400 block">{cart.items} məhsul • {cart.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs py-4 text-center">Tərk edilmiş səbət tapılmadı</div>
              )}
            </div>
          </div>

          <button className="mt-6 w-full py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer">
            Avtomatik Geri Qazanma Kampaniyası
          </button>
        </div>

        {/* Right 4 Columns: Pending Approvals (Reviews, Sellers, etc) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-blue-400" />
                Təsdiq Gözləyənlər (Approvals)
              </h4>
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
            </div>

            <div className="space-y-3.5">
              {(stats.pendingApprovals && stats.pendingApprovals.length > 0) ? (
                stats.pendingApprovals.map((app) => (
                  <div key={app.id} className="p-3.5 bg-slate-950/50 border border-slate-800/60 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-black text-amber-500 uppercase tracking-wider bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.2 rounded-lg">{app.type}</span>
                      <span className="text-slate-500 font-mono">{app.date}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 block">Kimdən: {app.source}</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">&quot;{app.desc}&quot;</p>
                    
                    <div className="flex gap-2 pt-1">
                      <button className="flex-1 py-1 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-slate-950 border border-green-500/20 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer">
                        Təsdiqlə
                      </button>
                      <button className="flex-1 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer">
                        Rədd Et
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs py-4 text-center">Gözləyən təsdiq sorğusu yoxdur</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 5. Feeds Section: Recent Orders & Recent Customers Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Columns: Recent Orders Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-md">
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="h-4.5 w-4.5 text-amber-500" />
              Sifariş Monitorinqi (Recent Orders)
            </h3>
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded">Yeni</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[9px] tracking-widest font-black border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Müştəri</th>
                  <th className="px-6 py-4">Məbləğ</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tarix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-white inline-flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-slate-500" /> {String(order.id).substring(0,8).toUpperCase()}
                    </span>
                    <div className="font-mono text-xs text-slate-500 mt-1">{new Date(order.created_at).toLocaleString('az-AZ')}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{order.customer_name}</td>
                  <td className="px-6 py-4 text-slate-400">{order.customer_phone}</td>
                  <td className="px-6 py-4 font-mono font-bold text-white">{Number(order.total_amount_azn || order.total || 0).toFixed(2)} AZN</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300">
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors border border-slate-700">
                        Bax <ChevronRight className="w-3 h-3 inline" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Recent Customers Table */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-md">
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-blue-400" />
              Yeni Müştərilər (Recent Customers)
            </h3>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded">Qeydiyyat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[9px] tracking-widest font-black border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Müştəri</th>
                  <th className="px-5 py-4">Sifariş</th>
                  <th className="px-5 py-4">Xərclənən</th>
                  <th className="px-5 py-4 text-right">Qeydiyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {(stats.recentCustomers && stats.recentCustomers.length > 0) ? (
                  stats.recentCustomers.map((cust, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200 block truncate max-w-[120px]">{cust.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[120px]">{cust.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-black text-slate-300">{cust.orders} dəfə</td>
                      <td className="px-5 py-4 font-mono font-bold text-amber-500">{cust.spent}</td>
                      <td className="px-5 py-4 text-right text-slate-500 font-mono">{cust.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-slate-400 text-xs py-4 text-center">Qeydiyyatlı müştəri tapılmadı</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 6. Active CRM tickets list summary */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-amber-500" />
            CRM Sistem Yardımları & Aktiv Biletlər (Active Tickets)
          </h4>
          <span className="text-[10px] text-slate-400">Ümumi: {stats.activeTickets?.length || 0} aktiv müraciət</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(stats.activeTickets && stats.activeTickets.length > 0) ? (
            stats.activeTickets.map((t) => (
              <div key={t.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-left relative overflow-hidden group hover:border-amber-500/25 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-slate-500 font-mono">ID: #{t.id}</span>
                  <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${
                    t.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' : 'bg-slate-850 text-slate-400'
                  }`}>
                    {t.priority}
                  </span>
                </div>
                <span className="text-xs font-black text-white block truncate">{t.subject}</span>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-900">
                  <span>Kimdən: <strong>{t.customer}</strong></span>
                  <span className="font-mono text-slate-500">{t.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-slate-400 text-xs py-4 text-center">Aktiv dəstək bileti tapılmadı</div>
          )}
        </div>
      </div>

    </div>
  );
}
