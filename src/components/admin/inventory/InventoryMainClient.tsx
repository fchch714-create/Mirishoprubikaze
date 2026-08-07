"use client";

import React, { useState } from 'react';
import { Package, RefreshCw, Building } from 'lucide-react';
import InventoryDashboardClient from './InventoryDashboardClient';
import StockOperationsClient from './StockOperationsClient';
import WarehouseManagerClient from './WarehouseManagerClient';

export default function InventoryMainClient() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">İnventar & Logistika</h2>
          <p className="text-sm text-slate-400 mt-1">Çox-anbarlı stok idarəetməsi, hərəkətlər və alarmlar.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'dashboard' 
              ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Package className="w-4 h-4" /> Stok Vəziyyəti
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'operations' 
              ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> Stok Əməliyyatları
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'warehouses' 
              ? 'bg-slate-800 text-amber-500 shadow-soft-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Building className="w-4 h-4" /> Anbarlar & Lokasiyalar
        </button>
      </div>

      {activeTab === 'dashboard' && <InventoryDashboardClient />}
      {activeTab === 'operations' && <StockOperationsClient />}
      {activeTab === 'warehouses' && <WarehouseManagerClient />}
    </div>
  );
}
