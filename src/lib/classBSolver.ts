/**
 * SOLVER.md section 6, step 3: the Class B solver.
 *
 * One generic bisection function serves every row in section 1's Class B
 * table -- it knows nothing about transformers, only "target, bounds,
 * evaluator". Per-target knowledge (which lever, its valid range, how to
 * apply a candidate lever value, which output to read back) lives in
 * LEVER_ADAPTERS below, keyed by the same target ids as pinRegistry.ts.
 *
 * Section 5 says the full forward calculation is the only thing that
 * regenerates dependent values, so the evaluator for every adapter is
 * computeDesign() itself, not a cheaper partial calculation -- that is also
 * what makes step 4's "revalidate compliance" trivial: the design a
 * successful solve returns already went through the whole pipeline.
 */
import { computeDesign, deriveSpec, CORE_GRADES, CONDUCTORS } from '@/packages/engine';
import { CLASS_B_TARGETS, type ClassBTarget } from './pinRegistry';

const ITERATIONS = 44;

export interface BisectSuccess {
  reachable: true;
  leverValue: number;
  achieved: number;
}

export interface BisectFailure {
  reachable: false;
  lo: { leverValue: number; achieved: number };
  hi: { leverValue: number; achieved: number };
  closest: { leverValue: number; achieved: number };
}

export type BisectResult = BisectSuccess | BisectFailure;

/**
 * Generic bisection: find a lever value in [lo, hi] whose evaluate() output
 * hits `target`. Verifies monotonicity by evaluating both bounds first --
 * SOLVER.md section 3 is explicit that an out-of-range target must be
 * reported, never silently clamped to whichever bound is closer.
 */
export function bisectToTarget(target: number, lo: number, hi: number, evaluate: (leverValue: number) => number): BisectResult {
  const atLo = evaluate(lo);
  const atHi = evaluate(hi);
  const increasing = atHi >= atLo;
  const reachableLo = Math.min(atLo, atHi);
  const reachableHi = Math.max(atLo, atHi);

  if (target < reachableLo || target > reachableHi) {
    const closerToLo = Math.abs(target - atLo) <= Math.abs(target - atHi);
    return {
      reachable: false,
      lo: { leverValue: lo, achieved: atLo },
      hi: { leverValue: hi, achieved: atHi },
      closest: closerToLo ? { leverValue: lo, achieved: atLo } : { leverValue: hi, achieved: atHi },
    };
  }

  let a = lo, b = hi, fa = atLo;
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (a + b) / 2;
    const fm = evaluate(mid);
    const midIsHigh = increasing ? fm > target : fm < target;
    if (midIsHigh) { b = mid; } else { a = mid; fa = fm; }
  }
  const leverValue = (a + b) / 2;
  return { reachable: true, leverValue, achieved: evaluate(leverValue) };
}

interface EvalCtx {
  core: any;
  over: Record<string, any>;
  rates: any;
  spec: { S: any; SUG: any; RNG: any };
}

interface LeverAdapter {
  leverLabel: string;
  leverUnit: string;
  targetUnit: string;
  /** Physical/valid range for the lever's bisection variable. */
  range: (ctx: EvalCtx) => [number, number];
  /** Turn a candidate lever value into an `over` patch to merge before computeDesign(). */
  applyOver: (leverValue: number, ctx: EvalCtx) => Record<string, any>;
  /** Read the achieved metric back off a computeDesign() result. */
  extract: (result: { design: any; bom: any; params: any }) => number;
  /** Short description of what's being varied, for the unreachable message. */
  context: (ctx: EvalCtx) => string;
  /** What to change instead, depending on which bound was hit. */
  suggestion: (hitLowBound: boolean) => string;
  /** true if solvable here, or a reason string if not (e.g. dry-type has no fin area). */
  applicable: (ctx: EvalCtx) => true | string;
  /**
   * If this target's lever is tied to a discrete catalog (core grade,
   * conductor material), search it for the first option that actually
   * reaches the target, instead of a generic "try something else" hint.
   */
  findAlternative?: (targetValue: number, wantLower: boolean, ctx: EvalCtx, pinnedEtK: number) => { name: string; achieved: number } | null;
}

const fluxFloor = (coreGrade: string) => (coreGrade === 'amor' ? 1.20 : 1.42); // SOLVER.md section 3

interface CatalogEntry { key: string; name: string; lossMetric: number; }

/**
 * Search a discrete catalog (core grades, conductor materials) for the first
 * entry that reaches `targetValue`, trying the immediate lower/higher-loss
 * neighbour of the current selection first and working outward. Re-derives
 * the spec fresh per candidate, since swapping material changes the AUTO
 * baseline the lever's own range and starting point are computed from.
 */
function searchCatalog(
  entries: CatalogEntry[],
  currentKey: string,
  wantLower: boolean,
  buildOver: (candidateKey: string) => Record<string, any>,
  targetValue: number,
  adapter: LeverAdapter,
  core: any, baseOver: Record<string, any>, rates: any,
  pinnedEtK: number,
): { name: string; achieved: number } | null {
  const sorted = [...entries].sort((a, b) => a.lossMetric - b.lossMetric);
  const idx = sorted.findIndex((e) => e.key === currentKey);
  if (idx === -1) return null;
  const sequence = wantLower ? sorted.slice(0, idx).reverse() : sorted.slice(idx + 1);

  for (const cand of sequence) {
    // etK held at the same value solvePin() already pinned for the whole
    // solve -- same reasoning, not re-discovered per candidate material
    // (which would be up to 4-5 more full K searches on top of the one
    // already avoided).
    const candOver = { ...baseOver, ...buildOver(cand.key), etK: pinnedEtK };
    const candSpec = deriveSpec(core, candOver);
    const candCtx: EvalCtx = { core, over: candOver, rates, spec: candSpec };
    const [lo, hi] = adapter.range(candCtx);
    const evaluate = (v: number) => {
      const patch = adapter.applyOver(v, candCtx);
      return adapter.extract(computeDesign(core, { ...candOver, ...patch }, rates, []));
    };
    const result = bisectToTarget(targetValue, lo, hi, evaluate);
    if (result.reachable) return { name: cand.name, achieved: result.achieved };
  }
  return null;
}

const LEVER_ADAPTERS: Record<string, LeverAdapter> = {
  noLoadLoss: {
    leverLabel: 'Flux Density', leverUnit: 'T', targetUnit: 'W',
    range: ({ spec }) => [fluxFloor(spec.S.coreGrade), CORE_GRADES[spec.S.coreGrade].bMax],
    applyOver: (v) => ({ flux: Math.round(v * 100) / 100 }),
    extract: (r) => r.design.noLoad,
    context: ({ spec }) => CORE_GRADES[spec.S.coreGrade].name,
    suggestion: (hitLow) => (hitLow ? 'a lower-loss core grade' : 'a higher-loss, cheaper core grade'),
    applicable: () => true,
    findAlternative: (targetValue, wantLower, ctx, pinnedEtK) => searchCatalog(
      Object.entries(CORE_GRADES).map(([key, g]: [string, any]) => ({ key, name: g.name, lossMetric: g.wRef })),
      ctx.spec.S.coreGrade, wantLower,
      (key) => ({ coreGrade: key }),
      targetValue, LEVER_ADAPTERS.noLoadLoss, ctx.core, ctx.over, ctx.rates, pinnedEtK,
    ),
  },
  loadLoss: {
    leverLabel: 'Current Density, Both Windings', leverUnit: '×', targetUnit: 'W',
    range: () => [0.6, 1.35], // matches deriveSpec's own rng() bounds for density fields
    applyOver: (scale, { spec }) => ({
      deltaLV: Math.round(spec.SUG.deltaLV * scale * 100) / 100,
      deltaHV: Math.round(spec.SUG.deltaHV * scale * 100) / 100,
    }),
    extract: (r) => r.design.loadLoss,
    context: ({ spec }) => CONDUCTORS[spec.S.condLV].name,
    suggestion: () => 'a different conductor material',
    applicable: () => true,
    findAlternative: (targetValue, wantLower, ctx, pinnedEtK) => searchCatalog(
      Object.entries(CONDUCTORS).map(([key, c]: [string, any]) => ({ key, name: c.name, lossMetric: c.rho20 })),
      ctx.spec.S.condLV, wantLower,
      (key) => ({ condLV: key, condHV: key }),
      targetValue, LEVER_ADAPTERS.loadLoss, ctx.core, ctx.over, ctx.rates, pinnedEtK,
    ),
  },
  coreDiameter: {
    leverLabel: 'Volts-Per-Turn Constant (K)', leverUnit: '', targetUnit: 'mm',
    range: ({ spec }) => spec.RNG.etK,
    applyOver: (v) => ({ etK: Math.round(v * 1000) / 1000 }),
    extract: (r) => r.design.dCore,
    context: () => 'the volts-per-turn constant',
    suggestion: () => 'the flux density',
    applicable: () => true,
  },
  lvTurns: {
    leverLabel: 'Volts-Per-Turn Constant (K)', leverUnit: '', targetUnit: 'turns',
    range: ({ spec }) => spec.RNG.etK,
    applyOver: (v) => ({ etK: Math.round(v * 1000) / 1000 }),
    extract: (r) => r.design.nLV,
    context: () => 'the volts-per-turn constant',
    suggestion: () => 'the flux density',
    applicable: () => true,
  },
  conductorSize: {
    leverLabel: 'Current Density', leverUnit: '×', targetUnit: 'mm²',
    range: () => [0.6, 1.35],
    applyOver: (scale, { spec }) => ({
      deltaLV: Math.round(spec.SUG.deltaLV * scale * 100) / 100,
      deltaHV: Math.round(spec.SUG.deltaHV * scale * 100) / 100,
    }),
    // Scoping call: the registry collapses HV/LV conductor size into one target
    // sharing the currentDensity lever (SOLVER.md's own table has one generic
    // "conductor size" row). This resolves it to the LV conductor -- documented
    // here since the spec doesn't disambiguate.
    extract: (r) => r.design.aLVreq,
    context: ({ spec }) => CONDUCTORS[spec.S.condLV].name,
    // No findAlternative here: the axis that would need to change is the
    // conductor's dMax (how much current density it can safely carry), not
    // its resistivity/loss -- a different ordering than loadLoss's catalog
    // search, and getting it wrong would suggest a materially incorrect fix.
    // Left as a named-material hint rather than guessing at the wrong axis.
    suggestion: () => 'a conductor material with a different maximum current density',
    applicable: () => true,
  },
  finArea: {
    leverLabel: 'Top-Oil Rise Target', leverUnit: 'K', targetUnit: 'm²',
    range: ({ spec }) => spec.RNG.oilRiseTarget,
    applyOver: (v) => ({ oilRiseTarget: Math.round(v * 10) / 10 }),
    extract: (r) => r.design.finAreaReq,
    context: () => 'the top-oil rise target',
    suggestion: (hitLow) => (hitLow ? 'a larger tank, or forced cooling' : 'accepting a higher temperature rise'),
    applicable: ({ spec }) => (spec.S.medium === 'dry' ? 'Not applicable: dry-type construction has no fin or radiator area' : true),
  },
};

export interface PinSolveResult {
  targetId: string;
  target: number;
  reachable: boolean;
  leverValue?: number;
  achieved?: number;
  overPatch?: Record<string, any>;
  compliant?: boolean;
  failedChecks?: string[];
  message: string;
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Solve one pinned Class B target against the given core/over/rates. Does
 * not mutate anything -- returns the lever patch to merge into `over` if
 * reachable, plus a report either way. SOLVER.md section 3 step 4: even a
 * reachable target is reported as a failure if the resulting design fails
 * compliance elsewhere (temperature rise, loss schedule, etc).
 */
export function solvePin(target: ClassBTarget | string, targetValue: number, core: any, over: Record<string, any>, rates: any): PinSolveResult {
  const t = typeof target === 'string' ? CLASS_B_TARGETS.find((x) => x.id === target) : target;
  const targetId = t!.id;
  const adapter = LEVER_ADAPTERS[targetId];
  const spec = deriveSpec(core, over);
  const ctx: EvalCtx = { core, over, rates, spec };

  const applicable = adapter.applicable(ctx);
  if (applicable !== true) {
    return { targetId, target: targetValue, reachable: false, message: applicable };
  }

  // SOLVER.md section 3: a Class B solve moves exactly one lever to hit
  // one target. etK is not that lever -- computeDesign's own K search
  // (packages/engine CALIBRATION.md section 39) re-optimises it by
  // default whenever it is not pinned, which inside a 44-step bisection
  // is both wrong and slow. Wrong: the bisection stops isolating the
  // lever's own effect on the target, since K can jump between steps and
  // move the design through a second, uncontrolled channel -- the
  // "monotonic in the lever" assumption bisection depends on is no longer
  // guaranteed. Slow: measured directly, ~92s for one solve (44 x the K
  // search's own ~1.5-1.7s), ~15 min worst case for solveAllPins with two
  // pins across its own convergence passes.
  //
  // Fixed by holding etK at whatever the design already resolves to --
  // one computeDesign() call, not 44 -- for the entire solve, bisection
  // and final result alike. Not re-optimised at the end either: doing so
  // would change the design's geometry again and could move the achieved
  // value away from the target this solve just found, making a
  // "reachable" result untrue by the time it is reported. If the design
  // office wants K re-optimised for cost, that is Fit to Budget's own job
  // (an explicit action), not a silent side effect of pinning a loss
  // figure.
  const pinnedEtK = over.etK !== undefined ? over.etK : computeDesign(core, over, rates, []).params.etK;
  const pinnedOver = { ...over, etK: pinnedEtK };

  const [lo, hi] = adapter.range(ctx);
  const evaluate = (leverValue: number) => {
    const patch = adapter.applyOver(leverValue, ctx);
    const result = computeDesign(core, { ...pinnedOver, ...patch }, rates, []);
    return adapter.extract(result);
  };

  const bisected = bisectToTarget(targetValue, lo, hi, evaluate);

  if (bisected.reachable === false) {
    const hitLow = Math.abs(bisected.closest.leverValue - lo) < Math.abs(bisected.closest.leverValue - hi);
    const alt = adapter.findAlternative?.(targetValue, hitLow, ctx, pinnedEtK) ?? null;
    const tail = adapter.findAlternative
      ? (alt
        ? `${alt.name} would reach ${fmt(targetValue)} ${adapter.targetUnit}.`
        : `No option in the catalog reaches ${fmt(targetValue)} ${adapter.targetUnit} either.`)
      : `Change ${adapter.suggestion(hitLow)} to go further.`;
    const message = `${t!.label} of ${fmt(targetValue)} ${adapter.targetUnit} is not reachable with ${adapter.context(ctx)} `
      + `between ${fmt(lo)} and ${fmt(hi)} ${adapter.leverUnit}. The closest is ${fmt(bisected.closest.achieved)} ${adapter.targetUnit} `
      + `at ${fmt(bisected.closest.leverValue)} ${adapter.leverUnit}. ${tail}`;
    return { targetId, target: targetValue, reachable: false, message };
  }

  // etK is carried in the returned patch too, not just used internally --
  // otherwise the persisted design would revert to AUTO K the moment this
  // patch is applied, paying the K search's own cost again on the very
  // next render and, worse, silently re-optimising K away from the design
  // this solve just reported as reaching its target. A design office that
  // wants K re-optimised for cost after solving a loss target runs Fit to
  // Budget for that, deliberately -- it is not an implicit side effect of
  // pinning a different figure.
  const overPatch = { ...adapter.applyOver(bisected.leverValue, ctx), etK: pinnedEtK };
  const finalResult = computeDesign(core, { ...over, ...overPatch }, rates, []);
  const compliant = finalResult.design.compliant as boolean;
  const failedChecks = Object.entries(finalResult.design.compliance)
    .filter(([, c]: [string, any]) => !c.ok)
    .map(([k]) => k);

  const message = compliant
    ? `${t!.label} set to ${fmt(bisected.achieved)} ${adapter.targetUnit} by moving ${adapter.leverLabel.toLowerCase()} to ${fmt(bisected.leverValue)} ${adapter.leverUnit} (K held at ${fmt(pinnedEtK)}, the design's own current value).`
    : `${t!.label} reached ${fmt(bisected.achieved)} ${adapter.targetUnit} by moving ${adapter.leverLabel.toLowerCase()} to ${fmt(bisected.leverValue)} ${adapter.leverUnit}, `
      + `but the design now fails compliance on: ${failedChecks.join(', ')}. This solve is not usable as-is.`;

  return {
    targetId, target: targetValue, reachable: true,
    leverValue: bisected.leverValue, achieved: bisected.achieved,
    overPatch, compliant, failedChecks, message,
  };
}

export interface SolveAllResult {
  effectiveOver: Record<string, any>;
  results: Record<string, PinSolveResult>;
  converged: boolean;
  /** targetIds still moving when the pass budget ran out -- these are the
   *  ones fighting each other through the geometry, not necessarily every
   *  active pin. */
  fighting: string[];
}

const MAX_PASSES = 5;

function withinTolerance(a: number, b: number) {
  return Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.005);
}

/**
 * SOLVER.md section 3 with more than one pin active: two pins that do not
 * share a lever can still fight through the design's geometry -- pinning
 * core diameter changes the window, which changes load loss. Re-solve every
 * pin in registration order, each against the design the others' latest
 * solved lever values produce, until every pin's achieved value stops
 * moving (converged) or MAX_PASSES passes have run. If it does not
 * converge, `fighting` names the pins still drifting on the final pass --
 * the last pass is not presented as if it were settled.
 */
export function solveAllPins(pins: Record<string, { targetId: string; value: number }>, core: any, baseOver: Record<string, any>, rates: any): SolveAllResult {
  const pinList = Object.values(pins);
  const results: Record<string, PinSolveResult> = {};
  if (pinList.length === 0) {
    return { effectiveOver: { ...baseOver }, results, converged: true, fighting: [] };
  }

  let converged = false;
  let movedThisPass = new Set<string>();

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    movedThisPass = new Set<string>();
    for (const pin of pinList) {
      // Solve against a context that already includes every OTHER pin's
      // latest solved lever value, so cross-lever coupling is visible.
      let contextOver = { ...baseOver };
      for (const other of pinList) {
        if (other.targetId === pin.targetId) continue;
        const r = results[other.targetId];
        if (r?.reachable && r.overPatch) contextOver = { ...contextOver, ...r.overPatch };
      }

      const prev = results[pin.targetId];
      const next = solvePin(pin.targetId, pin.value, core, contextOver, rates);
      results[pin.targetId] = next;

      const stable = prev !== undefined
        && prev.reachable === next.reachable
        && (!next.reachable || (prev.achieved !== undefined && next.achieved !== undefined && withinTolerance(prev.achieved, next.achieved)));
      if (!stable) movedThisPass.add(pin.targetId);
    }
    if (movedThisPass.size === 0) { converged = true; break; }
  }

  let effectiveOver = { ...baseOver };
  for (const pin of pinList) {
    const r = results[pin.targetId];
    if (r?.reachable && r.overPatch) effectiveOver = { ...effectiveOver, ...r.overPatch };
  }

  return { effectiveOver, results, converged, fighting: converged ? [] : [...movedThisPass] };
}
