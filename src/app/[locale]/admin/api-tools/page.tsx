'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCode, Key, Terminal, Copy, CheckCircle2, ShieldCheck, 
  Send, RefreshCw, Loader2, Play, Check, AlertCircle, Globe, Server
} from 'lucide-react';
import { getSystemApiIntegrations } from '@/lib/actions/audit';

export default function AdminApiToolsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // API Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/newsletter');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST'>('POST');
  const [requestBody, setRequestBody] = useState<string>(JSON.stringify({ email: 'test@rubikshop.az' }, null, 2));
  const [customHeader, setCustomHeader] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await getSystemApiIntegrations();
      if (res.success && res.integrations) {
        setIntegrations(res.integrations);
      }
    } catch (err) {
      console.error('Fetch integrations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectPreset = (endpoint: string, method: 'GET' | 'POST', body: any, header?: string) => {
    setSelectedEndpoint(endpoint);
    setHttpMethod(method);
    setRequestBody(body ? JSON.stringify(body, null, 2) : '');
    if (header) setCustomHeader(header);
    setTestResponse(null);
    setTestLatency(null);
  };

  const executeApiTest = async () => {
    setTestLoading(true);
    setTestResponse(null);
    setTestLatency(null);

    const startTime = performance.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (customHeader.trim()) {
        const parts = customHeader.split(':');
        if (parts.length >= 2) {
          headers[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      }

      const options: RequestInit = {
        method: httpMethod,
        headers,
      };

      if (httpMethod === 'POST' && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint, options);
      const latency = Math.round(performance.now() - startTime);
      setTestLatency(latency);

      let data: any;
      try {
        data = await res.json();
      } catch {
        data = await res.text();
      }

      setTestResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data,
      });
    } catch (error: any) {
      const latency = Math.round(performance.now() - startTime);
      setTestLatency(latency);
      setTestResponse({
        status: 0,
        statusText: 'Network Error',
        ok: false,
        data: { error: error.message || 'Sorğu zamanı xəta baş verdi' },
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest mb-2">
            <FileCode className="w-3.5 h-3.5" /> Developer API & Tools
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">API və Tərtibatçı Alətləri</h1>
          <p className="text-slate-400 text-xs mt-1">RubikShop.az real API endpointləri, webhook inteqrasiyaları və canlı sorğu konsolu.</p>
        </div>
        <button
          onClick={fetchIntegrations}
          className="self-start md:self-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenilə
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 6 Columns: Real API Integrations & Configured Keys */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5 shadow-lg">
            <h3 className="font-black uppercase text-white text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> Konfiqurasiya Edilmiş İnteqrasiyalar
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" />
                <span className="text-xs font-bold uppercase tracking-wider">İnteqrasiyalar oxunur...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs">{item.name}</div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        item.isConfigured ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.statusText}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">{item.description}</div>

                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300">
                      <span className="flex-1 truncate">{item.keyDisplay}</span>
                      <button
                        onClick={() => handleCopy(item.keyDisplay, item.id)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        title="Kopyala"
                      >
                        {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
            <h3 className="font-black uppercase text-white text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" /> Tez Şablonlar & Endpointlər
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => handleSelectPreset('/api/newsletter', 'POST', { email: 'user@example.com' })}
                className="w-full text-left p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-mono font-bold">POST</span>
                    <span className="font-mono text-xs text-white group-hover:text-amber-400">/api/newsletter</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Yeni e-poçt abunəliyi yarat</div>
                </div>
                <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </button>

              <button
                onClick={() => handleSelectPreset('/api/webhooks', 'POST', {
                  event: 'payment.succeeded',
                  data: {
                    order_id: 'test_order_123',
                    amount: 55.00,
                    payment_method: 'card_to_card'
                  }
                }, 'Authorization: Bearer fallback_secret_key_for_dev')}
                className="w-full text-left p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-mono font-bold">POST</span>
                    <span className="font-mono text-xs text-white group-hover:text-amber-400">/api/webhooks</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Ödəniş / 1C / Kuryer Webhook test</div>
                </div>
                <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Interactive API Testing Console */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black uppercase text-white text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" /> Canlı API Sorğu Konsolu
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Real HTTP Sorğusu</span>
            </div>

            {/* Request Configuration */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>

                <input
                  type="text"
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  placeholder="/api/..."
                  className="flex-1 bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                />

                <button
                  onClick={executeApiTest}
                  disabled={testLoading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Göndər
                </button>
              </div>

              {/* Custom Header (Optional) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Xüsusi Başlıq (Header - İxtiyari)
                </label>
                <input
                  type="text"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  placeholder="Məsələn: Authorization: Bearer your_token"
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                />
              </div>

              {/* Request JSON Body */}
              {httpMethod === 'POST' && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Sorğu Gövdəsi (JSON Body)
                  </label>
                  <textarea
                    rows={5}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder="{}"
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Response Viewer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Cavab Nəticəsi (Response)
                </span>
                {testResponse && (
                  <div className="flex items-center gap-3 font-mono text-xs">
                    {testLatency !== null && (
                      <span className="text-slate-400">{testLatency}ms</span>
                    )}
                    <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                      testResponse.ok 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {testResponse.status} {testResponse.statusText}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl min-h-[160px] max-h-[340px] overflow-auto font-mono text-xs">
                {testLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-xs">Sorğu icra edilir...</span>
                  </div>
                ) : testResponse ? (
                  <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {typeof testResponse.data === 'object' 
                      ? JSON.stringify(testResponse.data, null, 2) 
                      : String(testResponse.data)}
                  </pre>
                ) : (
                  <div className="text-slate-600 flex flex-col items-center justify-center py-12 text-center">
                    <Server className="w-8 h-8 mb-2 opacity-40" />
                    <span>Yuxarıdakı parametrləri seçib &quot;Göndər&quot; düyməsini sıxaraq canlı test edin.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
