"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, ArrowRightLeft, ShieldAlert, Archive, FileText, Check, Loader2, RefreshCw } from 'lucide-react';
import { 
  getWarehouses, 
  getProductsAndVariants, 
  addInventoryMovement, 
  getRecentMovements,
  Warehouse
} from '@/lib/actions/inventory';

interface ProductVariantSelect {
  id: string;
  sku: string;
  stock: number;
  product_id: string;
  product_name: string;
}

export default function StockOperationsClient() {
  const [opType, setOpType] = useState<'in' | 'out' | 'transfer' | 'damaged' | 'reserve'>('in');
  
  // Data lists
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [variants, setVariants] = useState<ProductVariantSelect[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  
  // Form states
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  
  // Loading & logs
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    
    const [whRes, varRes, moveRes] = await Promise.all([
      getWarehouses(),
      getProductsAndVariants(),
      getRecentMovements()
    ]);

    if (whRes.success && whRes.warehouses) {
      setWarehouses(whRes.warehouses);
      if (whRes.warehouses.length > 0) {
        setSelectedWarehouseId(whRes.warehouses[0].id);
        if (whRes.warehouses.length > 1) {
          setTargetWarehouseId(whRes.warehouses[1].id);
        }
      }
    }
    
    if (varRes.success && varRes.variants) {
      setVariants(varRes.variants);
      if (varRes.variants.length > 0) {
        setSelectedVariantId(varRes.variants[0].id);
      }
    }

    if (moveRes.success && moveRes.movements) {
      setRecentMovements(moveRes.movements);
    }

    setLoading(false);
  };

  const handleConfirmOperation = async () => {
    if (!selectedVariantId) {
      setError('Zəhmət olmasa məhsul seçin.');
      return;
    }
    if (!selectedWarehouseId) {
      setError('Zəhmət olmasa anbar seçin.');
      return;
    }
    if (opType === 'transfer' && !targetWarehouseId) {
      setError('Zəhmət olmasa hədəf anbar seçin.');
      return;
    }
    if (opType === 'transfer' && selectedWarehouseId === targetWarehouseId) {
      setError('Mənbə və Hədəf anbarlar eyni ola bilməz.');
      return;
    }
    if (quantity <= 0) {
      setError('Miqdar 0-dan böyük olmalıdır.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    const res = await addInventoryMovement({
      warehouse_id: selectedWarehouseId,
      variant_id: selectedVariantId,
      movement_type: opType,
      quantity: quantity,
      reason: reason.trim() || `${opType === 'in' ? 'Mədaxil' : 'Məxaric'} - Əl ilə tənzimləmə`,
      target_warehouse_id: opType === 'transfer' ? targetWarehouseId : undefined
    });

    if (res.success) {
      setSuccessMsg('Əməliyyat uğurla tamamlandı və stok balansları yeniləndi!');
      setQuantity(0);
      setReason('');
      
      // Reload recent history and data
      const [vRes, mRes] = await Promise.all([
        getProductsAndVariants(),
        getRecentMovements()
      ]);
      if (vRes.success && vRes.variants) setVariants(vRes.variants);
      if (mRes.success && mRes.movements) setRecentMovements(mRes.movements);
    } else {
      setError(res.error || 'Stok əməliyyatı qeydə alınarkən səhv baş verdi.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { id: 'in', label: 'Stok Girişi (Stock In)', icon: Plus, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
          { id: 'out', label: 'Stok Çıxışı (Stock Out)', icon: Minus, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
          { id: 'transfer', label: 'Transfer (Transfer)', icon: ArrowRightLeft, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
          { id: 'damaged', label: 'Zədəli (Damaged)', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { id: 'reserve', label: 'Rezerv & Ön Sifariş', icon: Archive, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
        ].map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => {
                setOpType(type.id as any);
                setError('');
                setSuccessMsg('');
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                opType === type.id 
                  ? `${type.bg} ${type.border} shadow-soft-sm scale-[1.02]` 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`p-2 w-fit rounded-xl mb-3 ${opType === type.id ? 'bg-slate-950/50' : type.bg} ${type.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className={`font-black text-sm ${opType === type.id ? type.color : 'text-slate-300'}`}>{type.label}</h3>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Məlumatlar yüklənir...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md h-fit">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Əməliyyat Forması
            </h3>
            
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Məhsul SKU / Adı</label>
                  <select 
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                  >
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.product_name} - {v.sku} (Mövcud Ümumi: {v.stock} ədəd)
                      </option>
                    ))}
                    {variants.length === 0 && (
                      <option>Sistemdə heç bir məhsul variantı yoxdur</option>
                    )}
                  </select>
                </div>

                {opType === 'transfer' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Mənbə Anbar (From)</label>
                      <select 
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                      >
                        {warehouses.map(wh => (
                          <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Hədəf Anbar (To)</label>
                      <select 
                        value={targetWarehouseId}
                        onChange={(e) => setTargetWarehouseId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                      >
                        {warehouses.map(wh => (
                          <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Lokasiya / Anbar</label>
                    <select 
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                    >
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Miqdar (Qty)</label>
                  <input 
                    type="number" 
                    value={quantity === 0 ? '' : quantity}
                    onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors" 
                    placeholder="Ədəd sayı daxil edin" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">İzləmə Məlumatları (Tracking)</label>
                  <div className="space-y-3 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Lot / Batch Nömrəsi</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" placeholder="BATCH-XYZ" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Serial Nömrələri</label>
                      <textarea rows={2} className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 resize-none" placeholder="Fərdi seriya nömrələri..."></textarea>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Qeyd / Səbəb (Reason)</label>
                  <textarea 
                    rows={3} 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors resize-none" 
                    placeholder="Məsələn: Tədarükçüdən yeni mallar, Müştəri zədələnməsi və s."
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleConfirmOperation}
                disabled={submitting || warehouses.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                Əməliyyatı Təsdiqlə
              </button>
            </div>
          </div>

          {/* Recent movements sidebar logger */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-soft-md h-fit">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-white text-md uppercase tracking-wider">Son Stok Hərəkətləri</h3>
              <button 
                onClick={loadAllData} 
                className="text-slate-400 hover:text-white"
                title="Yenilə"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {recentMovements.map((move) => {
                let badgeColor = "bg-green-500/10 text-green-400 border-green-500/20";
                let opLabel = "Giriş";
                if (move.movement_type === 'out') { badgeColor = "bg-red-500/10 text-red-400 border-red-500/20"; opLabel = "Çıxış"; }
                if (move.movement_type === 'transfer') { badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20"; opLabel = "Transfer"; }
                if (move.movement_type === 'damaged') { badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20"; opLabel = "Zədəli"; }
                if (move.movement_type === 'reserve') { badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20"; opLabel = "Rezerv"; }

                return (
                  <div key={move.id} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 border rounded font-black text-[9px] uppercase ${badgeColor}`}>
                        {opLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(move.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-bold text-white leading-tight">
                      {move.product_name}
                    </div>
                    <div className="text-slate-400 font-mono text-[10px] flex justify-between">
                      <span>SKU: {move.variant_sku}</span>
                      <span className="text-amber-500 font-bold">{move.quantity} ədəd</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 italic border-t border-slate-800/50 pt-1">
                      {move.warehouse_name} 
                      {move.target_warehouse_name ? ` → ${move.target_warehouse_name}` : ''}
                      <span className="block mt-0.5 font-sans not-italic text-slate-400">Səbəb: {move.reason}</span>
                    </div>
                  </div>
                );
              })}

              {recentMovements.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  Heç bir stok əməliyyatı qeydə alınmayıb.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
