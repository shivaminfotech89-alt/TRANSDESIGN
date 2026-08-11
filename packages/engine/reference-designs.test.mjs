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

console.log("1250 kVA, 11/0.433 kV, Dyn11, OLTC, oil, copper -- Mehir Transformers sheet");
{
  const core = { ...E.ESSENTIALS, kva: 1250, application: "distribution", vector: "Dyn11" };
  const over = {
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
  const r = E.computeDesign(core, over, E.DEFAULT_RATES, []);
  exact("LV turns", r.design.nLV, 13);
  exact("HV turns, normal tap", r.design.nHV, 572);
  within("LV OD mm", +r.design.lvOD.toFixed(1), 374, 2);
  within("HV OD mm", +r.design.hvOD.toFixed(1), 494, 2);
  within("tank length mm", Math.round(r.design.tankL), 1660, 2);
}

console.log("\n630 kVA, 11/0.433 kV, dry type, copper -- Mehir Transformers sheet");
{
  const core = { ...E.ESSENTIALS, kva: 630, medium: "dry", application: "distribution", vector: "Dyn11" };
  const over = {
    etK: 15.63 / Math.sqrt(630),   // the sheet's own volts per turn
    limitNLL: 1300, limitLL: 6200, // the sheet's own guaranteed losses
    // No step count given here -- unlike the 1250 kVA sheet, CALIBRATION.md
    // does not state one for this design, so this is the one place the
    // engine's own suggestion (item 3, diameter-tracking) is exercised
    // rather than overridden with a sheet figure.
    autoFit: false,
  };
  const r = E.computeDesign(core, over, E.DEFAULT_RATES, []);
  exact("LV turns", r.design.nLV, 16);
  exact("HV turns", r.design.nHV, 704);
  within("copper mass kg", +(r.design.wLV + r.design.wHV).toFixed(1), 292, 5);
  within("LV radial build mm", +((r.design.lvOD - r.design.lvID) / 2).toFixed(2), 20, 10);
}

console.log(failures
  ? `\n${failures} FAILURES -- the engine does not yet match a transformer that was actually built.`
  : "\nall passed -- the engine matches both transformers that were actually built.");
process.exit(failures ? 1 : 0);
