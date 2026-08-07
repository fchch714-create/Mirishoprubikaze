'use client';

import React, { useState } from 'react';
import { HelpCircle, MessageSquare, PhoneCall, Send, Clock, CheckCircle2, AlertCircle, RefreshCw, User } from 'lucide-react';

interface SupportTicket {
  id: string;
  customerName: string;
  phone: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Closed';
  date: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TCK-101',
      customerName: 'Orxan Əliyev',
      phone: '+994 50 123 45 67',
      subject: 'GAN 13 MagLev stokda var?',
      message: 'Salam, GAN 13 MagLev modelinin gəlmə vaxtını bilmək istərdim.',
      status: 'Open',
      date: '2026-07-30 11:20'
    },
    {
      id: 'TCK-102',
      customerName: 'Nərmin Məmmədova',
      phone: '+994 55 987 65 43',
      subject: 'Nizami metrosuna çatdırılma vaxtı',
      message: 'Bu gün saat 16:00-da Nizami m/s çatdırmaq mümkündür?',
      status: 'In Progress',
      date: '2026-07-30 09:45'
    }
  ]);

  const toggleStatus = (id: string, newStatus: 'Open' | 'In Progress' | 'Closed') => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <HelpCircle className="w-3.5 h-3.5" /> Dəstək & CRM Mərkəzi
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Müştəri Müraciətləri</h1>
          <p className="text-slate-400 text-xs mt-1">Müştərilərdən gələn suallar, WhatsApp/Zəng sorğuları və dəstək biletləri.</p>
        </div>
        <button 
          onClick={() => {}} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" /> Yenilə
        </button>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.map((tck) => (
          <div key={tck.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400">{tck.id}</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                tck.status === 'Open' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                tck.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                'bg-slate-800 text-slate-400'
              }`}>
                {tck.status}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-white">{tck.subject}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{tck.message}</p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold text-slate-200">{tck.customerName}</span>
                <span className="text-slate-500">({tck.phone})</span>
              </div>
              <span className="text-[10px] font-mono">{tck.date}</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`https://wa.me/${tck.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-center rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Cavabla
              </a>
              {tck.status !== 'Closed' && (
                <button
                  onClick={() => toggleStatus(tck.id, 'Closed')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Bağla
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
