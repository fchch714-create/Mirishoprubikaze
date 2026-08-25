'use client';

import React, { useState } from 'react';
import { FileText, Download, Calendar, DollarSign, Package, TrendingUp, RefreshCw, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getOrders } from '@/lib/actions/admin';
import { getProducts } from '@/lib/actions/catalog';
import { getAllTicketsAdminAction } from '@/lib/actions/tickets';

export default function AdminReportsPage() {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Helper function to download real CSV with UTF-8 BOM
  const triggerCsvDownload = (filename: string, csvContent: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportOrders = async () => {
    setDownloadingType('orders');
    setStatusMessage('Sifarişlər bazadan oxunur...');
    try {
      const res = await getOrders();
      const orders = Array.isArray(res) ? res : (res as any)?.orders || [];

      if (orders.length === 0) {
        alert('Bazada ixrac ediləcək heç bir sifariş tapılmadı.');
        return;
      }

      let csv = 'Sifaris_ID,Musteri,Email,Telefon,Unvan,Mebleg_AZN,Odenis_Statusu,Catdirilma_Statusu,Tarix\n';
      orders.forEach((o: any) => {
        const id = `"${(o.id || '').replace(/"/g, '""')}"`;
        const name = `"${(o.customer_name || o.full_name || '').replace(/"/g, '""')}"`;
        const email = `"${(o.customer_email || o.email || '').replace(/"/g, '""')}"`;
        const phone = `"${(o.customer_phone || o.phone || '').replace(/"/g, '""')}"`;
        const addr = `"${(o.shipping_address || '').replace(/"/g, '""')}"`;
        const total = (o.total || 0).toFixed(2);
        const pStatus = o.payment_status || 'pending';
        const sStatus = o.shipping_status || o.status || 'pending';
        const date = o.created_at ? new Date(o.created_at).toISOString().slice(0, 19).replace('T', ' ') : '';

        csv += `${id},${name},${email},${phone},${addr},${total},${pStatus},${sStatus},${date}\n`;
      });

      triggerCsvDownload(`rubikshop_sifarisler_${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setStatusMessage('Sifarişlər hesabatı uğurla yükləndi!');
    } catch (err: any) {
      alert('Xəta baş verdi: ' + (err?.message || 'Hesabat yaradılmadı'));
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportProducts = async () => {
    setDownloadingType('products');
    setStatusMessage('Məhsul kataloqu bazadan oxunur...');
    try {
      const res = await getProducts();
      const products = Array.isArray(res) ? res : (res as any)?.products || [];

      if (products.length === 0) {
        alert('Bazada ixrac ediləcək heç bir məhsul tapılmadı.');
        return;
      }

      let csv = 'ID,SKU,Mehsul_Adi,Qiymet_AZN,Stok_Sayi,Kateqoriya,Aktivdir\n';
      products.forEach((p: any) => {
        const id = `"${(p.id || '').replace(/"/g, '""')}"`;
        const sku = `"${(p.sku || '').replace(/"/g, '""')}"`;
        const name = `"${(p.name_az || p.title_az || '').replace(/"/g, '""')}"`;
        const price = (p.price_azn || p.price || 0).toFixed(2);
        const stock = p.stock ?? 0;
        const cat = `"${(p.category?.name_az || p.category_id || '').replace(/"/g, '""')}"`;
        const isActive = p.is_active ?? true ? 'Bəli' : 'Xeyr';

        csv += `${id},${sku},${name},${price},${stock},${cat},${isActive}\n`;
      });

      triggerCsvDownload(`rubikshop_inventar_${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setStatusMessage('İnventar hesabatı uğurla yükləndi!');
    } catch (err: any) {
      alert('Xəta baş verdi: ' + (err?.message || 'Hesabat yaradılmadı'));
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportTickets = async () => {
    setDownloadingType('tickets');
    setStatusMessage('Dəstək müraciətləri oxunur...');
    try {
      const res = await getAllTicketsAdminAction('all');
      const tickets = Array.isArray(res.tickets) ? res.tickets : [];

      if (tickets.length === 0) {
        alert('Bazada heç bir dəstək müraciəti tapılmadı.');
        return;
      }

      let csv = 'ID,Movzu,Metn,Status,Prioritet,Elaqe_Email,Tarix\n';
      tickets.forEach((t: any) => {
        const id = `"${(t.id || '').replace(/"/g, '""')}"`;
        const subject = `"${(t.subject || '').replace(/"/g, '""')}"`;
        const message = `"${(t.message || '').replace(/"/g, '""')}"`;
        const status = t.status || 'open';
        const priority = t.priority || 'medium';
        const email = `"${(t.contact_email || '').replace(/"/g, '""')}"`;
        const date = t.created_at ? new Date(t.created_at).toISOString().slice(0, 19).replace('T', ' ') : '';

        csv += `${id},${subject},${message},${status},${priority},${email},${date}\n`;
      });

      triggerCsvDownload(`rubikshop_destek_hesabati_${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setStatusMessage('Dəstək hesabatı uğurla yükləndi!');
    } catch (err: any) {
      alert('Xəta baş verdi: ' + (err?.message || 'Hesabat yaradılmadı'));
    } finally {
      setDownloadingType(null);
    }
  };

  const reportsList = [
    {
      id: 'orders',
      title: 'Satış və Sifarişlər Hesabatı',
      description: 'Müştəri sifarişləri, ünvanlar, məbləğlər və çatdırılma statusları.',
      period: 'Bütün Dövr',
      format: 'CSV (Excel)',
      type: 'Satış',
      action: handleExportOrders
    },
    {
      id: 'products',
      title: 'Anbar və İnventar Hesabatı',
      description: 'Mövcud məhsul bazası, SKU kodları, qiymətlər və stok qalıqları.',
      period: 'Cari Stok',
      format: 'CSV (Excel)',
      type: 'İnventar',
      action: handleExportProducts
    },
    {
      id: 'tickets',
      title: 'Müştəri Dəstək və CRM Hesabatı',
      description: 'Müştərilərdən daxil olan bütün dəstək biletləri və statuslar.',
      period: 'Bütün Dövr',
      format: 'CSV (Excel)',
      type: 'CRM',
      action: handleExportTickets
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <FileText className="w-3.5 h-3.5" /> Sistem Hesabatları & Ekspor
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Maliyyə & Əməliyyat Hesabatları</h1>
          <p className="text-slate-400 text-xs mt-1">Supabase bazasındakı real məlumatları CSV formatında ixrac edin və təhlil edin.</p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportsList.map((rep) => (
          <div key={rep.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-4 shadow-lg">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">{rep.type}</span>
              <h3 className="font-bold text-base text-white">{rep.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{rep.description}</p>
              <p className="text-xs text-slate-500 font-mono pt-1">{rep.period} • {rep.format}</p>
            </div>
            
            <button 
              onClick={rep.action}
              disabled={downloadingType === rep.id}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloadingType === rep.id ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> İxrac Olunur...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> CSV Yüklə
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
