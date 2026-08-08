import React, { useMemo, useState } from 'react';
import { TransformerForm } from './components/TransformerForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { computeDesign, ESSENTIALS, DEFAULT_RATES } from '@/packages/engine';
import { Zap, Activity, Plus } from 'lucide-react';

// TODO(persistence): NewProjectModal.tsx still exists but is intentionally
// unwired -- its output shape (kVA, hvVoltage, referenceStandard,
// targetImpedance...) predates core/over. It becomes the quotation/project
// creation flow once orgs/projects/revisions land (TASKS.md item 5), driven
// off ProjectMeta (lib/types.ts) rather than the engine's own enquiry shape.

export default function App() {
  const [core, setCore] = useState<any>(ESSENTIALS);
  const [over, setOver] = useState<Record<string, any>>({});
  // Seeded from DEFAULT_RATES, but this is a real rate card once orgs/rateCards
  // (TASKS.md item 4) exists -- never hardcode a rate value in a display component.
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  // TODO(persistence): belongs to ProjectMeta.projectName once projects/revisions
  // land (TASKS.md item 5). Local-only for now, disconnected from any storage.
  const [projectName, setProjectName] = useState('Untitled Design');

  const handleNewProject = () => {
    setCore(ESSENTIALS);
    setOver({});
    setProjectName('Untitled Design');
  };

  // packages/engine is plain JS; TS infers DEFAULT_RATES's exact literal shape
  // from its default parameter, which is stricter than the editable Record<string,
  // number> this state actually needs to be. Cast at this one boundary rather
  // than propagating that accidental strictness through the app.
  const result = useMemo(() => computeDesign(core, over, rates as any, []), [core, over, rates]);

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
              <span>{projectName}</span>
              <span className="text-slate-300">|</span>
              <span>{core.kva} kVA, {core.hv / 1000} kV / {core.lv} V, {core.vector}</span>
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[12px] font-medium text-slate-600">
          <button onClick={handleNewProject} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-bold text-xs transition-colors border border-blue-200 shadow-sm mr-2">
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
          <TransformerForm
            core={core} over={over} onCoreChange={setCore} onOverChange={setOver}
            projectName={projectName} onProjectNameChange={setProjectName}
          />
        </aside>

        <section className="flex-1 p-6 lg:p-8 lg:overflow-y-auto bg-slate-50 print:overflow-visible print:block print:bg-white print:p-0">
          <div className="max-w-6xl mx-auto">
            <ResultsDisplay
              design={result.design} bom={result.bom} params={result.params}
              rates={rates} onRatesChange={setRates}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
