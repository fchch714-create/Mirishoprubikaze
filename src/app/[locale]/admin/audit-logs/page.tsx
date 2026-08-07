'use client';

import React from 'react';
import { History, ShieldAlert, CheckCircle, Info, Clock, User } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const logs = [
    { id: 'log-1', action: 'Sistem Girişi', user: 'Mirsəlim Admin', ip: '185.230.12.4', time: '2026-07-30 14:22:01', status: 'Ugurlu' },
    { id: 'log-2', action: 'Məhsul Redaktə Edildi (Moyu RS3M)', user: 'Mirsəlim Admin', ip: '185.230.12.4', time: '2026-07-30 12:15:30', status: 'Ugurlu' },
    { id: 'log-3', action: 'Kupon Əlavə Edildi (SUMMER2026)', user: 'Mirsəlim Admin', ip: '185.230.12.4', time: '2026-07-29 18:40:12', status: 'Ugurlu' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <History className="w-3.5 h-3.5" /> Audit Logları
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Sistem Audit & Log Təhlükəsizliyi</h1>
          <p className="text-slate-400 text-xs mt-1">Admin panelində icra olunan bütün əməliyyatların audit qeydləri.</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                <th className="p-4">Əməliyyat</th>
                <th className="p-4">İstifadəçi</th>
                <th className="p-4">IP Ünvanı</th>
                <th className="p-4">Tarix / Vaxt</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white">{l.action}</td>
                  <td className="p-4 text-slate-300 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" /> {l.user}
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">{l.ip}</td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">{l.time}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                      {l.status}
                    </span>
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
