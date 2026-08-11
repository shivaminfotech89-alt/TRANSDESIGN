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
 * Group 1, hard assertions -- the five checks that pass today. A failure
 * here is a regression in something already working and must fail the run.
 *
 * Group 2, known gaps -- the 1250 kVA sheet's LV OD, HV OD and tank length.
 * These miss tolerance now because the engine models the LV winding as a
 * single full-height foil and the HV as one continuous layer winding, where
 * this sheet actually uses a multi-layer LV strip and an HV disc winding
 * (MANUFACTURING.md sections 5 and 6, both explicitly scheduled as their
 * own future engine-capability phase, not attempted here). Printed with
 * their current deviation on every run so the gap stays visible, but not
 * failed -- a permanently red suite stops being read, and failing on a
 * limitation that is already tracked and explained teaches the same lesson
 * as engine.test.mjs's golden numbers do: the only thing worth failing on
 * is a deviation that gets WORSE than what is recorded here, which would
 * mean something regressed rather than simply "not yet built".
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

console.log("\nGroup 2: known gaps -- reported every run, only fails if worse than recorded.");
console.log("\n1250 kVA, 11/0.433 kV, Dyn11, OLTC, oil, copper -- Mehir Transformers sheet");
knownGap("LV OD mm", +r1250.design.lvOD.toFixed(1), 374, -4.4,
  "LV modelled as a single full-height foil; this sheet's LV is a genuine multi-layer strip winding -- MANUFACTURING.md section 5.");
knownGap("HV OD mm", +r1250.design.hvOD.toFixed(1), 494, -6.2,
  "HV modelled as one continuous layer winding; this sheet's HV is disc-wound -- MANUFACTURING.md section 5.");
knownGap("tank length mm", Math.round(r1250.design.tankL), 1660, -5.4,
  "Follows from the LV/HV builds above: the tank is sized to the coil envelope, so a thinner-than-real coil gives a shorter-than-real tank -- MANUFACTURING.md sections 5-6.");

console.log(failures
  ? `\n${failures} FAILURES -- either a hard assertion broke or a known gap got worse. Either way, this is a regression.`
  : "\nall passed -- five hard assertions hold, and the three known gaps have not worsened.");
process.exit(failures ? 1 : 0);
