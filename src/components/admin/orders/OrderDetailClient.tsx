"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Save, FileText, Download, Printer, Truck, CheckCircle, Clock, XCircle, AlertCircle, ShoppingBag, Send, MessagesSquare, Box, ArrowRightLeft, MapPin, Receipt, CreditCard } from 'lucide-react';
import { getOrderDetail, updateOrderStatus, updatePaymentStatus, updateOrderTracking, addOrderInternalNote } from '@/lib/actions/admin';

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [orderStatus, setOrderStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      const res = await getOrderDetail(orderId);
      if (res.success && res.order) {
        setOrder(res.order);
        setOrderStatus(res.order.shipping_status);
        setPaymentStatus(res.order.payment_status);
        setTrackingNumber(res.order.tracking_number || '');
        setLogs(res.logs || []);
        setError(null);
      } else {
        setError(res.error || 'Sifariş tapılmadı');
      }
    } catch (err: any) {
      setError(err.message || 'Sifariş yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const p1 = updateOrderStatus(orderId, orderStatus as any);
      const p2 = updatePaymentStatus(orderId, paymentStatus as any);
      const [r1, r2] = await Promise.all([p1, p2]);
      if (r1.success && r2.success) {
        alert('Sifariş və ödəniş statusları uğurla yeniləndi.');
        await fetchOrder();
      } else {
        alert('Xəta baş verdi: ' + (r1.error || r2.error));
      }
    } catch (err: any) {
      alert('Xəta: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTracking = async () => {
    setIsSavingTracking(true);
    try {
      const res = await updateOrderTracking(orderId, trackingNumber);
      if (res.success) {
        alert('İzləmə nömrəsi uğurla yeniləndi.');
        await fetchOrder();
      } else {
        alert('Xəta: ' + res.error);
      }
    } catch (err: any) {
      alert('Xəta: ' + err.message);
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleAddNote = async () => {
    if (!internalNote.trim()) return;
    setIsSavingNote(true);
    try {
      const res = await addOrderInternalNote(orderId, internalNote);
      if (res.success) {
        setInternalNote('');
        alert('Daxili qeyd uğurla əlavə edildi.');
        await fetchOrder();
      } else {
        alert('Xəta: ' + res.error);
      }
    } catch (err: any) {
      alert('Xəta: ' + err.message);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Clock className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm text-slate-400">Sifariş məlumatları yüklənir...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-slate-400 font-bold">{error || 'Sifariş tapılmadı.'}</p>
        <Link href="/admin/orders" className="text-sm text-amber-500 hover:underline mt-2">
          Sifarişlər siyahısına qayıt
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(order.created_at).toLocaleString('az-AZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-amber-500" /> Sifariş: #{String(order.id).substring(0, 8).toUpperCase()}
            </h2>
            <p className="text-sm text-slate-400 mt-1">{formattedDate} • {order.customer_name} tərəfindən yaradılıb</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={isSaving}
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Yadda saxlanılır...' : 'Dəyişiklikləri Saxla'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Controllers */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
            <h3 className="text-lg font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-500" /> Sifariş Statusu
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Çatdırılma / Ümumi Status</label>
                <select 
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none font-medium"
                >
                  <option value="pending">Gözləyir (Pending)</option>
                  <option value="shipped">Kargoya Verilib / Yoldadır (Shipped)</option>
                  <option value="delivered">Çatdırılıb (Delivered)</option>
                  <option value="returned">Geri Qaytarılıb (Returned)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Ödəniş Statusu (Manual)</label>
                <select 
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none font-medium"
                >
                  <option value="pending">Ödənilməyib (Pending)</option>
                  <option value="paid">Tam Ödənilib (Paid)</option>
                  <option value="failed">Uğursuz (Failed)</option>
                  <option value="refunded">Geri Qaytarılıb (Refunded)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ordered Items */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-soft-md">
            <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-500" /> Sifariş Məhsulları
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {order.order_items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_title} className="w-12 h-12 bg-slate-800 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                          <Box className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white">{item.product_title}</div>
                        <div className="text-xs text-slate-400 font-mono mt-1">SKU: {item.sku}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white font-bold">{item.subtotal_azn.toFixed(2)} ₼</div>
                      <div className="text-xs text-slate-400 mt-1">{item.quantity} x {item.unit_price_azn.toFixed(2)} ₼</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                <div className="flex justify-between text-sm text-slate-400 font-mono">
                  <span>Subtotal:</span>
                  <span>{Number(order.subtotal || 0).toFixed(2)} ₼</span>
                </div>
                {Number(order.discount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-red-400 font-mono">
                    <span>Endirim:</span>
                    <span>-{Number(order.discount).toFixed(2)} ₼</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-400 font-mono">
                  <span>Çatdırılma:</span>
                  <span>{Number(order.shipping_fee || 0).toFixed(2)} ₼</span>
                </div>
                <div className="flex justify-between text-lg font-black text-white font-mono mt-2 pt-2 border-t border-slate-800/50">
                  <span>Cəmi:</span>
                  <span className="text-amber-500">{Number(order.total || 0).toFixed(2)} ₼</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Engine (Timeline) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Sifariş Tarixçəsi / Loqlar
            </h3>
            
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Sifariş üçün hələ heç bir hərəkət qeydə alınmayıb.</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800">
                {logs.map((log: any, idx: number) => {
                  const logDate = new Date(log.created_at).toLocaleString('az-AZ', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const isInternalNote = log.action === 'Internal Note Added';

                  return (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-soft-sm ${isInternalNote ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                        {isInternalNote ? <MessagesSquare className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-soft-sm">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-white text-sm">
                            {isInternalNote ? 'Daxili Qeyd' : log.action}
                          </h4>
                          <time className="font-mono text-xs text-slate-500">{logDate}</time>
                        </div>
                        <p className="text-sm text-slate-400">
                          {isInternalNote ? log.new_values?.note : (log.new_values ? JSON.stringify(log.new_values) : '')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
        
        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Logistics Hub */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
            <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" /> Logistika (Kargo)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">İzləmə Nömrəsi (Tracking No)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Məs: AZ1002345"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button 
                    disabled={isSavingTracking}
                    onClick={handleSaveTracking}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
            <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" /> Müştəri Məlumatları
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ad Soyad</div>
                <div className="text-sm text-white font-medium mt-0.5">{order.customer_name}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Telefon / WhatsApp</div>
                <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 font-mono mt-0.5 underline block">
                  {order.customer_phone}
                </a>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Instagram</div>
                <div className="text-sm text-slate-300 mt-0.5">@{order.customer_instagram}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Çatdırılma Ünvanı</div>
                <div className="text-sm text-slate-300 mt-0.5">{order.delivery_address}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">E-poçt</div>
                <div className="text-sm text-slate-300 mt-0.5 font-mono">{order.email}</div>
              </div>
            </div>
          </div>

          {/* Document Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
            <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-500" /> Sənədlər & Çap
            </h3>
            
            <div className="space-y-2">
              <button onClick={() => window.print()} className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors text-sm text-slate-300 font-medium">
                <span className="flex items-center gap-2"><Receipt className="w-4 h-4" /> İnvoys (Çap Et)</span>
                <Printer className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
            <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <MessagesSquare className="w-4 h-4 text-amber-500" /> Daxili Qeydlər
            </h3>
            
            <div className="space-y-3">
              <textarea 
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Yalnız adminlər görə bilər..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
              ></textarea>
              <button 
                disabled={isSavingNote || !internalNote.trim()}
                onClick={handleAddNote}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-slate-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {isSavingNote ? 'Göndərilir...' : 'Qeyd Əlavə Et'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
