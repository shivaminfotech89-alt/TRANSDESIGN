import re

with open('src/components/TransformerForm.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { Download, RefreshCw, Save, Zap } from 'lucide-react';", "import { Download, RefreshCw, Save, Zap, Database } from 'lucide-react';\nimport { db } from '../lib/firebase';\nimport { collection, query, where, getDocs } from 'firebase/firestore';\nimport { useAuth } from './AuthContext';")

# Add useAuth and Sync Logic
component_start = "export function TransformerForm({ inputs, onChange }: TransformerFormProps) {"
sync_logic = """export function TransformerForm({ inputs, onChange }: TransformerFormProps) {
  const { user } = useAuth();
  
  const handleSyncPrices = async () => {
    if (!user) return alert("Sign in to sync company prices");
    try {
      const [matSnap, priceSnap] = await Promise.all([
        getDocs(query(collection(db, 'materials'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'material_prices'), where('userId', '==', user.uid)))
      ]);
      const mats = matSnap.docs.map(d => ({id: d.id, ...d.data()}));
      const prices = priceSnap.docs.map(d => ({id: d.id, ...d.data()}));
      
      const getLatestPrice = (catName: string) => {
        const catMats = mats.filter(m => m.category.toLowerCase().includes(catName.toLowerCase()) || m.name.toLowerCase().includes(catName.toLowerCase()));
        if (!catMats.length) return null;
        let latestP: any = null;
        for (const m of catMats) {
           const pList = prices.filter(p => p.materialId === m.id);
           for (const p of pList) {
             if (!latestP || p.createdAt > latestP.createdAt) latestP = p;
           }
        }
        if (!latestP) return null;
        return Number(latestP.basePrice) + Number(latestP.transportation) + Number(latestP.loading) + Number(latestP.taxes);
      };
      
      const copperP = getLatestPrice('copper') || getLatestPrice('conductor') || getLatestPrice('aluminium');
      const coreP = getLatestPrice('crgo') || getLatestPrice('core');
      const oilP = getLatestPrice('oil');
      const steelP = getLatestPrice('steel') || getLatestPrice('tank');
      
      let msg = "Synced Prices from DB:\\n";
      if (copperP) { msg += `Conductor: ₹${copperP.toFixed(2)}\\n`; onChange({target:{name:'conductorCostPerKg', value: copperP}} as any); }
      if (coreP) { msg += `Core: ₹${coreP.toFixed(2)}\\n`; onChange({target:{name:'coreCostPerKg', value: coreP}} as any); }
      if (oilP) { msg += `Oil: ₹${oilP.toFixed(2)}\\n`; onChange({target:{name:'oilCostPerLitre', value: oilP}} as any); }
      if (steelP) { msg += `Steel: ₹${steelP.toFixed(2)}\\n`; onChange({target:{name:'steelCostPerKg', value: steelP}} as any); }
      alert(msg);
    } catch(e) {
      console.error(e);
      alert("Failed to sync prices");
    }
  };
"""

content = content.replace(component_start, sync_logic)

# Add the sync button next to the Cost Parameters header
cost_header_old = """          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-slate-800 tracking-tight text-sm uppercase">Cost & Margin Parameters</h3>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>"""

cost_header_new = """          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <h3 className="font-bold text-slate-800 tracking-tight text-sm uppercase">Cost Parameters</h3>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            <button type="button" onClick={handleSyncPrices} className="text-[10px] flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 font-bold uppercase tracking-wider ml-2">
              <Database className="w-3 h-3" /> Sync DB
            </button>
          </div>"""

content = content.replace(cost_header_old, cost_header_new)

with open('src/components/TransformerForm.tsx', 'w') as f:
    f.write(content)
