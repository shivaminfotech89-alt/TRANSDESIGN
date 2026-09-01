# Transformer Design & Costing Platform

Enterprise transformer design, costing and documentation software for Indian
manufacturers. Firebase project: `tendermaster-ai`, Firestore database
`ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846` (a named
database, not the project's default — `tendermaster-ai` also hosts unrelated
databases for other apps, so every `firebase` command must pin this database
explicitly).

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

7. **`documentRegister` must be reviewed whenever a phase lands.** Its whole
   job is to say, per document, whether it is generated, partial or needs
   input the platform does not hold — that is only true the day it is
   written. Landing a phase (an item master, persisted revisions, a new
   engine capability) can make an entry's `missing` text false without
   touching a line near it. A stale "need" for data that now exists, or a
   stale "not persisted" for something that now is, is worse than an honest
   gap: it tells a user the platform can't do something it already can, or
   hides that a document still isn't actually generated. Check every row
   `documentRegister` returns against what the phase you just finished
   actually built, not just the rows the phase obviously touches.

8. **The Layout section and the script names must be checked whenever
   either changes.** Same class of problem as a stale `documentRegister`
   entry (invariant 7) and a drifted golden-numbers table: a document whose
   only job is to be accurate, quietly not being. Move a directory, add a
   top-level folder, rename or add an npm script, and the Layout block or
   the Commands block above is wrong in the same commit — fix it there, not
   next time someone notices. This is not hypothetical maintenance: Layout
   described `apps/web/` with a Next.js App Router and routed tabs, and
   Commands named a `typecheck` script, through the entire Vite rebuild
   until it was caught. Both were wrong in a way that reads as authoritative
   — an agent trusting them looks for files that do not exist and runs a
   script that is not there. A wrong map is worse than no map.

---

## Commands

```bash
npm run dev              # Vite dev server, port 3000
npm run lint             # tsc --noEmit, must be clean before commit (there is no `typecheck` script)
npm run build            # vite build
npm run test:engine      # engine.test.mjs + reference-designs + card-cost
                         # golden numbers, must pass before AND after engine edits
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions   # syncOrgClaims, generateReportPdf -- see functions/.env.example
```

---

## Golden numbers

`npm run test:engine` pins these. If one moves, either you meant it and you bump
`ENGINE_VERSION`, or you have caused a regression. Do not edit the test to make
it pass.

This table must be brought current in the same commit as any `ENGINE_VERSION`
bump that moves the default case's own numbers. It is the same class of
problem as a stale `documentRegister` entry (invariant 7): a document whose
only job is to be accurate, quietly not being. This table drifted for many
versions (last matched ENGINE_VERSION 1.1.0, corrected here at 1.22.0) before
that was caught — do not let it happen again.

Default case: 1000 kVA, 11 kV / 433 V, Dyn11, IS, Level 2, copper, ONAN, fin tank.

| Quantity | Value |
|---|---|
| Ex-works | ₹20,05,344 |
| Delivered incl. GST | ₹23,66,306 |
| Tank length | 1541 mm |
| No-load loss | 1088 W |
| Load loss | 6356 W |
| Impedance | 5.00 % |
| Efficiency | 99.26 % |
| Core mass | 1109 kg |
| Stepped core utilisation | 3 steps 0.8510, 9 steps 0.9483, 13 steps 0.9642 |

Current as of ENGINE_VERSION 1.31.0 (CALIBRATION.md section 66): rectangular
strip conductor now carries a corner radius (`cornerRadius`, default 1 mm).
The 315 kVA reference states this on its own sheet -- 3.28 x 10.78 over 8
conductors is 282.87 mm2 of rectangle but 275.67 mm2 of copper. The engine
sizes copper first, so the correction runs the other way here: the envelope
a strip winding physically occupies is inflated by (4 - pi)r^2 per strand,
where before envelope and copper were the same number and every strip
winding was built marginally too small. That is the only change moving this
table -- setting `cornerRadius` to 0 reproduces every figure below at
ENGINE_VERSION 1.30.0 exactly. HV round enamelled wire was also made a real
selectable construction in the same version, but it is chosen by HV current
and the default case sits above the threshold on strip either way, so it
moves nothing here.

Current as of ENGINE_VERSION 1.30.0 (CALIBRATION.md section 60): no-load
loss is no longer the whole assembled core's mass at one flat building
factor. It is now split — the corner-and-T-joint mass (about 17% of the
assembled core at this case, estimated from the same validated mitre-wedge
relationship the limb mass itself already uses) carries the building
factor; the rest of the core runs at the catalogue specific loss. Published
sources put the joint's own share of no-load loss at 3-4% on large power
transformers and up to 10% on small distribution units — most of this
platform's own book of work — which a flat factor cannot represent. This
is roughly a 9% no-load reduction against what the flat form gave the same
geometry, which is enough to shift which discrete winding configuration
`fitToSchedule` settles on for the default case (the same bracket-
sensitivity cascade every prior loss-moving change in this table has
produced), so every figure above moved together, not just no-load.

Current as of ENGINE_VERSION 1.28.0 (CALIBRATION.md sections 56-57): the core
BOM line now prices the assembled core (`wCoreAssembled`) at the base core
rate plus a construction-specific processing surcharge, instead of pricing
the construction-specific purchased mass (`wCore`) at a flat rate — the
works buys finished core per kg, so scrap is the supplier's own cost,
recovered through what they charge to process a given cut pattern, not
through extra kg on our BOM. Separately, the building factor (ratio of
built core loss to catalogue loss) is no longer one flat figure per joint
type: it now depends on cut geometry and joint stacking too, manufacturer
data, and moved the default case's own default from 1.10 to 1.125 (master
mitre, staggered). Both reachable by the default case (Construction A,
staggered, both defaults), so both moved every figure in this table.

Current as of ENGINE_VERSION 1.22.0 (CALIBRATION.md section 46): `fitToSchedule`
used to accept a false-positive convergence — the continuous window-spread
check could be satisfied by chance while `numGroups`/`layers` was still
genuinely alternating between two discrete winding configurations underneath
it. The default case was itself an arbitrary mid-cycle snapshot, not a
converged design. Fixed by detecting the cycle directly and choosing the
compliant state closest to the intended margin; every number above reflects
that deliberately-chosen, genuinely stable design, not the old snapshot.

---

## Layout

```
src/                    Vite + React 18, TypeScript, single-page, no router
  App.tsx                         owns the design, the live BOM and the preview banner
  components/                     ResultsDisplay.tsx holds TABS, the tab order users see
  components/{budget,cad,compare,costcard,documents,drawings,manufacturing,reports}/
  lib/                            UI-side logic: pinRegistry, classBSolver, pricing, format
  workers/{designWorker.ts,searchWorker.ts}  the multi-second solves, off the tab thread
lib/{firebase.ts,projects.ts,types.ts}   Firebase and the revision read/write layer
packages/engine/index.js          pure, do not add dependencies
functions/src/                    Cloud Functions, two of them: syncOrgClaims
                                  (claims.ts), generateReportPdf (reportPdf.ts)
firestore.rules storage.rules firestore.indexes.json
```

There is no router and no `apps/` directory. The tabs are client state in
`ResultsDisplay.tsx`, not routes, which is what makes invariant 3 cheap to
hold: every tab reads the one design object `App.tsx` owns.

`@` resolves to the repository root in both `vite.config.ts` and
`tsconfig.json`, so `@/lib/firebase` is the top-level `lib/` and
`@/packages/engine` is the engine. Note the two `lib` directories are
different: top-level `lib/` is the Firebase layer, `src/lib/` is UI logic.

There is no CAD export Cloud Function — the 3D model is rendered and
exported in the browser (`src/components/cad/`, `src/lib/exportUtils.ts`).
The Layout block said there was one for as long as it said `apps/web/`.

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

- **Visual design follows `DESIGN.md` exactly** — palette, type stacks, the
  rating plate, parameter rows, tabs, cards and tables. It is the visual
  specification, not a suggestion. Read it before touching any component's
  markup or classes. Do not introduce Tailwind's default palette, icon
  components, drop shadows, gradients, or rounded pill shapes — `DESIGN.md`
  prohibits all of them explicitly.
- **Parametric editing follows `SOLVER.md` exactly** — the four parameter
  classes, the pin registry and conflict rules, solver behaviour, and the
  Design Impact Summary. Implement it in the order given in its section 6.
  Never let a user set two pins that solve through the same lever without
  asking which to release first.
- **Drawings follow `DRAWINGS.md` exactly** — the universal requirements
  (dimension lines, title block, projection symbol, geometry-driven
  scaling) apply to all twenty-one drawings before any of their individual
  content. A drawing without dimension lines on it is a picture, not a
  drawing. Where a field is not held by the engine, print the label with
  "to be specified" rather than filling it or leaving it blank.
- British spelling in user-facing copy. Indian number formatting (`en-IN`,
  lakh and crore) for currency.
- No em dashes in UI copy.
- Comments explain *why*, especially where a formula deviates from the textbook.
- Reference sources by book and topic, never by invented clause number:
  Sawhney; Kulkarni & Khaparde; BHEL; IEC 60076; IS 2026; IS 1180; IEEE C57.
- Prefer deriving a value over storing it. Prefer failing loudly over guessing.
