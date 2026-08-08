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
eq("ex-works", Math.round(r.bom.exFactory), 1601393, 500);
eq("delivered", Math.round(r.bom.withGst), 1889643, 600);
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
