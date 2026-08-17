/**
 * cardCostModel checked against a real designer's per-kg costing card --
 * CALIBRATION.md section 9, "630 KVA CU LEVEL 1 Costing & Data", total
 * verified to the rupee: 1127191.26.
 *
 * This does not run the engine's own geometry: the sheet gives masses and
 * quantities directly (core, LT/HT weight, MS channel, MS sheet, oil, PSR
 * panel count) but not the volts-per-turn or turns that produced them, so
 * there is nothing to reproduce them from without guessing -- CLAUDE.md's
 * rule against inventing engineering data applies to test fixtures too.
 * Instead this checks what cardCostModel is actually responsible for: that
 * qty x rate per line, summed, plus the estimator's own Extra figure,
 * reproduces the sheet's total exactly. `cardPanels` overrides the normal
 * finLayout(d) derivation so the fixture does not need the tank geometry
 * finLayout would otherwise require.
 */
import * as E from "./index.js";

let failures = 0;
const eq = (label, got, want, tol = 0.01) => {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) { failures++; console.log(`  FAIL ${label}: got ${got}, expected ${want}`); }
  else console.log(`  ok   ${label} = ${got}`);
};

console.log("630 KVA CU LEVEL 1 Costing & Data -- Mehir Transformers sheet");
// CALIBRATION.md section 56: cardCostModel's own Core row now prices
// wCoreAssembled at rates.core plus a construction-specific processing
// surcharge, matching buildBOM. This 1963-style sheet predates both
// concepts -- it gives one core figure, at one flat rate, with nothing to
// say whether it was purchased or assembled, or what if any processing
// premium the shop's own Rs 240/kg already folded in. wCoreAssembled is set
// equal to wCore (no basis to invent a different assembled figure the sheet
// never gave) and the processing surcharge is set to 0 (the sheet's own
// Rs 240/kg reproduces the total exactly with no separate line for one, so
// it was evidently already all-inclusive, not a base rate waiting for a
// surcharge on top) -- neither is a guess, both are the most literal
// reading of what one flat historical rate can support.
const d = {
  dry: false,
  p: { tankType: "radiator", coreConstruction: "A" },
  wCore: 966.769, wCoreAssembled: 966.769, wLVCovered: 170.96, wHVCovered: 323.64,
  wFrame: 83.91, wTank: 349, fluidLitres: 588,
  cardPanels: 28,
};
const rates = { core: 240, condCu: 1415, frameMS: 70, tankMS: 86, fluid: 115, coreProcMitre: 0 };
const c = E.cardCostModel(d, rates, E.DEFAULT_CARD_RATES, 75000);

eq("row 1, Core", c.rows[0].amount, 232024.56);
eq("row 2, L.T Weight", c.rows[1].amount, 241908.40);
eq("row 3, H.T Weight", c.rows[2].amount, 457950.60);
eq("row 4, M.S Channel", c.rows[3].amount, 5873.70);
eq("row 5, M.S Sheet", c.rows[4].amount, 30014.00);
eq("row 6, Oil", c.rows[5].amount, 67620.00);
eq("row 7, PSR panels", c.rows[6].amount, 16800.00);
eq("subtotal", c.subtotal, 1052191.26);
eq("total (subtotal + Extra)", c.total, 1127191.26);

console.log("\ndry design omits oil and panel rows");
const dDry = { ...d, dry: true, wEnclosure: 200, p: { tankType: "fin" } };
const cDry = E.cardCostModel(dDry, rates, E.DEFAULT_CARD_RATES, 50000);
eq("row count", cDry.rows.length, 5, 0);
eq("row 5 uses enclosure mass, not tank", cDry.rows[4].amount, 200 * 86);

console.log(failures ? `\n${failures} FAILURES` : "\nall passed.");
process.exit(failures ? 1 : 0);
