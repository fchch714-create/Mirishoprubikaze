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

  const generateInvoiceHtml = () => {
    const itemsRows = (order.order_items && order.order_items.length > 0)
      ? order.order_items.map((item, idx) => {
          const title = item.product_title || 'Speedcube Məhsulu';
          const sku = item.sku || 'SKU-NONE';
          const qty = Number(item.quantity || 1);
          const unitPrice = Number(item.unit_price_azn || item.price_azn || 0);
          const totalItem = Number(item.subtotal_azn || item.total_azn || unitPrice * qty);
          return `
            <tr>
              <td style="padding: 10px 14px; text-align: center; color: #64748b; font-family: monospace; font-size: 11px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
              <td style="padding: 10px 14px; font-weight: 600; color: #0f172a; font-size: 12px; border-bottom: 1px solid #e2e8f0;">${title}</td>
              <td style="padding: 10px 14px; color: #64748b; font-family: monospace; font-size: 11px; border-bottom: 1px solid #e2e8f0;">${sku}</td>
              <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #0f172a; font-size: 12px; border-bottom: 1px solid #e2e8f0;">${qty}</td>
              <td style="padding: 10px 14px; text-align: right; font-family: monospace; color: #334155; font-size: 12px; border-bottom: 1px solid #e2e8f0;">${unitPrice.toFixed(2)} ₼</td>
              <td style="padding: 10px 14px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; font-size: 12px; border-bottom: 1px solid #e2e8f0;">${totalItem.toFixed(2)} ₼</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="6" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic; border-bottom: 1px solid #e2e8f0;">
            Məhsul məlumatları tapılmadı
          </td>
        </tr>
      `;

    return `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elektron İnvoys - ${invoiceNumber} - RubikShop.az</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .action-bar {
      background: #0f172a;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }
    .action-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #d97706;
    }
    .invoice-body {
      padding: 36px 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #D8232A;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-badge {
      display: inline-block;
      width: 28px;
      height: 28px;
      background: #D8232A;
      color: white;
      border-radius: 6px;
      text-align: center;
      line-height: 28px;
      font-size: 15px;
      font-weight: 900;
    }
    .brand-sub {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      margin-top: 4px;
    }
    .brand-law {
      font-size: 11px;
      color: #475569;
      margin-top: 4px;
      max-width: 420px;
      line-height: 1.4;
    }
    .inv-info {
      text-align: right;
    }
    .inv-number {
      display: inline-block;
      padding: 4px 12px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .inv-date {
      font-size: 12px;
      color: #475569;
      margin-top: 6px;
    }
    .inv-status {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .status-pending {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fcd34d;
    }
    .grid-parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 24px;
    }
    .col-title {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
    }
    .party-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .party-row {
      font-size: 12px;
      color: #475569;
      margin-bottom: 3px;
      line-height: 1.4;
    }
    .party-row strong {
      color: #334155;
    }
    .border-left-party {
      border-left: 1px solid #e2e8f0;
      padding-left: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
    }
    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-top: 10px;
    }
    .secure-note {
      max-width: 380px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .secure-title {
      font-size: 12px;
      font-weight: 700;
      color: #166534;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .totals-card {
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #475569;
      margin-bottom: 8px;
    }
    .final-row {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 6px;
    }
    .final-amount {
      color: #D8232A;
      font-family: monospace;
      font-size: 17px;
    }
    .footer-box {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }
    .verif-code {
      font-family: monospace;
      font-weight: 700;
      color: #334155;
      letter-spacing: 0.5px;
    }

    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .action-bar {
        display: none !important;
      }
      .invoice-card {
        max-width: 100% !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .invoice-body {
        padding: 10mm 12mm !important;
      }
      @page {
        size: A4 portrait;
        margin: 8mm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="action-bar">
      <div class="action-title">
        <span>📄 Elektron Satış Qəbzi / İnvoys (${invoiceNumber})</span>
      </div>
      <button class="btn-print" onclick="window.print()">
        <span>🖨️ Çap Et (PDF Saxla)</span>
      </button>
    </div>

    <div class="invoice-body">
      <!-- Header -->
      <div class="header">
        <div>
          <div class="brand-title">
            <span class="brand-badge">🛍</span>
            <span>RUBIKSHOP.AZ</span>
          </div>
          <div class="brand-sub">Professional Speedcubing & Zəka Oyunları Mağazası</div>
          <div class="brand-law">
            AR "Elektron ticarət haqqında" Qanunu və Vergi Məcəlləsinin 16.1.8-ci maddəsinə uyğun rəsmi elektron satış sənədi
          </div>
        </div>

        <div class="inv-info">
          <div class="inv-number">${invoiceNumber}</div>
          <div class="inv-date">Tarix: <strong style="color:#0f172a; font-family:monospace;">${formattedDate}</strong></div>
          <div>
            <span class="inv-status ${isPaid ? 'status-paid' : 'status-pending'}">
              ${isPaid ? '✓ ÖDƏNİLİB' : '⏱ ' + paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <!-- Parties -->
      <div class="grid-parties">
        <div>
          <div class="col-title">SATICI (FƏRDİ SAHİBKAR)</div>
          <div class="party-title">${legalInfo.ownerName || 'RubikShop.az (Fərdi Sahibkar)'}</div>
          <div class="party-row"><strong>VÖEN:</strong> <span style="font-family:monospace; font-weight:700; color:#0f172a;">${legalInfo.voen || '1307525381'}</span></div>
          <div class="party-row"><strong>Fəaliyyət Kodu:</strong> <span style="font-family:monospace;">${legalInfo.activityCode}</span> (İnternetlə pərakəndə ticarət)</div>
          <div class="party-row"><strong>Ünvan:</strong> ${legalInfo.address}</div>
          <div class="party-row"><strong>Əlaqə:</strong> ${legalInfo.phone} | ${legalInfo.email}</div>
        </div>

        <div class="border-left-party">
          <div class="col-title">ALICI (MÜŞTƏRİ)</div>
          <div class="party-title">${customerName}</div>
          <div class="party-row"><strong>Telefon:</strong> <span style="font-family:monospace;">${customerPhone}</span></div>
          <div class="party-row"><strong>E-poçt:</strong> <span style="font-family:monospace;">${customerEmail}</span></div>
          <div class="party-row"><strong>Çatdırılma Ünvanı:</strong> ${customerAddress}</div>
          ${order.tracking_number ? `<div class="party-row"><strong>Kargo İzləmə №:</strong> <span style="font-family:monospace; font-weight:700; color:#0f172a;">${order.tracking_number}</span></div>` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th style="text-align:center; width:40px;">№</th>
            <th>Məhsulun Adı</th>
            <th style="font-family:monospace;">SKU</th>
            <th style="text-align:center;">Say</th>
            <th style="text-align:right;">Qiymət (AZN)</th>
            <th style="text-align:right;">Məbləğ (AZN)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Totals & Security Note -->
      <div class="summary-section">
        <div class="secure-note">
          <div class="secure-title">🛡 3D-Secure Nağdsız Elektron Ödəniş</div>
          <p>
            Bu sənəd avtomatik olaraq elektron sistem tərəfindən generasiya edilmişdir. Ödəniş nağdsız bank kanalları vasitəsilə həyata keçirildiyindən fiziki NKA kassa çeki tələb olunmur.
          </p>
        </div>

        <div class="totals-card">
          <div class="calc-row">
            <span>Ara cəm (Subtotal):</span>
            <span style="font-family:monospace; font-weight:600;">${subtotal.toFixed(2)} ₼</span>
          </div>

          ${discount > 0 ? `
            <div class="calc-row" style="color:#e11d48;">
              <span>Endirim:</span>
              <span style="font-family:monospace; font-weight:600;">-${discount.toFixed(2)} ₼</span>
            </div>
          ` : ''}

          <div class="calc-row">
            <span>Çatdırılma:</span>
            <span style="font-family:monospace; font-weight:600;">${shippingFee.toFixed(2)} ₼</span>
          </div>

          <div class="final-row">
            <span>YEKUN CƏM:</span>
            <span class="final-amount">${finalTotal.toFixed(2)} ₼</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-box">
        <div>
          <strong style="color:#334155;">RubikShop.az Elektron Ticarət Platforması</strong> • Bütün hüquqlar qorunur.
        </div>
        <div class="verif-code">
          VERİFİKASİYA KODU: RS-${orderIdShort}-${Date.now().toString().slice(-4)}
        </div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error(e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = generateInvoiceHtml();
    
    // Method 1: Try dedicated popup window (best for mobile & desktop)
    const printWindow = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow && printWindow.document) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }

    // Method 2: Fallback to hidden iframe for environments blocking popup
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print error:', e);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 400);
    } else {
      // Last resort fallback
      window.print();
    }
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

      {/* Native Print Styles */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
