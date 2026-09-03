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

6. **Loss limits are published where IS 1180 lists the rating, and estimates
   everywhere else.** The IS 1180 (Part 1) : 2014 tables are transcribed into
   the engine (`IS1180`) and are exact for the ratings they list. Outside them
   — an unlisted rating, dry type, or a non-IS standard — the figure is still
   the old fitted formula and is an estimate; the standard makes losses at
   unlisted ratings subject to agreement between user and supplier, so the
   engine reports `isLossPending` naming the rating rather than extrapolating.
   Any UI showing a limit must say which of the two it is and offer the manual
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
| Ex-works | ₹21,85,597 |
| Delivered incl. GST | ₹25,79,005 |
| Tank length | 1580 mm |
| No-load loss | 1025 W |
| Load loss | 6547 W |
| Impedance | 5.00 % |
| Efficiency | 99.25 % |
| Core mass | 1273 kg |
| Stepped core utilisation | 3 steps 0.8510, 9 steps 0.9483, 13 steps 0.9642 |

Current as of ENGINE_VERSION 1.39.0 (CALIBRATION.md section 95): the BOM's
conductor lines price the FINISHED COIL at its covered weight
(`wLVCovered`/`wHVCovered`), not bare conductor mass, because a works buys a
coil by what it weighs and the `condCu`/`condAl` rate is a bought-in
finished-coil rate, not a bare metal price. The lines are renamed to say so
and the BOM carries a `rateBasisNote`, because the old names said "winding"
against a bare mass at a finished rate and the mismatch was invisible in both
the number and the label. Covered mass is 2.92% above bare on the default
case; ex-works moves +1.48%. Only prices move -- no geometry, no losses, no
compliance figure.

Current as of ENGINE_VERSION 1.38.0 (CALIBRATION.md sections 79-81): a 5%
flux design margin below the IS 1180 ceiling (1.604 T against 1.689), the
short-circuit withstand calculation, and two guards. 10% is the target -- it
is what the 315 kVA reference carries -- but at 10% the fit drives flux to the
1.42 T floor, which is a different design rather than a margin, and it trips a
core-mass invariant. Section 81 names the blocker.

Current as of ENGINE_VERSION 1.37.0 (CALIBRATION.md section 77): three more
IS 1180 requirements the engine did not meet. Impedance now comes from Table 6
(6.25 % at 1600-2500 kVA, where the old ladder said 5.00). Flux is capped at
1.9/1.125 = 1.6889 T per clauses 6.9.1 and 7.9 -- the default case was fitting
to 1.78 T and was non-compliant. Temperature rise uses IS 1180's own limits,
45 K winding and 40 K oil for 250-2500 kVA and 40/35 for 16-200, superseding
IS 2026's 55/50 inside the product standard's scope and falling back to it
outside. Cooling surface rises 40-56 % in the 250-2500 band and 160 % at
100 kVA. The flux cap is the largest single price effect on the default case.

Current as of ENGINE_VERSION 1.36.0 (CALIBRATION.md section 76): the loss
schedule is the published IS 1180 (Part 1) : 2014 tables, not a fitted
formula. The standard gives maximum TOTAL losses at 50% and 100% of rated
load, not separate no-load and load-loss limits, so compliance is two
conditions on the pair and a design may trade core against copper. The old
formula was 11.5% loose at 315 kVA and 12.5% at 400 on the 50% figure it
never checked, and 17-31% tight at 16-100 kVA on the 100% figure. Every
figure below moved because the default case is now fitted to the published
1000 kVA Level 2 row (2790 W at 50%, 7700 W at 100%) rather than to the
formula's own estimate. The engine was producing IS 1180 NON-COMPLIANT
designs at 315 and 500 kVA before this; it no longer does.

Current as of ENGINE_VERSION 1.35.0 (CALIBRATION.md section 75): the OIL
current density baseline is corrected, divided by 1.72. It ran that much high
against two independent oil references four times apart in rating (1250 kVA
at ~1.44 A/mm2 against a 2.50 suggestion, 315 kVA at 1.52 against 2.60) while
the one dry reference sat at 0.99 of its own, so the divisor is applied
inside the oil branch only and dry is untouched -- byte-identical, verified.
The default case barely moves (ex-works +0.24%) because `autoFit` refits
density against the loss limits anyway; the suggestion only sets where that
fit starts. What moves is every design where the fit is off or the limits are
slack, and the references: the 1250's copper mass goes from -43.4% to -0.2%
against its 982 kg and the 315's load loss from +70.2% to -0.4% against its
own calculated 2220 W.

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
- **Current density is per material.** The oil baseline in `densitySuggest`
  was 1.72x too high and is corrected (ENGINE_VERSION 1.35.0, CALIBRATION.md
  section 75); oil copper now runs about 1.45-1.50 A/mm² at these ratings, not
  the "about 2.5 A/mm² at 1000 kVA" this line used to claim. Dry is a separate
  branch and was already right — do not apply the oil divisor to it. Aluminium
  is about 0.78 of copper. Any search over materials must anchor the density
  ladder on the material being tried, not the one already in the design.
  Getting that wrong made aluminium look infeasible. The `isHV` +0.15 offset is
  still additive and so is now a much larger fraction of the corrected oil
  base — it makes oil HV read about 11-15% high against both sheets, which
  both show HV at or below LV. Not yet changed; see section 75.
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
