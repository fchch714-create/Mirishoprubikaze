'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  ArrowLeft,
  Boxes,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  Clock,
  Info,
  AlertTriangle
} from 'lucide-react';
import { SupplierReportItem } from '@/lib/actions/preorders';

interface SupplierReportClientProps {
  locale: string;
  initialReport: SupplierReportItem[];
  totalUnitsToOrder: number;
}

export default function SupplierReportClient({
  locale,
  initialReport,
  totalUnitsToOrder
}: SupplierReportClientProps) {
  const [report, setReport] = React.useState<SupplierReportItem[]>(initialReport);
  const [expandedProduct, setExpandedProduct] = React.useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = React.useState(false);

  const toggleExpand = (prodId: string) => {
    setExpandedProduct(expandedProduct === prodId ? null : prodId);
  };

  const handleCopySummaryText = () => {
    let summaryText = `📦 TƏCHİZATÇI (ÇİN) SİFARİŞ HESABATI - ${new Date().toLocaleDateString('az-AZ')}\n`;
    summaryText += `==========================================\n\n`;

    report.forEach((item, idx) => {
      summaryText += `${idx + 1}. ${item.product_title}\n`;
      summaryText += `   👉 Çindən Alınmalı Miqdar: ${item.total_preorder_quantity} ədəd\n`;
      summaryText += `   📌 Ölkədəki Cari Stok: ${item.current_stock} ədəd\n\n`;
    });

    summaryText += `\n🔴 ÜMUMİ ÇİNDƏN SİFARİŞ EDİLƏCƏK MƏHSUL SAYI: ${totalUnitsToOrder} ƏDƏD\n`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/admin/preorders`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Ön Sifarişlər Siyahısına Qayıt
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-amber-400" />
            Təchizatçı Hesabatı (Çin Sifariş Sayğacı)
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Ödənişi təsdiqlənmiş ön sifarişlər üçün təchizatçıya veriləcək xalis miqdar cəmi (SUM)
          </p>
        </div>

        <button
          onClick={handleCopySummaryText}
          disabled={report.length === 0}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20 text-sm cursor-pointer disabled:opacity-50"
        >
          {copiedSummary ? (
            <>
              <Check className="w-4 h-4 text-emerald-950" />
              Siyahı Kopyalandı!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Çin Sifariş Siyahısını Kopyala
            </>
          )}
        </button>
      </div>

      {/* Critical Information Box */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-2 font-black uppercase text-amber-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Təchizatçı Sayğacı Şərtləri & Xatırlatma
        </div>
        <p>
          • Bu hesabat yalnız statusu <strong>Ödəniş Təsdiqlənib (paid_confirmed)</strong> və ya <strong>Anbara Ayrılıb (assigned)</strong> olan ön sifarişlərin miqdarını (<code>SUM(quantity)</code>) avtomatik toplayır.
        </p>
        <p>
          • <strong>Qeyd:</strong> Bu hesabat avtomatik Çinə sifariş göndərmir. Siz bu rəqəmlər əsasında fabrik və ya distribyutora manual sifariş verirsiniz.
        </p>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Çindən Sifariş Verilməli Ümumi Say
            </span>
            <span className="text-3xl font-black text-amber-400 tracking-tight">
              {totalUnitsToOrder} <span className="text-base font-bold text-slate-400">ədəd</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Ön Sifarişi Olan Məhsul Modelləri
            </span>
            <span className="text-3xl font-black text-white tracking-tight">
              {report.length} <span className="text-base font-bold text-slate-400">fərqli model</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Product Breakdown List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white tracking-tight">Məhsul Üzrə Sifariş Bölgüsü</h2>

        {report.length === 0 ? (
          <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center text-slate-400 space-y-2">
            <Info className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-bold text-slate-300">Hal-hazırda təchizatçıya göndərilməli təsdiqlənmiş ön sifariş yoxdur.</p>
            <p className="text-xs text-slate-500">Müştərilərin ödənişi təsdiqləndikdə məhsullar avtomatik bu siyahıda görünəcəkdir.</p>
          </div>
        ) : (
          report.map((item) => {
            const isExpanded = expandedProduct === item.product_id;
            return (
              <div
                key={item.product_id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 transition-all"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product_image}
                      alt={item.product_title}
                      className="w-14 h-14 object-cover rounded-2xl border border-slate-800 shrink-0"
                    />
                    <div>
                      <h3 className="font-black text-white text-base leading-snug">
                        {item.product_title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Cari Stok: <strong className="text-slate-200">{item.current_stock} ədəd</strong></span>
                        <span>•</span>
                        <span>Müştəri Sayı: <strong className="text-slate-200">{item.confirmed_preorders_count} nəfər</strong></span>
                        <span>•</span>
                        <span>Çatdırılma: <strong className="text-amber-400">{item.lead_time}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 rounded-2xl text-right">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Təchizatçıya Veriləcək</span>
                      <span className="text-xl font-black text-amber-400">{item.total_preorder_quantity} ƏDƏD</span>
                    </div>

                    <button
                      onClick={() => toggleExpand(item.product_id)}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors cursor-pointer"
                      title="Müştəriləri Göstər"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Customer Details List */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-800/80 space-y-3 animate-fade-in">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Bu Məhsul Üzrə Təsdiqlənmiş Sifarişçilər
                    </h4>
                    <div className="divide-y divide-slate-800/60 bg-slate-950/60 rounded-2xl border border-slate-800 p-3">
                      {item.preorders_list.map((cust) => (
                        <div key={cust.id} className="py-2.5 flex items-center justify-between text-xs text-slate-300 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {cust.preorder_code}
                            </span>
                            <div>
                              <span className="font-bold text-white block">{cust.customer_name}</span>
                              <span className="text-slate-500 text-[11px]">{cust.customer_phone}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-amber-400 text-sm">{cust.quantity} ədəd</span>
                            {cust.paid_at && (
                              <span className="block text-[10px] text-emerald-400/80">
                                Ödənildi: {new Date(cust.paid_at).toLocaleDateString('az-AZ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
