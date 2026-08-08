import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import React, { useState } from 'react';
import { TransformerInputs } from '../types';
import { ChevronDown, ChevronUp, Settings2, Zap, Thermometer, Box, Database, DollarSign } from 'lucide-react';

interface TransformerFormProps {
  inputs: TransformerInputs;
  onChange: (inputs: TransformerInputs) => void;
}

export function TransformerForm({ inputs, onChange }: TransformerFormProps) {
  const { user } = useAuth();
  
  const handleSyncPrices = async () => {
    if (!user) return alert("Sign in to sync company prices");
    try {
      const [matSnap, priceSnap] = await Promise.all([
        getDocs(query(collection(db, 'materials'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'material_prices'), where('userId', '==', user.uid)))
      ]);
      const mats = matSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      const prices = priceSnap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      
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
      
      let msg = "Synced Prices from DB:\n";
      let updates: any = {};
      if (copperP) { msg += `Conductor: ₹${copperP.toFixed(2)}\n`; updates.conductorCostPerKg = copperP; }
      if (coreP) { msg += `Core: ₹${coreP.toFixed(2)}\n`; updates.coreCostPerKg = coreP; }
      if (oilP) { msg += `Oil: ₹${oilP.toFixed(2)}\n`; updates.oilCostPerLitre = oilP; }
      if (steelP) { msg += `Steel: ₹${steelP.toFixed(2)}\n`; updates.steelCostPerKg = steelP; }
      
      onChange({ ...inputs, ...updates });
      alert(msg);
    } catch(e) {
      console.error(e);
      alert("Failed to sync prices");
    }
  };

  const [expandedSection, setExpandedSection] = useState<string>('rating');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let updates: Partial<TransformerInputs> = {
      [name]: type === 'number' ? Number(value) : value,
    };
    
    // Auto-update current density if conductor changes
    if (name === 'conductor') {
      const isCopper = value === 'Copper';
      updates.maxCurrentDensityHv = isCopper ? 3.0 : 1.6;
      updates.maxCurrentDensityLv = isCopper ? 3.0 : 1.6;
    }

    onChange({
      ...inputs,
      ...updates,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: any }) => (
    <button 
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title}</span>
      </div>
      {expandedSection === id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      
      {/* 1. Rating & Voltages */}
      <div>
        <SectionHeader id="rating" title="Rating & Voltages" icon={Zap} />
        {expandedSection === 'rating' && (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Project Name</label>
              <input type="text" name="projectName" value={inputs.projectName || ''} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Rating (kVA)</label>
              <input type="number" name="kVA" value={inputs.kVA} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">HV (V)</label>
                <input type="number" name="hvVoltage" value={inputs.hvVoltage} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">LV (V)</label>
                <input type="number" name="lvVoltage" value={inputs.lvVoltage} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Phases</label>
                <select name="phases" value={inputs.phases} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value={1}>1 - Single Phase</option>
                  <option value={3}>3 - Three Phase</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Frequency</label>
                <select name="frequency" value={inputs.frequency} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value={50}>50 Hz</option>
                  <option value={60}>60 Hz</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Standards & Core Settings */}
      <div>
        <SectionHeader id="standards" title="Standards & Core" icon={Settings2} />
        {expandedSection === 'standards' && (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Reference Standard</label>
              <select name="referenceStandard" value={inputs.referenceStandard || 'IEC 60076'} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="IEC 60076">IEC 60076</option>
                <option value="IEEE C57">IEEE C57</option>
                <option value="IS 1180">IS 1180</option>
                <option value="EcoDesign">European Eco Design</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Vector Group</label>
                <select name="vectorGroup" value={inputs.vectorGroup || 'Dyn11'} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="Dyn11">Dyn11</option>
                  <option value="Yyn0">Yyn0</option>
                  <option value="YNd11">YNd11</option>
                  <option value="Dd0">Dd0</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Core Type</label>
                <select name="coreType" value={inputs.coreType || 'Step-Lap'} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-[11px]">
                  <option value="Step-Lap">Step-Lap</option>
                  <option value="Conventional Mitered">Conventional Mitered</option>
                  <option value="Amorphous">Amorphous</option>
                  <option value="EI Core">EI Core</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Core Material</label>
              <select name="coreMaterial" value={inputs.coreMaterial} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="CRGO Conventional">CRGO Conventional</option>
                <option value="CRGO Hi-B">CRGO Hi-B</option>
                <option value="Amorphous">Amorphous Metal</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Max Flux Density (T)</label>
              <input type="number" step="0.01" name="maxFluxDensity" value={inputs.maxFluxDensity || 1.7} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* 3. Cooling & Insulation */}
      <div>
        <SectionHeader id="cooling" title="Cooling & Insulation" icon={Thermometer} />
        {expandedSection === 'cooling' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Cooling Type</label>
                <select name="cooling" value={inputs.cooling} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="Oil Immersed">ONAN / ONAF</option>
                  <option value="Dry Type">Dry Type (AN / VPI)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Insulation Class</label>
                <select name="insulationClass" value={inputs.insulationClass || 'A'} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="A">Class A (105°C)</option>
                  <option value="B">Class B (130°C)</option>
                  <option value="F">Class F (155°C)</option>
                  <option value="H">Class H (180°C)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Ambient Temp (°C)</label>
                <input type="number" name="ambientTemp" value={inputs.ambientTemp || 45} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Temp Rise (°C)</label>
                <input type="number" name="tempRise" value={inputs.tempRise || 50} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Winding & Tapping */}
      <div>
        <SectionHeader id="winding" title="Winding & Tapping" icon={Database} />
        {expandedSection === 'winding' && (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Conductor Material</label>
              <select name="conductor" value={inputs.conductor} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="Copper">Copper</option>
                <option value="Aluminum">Aluminum</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Max HV CD (A/mm²)</label>
                <input type="number" step="0.1" name="maxCurrentDensityHv" value={inputs.maxCurrentDensityHv || 3.0} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Max LV CD (A/mm²)</label>
                <input type="number" step="0.1" name="maxCurrentDensityLv" value={inputs.maxCurrentDensityLv || 3.0} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Tap Changer</label>
              <select name="tapChanger" value={inputs.tapChanger || 'OCTC'} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="None">No Tappings</option>
                <option value="OCTC">OCTC (Off-circuit tap changer)</option>
                <option value="OLTC">OLTC (On-load tap changer)</option>
              </select>
            </div>
            {inputs.tapChanger && inputs.tapChanger !== 'None' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-600 uppercase">Above Normal (%)</label>
                  <input type="number" step="0.5" name="tapRangeAbove" value={inputs.tapRangeAbove || 5.0} onChange={handleChange}
                    className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-md shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-600 uppercase">Below Normal (%)</label>
                  <input type="number" step="0.5" name="tapRangeBelow" value={inputs.tapRangeBelow || 5.0} onChange={handleChange}
                    className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-md shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-600 uppercase">Step Var (%)</label>
                  <input type="number" step="0.5" name="tapStepVariation" value={inputs.tapStepVariation || 2.5} onChange={handleChange}
                    className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-md shadow-sm" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Tank Type */}
      <div>
        <SectionHeader id="tank" title="Tank Construction" icon={Box} />
        {expandedSection === 'tank' && (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Tank Type</label>
              <select name="tankType" value={inputs.tankType || 'Radiator & Conservator'} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="Radiator & Conservator">Radiator & Conservator</option>
                <option value="Corrugated Fin">Corrugated Fin</option>
                <option value="Sealed Type">Sealed Type</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 6. Pricing / Optimization */}
      <div>
        <SectionHeader id="pricing" title="Cost & Optimization" icon={DollarSign} />
        {expandedSection === 'pricing' && (
          <div className="p-4 space-y-4 bg-slate-50 border-t border-slate-200">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Optimization Strategy</label>
              <select name="strategy" value={inputs.strategy} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="Lowest Cost">Lowest Cost</option>
                <option value="High Efficiency">High Efficiency</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Core (₹/kg)</label>
                <input type="number" name="coreCostPerKg" value={inputs.coreCostPerKg} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Cond. (₹/kg)</label>
                <input type="number" name="conductorCostPerKg" value={inputs.conductorCostPerKg} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Oil (₹/L)</label>
                <input type="number" name="oilCostPerLitre" value={inputs.oilCostPerLitre || 95} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Steel (₹/kg)</label>
                <input type="number" name="steelCostPerKg" value={inputs.steelCostPerKg || 75} onChange={handleChange}
                  className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Target Margin (%)</label>
              <input type="number" step="0.1" name="marginPercentage" value={inputs.marginPercentage} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">Target Budget (INR)</label>
              <input type="number" name="targetBudget" value={inputs.targetBudget || ''} onChange={handleChange} placeholder="Optional"
                className="w-full bg-blue-50 border border-blue-200 p-2.5 text-blue-800 font-mono rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
