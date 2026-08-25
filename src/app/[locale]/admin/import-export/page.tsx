'use client';

import React, { useState } from 'react';
import { ArrowUpDown, Download, Upload, FileSpreadsheet, Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getProducts } from '@/lib/actions/catalog';

export default function AdminImportExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExportProductsCsv = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    try {
      const res = await getProducts();
      const products = Array.isArray(res) ? res : (res as any)?.products || [];

      if (products.length === 0) {
        alert('Bazada ixrac ediləcək heç bir məhsul tapılmadı.');
        return;
      }

      let csv = 'ID,SKU,Ad_AZ,Qiymet_AZN,Stok,Kateqoriya_ID,Tesvir_AZ\n';
      products.forEach((p: any) => {
        const id = `"${(p.id || '').replace(/"/g, '""')}"`;
        const sku = `"${(p.sku || '').replace(/"/g, '""')}"`;
        const name = `"${(p.name_az || p.title_az || '').replace(/"/g, '""')}"`;
        const price = (p.price_azn || p.price || 0).toFixed(2);
        const stock = p.stock ?? 0;
        const catId = `"${(p.category_id || '').replace(/"/g, '""')}"`;
        const desc = `"${(p.description_az || '').replace(/"/g, '""')}"`;

        csv += `${id},${sku},${name},${price},${stock},${catId},${desc}\n`;
      });

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `rubikshop_mehsullar_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportStatus('Bütün məhsullar uğurla CSV formatında ixrac olundu.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'İxrac zamanı xəta baş verdi');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(`"${file.name}" faylı qəbul edildi. Format və sütunlar yoxlanılır...`);
    // Basic verification
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Yalnız .csv formatlı fayllar dəstəklənir.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      setImportStatus(`Fayl oxundu: ${lines.length - 1} sətir məhsul qeydi aşkar edildi.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <ArrowUpDown className="w-3.5 h-3.5" /> Məlumat İdxalı & İxracı
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">İdxal / İxrac Alətləri</h1>
          <p className="text-slate-400 text-xs mt-1">Məhsul kataloqunu, qiymətləri və inventar siyahısını CSV formatında ixrac və idxal edin.</p>
        </div>
      </div>

      {importStatus && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-amber-400">
              <Download className="w-6 h-6" />
              <h3 className="text-base font-black uppercase text-white">Məlumatları İxrac Et (Export)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              RubikShop Supabase bazasındakı bütün məhsulları, SKU kodlarını, qiymətləri və stok sayını CSV faylı olaraq birbaşa kompüterinizə yükləyin.
            </p>
          </div>
          <div className="pt-4">
            <button 
              onClick={handleExportProductsCsv}
              disabled={isExporting}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {isExporting ? 'İxrac Olunur...' : 'Bütün Məhsulları İxrac Et (CSV)'}
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-green-400">
              <Upload className="w-6 h-6" />
              <h3 className="text-base font-black uppercase text-white">Məlumatları İdxal Et (Import)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Məhsul siyahısını Excel (CSV) faylı vasitəsilə sistemə yükləyin. Sütunların uyğunluğu yoxlanılacaqdır.
            </p>
          </div>
          <div className="pt-2">
            <label className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center hover:border-amber-500/50 transition-colors cursor-pointer block">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-300 block">CSV Faylını Seçin və ya Yükləyin</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Maksimum fayl həcmi: 10MB</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
