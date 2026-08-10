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
eq("ex-works", Math.round(r.bom.exFactory), 1630080, 500);
eq("delivered", Math.round(r.bom.withGst), 1923495, 600);
eq("tank length mm", Math.round(r.design.tankL), 1368, 2);
eq("no-load loss W", Math.round(r.design.noLoad), 1146, 5);
eq("load loss W", Math.round(r.design.loadLoss), 9910, 30);
eq("impedance %", +r.design.pctZ.toFixed(2), 5.00, 0.02);
eq("efficiency %", +r.design.eff100.toFixed(2), 98.91, 0.02);
eq("core mass kg", Math.round(r.design.wCore), 1210, 15);
eq("compliant", r.design.compliant, true);

console.log("\nstepped core utilisation matches the classical table");
[[3, 0.851], [5, 0.9079], [9, 0.9483], [13, 0.9642]].forEach(([n, u]) =>
  eq(`${n} steps`, +E.stepWidths(n, 233).util.toFixed(4), u, 0.0005));

console.log("\nimpedance solve tracks the declared value across ratings");
[100, 630, 2500].forEach((kva) => {
  const d = E.computeDesign({ ...E.ESSENTIALS, kva }, {}, E.DEFAULT_RATES, []);
  eq(`${kva} kVA %Z`, +d.design.pctZ.toFixed(2), d.params.targetZ, 0.06);
});

console.log(failures ? `\n${failures} FAILURES` : "\nall passed");
process.exit(failures ? 1 : 0);
