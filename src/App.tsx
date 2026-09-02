import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TransformerForm } from './components/TransformerForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { RatingPlate } from './components/RatingPlate';
import { PinPanel } from './components/PinPanel';
import { DesignImpactSummary } from './components/DesignImpactSummary';
import { ProjectBar } from './components/ProjectBar';
import { NewProjectModal } from './components/NewProjectModal';
import { RevisionsModal } from './components/RevisionsModal';
import { RateCardManager } from './components/RateCardManager';
import { SuppliersModal } from './components/SuppliersModal';
import { ItemsModal } from './components/ItemsModal';
import { Button } from './components/ui';
import { useAuth } from './components/AuthContext';
import { useOrg } from './components/OrgContext';
import { computeDesign, impacts, summarise, ESSENTIALS, DEFAULT_RATES, STANDARDS, inr } from '@/packages/engine';
import {
  CLASS_B_TARGETS, OVER_KEY_LEVER, LEVER_OVER_KEYS, findConflictForPin, findConflictForOverride,
  type PinSet, type Conflict,
} from './lib/pinRegistry';
import { solveAllPins } from './lib/classBSolver';
import { labelFor, fmtWithUnit } from './lib/paramLabels';
import { diffDependents, type DependentChange } from './lib/impactSummary';
import { resolveRates, withRateDefaults, type PriceResolution } from './lib/pricing';
import {
  createProject, renameProject, saveRevision, getRevision, listRateCards, currentRateCard,
  listItems, listSuppliers,
} from '../lib/projects';
import type { ProjectMeta, Project, Revision, RateCard, Item, Supplier } from '../lib/types';
import { candidateKey } from './components/budget/BudgetTab';

const CAN_EDIT_ROLES = ['owner', 'engineer', 'estimator'];

type PendingConflict =
  | { kind: 'pin'; targetId: string; value: number; conflict: Conflict }
  | { kind: 'override'; overKey: string; value: any; conflict: Conflict };

/** The exact fields searchDesigns() varies between candidates (packages/engine
 *  index.js, searchDesigns' `cand`). Adopting a budget option means copying
 *  just these into `over` -- deriveSpec() re-derives everything else from
 *  `core` exactly as it already does, and locking flux/deltaLV/deltaHV here
 *  also locks autoFit, so the recompute reproduces the previewed numbers
 *  exactly rather than a fresh auto-fit landing nearby.
 *  etK, steps and tapType (CALIBRATION.md section 2): these three are on
 *  every candidate whether or not the search actually swept them, so
 *  copying them across is always safe -- but locking etK here also matters
 *  when it WAS swept: without it, computeDesign's fitEtkToCost would treat
 *  the adopted K as AUTO again and re-optimise it against the live rates,
 *  which can land somewhere other than what was previewed. */
const BUDGET_OVER_KEYS = [
  'coreType', 'coreGrade', 'flux', 'condLV', 'condHV', 'deltaLV', 'deltaHV', 'tankType', 'cooling', 'oilRiseTarget', 'lvHvClr',
  'etK', 'steps', 'tapType',
] as const;

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
  const { user, logOut } = useAuth();
  const { orgId, role } = useOrg();
  const canEdit = !!role && CAN_EDIT_ROLES.includes(role);

  const [core, setCoreState] = useState<any>(ESSENTIALS);
  const [over, setOverState] = useState<Record<string, any>>({});
  // DEFAULT_RATES is only the seed for the instant before the org's own
  // current rate card loads (see the effect below) or a fallback if the org
  // somehow has none -- every save uses rateCardId, the real document id,
  // never a hardcoded literal.
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [rateCardId, setRateCardId] = useState('default');
  const [orgRateCards, setOrgRateCards] = useState<(RateCard & { id: string })[]>([]);
  const [showRateCards, setShowRateCards] = useState(false);
  // TASKS.md item 11.2: master data, not design data -- unrelated to
  // whichever project is currently open, so it lives alongside the org-level
  // rate cards rather than inside ProjectBar's per-project controls.
  const [showSuppliers, setShowSuppliers] = useState(false);
  // TASKS.md item 11.3: same reasoning as suppliers -- org-level master data.
  const [showItems, setShowItems] = useState(false);
  const [orgItems, setOrgItems] = useState<(Item & { id: string })[]>([]);
  const [orgSuppliers, setOrgSuppliers] = useState<(Supplier & { id: string })[]>([]);

  // TASKS.md item 11.4: a rate locked for this project only, keyed by engine
  // rate key -- outranks every other tier. Part of what a revision saves
  // (Revision.input.priceLocks); starts empty for a fresh project and is
  // restored from whatever was saved when a revision is opened or copied
  // forward.
  const [priceLocks, setPriceLocks] = useState<Record<string, number>>({});
  // True immediately after loading a saved revision's own frozen rates, so
  // the live design reproduces exactly what was saved rather than
  // re-resolving item/supplier prices that may have changed since (the same
  // concern TASKS.md item 5's acceptance test already established for
  // rates/over/core generally). The first edit of any kind clears it, since
  // from that point the user is building a new candidate revision, which
  // should price against the freshest data available -- see the handlers
  // below that set it back to false.
  const [ratesAreFrozen, setRatesAreFrozen] = useState(false);
  // What handleOpenProject's revision itself saved as rateSources -- shown
  // verbatim while ratesAreFrozen, so a locked-live revision (which never
  // goes through the viewingRevision overlay) still shows real provenance
  // instead of blank badges just because resolution was skipped.
  const [frozenRateSources, setFrozenRateSources] = useState<Record<string, PriceResolution>>({});

  // TASKS.md item 11.1: load the org's real rate cards once per session and
  // seed the live design off whichever is actually in force today, instead
  // of the raw engine defaults. Runs once -- orgId is stable for the
  // session, and re-running this on every render would clobber a rate card
  // the user has since selected, edited, or loaded from an opened project's
  // own frozen rateSnapshot. Items and suppliers load alongside it for the
  // same reason: 11.4's resolution needs both before the first price shows.
  useEffect(() => {
    listRateCards(orgId)
      .then((cards) => {
        setOrgRateCards(cards);
        const current = currentRateCard(cards);
        if (current) {
          setRates(withRateDefaults(current.rates));
          setRateCardId(current.id);
        }
      })
      .catch((e) => console.error('[App] could not load the organisation\'s rate cards', e));
    listItems(orgId).then(setOrgItems).catch((e) => console.error('[App] could not load the organisation\'s items', e));
    listSuppliers(orgId).then(setOrgSuppliers).catch((e) => console.error('[App] could not load the organisation\'s suppliers', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);
  // Mirrors ProjectMeta.projectName (lib/types.ts). TASKS.md item 5: persisted
  // via lib/projects.ts against orgs/{orgId}/projects/{id}/revisions/{rev}.
  const [projectName, setProjectName] = useState('Untitled Design');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [projectListVersion, setProjectListVersion] = useState(0);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  // TASKS.md item 5, revisions: the project's own currentRevision counter,
  // independent of whatever is loaded live for editing -- it only moves on
  // handleOpenProject and a successful save, never on browsing history or
  // copying an old revision forward.
  const [projectCurrentRevision, setProjectCurrentRevision] = useState(-1);
  // Whether the revision currently loaded into core/over/rates is locked.
  // The rules permit only ever setting locked from false to true, so this is
  // never a normal user edit going back to false -- only handleOpenProject,
  // a fresh save, or a fresh project can clear it.
  const [liveRevisionLocked, setLiveRevisionLocked] = useState(false);
  // Explicit "yes, edit on top of the locked values anyway" -- set only by
  // the locked-revision banner's own button, so a locked revision is never
  // silently editable.
  const [overrideLock, setOverrideLock] = useState(false);
  // Set whenever the live design's inputs came from an older or locked
  // revision rather than a plain edit, so the next save's note can say so.
  const [copiedFromRev, setCopiedFromRev] = useState<number | null>(null);
  // Read-only overlay for browsing a specific past revision -- architecturally
  // the same idea as budgetPreview (activeDesign swaps to it everywhere,
  // never touches core/over/rates), because "show a different computed
  // design everywhere without disturbing the live one" is exactly the same
  // problem both solve.
  const [viewingRevision, setViewingRevision] = useState<(Revision & { id?: string }) | null>(null);

  // SOLVER.md step 1: the pin registry. Step 3 solves against it.
  const [pins, setPins] = useState<PinSet>({});
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);

  // SOLVER.md step 4: what the user just did, so the summary effect below
  // can describe it. Cleared once consumed.
  const [lastAction, setLastAction] = useState<EditAction | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // CLAUDE.md invariant 3: one design on screen at a time. A previewed budget
  // option is a searchDesigns() result row -- {inputs, d, bom, price, tco...}
  // -- shown everywhere in place of the live design until Adopt or Discard.
  const [budgetPreview, setBudgetPreview] = useState<any | null>(null);

  const resetDesignState = () => {
    setPins({});
    setPendingConflict(null);
    setLastAction(null);
    setSummary(null);
    setBudgetPreview(null);
    setViewingRevision(null);
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
    // The org's own current rate card, not the bare engine defaults -- falls
    // back to them only if the org somehow has no rate card at all yet.
    const current = currentRateCard(orgRateCards);
    setRates(withRateDefaults(current?.rates));
    setRateCardId(current ? current.id : 'default');
    setProjectName(name);
    setCurrentProjectId(null);
    setProjectCurrentRevision(-1);
    setLiveRevisionLocked(false);
    setOverrideLock(false);
    setCopiedFromRev(null);
    setPriceLocks({});
    setRatesAreFrozen(false);
    setFrozenRateSources({});
    resetDesignState();
    setShowNewProjectModal(false);
  };

  const handleSave = async () => {
    // ProjectBar already disables the button for this; guarded again here so
    // no future caller can save core/over while a different price (the
    // preview's, or a viewed/locked revision's) sits on screen -- see
    // previewActive's doc comment. isProvisional guards the same thing one
    // section later: saving while the design has not settled would freeze
    // summary/engineVersion off a structurally-frozen, not-yet-reoptimised
    // fast result -- exactly the mid-drag figure this session's own request
    // said nobody should quote from.
    if (!user || budgetPreview || viewingRevision || (liveRevisionLocked && !overrideLock) || isProvisional) return;
    setSavingProject(true);
    try {
      let projectId = currentProjectId;
      if (!projectId) {
        projectId = await createProject(orgId, user.uid, projectName, buildMeta(projectName));
        setCurrentProjectId(projectId);
      } else {
        await renameProject(orgId, projectId, projectName, user.uid);
      }
      const newRev = await saveRevision(orgId, projectId, user.uid, {
        input: {
          core, over, meta: buildMeta(projectName), extras: [],
          budgetMin: 0, budgetMax: 0, searchOpts: {}, priceLocks,
        },
        rateCardId,
        // The fully resolved figures, not the rate card's own raw values --
        // TASKS.md item 11.4's whole point is that a supplier price can
        // outrank the rate card, and rateSnapshot's job is to reprice
        // exactly as issued, so it must freeze whichever numbers actually
        // priced this quotation.
        rateSnapshot: effectiveRates,
        rateSources,
        engineVersion: settledResult.engineVersion,
        summary: summarise(core, settledResult.design, settledResult.bom),
        note: copiedFromRev != null ? `Copied forward from rev ${copiedFromRev}` : '',
      });
      setProjectCurrentRevision(newRev);
      setLiveRevisionLocked(false);
      setOverrideLock(false);
      setCopiedFromRev(null);
      setProjectListVersion((v) => v + 1);
    } catch (err) {
      window.alert(`Save failed: ${err}`);
    }
    setSavingProject(false);
  };

  const handleSaveAsCopy = async () => {
    if (!user || !currentProjectId || budgetPreview || viewingRevision || readOnlyLive || isProvisional) return;
    setSavingProject(true);
    try {
      const newName = `${projectName} (Copy)`;
      const newId = await createProject(orgId, user.uid, newName, buildMeta(newName));
      const newRev = await saveRevision(orgId, newId, user.uid, {
        input: {
          core, over, meta: buildMeta(newName), extras: [],
          budgetMin: 0, budgetMax: 0, searchOpts: {}, priceLocks,
        },
        rateCardId,
        rateSnapshot: effectiveRates,
        rateSources,
        engineVersion: settledResult.engineVersion,
        summary: summarise(core, settledResult.design, settledResult.bom),
        note: `Copied from ${projectName}`,
      });
      setProjectName(newName);
      setCurrentProjectId(newId);
      setProjectCurrentRevision(newRev);
      setLiveRevisionLocked(false);
      setOverrideLock(false);
      setCopiedFromRev(null);
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
        setRates(withRateDefaults(rev.rateSnapshot));
        setRateCardId(rev.rateCardId);
        setPriceLocks(rev.input.priceLocks || {});
        // The saved rateSnapshot already reflects whatever the price
        // hierarchy resolved at save time -- reproduce it exactly rather
        // than re-resolving against item/supplier prices that may have
        // moved since. Cleared the moment any edit happens (see the
        // handlers below).
        setRatesAreFrozen(true);
        setFrozenRateSources(rev.rateSources || {});
        setProjectName(rev.input.meta?.projectName || project.name);
        setCurrentProjectId(project.id);
        resetDesignState();
        setProjectCurrentRevision(project.currentRevision);
        // A locked current revision is the one that went to the customer --
        // it opens read-only, same as browsing an older one from the
        // revisions list, until the user explicitly edits it forward.
        setLiveRevisionLocked(rev.locked);
        setOverrideLock(false);
        setCopiedFromRev(null);
      }
    } catch (err) {
      window.alert(`Open failed: ${err}`);
    }
    setSavingProject(false);
  };

  const handleViewRevision = (rev: Revision & { id?: string }) => {
    setBudgetPreview(null);
    setViewingRevision(rev);
    setShowRevisions(false);
  };

  const handleCloseRevisionView = () => setViewingRevision(null);

  /** Switching or saving a rate card only changes what the live design
   *  prices against -- it never touches a project's already-saved
   *  revisions, each of which keeps the rateSnapshot it was saved with.
   *  Guarded the same as every other edit surface: the "Manage Rate Cards"
   *  button is already disabled while pricingLocked, this is defence in
   *  depth against changing rates while a different design is on screen. */
  const handleSelectRateCard = (card: RateCard & { id: string }) => {
    if (budgetPreview || viewingRevision || readOnlyLive) return;
    setRates(withRateDefaults(card.rates));
    setRateCardId(card.id);
    setRatesAreFrozen(false);
  };

  const handleRateCardSaved = (card: RateCard & { id: string }) => {
    setOrgRateCards((cards) => [card, ...cards]);
    if (budgetPreview || viewingRevision || readOnlyLive) return;
    setRates(withRateDefaults(card.rates));
    setRateCardId(card.id);
    setRatesAreFrozen(false);
  };

  /** The rules enforce a lock the moment it is written regardless of what
   *  this app's own state thinks -- this just keeps the UI from lagging
   *  behind by a full reopen when the just-locked revision is the one
   *  currently loaded live. */
  const handleRevisionLocked = (rev: number) => {
    if (rev === projectCurrentRevision) setLiveRevisionLocked(true);
  };

  /** Turns a read-only view into an editable draft: either a browsed older
   *  revision's inputs (loaded fresh, per DRAWINGS.md-style "one thing shown
   *  everywhere" -- here, one design being edited), or the currently-loaded
   *  locked revision, unlocked in place with no data change at all. Either
   *  way, the next Save creates a new revision -- never overwrites the one
   *  being copied from. */
  const handleCopyRevisionForward = () => {
    if (viewingRevision) {
      setCoreState(viewingRevision.input.core);
      setOverState(viewingRevision.input.over);
      setRates(withRateDefaults(viewingRevision.rateSnapshot));
      setRateCardId(viewingRevision.rateCardId);
      setPriceLocks(viewingRevision.input.priceLocks || {});
      // This is now a fresh, editable draft based on old values -- it should
      // price against the freshest item/supplier data available, not stay
      // pinned to whatever that old revision happened to resolve to.
      setRatesAreFrozen(false);
      setCopiedFromRev(viewingRevision.rev);
      setLiveRevisionLocked(false);
      setOverrideLock(false);
      resetDesignState();
    } else if (liveRevisionLocked) {
      setCopiedFromRev(projectCurrentRevision);
      setOverrideLock(true);
      setRatesAreFrozen(false);
    }
  };

  // Core-level enquiry edits (kva, hv, vector...) are direct inputs too --
  // track them the same way as a Class A row for the impact summary. Also
  // the point past which pricing should stop reproducing a frozen snapshot
  // and start resolving live again -- any edit means this is now a new
  // candidate revision, not just a view of the one that was opened.
  const handleCoreChange = (nextCore: Record<string, any>) => {
    const key = Object.keys(nextCore).find((k) => nextCore[k] !== core[k]);
    if (key) setLastAction({ kind: 'param', key });
    setCoreState(nextCore);
    setRatesAreFrozen(false);
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
    setRatesAreFrozen(false);
  };

  const requestPin = (targetId: string, value: number) => {
    const conflict = findConflictForPin(targetId, pins, over);
    if (conflict) {
      setPendingConflict({ kind: 'pin', targetId, value, conflict });
      return;
    }
    setLastAction({ kind: 'pin-set', targetId });
    setPins({ ...pins, [targetId]: { targetId, value } });
    setRatesAreFrozen(false);
  };

  const releasePin = (targetId: string) => {
    const releasedValue = pins[targetId]?.value;
    const next = { ...pins };
    delete next[targetId];
    if (releasedValue !== undefined) setLastAction({ kind: 'pin-release', targetId, releasedValue });
    setPins(next);
    setRatesAreFrozen(false);
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
      setRatesAreFrozen(false);
    }
    setPendingConflict(null);
  };

  const suppliersById = useMemo(
    () => new Map(orgSuppliers.map((s) => [s.id, { name: s.name }])),
    [orgSuppliers],
  );

  // documentRegister #12: item code and part number per BOM line, keyed the
  // same way resolveRates already keys a rate -- by rateKey. First item
  // wins if more than one shares a rateKey, an edge case rather than the
  // norm; the item master doesn't enforce one item per rate.
  const itemsByRateKey = useMemo(() => {
    const m = new Map<string, Item & { id: string }>();
    for (const it of orgItems) {
      if (it.rateKey && !m.has(it.rateKey)) m.set(it.rateKey, it);
    }
    return m;
  }, [orgItems]);

  // TASKS.md item 11.4: the price source hierarchy. When ratesAreFrozen (a
  // just-opened or just-viewed revision, untouched since), skip resolution
  // entirely and use the frozen rates verbatim -- src/lib/pricing.ts's own
  // header explains why the engine never sees any of this directly either
  // way, only ever a flat Record<string, number>.
  const { rates: effectiveRates, sources: rateSources } = useMemo(() => {
    if (ratesAreFrozen) return { rates, sources: frozenRateSources };
    return resolveRates(rates, orgItems, suppliersById, priceLocks, Date.now());
  }, [rates, orgItems, suppliersById, priceLocks, ratesAreFrozen, frozenRateSources]);

  // SOLVER.md step 3: solve every active pin against the design. Pins never
  // share a lever (conflict detection above guarantees that), but a pin can
  // still shift the design a different pin is evaluated against -- pinning
  // core diameter changes the window, which changes load loss. solveAllPins
  // re-solves in registration order until every pin's achieved value stops
  // moving, or gives up after 5 passes and says which pins are still
  // fighting rather than presenting an unsettled pass as final. Cheap --
  // computeDesign is not called here -- so this can stay live on every tick.
  const solved = useMemo(
    () => solveAllPins(pins, core, over, effectiveRates as any),
    // packages/engine is plain JS; TS infers DEFAULT_RATES's exact literal shape
    // from its default parameter, which is stricter than the editable Record<string,
    // number> this state actually needs to be. Cast at this one boundary rather
    // than propagating that accidental strictness through the app.
    [pins, core, over, effectiveRates],
  );

  // The last FULLY settled computeDesign -- fitEtkToCost's own K-plateau
  // search (CALIBRATION.md section 49) and resolveDiscreteNeighbourhood's
  // density resolution (section 51), several seconds together -- plus
  // exactly which inputs produced it. Comparing those inputs against
  // solved.effectiveOver/core/effectiveRates below is how the app knows
  // whether what is on screen has caught up or is still provisional.
  const [settled, setSettled] = useState<{
    result: any; core: any; over: Record<string, any>; rates: Record<string, number>;
  } | null>(null);
  const settleWorkerRef = useRef<Worker | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleWorkerRef.current?.terminate();
  }, []);

  // Debounced settle: 300ms of no further change to core/over/rates/pins,
  // same burst-quiet signal the Design Impact Summary already used before
  // this section, then the real computeDesign runs once, in a worker so a
  // multi-second solve can never freeze the tab (src/workers/designWorker.ts,
  // same pattern as the Fit to Budget search's own searchWorker.ts). A new
  // edit before that fires cancels the pending settle and restarts the
  // countdown -- only the design at rest ever reaches the worker.
  useEffect(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      settleWorkerRef.current?.terminate();
      const requestCore = core, requestOver = solved.effectiveOver, requestRates = effectiveRates as any;
      const worker = new Worker(new URL('./workers/designWorker.ts', import.meta.url), { type: 'module' });
      settleWorkerRef.current = worker;
      worker.onmessage = (e: MessageEvent) => {
        if (e.data?.type === 'done') {
          setSettled({ result: e.data.result, core: requestCore, over: requestOver, rates: requestRates });
        }
        worker.terminate();
        if (settleWorkerRef.current === worker) settleWorkerRef.current = null;
      };
      worker.onerror = () => {
        worker.terminate();
        if (settleWorkerRef.current === worker) settleWorkerRef.current = null;
      };
      worker.postMessage({ type: 'compute', core: requestCore, over: requestOver, rates: requestRates, extras: [] });
    }, 300);
    return () => { if (settleTimerRef.current) clearTimeout(settleTimerRef.current); };
  }, [core, solved.effectiveOver, effectiveRates]);

  // Fast path: freezes whichever structural choices (etK, and flux/density
  // together) the last SETTLED design already resolved, for any dimension
  // the user is not directly pinning right now -- so this computeDesign
  // call never re-enters the K-plateau search or the neighbourhood
  // resolution (both several seconds), only designTransformer/buildBOM on
  // whatever the user IS actively changing. Runs on every render, same as
  // `result` did before this section; only what it computes changed.
  const fastOver = useMemo(() => {
    if (!settled) return solved.effectiveOver;
    const freeze: Record<string, any> = {};
    if (solved.effectiveOver.etK === undefined) freeze.etK = settled.result.params.etK;
    if (solved.effectiveOver.flux === undefined) freeze.flux = settled.result.params.flux;
    if (solved.effectiveOver.deltaLV === undefined && solved.effectiveOver.deltaHV === undefined) {
      freeze.deltaLV = settled.result.params.deltaLV;
      freeze.deltaHV = settled.result.params.deltaHV;
    }
    return { ...solved.effectiveOver, ...freeze };
  }, [solved, settled]);

  const result = useMemo(
    () => computeDesign(core, fastOver, effectiveRates as any, []),
    [core, fastOver, effectiveRates],
  );
  const solveResults = solved.results, solveConverged = solved.converged, solveFighting = solved.fighting;

  // Provisional: the on-screen (fast) result is built from a structural
  // freeze taken from a settle that used different inputs than today's --
  // either none has completed yet, or an edit landed since the last one
  // did. Reference equality is enough: solved.effectiveOver/core/
  // effectiveRates only get a new identity when solveAllPins/resolveRates
  // actually recompute, the same assumption every useMemo above already
  // relies on.
  const isProvisional = !settled
    || settled.core !== core || settled.over !== solved.effectiveOver || settled.rates !== effectiveRates;
  // The authoritative result to use anywhere a number gets persisted or
  // compared against precisely (saving a revision, the Design Impact
  // Summary, a budget search's own "against the current design" baseline)
  // -- never the fast, possibly structurally-frozen one. Falls back to the
  // fast result only before the very first settle of a session has landed.
  const settledResult = settled?.result ?? result;

  // Read-only overlay for a browsed revision: recomputed only from that
  // revision's own frozen input/rateSnapshot, exactly as saveRevision froze
  // it -- never from the live core/over/rates, and never touching them.
  const viewedResult = useMemo(() => {
    if (!viewingRevision) return null;
    return computeDesign(
      viewingRevision.input.core, viewingRevision.input.over,
      viewingRevision.rateSnapshot as any, viewingRevision.input.extras || [],
    );
  }, [viewingRevision]);

  // A locked revision that is also the one currently loaded live: nothing to
  // fall back to display (it IS the live design), so this blocks editing in
  // place rather than swapping the display like the two overlays above.
  const readOnlyLive = liveRevisionLocked && !overrideLock;

  // CLAUDE.md invariant 3: while a budget option is previewed, every tab
  // renders it -- the plate, the costing tab, all of them -- from this one
  // place, never `result` in one spot and the candidate in another. The Fit
  // to Budget tab itself is the one exception: it always searches and
  // compares against `result` (the live design), never against whatever it
  // is currently previewing. Viewing a past revision takes precedence over a
  // budget preview -- selecting one clears the other, see onSelectPreview
  // and handleViewRevision.
  const activeDesign = viewingRevision ? viewedResult!.design : budgetPreview ? budgetPreview.d : result.design;
  const activeBom = viewingRevision ? viewedResult!.bom : budgetPreview ? budgetPreview.bom : result.bom;
  const activeParams = viewingRevision ? viewedResult!.params : budgetPreview ? budgetPreview.d.p : result.params;
  const activePreviewKey = budgetPreview ? candidateKey(budgetPreview) : null;
  // CALIBRATION.md, fitEtkToCost: a budget preview candidate comes from
  // searchDesigns, which builds with designTransformer/buildBOM directly
  // and never runs the etK cost search at all, so there is no non-
  // compliance concept to show for one -- the live design's own warning
  // (or the viewed revision's, frozen at save time) reappears once the
  // preview is discarded or adopted.
  const activeEtkWarning = viewingRevision ? viewedResult!.etkNonCompliant : budgetPreview ? false : result.etkNonCompliant;
  const activeEtkNote = viewingRevision ? viewedResult!.etkSearchNote : budgetPreview ? undefined : result.etkSearchNote;
  // CALIBRATION.md section 51: same reasoning as the etk warning above -- a
  // budget preview candidate comes from searchDesigns/designTransformer
  // directly, never through fitToSchedule, so there is no fit for a
  // neighbourhood search to have resolved; nothing to show while one is
  // previewed.
  const activeFitBoundary = viewingRevision ? !!viewedResult!.fitBoundaryFound : budgetPreview ? false : !!result.fitBoundaryFound;
  const activeFitNote = viewingRevision ? viewedResult!.fitResolutionNote : budgetPreview ? undefined : result.fitResolutionNote;
  // CALIBRATION.md section 73: the window-height solve's own discrete
  // resolution, reported the same way the loss fit's is above. Two levels:
  // windowNote whenever the neighbourhood search had to choose, and
  // windowStraddle only when the closest achievable impedance falls outside
  // the standard's own tolerance -- at which point the design cannot be
  // built to its declared figure and the user has to change something.
  const activeWindowNote = viewingRevision ? viewedResult!.design.windowNote : budgetPreview ? undefined : result.design.windowNote;
  const activeWindowStraddle = viewingRevision ? !!viewedResult!.design.windowStraddle : budgetPreview ? false : !!result.design.windowStraddle;

  const handleAdoptBudget = () => {
    if (!budgetPreview || readOnlyLive) return;
    const patch: Record<string, any> = {};
    for (const k of BUDGET_OVER_KEYS) patch[k] = budgetPreview.inputs[k];
    setOverState({ ...over, ...patch });
    resetDesignState();
    setRatesAreFrozen(false);
  };

  const handleDiscardBudget = () => setBudgetPreview(null);

  /** TASKS.md item 11.4, the top tier: lock this rate key's currently
   *  resolved value for this project only, or clear the lock to fall back
   *  through the rest of the hierarchy. Guarded the same as every other
   *  edit surface -- not reachable while a different design is on screen. */
  const handleTogglePriceLock = (rateKey: string) => {
    if (budgetPreview || viewingRevision || readOnlyLive) return;
    setPriceLocks((locks) => {
      if (rateKey in locks) {
        const { [rateKey]: _removed, ...rest } = locks;
        return rest;
      }
      return { ...locks, [rateKey]: effectiveRates[rateKey] };
    });
  };

  // SOLVER.md step 4: Design Impact Summary, shown after every change, for
  // the one decision just made -- not a diff of the whole design. impacts()
  // supplies the design-level consequences (weight, losses, efficiency,
  // compliance, money); buildSummary adds what only the app knows (what was
  // edited, which lever the solver moved and why, what else moved).
  //
  // Built off the SETTLED result, never the fast one -- a description of
  // "what moved" is only true once the K-plateau search and neighbourhood
  // density resolution have actually run for these inputs, not off a
  // structurally-frozen fast estimate. settled only ever updates once per
  // burst of edits (the settle debounce above already collapses a burst to
  // its final state before the worker ever runs), so comparing the
  // previous settle to the new one already captures "before this whole
  // burst -> after it," the same anchor semantics the old per-tick
  // debounce used to build by hand.
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

  const prevSettledRef = useRef<typeof settled>(null);

  useEffect(() => {
    if (settled && prevSettledRef.current && lastAction) {
      const built = buildSummary(prevSettledRef.current.result, settled.result, lastAction);
      if (built) setSummary(built);
    }
    if (settled) prevSettledRef.current = settled;
    setLastAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

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
          <div className="flex items-start gap-4">
            <div className="text-right font-mono text-[10px] text-ink2 leading-relaxed">
              <div>{standardName}</div>
              <div>All figures in Indian Rupees</div>
            </div>
            {/* Every saved project lives in Firestore now, not browser state --
                signing out and back in and reopening a project (TASKS.md item
                5's acceptance test) needs a real way to sign out. */}
            <div className="text-right font-mono text-[10px] text-ink2 leading-relaxed shrink-0">
              <div className="truncate max-w-[180px]">{user?.email}</div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowItems(true)}
                  className="font-display uppercase text-[9px] tracking-[0.14em] text-steel underline underline-offset-2"
                >
                  Items
                </button>
                <button
                  onClick={() => setShowSuppliers(true)}
                  className="font-display uppercase text-[9px] tracking-[0.14em] text-steel underline underline-offset-2"
                >
                  Suppliers
                </button>
                <button
                  onClick={logOut}
                  className="font-display uppercase text-[9px] tracking-[0.14em] text-steel underline underline-offset-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <RatingPlate design={activeDesign} bom={activeBom} params={activeParams} />

        {isProvisional && !viewingRevision && !budgetPreview && (
          <div className="bg-white border border-steel rounded-[2px] px-4 py-3 print:hidden">
            <div className="text-[11px] font-display uppercase tracking-[0.14em] text-steel mb-1">
              Provisional -- Settling
            </div>
            <p className="text-[11px] text-ink2">
              Tracking your edit live. The volts-per-turn search and winding neighbourhood resolution have not
              re-run for this change yet -- the figures on screen are a fast estimate, held at the design&apos;s
              last settled structural choices. They will update, and this notice will clear, a moment after you
              stop editing. Saving is disabled until then.
            </p>
          </div>
        )}

        {activeEtkWarning && (
          <div className="bg-white border border-amber rounded-[2px] px-4 py-3 print:hidden">
            <div className="text-[11px] font-display uppercase tracking-[0.14em] text-amber mb-1">
              No Volts-Per-Turn Setting Meets Every Declared Limit
            </div>
            <p className="text-[11px] text-ink2">{activeEtkNote}</p>
          </div>
        )}

        {activeFitBoundary && (
          <div className="bg-white border border-amber rounded-[2px] px-4 py-3 print:hidden">
            <div className="text-[11px] font-display uppercase tracking-[0.14em] text-amber mb-1">
              Winding Configuration Resolved By Neighbourhood Search
            </div>
            <p className="text-[11px] text-ink2">{activeFitNote}</p>
          </div>
        )}

        {activeWindowNote && (
          <div className="bg-white border border-amber rounded-[2px] px-4 py-3 print:hidden">
            <div className="text-[11px] font-display uppercase tracking-[0.14em] text-amber mb-1">
              {activeWindowStraddle
                ? "Declared Impedance Is Not Achievable"
                : "Window Height Resolved By Neighbourhood Search"}
            </div>
            <p className="text-[11px] text-ink2">{activeWindowNote}</p>
          </div>
        )}

        {budgetPreview && !viewingRevision && (
          <div className="bg-white border border-copper rounded-[2px] px-4 py-3 print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[11px] font-display uppercase tracking-[0.14em] text-copper mb-1">
                Previewing Budget Option
              </div>
              <p className="text-[11px] text-ink2">
                {inr(budgetPreview.price)} ex-works against the current {inr(settledResult.bom.exFactory)}. This design is
                shown everywhere -- the plate, every tab -- until you adopt or discard it. Editing is disabled
                until then.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="confirm" onClick={handleAdoptBudget}>Adopt</Button>
              <Button variant="secondary" onClick={handleDiscardBudget}>Discard</Button>
            </div>
          </div>
        )}

        {viewingRevision && (
          <div className="bg-white border border-copper rounded-[2px] px-4 py-3 print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[11px] font-display uppercase tracking-[0.14em] text-copper mb-1">
                Viewing Revision {viewingRevision.rev}{viewingRevision.locked ? ', Locked' : ''}
              </div>
              <p className="text-[11px] text-ink2">
                {inr(viewingRevision.summary.exWorks)} ex-works, saved {new Date(viewingRevision.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.
                This design is shown everywhere -- the plate, every tab -- until you copy it forward or return to
                the current design. Editing is disabled until then.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="confirm" onClick={handleCopyRevisionForward}>Copy to New Revision</Button>
              <Button variant="secondary" onClick={handleCloseRevisionView}>Back to Current</Button>
            </div>
          </div>
        )}

        {readOnlyLive && !viewingRevision && (
          <div className="bg-white border border-alert rounded-[2px] px-4 py-3 print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-[11px] font-display uppercase tracking-[0.14em] text-alert mb-1">
                This Revision Is Locked
              </div>
              <p className="text-[11px] text-ink2">
                Revision {projectCurrentRevision} went to the customer and cannot change. Editing is disabled --
                copy it forward to make any change, which saves as a new revision and leaves this one untouched.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="confirm" onClick={handleCopyRevisionForward}>Edit As New Revision</Button>
            </div>
          </div>
        )}

        <ProjectBar
          projectName={projectName} onProjectNameChange={setProjectName}
          onSave={handleSave} onSaveAsCopy={handleSaveAsCopy}
          onNew={() => setShowNewProjectModal(true)} onOpen={handleOpenProject}
          onOpenRevisions={() => setShowRevisions(true)}
          currentProjectId={currentProjectId} busy={savingProject} refreshKey={projectListVersion}
          previewActive={!!budgetPreview || !!viewingRevision || readOnlyLive}
          settling={isProvisional}
          uid={user?.uid || ''}
        />

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
          {/* Disabled whenever what's on screen isn't what core/over/pins
              describe -- a previewed budget option, a browsed revision, or a
              locked revision loaded live -- so editing it would be ambiguous
              about which design it applies to. */}
          <aside className={`print:hidden space-y-4 ${(budgetPreview || viewingRevision || readOnlyLive) ? 'opacity-50 pointer-events-none' : ''}`}>
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
              core={core} design={activeDesign} bom={activeBom} params={activeParams}
              liveDesign={settledResult.design} liveBom={settledResult.bom} liveParams={settledResult.params}
              liveOver={settled?.over ?? over}
              project={buildMeta(projectName)}
              orgId={orgId} projectId={currentProjectId} revision={projectCurrentRevision}
              rates={rates} onRatesChange={setRates} effectiveRates={effectiveRates}
              rateCard={orgRateCards.find((c) => c.id === rateCardId) || null}
              onManageRateCards={() => setShowRateCards(true)}
              pricingLocked={!!budgetPreview || !!viewingRevision || readOnlyLive}
              // TASKS.md item 11.4: a viewed revision shows the provenance it
              // was actually saved with, frozen alongside its rateSnapshot --
              // never re-resolved against current item/supplier data. A
              // budget preview is an engine-generated alternative, not a
              // priced BOM, so it carries no sources at all.
              rateSources={viewingRevision ? (viewingRevision.rateSources || {}) : budgetPreview ? {} : rateSources}
              priceLocks={viewingRevision ? (viewingRevision.input.priceLocks || {}) : priceLocks}
              onTogglePriceLock={handleTogglePriceLock}
              itemsByRateKey={itemsByRateKey}
              activePreviewKey={activePreviewKey}
              onSelectPreview={(candidate) => { setViewingRevision(null); setBudgetPreview(candidate); }}
              onCardExtraChange={(value) => handleOverChange({ ...over, cardExtra: value })}
            />
          </section>
        </main>
      </div>

      {showNewProjectModal && (
        <NewProjectModal onClose={() => setShowNewProjectModal(false)} onStart={handleNewProjectStart} />
      )}

      {showRevisions && currentProjectId && (
        <RevisionsModal
          orgId={orgId} projectId={currentProjectId} projectName={projectName}
          currentRevision={projectCurrentRevision} canEdit={canEdit}
          onClose={() => setShowRevisions(false)} onView={handleViewRevision}
          onLocked={handleRevisionLocked}
        />
      )}

      {showRateCards && (
        <RateCardManager
          orgId={orgId} uid={user?.uid || ''} liveRates={rates} currentRateCardId={rateCardId}
          onClose={() => setShowRateCards(false)}
          onSelect={(card) => { handleSelectRateCard(card); setShowRateCards(false); }}
          onSaved={(card) => { handleRateCardSaved(card); setShowRateCards(false); }}
        />
      )}

      {showSuppliers && (
        <SuppliersModal
          orgId={orgId} uid={user?.uid || ''} canEdit={canEdit}
          onClose={() => {
            setShowSuppliers(false);
            // Refreshes the org-wide supplier list this session already
            // loaded, so a name/rating edit inside the modal is reflected
            // the next time a price resolves against that supplier.
            listSuppliers(orgId).then(setOrgSuppliers).catch(() => {});
          }}
        />
      )}

      {showItems && (
        <ItemsModal
          orgId={orgId} uid={user?.uid || ''} canEdit={canEdit}
          onClose={() => {
            setShowItems(false);
            // Same reasoning as suppliers above -- an item or price record
            // added inside the modal should feed the next live resolution
            // without waiting for a full page reload.
            listItems(orgId).then(setOrgItems).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
