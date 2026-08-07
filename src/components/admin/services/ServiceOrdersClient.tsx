'use client';

import * as React from 'react';
import { Search, Clock, Wrench, PackageCheck, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { getServiceOrders, updateServiceOrderStatus, ServiceOrderDB } from '@/lib/actions/services';

export default function ServiceOrdersClient() {
  const [orders, setOrders] = React.useState<ServiceOrderDB[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    const res = await getServiceOrders();
    if (res.success && res.orders) {
      setOrders(res.orders);
    } else {
      setError(res.error || 'Xidmət sifarişlərini yükləmək alınmadı.');
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    const res = await updateServiceOrderStatus(id, status);
    if (res.success) {
      fetchOrders();
    } else {
      alert(res.error || 'Status dəyişdirilərkən xəta baş verdi.');
    }
  };

  const filteredOrders = orders.filter(order => 
    (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (order.customer_phone || '').includes(searchQuery) ||
    (order.service_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: ServiceOrderDB['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            Növbədə (Pending)
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Wrench className="h-3.5 w-3.5" />
            Təmir Edilir (In Progress)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PackageCheck className="h-3.5 w-3.5" />
            Tamamlandı (Completed)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-slate-800 text-slate-500 border border-slate-700">
            Ləğv Edildi (Cancelled)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-500" />
            Gözləyən Setup & Təmir Sifarişləri
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={fetchOrders}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
              title="Yenilə"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Müştəri adı və ya nömrə..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-full transition-all focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Xidmət növbəsi yüklənir...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="p-4 whitespace-nowrap">Qeydiyyat Tarixi</th>
                  <th className="p-4">Müştəri / Əlaqə</th>
                  <th className="p-4">Tələb Olunan Xidmət</th>
                  <th className="p-4 whitespace-nowrap">Məbləğ</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString('az-AZ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">{order.customer_name}</span>
                        <span className="text-xs text-slate-400 mt-0.5 font-mono">{order.customer_phone}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-black bg-slate-800 text-amber-400 border border-amber-500/20 w-fit">
                          + {order.service_name}
                        </span>
                        {order.notes && (
                          <div className="mt-1 text-xs text-slate-400 bg-slate-950 p-2 rounded-md border border-slate-800 border-l-2 border-l-amber-500">
                            <span className="font-bold text-slate-300 block mb-0.5">Müştəri Qeydi:</span>
                            {order.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white font-mono">{order.price.toFixed(2)} AZN</td>
                    <td className="p-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-4 text-right">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-amber-500 transition-colors cursor-pointer"
                      >
                        <option value="pending">Növbədə (Pending)</option>
                        <option value="in_progress">Təmir Edilir (In Progress)</option>
                        <option value="completed">Tamamlandı (Completed)</option>
                        <option value="cancelled">Ləğv Edildi (Cancelled)</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Xidmət növbəsi boşdur.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
