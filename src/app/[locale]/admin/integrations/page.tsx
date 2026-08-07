'use client';

import React from 'react';
import { Share2, CheckCircle2, MessageSquare, Database, Shield, Zap } from 'lucide-react';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function AdminIntegrationsPage() {
  const integrations = [
    {
      name: 'WhatsApp Direct Checkout API',
      description: 'Müştərilərin səbətdən WhatsApp-a avtomatik sifariş formatlanması (994506684925).',
      status: 'Aktiv',
      icon: MessageSquare,
      color: 'text-green-400 bg-green-500/10 border-green-500/20'
    },
    {
      name: 'Instagram Direct Integration',
      description: 'Instagram @rubikshop.az profilinə avtomatik keçid və DM yönləndirilməsi.',
      status: 'Aktiv',
      icon: InstagramIcon,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
    },
    {
      name: 'Supabase Database & Auth',
      description: 'Məhsul katalogu, istifadəçilər və real-time məlumat bazası inteqrasiyası.',
      status: 'Aktiv',
      icon: Database,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      name: 'Google Analytics 4 (GA4)',
      description: 'Ziyarətçi analitikası və sifariş dönüşümlərinin izlənməsi.',
      status: 'Aktiv',
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <Share2 className="w-3.5 h-3.5" /> Xarici İnteqrasiyalar
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">İnteqrasiyalar və Xidmətlər</h1>
          <p className="text-slate-400 text-xs mt-1">RubikShop.az ilə əlaqəli WhatsApp, Instagram, Supabase və xarici servislər.</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl border ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
