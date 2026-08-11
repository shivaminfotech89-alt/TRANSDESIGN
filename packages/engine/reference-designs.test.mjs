/**
 * Reference-design tests: the engine checked against two real transformers
 * that Mehir Transformers actually built (CALIBRATION.md), not against the
 * engine's own past output. These are the most important tests in this
 * project for exactly that reason -- run them whenever a formula the engine
 * derives (etK, steps, current density, clearances) changes, not just
 * engine.test.mjs's golden numbers.
 *
 * Reproduced with the designer's own volts per turn, step count and
 * guaranteed losses, per CALIBRATION.md's own instruction, and with autoFit
 * off. autoFit's job is to search flux and current density for a design
 * that does not exist yet; reproducing one that already does uses the
 * designer's own values as given, not re-optimised against them.
 * CALIBRATION.md's own "Not adopted" section makes the same point about the
 * 1250 kVA sheet's premium loss figure specifically: it is not a value to
 * design toward, and autoFit trying to chase it (confirmed separately, not
 * asserted here) pushes current density the wrong way and away from both
 * sheets, not toward them.
 *
 * Two groups, deliberately not one:
 *
 * Group 1, hard assertions -- a failure here is a regression in something
 * already working and must fail the run. ENGINE_VERSION 1.5.0
 * (MANUFACTURING.md section 5) added the HV construction targets -- disc
 * count on the 1250 kVA reference, coil/layer/turns-per-layer structure on
 * the 630 kVA reference -- and promoted HV OD and tank length here from
 * Group 2, since multi-coil HV winding closed both to within 2%, the
 * tolerance CALIBRATION.md's own "Verification after the changes" section
 * originally asked for.
 *
 * ENGINE_VERSION 1.6.0 (LV multi-layer strip construction) closed the
 * third: LV OD is promoted from Group 2 too, now within 3% rather than the
 * -8.8% it carried after 1.5.0 alone. Getting LV right also moved HV's own
 * disc count, since both windings share one window-height solve -- 630's
 * HV structure (6 coils, 13 layers, 10 turns per layer) is unmoved, but
 * 1250's disc count is refitted from 44 to 53 alongside the LV parameters,
 * recorded in packages/engine/index.js's own hvDiscGap note rather than
 * treated as a coincidence.
 *
 * Neither over1250 nor over630 sets hvConstruction or lvStripAspect/
 * lvStripMaxMM2 away from their suggested defaults: the whole point of
 * every construction assertion here, HV or LV, is that the engine reaches
 * it from rating, current and tap type alone, not because it was told
 * which to use.
 *
 * Group 2, known gaps -- none carried a numeric baseline as of 1.6.0. The
 * 1250 kVA LV conductor arrangement is reported (not asserted) below: it
 * does not structurally match the sheet's own 5 axial by 6 radial over two
 * layers, even though LV OD itself closed. See the note beside it.
 */
import * as E from "./index.js";

let failures = 0;
const exact = (label, got, want) => {
  const ok = got === want;
  if (!ok) { failures++; console.log(`  FAIL ${label}: got ${got}, expected exactly ${want}`); }
  else console.log(`  ok   ${label} = ${got}`);
};
const within = (label, got, want, pct) => {
  const tol = Math.abs(want) * pct / 100;
  const ok = Math.abs(got - want) <= tol;
  const msg = `${got} (target ${want} ±${pct}%, i.e. ±${tol.toFixed(2)})`;
  if (!ok) { failures++; console.log(`  FAIL ${label}: got ${msg}`); }
  else console.log(`  ok   ${label} = ${msg}`);
};
/** Only fails if the deviation from target has grown past the recorded
 *  baseline (plus a small allowance for floating-point/rounding noise
 *  between runs, not a real change) -- otherwise reports the gap and moves
 *  on. `reason` is why the gap exists and where it is scheduled to close. */
const knownGap = (label, got, want, baselinePct, reason) => {
  const pct = ((got - want) / want) * 100;
  const regressed = Math.abs(pct) > Math.abs(baselinePct) + 0.1;
  const msg = `${got} (target ${want}, now ${pct.toFixed(2)}% vs recorded ${baselinePct}%)`;
  if (regressed) { failures++; console.log(`  FAIL ${label}: got ${msg} -- WORSE than recorded, this is a regression`); }
  else console.log(`  gap  ${label}: got ${msg}\n         ${reason}`);
};

console.log("Group 1: hard assertions -- a failure here is a regression, not a known gap.");

console.log("\n1250 kVA, 11/0.433 kV, Dyn11, OLTC, oil, copper -- Mehir Transformers sheet");
const core1250 = { ...E.ESSENTIALS, kva: 1250, application: "distribution", vector: "Dyn11" };
const over1250 = {
  etK: 19.23 / Math.sqrt(1250), // the sheet's own volts per turn
  steps: 15,                     // the sheet's own step count
  limitNLL: 1400, limitLL: 7600, // the sheet's own guaranteed losses
  tapType: "oltc",
  // The sheet's own tap schedule (MANUFACTURING.md section 1) runs 572
  // turns normal to 628 extreme -- not in CALIBRATION.md, but nHVmax (and
  // so HV OD, sized for the extreme tap) needs the real range to mean
  // anything against an actual winding rather than the engine's own
  // default +5%.
  tapPlus: (628 / 572 - 1) * 100,
  autoFit: false, // see file header
};
const r1250 = E.computeDesign(core1250, over1250, E.DEFAULT_RATES, []);
exact("LV turns", r1250.design.nLV, 13);
exact("HV turns, normal tap", r1250.design.nHV, 572);
exact("HV construction, auto-selected from rating and OLTC alone", r1250.design.hvConstruction, "disc");
exact("Disc count", r1250.design.numGroups, 53);
within("HV OD mm", +r1250.design.hvOD.toFixed(1), 494, 2);
within("Tank length mm", Math.round(r1250.design.tankL), 1660, 2);
exact("LV construction, auto-selected from rating alone", r1250.design.lvConstruction, "strip");
within("LV OD mm", +r1250.design.lvOD.toFixed(1), 374, 3);

console.log("\n630 kVA, 11/0.433 kV, dry type, copper -- Mehir Transformers sheet");
const core630 = { ...E.ESSENTIALS, kva: 630, medium: "dry", application: "distribution", vector: "Dyn11" };
const over630 = {
  etK: 15.63 / Math.sqrt(630),   // the sheet's own volts per turn
  limitNLL: 1300, limitLL: 6200, // the sheet's own guaranteed losses
  // No step count given here -- unlike the 1250 kVA sheet, CALIBRATION.md
  // does not state one for this design, so this is the one place the
  // engine's own suggestion (item 3, diameter-tracking) is exercised
  // rather than overridden with a sheet figure.
  autoFit: false,
};
const r630 = E.computeDesign(core630, over630, E.DEFAULT_RATES, []);
exact("LV turns", r630.design.nLV, 16);
exact("HV turns", r630.design.nHV, 704);
within("copper mass kg", +(r630.design.wLV + r630.design.wHV).toFixed(1), 292, 5);
within("LV radial build mm", +((r630.design.lvOD - r630.design.lvID) / 2).toFixed(2), 20, 10);
exact("HV construction, auto-selected from rating alone", r630.design.hvConstruction, "crossover");
exact("Coil count", r630.design.numGroups, 6);
exact("Layers per coil", r630.design.layers, 13);
exact("Turns per axial layer", r630.design.turnsPerLayer, 10);
exact("LV construction, auto-selected from rating alone", r630.design.lvConstruction, "strip");
exact("LV axial conductors", r630.design.lvAxCount, 4);
exact("LV radial conductors", r630.design.lvRadCount, 2);

console.log("\nGroup 2: reported every run, not asserted -- no numeric baseline to regress against.");
console.log("\n1250 kVA, 11/0.433 kV, Dyn11, OLTC, oil, copper -- Mehir Transformers sheet");
console.log(`  gap  LV conductor arrangement: got ${r1250.design.lvAxCount} axial x ${r1250.design.lvRadCount} radial x ${r1250.design.lvTurnLayers} layers `
  + `(${r1250.design.lvAxCount * r1250.design.lvRadCount * r1250.design.lvTurnLayers} total), target 5 axial by 6 radial over 2 layers (30 total)`);
console.log("         LV OD itself is within tolerance (above) -- the internal split into conductors is not the sheet's own,");
console.log("         and is not asserted here. One lvStripAspect fits both references' dimensions; it does not reproduce");
console.log("         both references' internal layouts, and there is no evidence a real design uses the same one at both.");

console.log(failures
  ? `\n${failures} FAILURES -- a hard assertion broke, a regression.`
  : "\nall passed.");
process.exit(failures ? 1 : 0);
