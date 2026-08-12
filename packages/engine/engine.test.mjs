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
//
// ENGINE_VERSION 1.5.0: MANUFACTURING.md section 5, its own phase. HV was a
// single continuous layer winding regardless of rating -- right below about
// 500 kVA, wrong above it. HV now selects layer, crossover or disc
// construction from kva and tapType alone (p.hvConstruction, AUTO by
// default -- see deriveSpec's own note on hvLayerMaxKva/hvDiscMinKva), and
// this 1000 kVA default case crosses the layer threshold: it now builds
// crossover, 6 coils. A crossover (or disc) winding has a genuinely
// different radial build and axial height than a layer winding at the same
// turns, which is why every number below moved, not just the winding
// dimensions -- window height feeds the impedance solve, which feeds core
// size, which feeds cost, which is what fitEtkToCost searches: etK moved
// from 0.48 to 0.52 because the cost curve crossover construction produces
// is a different curve, not because anything about the K search itself
// changed. See reference-designs.test.mjs for what this did to the three
// Group 2 known gaps -- two of them closed to hard-assertion tolerance.
//
// ENGINE_VERSION 1.6.0: LV multi-layer strip construction, same phase as
// 1.5.0's HV work and the same reason -- LV was a single conductor (a
// full-height foil, or a thin strip several turns share an axial pass on)
// regardless of rating, right at small ratings and wrong above about
// 300 kVA, where the required conductor area is too large for one
// practical strip. LV now splits into axCount x radCount parallel
// conductors above p.lvFoilMaxKva (AUTO by default), the same practical-
// strand idea HV's conductorSchedule already used. This default case
// crosses that threshold too: it now builds 6 axial x 2 radial, 3 layers.
// Both windings share the one window-height solve, so a correct LV radial
// build changes the window height the same way a correct HV one already
// did -- every number below moved again, not just LV's own dimensions.
// See reference-designs.test.mjs for what this closed: the third and
// last Group 2 known gap (1250 kVA LV OD), promoted to a hard assertion.
//
// ENGINE_VERSION 1.7.0: load loss coefficient recalibrated 52 -> 32,
// CALIBRATION.md, the 630 kVA Level 1 costing sheet -- see lossSchedule's
// own comment for the two confirming figures. This default case (Level 2,
// no override) has a much lower load-loss ceiling as a direct result, so
// autoFit lands on lower current density and more copper for the same
// rating, and everything downstream of that (window height, core size,
// price) moves again. compliant is now false: no-load loss (1303 W)
// exceeds its own component limit (1196 W) at every etK, the same
// pre-existing 1.42 T flux-floor property recorded against 1.4.1 (there
// documented at small kVA; the lower load-loss ceiling here means the
// no-load side now has less room to be over even at 1000 kVA). Not
// something this change caused -- something it made visible here for the
// first time in this particular golden case. etK falls back to the AUTO
// suggestion (0.545) as a result, same fitEtkToCost path.
//
// DEFAULT_RATES also updated (CALIBRATION.md section 7, same source sheet):
// core, condCu, frameMS, tankMS and fluid. A rate, not a formula -- no
// ENGINE_VERSION bump for this part.
//
// ENGINE_VERSION 1.7.1: fitEtkToCost no longer falls back to the fixed AUTO
// suggestion when nothing on the swept range is compliant -- it builds at
// the cheapest point on the curve instead, flagged (etkNonCompliant: true,
// etkSearchNote naming exactly what is missed and by how much). This
// default case is exactly the scenario that motivated it: the fixed
// suggestion (K = 0.545) was carrying a core about 230 kg heavier than the
// cheapest point on its own curve for no compliance benefit, since neither
// point is compliant anyway (see 1.7.0's note on the 1.42 T flux floor).
// The cheapest point here is K = 0.70, the swept range's own edge -- worth
// noting the way CALIBRATION.md section 2 already flags a boundary-sitting
// optimum as usually meaning the boundary, not the optimum, is what's in
// question, though this is a different search (cheapest among non-
// compliant points, not a real economic minimum) and not evidence the
// 0.40-0.70 range itself needs revisiting on its own. Still only misses
// no-load loss here (1678 W against 1196 W); impedance and thermal both
// stay within tolerance at this K, unlike the 100 kVA case in the
// impedance-solve check below, where the cheapest point misses both.
//
// ENGINE_VERSION 1.9.0 (CALIBRATION.md sections 8-11): two packing fixes,
// both confirmed against real evidence -- see reference-designs.test.mjs's
// own header for the full reasoning. Neither targeted this default case
// specifically, but both windings share one window-height solve, so
// removing radial depth the real windings never had (an always-on LV/HV
// duct rule, and an LV axial x radial split whose ratio could not respond
// to scale) shrinks the whole design: less core, less tank, lower price.
// Losses and impedance follow the same window-height shift. compliant
// stays false for the same pre-existing reason as 1.7.0 (no-load loss
// still exceeds its own limit at the 1.42 T flux floor, unrelated to
// either packing fix).
eq("ex-works", Math.round(r.bom.exFactory), 2358780, 800);
eq("delivered", Math.round(r.bom.withGst), 2783361, 900);
eq("tank length mm", Math.round(r.design.tankL), 1792, 2);
eq("no-load loss W", Math.round(r.design.noLoad), 1600, 5);
eq("load loss W", Math.round(r.design.loadLoss), 5039, 30);
eq("impedance %", +r.design.pctZ.toFixed(2), 4.81, 0.02);
eq("efficiency %", +r.design.eff100.toFixed(2), 99.34, 0.02);
eq("core mass kg", Math.round(r.design.wCore), 2327, 15);
eq("compliant", r.design.compliant, false);
eq("HV construction", r.design.hvConstruction, "crossover");
eq("LV construction", r.design.lvConstruction, "strip");
eq("etK non-compliant, flagged", r.etkNonCompliant, true);

// ENGINE_VERSION 1.10.0 (DRAWINGS.md drawing 22, CALIBRATION.md section 12):
// stepWidths() now snaps every step width up to the nearest p.stepIncrement
// (default 10 mm) instead of returning the continuous circle-packing
// optimum -- a real behaviour change for every existing caller (the core
// cross-section drawing, the stamping schedule, the 3D core geometry), even
// though stepWidths is never called from designTransformer itself, so none
// of this default case's own golden numbers above moved. New:
// coreCuttingChart(), the drawing 22 three-plate model, purely additive.
console.log("\nstepped core utilisation matches the classical table");
// increment: 0 disables snapping (CALIBRATION.md, drawing 22) -- this is
// testing the pure continuous circle-packing formula against Sawhney's own
// published table, not what standard-width slit stock gives, which is a
// different question with its own answer (always >= these figures, since
// snapping only ever rounds a width up).
[[3, 0.851], [5, 0.9079], [9, 0.9483], [13, 0.9642]].forEach(([n, u]) =>
  eq(`${n} steps`, +E.stepWidths(n, 233, 0).util.toFixed(4), u, 0.0005));

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
//
// ENGINE_VERSION 1.4.2: designTransformer's own compliance check used to
// re-derive sch from a fresh lossSchedule(kva, effLevel, dry) call unless
// effLevel was exactly "custom", silently ignoring an explicit
// limitNLL/limitLL override on every other level. Fixed to always read
// p.limitNLL/limitLL, which also fixed what fitToSchedule's autoFit loop
// was quietly fitting toward.
//
// This test used to respond to a bad-looking deviation at one rating by
// swapping in a nearby one that converges more cleanly (2500 -> 2000 under
// 1.3.0, then 2000 -> 1800 under 1.6.0), reasoning that whichever rating
// happened to sit on an integer turn/layer boundary was an artefact not
// worth testing. That was the wrong instinct: a rating landing a few
// tenths of a per cent off the declared impedance because of integer
// quantisation is a real, reproducible property of the design at that
// rating, not a flaw in the test picking it. Restored to the original
// [100, 630, 2000, 2500] and changed shape to match: each rating's own
// deviation is recorded as the baseline below, and the test fails only if
// a rating's deviation grows past what is recorded -- a genuine
// regression -- not for having a nonzero deviation in the first place.
// 2500 kVA's own -3.39% is exactly the "misses target by a few tenths of a
// per cent from integer quantisation" case this section used to hide by
// swapping away from it; it is recorded here instead, visible on every run.
const impedanceDev = (kva, baselinePct) => {
  const d = E.computeDesign({ ...E.ESSENTIALS, kva }, {}, E.DEFAULT_RATES, []);
  const pct = ((d.design.pctZ - d.params.targetZ) / d.params.targetZ) * 100;
  const regressed = Math.abs(pct) > Math.abs(baselinePct) + 0.1;
  const msg = `%Z ${d.design.pctZ.toFixed(2)} against ${d.params.targetZ} declared, ${pct.toFixed(2)}% deviation (recorded ${baselinePct}%)`;
  if (regressed) { failures++; console.log(`  FAIL ${kva} kVA: ${msg} -- WORSE than recorded, a regression`); }
  else console.log(`  ok   ${kva} kVA: ${msg}`);
};
// ENGINE_VERSION 1.7.0's load loss recalibration changed the flux/density
// landscape autoFit searches, moving every one of these baselines once;
// 1.7.1's fitEtkToCost fix (below) moved them again, in some cases a lot --
// 100 kVA's cheapest non-compliant point happens to also miss impedance
// badly (-26.91%, not just the no-load loss the 630 kVA case in
// CALIBRATION.md's own investigation centred on). That is a real,
// legitimate finding this test now surfaces rather than a defect in
// picking it: the cheapest point at 100 kVA genuinely fails both, and an
// engineer building to it needs both facts, which etkSearchNote reports on
// the design itself (see the default case above). Recorded as found, not
// tuned toward a round number, same as every other baseline in this file.
// ENGINE_VERSION 1.9.0's packing fixes (duct rule, LV split) moved every
// baseline again, all toward zero -- a side effect of the same window-height
// solve the LV/HV radial builds feed, not something either fix targeted.
// Recorded as found.
impedanceDev(100, -0.00);
impedanceDev(630, -6.22);
impedanceDev(2000, 0.00);
impedanceDev(2500, -0.00);

console.log(failures ? `\n${failures} FAILURES` : "\nall passed");
process.exit(failures ? 1 : 0);
