"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, FileText, Download, MoreVertical, CheckCircle, Clock, XCircle, AlertCircle, ShoppingBag, ChevronDown } from 'lucide-react';
import { updateOrderStatus } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';

export default function OrdersListClient({ initialOrders }: { initialOrders: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const router = useRouter();

  const filteredOrders = initialOrders.filter(order => {
    const customerName = order.customer_name || '';
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const orderStatus = order.status || 'pending';
    const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    const res = await updateOrderStatus(orderId, newStatus as any);
    if (res.success) {
      router.refresh(); // Refresh page to get updated orders
    } else {
      alert("Status güncəllənərkən xəta baş verdi.");
    }
    setIsUpdating(null);
  };

  const getStatusBadge = (status: string) => {
    const s = status || 'pending';
    switch(s) {
      case 'pending':
      case 'awaiting_payment':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock className="w-3 h-3" /> Gözləyir</span>;
      case 'processing':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20"><AlertCircle className="w-3 h-3" /> Hazırlanır</span>;
      case 'shipped':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20"><Clock className="w-3 h-3" /> Kargoya Verilib</span>;
      case 'delivered':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle className="w-3 h-3" /> Çatdırılıb</span>;
      case 'cancelled':
      case 'returned':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3 h-3" /> Ləğv / İadə</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">{s}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Sifarişlər</h2>
          <p className="text-sm text-slate-400 mt-1">Sifarişlərin idarəedilməsi və logistik əməliyyatlar.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20">
            <Plus className="w-4 h-4" /> Yeni Sifariş (Manual)
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-soft-md">
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/50">
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'pending', 'shipped', 'delivered', 'returned'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  statusFilter === s 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {s === 'all' ? 'Bütün' : s}
              </button>
            ))}
          </div>
              
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Sifariş Nö. və ya Müştəri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
              <tr>
                <th className="px-6 py-4">Sifariş ID / Tarix</th>
                <th className="px-6 py-4">Müştəri</th>
                <th className="px-6 py-4">Məhsul Sayı</th>
                <th className="px-6 py-4">Məbləğ</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOrders.map((order) => {
                const totalAmount = order.total_amount_azn || order.total || 0;
                const itemsCount = order.order_items?.length || 0;
                return (
                  <tr key={order.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-bold text-white hover:text-amber-500 transition-colors inline-flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-slate-500" /> {String(order.id).substring(0, 8).toUpperCase()}
                      </Link>
                      <div className="font-mono text-xs text-slate-500 mt-1">{new Date(order.created_at).toLocaleString('az-AZ')}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{order.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">{itemsCount} növ</td>
                    <td className="px-6 py-4 font-mono font-bold text-white">{Number(totalAmount).toFixed(2)} AZN</td>
                    <td className="px-6 py-4">
                      <div className="relative group/status inline-block">
                        {getStatusBadge(order.status)}
                        
                        {/* Custom Dropdown for quick status change */}
                        <div className="absolute top-full left-0 mt-1 hidden group-hover/status:flex flex-col bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 w-32 overflow-hidden">
                          {['pending', 'shipped', 'delivered', 'returned'].map(newStatus => (
                            <button 
                              key={newStatus}
                              disabled={isUpdating === order.id}
                              onClick={() => handleStatusUpdate(order.id, newStatus)}
                              className="px-3 py-2 text-xs text-left hover:bg-slate-700 text-white transition-colors disabled:opacity-50"
                            >
                              {newStatus}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/orders/${order.id}`} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Invoice">
                          <FileText className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Məlumat tapılmadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
