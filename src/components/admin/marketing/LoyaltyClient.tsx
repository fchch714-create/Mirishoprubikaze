"use client";

import React, { useState, useEffect } from 'react';
import { Star, Users, Mail, Plus, Edit3, Settings, Loader2, RefreshCw, X, Check, Save } from 'lucide-react';
import { 
  getLoyaltyParticipants, 
  updateLoyaltyPoints, 
  getNewsletterSubscribers, 
  getReferralParticipants,
  LoyaltyUser, 
  NewsletterSub,
  ReferralUser,
  ReferralRecordItem
} from '@/lib/actions/community';

export default function LoyaltyClient() {
  const [activeTab, setActiveTab] = useState('loyalty'); // loyalty, referrals, newsletter
  
  // Data states
  const [participants, setParticipants] = useState<LoyaltyUser[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSub[]>([]);
  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>([]);
  const [recordsList, setRecordsList] = useState<ReferralRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit points modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LoyaltyUser | null>(null);
  const [pointsInput, setPointsInput] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTabQuery();
  }, [activeTab]);

  const loadTabQuery = async () => {
    setLoading(true);
    setError('');
    
    if (activeTab === 'loyalty') {
      const res = await getLoyaltyParticipants();
      if (res.success && res.participants) {
        setParticipants(res.participants);
      } else {
        setError(res.error || 'Loyallıq xallarını yükləmək alınmadı.');
      }
    } else if (activeTab === 'referrals') {
      const res = await getReferralParticipants();
      if (res.success) {
        setReferralUsers(res.referralUsers || []);
        setRecordsList(res.recordsList || []);
      } else {
        setError(res.error || 'Referal məlumatlarını yükləmək alınmadı.');
      }
    } else if (activeTab === 'newsletter') {
      const res = await getNewsletterSubscribers();
      if (res.success && res.subscribers) {
        setSubscribers(res.subscribers);
      } else {
        setError(res.error || 'Abunəçi siyahısını yükləmək alınmadı.');
      }
    }
    setLoading(false);
  };

  const handleOpenEditPoints = (user: LoyaltyUser) => {
    setSelectedUser(user);
    setPointsInput(user.balance);
    setIsModalOpen(true);
  };

  const handleSavePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    const res = await updateLoyaltyPoints(selectedUser.user_id, pointsInput);
    if (res.success) {
      setIsModalOpen(false);
      loadTabQuery();
    } else {
      alert(res.error || 'Xallar yenilənərkən xəta baş verdi.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" /> Loyallıq & İcma (Community)
          </h2>
          <p className="text-sm text-slate-400 mt-1">Sadiqlik proqramı xalları, referal statistika liderləri və bülleten qeydiyyatları.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadTabQuery}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Yenilə"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'loyalty' 
              ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Star className="w-4 h-4" /> Loyallıq Xalları (Points)
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'referrals' 
              ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" /> Referal Sistemi
        </button>
        <button
          onClick={() => setActiveTab('newsletter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'newsletter' 
              ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Mail className="w-4 h-4" /> Xəbər Bülleteni (Newsletter)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Məlumatlar hesablanır...</p>
          </div>
        ) : (
          <>
            {activeTab === 'loyalty' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Müştəri Sadiqlik Xalları</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Müştəri / Email</th>
                        <th className="px-4 py-3">Cari Xal (Balance)</th>
                        <th className="px-4 py-3">Səviyyə (Tier)</th>
                        <th className="px-4 py-3">Son Yenilənmə</th>
                        <th className="px-4 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {participants.map((user) => (
                        <tr key={user.user_id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-bold text-white">{user.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</div>
                          </td>
                          <td className="px-4 py-4 font-mono font-black text-amber-500 text-md">
                            {user.balance} Xal
                          </td>
                          <td className="px-4 py-4">
                            {user.tier === 'Platin' && <span className="inline-block px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider rounded">Platin Səviyyə</span>}
                            {user.tier === 'Qızıl' && <span className="inline-block px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider rounded">Qızıl Səviyyə</span>}
                            {user.tier === 'Gümüş' && <span className="inline-block px-2 py-0.5 bg-slate-400/10 text-slate-300 border border-slate-700 text-[10px] font-black uppercase tracking-wider rounded">Gümüş Səviyyə</span>}
                            {user.tier === 'Bürünc' && <span className="inline-block px-2 py-0.5 bg-amber-700/10 text-amber-600 border border-amber-700/20 text-[10px] font-black uppercase tracking-wider rounded">Bürünc Səviyyə</span>}
                          </td>
                          <td className="px-4 py-4 font-mono text-xs text-slate-500">
                            {new Date(user.updated_at).toLocaleDateString('az-AZ')}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button 
                              onClick={() => handleOpenEditPoints(user)}
                              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Xalları Tənzimlə"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {participants.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Sistemdə qeydiyyatlı müştəri tapılmadı.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider font-sans">İcma Referal İzlənməsi</h3>
                  <p className="text-xs text-slate-400 mt-1">Canlı referal xətləri, dəvət olunan istifadəçilər və real bonus ödənişləri.</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lider İstifadəçilər</div>
                    <div className="text-2xl font-black text-white font-mono mt-1">{referralUsers.length} nəfər</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cəmi Uğurlu Dəvətlər</div>
                    <div className="text-2xl font-black text-amber-500 font-mono mt-1">
                      {referralUsers.reduce((acc, u) => acc + u.invited_count, 0)} qeydiyyat
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paylanmış Referal Bonusu</div>
                    <div className="text-2xl font-black text-green-400 font-mono mt-1">
                      +{referralUsers.reduce((acc, u) => acc + u.total_bonus_azn, 0).toFixed(2)} AZN
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider">Müştəri Referal Statistikası</h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950 text-xs uppercase font-black text-slate-500">
                        <tr>
                          <th className="px-4 py-3">İstifadəçi / Email</th>
                          <th className="px-4 py-3">Referal Kodu</th>
                          <th className="px-4 py-3">Dəvət Olunan Müştəri Sayı</th>
                          <th className="px-4 py-3">Qazanılan Bonus (AZN)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 bg-slate-900/50">
                        {referralUsers.map((user) => (
                          <tr key={user.user_id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-4">
                              <span className="font-bold text-white block">{user.name}</span>
                              <span className="text-xs text-slate-500 font-mono">{user.email}</span>
                            </td>
                            <td className="px-4 py-4 font-mono text-amber-500 font-bold">{user.referral_code}</td>
                            <td className="px-4 py-4 font-mono font-bold text-slate-200">{user.invited_count} qeydiyyat</td>
                            <td className="px-4 py-4 font-mono font-bold text-green-400">+{user.total_bonus_azn.toFixed(2)} AZN</td>
                          </tr>
                        ))}
                        {referralUsers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">İstifadəçi tapılmadı.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Independent Referral Chain Records Table */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider">Müstəqil Referal Zəncir Cədvəli (Canlı Tarixçə)</h4>
                    <span className="text-xs text-slate-500 font-mono">Cəmi: {recordsList.length} qeyd</span>
                  </div>
                  
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950 text-xs uppercase font-black text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Dəvət Edən (Referrer)</th>
                          <th className="px-4 py-3">Dəvət Olunan (Referred)</th>
                          <th className="px-4 py-3">Verilən Mükafat</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Tarix</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 bg-slate-900/50">
                        {recordsList.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 font-bold text-white">{rec.referrer_name}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-200 block">{rec.referred_name}</span>
                              <span className="text-xs text-slate-500 font-mono">{rec.referred_email}</span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-green-400">+{rec.reward_amount.toFixed(2)} AZN</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border ${
                                rec.status === 'Tamamlandı' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                              {new Date(rec.created_at).toLocaleDateString('az-AZ')}
                            </td>
                          </tr>
                        ))}
                        {recordsList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                              <p className="font-bold text-slate-400">Hələ heç bir referal əməliyyatı qeydə alınmayıb.</p>
                              <p className="text-xs text-slate-600 mt-1">İstifadəçilər öz referal kodları ilə yeni müştərilər dəvət etdikdə bu zəncir cədvəlində avtomatik görünəcək.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'newsletter' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider">Xəbər Bülleteni Abunəçiləri</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-xs uppercase font-black text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Abunə Tarixi</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-4 font-medium text-white">{sub.email}</td>
                          <td className="px-4 py-4 font-mono text-xs text-slate-500">
                            {new Date(sub.created_at).toLocaleDateString('az-AZ')}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                              Active Subscriber
                            </span>
                          </td>
                        </tr>
                      ))}
                      {subscribers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-500">Heç bir bülleten abunəçisi yoxdur.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ADJUST POINTS MODAL */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
              Sadiqlik Balını Tənzimlə
            </h3>
            <p className="text-xs text-slate-400 mb-4">Müştəri: <span className="font-bold text-white">{selectedUser.name}</span></p>
            <form onSubmit={handleSavePoints} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Xal Balansı (Points)</label>
                <input 
                  type="number" 
                  value={pointsInput}
                  onChange={(e) => setPointsInput(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors font-mono text-center text-xl"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors hover:bg-slate-700"
                >
                  Ləğv Et
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" /> Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
