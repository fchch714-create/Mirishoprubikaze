'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function OrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          unit_price_azn,
          subtotal_azn,
          product_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Sifarişləri yükləyərkən xəta:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) {
      alert('Xəta: ' + error.message);
    } else {
      fetchOrders();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Sifarişlər yüklənir...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="p-4 font-semibold text-sm text-gray-700">ID / Tarix</th>
            <th className="p-4 font-semibold text-sm text-gray-700">Müştəri / Əlaqə</th>
            <th className="p-4 font-semibold text-sm text-gray-700">Ünvan / Üsul</th>
            <th className="p-4 font-semibold text-sm text-gray-700">Məbləğ</th>
            <th className="p-4 font-semibold text-sm text-gray-700">Status</th>
            <th className="p-4 font-semibold text-sm text-gray-700 text-right">Əməliyyat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="p-4 text-sm text-gray-500">
                <span className="font-mono text-black font-medium">{order.id.slice(0, 8)}</span>
                <br />
                {new Date(order.created_at).toLocaleDateString('az-AZ', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </td>
              <td className="p-4 text-sm">
                <span className="font-bold text-gray-900 block">{order.customer_name}</span>
                <span className="text-gray-600 block">{order.customer_phone}</span>
                {order.customer_instagram && (
                  <span className="text-purple-600 font-medium text-xs">@{order.customer_instagram}</span>
                )}
              </td>
              <td className="p-4 text-sm">
                <span className="block max-w-[200px] truncate text-gray-700" title={order.delivery_address}>
                  {order.delivery_address}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-800 text-xs font-medium rounded">
                  {order.delivery_method}
                </span>
              </td>
              <td className="p-4 text-sm">
                <span className="font-bold text-gray-900 block">{order.total_amount_azn.toFixed(2)} AZN</span>
                <span className={`text-xs font-semibold ${order.checkout_platform === 'whatsapp' ? 'text-green-600' : 'text-purple-600'}`}>
                  {order.checkout_platform.toUpperCase()}
                </span>
              </td>
              <td className="p-4 text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status === 'pending' ? 'Gözləyir' : order.status === 'completed' ? 'Tamamlandı' : 'Ləğv Edildi'}
                </span>
              </td>
              <td className="p-4 text-sm text-right space-x-2">
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')} 
                      className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors"
                    >
                      Tamamla
                    </button>
                    <button 
                      onClick={() => updateStatus(order.id, 'cancelled')} 
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      Ləğv et
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                Sistemdə heç bir sifariş tapılmadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
