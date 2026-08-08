import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Material, Supplier, MaterialPrice } from '../../types/db';
import { Plus, Save, History, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';

export function MaterialPrices() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [prices, setPrices] = useState<MaterialPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<MaterialPrice>>({
    source: 'Manual',
    currency: 'INR',
    transportation: 0, loading: 0, unloading: 0, packing: 0, insurance: 0,
    taxes: 0, discount: 0, wastage: 0, scrap: 0, moq: 0
  });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [matSnap, supSnap, priceSnap] = await Promise.all([
        getDocs(query(collection(db, 'materials'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'suppliers'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'material_prices'), where('userId', '==', user.uid)))
      ]);
      setMaterials(matSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Material[]);
      setSuppliers(supSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Supplier[]);
      
      const priceList = priceSnap.docs.map(d => ({ id: d.id, ...d.data() })) as MaterialPrice[];
      priceList.sort((a, b) => b.createdAt - a.createdAt);
      setPrices(priceList);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const handleSave = async () => {
    if (!user || !formData.materialId || !formData.supplierId || !formData.basePrice) return;
    setLoading(true);
    try {
      const existing = prices.filter(p => p.materialId === formData.materialId && p.supplierId === formData.supplierId);
      const version = existing.length > 0 ? existing[0].version + 1 : 1;
      
      const dataToSave = {
        ...formData,
        userId: user.uid,
        version,
        createdAt: Date.now(),
        createdBy: user.email || 'unknown'
      };
      await addDoc(collection(db, 'material_prices'), dataToSave);
      setShowAdd(false);
      setFormData({
        source: 'Manual', currency: 'INR',
        transportation: 0, loading: 0, unloading: 0, packing: 0, insurance: 0,
        taxes: 0, discount: 0, wastage: 0, scrap: 0, moq: 0
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const calculateLanded = (p: MaterialPrice) => {
    const base = Number(p.basePrice) || 0;
    const trans = Number(p.transportation) || 0;
    const load = Number(p.loading) || 0;
    const unload = Number(p.unloading) || 0;
    const pack = Number(p.packing) || 0;
    const ins = Number(p.insurance) || 0;
    
    let total = base + trans + load + unload + pack + ins;
    if (p.discount) total = total - (total * (p.discount / 100));
    if (p.taxes) total = total + (total * (p.taxes / 100));
    return total;
  };

  const latestPrices = materials.map(m => {
    const mPrices = prices.filter(p => p.materialId === m.id);
    const bySupplier: Record<string, MaterialPrice> = {};
    mPrices.forEach(p => {
      if (!bySupplier[p.supplierId] || bySupplier[p.supplierId].createdAt < p.createdAt) {
        bySupplier[p.supplierId] = p;
      }
    });
    return { material: m, supplierPrices: Object.values(bySupplier), allHistory: mPrices };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Price Management</h3>
        {!showAdd && (
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import CSV
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">
              <Plus className="w-4 h-4" /> Add Price Entry
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-700">New Price Entry</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Material *</label>
              <select className="w-full border p-2 rounded" onChange={e => setFormData({...formData, materialId: e.target.value})}>
                <option value="">Select...</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Supplier *</label>
              <select className="w-full border p-2 rounded" onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                <option value="">Select...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Base Price *</label>
              <input type="number" className="w-full border p-2 rounded" onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Currency</label>
              <input type="text" value={formData.currency} className="w-full border p-2 rounded" onChange={e => setFormData({...formData, currency: e.target.value})} />
            </div>
            
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Transport</label><input type="number" className="w-full border p-2 rounded" value={formData.transportation} onChange={e => setFormData({...formData, transportation: Number(e.target.value)})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Loading</label><input type="number" className="w-full border p-2 rounded" value={formData.loading} onChange={e => setFormData({...formData, loading: Number(e.target.value)})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Taxes (%)</label><input type="number" className="w-full border p-2 rounded" value={formData.taxes} onChange={e => setFormData({...formData, taxes: Number(e.target.value)})} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Discount (%)</label><input type="number" className="w-full border p-2 rounded" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} /></div>

            <div className="space-y-1 md:col-span-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Reason for Change</label>
              <input type="text" placeholder="e.g. Market fluctuation, new negotiation..." className="w-full border p-2 rounded" onChange={e => setFormData({...formData, reason: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-bold">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold hover:bg-emerald-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> Record Price
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {latestPrices.map(lp => (
          <div key={lp.material.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{lp.material.name}</h4>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{lp.material.category} | Per {lp.material.unit}</span>
              </div>
              <button 
                onClick={() => setExpandedMaterialId(expandedMaterialId === lp.material.id ? null : lp.material.id!)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                <History className="w-3 h-3" />
                {expandedMaterialId === lp.material.id ? 'Hide History' : 'View History'}
                {expandedMaterialId === lp.material.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            {lp.supplierPrices.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">No supplier prices recorded.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Base Price</th>
                    <th className="p-3">Transport/Misc</th>
                    <th className="p-3">Taxes/Disc</th>
                    <th className="p-3 text-right">Landed Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lp.supplierPrices.map(p => {
                    const sup = suppliers.find(s => s.id === p.supplierId);
                    const landed = calculateLanded(p);
                    const isLowest = lp.supplierPrices.length > 1 && landed === Math.min(...lp.supplierPrices.map(calculateLanded));
                    return (
                      <tr key={p.id} className={isLowest ? 'bg-emerald-50/30' : ''}>
                        <td className="p-3 font-medium text-slate-800">
                          {sup?.name || 'Unknown'}
                          {isLowest && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Lowest</span>}
                        </td>
                        <td className="p-3 font-mono">{p.currency} {p.basePrice?.toFixed(2)}</td>
                        <td className="p-3 font-mono text-slate-500">+{p.transportation + p.loading + p.unloading + p.packing + p.insurance}</td>
                        <td className="p-3 font-mono text-slate-500">+{p.taxes}% / -{p.discount}%</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{p.currency} {landed.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Price History Section */}
            {expandedMaterialId === lp.material.id && lp.allHistory.length > 0 && (
              <div className="bg-slate-50 border-t border-slate-200 p-4">
                <h5 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Complete Price Audit Log</h5>
                <div className="space-y-2">
                  {lp.allHistory.map(hist => {
                    const sup = suppliers.find(s => s.id === hist.supplierId);
                    return (
                      <div key={hist.id} className="bg-white p-3 border border-slate-200 rounded text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800">{sup?.name || 'Unknown'} <span className="text-slate-400 font-normal ml-2">v{hist.version}</span></div>
                          <div className="text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700">{hist.currency} {hist.basePrice.toFixed(2)}</span>
                            {hist.reason && <span className="ml-2 italic">"{hist.reason}"</span>}
                          </div>
                        </div>
                        <div className="text-right text-slate-500">
                          <div>{new Date(hist.createdAt).toLocaleString()}</div>
                          <div>by {hist.createdBy}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
