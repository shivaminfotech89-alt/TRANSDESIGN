import React, { useMemo, useState } from 'react';
import { TransformerForm } from './components/TransformerForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { RatingPlate } from './components/RatingPlate';
import { computeDesign, ESSENTIALS, DEFAULT_RATES, STANDARDS } from '@/packages/engine';

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
  const standardName = STANDARDS[core.standard]?.name || core.standard;

  return (
    <div className="min-h-screen text-ink font-body">
      <div className="max-w-[1500px] mx-auto p-4 space-y-4">

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 print:hidden">
          <div>
            <div className="text-[10px] font-display uppercase tracking-[0.4em] text-copper">Design Office</div>
            <h1 className="text-[30px] font-display uppercase text-ink leading-none mt-1">
              Transformer Design &amp; Costing
            </h1>
          </div>
          <div className="text-right font-mono text-[10px] text-ink2 leading-relaxed">
            <div>{standardName}</div>
            <div>All figures in Indian Rupees</div>
          </div>
        </header>

        <RatingPlate design={result.design} bom={result.bom} params={result.params} />

        <div className="flex items-center justify-between gap-4 bg-white border border-rule rounded-[2px] px-4 py-2 print:hidden">
          <div className="text-[11px] text-ink2">
            <span className="font-mono text-ink">{projectName}</span>
          </div>
          <button
            onClick={handleNewProject}
            className="font-display uppercase text-[11px] tracking-[0.14em] px-3 py-1.5 rounded-[2px] bg-copper text-white"
          >
            New Project
          </button>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          <aside className="print:hidden">
            <TransformerForm
              core={core} over={over} onCoreChange={setCore} onOverChange={setOver}
              projectName={projectName} onProjectNameChange={setProjectName}
            />
          </aside>

          <section>
            <ResultsDisplay
              design={result.design} bom={result.bom} params={result.params}
              rates={rates} onRatesChange={setRates}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
