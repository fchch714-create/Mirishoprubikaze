'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HelpCircle, MessageSquare, PhoneCall, Send, Clock, CheckCircle2, AlertCircle, RefreshCw, User, Mail, ShieldAlert } from 'lucide-react';
import { getAllTicketsAdminAction, updateTicketStatusAction } from '@/lib/actions/tickets';

interface SupportTicket {
  id: string;
  user_id?: string | null;
  customerName?: string;
  contact_email?: string | null;
  phone?: string | null;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAllTicketsAdminAction(filterStatus);
      if (res.success && Array.isArray(res.tickets)) {
        setTickets(res.tickets as SupportTicket[]);
      } else {
        setTickets([]);
        if (res.error) {
          setErrorMsg(res.error);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Müraciətlər yüklənərkən xəta baş verdi');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (id: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    setIsUpdating(id);
    try {
      const res = await updateTicketStatusAction(id, newStatus);
      if (res.success) {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      } else {
        alert(res.error || 'Status yenilənmədi');
      }
    } catch (err: any) {
      alert(err?.message || 'Xəta baş verdi');
    } finally {
      setIsUpdating(null);
    }
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <HelpCircle className="w-3.5 h-3.5" /> Dəstək & CRM Mərkəzi
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Müştəri Müraciətləri</h1>
          <p className="text-slate-400 text-xs mt-1">Müştərilərdən gələn real dəstək biletləri və əlaqə sorğuları.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchTickets} 
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenilə
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Açıq Müraciətlər</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{openCount}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">İcrada Olanlar</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">{inProgressCount}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Həll Olunmuş</span>
          <span className="text-2xl font-black text-green-400 mt-1 block">{resolvedCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'Hamısı' },
          { id: 'open', label: 'Açıq' },
          { id: 'in_progress', label: 'İcrada' },
          { id: 'resolved', label: 'Həll Olunmuş' },
          { id: 'closed', label: 'Bağlı' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-amber-500" />
          <span>Dəstək müraciətləri bazadan yüklənir...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="font-bold text-base text-slate-300">Heç bir dəstək müraciəti tapılmadı</p>
          <p className="text-xs text-slate-500 mt-1">Müştərilər dəstək və ya əlaqə forması vasitəsilə sorğu göndərdikdə burada görünəcək.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((tck) => {
            const customerName = tck.profiles?.full_name || tck.customerName || 'Müştəri';
            const customerPhone = tck.profiles?.phone || tck.phone || '';
            const customerEmail = tck.contact_email || tck.profiles?.email || '';
            const dateStr = tck.created_at ? new Date(tck.created_at).toLocaleString('az-AZ') : '-';

            return (
              <div key={tck.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">#{tck.id.slice(0, 8)}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    tck.status === 'open' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    tck.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    tck.status === 'resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {tck.status === 'open' ? 'Açıq' : 
                     tck.status === 'in_progress' ? 'İcrada' : 
                     tck.status === 'resolved' ? 'Həll olunub' : 'Bağlı'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-base text-white">{tck.subject}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{tck.message}</p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col gap-1 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold text-slate-200">{customerName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{dateStr}</span>
                  </div>

                  {customerEmail && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <a href={`mailto:${customerEmail}`} className="hover:text-amber-400">{customerEmail}</a>
                    </div>
                  )}

                  {customerPhone && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <PhoneCall className="w-3 h-3 text-slate-500" />
                      <span>{customerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {customerPhone ? (
                    <a
                      href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-center rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Cavabla
                    </a>
                  ) : customerEmail ? (
                    <a
                      href={`mailto:${customerEmail}?subject=RubikShop Dəstək: ${encodeURIComponent(tck.subject)}`}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email Cavabla
                    </a>
                  ) : null}

                  {tck.status !== 'closed' && (
                    <button
                      onClick={() => handleUpdateStatus(tck.id, tck.status === 'open' ? 'in_progress' : 'closed')}
                      disabled={isUpdating === tck.id}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {tck.status === 'open' ? 'İcraya götür' : 'Bağla'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
