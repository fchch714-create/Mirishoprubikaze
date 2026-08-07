'use client';

import React from 'react';
import { FileText, Download, Calendar, DollarSign, Package, TrendingUp, RefreshCw } from 'lucide-react';

export default function AdminReportsPage() {
  const reportsList = [
    { title: 'Aylıq Satış və Dövriyyə Hesabatı', period: '2026 İyul', format: 'PDF / CSV', type: 'Sales' },
    { title: 'Çatdırılma və Kuryer Əməliyyat Hesabatı', period: 'Bakı Metro Stansiyaları', format: 'CSV', type: 'Logistics' },
    { title: 'Anbar və Stok Tükənmə Hesabatı', period: 'Cari İnventar', format: 'XLSX', type: 'Inventory' },
    { title: 'Təchizatçı və Çin Ön Sifariş Hesabatı', period: 'Q1 2026', format: 'PDF', type: 'Supplier' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <FileText className="w-3.5 h-3.5" /> Sistem Hesabatları & Ekspor
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Maliyyə & Satış Hesabatları</h1>
          <p className="text-slate-400 text-xs mt-1">Dövrü əməliyyat hesabatlarını yükləyin və təhlil edin.</p>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep, idx) => (
          <div key={idx} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">{rep.type}</span>
              <h3 className="font-bold text-sm text-white">{rep.title}</h3>
              <p className="text-xs text-slate-400">{rep.period} • {rep.format}</p>
            </div>
            <button 
              onClick={() => alert(`${rep.title} generasiya olunur...`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/10"
            >
              <Download className="w-3.5 h-3.5" /> Yüklə
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
