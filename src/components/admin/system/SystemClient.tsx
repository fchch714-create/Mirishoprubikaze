"use client";

import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Key, Search, Server, Database, ShieldCheck, Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { getAuditLogs, getSystemHealth, getSystemApiIntegrations } from '@/lib/actions/audit';

export default function SystemClient() {
  const [activeTab, setActiveTab] = useState<'audit' | 'health' | 'api'>('audit');
  const [logs, setLogs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchLogs();
    } else if (activeTab === 'health') {
      fetchHealth();
    } else if (activeTab === 'api') {
      fetchIntegrations();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    const res = await getAuditLogs();
    if (res.success && res.logs) {
      setLogs(res.logs);
    } else {
      setError(res.error || 'Loqları yükləmək mümkün olmadı.');
    }
    setLoading(false);
  };

  const fetchHealth = async () => {
    setLoading(true);
    setError('');
    const res = await getSystemHealth();
    if (res.success && res.health) {
      setHealth(res.health);
    } else {
      setError(res.error || 'Sistem metriklərini yükləmək mümkün olmadı.');
    }
    setLoading(false);
  };

  const fetchIntegrations = async () => {
    setLoading(true);
    setError('');
    const res = await getSystemApiIntegrations();
    if (res.success && res.integrations) {
      setIntegrations(res.integrations);
    } else {
      setError(res.error || 'İnteqrasiyaları yükləmək mümkün olmadı.');
    }
    setLoading(false);
  };

  const getLogType = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('sil')) return 'delete';
    if (act.includes('yeni') || act.includes('yarat') || act.includes('əlavə')) return 'create';
    if (act.includes('status') || act.includes('yenilə') || act.includes('dəyiş')) return 'update';
    return 'system';
  };

  const filteredLogs = logs.filter(log => 
    (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.table_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.record_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-6 h-6 text-amber-500" /> Sistem və Audit
        </h2>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('audit')}
          className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'audit' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-white'}`}
        >
          Audit Loqları
        </button>
        <button 
          onClick={() => setActiveTab('health')}
          className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'health' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-white'}`}
        >
          Sistem Vəziyyəti
        </button>
        <button 
          onClick={() => setActiveTab('api')}
          className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'api' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-white'}`}
        >
          API İnteqrasiyalar
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md">
        
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                Əməliyyat Tarixçəsi
                <button 
                  onClick={fetchLogs} 
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 animate-none flex items-center justify-center"
                  title="Yenilə"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Loqlarda axtar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Loqlar yüklənir...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Zaman</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">İstifadəçi</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Əməliyyat</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Cədvəl / ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredLogs.map((log) => {
                      const type = getLogType(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-4 px-4 text-xs text-slate-500 font-mono">
                            {new Date(log.created_at).toLocaleString('az-AZ')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-sm text-white">{log.user_name}</div>
                            {log.user_email && <div className="text-xs text-slate-500 font-mono">{log.user_email}</div>}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {type === 'update' && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>}
                              {type === 'create' && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>}
                              {type === 'delete' && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>}
                              {type === 'system' && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>}
                              <span className="text-sm text-slate-300">{log.action}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{log.table_name}</div>
                            {log.record_id && <div className="text-[10px] font-mono text-slate-500">ID: {log.record_id.slice(0, 8).toUpperCase()}</div>}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">Audit loqu tapılmadı.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                Sistem Metrikləri və Status
                <button 
                  onClick={fetchHealth} 
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 flex items-center justify-center"
                  title="Metrikləri Yenilə"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </h3>
              {health?.serverTime && (
                <span className="text-xs text-slate-500 font-mono">Son Yenilənmə: {health.serverTime}</span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Sistem metrikləri ölçülür...</p>
              </div>
            ) : health ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                      <Server className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-green-500 uppercase px-2 py-1 bg-green-500/10 rounded border border-green-500/20">
                      {health.serverStatus || 'Normal'}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white font-mono mb-1">{health.serverUptime || '99.9%'}</div>
                  <div className="text-sm text-slate-400 font-bold">Server Uptime</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">İşləmə müddəti: {health.serverUptimeDetail || 'Aktiv'}</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Database className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-blue-500 uppercase px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">
                      {health.dbStatus || 'Normal'}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white font-mono mb-1">{health.dbResponseTime || '0ms'}</div>
                  <div className="text-sm text-slate-400 font-bold">Database Latency</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">Canlı Sorğu Cavab Müddəti</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-black uppercase px-2 py-1 rounded border ${
                      health.securityIncidents === 0 
                        ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' 
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                      {health.securityStatus || 'Aktiv Qorunur'}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white font-mono mb-1">{health.securityIncidents ?? 0}</div>
                  <div className="text-sm text-slate-400 font-bold">Təhlükəsizlik İnsidentləri</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">Qeydə alınmış loq xətaları</div>
                </div>

              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                Xarici İnteqrasiyalar & API Açarları
                <button 
                  onClick={fetchIntegrations} 
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 flex items-center justify-center"
                  title="Yenilə"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </h3>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">İnteqrasiya statusları yoxlanılır...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {integrations.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 bg-slate-950 border rounded-xl transition-colors ${
                      item.isConfigured ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.isConfigured ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {item.name}
                          <span className="text-xs text-slate-500 font-mono">({item.url})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          Açar: <span className="text-slate-300 font-bold">{item.keyDisplay}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {item.isConfigured ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-wider rounded border border-green-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {item.statusText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-wider rounded border border-slate-700">
                          <XCircle className="w-3.5 h-3.5" />
                          {item.statusText}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}
