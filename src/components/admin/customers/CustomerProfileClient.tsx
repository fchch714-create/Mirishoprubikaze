"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Save, MapPin, ShoppingBag, Heart, Star, Briefcase, Mail, Phone, Calendar, Clock, CreditCard, UserCheck, ShieldAlert, FileText, Plus, Loader2 } from 'lucide-react';
import { getCustomersCRM, updateCustomerCRM, CRMCustomer } from '@/lib/actions/crm';

export default function CustomerProfileClient({ customerId }: { customerId: string }) {
  const [activeTab, setActiveTab] = useState('orders'); // orders, wishlist, addresses
  const [customer, setCustomer] = useState<CRMCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // CRM Form fields
  const [customerType, setCustomerType] = useState<'B2C' | 'B2B'>('B2C');
  const [customerSegment, setCustomerSegment] = useState<'New' | 'Regular' | 'VIP' | 'Wholesale' | 'Churn Risk'>('Regular');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [customerId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    const res = await getCustomersCRM();
    if (res.success && res.customers) {
      const found = res.customers.find(c => c.id === customerId);
      if (found) {
        setCustomer(found);
        setCustomerType(found.type);
        setCustomerSegment(found.segment);
        setNotes(found.notes || '');
      } else {
        setError('Müştəri tapılmadı.');
      }
    } else {
      setError(res.error || 'Profil məlumatlarını yükləmək mümkün olmadı.');
    }
    setLoading(false);
  };

  const handleSaveCRM = async () => {
    if (!customer) return;
    setSaving(true);
    setSaveSuccess('');
    setError('');

    const res = await updateCustomerCRM(customer.id, {
      customer_type: customerType,
      crm_segment: customerSegment,
      crm_notes: notes
    });

    if (res.success) {
      setSaveSuccess('CRM tənzimləmələri uğurla yeniləndi!');
      // Refresh the local state info
      fetchProfile();
    } else {
      setError(res.error || 'Yadda saxlanılarkən səhv baş verdi.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Müştəri profili yüklənir...</p>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <div className="text-red-400 font-bold">{error}</div>
        <Link href="/admin/customers" className="inline-flex items-center gap-2 text-amber-500 font-black text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> CRM Siyahısına Qayıt
        </Link>
      </div>
    );
  }

  const initials = customer?.name ? customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'M';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers" className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-amber-500" /> Müştəri Profili
            </h2>
            <p className="text-sm text-slate-400 mt-1">ID: {customerId} • Qeydiyyat: {customer?.registered || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveCRM}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Dəyişiklikləri Saxla
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-2xl">
          {saveSuccess}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar - Profile & CRM */}
        <div className="space-y-6">
          
          {/* Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
                {initials}
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{customer?.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                    Aktiv Müştəri
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <a href={`mailto:${customer?.email}`} className="text-sm text-white hover:text-amber-500 transition-colors">{customer?.email}</a>
              </div>
              {customer?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <a href={`tel:${customer?.phone}`} className="text-sm text-white hover:text-amber-500 transition-colors font-mono">{customer?.phone}</a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-300 font-mono">Qeydiyyat: {customer?.registered || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Lifetime Value (LTV)</div>
                <div className="text-xl font-black text-amber-500 font-mono">{customer?.ltv.toFixed(2)} ₼</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Sifarişlər</div>
                <div className="text-lg font-bold text-white font-mono">{customer?.ordersCount}</div>
              </div>
            </div>
          </div>

          {/* CRM Tools */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
            <h3 className="text-sm font-black text-white mb-5 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-500" /> CRM Tənzimləmələri
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Müştəri Tipi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setCustomerType('B2C')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      customerType === 'B2C' 
                        ? 'bg-amber-500 text-slate-950 shadow-soft-sm' 
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    B2C (Pərakəndə)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCustomerType('B2B')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-1 ${
                      customerType === 'B2B' 
                        ? 'bg-purple-500 text-white shadow-soft-sm' 
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    B2B <Briefcase className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Seqment / Qrup</label>
                <select 
                  value={customerSegment}
                  onChange={(e) => setCustomerSegment(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none font-medium"
                >
                  <option value="New">Yeni (New)</option>
                  <option value="Regular">Daimi (Regular)</option>
                  <option value="VIP">VIP</option>
                  <option value="Wholesale">Topdansatış (Wholesale)</option>
                  <option value="Churn Risk">Risk (Churn Risk)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Sistem Teqləri</label>
                <div className="flex flex-wrap gap-2">
                  {customerType === 'B2B' && (
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/20">Topdan Alıcı</span>
                  )}
                  {customer && customer.ltv >= 100 && (
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-lg border border-amber-500/20">Yüksək LTV</span>
                  )}
                  <span className="px-2.5 py-1 bg-slate-850 text-slate-400 text-xs font-bold rounded-lg border border-slate-800">Sadiqlik balı mövcuddur</span>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" /> Daxili CRM Qeydləri
              </h3>
              <button
                onClick={handleSaveCRM}
                disabled={saving}
                className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 text-[11px] font-black uppercase tracking-wider rounded-lg border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Qeydi Saxla
              </button>
            </div>
            <textarea 
              rows={4}
              placeholder="Yalnız adminlər görə bilər..."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
            <p className="text-[10px] text-slate-500">Daxili qeydlər müştəriyə göstərilmir, daxili komanda üçündür.</p>
          </div>

        </div>

        {/* Right Column - Data & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar bg-slate-900 p-2 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'orders' 
                  ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Sifariş Tarixçəsi
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'addresses' 
                  ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <MapPin className="w-4 h-4" /> Ünvanlar
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md min-h-[500px]">
            
            {activeTab === 'orders' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Sifariş Tarixçəsi</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Sifariş ID</th>
                        <th className="px-4 py-3">Tarix</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Məbləğ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {customer?.ordersList.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-4 font-bold text-white">
                            <span className="font-mono text-xs text-slate-300 block max-w-[120px] truncate">{ord.id}</span>
                          </td>
                          <td className="px-4 py-4 font-mono text-xs">
                            {new Date(ord.created_at).toLocaleString('az-AZ')}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Tamamlanıb</span>
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-white">{ord.total.toFixed(2)} ₼</td>
                        </tr>
                      ))}
                      {(!customer || customer.ordersList.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                            Bu müştəri hələ heç bir sifariş verməyib.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Yadda Saxlanılan Ünvanlar</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl relative">
                    <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Varsayılan</span>
                    <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> Çatdırılma Ünvanı
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-mono">
                      Bakı şəhəri, Metro stansiyası çatdırılması.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
