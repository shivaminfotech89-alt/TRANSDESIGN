import React, { useState, useMemo } from 'react';
import { TransformerForm } from './components/TransformerForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { calculateTransformer } from './lib/engine';
import { TransformerInputs } from './types';
import { Zap, Activity, Plus } from 'lucide-react';
import { NewProjectModal } from './components/NewProjectModal';
import { ProjectsModal } from './components/ProjectsModal';
import { FolderOpen, Database } from 'lucide-react';
import { DatabaseManager } from './components/db/DatabaseManager';

export default function App() {
  const [showNewModal, setShowNewModal] = useState(false);
  const [inputs, setInputs] = useState<TransformerInputs>({
    projectName: 'Untitled Design',
    kVA: 1000,
    hvVoltage: 11000,
    lvVoltage: 433,
    phases: 3,
    frequency: 50,
    cooling: 'Oil Immersed',
    coreMaterial: 'CRGO Conventional',
    conductor: 'Copper',
    strategy: 'Lowest Cost',
    coreCostPerKg: 350,
    conductorCostPerKg: 900,

    marginPercentage: 15.0,

    referenceStandard: 'IEC 60076',
    insulationClass: 'A',
    maxFluxDensity: 1.7,
    maxCurrentDensityHv: 3.0,
    maxCurrentDensityLv: 3.0,

    vectorGroup: 'Dyn11',
    coreType: 'Step-Lap',
    tankType: 'Radiator & Conservator',
    tapChanger: 'OCTC',
    ambientTemp: 45,
    tempRise: 50,
    oilCostPerLitre: 95,
    steelCostPerKg: 75,

  });

  const outputs = useMemo(() => calculateTransformer(inputs), [inputs]);

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 print:hidden sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-lg shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">
              TransDesign Engine <span className="text-blue-600 font-mono ml-1">v4.02</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
              <span>{inputs.projectName || 'Untitled Design'}</span>
              <span className="text-slate-300">|</span>
              <span>Professional Transformer Design & Analysis</span>
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[12px] font-medium text-slate-600">
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-bold text-xs transition-colors border border-blue-200 shadow-sm mr-2">
            <Plus className="w-4 h-4" /> NEW PROJECT
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-600 font-semibold">SYSTEM READY</span>
          </div>
          <div className="text-slate-400">IEC 60076 / IEEE C57 COMPLIANT</div>
          <div className="px-3 py-1 bg-slate-100 rounded-md text-slate-500 border border-slate-200">
            AUTH: ENGINEER_SYS_01
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden print:overflow-visible print:block">
        <aside className="w-full lg:w-[400px] shrink-0 border-r border-slate-200 bg-white p-6 lg:overflow-y-auto print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0">
          <TransformerForm inputs={inputs} onChange={setInputs} />
        </aside>

        <section className="flex-1 p-6 lg:p-8 lg:overflow-y-auto bg-slate-50 print:overflow-visible print:block print:bg-white print:p-0">
          <div className="max-w-6xl mx-auto">
            <ResultsDisplay outputs={outputs} inputs={inputs} />
          </div>
        </section>
      </main>
      {showNewModal && (
        <NewProjectModal 
          onClose={() => setShowNewModal(false)} 
          onStart={(newInputs) => { setInputs(prev => ({...prev, ...newInputs})); setShowNewModal(false); }}
        />
      )}
    </div>
  );
}
