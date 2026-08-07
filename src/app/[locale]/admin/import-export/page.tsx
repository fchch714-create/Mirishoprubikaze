'use client';

import React from 'react';
import { ArrowUpDown, Download, Upload, FileSpreadsheet, Database, CheckCircle2 } from 'lucide-react';

export default function AdminImportExportPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <ArrowUpDown className="w-3.5 h-3.5" /> Məlumat İdxalı & İxracı
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">İdxal / İxrac Alətləri</h1>
          <p className="text-slate-400 text-xs mt-1">Məhsul kataloqunu, qiymətləri və müştəri siyahısını CSV/JSON formatında köçürün.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center gap-3 text-amber-400">
            <Download className="w-6 h-6" />
            <h3 className="text-base font-black uppercase text-white">Məlumatları İxrac Et (Export)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            RubikShop bazasındakı bütün məhsulları, qiymət cədvəlini və kateqoriyaları CSV/XLSX faylı olaraq yadda saxlayın.
          </p>
          <div className="pt-2 space-y-2">
            <button 
              onClick={() => alert('Məhsul kataloqu CSV olaraq ixrac olunur...')}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
            >
              <FileSpreadsheet className="w-4 h-4" /> Bütün Məhsulları İxrac Et (CSV)
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center gap-3 text-green-400">
            <Upload className="w-6 h-6" />
            <h3 className="text-base font-black uppercase text-white">Məlumatları İdxal Et (Import)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Yeni toplu məhsul siyahısını Excel (CSV) faylı vasitəsilə birbaşa bazaya yükləyin.
          </p>
          <div className="pt-2 border-2 border-dashed border-slate-800 rounded-xl p-4 text-center hover:border-amber-500/50 transition-colors">
            <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-300 block">CSV Faylını Buraya Sürükləyin və ya Seçin</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Maksimum fayl həcmi: 10MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
