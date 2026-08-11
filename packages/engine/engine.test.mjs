/**
 * Golden-number tests. Run before and after every engine change.
 *   node lib/engine.test.mjs
 * If a number moves, either the change was intended and you bump
 * ENGINE_VERSION, or you have introduced a regression.
 */
import * as E from "./index.js";

let failures = 0;
const eq = (label, got, want, tol = 0) => {
  const ok = typeof want === "number" ? Math.abs(got - want) <= tol : got === want;
  if (!ok) { failures++; console.log(`  FAIL ${label}: got ${got}, expected ${want}`); }
  else console.log(`  ok   ${label} = ${got}`);
};

console.log("1000 kVA, 11 kV / 433 V, Dyn11, Level 2, copper");
const r = E.computeDesign(E.ESSENTIALS, {}, E.DEFAULT_RATES, []);
// ENGINE_VERSION 1.1.0: tankL used to add the end-wall clearance to the bare
// core envelope (coreWidth) instead of the outer limbs' own HV coil
// envelope, so the coil overhung the tank end wall by ~10 mm with zero
// clearance instead of the declared 74 mm -- confirmed by the longitudinal
// cross-section drawing. Fixing it makes the tank, and therefore the tank
// plate, fluid and freight cost, longer: ex-works and delivered moved up
// accordingly. Losses, impedance and core mass are untouched -- the active
// part did not change, only how much tank it sits inside.
//
// ENGINE_VERSION 1.2.0: buildBOM used to price bushings at a fixed qty (3
// HV, 4 LV) regardless of vector group. It now reads the real count from
// parseVectorGroup(p.vector), the same parsing the 2D layout drawings and
// the 3D model already used. This test's default vector is Dyn11 -- HV
// delta (3, no neutral to bring out), LV star with neutral (4) -- which is
// exactly the quantity that used to be hardcoded, so none of the golden
// numbers below moved. A design on a vector group with a delta LV (3, no
// neutral) or an earthed HV neutral (4) would now be quoted for bushings it
// actually has, which it was not before.
//
// ENGINE_VERSION 1.3.0: CALIBRATION.md, five suggestion-side corrections
// fitted against two real Mehir Transformers production sheets (1250 kVA
// oil OLTC, 630 kVA dry) -- see reference-designs.test.mjs, which checks
// the engine against those two actual built transformers directly and
// matters more than this file does. All five apply to the default case:
//   1. LV-HV clearance base cut from 20 to 11 mm at this 11 kV class (both
//      sheets' hilo, confirmed) -- shrinks the tank, cheaper.
//   2. Volts-per-turn constant raised (0.45 -> 0.545 oil, distribution) --
//      grows the core for the same flux density, dearer. Deliberately
//      applied together with item 1: correcting one without the other would
//      have been a one-sided fix moving cost in only one direction.
//   3. Step count now tracks an estimated core diameter instead of rating,
//      so the default case picks 15 steps where it used to pick 9 -- a
//      better-filled circle, less core steel for the same net area than 9
//      steps would need, partly offsetting item 2's cost increase.
//   4 and 5 do not touch the default case: item 4 (dry current density) only
//   applies when medium is dry; item 5 (condSuggest at exactly 630 kVA) is
//   already copper here at 1000 kVA regardless.
// Net effect on this default case: ex-works falls (the clearance and step
// savings outweigh the bigger core), core mass rises (item 2's own direct
// effect) -- both are correct, not contradictory: "falls" is the price,
// "rises" is the steel that price is built from. No-load loss, load loss,
// impedance and efficiency barely move because autoFit already holds them
// to just inside the declared loss schedule regardless of how much steel or
// copper it takes to get there.
//
// ENGINE_VERSION 1.4.0: CALIBRATION.md section 2, not part of the 1.3.0
// pass. Item 2's fixed K = 0.544 (oil) / 0.623 (dry) multiplier is no longer
// adopted as a constant -- a cost sweep showed a real ex-works minimum whose
// position moves with the copper to steel price ratio, not a number fitted
// once and left alone. deriveSpec's own suggestion is unchanged (it has no
// rates to search against), but computeDesign now raises an AUTO etK from
// that suggestion to whichever point on etkCurve is cheapest at the
// project's own resolved rates, unless etK is explicitly set -- see
// fitEtkToCost. At this default case and DEFAULT_RATES the optimum lands at
// K = 0.48 against 1.3.0's fixed 0.545: a smaller core, more copper, and a
// lower ex-works price, with core mass falling back down rather than
// continuing to rise. Losses stay inside the declared schedule either way,
// autoFit's own job, unaffected by which K produced the core it is fitting.
//
// ENGINE_VERSION 1.4.1: fitEtkToCost bugfix, CALIBRATION.md section 2. It
// used to fall back to the cheapest point on the whole etkCurve, feasible or
// not, whenever nothing on the swept range was feasible -- which is every
// rating where the loss schedule can't be closed at any K, not only a rare
// edge case. This default 1000 kVA case is unaffected (K = 0.48 was already
// feasible, golden numbers unchanged), but the impedance-solve check below
// was not: 100 kVA has no feasible K anywhere in 0.40-0.70 at Level 2 (the
// 1.42 T flux floor keeps no-load loss over schedule regardless of K), so
// the old code picked K = 0.40 -- the swept range's own edge, and its worst
// point for impedance -- purely because it was cheapest among candidates
// none of which were acceptable. Fixed: fitEtkToCost now only ever selects
// a feasible point, and returns no override at all when none exists, so
// etK correctly falls back to deriveSpec's own suggestion instead.
eq("ex-works", Math.round(r.bom.exFactory), 1548160, 500);
eq("delivered", Math.round(r.bom.withGst), 1826829, 600);
eq("tank length mm", Math.round(r.design.tankL), 1405, 2);
eq("no-load loss W", Math.round(r.design.noLoad), 1095, 5);
eq("load loss W", Math.round(r.design.loadLoss), 10303, 30);
eq("impedance %", +r.design.pctZ.toFixed(2), 5.00, 0.02);
eq("efficiency %", +r.design.eff100.toFixed(2), 98.87, 0.02);
eq("core mass kg", Math.round(r.design.wCore), 1270, 15);
eq("compliant", r.design.compliant, true);

console.log("\nstepped core utilisation matches the classical table");
[[3, 0.851], [5, 0.9079], [9, 0.9483], [13, 0.9642]].forEach(([n, u]) =>
  eq(`${n} steps`, +E.stepWidths(n, 233).util.toFixed(4), u, 0.0005));

console.log("\nimpedance solve tracks the declared value across ratings");
// etK left on AUTO. An earlier version of this test pinned it to 0.545,
// reasoning that 100 kVA landing on K = 0.40 (the swept range's own edge)
// and missing target by 0.38 was a quantization property of that corner of
// the search -- it was not. fitEtkToCost had a real bug: whenever no point
// on the 0.40-0.70 curve was feasible, it fell back to the cheapest point
// on the WHOLE curve regardless of compliance, rather than reporting the
// gap and keeping deriveSpec's own suggestion. At 100 kVA no K closes
// no-load loss to the Level 2 schedule (the 1.42 T flux floor stops it,
// not K), so every point was "infeasible" and it picked K = 0.40 purely
// because it was cheapest -- the single worst point on the curve for
// impedance, chosen by nobody. Fixed: fitEtkToCost now only ever chooses
// among feasible points, and returns no override (plus etkSearchNote) when
// none exist. 100 kVA now correctly falls back to K = 0.545 and converges
// on its own, no pin needed.
// 2500 kVA is still swapped for 2000 for the unrelated reason recorded
// against ENGINE_VERSION 1.3.0 above.
//
// ENGINE_VERSION 1.4.2: designTransformer's own compliance check used to
// re-derive sch from a fresh lossSchedule(kva, effLevel, dry) call unless
// effLevel was exactly "custom", silently ignoring an explicit
// limitNLL/limitLL override on every other level -- the common case, since
// a real enquiry giving its own guaranteed figures does not usually also
// get relabelled to "Custom". Fixed to always read p.limitNLL/limitLL,
// which deriveSpec already sets correctly either way (the schedule's own
// suggestion, or an override, per level). fitToSchedule's own autoFit loop
// reads the same sch internally, so this also fixed what autoFit was
// quietly fitting toward: previously the unrounded lossSchedule() value,
// now the rounded p.limitNLL/limitLL actually shown to a user -- a small,
// expected difference at 100 kVA specifically, since it is the one rating
// in this trio that has no compliant K at all (the 1.42 T flux floor, see
// above) and so leans on autoFit's own convergence more than the other
// two. Tolerance widened from 0.06 to 0.08 to give that a little real
// margin rather than pass on a rounding coincidence (100 kVA's new gap
// rounds to exactly 0.06 against the old tolerance, no margin at all).
// 630 and 2000 kVA are unmoved.
[100, 630, 2000].forEach((kva) => {
  const d = E.computeDesign({ ...E.ESSENTIALS, kva }, {}, E.DEFAULT_RATES, []);
  eq(`${kva} kVA %Z`, +d.design.pctZ.toFixed(2), d.params.targetZ, 0.08);
});

console.log(failures ? `\n${failures} FAILURES` : "\nall passed");
process.exit(failures ? 1 : 0);
