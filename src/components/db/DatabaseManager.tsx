import React, { useState } from 'react';
import { SupplierMaster } from './SupplierMaster';
import { MaterialMaster } from './MaterialMaster';
import { MaterialPrices } from './MaterialPrices';
import { Database, Users, Package, IndianRupee } from 'lucide-react';
import { useAuth } from '../AuthContext';

export function DatabaseManager() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'materials' | 'prices'>('suppliers');
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Database className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Company Database</h2>
        <p className="text-slate-500 mb-6 max-w-md">Sign in to manage your company's supplier network, material catalog, and localized pricing structures.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Company Database & Pricing
        </h1>
        <p className="text-slate-500 text-sm">Manage unlimited suppliers, material catalogs, and live/manual pricing history.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'suppliers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Users className="w-4 h-4" /> Suppliers
        </button>
        <button 
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'materials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Package className="w-4 h-4" /> Materials
        </button>
        <button 
          onClick={() => setActiveTab('prices')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'prices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <IndianRupee className="w-4 h-4" /> Purchasing & Prices
        </button>
      </div>

      <div className="pb-20">
        {activeTab === 'suppliers' && <SupplierMaster />}
        {activeTab === 'materials' && <MaterialMaster />}
        {activeTab === 'prices' && <MaterialPrices />}
      </div>
    </div>
  );
}
