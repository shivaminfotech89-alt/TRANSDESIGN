# Transformer Design & Costing Platform

Enterprise transformer design, costing and documentation software for Indian
manufacturers. Firebase project:
`ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846`

Users are design engineers and estimators at transformer works. They enter an
enquiry, the platform designs the transformer, prices it, re-engineers it to a
customer's budget, and issues the drawings and reports.

---

## Hard invariants

Break any of these and the product is wrong, not just untidy.

1. **The engine is pure.** `packages/engine/index.js` imports nothing. No React,
   no Firebase, no DOM, no network. Every number the UI shows comes from it.

2. **Never store a computed value.** Firestore revisions hold *inputs* and a
   frozen copy of the rate card. Losses, weights, dimensions and prices are
   recomputed on read. The one exception is `summary`, which exists solely so
   project-list rows do not run the engine — and it is written only from
   `summarise()`, never assembled by hand.

3. **One design on screen at a time.** Every tab renders the same design object
   and the same live BOM. If a budget option is being previewed, everything
   previews it and a banner says so. Two prices must never be visible for two
   different designs.

4. **Bump `ENGINE_VERSION` whenever a formula changes,** and keep old versions
   importable. A quotation issued last year must reprice exactly as issued.
   Tender conditions require this.

5. **Never invent engineering data.** If an input is missing — supplier lead
   time, measured test result, stock on hand — mark the dependent output
   `pending` and name the missing parameter. A plausible-looking fabricated
   value in a customer document is worse than a blank.

6. **Loss limits are estimates until the user overrides them.** The IS 1180
   level schedule in the engine is fitted from a scaling formula, not the
   published table. Any UI that shows a limit must say so and offer the manual
   entry.

---

## Commands

```bash
npm run dev              # Next.js dev server
npm run typecheck        # tsc --noEmit, must be clean before commit
npm run test:engine      # golden numbers, must pass before AND after engine edits
firebase deploy --only firestore:rules,firestore:indexes,storage
```

---

## Golden numbers

`npm run test:engine` pins these. If one moves, either you meant it and you bump
`ENGINE_VERSION`, or you have caused a regression. Do not edit the test to make
it pass.

Default case: 1000 kVA, 11 kV / 433 V, Dyn11, IS, Level 2, copper, ONAN, fin tank.

| Quantity | Value |
|---|---|
| Ex-works | ₹16,01,393 |
| Delivered incl. GST | ₹18,89,643 |
| No-load loss | 1146 W |
| Load loss | 9910 W |
| Impedance | 5.00 % |
| Efficiency | 98.91 % |
| Core mass | 1210 kg |
| Stepped core utilisation | 3 steps 0.8510, 9 steps 0.9483, 13 steps 0.9642 |

---

## Layout

```
apps/web/               Next.js 14, App Router, TypeScript
  app/org/[orgId]/projects/[id]/{design,calculations,drawings,model,costing,budget,documents,revisions}
  components/
  lib/{firebase.ts,types.ts,projects.ts}
packages/engine/index.js          pure, do not add dependencies
functions/                        Cloud Functions: PDF, CAD export
firestore.rules storage.rules firestore.indexes.json
```

---

## Engine API

```js
import { computeDesign, searchDesigns, summarise, ENGINE_VERSION,
         DEFAULT_RATES, ESSENTIALS, calcSheet, stepWidths,
         stampingSchedule, documentRegister } from "@/packages/engine";

const { design, bom, params, spec } = computeDesign(core, over, rates, extras);
```

- `core` — the enquiry: kva, hv, lv, freq, vector, application, standard,
  effLevel, medium, condPref, dual voltages.
- `over` — manual overrides keyed by parameter name. Anything absent is
  auto-derived by `deriveSpec` and shown as AUTO; anything present shows SET.
- `deriveSpec` cascades: change the HV voltage and Um, BIL, AC withstand and
  every clearance follow. Change the efficiency level and core grade, flux
  density and current density follow.
- The window height is solved by bisection until calculated %Z equals the
  declared value. Do not replace this with the output equation alone; small
  ratings came out at 12 % impedance against a 4.5 % target when it was.
- Flux density and current density are then fitted until losses sit just inside
  the schedule, with a floor of 1.42 T. Below that the core gets heavier faster
  than the loss falls.

---

## Domain rules that are easy to get wrong

- **Ex-works vs delivered.** Ex-works excludes GST. Delivered includes it. Label
  every price with which it is. This has already caused one user-visible bug.
- **Guaranteed vs measured losses.** The design is held to the guaranteed
  figure. The standard's tolerance (+15 % component, +10 % total under IS/IEC)
  applies to the measured value on test, not to the design target.
- **Current density is per material.** Copper runs about 2.5 A/mm² at 1000 kVA,
  aluminium about 0.78 of that. Any search over materials must anchor the
  density ladder on the material being tried, not the one already in the design.
  Getting this wrong made aluminium look infeasible.
- **Temperature rise binds twice.** The cooling surface must satisfy both the
  top-oil limit and the winding-rise limit; take whichever is lower.
- **Ageing uses the yearly weighted ambient (32 °C in India), not the maximum
  (50 °C).** The maximum is for the temperature-rise check.

---

## Style

- British spelling in user-facing copy. Indian number formatting (`en-IN`,
  lakh and crore) for currency.
- No em dashes in UI copy.
- Comments explain *why*, especially where a formula deviates from the textbook.
- Reference sources by book and topic, never by invented clause number:
  Sawhney; Kulkarni & Khaparde; BHEL; IEC 60076; IS 2026; IS 1180; IEEE C57.
- Prefer deriving a value over storing it. Prefer failing loudly over guessing.
