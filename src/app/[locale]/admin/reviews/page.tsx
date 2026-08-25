'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Trash2, CheckCircle2, Search, Filter, ShieldCheck, RefreshCw, AlertCircle, XCircle } from 'lucide-react';
import { 
  getAllReviewsAdminAction, 
  updateReviewStatusAdminAction, 
  deleteReviewAdminAction 
} from '@/lib/actions/reviews';

interface ReviewItem {
  id: string;
  product_id?: string;
  user_id?: string;
  rating: number;
  comment: string;
  is_approved?: boolean;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
  products?: {
    name_az?: string;
    title_az?: string;
    slug?: string;
  } | null;
}

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAllReviewsAdminAction();
      if (res.success && Array.isArray(res.data)) {
        setReviews(res.data);
      } else {
        setReviews([]);
        if (res.error) {
          setErrorMsg(res.error);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Rəylər yüklənərkən xəta baş verdi');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleStatus = async (id: string, isApproved: boolean) => {
    setIsProcessing(id);
    try {
      const res = await updateReviewStatusAdminAction(id, isApproved);
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: isApproved } : r));
      } else {
        alert(res.error || 'Status yenilənmədi');
      }
    } catch (err: any) {
      alert(err?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rəyi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır.')) {
      return;
    }

    setIsProcessing(id);
    try {
      const res = await deleteReviewAdminAction(id);
      if (res.success) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        alert(res.error || 'Rəy silinmədi');
      }
    } catch (err: any) {
      alert(err?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(null);
    }
  };

  const filtered = reviews.filter(r => {
    const prodTitle = r.products?.title_az || r.products?.name_az || 'Kub Məhsulu';
    const customerName = r.profiles?.full_name || r.profiles?.email || 'Müştəri';
    const comment = r.comment || '';

    const matchesSearch = prodTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'All' || 
                          (filterStatus === 'Approved' && r.is_approved) ||
                          (filterStatus === 'Pending' && !r.is_approved);

    return matchesSearch && matchesFilter;
  });

  const totalReviewsCount = reviews.length;
  const approvedCount = reviews.filter(r => r.is_approved).length;
  const pendingCount = reviews.filter(r => !r.is_approved).length;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <Star className="w-3.5 h-3.5" /> Məhsul Rəyləri & Reytinqlər
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">Rəylərin İdarə Edilməsi</h1>
          <p className="text-slate-400 text-xs mt-1">Müştərilərin məhsullar haqqında yazdığı real rəyləri təsdiqləyin və ya moderatorluq edin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchReviews} 
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
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
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ümumi Rəylər</span>
          <span className="text-2xl font-black text-white mt-1 block">{totalReviewsCount}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Təsdiqlənənlər</span>
          <span className="text-2xl font-black text-green-400 mt-1 block">{approvedCount}</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gözləyənlər</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{pendingCount}</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Məhsul və ya müştəri axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="All">Bütün Statuslar</option>
            <option value="Approved">Təsdiqlənənlər</option>
            <option value="Pending">Gözləyənlər</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                <th className="p-4">Məhsul</th>
                <th className="p-4">Müştəri</th>
                <th className="p-4">Reytinq</th>
                <th className="p-4">Rəy</th>
                <th className="p-4">Tarix</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Məlumatlar bazadan yüklənir...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-bold text-sm text-slate-300">Hələ heç bir rəy qeydə alınmayıb</p>
                    <p className="text-xs text-slate-500 mt-1">Müştərilər məhsullara rəy bildirdikdə avtomatik burada əks olunacaq.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((rev) => {
                  const prodTitle = rev.products?.title_az || rev.products?.name_az || 'Kub Məhsulu';
                  const customerName = rev.profiles?.full_name || rev.profiles?.email || 'Müştəri';
                  const dateStr = rev.created_at ? new Date(rev.created_at).toLocaleDateString('az-AZ') : '-';

                  return (
                    <tr key={rev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white max-w-[200px] truncate">{prodTitle}</td>
                      <td className="p-4 text-slate-300 font-medium">{customerName}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 max-w-[300px] whitespace-pre-wrap">{rev.comment}</td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">{dateStr}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          rev.is_approved 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {rev.is_approved ? 'Təsdiqlənib' : 'Gözləmədə'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {rev.is_approved ? (
                          <button 
                            onClick={() => handleToggleStatus(rev.id, false)}
                            disabled={isProcessing === rev.id}
                            className="px-2.5 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                          >
                            Deaktiv et
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleStatus(rev.id, true)}
                            disabled={isProcessing === rev.id}
                            className="px-2.5 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                          >
                            Təsdiqlə
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(rev.id)}
                          disabled={isProcessing === rev.id}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          title="Rəyi sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
