'use client';

import React from 'react';
import { FolderOpen, Image as ImageIcon, Upload, File, HardDrive, Trash2 } from 'lucide-react';

export default function AdminFilesPage() {
  const mediaFiles = [
    { name: 'moyu-rs3m-2020.jpg', size: '240 KB', type: 'Məhsul Şəkli', date: '2026-07-28' },
    { name: 'gan-12-maglev.jpg', size: '310 KB', type: 'Məhsul Şəkli', date: '2026-07-25' },
    { name: 'rubikshop-banner-summer.png', size: '1.2 MB', type: 'CMS Banned', date: '2026-07-20' },
    { name: 'qiyi-pyraminx.jpg', size: '180 KB', type: 'Məhsul Şəkli', date: '2026-07-15' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <FolderOpen className="w-3.5 h-3.5" /> Media & Fayl İdarəetməsi
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Fayllar və Şəkillər</h1>
          <p className="text-slate-400 text-xs mt-1">Saytda istifadə olunan bütün məhsul şəkilləri və bannerlər.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/10">
          <Upload className="w-4 h-4" /> Yeni Fayl Yüklə
        </button>
      </div>

      {/* Files List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                <th className="p-4">Fayl Adı</th>
                <th className="p-4">Növ</th>
                <th className="p-4">Həcm</th>
                <th className="p-4">Tarix</th>
                <th className="p-4 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {mediaFiles.map((f, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" /> {f.name}
                  </td>
                  <td className="p-4 text-slate-300">{f.type}</td>
                  <td className="p-4 text-slate-400 font-mono">{f.size}</td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">{f.date}</td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
