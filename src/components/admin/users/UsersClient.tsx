"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search, Edit, Shield, User, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { getAllProfiles, updateProfile } from '@/lib/actions/user';

export default function UsersClient() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllProfiles();
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        setError(res.error || 'İstifadəçilər yüklənərkən xəta baş verdi');
      }
    } catch (err: any) {
      setError(err.message || 'Gözlənilməz xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setEditRole(user.role || 'customer');
    setSaveSuccess(false);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    setError('');
    try {
      const res = await updateProfile(selectedUser.id, { role: editRole });
      if (res.success) {
        setSaveSuccess(true);
        // Update local list state
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: editRole } : u));
        setTimeout(() => {
          setSelectedUser(null);
        }, 800);
      } else {
        setError(res.error || 'Rol dəyişdirilərkən xəta baş verdi');
      }
    } catch (err: any) {
      setError(err.message || 'Gözlənilməz xəta baş verdi');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === '' || (user.role || 'customer') === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" /> İstifadəçilər və Rollar
          </h2>
          <p className="text-xs text-slate-400 mt-1">Sistemə daxil olmuş bütün istifadəçilərin siyahısı və onların səlahiyyət idarəetməsi.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md space-y-6">
        
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ad, email və ya telefon nömrəsi ilə axtar..." 
              className="w-full bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 appearance-none font-medium min-w-[200px]"
          >
            <option value="">Bütün Rollar</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Menecer</option>
            <option value="support">Dəstək (Support)</option>
            <option value="customer">Müştəri (Customer)</option>
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">İstifadəçilər yüklənir, xahiş edirik gözləyin...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
            Heç bir istifadəçi tapılmadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">İstifadəçi</th>
                  <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Telefon</th>
                  <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Xal (Loyalty)</th>
                  <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredUsers.map((user) => {
                  const roleStr = user.role || 'customer';
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-500 font-bold uppercase border border-slate-700">
                            {(user.full_name || 'A').charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{user.full_name || 'Anonim'}</div>
                            <div className="text-xs text-slate-500">{user.email || 'Email yoxdur'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {roleStr === 'super_admin' && <ShieldCheck className="w-4 h-4 text-red-500" />}
                          {roleStr === 'admin' && <Shield className="w-4 h-4 text-amber-500" />}
                          {roleStr === 'manager' && <Shield className="w-4 h-4 text-blue-400" />}
                          {roleStr === 'support' && <Shield className="w-4 h-4 text-green-400" />}
                          {roleStr === 'customer' && <User className="w-4 h-4 text-slate-500" />}
                          <span className={`text-sm font-bold uppercase text-xs ${
                            roleStr === 'super_admin' ? 'text-red-400' :
                            roleStr === 'admin' ? 'text-amber-400' :
                            roleStr === 'manager' ? 'text-blue-400' :
                            roleStr === 'support' ? 'text-green-400' : 'text-slate-400'
                          }`}>
                            {roleStr === 'super_admin' ? 'Super Admin' :
                             roleStr === 'admin' ? 'Admin' :
                             roleStr === 'manager' ? 'Menecer' :
                             roleStr === 'support' ? 'Dəstək' : 'Müştəri'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-300 font-medium">
                        {user.phone || '—'}
                      </td>
                      <td className="py-4 px-4 text-sm text-amber-500 font-bold">
                        {user.loyalty_points || 0} XP
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" 
                            title="Rolu dəyişdir"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* EDIT ROLE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" /> Rol İdarəetməsi
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                <span className="font-bold text-white">{selectedUser.full_name}</span> adlı istifadəçinin sistemdəki rolunu tənzimləyin.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Səlahiyyət Rolu</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                  >
                    <option value="customer">Müştəri (İcazə yoxdur)</option>
                    <option value="support">Dəstək (Support)</option>
                    <option value="manager">Menecer (İdarəetmə)</option>
                    <option value="admin">Admin (Tam Səlahiyyət)</option>
                    <option value="super_admin">Super Admin (Bütün Hüquqlar)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setSelectedUser(null)} 
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm font-bold"
                >
                  Ləğv Et
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveRole} 
                  disabled={isSaving || saveSuccess}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
                      Yadda saxlanılır...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      Uğurla Saxlanıldı!
                    </>
                  ) : (
                    'Yadda saxla'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
