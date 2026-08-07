'use client';

import React from 'react';
import { FileCode, Key, Code, Terminal, Copy, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AdminApiToolsPage() {
  const [copied, setCopied] = React.useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText('rbk_live_994506684925_sec_key_2026');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <FileCode className="w-3.5 h-3.5" /> Developer API & Tools
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">API və Tərtibatçı Alətləri</h1>
          <p className="text-slate-400 text-xs mt-1">RubikShop.az API endpointləri, webhook inteqrasiyaları və tərtibatçı açarları.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* API Keys */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-black text-sm uppercase">
              <Key className="w-4 h-4 text-amber-400" /> Admin API Açar (Secret Key)
            </div>
            <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-[10px] font-black rounded-full border border-green-500/20 uppercase">
              Aktiv
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
            <span className="flex-1 truncate">rbk_live_994506684925_sec_key_2026</span>
            <button 
              onClick={copyKey}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
        </div>

        {/* API Docs & Endpoints */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
          <h3 className="font-black uppercase text-white text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" /> Əsas API Endpointləri
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold mr-2">GET</span>
                <span className="text-slate-200">/api/products</span>
              </div>
              <span className="text-slate-500 text-[11px]">Bütün məhsul siyahısı</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold mr-2">POST</span>
                <span className="text-slate-200">/api/orders/create</span>
              </div>
              <span className="text-slate-500 text-[11px]">WhatsApp Sifariş Formatlama</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
