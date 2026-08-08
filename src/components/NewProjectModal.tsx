import React, { useState, useEffect } from 'react';
import { getSuggestions } from '../lib/suggestions';
import { X, Zap, ArrowRight, Settings2, SlidersHorizontal, Info } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onStart: (inputs: any) => void;
}

export function NewProjectModal({ onClose, onStart }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState('New Transformer');
  const [kVA, setKVA] = useState(1000);
  const [hvVoltage, setHvVoltage] = useState(11000);
  const [lvVoltage, setLvVoltage] = useState(433);
  const [phases, setPhases] = useState(3);
  const [conductor, setConductor] = useState('Copper');
  const [standard, setStandard] = useState('IS 1180');
  
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [suggestions, setSuggestions] = useState(getSuggestions(1000, 11000, 'Copper', 'IS 1180'));
  
  const [targetImpedance, setTargetImpedance] = useState(suggestions.impedance.best);
  const [targetLoadLoss, setTargetLoadLoss] = useState(suggestions.loadLoss.best);
  const [targetNoLoadLoss, setTargetNoLoadLoss] = useState(suggestions.noLoadLoss.best);
  const [maxFluxDensity, setMaxFluxDensity] = useState(suggestions.fluxDensity.best);
  const [maxCurrentDensity, setMaxCurrentDensity] = useState(suggestions.currentDensity.best);

  useEffect(() => {
    const suggs = getSuggestions(kVA, hvVoltage, conductor, standard);
    setSuggestions(suggs);
    if (!isCustomMode) {
      setTargetImpedance(suggs.impedance.best);
      setTargetLoadLoss(suggs.loadLoss.best);
      setTargetNoLoadLoss(suggs.noLoadLoss.best);
      setMaxFluxDensity(suggs.fluxDensity.best);
      setMaxCurrentDensity(suggs.currentDensity.best);
    }
  }, [kVA, hvVoltage, conductor, standard, isCustomMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      projectName,
      kVA,
      hvVoltage,
      lvVoltage,
      phases,
      conductor,
      referenceStandard: standard,
      targetImpedance,
      targetLoadLoss,
      targetNoLoadLoss,
      maxFluxDensity,
      maxCurrentDensityHv: maxCurrentDensity,
      maxCurrentDensityLv: maxCurrentDensity
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">New Transformer Design</h2>
              <p className="text-xs text-slate-500">Configure minimal parameters. The engine auto-calculates limits based on standards.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="new-project-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Primary Inputs */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">1. Core Requirements</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-1.5 md:col-span-6">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Project Name</label>
                  <input type="text" required value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. 1000kVA Distribution Transformer"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Rating (kVA)</label>
                  <input type="number" required min="10" value={kVA} onChange={e => setKVA(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 text-slate-900 font-mono rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">HV (V)</label>
                  <input type="number" required min="100" value={hvVoltage} onChange={e => setHvVoltage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 text-slate-900 font-mono rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">LV (V)</label>
                  <input type="number" required min="100" value={lvVoltage} onChange={e => setLvVoltage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 text-slate-900 font-mono rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Phases</label>
                  <select value={phases} onChange={e => setPhases(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                    <option value={1}>1 - Single Phase</option>
                    <option value={3}>3 - Three Phase</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Conductor</label>
                  <select value={conductor} onChange={e => setConductor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                    <option value="Copper">Copper</option>
                    <option value="Aluminum">Aluminum</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Standard</label>
                  <select value={standard} onChange={e => setStandard(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                    <option value="IS 1180">IS 1180</option>
                    <option value="IEC 60076">IEC 60076</option>
                    <option value="IEEE C57">IEEE C57</option>
                    <option value="EcoDesign">EcoDesign</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Targets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Performance Limits
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600">Enter My Own Limits</span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={isCustomMode} onChange={() => setIsCustomMode(!isCustomMode)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${isCustomMode ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isCustomMode ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                </div>
                
                <div className={`space-y-5 p-5 rounded-xl border transition-colors ${isCustomMode ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                  
                  {/* Impedance */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Impedance (%)</label>
                      <span className="text-[10px] font-mono text-slate-500">Tol: {suggestions.impedance.tolerance}</span>
                    </div>
                    {isCustomMode ? (
                      <div className="flex items-center gap-3">
                        <input type="range" min={suggestions.impedance.min} max={suggestions.impedance.max} step="0.1"
                          value={targetImpedance} onChange={e => setTargetImpedance(Number(e.target.value))}
                          className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                        <input type="number" step="0.1" value={targetImpedance} onChange={e => setTargetImpedance(Number(e.target.value))}
                          className="w-16 bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-lg text-center" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg">
                        <span className="text-sm font-mono font-bold text-slate-900">{targetImpedance.toFixed(2)}%</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded uppercase">IS Suggested</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Load Loss */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Load Loss (W)</label>
                      <span className="text-[10px] text-slate-500 font-mono">Range: {suggestions.loadLoss.min} - {suggestions.loadLoss.max}</span>
                    </div>
                    {isCustomMode ? (
                      <div className="flex items-center gap-3">
                        <input type="range" min={suggestions.loadLoss.min} max={suggestions.loadLoss.max} step="5"
                          value={targetLoadLoss} onChange={e => setTargetLoadLoss(Number(e.target.value))}
                          className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                        <input type="number" step="1" value={targetLoadLoss} onChange={e => setTargetLoadLoss(Number(e.target.value))}
                          className="w-20 bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-lg text-center" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg">
                        <span className="text-sm font-mono font-bold text-slate-900">{targetLoadLoss.toLocaleString()} W</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded uppercase">IS Suggested</span>
                      </div>
                    )}
                  </div>

                  {/* No Load Loss */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">No-Load Loss (W)</label>
                      <span className="text-[10px] text-slate-500 font-mono">Range: {suggestions.noLoadLoss.min} - {suggestions.noLoadLoss.max}</span>
                    </div>
                    {isCustomMode ? (
                      <div className="flex items-center gap-3">
                        <input type="range" min={suggestions.noLoadLoss.min} max={suggestions.noLoadLoss.max} step="2"
                          value={targetNoLoadLoss} onChange={e => setTargetNoLoadLoss(Number(e.target.value))}
                          className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                        <input type="number" step="1" value={targetNoLoadLoss} onChange={e => setTargetNoLoadLoss(Number(e.target.value))}
                          className="w-20 bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-lg text-center" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg">
                        <span className="text-sm font-mono font-bold text-slate-900">{targetNoLoadLoss.toLocaleString()} W</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded uppercase">IS Suggested</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Current & Flux Density in Custom mode */}
                  {isCustomMode && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Max Current Density</label>
                        <input type="number" step="0.1" value={maxCurrentDensity} onChange={e => setMaxCurrentDensity(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Max Flux Density</label>
                        <input type="number" step="0.01" value={maxFluxDensity} onChange={e => setMaxFluxDensity(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-lg" />
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Auto-Calculated Properties */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Auto-Calculated Data
                </h3>
                
                <div className="bg-slate-800 rounded-xl p-5 text-slate-300 space-y-4 shadow-inner">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">HV Dielectric Base</div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-white">Um: {suggestions.electrical.hvUm} kV</span>
                        <span className="text-xs font-mono text-white">LI: {suggestions.electrical.hvBIL} kVp</span>
                        <span className="text-xs font-mono text-white">AC: {suggestions.electrical.hvAC} kV rms</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">LV Dielectric Base</div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-white">Um: {suggestions.electrical.lvUm} kV</span>
                        <span className="text-xs font-mono text-white">LI: {suggestions.electrical.lvBIL} kVp</span>
                        <span className="text-xs font-mono text-white">AC: {suggestions.electrical.lvAC} kV rms</span>
                      </div>
                    </div>
                  </div>
                  
                  <hr className="border-slate-700" />
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 tracking-wider">Cur. Density</div>
                      <div className="text-sm font-mono text-emerald-400">{maxCurrentDensity} <span className="text-xs text-slate-400">A/mm²</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 tracking-wider">Flux Density</div>
                      <div className="text-sm font-mono text-emerald-400">{maxFluxDensity} <span className="text-xs text-slate-400">T</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 tracking-wider">V/Turn (K Factor)</div>
                      <div className="text-sm font-mono text-white">{suggestions.constants.kFactor}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 tracking-wider">Core Build Factor</div>
                      <div className="text-sm font-mono text-white">{suggestions.constants.coreBuildingFactor}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 tracking-wider">Est. Window Asp.</div>
                      <div className="text-sm font-mono text-white">{suggestions.constants.windowAspect}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 tracking-wider">H-L Clearance</div>
                      <div className="text-sm font-mono text-white">{suggestions.constants.hiloClearance} <span className="text-xs text-slate-400">mm</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button form="new-project-form" type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors">
            Start Design <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
