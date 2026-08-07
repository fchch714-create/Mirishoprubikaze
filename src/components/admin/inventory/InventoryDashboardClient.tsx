"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertOctagon, Search, Download, Loader2, RefreshCw } from 'lucide-react';
import { getInventoryStatus, InventoryItem } from '@/lib/actions/inventory';

export default function InventoryDashboardClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const res = await getInventoryStatus();
    if (res.success && res.inventory) {
      setInventory(res.inventory);
    } else {
      setError(res.error || 'Stok məlumatlarını yükləmək mümkün olmadı.');
    }
    setLoading(false);
  };

  const filtered = inventory.filter(i => 
    (i.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (i.variant_sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const lowStockCount = inventory.filter(i => i.quantity > 0 && i.quantity < 10).length;
  const outOfStockCount = inventory.filter(i => i.quantity === 0).length;

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Məhsul', 'SKU', 'Anbar', 'Mövcud Stok (Anbarda)', 'Ümumi Variant Stoku'];
    const rows = filtered.map(item => [
      item.product_name,
      item.variant_sku,
      item.warehouse_name,
      item.quantity,
      item.variant_stock
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventar_hesabati_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-amber-500 font-black text-sm uppercase tracking-wider mb-1">Low Stock Alert (Azalan Stok)</h3>
            <p className="text-slate-300 text-sm">{lowStockCount} məhsul limiti (10 ədəd) altına düşüb.</p>
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-red-500 font-black text-sm uppercase tracking-wider mb-1">Out of Stock Alert (Bitmiş Stok)</h3>
            <p className="text-slate-300 text-sm">{outOfStockCount} məhsulun anbardakı miqdarı tamamilə tükənib.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-soft-md">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/50">
          <div>
            <h3 className="text-white font-black uppercase tracking-wider text-sm">Cari Stok Vəziyyəti</h3>
            <p className="text-xs text-slate-500 mt-1">Hər bir anbardakı individual fiziki miqdarlar.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={fetchData} 
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
              title="Yenilə"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="SKU və ya Ad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button 
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition-colors border border-slate-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Stoklar hesablanır...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Məhsul / SKU</th>
                  <th className="px-6 py-4">Lokasiya (Anbar)</th>
                  <th className="px-6 py-4">Anbar Stoku</th>
                  <th className="px-6 py-4">Ümumi Variant Stoku</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((item) => {
                  let status = 'ok';
                  if (item.quantity === 0) status = 'out';
                  else if (item.quantity < 10) status = 'low';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{item.product_name}</div>
                        <div className="font-mono text-xs text-slate-500 mt-1">{item.variant_sku}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-300">{item.warehouse_name}</td>
                      <td className="px-6 py-4 font-bold text-white font-mono">{item.quantity} ədəd</td>
                      <td className="px-6 py-4 text-slate-400 font-mono">{item.variant_stock} ədəd</td>
                      <td className="px-6 py-4">
                        {status === 'ok' && <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Mövcud</span>}
                        {status === 'low' && <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">Azalır</span>}
                        {status === 'out' && <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">Bitib</span>}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Məlumat tapılmadı. Zəhmət olmasa Stok Əməliyyatlarından giriş edin.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
