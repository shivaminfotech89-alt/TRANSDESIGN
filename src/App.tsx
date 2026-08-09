import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TransformerForm } from './components/TransformerForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { RatingPlate } from './components/RatingPlate';
import { PinPanel } from './components/PinPanel';
import { DesignImpactSummary } from './components/DesignImpactSummary';
import { ProjectBar } from './components/ProjectBar';
import { NewProjectModal } from './components/NewProjectModal';
import { Button } from './components/ui';
import { useAuth } from './components/AuthContext';
import { useOrg } from './components/OrgContext';
import { computeDesign, impacts, summarise, ESSENTIALS, DEFAULT_RATES, STANDARDS } from '@/packages/engine';
import {
  CLASS_B_TARGETS, OVER_KEY_LEVER, LEVER_OVER_KEYS, findConflictForPin, findConflictForOverride,
  type PinSet, type Conflict,
} from './lib/pinRegistry';
import { solveAllPins } from './lib/classBSolver';
import { labelFor, fmtWithUnit } from './lib/paramLabels';
import { diffDependents, type DependentChange } from './lib/impactSummary';
import { createProject, renameProject, saveRevision, getRevision } from '../lib/projects';
import type { ProjectMeta, Project } from '../lib/types';

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
  const { user } = useAuth();
  const { orgId } = useOrg();

  const [core, setCoreState] = useState<any>(ESSENTIALS);
  const [over, setOverState] = useState<Record<string, any>>({});
  // Seeded from DEFAULT_RATES, but this is a real rate card once orgs/rateCards
  // (TASKS.md item 4) exists -- never hardcode a rate value in a display component.
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  // Mirrors ProjectMeta.projectName (lib/types.ts). TASKS.md item 5: persisted
  // via lib/projects.ts against orgs/{orgId}/projects/{id}/revisions/{rev}.
  const [projectName, setProjectName] = useState('Untitled Design');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [projectListVersion, setProjectListVersion] = useState(0);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // SOLVER.md step 1: the pin registry. Step 3 solves against it.
  const [pins, setPins] = useState<PinSet>({});
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);

  // SOLVER.md step 4: what the user just did, so the summary effect below
  // can describe it. Cleared once consumed.
  const [lastAction, setLastAction] = useState<EditAction | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const resetDesignState = () => {
    setPins({});
    setPendingConflict(null);
    setLastAction(null);
    setSummary(null);
  };

  /** Minimal ProjectMeta -- only projectName is exposed in the UI so far.
   *  The rest (customer, tender, docPrefix...) are TASKS.md item 5/document
   *  register territory; defaulted here so a revision can be saved at all. */
  const buildMeta = (name: string): ProjectMeta => ({
    customer: '', contractor: '', projectName: name, tender: '', revision: 0,
    docPrefix: 'TDE', maker: '', designer: '', serial: '', year: new Date().getFullYear(),
    altitude: 0, site: '', paint: '',
  });

  const handleNewProjectStart = (name: string, corePatch: Record<string, any>) => {
    setCoreState({ ...ESSENTIALS, ...corePatch });
    setOverState({});
    setRates(DEFAULT_RATES);
    setProjectName(name);
    setCurrentProjectId(null);
    resetDesignState();
    setShowNewProjectModal(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSavingProject(true);
    try {
      let projectId = currentProjectId;
      if (!projectId) {
        projectId = await createProject(orgId, user.uid, projectName, buildMeta(projectName));
        setCurrentProjectId(projectId);
      } else {
        await renameProject(orgId, projectId, projectName, user.uid);
      }
      await saveRevision(orgId, projectId, user.uid, {
        input: {
          core, over, meta: buildMeta(projectName), extras: [],
          budgetMin: 0, budgetMax: 0, searchOpts: {},
        },
        rateCardId: 'default',
        rateSnapshot: rates,
        engineVersion: result.engineVersion,
        summary: summarise(core, result.design, result.bom),
      });
      setProjectListVersion((v) => v + 1);
    } catch (err) {
      window.alert(`Save failed: ${err}`);
    }
    setSavingProject(false);
  };

  const handleSaveAsCopy = async () => {
    if (!user || !currentProjectId) return;
    setSavingProject(true);
    try {
      const newName = `${projectName} (Copy)`;
      const newId = await createProject(orgId, user.uid, newName, buildMeta(newName));
      await saveRevision(orgId, newId, user.uid, {
        input: {
          core, over, meta: buildMeta(newName), extras: [],
          budgetMin: 0, budgetMax: 0, searchOpts: {},
        },
        rateCardId: 'default',
        rateSnapshot: rates,
        engineVersion: result.engineVersion,
        summary: summarise(core, result.design, result.bom),
        note: `Copied from ${projectName}`,
      });
      setProjectName(newName);
      setCurrentProjectId(newId);
      setProjectListVersion((v) => v + 1);
    } catch (err) {
      window.alert(`Save as copy failed: ${err}`);
    }
    setSavingProject(false);
  };

  const handleOpenProject = async (project: Project & { id: string }) => {
    if (project.currentRevision < 0) {
      window.alert(`${project.name} has no saved revision yet.`);
      return;
    }
    setSavingProject(true);
    try {
      const rev = await getRevision(orgId, project.id, project.currentRevision);
      if (rev) {
        setCoreState(rev.input.core);
        setOverState(rev.input.over);
        setRates(rev.rateSnapshot);
        setProjectName(rev.input.meta?.projectName || project.name);
        setCurrentProjectId(project.id);
        resetDesignState();
      }
    } catch (err) {
      window.alert(`Open failed: ${err}`);
    }
    setSavingProject(false);
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
  // compliance, money); buildSummary adds what only the app knows (what was
  // edited, which lever the solver moved and why, what else moved).
  //
  // `result` itself is never debounced -- the useMemo above recomputes on
  // every tick so the rating plate and results track the slider live. Only
  // the summary's own build+display is debounced: `anchor` holds the result
  // from before the current burst of edits started, fixed for the whole
  // burst, and the actual summary is built once 300ms passes with no further
  // change, comparing anchor -> the result at rest, described by whichever
  // action was most recent.
  const buildSummary = (anchor: typeof result, latest: typeof result, action: EditAction): SummaryData | null => {
    let editTitle = '', editFrom = '', editTo = '';
    let excludeKeys: string[] = [];
    let lever: SummaryData['lever'];

    if (action.kind === 'param') {
      const { key } = action;
      editTitle = `Parameter Edited: ${labelFor(key)}`;
      editFrom = fmtWithUnit(key, anchor.params[key]);
      editTo = fmtWithUnit(key, latest.params[key]);
      excludeKeys = [key];
    } else {
      const target = CLASS_B_TARGETS.find((t) => t.id === action.targetId)!;
      if (action.kind === 'pin-release') {
        editTitle = `Pin Released: ${target.label}`;
        editFrom = `${action.releasedValue} ${target.unit}`;
        editTo = 'Not pinned';
      } else {
        const solve = solveResults[action.targetId];
        if (!solve?.reachable) {
          // Nothing actually changed -- PinPanel already shows the
          // unreachable message in red. A summary of zero change here
          // would just be noise.
          return null;
        }
        editTitle = `Pin Set: ${target.label}`;
        editFrom = 'Not pinned';
        editTo = `${pins[action.targetId]?.value} ${target.unit}`;
        const overKeys = LEVER_OVER_KEYS[target.lever];
        if (overKeys.length) {
          lever = {
            label: target.leverLabel,
            from: overKeys.map((k) => fmtWithUnit(k, anchor.params[k])).join(' / '),
            to: overKeys.map((k) => fmtWithUnit(k, latest.params[k])).join(' / '),
            why: target.relationship,
          };
          excludeKeys = overKeys;
        }
      }
    }

    const engineImpacts = impacts(anchor.design, anchor.bom, latest.design, latest.bom, latest.params);
    const dependents = diffDependents(anchor.params, latest.params, excludeKeys);
    return { editTitle, editFrom, editTo, lever, dependents, engineImpacts };
  };

  const prevResultRef = useRef(result);
  const anchorRef = useRef<typeof result | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  useEffect(() => {
    if (prevResultRef.current !== result && lastAction) {
      if (anchorRef.current === null) anchorRef.current = prevResultRef.current;
      const anchor = anchorRef.current;
      const action = lastAction;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const built = buildSummary(anchor, result, action);
        if (built) setSummary(built);
        anchorRef.current = null;
        debounceRef.current = null;
      }, 300);
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

        <ProjectBar
          projectName={projectName} onProjectNameChange={setProjectName}
          onSave={handleSave} onSaveAsCopy={handleSaveAsCopy}
          onNew={() => setShowNewProjectModal(true)} onOpen={handleOpenProject}
          currentProjectId={currentProjectId} busy={savingProject} refreshKey={projectListVersion}
        />

        <RatingPlate design={result.design} bom={result.bom} params={result.params} />

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

      {showNewProjectModal && (
        <NewProjectModal onClose={() => setShowNewProjectModal(false)} onStart={handleNewProjectStart} />
      )}
    </div>
  );
}
