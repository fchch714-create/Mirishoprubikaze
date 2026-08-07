'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Search,
  Plus,
  CheckCircle2,
  PackageCheck,
  Truck,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  Copy,
  Check,
  Edit3,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  getAdminPreordersAction,
  createPreorderAction,
  updatePreorderStatusAction,
  updatePreorderNotesAction,
  deletePreorderAction,
  checkStockAllocationNeedAction,
  confirmStockAllocationAction,
  PreorderItem
} from '@/lib/actions/preorders';

interface PreordersAdminClientProps {
  locale: string;
  initialPreorders: PreorderItem[];
  productsList: any[];
}

export default function PreordersAdminClient({
  locale,
  initialPreorders,
  productsList
}: PreordersAdminClientProps) {
  const [preorders, setPreorders] = React.useState<PreorderItem[]>(initialPreorders);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showNotesModal, setShowNotesModal] = React.useState<PreorderItem | null>(null);
  const [notesInput, setNotesInput] = React.useState('');

  // Stock Sync Modal State
  const [showStockSyncModal, setShowStockSyncModal] = React.useState(false);
  const [syncProductId, setSyncProductId] = React.useState('');
  const [syncQty, setSyncQty] = React.useState<number>(1);
  const [syncChecking, setSyncChecking] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<any | null>(null);
  const [syncConfirming, setSyncConfirming] = React.useState(false);

  // Create Form State
  const [newProductId, setNewProductId] = React.useState('');
  const [newCustomerName, setNewCustomerName] = React.useState('');
  const [newCustomerPhone, setNewCustomerPhone] = React.useState('');
  const [newCustomerEmail, setNewCustomerEmail] = React.useState('');
  const [newQuantity, setNewQuantity] = React.useState(1);
  const [newAdminNotes, setNewAdminNotes] = React.useState('');
  const [createSubmitting, setCreateSubmitting] = React.useState(false);
  const [createError, setCreateError] = React.useState('');

  // Toast / Copy notification state
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const fetchPreorders = React.useCallback(async () => {
    setLoading(true);
    const res = await getAdminPreordersAction({
      status: selectedStatus,
      search: search
    });
    if (res.success && res.data) {
      setPreorders(res.data);
    }
    setLoading(false);
  }, [selectedStatus, search]);

  React.useEffect(() => {
    fetchPreorders();
  }, [fetchPreorders]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: 'pending_payment' | 'paid_confirmed' | 'assigned' | 'fulfilled' | 'cancelled'
  ) => {
    const res = await updatePreorderStatusAction(id, newStatus);
    if (res.success) {
      setActionSuccess(`Status yeniləndi: ${getStatusLabel(newStatus)}`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchPreorders();
    } else {
      alert(res.error || 'Status dəyişdirilərkən xəta baş verdi');
    }
  };

  const handleSaveNotes = async () => {
    if (!showNotesModal) return;
    const res = await updatePreorderNotesAction(showNotesModal.id, notesInput);
    if (res.success) {
      setActionSuccess('Qeyd uğurla yadda saxlanıldı');
      setTimeout(() => setActionSuccess(null), 3000);
      setShowNotesModal(null);
      fetchPreorders();
    } else {
      alert(res.error || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`${code} kodlu ön sifarişi silməyə əminsiniz?`)) return;
    const res = await deletePreorderAction(id);
    if (res.success) {
      setActionSuccess(`${code} silindi`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchPreorders();
    } else {
      alert(res.error || 'Silinərkən xəta baş verdi');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductId || !newCustomerName || !newCustomerPhone) {
      setCreateError('Zəhmət olmasa məhsul, müştəri adı və telefon nömrəsini daxil edin');
      return;
    }

    setCreateSubmitting(true);
    setCreateError('');

    const res = await createPreorderAction({
      product_id: newProductId,
      customer_name: newCustomerName,
      customer_phone: newCustomerPhone,
      customer_email: newCustomerEmail || null,
      quantity: newQuantity,
      admin_notes: newAdminNotes || null
    });

    setCreateSubmitting(false);

    if (res.success) {
      setShowCreateModal(false);
      setNewProductId('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewQuantity(1);
      setNewAdminNotes('');
      setActionSuccess('Yeni ön sifariş uğurla yaradıldı!');
      setTimeout(() => setActionSuccess(null), 3000);
      fetchPreorders();
    } else {
      setCreateError(res.error || 'Ön sifariş yaradılarkən xəta baş verdi');
    }
  };

  const handleCheckStockSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncProductId || syncQty <= 0) return;
    setSyncChecking(true);
    setSyncResult(null);

    const res = await checkStockAllocationNeedAction(syncProductId, syncQty);
    setSyncChecking(false);
    if (res.success) {
      setSyncResult(res);
    } else {
      alert(res.error || 'Stok yoxlanarkən xəta baş verdi.');
    }
  };

  const handleConfirmStockAllocation = async () => {
    if (!syncProductId || !syncResult || !syncResult.suggestedAllocationCount) return;
    setSyncConfirming(true);

    const res = await confirmStockAllocationAction({
      productId: syncProductId,
      allocatedUnits: syncResult.suggestedAllocationCount,
      addedStockQty: syncQty
    });

    setSyncConfirming(false);
    if (res.success) {
      setActionSuccess(res.message);
      setTimeout(() => setActionSuccess(null), 4000);
      setShowStockSyncModal(false);
      setSyncResult(null);
      setSyncProductId('');
      setSyncQty(1);
      fetchPreorders();
    } else {
      alert(res.error || 'Stok ayırılarkən xəta baş verdi.');
    }
  };

  const getStatusBadge = (status: string, queuePos?: number | null) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Ödəniş Gözləyir
          </span>
        );
      case 'paid_confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ödəniş Təsdiqlənib {queuePos ? `(Sıra #${queuePos})` : ''}
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <PackageCheck className="w-3.5 h-3.5" />
            Anbarda Rezerv Olunub {queuePos ? `(Sıra #${queuePos})` : ''}
          </span>
        );
      case 'fulfilled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Truck className="w-3.5 h-3.5" />
            Çatdırıldı / Tamamlandı
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Ləğv Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Ödəniş Gözləyir';
      case 'paid_confirmed': return 'Ödəniş Təsdiqlənib';
      case 'assigned': return 'Anbarda Rezerv Olunub';
      case 'fulfilled': return 'Çatdırıldı';
      case 'cancelled': return 'Ləğv Edildi';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">
            <Clock className="w-4 h-4" /> Faza 1: Ön Sifariş Sistemi
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ön Sifarişlər (Pre-Orders)</h1>
          <p className="text-slate-400 text-sm mt-1">
            Stokda olmayan məhsullar üçün daxil olan ön sifarişlərin və dinamik növbənin idarə edilməsi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setShowStockSyncModal(true);
              setSyncResult(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-sm cursor-pointer"
          >
            <PackageCheck className="w-4 h-4 text-blue-200" />
            Stok Daxil Et & Növbəyə Ayır
          </button>

          <Link
            href={`/${locale}/admin/preorders/supplier-report`}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20 text-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Təchizatçı Hesabatı (Çin Sayğacı)
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Manual Ön Sifariş
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-sm font-bold flex items-center justify-between animate-fade-in">
          <span>{actionSuccess}</span>
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )}

      {/* Status Filter Tabs & Search */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { key: 'all', label: 'Hamısı' },
              { key: 'pending_payment', label: 'Ödəniş Gözləyən' },
              { key: 'paid_confirmed', label: 'Təsdiqlənmiş (Sıra)' },
              { key: 'assigned', label: 'Anbarda Ayrılmış' },
              { key: 'fulfilled', label: 'Çatdırılmış' },
              { key: 'cancelled', label: 'Ləğv Edilmiş' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedStatus === tab.key
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kod, ad və ya telefon..."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Pre-Orders List Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-sm font-bold">Ön sifarişlər yüklənir...</span>
          </div>
        ) : preorders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Info className="w-10 h-10 text-slate-600" />
            <p className="text-base font-bold text-slate-300">Heç bir ön sifariş tapılmadı</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Seçilmiş filtrə uyğun ön sifariş yoxdur və ya hələ sistemə daxil edilməyib.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Sifariş Kodu</th>
                  <th className="px-5 py-4">Müştəri Məlumatı</th>
                  <th className="px-5 py-4">Məhsul & Miqdar</th>
                  <th className="px-5 py-4">Status & Növbə</th>
                  <th className="px-5 py-4">Tarixlər</th>
                  <th className="px-5 py-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {preorders.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Code */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-400 text-sm bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {item.preorder_code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(item.preorder_code)}
                          title="Kodu kopyala"
                          className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedCode === item.preorder_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {item.admin_notes && (
                        <p className="text-[11px] text-amber-300/80 mt-1 italic max-w-xs truncate">
                          Qeyd: {item.admin_notes}
                        </p>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4 align-middle">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {item.customer_name}
                        </div>
                        <div className="text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {item.customer_phone}
                        </div>
                        {item.customer_email && (
                          <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-600" />
                            {item.customer_email}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product?.image_url || '/placeholder.png'}
                          alt=""
                          className="w-10 h-10 object-cover rounded-xl border border-slate-800 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white line-clamp-1">
                            {item.product?.title_az || 'Məhsul'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-slate-400 text-[11px]">
                              Say: <strong className="text-amber-400 font-bold">{item.quantity} ədəd</strong>
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 text-[11px]">
                              {item.product?.price_azn} AZN
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status & Queue */}
                    <td className="px-5 py-4 align-middle">
                      <div className="space-y-1">
                        {getStatusBadge(item.status, item.queue_position)}
                        {item.queue_position && (
                          <p className="text-[10px] text-slate-400 font-bold">
                            Təsdiqlənmiş FIFO nömrəsi: <span className="text-amber-400">#{item.queue_position}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="px-5 py-4 align-middle text-[11px] text-slate-400">
                      <div>Yaradıldı: {new Date(item.created_at).toLocaleDateString('az-AZ')}</div>
                      {item.paid_at && (
                        <div className="text-emerald-400/80 mt-0.5">
                          Ödənildi: {new Date(item.paid_at).toLocaleDateString('az-AZ')}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status Change Buttons */}
                        {item.status === 'pending_payment' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'paid_confirmed')}
                            className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                            title="Ödənişi təsdiqlə və sıraya əlavə et"
                          >
                            Ödənişi Təsdiqlə
                          </button>
                        )}

                        {item.status === 'paid_confirmed' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'assigned')}
                            className="px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/40 rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                            title="Məhsulu anbara rezerv et"
                          >
                            Anbara Ayır
                          </button>
                        )}

                        {item.status === 'assigned' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'fulfilled')}
                            className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                            title="Müştəriyə göndərildi deyə işarələ"
                          >
                            Çatdırıldı
                          </button>
                        )}

                        {item.status !== 'cancelled' && item.status !== 'fulfilled' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'cancelled')}
                            className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                            title="Sifarişi ləğv et"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Note Edit */}
                        <button
                          onClick={() => {
                            setShowNotesModal(item);
                            setNotesInput(item.admin_notes || '');
                          }}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                          title="Admin Qeydi Yaz"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item.id, item.preorder_code)}
                          className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Manual Pre-Order */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Yeni Manual Ön Sifariş Əlavə Et
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1.5">Məhsul Seçin *</label>
                  <select
                    value={newProductId}
                    onChange={(e) => setNewProductId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Məhsul seçin --</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title_az || p.title_en} ({p.price_azn} AZN - Stok: {p.stock_quantity ?? 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1.5">Müştəri Adı *</label>
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Məs.: Əli Məmmədov"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1.5">Telefon Nömrəsi *</label>
                    <input
                      type="text"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="+994 50 123 45 67"
                      required
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1.5">E-poç (İstəyə bağlı)</label>
                    <input
                      type="email"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      placeholder="eli@example.com"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1.5">Miqdar (Ədəd)</label>
                    <input
                      type="number"
                      min="1"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1.5">Admin Qeydi</label>
                  <textarea
                    rows={2}
                    value={newAdminNotes}
                    onChange={(e) => setNewAdminNotes(e.target.value)}
                    placeholder="Məs.: Whatsapp vasitəsilə müraciət etdi"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {createSubmitting ? 'Yaradılır...' : 'Yarat (Kodu Avtomatik Yaradılacaq)'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Admin Notes */}
      <AnimatePresence>
        {showNotesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Admin Qeydi - {showNotesModal.preorder_code}
              </h3>

              <textarea
                rows={4}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Ön sifariş haqqında xüsusi qeydinizi daxil edin..."
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Bağla
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
                >
                  Yadda saxla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Stock Arrival / Sync Confirmation */}
      <AnimatePresence>
        {showStockSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-base font-black text-white">Anbara Stok Daxil Et & Növbə Sinxronizasiyası</h3>
                    <p className="text-[11px] text-slate-400">Anbara yeni stok gəldikdə növbədəki ön sifarişçi müştərilərə stok ayırın</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStockSyncModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCheckStockSync} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1.5">Anbara Daxil Olan Məhsul *</label>
                  <select
                    value={syncProductId}
                    onChange={(e) => {
                      setSyncProductId(e.target.value);
                      setSyncResult(null);
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Məhsul seçin --</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title_az || p.title_en} (Cari Stok: {p.stock_quantity ?? 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1.5">Gələn Məhsul Miqdarı (Ədəd) *</label>
                  <input
                    type="number"
                    min={1}
                    value={syncQty}
                    onChange={(e) => {
                      setSyncQty(Math.max(1, Number(e.target.value)));
                      setSyncResult(null);
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={syncChecking || !syncProductId}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-md text-xs cursor-pointer disabled:opacity-50"
                >
                  {syncChecking ? 'Növbə Yoxlanılır...' : 'Stok Sinxronizasiyasını Yoxla'}
                </button>
              </form>

              {/* Confirmation Prompt Display */}
              {syncResult && (
                <div className="pt-4 border-t border-slate-800 space-y-4 animate-fade-in">
                  {syncResult.hasWaitingPreorders ? (
                    <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-3">
                      <div className="text-amber-400 font-black text-sm leading-snug">
                        ⚠️ &quot;Anbara {syncQty} ədəd gəldi. Növbədəki {syncResult.suggestedAllocationCount} nəfər üçün ayrılsın?&quot;
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed font-semibold">
                        Məhsul: <strong>{syncResult.productTitle}</strong>. Təsdiqlənmiş ödənişi olan növbədəki <strong>{syncResult.suggestedAllocationCount}</strong> ön sifarişçinin statusu <code>assigned</code> ediləcək və onlara avtomatik təsdiq e-poçtu göndəriləcəkdir.
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Növbədəki Müştərilər:</span>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {syncResult.preorders.map((item: any, idx: number) => (
                            <div key={item.id} className="p-2 bg-slate-950/80 rounded-xl text-[11px] text-slate-300 flex items-center justify-between border border-slate-800">
                              <div>
                                <span className="font-bold text-amber-400">#{idx + 1} {item.customer_name}</span> ({item.preorder_code})
                              </div>
                              <span className="font-mono text-slate-400">{item.quantity} ədəd</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={handleConfirmStockAllocation}
                          disabled={syncConfirming}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                        >
                          {syncConfirming ? 'İcra olunur...' : `Bəli, Növbədəki ${syncResult.suggestedAllocationCount} Nəfər Üçün Ayır & E-poçt Göndər`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold space-y-1">
                      <p>✅ Növbədə gözləyən təsdiqlənmiş ön sifariş tapılmadı.</p>
                      <p className="text-slate-400 font-normal">Bu məhsul üçün {syncQty} ədəd stok gəldiyi təqdirdə birbaşa ümumi stoka əlavə oluna bilər.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
