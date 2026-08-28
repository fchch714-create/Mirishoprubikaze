"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Mail, X, CheckCircle, ShieldCheck, FileText, AlertCircle, ShoppingBag } from 'lucide-react';
import { resendOrderInvoiceEmail } from '@/lib/actions/admin';
import { getSettings } from '@/lib/actions/settings';

interface OrderItem {
  product_title?: string;
  sku?: string;
  quantity?: number;
  unit_price_azn?: number;
  subtotal_azn?: number;
  price_azn?: number;
  total_azn?: number;
}

interface OrderData {
  id: string;
  created_at: string;
  customer_name?: string;
  full_name?: string;
  customer_phone?: string;
  phone?: string;
  delivery_address?: string;
  shipping_address?: string;
  email?: string;
  payment_method?: string;
  payment_status?: string;
  shipping_status?: string;
  tracking_number?: string;
  subtotal?: number;
  discount?: number;
  shipping_fee?: number;
  total?: number;
  total_amount_azn?: number;
  order_items?: OrderItem[];
}

interface ElectronicInvoiceModalProps {
  order: OrderData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ElectronicInvoiceModal({ order, isOpen, onClose }: ElectronicInvoiceModalProps) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  
  // Dynamic Legal Settings
  const [legalInfo, setLegalInfo] = useState({
    ownerName: '',
    voen: '',
    activityCode: '47.91.0',
    address: 'Bakı şəhəri, Azərbaycan',
    phone: '+994 50 668 49 25',
    email: 'info@rubikshop.az'
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getSettings('general');
        if (res.success && res.data) {
          setLegalInfo({
            ownerName: res.data.legalOwnerName || '',
            voen: res.data.legalVoen || '',
            activityCode: res.data.legalActivityCode || '47.91.0',
            address: res.data.legalAddress || res.data.address || 'Bakı şəhəri, Azərbaycan',
            phone: res.data.contactPhone || '+994 50 668 49 25',
            email: res.data.contactEmail || 'info@rubikshop.az'
          });
        }
      } catch (err) {
        console.warn('Could not load invoice legal info:', err);
      }
    }
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const orderIdShort = String(order.id).substring(0, 8).toUpperCase();
  const invoiceNumber = `INV-${orderIdShort}`;
  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const customerName = order.customer_name || order.full_name || 'Alıcı';
  const customerPhone = order.customer_phone || order.phone || '—';
  const customerAddress = order.delivery_address || order.shipping_address || '—';
  const customerEmail = order.email || '—';

  const subtotal = Number(order.subtotal || order.total || order.total_amount_azn || 0);
  const discount = Number(order.discount || 0);
  const shippingFee = Number(order.shipping_fee || 0);
  const finalTotal = Number(order.total || order.total_amount_azn || subtotal + shippingFee - discount);

  const paymentStatus = order.payment_status === 'paid' ? 'ÖDƏNİLİB' : (order.payment_status === 'refunded' ? 'GERİ QAYTARILIB' : 'GÖZLƏYİR');
  const isPaid = order.payment_status === 'paid';

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const res = await resendOrderInvoiceEmail(order.id);
      if (res.success) {
        setEmailStatus({ success: true, message: res.message || 'İnvoys müştərinin e-poçtuna göndərildi!' });
      } else {
        setEmailStatus({ success: false, message: res.error || 'İnvoys göndərilərkən xəta baş verdi' });
      }
    } catch (err: any) {
      setEmailStatus({ success: false, message: err.message || 'Xəta baş verdi' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Container */}
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 print:m-0 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">Elektron Satış Qəbzi / İnvoys ({invoiceNumber})</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              title="Müştərinin e-poçtuna göndər"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{isSendingEmail ? 'Göndərilir...' : 'E-poçta Göndər'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Çap et və ya PDF kimi yadda saxla"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Çap Et (PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors ml-2 cursor-pointer"
              title="Bağla"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Status Alert (Hidden in Print) */}
        {emailStatus && (
          <div className={`px-6 py-3 text-xs flex items-center gap-2 font-medium print:hidden ${emailStatus.success ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'}`}>
            {emailStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{emailStatus.message}</span>
          </div>
        )}

        {/* Printable Invoice Body */}
        <div id="printable-invoice-content" className="p-8 sm:p-10 font-sans space-y-6 text-slate-800 bg-white">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D8232A] text-white flex items-center justify-center font-black text-base">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[#D8232A]">RUBIKSHOP.AZ</h1>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">Professional Speedcubing & Zəka Oyunları Mağazası</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-sm">
                AR &quot;Elektron ticarət haqqında&quot; Qanunu və Vergi Məcəlləsinin 16.1.8-ci maddəsinə uyğun rəsmi elektron satış sənədi
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-900 border border-slate-300">
                {invoiceNumber}
              </div>
              <div className="text-xs text-slate-600 font-medium mt-1.5">
                Tarix: <span className="font-mono font-bold text-slate-900">{formattedDate}</span>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                  {isPaid ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Seller & Customer Requisites Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            
            {/* Seller Info */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">SATICI (Fərdi Sahibkar)</span>
              <div className="font-bold text-slate-900 text-sm">{legalInfo.ownerName || 'RubikShop.az (Fərdi Sahibkar)'}</div>
              <div className="text-slate-600"><span className="font-semibold text-slate-700">VÖEN:</span> <span className="font-mono font-bold text-slate-900">{legalInfo.voen || '1307525381'}</span></div>
              <div className="text-slate-600"><span className="font-semibold text-slate-700">Fəaliyyət Kodu:</span> <span className="font-mono">{legalInfo.activityCode}</span> (İnternetlə pərakəndə ticarət)</div>
              <div className="text-slate-600"><span className="font-semibold text-slate-700">Ünvan:</span> {legalInfo.address}</div>
              <div className="text-slate-600"><span className="font-semibold text-slate-700">Əlaqə:</span> {legalInfo.phone} | {legalInfo.email}</div>
            </div>

            {/* Buyer Info */}
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-6">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">ALICI (Müştəri)</span>
              <div className="font-bold text-slate-900 text-sm">{customerName}</div>
              <div className="text-slate-600"><span className="font-semibold text-slate-700">Telefon:</span> <span className="font-mono">{customerPhone}</span></div>
              <div className="text-slate-600"><span className="font-semibold text-slate-700">E-poçt:</span> <span className="font-mono">{customerEmail}</span></div>
              <div className="text-slate-600"><span className="font-semibold text-slate-700">Çatdırılma Ünvanı:</span> {customerAddress}</div>
              {order.tracking_number && (
                <div className="text-slate-600"><span className="font-semibold text-slate-700">Kargo İzləmə №:</span> <span className="font-mono font-bold text-slate-900">{order.tracking_number}</span></div>
              )}
            </div>

          </div>

          {/* Items Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4 text-center w-10">№</th>
                  <th className="py-3 px-4">Məhsulun Adı</th>
                  <th className="py-3 px-4 font-mono">SKU</th>
                  <th className="py-3 px-4 text-center">Say</th>
                  <th className="py-3 px-4 text-right">Qiymət (AZN)</th>
                  <th className="py-3 px-4 text-right">Məbləğ (AZN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item, idx) => {
                    const title = item.product_title || 'Speedcube Məhsulu';
                    const sku = item.sku || 'SKU-001';
                    const qty = Number(item.quantity || 1);
                    const unitPrice = Number(item.unit_price_azn || item.price_azn || 0);
                    const totalItem = Number(item.subtotal_azn || item.total_azn || unitPrice * qty);

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{title}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{sku}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">{qty}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">{unitPrice.toFixed(2)} ₼</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{totalItem.toFixed(2)} ₼</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center text-slate-400 italic">
                      Məhsul məlumatları tapılmadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            
            <div className="text-xs text-slate-500 max-w-sm space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3D-Secure Nağdsız Elektron Ödəniş</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Bu sənəd avtomatik olaraq elektron sistem tərəfindən generasiya edilmişdir. Ödəniş nağdsız bank kanalları vasitəsilə həyata keçirildiyindən fiziki NKA kassa çeki tələb olunmur.
              </p>
            </div>

            <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Ara cəm (Subtotal):</span>
                <span className="font-mono font-medium">{subtotal.toFixed(2)} ₼</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Endirim:</span>
                  <span className="font-mono font-medium">-{discount.toFixed(2)} ₼</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Çatdırılma:</span>
                <span className="font-mono font-medium">{shippingFee.toFixed(2)} ₼</span>
              </div>

              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>YEKUN CƏM:</span>
                <span className="font-mono text-base text-[#D8232A]">{finalTotal.toFixed(2)} ₼</span>
              </div>
            </div>

          </div>

          {/* Footer Legal Stamp Box */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2">
            <div>
              <span className="font-bold text-slate-700">RubikShop.az Elektron Ticarət Platforması</span> • Bütün hüquqlar qorunur.
            </div>
            <div className="font-mono font-bold text-slate-700 uppercase tracking-widest text-[9px]">
              VERİFİKASİYA KODU: RS-{orderIdShort}-{Date.now().toString().slice(-4)}
            </div>
          </div>

        </div>

      </div>

      {/* Global Print Media Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-content, #printable-invoice-content * {
            visibility: visible !important;
          }
          #printable-invoice-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
