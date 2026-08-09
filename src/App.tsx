import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TransformerForm } from './components/TransformerForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { RatingPlate } from './components/RatingPlate';
import { PinPanel } from './components/PinPanel';
import { DesignImpactSummary } from './components/DesignImpactSummary';
import { Button } from './components/ui';
import { computeDesign, impacts, ESSENTIALS, DEFAULT_RATES, STANDARDS } from '@/packages/engine';
import {
  CLASS_B_TARGETS, OVER_KEY_LEVER, LEVER_OVER_KEYS, findConflictForPin, findConflictForOverride,
  type PinSet, type Conflict,
} from './lib/pinRegistry';
import { solveAllPins } from './lib/classBSolver';
import { labelFor, fmtWithUnit } from './lib/paramLabels';
import { diffDependents, type DependentChange } from './lib/impactSummary';

// TODO(persistence): NewProjectModal.tsx still exists but is intentionally
// unwired -- its output shape (kVA, hvVoltage, referenceStandard,
// targetImpedance...) predates core/over. It becomes the quotation/project
// creation flow once orgs/projects/revisions land (TASKS.md item 5), driven
// off ProjectMeta (lib/types.ts) rather than the engine's own enquiry shape.

type PendingConflict =
  | { kind: 'pin'; targetId: string; value: number; conflict: Conflict }
  | { kind: 'override'; overKey: string; value: any; conflict: Conflict };

type EditAction =
  | { kind: 'param'; key: string }
  | { kind: 'pin-set'; targetId: string }
  | { kind: 'pin-release'; targetId: string; releasedValue: number };

interface SummaryData {
  editTitle: string; editFrom: string; editTo: string;
  lever?: { label: string; from: string; to: string; why: string };
  dependents: DependentChange[];
  engineImpacts: any[];
}

export default function App() {
  const [core, setCoreState] = useState<any>(ESSENTIALS);
  const [over, setOverState] = useState<Record<string, any>>({});
  // Seeded from DEFAULT_RATES, but this is a real rate card once orgs/rateCards
  // (TASKS.md item 4) exists -- never hardcode a rate value in a display component.
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  // TODO(persistence): belongs to ProjectMeta.projectName once projects/revisions
  // land (TASKS.md item 5). Local-only for now, disconnected from any storage.
  const [projectName, setProjectName] = useState('Untitled Design');

  // SOLVER.md step 1: the pin registry. Step 3 solves against it.
  const [pins, setPins] = useState<PinSet>({});
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);

  // SOLVER.md step 4: what the user just did, so the summary effect below
  // can describe it. Cleared once consumed.
  const [lastAction, setLastAction] = useState<EditAction | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const handleNewProject = () => {
    setCoreState(ESSENTIALS);
    setOverState({});
    setProjectName('Untitled Design');
    setPins({});
    setPendingConflict(null);
    setLastAction(null);
    setSummary(null);
  };

  // Core-level enquiry edits (kva, hv, vector...) are direct inputs too --
  // track them the same way as a Class A row for the impact summary.
  const handleCoreChange = (nextCore: Record<string, any>) => {
    const key = Object.keys(nextCore).find((k) => nextCore[k] !== core[k]);
    if (key) setLastAction({ kind: 'param', key });
    setCoreState(nextCore);
  };

  // A Class A row (flux, deltaLV, deltaHV, etK, oilRiseTarget) is also a lever.
  // If a Class B pin already claims that lever, block the direct edit and ask,
  // per SOLVER.md section 2 rule 2 -- do not guess which one wins.
  const handleOverChange = (nextOver: Record<string, any>) => {
    for (const overKey of Object.keys(OVER_KEY_LEVER)) {
      const changed = nextOver[overKey] !== over[overKey] && nextOver[overKey] !== undefined;
      if (!changed) continue;
      const conflict = findConflictForOverride(overKey, pins);
      if (conflict) {
        setPendingConflict({ kind: 'override', overKey, value: nextOver[overKey], conflict });
        return;
      }
    }
    const keys = new Set([...Object.keys(over), ...Object.keys(nextOver)]);
    const key = [...keys].find((k) => over[k] !== nextOver[k]);
    if (key) setLastAction({ kind: 'param', key });
    setOverState(nextOver);
  };

  const requestPin = (targetId: string, value: number) => {
    const conflict = findConflictForPin(targetId, pins, over);
    if (conflict) {
      setPendingConflict({ kind: 'pin', targetId, value, conflict });
      return;
    }
    setLastAction({ kind: 'pin-set', targetId });
    setPins({ ...pins, [targetId]: { targetId, value } });
  };

  const releasePin = (targetId: string) => {
    const releasedValue = pins[targetId]?.value;
    const next = { ...pins };
    delete next[targetId];
    if (releasedValue !== undefined) setLastAction({ kind: 'pin-release', targetId, releasedValue });
    setPins(next);
  };

  const resolveConflict = (release: boolean) => {
    if (pendingConflict && release) {
      const nextPins = { ...pins };
      const nextOver = { ...over };
      for (const h of pendingConflict.conflict.holders) {
        if (h.kind === 'pin') delete nextPins[h.targetId];
        else delete nextOver[h.overKey];
      }
      if (pendingConflict.kind === 'pin') {
        nextPins[pendingConflict.targetId] = { targetId: pendingConflict.targetId, value: pendingConflict.value };
        setLastAction({ kind: 'pin-set', targetId: pendingConflict.targetId });
      } else {
        nextOver[pendingConflict.overKey] = pendingConflict.value;
        setLastAction({ kind: 'param', key: pendingConflict.overKey });
      }
      setPins(nextPins);
      setOverState(nextOver);
    }
    setPendingConflict(null);
  };

  // SOLVER.md step 3: solve every active pin against the design. Pins never
  // share a lever (conflict detection above guarantees that), but a pin can
  // still shift the design a different pin is evaluated against -- pinning
  // core diameter changes the window, which changes load loss. solveAllPins
  // re-solves in registration order until every pin's achieved value stops
  // moving, or gives up after 5 passes and says which pins are still
  // fighting rather than presenting an unsettled pass as final.
  const { result, solveResults, solveConverged, solveFighting } = useMemo(() => {
    // packages/engine is plain JS; TS infers DEFAULT_RATES's exact literal shape
    // from its default parameter, which is stricter than the editable Record<string,
    // number> this state actually needs to be. Cast at this one boundary rather
    // than propagating that accidental strictness through the app.
    const solved = solveAllPins(pins, core, over, rates as any);
    const result = computeDesign(core, solved.effectiveOver, rates as any, []);
    return {
      result, solveResults: solved.results,
      solveConverged: solved.converged, solveFighting: solved.fighting,
    };
  }, [core, over, rates, pins]);

  // SOLVER.md step 4: Design Impact Summary, shown after every change, for
  // the one decision just made -- not a diff of the whole design. impacts()
  // supplies the design-level consequences (weight, losses, efficiency,
  // compliance, money); this effect adds what only the app knows (what was
  // edited, which lever the solver moved and why, what else moved).
  const prevResultRef = useRef(result);
  useEffect(() => {
    const prev = prevResultRef.current;
    if (prev !== result && lastAction) {
      let skip = false;
      let editTitle = '', editFrom = '', editTo = '';
      let excludeKeys: string[] = [];
      let lever: SummaryData['lever'];

      if (lastAction.kind === 'param') {
        const { key } = lastAction;
        editTitle = `Parameter Edited: ${labelFor(key)}`;
        editFrom = fmtWithUnit(key, prev.params[key]);
        editTo = fmtWithUnit(key, result.params[key]);
        excludeKeys = [key];
      } else {
        const target = CLASS_B_TARGETS.find((t) => t.id === lastAction.targetId)!;
        if (lastAction.kind === 'pin-release') {
          editTitle = `Pin Released: ${target.label}`;
          editFrom = `${lastAction.releasedValue} ${target.unit}`;
          editTo = 'Not pinned';
        } else {
          const solve = solveResults[lastAction.targetId];
          if (!solve?.reachable) {
            // Nothing actually changed -- PinPanel already shows the
            // unreachable message in red. A summary of zero change here
            // would just be noise.
            skip = true;
          } else {
            editTitle = `Pin Set: ${target.label}`;
            editFrom = 'Not pinned';
            editTo = `${pins[lastAction.targetId]?.value} ${target.unit}`;
            const overKeys = LEVER_OVER_KEYS[target.lever];
            if (overKeys.length) {
              lever = {
                label: target.leverLabel,
                from: overKeys.map((k) => fmtWithUnit(k, prev.params[k])).join(' / '),
                to: overKeys.map((k) => fmtWithUnit(k, result.params[k])).join(' / '),
                why: target.relationship,
              };
              excludeKeys = overKeys;
            }
          }
        }
      }

      if (!skip) {
        const engineImpacts = impacts(prev.design, prev.bom, result.design, result.bom, result.params);
        const dependents = diffDependents(prev.params, result.params, excludeKeys);
        setSummary({ editTitle, editFrom, editTo, lever, dependents, engineImpacts });
      }
    }
    prevResultRef.current = result;
    setLastAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

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
          <Button variant="primary" onClick={handleNewProject}>New Project</Button>
        </div>

        {pendingConflict && (
          <div className="bg-white border border-amber rounded-[2px] px-4 py-3 print:hidden">
            <div className="text-[11px] font-display uppercase tracking-[0.14em] text-amber mb-1">
              Pin Conflict, {pendingConflict.conflict.leverLabel}
            </div>
            <p className="text-[11px] text-ink2 mb-2">
              {pendingConflict.kind === 'pin'
                ? `Pinning ${CLASS_B_TARGETS.find((t) => t.id === pendingConflict.targetId)?.label} needs ${pendingConflict.conflict.leverLabel}, `
                : `Setting ${pendingConflict.overKey} directly needs ${pendingConflict.conflict.leverLabel}, `}
              which is already claimed by {pendingConflict.conflict.holders.map((h) => h.label).join(', ')}.
              Release {pendingConflict.conflict.holders.length > 1 ? 'them' : 'it'} to proceed, or cancel.
            </p>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => resolveConflict(true)}>Release and Apply</Button>
              <Button variant="secondary" onClick={() => resolveConflict(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {summary && (
          <DesignImpactSummary
            editTitle={summary.editTitle} editFrom={summary.editFrom} editTo={summary.editTo}
            lever={summary.lever} dependents={summary.dependents} engineImpacts={summary.engineImpacts}
            onDismiss={() => setSummary(null)}
          />
        )}

        <main className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          <aside className="print:hidden space-y-4">
            <PinPanel
              pins={pins} over={over} solveResults={solveResults}
              converged={solveConverged} fighting={solveFighting}
              onRequestPin={requestPin} onReleasePin={releasePin}
            />
            <TransformerForm
              core={core} over={over} onCoreChange={handleCoreChange} onOverChange={handleOverChange}
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
