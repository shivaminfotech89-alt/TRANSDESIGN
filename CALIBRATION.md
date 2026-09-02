# Engine calibration against real working designs

Four production design sheets from Mehir Transformers, prepared by working
designers, are compared against the engine. Given the designer's volts per
turn and clearances, the engine reproduces their geometry and turns to within
a few per cent, so that part of the model is sound. What needs correcting is
what the engine *suggests* when left to choose -- and the largest single
example of that is immediately below.

## The strongest single finding in this file: the oil current density is 1.72x too high

Kept here, at the top, rather than inside a section, because it is the
best-evidenced number in the document and the one most likely to be needed
by someone who reads no further.

| | `densitySuggest` | sheet | ratio |
|---|---|---|---|
| 1250 kVA, oil | 2.50 A/mm2 | ~1.44 | **1.74** |
| 315 kVA, oil | 2.60 A/mm2 | 1.52 | **1.71** |
| 630 kVA, dry | 2.80 A/mm2 | 2.84 | **0.99** |

**Two independent oil designs, four times apart in rating, at the same
ratio; the one dry design at 1.00.** Nothing else in this file rests on two
matching points that far apart. A flat ratio across a 4x span is an
intercept error, not a slope error, and the dry figure landing at 1.00 says
the medium correction is right and the oil baseline specifically is wrong.

The 1250's own implied ~1.44 was recorded in section 11 long before the 315
sheet existed, which means the two points were never fitted to each other.

**What correcting it does**, measured: the 315's load loss goes from +70.2%
against its own calculated 2220 W to **-5.0%**; the 1250's copper mass from
-43.4% against its 982 kg to **+6.1%**; and the LV conductor arrangement on
the 500 and 1250 comes out exactly right for the first time. It closes the
LV area gap open since section 11 -- which was never an area-model defect at
all, the area model being exact to 0.2% when fed real densities (section 72).

**It is not committed.** Correcting it enlarges the HV conductor, and the HV
radial build is computed from a fixed 2.1:1 conductor shape with no
measurement behind it (section 11's own open question), so the 1250's HV OD,
tank length and real cutting chart all degrade. Blocked on one datum: HV
conductor dimensions for the 1250 or 630 kVA. See DATA-REQUEST item 0 and
sections 72 and 74.

---

Reference designs:
- **1250 kVA, 11/0.433 kV, Dyn11, OLTC, oil, copper.** 1400 W no-load,
  7600 W load loss. Et 19.23, 13 LV turns, 572 HV turns normal and 628 at
  extreme tap, core 271 mm, 15 steps, hilo 11 mm, copper 982 kg,
  tank 1660 x 665 x 1175.
- **630 kVA, 11/0.433 kV, dry type, copper.** 1300 W no-load, 6200 W load loss.
  Et 15.63, 16 LV turns, 704 HV turns, core 245 mm, hilo 25 mm, LV radial build
  20 mm, copper 292 kg, LV axial 410 mm.
- **315 kVA, 11/0.433 kV, Dyn11, oil, copper, Level 1, UGVCL tender.** 470 W
  no-load, 3100 W load loss, 4.75 % declared and 4.20 % measured impedance.
  Et 9.615, 26 LV turns, 1144 HV turns in 4 coils/phase, core 197 mm,
  16 steps, window 365 x 198, core 660 kg/set. The first reference with a
  full short-circuit calculation and a full lamination drawing set. See
  section 61.
- **500 kVA, 11/0.433 kV, Dyn11, oil, copper.** 545 W no-load, 3472/3622/3755 W
  load loss at taps 1/5/8. Et 10.416, flux 1.3947 T, 24 LV turns, HV round
  enamelled wire 9 SWG, core 942.3 kg, 17 steps, tank 1310 x 525 x 1205
  inside, 650 L oil, 3345 kg total. See section 61.

---

## 1. LV to HV clearance, the significant one

Both sheets are 11 kV class, 75 kVp impulse. Their hilo is **11 mm in oil** and
**25 mm dry**, a ratio of 2.27. The engine gives 20 mm and 45 mm, a ratio of
2.25. The oil to dry relationship is correct to within one per cent; the base
value is roughly 1.8 times too large.

Note their 11 mm is the complete radial gap and already contains the 2 mm
pressboard cylinder and both oil gaps: LV OD 374, former 382, cylinder to 386,
duct to 396, HV ID 396.

Change `clearancesFrom` so the oil base gives 11 mm at 75 kVp. Keep the dry
multipliers as they are, since the ratio is confirmed.

**Only 11 kV is confirmed.** Two sheets at one voltage class fix one point on
the curve, not its slope. Keep the existing slope, shift the intercept, and
record in a comment that the 33 kV and above end is unverified. Ask for a 33 kV
sheet before touching the slope.

Cost effect on the 1250 kVA at its own guaranteed losses: ex-works falls from
₹25,24,734 to ₹23,15,045, a saving of ₹2.1 lakh for identical losses and
impedance. **Stale (section 14): this pair of figures predates the load loss
recalibration, the winding construction work and the packing fixes -- so many
engine versions have landed since that "before" no longer corresponds to any
state worth reproducing.** The clearance fix itself is unaffected (it is a
direct BIL-driven formula, not geometry-solve dependent) and stands as
described; only this specific cost illustration is out of date. Current
ex-works at the 1250 kVA reference's own guaranteed losses is ₹27,38,590 --
not comparable to either figure above, since the loss schedule, rates and
construction model behind it have all changed since this was written.

## 2. Volts per turn constant

**Superseded below.** The first pass raised the suggestion to a fixed
per-medium constant (0.544 oil, 0.623 dry, both against the designer's own
figures) and stopped there. A cost sweep done afterwards showed that framing
was wrong in a way accuracy-fitting alone couldn't catch: K does not have one
correct value for a given medium, because it isn't fitted to a physical
constant, it is a trade between two priced materials.

### Why there is a minimum, not a constant

Et = K√kVA = 4.44 f B Ai. For a fixed flux density B, a higher K means a
bigger net core area Ai, so a bigger, heavier core -- but Et also sets the
volts per turn, so a higher K means fewer turns for the same phase voltage,
and fewer turns is less copper. K therefore buys core steel and sells winding
copper as it rises, and spends the other way as it falls. Somewhere between
is whatever balance is cheapest, and where that sits depends on the price of
steel against the price of copper, not on the duty or the medium alone. A
constant fitted to match one designer's output at one pair of rates is only
ever right at that designer's own rates.

### The search

`etkCurve(p, rates)` (packages/engine/index.js) sweeps K from 0.40 to 0.70 in
steps of 0.02, holding flux, current density, steps and everything else in
`p` fixed, and returns ex-works at each point. `fitEtkToCost` reads that curve
and raises an AUTO `etK` to whichever point is cheapest, the same way
`fitToSchedule` already raises AUTO flux and current density to whatever the
loss schedule needs -- it runs inside `computeDesign`, after `fitToSchedule`
so the K search sees the same flux and density the actual build will use, and
only when `etK` is not explicitly overridden, so a designer's own figure (or
these two reference sheets') is never second-guessed.

`deriveSpec`'s own suggestion is unchanged -- it has no rates to search
against, and is still the fixed per-medium multiplier from the first pass
(0.544 oil, 0.623 dry), used as the form's AUTO display and as the bootstrap
estimate `steps` is chosen from. The economic raise happens one layer up, in
`computeDesign`, exactly where `fitToSchedule` already does the equivalent
job for flux and density.

`searchDesigns` gained the same lever for its own grid (`opts.etKs`), plus
`opts.stepsList` and `opts.tapTypes` for completeness, all following the
existing `opts.grades`/`opts.conds` pattern -- default to the design's own
single current value, so an existing call site's candidate count is
unchanged unless it opts in. The Fit to Budget search opts into `etKs` by
default (material, grade and tank were already swept there; a design that is
mainly cheaper because of K should surface in the same results). `stepsList`
and `tapTypes` are left at their default single value in that search --
crossing either one in as well turns a two-second grid into ten or more, for
a lever that on most enquiries is not really a free choice (a tap changer is
a functional requirement of the duty, not a cost knob, unless the
application itself already has none -- isolation, UPS). The Fit to Budget
tab also has its own K Sweep panel, plotting this curve directly for the
design on screen with its minimum marked, so an engineer sees the shape of
it rather than trusting one point.

`etkCurve` marks a point `feasible` on the same three checks `searchDesigns`
already gates its own grid on: impedance within the standard's tolerance of
the declared value, thermal rise within limit, and no-load plus load loss
within the loss schedule. `fitEtkToCost` **only ever picks among feasible
points.** An earlier version of this function did not -- see "The bug this
found," below, before reading the numbers, since it changes which points in
what follows are real candidates and which are not.

### What the search actually finds

The 1000 kVA default enquiry (no reference overrides, ordinary Level 2
distribution) against `DEFAULT_RATES`:

| K | Ex-works | Feasible |
|---|---|---|
| 0.40 | ₹15,53,631 | no -- misses the loss schedule |
| 0.44 | ₹15,35,900 | no |
| 0.46 | ₹15,36,118 | no |
| **0.48** | **₹15,48,160** | **yes -- cheapest feasible** |
| 0.50 | ₹15,48,160 | yes |
| 0.54 | ₹15,52,599 | yes |
| 0.56 | ₹15,76,188 | no |
| 0.70 | ₹16,71,739 | no |

Only K = 0.48 to 0.54 comply here -- narrower than the swept range, and
narrower than it looks from ex-works alone: 0.44 and 0.46 are actually
*cheaper* than 0.48, but they build a smaller core than the loss schedule's
no-load limit allows at this flux floor, so they are not real candidates.
`fitEtkToCost` correctly skips past them to K = 0.48, ₹15,48,160 -- cheaper
than the old fixed suggestion (K = 0.545, ₹15,52,599) but by less than
picking the curve's bare minimum would have suggested.

Moving the rates moves the minimum within that feasible band, confirming the
trade is real rather than noise:

- **Copper at ₹1600/kg** (up from ₹1050): feasible band shifts to
  0.48-0.54, cheapest **K = 0.52**, ₹17,98,902. Dearer copper makes fewer
  turns worth more, so the balance shifts toward a bigger core and less
  winding metal.
- **CRGO at ₹240/kg** (down from ₹305): feasible band the same, cheapest
  also **K = 0.52**, ₹14,36,886. Cheaper steel pushes the same direction as
  dearer copper -- more core is worth buying either way.

Both push the optimum from 0.48 to 0.52, the same direction, for the same
underlying reason: whichever of the two materials gets relatively cheaper,
the balance point moves toward buying more of it.

### Why the designer's own sheet sits above the computed optimum

Both reference designs were priced at K = 0.544 / 0.623, above the 0.48-0.54
band this engine's defaults land in. The rate sweep above shows exactly the
direction that would explain it: a designer facing copper that is dear
relative to steel, or steel that is cheap relative to copper, rationally
lands on a higher K than one at this engine's default rates would. The most
likely explanation is that Mehir Transformers' own CRGO cost, or their
supplier terms on it, sit below what `DEFAULT_RATES.core` assumes -- not that
0.544 is wrong, but that it is the right answer to a different set of prices
than the ones shipped as the engine's default. This is a hypothesis, not a
confirmed number: nothing in the two reference sheets states their actual
steel cost, and it is not asserted as a test.

This could not be checked against the 1250 kVA reference sheet directly at
the time this section was first written, and that is worth being explicit
about rather than glossing over: that reproduction sets `core.effLevel` to
`level2` (not `custom`) while overriding `limitNLL`/`limitLL` to the sheet's
own 1400/7600 W. `designTransformer`'s compliance check used to only read an
overridden `limitNLL`/`limitLL` when `effLevel === "custom"` -- otherwise it
silently recomputed the schedule limit from `lossSchedule(kva, effLevel, dry)`
and checked against that instead, ignoring the override. So for that specific
reproduction, `feasible` was checked against the engine's own auto Level 2
figure (1431 W) rather than the sheet's declared 1400 W, and the sheet's own
K = 0.544 point failed it (1475 W built there) regardless -- not because
K = 0.544 is a bad choice at Mehir's rates, but because this reproduction was
never fitted to any schedule in the first place (`autoFit: false`, per the
file header, reproduces the designer's own flux and density as given).

**Fixed in ENGINE_VERSION 1.4.2:** `designTransformer` now always reads
`p.limitNLL`/`p.limitLL` for compliance, regardless of `effLevel` -- deriveSpec
already resolves those correctly either way (the schedule's own suggestion, or
an explicit override), so the `effLevel === "custom"` gate was never needed.
`searchDesigns`' `lossOk` filter and `fitEtkToCost`'s feasible gate inherit
the fix for free. This did not change either reference design's turns or
geometry (both fix `etK` explicitly, so `fitEtkToCost` never ran against
them, and `autoFit: false` means loss compliance was never fed back into the
build) -- it changes only what `compliance.nll`/`ll` report, and what any
future AUTO-etK enquiry with its own typed loss limits gets checked against.

### The bug this found

The first version of `fitEtkToCost` fell back to the cheapest point on the
*whole* curve, feasible or not, whenever nothing on the swept range was
feasible at all. At small ratings this fired every time: below about 400 kVA
at Level 2, the 1.42 T flux floor (`fitToSchedule`'s own lower bound, "the
core gets heavier faster than the loss falls" below it) stops no-load loss
from closing to the schedule limit at *any* K, so no point was ever
feasible, and the fallback picked whichever K was cheapest with zero regard
for anything else. At 100 kVA that was K = 0.40, the swept range's own edge --
built there, impedance came out 8.5% off the 4.5% declared value, inside the
standard's own ±10% test tolerance but only because that tolerance is meant
for a measured value on a built transformer, not a target to aim a cost
search at. A design nobody asked for, chosen because it happened to be
cheapest among candidates none of which were acceptable.

Fixed: `fitEtkToCost` now only ever selects a feasible point. When none
exists, it returns no override at all -- `etK` stays at `deriveSpec`'s own
suggestion, exactly as it stood before this search existed -- and reports why
in `etkSearchNote`, which `computeDesign` carries through on its result
rather than silently picking anything. Confirmed against the same 50-5000 kVA
scan used to check the sweep range (next section): every rating from 50 to
400 kVA at Level 2 now reports no feasible K and correctly falls back,
instead of silently landing somewhere.

### Is the swept range too narrow?

Checked directly rather than assumed: once the bug above was fixed, none of
the genuine (feasible) optima found across a 50-5000 kVA scan at
`DEFAULT_RATES` sit on the range's own edges (0.40 or 0.70) -- they cluster
between 0.48 and 0.56 for every rating that has a feasible K at all. 100 kVA
looking like an edge case before the fix was entirely the fallback bug, not
evidence the range needed widening. 0.40-0.70 stands.

## 3. Steps in the stack

The 1250 kVA uses 15 steps where the engine suggests 9. The suggestion should
track core diameter rather than rating, since it is the circle being filled:
roughly 3 to 5 steps below 100 mm, 7 to 9 up to 200 mm, 11 to 13 up to 260 mm,
15 above that.

## 4. Dry type current density, currently backwards

The engine multiplies density by 0.82 for dry types, reasoning that air cools
worse than oil. In practice class F permits a 100 K rise against 55 K for oil,
and the temperature allowance dominates. The 630 kVA dry design runs
2.79 A/mm² LV and 2.89 A/mm² HV where the engine suggests 2.10 and 2.25.

Change the factor to approximately 1.10 and record why.

## 5. Conductor suggestion falls through at exactly 630 kVA

`condSuggest` reads `kva > 630 || effLevel in [level2, level3]`. At exactly
630 kVA with a custom loss level, neither holds and it silently returns
aluminium. Entering your own loss targets must not change the winding metal.
Make custom behave as level 2, and use `kva >= 630`.

## 6. Load loss coefficient, ENGINE_VERSION 1.7.0

`lossSchedule`'s load loss formula, `coefficient * kva^0.766 * levelMultiplier`,
used coefficient 52. The 630 kVA Level 1 costing sheet gives 4400 W load loss;
at Level 2 (m = 1.00, the level neither reference design's own guarantee needed
a multiplier to match) coefficient 52 estimates 7249 W there -- 65% over.

Recalibrated to 32. Two independent oil designs confirm it at Level 2:

| Rating | Formula at 32 | Real guarantee |
|---|---|---|
| 630 kVA | 4461 W | 4400 W |
| 1250 kVA (the OLTC reference) | 7540 W | 7600 W |

Both within 1.4%. The 0.766 exponent and the no-load formula
(`4.6 * kva^0.805 * m * kn`) are untouched -- neither sheet gave evidence
against either, and CALIBRATION.md item 2's own lesson (don't move more than
the data confirms) applies here the same way it did to the LV-HV clearance
slope in item 1.

**This moved current density substantially**, and with it the LV and HV
builds, since autoFit re-optimises flux and current density against the new,
lower load-loss ceiling. `reference-designs.test.mjs`'s two scenarios are
unaffected (both override `limitNLL`/`limitLL` explicitly with `autoFit: false`,
so neither ever calls `lossSchedule` for its own target) -- but every AUTO,
no-override enquiry does, including `engine.test.mjs`'s own default case,
whose golden numbers moved again and are recorded there with the reason.
See ENGINE_VERSION 1.7.0's own note in that file for what changed and why
`compliant` is now `false` there (a pre-existing 1.42 T flux-floor property,
not something this recalibration caused, just made visible at a rating where
it previously wasn't).

Also corrected the "Not adopted" section below: the old coefficient's
12,253 W Level 2 estimate for 1250 kVA was the evidence the coefficient was
wrong, not evidence their own 7600 W was an unusually premium figure. At 32,
the schedule estimate is 7540 W -- 7600 W is an ordinary Level 2 number.

**No-load coefficient, not touched, and why.** Investigating the residual mass
gap after items 3 and 4 (packages/engine/index.js `_tmp` scripts, not kept)
found that a 630 kVA enquiry at Level 2, no override, cannot meet its own
no-load ceiling at any K in the swept range, including the fully joint case
(flux and current density re-fit at each K, not just the frozen-density
`etkCurve` sweep) -- flux sits at the 1.42 T floor throughout and no-load
loss still exceeds its limit by 3-20% depending on K. That is the load-loss
recalibration above changing the *split* between the two loss ceilings
without a matching correction to the no-load side, which this session did
not touch.

The no-load coefficient (4.6, `lossSchedule`'s `nll` term) is therefore the
strongest remaining candidate for its own recalibration. It is **not**
changed here: the load loss coefficient was moved on two independent
confirming points (630 kVA and 1250 kVA, both within 1.4%), and there is no
equivalent no-load figure from either sheet to anchor a change against.
Inferring a new coefficient from the post-item-3 imbalance alone would be
exactly the curve-fitting this whole document has avoided -- evidence that
something is *probably* wrong is not the same as evidence for what the
right number *is*.

What would settle it: guaranteed no-load loss figures from two or three more
real designs, at ratings away from the two already available (630 kVA and
1250 kVA both sit in the middle of the range 100 kVA to several MVA covers).
Most useful: one design at 100-300 kVA and one at 2000 kVA or above, since a
coefficient fitted to two adjacent mid-range points has no evidence either
way about whether the same exponent (0.805, also untouched, also unconfirmed
independently) holds at the ends of the range it is applied across.

## 7. DEFAULT_RATES

**Source: the 630 kVA Level 1 costing sheet, 2026-08-11.** Five of
`DEFAULT_RATES`'s figures (packages/engine/index.js) taken directly from that
sheet's own material rates:

| Rate key | Old | New |
|---|---|---|
| `core` (CRGO, ₹/kg) | 305 | 240 |
| `condCu` (copper, ₹/kg) | 1050 | 1415 |
| `frameMS` (frame steel, ₹/kg) | 98 | 70 |
| `tankMS` (tank steel, ₹/kg) | 118 | 86 |
| `fluid` (oil, ₹/L) | 135 | 115 |

Every other figure in `DEFAULT_RATES` is unchanged -- not confirmed against
this sheet, not moved on the strength of five numbers from one document. This
is the engineering-default tier only, the bottom of the price-source
hierarchy TASKS.md item 11.4 built (`src/lib/pricing.ts`): a project with its
own rate card, or item-master prices resolving over it, never reads
`DEFAULT_RATES` at all. Changing it moves `engine.test.mjs`'s own golden
numbers (which build against `DEFAULT_RATES` explicitly) but reprices no
saved revision, each of which carries its own frozen `rateSnapshot`.

Not an `ENGINE_VERSION` bump: this is a rate, not a formula (CLAUDE.md
invariant 4 is about formulas specifically), and nothing about how a price is
*computed* from a rate changed.

---

## Verification after the changes

The golden numbers will move. This is intended, so bump `ENGINE_VERSION` to
1.3.0 and update `engine.test.mjs` deliberately, recording why.

Then add a second test file, `reference-designs.test.mjs`, asserting the engine
lands within tolerance of both real designs when given the designer's volts per
turn, step count and guaranteed losses:

- 1250 kVA: LV turns 13 exactly, HV turns 572 exactly, LV OD and HV OD within
  2 per cent of 374 and 494, tank length within 2 per cent of 1660.
- 630 kVA dry: LV turns 16 exactly, HV turns 704 exactly, copper within 5 per
  cent of 292 kg, LV radial build within 10 per cent of 20 mm.

These are the most valuable tests in the project: they check the engine against
transformers that were actually built, not against its own past output.

`reference-designs.test.mjs` is split into two groups: group 1 is the five
hard assertions above, and a failure there is a regression. Group 2 is the
1250 kVA LV OD, HV OD and tank length, which do not close (the engine models
the LV as a single full-height foil and the HV as one continuous layer,
where this sheet uses a multi-layer LV strip and an HV disc winding --
MANUFACTURING.md sections 5 and 6, their own future phase). Group 2 prints
its deviation every run against a recorded baseline (-4.4%, -6.2%, and the
tank figure) and only fails if a deviation gets worse than recorded --
otherwise a permanently red suite for a known, tracked gap stops being read.

**ENGINE_VERSION 1.4.0 and 1.4.1** (section 2, above): both reference designs
give `etK` explicitly, so `fitEtkToCost` never runs against them and neither
group's numbers moved, in either version. Only enquiries that leave `etK` on
AUTO see the new economically-raised value -- `engine.test.mjs`'s default
1000 kVA case is one, and its golden numbers moved (1.4.0) then held steady
through the 1.4.1 bugfix, recorded there.

---

## Fitted parameters awaiting a proper derivation

**`lvStripAspect` is retired, not merely flagged.** This section used to carry
it here as a fitted-not-derived constant (3.5, the 1250 kVA reference's own
conductor arrangement not matching its sheet at that fit). ENGINE_VERSION
1.9.0 (section 10) removed the parameter entirely -- the LV axial x radial
split is now sized from coil height and turn count directly, no aspect ratio
left to fit. Left the old bullet here uncorrected for a time after the
parameter was gone, which is exactly the kind of stale claim section 14
below exists to catch; noted here so a reader of this section specifically
does not go looking for a parameter that no longer exists.

**`hvDiscGap`** (packages/engine/index.js, `deriveSpec`) is still a curve-fit
constant, not derived from any physical model -- the axial gap between
adjacent HV discs, standing in for what a real disc winding varies gap by
gap for dielectric grading and cooling. Its own fitted value has moved twice
since first recorded here, each time as a side effect of other work, not a
re-fit of its own:

| When | Value | 1250 kVA disc count | Why it moved |
|---|---|---|---|
| First fit (ENGINE_VERSION 1.5.0) | 4.5 mm | 44 | Against HV OD/tank length alone, before LV strip construction existed |
| Retuned (1.6.0) | 3.5 mm | 53 | LV multi-layer strip construction landed; both windings share one window-height solve, so getting LV right moved HV's own disc count too, not a re-fit of hvDiscGap on its own evidence |
| Current (1.9.0, packing fixes) | 3.5 mm, unchanged | 49 | The LV area gap (section 11) shifted the same shared window-height solve again; hvDiscGap itself was not touched -- disc count is downstream of it, not independent evidence about it |

53 was the value `reference-designs.test.mjs` asserted as exact for a time;
demoted to a Group 2 known gap in the same commit as the packing fixes
(section 10), since the assertion depended on window-height numbers that
moved out from under it, not because `hvDiscGap` itself was found wrong.
Not the sheet's own stated average gap either, at any of these three values
(97.5 mm over 43 gaps at 1250 kVA, 2.3 mm) -- this engine's own axHV/rdHV
conductor sizing has never matched the sheet's closely enough to make that
comparison direct.

Should come out of a real axial design instead of being tuned: MANUFACTURING.md
section 6's own axial spacer and gap schedule, once the engine has an actual
dielectric/cooling-driven gap model to replace the single averaged constant
with. Flagging it here, with its own history, so it is re-examined when that
lands rather than carried forward silently as if the current 3.5 mm were
confirmed by the disc count it happens to produce today.

---

## 8. Covered conductor weight, additive alongside bare

`designTransformer` now returns `wLVCovered`/`wHVCovered` next to the existing
`wLV`/`wHV` (packages/engine/index.js). Bare is the copper/aluminium alone;
covered adds the paper covering's own volume at 1150 kg/m³, the same density
`wIns` already uses for cylinder insulation, not a new constant. LV's covering
(`p.lvIns`) sits once per radial position (the same geometry `lvRadial`
already builds from) -- extra area per elementary conductor is `foilW x lvIns`,
nothing added on the axial edge. HV's covering (`p.hvPaper`) is already
documented as the full "on diameter" addition and is what the winding geometry
itself adds to `axHV`/`rdHV` for group and layer spacing, so covered area is
`(axHV+hvPaper)(rdHV+hvPaper)` against the single full-section `aHVreq` --
not `conductorSchedule`'s later per-strand split, which is its own unconfirmed
heuristic (`HV_STRAND_MAX_MM2`, see its own note above) and was never fed back
into this geometry either.

This is purely additive: the detailed BOM still prices bare mass (`d.wLV`,
`d.wHV`), unchanged, and no golden number in `engine.test.mjs` or
`reference-designs.test.mjs` moved. **Not an `ENGINE_VERSION` bump**, same
reasoning as DEFAULT_RATES above -- nothing about how an existing priced value
is computed changed; this only adds a new one.

Both figures are now shown wherever mass is reported: the calc sheet's
Conductor Weight row (now split bare/covered) and `conductorSchedule`'s `lv`/
`hv` entries (`weight: {bare, covered}`, alongside the existing bare/covered
dimension fields it already carried for HV and now carries for LV too).

### What it does to the reference comparisons

Checked directly against both sheets before touching anything (`_tmp` script,
not kept):

| | Bare | Covered | Sheet | Bare dev. | Covered dev. |
|---|---|---|---|---|---|
| 630 kVA | 288.6 kg | 299.0 kg | 292 kg | -1.15% | +2.38% |
| 1250 kVA | 573.5 kg | 588.0 kg | 982 kg | -41.60% | -40.12% |

**630 kVA** (the only hard assertion, `reference-designs.test.mjs`'s "copper
mass kg" against 292 kg ±5%/±14.60 kg): covered mass moves the deviation from
1.15% under to 2.38% over -- the sign flips, roughly the 4-5% shift expected,
but both sides sit well inside the ±5% tolerance, so the assertion does not
fail either way. Not changed yet, pending instruction on whether the
assertion should compare against covered mass instead of bare -- the sheet's
292 kg is far more likely to be the covered figure a designer would actually
write down, which would make covered the more honest comparison, but that is
a decision about what the test asserts, not something this check settles by
itself.

**1250 kVA** (982 kg, not asserted -- CALIBRATION.md's own reference-design
summary only): bare is already 41.6% under the sheet figure, and covered
barely moves it, to 40.1% under. The paper covering cannot be the explanation
here -- a covering allowance large enough to close a 41% gap would not be a
covering allowance, it would be most of the conductor's own mass again. This
gap predates this check, is not new, and is not explained by it. Either the
982 kg figure is not a like-for-like comparison to the engine's own
LV+HV conductor total (it may include material this design's `wLV`/`wHV`
were never meant to cover -- tap leads, connections, bracing), or there is a
real, separate discrepancy in the 1250 kVA winding build that covered weight
does not touch. Flagging this rather than guessing which.

**Correction (section 14): the table above predates the radial-packing
fixes.** Re-run on the current engine, same unfit reproductions:

| | Bare | Covered | Sheet | Bare dev. | Covered dev. |
|---|---|---|---|---|---|
| 630 kVA | 279.7 kg | 289.0 kg | 292 kg | -4.2% | -1.0% |
| 1250 kVA | 553.9 kg | 566.6 kg | 982 kg | -43.6% | -42.3% |

630 kVA moved more than a rounding amount: covered used to sit 2.38% *over*
the sheet, now it sits 1.0% *under* -- still comfortably inside the ±5%
tolerance either way, so no test outcome changes, but the sign flip means
"covered mass is slightly high" is no longer an accurate description of where
630 kVA sits. 1250 kVA's gap is materially unchanged in shape (still a large,
unexplained shortfall covering cannot account for) but moved from -41.6%/
-40.1% to -43.6%/-42.3% -- consistent with, not contradicting, section 14's
own finding that the LV area gap and the packing fixes are two different
things moving in different directions on this reference.

## Not adopted

Their 7600 W load loss at 1250 kVA is a premium low-loss design, not a schedule
figure. The engine's Level 2 estimate for that rating is 12,253 W. Do not adopt
their losses as defaults.

**Correction, load loss coefficient section, below.** The 12,253 W figure above
was itself the evidence that the old coefficient (52) was wrong, not evidence
that 7600 W was unusually premium. At the corrected coefficient (32), the
engine's own Level 2 estimate for 1250 kVA is 7540 W -- 7600 W is a completely
ordinary Level 2 figure, not a premium one. The instruction not to design
*toward* a specific transformer's own guaranteed number still stands (a real
enquiry's own guarantee should always win over the schedule estimate, whichever
it is), but the characterisation of this particular number as exceptionally low
was wrong and should not be repeated.

---

## 9. Second costing model: the designer's own per-kg card

`cardCostModel(d, rates, cardRates, extra)` (packages/engine/index.js) is a
second, independent way to price a design, additive alongside `buildBOM` --
neither replaces the other and they are not meant to reconcile to the same
total. It exists because a working designer does not price a transformer the
way the detailed BOM does; they fill in a short card by hand, and this
reproduces that card, not a summary of the detailed one.

Reproduced against a real one and checked to the rupee
(`card-cost.test.mjs`): **"630 KVA CU LEVEL 1 Costing & Data,"** a Mehir
Transformers sheet, oil-cooled with pressed-steel radiators.

| # | Line | Qty | Unit | Rate | Amount |
|---|---|---|---|---|---|
| 1 | Core | 966.769 | Kg | 240 | 232024.56 |
| 2 | L.T Weight | 170.96 | Kg | 1415 | 241908.40 |
| 3 | H.T Weight | 323.64 | Kg | 1415 | 457950.60 |
| 4 | M.S Channel | 83.91 | Kg | 70 | 5873.70 |
| 5 | M.S Sheet | 349 | Kg | 86 | 30014.00 |
| 6 | Oil | 588 | Ltrs | 115 | 67620.00 |
| 7 | PSR 300x800 | 28 | No's | 600 | 16800.00 |
| 8+9 | Insulation & Fitting, Bushing & Metal Parts | -- | -- | -- | 75000 (Extra, one line) |
| | **Total** | | | | **1127191.26** |

Design decisions, each because the sheet itself demanded it, not by default:

- **Core, frame steel, tank steel and fluid share `rates.core`/`frameMS`/
  `tankMS`/`fluid`** with `buildBOM` -- the same rate card, so both models
  move together when a project's rate card changes them. Nothing here forks them.
- **LT/HT weight are priced on covered conductor mass**
  (`wLVCovered`/`wHVCovered`, section 8 above), not the bare mass
  `buildBOM`'s WD-01/WD-02 lines use. This is the one place the two models
  genuinely disagree on quantity, not just on markup structure -- a
  designer's card is pricing what is actually wound, paper included.
- **The panel row has no `buildBOM` equivalent.** `buildBOM` prices cooling
  surface by mass (`TK-02`, kg x `r.fin`/`r.radiator`); this model prices it
  by panel count x `cardRates.finPanel` (a new rate, 600/panel from the
  sheet, kept in its own small `DEFAULT_CARD_RATES` rather than added to
  `DEFAULT_RATES` -- the existing rate card and its UI are unchanged, per
  instruction). Panel count comes from `finLayout(d).n`, the same derivation
  the drawings already use, not invented here.
- **Extra (rows 8 and 9) is never computed, and never will be.** There is no
  single physical driver for "insulation, fittings, bushings and metal
  parts" the way there is a mass for everything else on the card --
  reproducing it as a formula would be inventing engineering data the sheet
  itself does not provide either; the designer who filled in 75000 did not
  derive it from a formula, they judged it. It is a manual entry, defaults
  to 0, and stays that way.
- **No overhead, scrap, margin or GST layer.** The sheet has none -- labour
  and miscellaneous are already inside Extra. Applying `buildBOM`'s markup
  chain on top of this total would double-count what Extra already covers,
  and the result would stop being the card this was built to match.
- **Dry designs** drop the oil and panel rows, mirroring `buildBOM`'s own
  dry/oil branch (enclosure mass in the M.S Sheet row instead of tank mass).
  Not confirmed against any real dry cost card -- the one sheet this model
  was built against is oil-cooled with radiators.

**Not an `ENGINE_VERSION` bump**, same reasoning as `DEFAULT_RATES` and
section 8 above: nothing about how `buildBOM`'s own priced values are
computed changed, and no golden number moved. This adds a second, separate
way to price a design; it does not alter the first.

---

## 10. Radial packing: the duct rule and the LV axial x radial split

Two bugs, found while chasing the 1250 kVA copper gap (section 11), both
confirmed against real evidence independent of each other and of anything
still open.

**Radial cooling ducts (ENGINE_VERSION 1.8.0).** The old LV rule added a duct
whenever total radial thickness exceeded 22 mm, and could never produce zero
ducts at all -- every LV winding carried at least one. The 1250 kVA sheet's
own insulation list settles this directly: its ducts are the LV-HV barrier
and the HV coil-to-coil gaps, both already modelled elsewhere (`lvHvClr`,
`groupGap`) -- the hilo build-up reads LV OD 374, former 382, cylinder 386,
duct, HV ID 396, placing the duct outside the LV coil. The LV bundle itself
has no internal duct. A duct exists so a strand's own heat is not forced to
conduct through every other strand radially outward from it -- what matters
is how many radial LAYERS deep the stack is, not how many millimetres that
happens to be. A single 6-strand radial stack is 40 mm thick and cools from
both faces same as a thin one; four layers of the same conductor is a real
barrier regardless of thickness. Both the LV and HV rules now key off radial
layer count: `ductLayers1`/`ductLayers2`/`ductWidth` (default 2/4/6 mm,
editable) -- none at one layer, one at two or three, two at four or more.
HV's rule was already layer-based (`floor(layers/6)`, capped at 2) but at a
much higher threshold; changed to the same thresholds for the same reason,
though neither reference's HV layer count (12, 13) sits low enough for this
to move either reference's HV duct count.

**LV axial x radial split (ENGINE_VERSION 1.9.0).** The old rule picked
`lvRadCount = round(sqrt(n/aspect))`, `lvAxCount = ceil(n/lvRadCount)` from
`lvStripAspect` (default 3.5) alone -- coil height played no part in the
choice, only in how many radial LAYERS of turns the result needed
afterward. Algebraically `axCount/radCount` reduces to `aspect` at every n,
so the ratio could never shift toward more-radial as current (and so n)
rises, which is what a real winding does: axial strands must all fit inside
the coil height, radial strands are limited only by build depth. The two
references bear this out directly -- 840 A per turn (630 kVA) gives 4 axial
by 2 radial, 1667 A per turn (1250 kVA) gives 5 by 6: current roughly
doubles, radial count triples, axial barely moves. Rewritten so axCount
comes from how many strand-widths `hLV` can hold (times `nLV`, since every
turn needs the same room to share one radial layer), and `radCount` absorbs
the rest: `axCount = floor(hLV / ((side + lvStripGap) * nLV))`,
`radCount = ceil(n / axCount)`, strand sized square from its own share of
`aLVreq` (no separate strand aspect ratio needed any more). Confirmed exactly
at 630 kVA (4x2, no tuning) and directionally at 1250 kVA (4 axial x 5
radial against the old rule's 9 axial x 2 radial -- the ratio flips the
right way). Feeding the sheet's own implied LV area (1148 mm^2, section 11)
through this same formula at 1250 kVA's own hLV gives 5x6 exactly, the
sheet's own arrangement -- the split formula is confirmed correct in shape;
what still blocks the exact count is the area question below, not the split.
`lvStripAspect` is retired, not re-fitted: there was never a value of it that
could reach both references at once, because the ratio it controlled did not
move with scale at all.

**Removing two compensating bugs made the real gap worse, not better.**
Both bugs were adding radial depth neither real winding has, which was
quietly padding out an already-short LV area enough to pass LV OD (1250) and
LV radial build (630) against the sheets. With both fixed, 1250's LV OD
moved from -1.5% to -6.8% (now fails its own 3% tolerance) and 630's LV
radial build, previously 20.29 mm against a 20 mm target, reads 12.85 mm
(-35.75%) once genuinely duct-free at one layer. Neither number got worse
because the fix was wrong -- both got worse because the padding that used to
hide the real shortfall is gone. Demoted to Group 2 known gaps in
`reference-designs.test.mjs` (with `Disc count`, downstream of the same LV
area gap through the shared window-height solve), each recording the new
baseline against section 11 below, not treated as a defect of its own.

## 11. Open questions: HV conductor shape, and design margin vs densitySuggest accuracy

**The `densitySuggest` half of this is RESOLVED in section 72.** The
question below -- whether the margin is rating-dependent or
`densitySuggest` is simply wrong -- is answered by a third reference with
its density stated outright: the oil baseline is about 1.72x too high,
flat across 315 and 1250 kVA, and this section's own 1250 kVA figure
(~1.44 against a 2.5 suggestion) was already that same ratio. The HV
conductor shape question below is still open.

Two things investigated while chasing the 1250 kVA copper gap that are not
settled, and should not be settled by fitting a constant to two points.
Recorded here as open, with the evidence gathered, rather than inferred.

**HV conductor shape.** `rdHV = sqrt(aHVreq/2.1)`, `axHV = 2.1 * rdHV` -- a
fixed 2.1 ratio, algebraically the same structural defect `lvStripAspect`
turned out to be: independent of scale, no response to per-turn current.
1250 kVA's HV carries 37.9 A per turn against 630 kVA's 19.1 A (phase
current -- both windings are Delta, so this is line current divided by
root 3, not the line figure itself). Whether one scale-aware rule reaches
both is exactly the question the LV split answered, but it cannot be
checked: neither sheet states HV conductor dimensions or strand count for
either reference. Blocked on data -- see DATA-REQUEST-2026-08-11.md item 5.
Not touched.

**Design margin.** Even `fitToSchedule` converged cleanly against the real
declared load loss (1250 kVA, limitLL 7600 W) still lands 21.5% short of the
real LT copper. Back-solving what fraction of the declared limit
`fitToSchedule` would need to target, in place of the 0.96 hardcoded today,
to reproduce each reference's own copper mass:

| Reference | Margin needed |
|---|---|
| 1250 kVA | 0.80 to 0.85 (LT closes nearest 0.80-0.82, HT nearest 0.85) |
| 630 kVA | 1.05 |

These do not reconcile to one value, and not by a small amount -- 630 kVA
needs to build AT or slightly PAST its declared limit, the opposite
direction from 1250 kVA needing to build 15-20% inside it. The likely reason:
630 kVA's raw, unfit `densitySuggest` (2.8 A/mm^2, already carrying the dry-
type correction from item 4 above) is already close to the sheet's own
2.79-2.89 A/mm^2 -- it does not need fitting, and running `fitToSchedule` on
it at any margin pulls it away from an already-correct starting point.
1250 kVA's raw suggestion (2.5 A/mm^2) is badly wrong against its own
implied ~1.44 A/mm^2, so it genuinely needs the fitting mechanism to move it,
and a generous margin gets most of the way there. Two data points cannot
separate "the margin is rating-dependent" from "densitySuggest is simply
wrong at high per-turn current, and the margin experiment is compensating
for that error at 1250 kVA while fighting an already-good answer at 630
kVA." Both a margin parameter and a corrected `densitySuggest` are candidate
fixes; committing to either on this evidence would be exactly the curve-
fitting this document has avoided throughout. Not implemented.

**Why a real design carries copper beyond what its declared loss requires**,
worth recording even though the fix is not: (1) routine test tolerance --
a unit declared at 7600 W must measure under 7600 W on the test floor, so a
designer aims below the declared figure, not at it; `fitToSchedule`'s own
0.96 factor is already a version of this, just not necessarily the right
one. (2) short-circuit withstand and temperature rise both improve with
more copper, so there is a mechanical and thermal margin motive independent
of the loss guarantee entirely. `fitToSchedule`'s "cheapest that still
passes" is the correct behaviour for an optimiser searching a cost surface;
it is not necessarily the correct default for a design that has to survive a
routine test and a fault, which is a different question from whether it
minimises ex-works price.

What would settle both: HV conductor data (item 5) for the shape question;
a third reference at a different rating, with its own declared AND measured
loss figures both, for the margin question -- measured is what would let a
margin be read directly rather than back-solved from copper mass.

---

## 12. Core cutting chart, DRAWINGS.md drawing 22

Lamination is slit to standard widths, not cut to a continuous circle-
packing optimum -- the 1250 kVA chart runs 270 down to 50 in 10 mm steps
where `stepWidths`'s own unsnapped optimum for this diameter and step
count ends at 42. `stepWidths` now takes an `increment` (default 10,
editable via `p.stepIncrement`) and rounds every width UP to the next
multiple -- never down or to nearest, since a step narrower than its
standard width would under-fill the circle at that radius, and a real core
never does. Only width is snapped; stack depth is untouched, since
standardising width is a slitting-stock decision independent of lamination
count. `engine.test.mjs`'s classical-utilisation check now passes
`increment: 0` explicitly, since that check is deliberately testing the
pure continuous packing formula against Sawhney's own published table, a
different question from what real stock gives.

Snapped, the 1250 kVA reference's 15 steps read 270, 270, 260, 250, 240,
220, 210, 200, 180, 160, 150, 130, 100, 80, 50 -- close to the chart's own
270, 260, 250, 240, 230, 220, 210, 200, 180, 160, 140, 120, 100, 80, 50
without being fitted to it point for point, and the last step matches
exactly (50), settling the specific 42-vs-50 discrepancy that started this.

**Three plate types**, drawing 22, a different document from drawing 21's
cutting schedule (`stampingSchedule`, untouched) -- that one models limb
and yoke from a mitred long/short edge average; this models limb, half
yoke and full yoke, because that is the layout the real chart actually
uses. All three lengths are fitted to the one chart on file, CALIBRATION.md
style: the simplest relationship that reproduced its own plate total
without a free intercept, checked against the chart's real numbers before
being kept, not tuned until they matched:

| Plate | Formula | This engine | Chart | Deviation |
|---|---|---|---|---|
| A, limb, mitred both ends | length = 2 x width | 612.49 kg | 621.09 kg | -1.4% |
| B, half yoke, step-lap | 25% of C's own steel, cut in two | 271.33 kg | 263.822 kg | +2.8% |
| C, full yoke, mitred one end | length = 2cc + width | 822.45 kg | 788.84 kg | +4.3% |
| Core total | | 1706.28 kg | 1672.8 kg | +2.0% |

Plate C's formula is not new -- it is `stampingSchedule`'s own existing
`yokeLong` edge, applied with the one mitre Plate C actually has instead of
averaged against a short edge that does not exist on a single-mitre piece.
Plate B is not a separate geometric formula at all: it is Plate C's own
steel for its 25% share of the yoke sheet count, cut as two half-length
pieces per layer instead of one -- mass-conserving by construction, so its
weight needs no formula of its own, only the split fraction (confirmed
against the chart's own 263.822/788.84 kg split, 0.2506 against a stated
0.25) and the 50/25/25 division of its own sheets across the 0, 10 and
20 mm step-lap shifts, which was stated directly, not fitted. Confirms the
stated relationship directly: C minus A grows across the steps at this
reference, from 738.6 mm at step 1 to 958.6 mm at step 15, because A
shrinks (2 x width) while C barely moves (2cc + width, against a cc more
than double any single step's width).

All three formulas carry the same caveat every other single-chart-fitted
constant in this document already does: confirmed at one rating, not
checked away from it. `reference-designs.test.mjs` asserts each plate and
the core total within 5% of the chart -- ask for a second real chart, at a
different rating, before trusting any of the three formulas far from 1250
kVA.

## 13. A fourth no-load reference point -- and a correction to the third

The 1250 kVA chart gives flux density, core mass and no-load loss
together for the first time: **1.600 T, 1672.8 kg, 1400 W.** Every earlier
reference point (this document's own two designs, CALIBRATION.md items
1-6) gave loss alone, or loss with turns -- never flux and mass alongside
it, which is what would let the no-load coefficient actually be solved
rather than inferred from a mismatch elsewhere (section 11's own open
question). Recorded here as a fourth data point. **The coefficient (4.6)
is not changed.**

**Correction, checked before recording anything:** the design margin
section (11) quoted this engine's own reproduction as 1.46 T and 2094.7 kg
against the chart's 1.600 T and 1672.8 kg, "25% heavy." That comparison
predates the radial-packing fixes (section 10) -- re-run now, on the same
unfit reproduction (`autoFit: false`, the sheet's own volts per turn and
step count, per this file's own convention), this engine gives **flux
1.600 T -- an exact match -- and core mass 1819.0 kg**, not 1.46 T and
2094.7 kg. The window-height solve both flux and core mass depend on
shifted when the packing bugs were fixed, and the old comparison was never
re-run afterward. Recording the current, correct figures rather than
repeating a stale one.

Checked two ways, both independent of the design reproduction above (using
the chart's own stated flux and mass directly, not this engine's own
window-height solve, so neither result depends on anything in section 11
still being open):

- **The schedule coefficient itself** (`lossSchedule(1250, "level2", false)`,
  coefficient 4.6): predicts **1431.4 W** against the chart's declared
  1400 W -- 2.2% over. Closer than the "25% heavy" framing suggested,
  because that framing was comparing whole-design reproductions carrying
  the now-fixed packing bugs, not the coefficient against the chart's loss
  figure directly.
- **This engine's specific-core-loss physics** (`wPerKg`, independent of
  the 4.6 schedule coefficient -- grade reference loss and the 1.9
  exponent), evaluated at the chart's own 1.600 T: predicts **0.8627 W/kg**,
  which at the chart's own 1672.8 kg core gives **1443.1 W** against the
  declared 1400 W -- 3.1% over. The core mass this engine's own physics
  would need to hit 1400 W exactly at 1.600 T is 1622.8 kg against the
  chart's real 1672.8 kg -- 3.0% under.

Both checks land within 2-3% of the chart's guarantee, not the roughly 25%
gap the pre-packing-fix comparison showed. This does not confirm 4.6 is
right -- one point checked two ways is still one point, and 2-3% is well
within what a single reference could be showing by coincidence rather than
settling anything -- but it removes the specific evidence ("25% heavy")
that made this rating look like a clear case for lowering the coefficient.
The honest state of section 11's open question is unchanged by this: still
open, still not to be settled on one chart, now with a data point that reads
considerably closer than previously recorded, not further away.

---

## 14. Re-audit after the packing fixes -- the no-load coefficient case, corrected

Every conclusion in this document that rests on a full design reproduction
(window height, HV/LV construction, core or winding mass) was checked
against the current engine, not assumed current. Pure-formula claims --
lossSchedule's own load loss table (section 6, re-verified: 4461.1 W and
7540.2 W, unchanged to the first decimal, since lossSchedule takes kva
alone and nothing about it moved), the clearance ratio (section 1),
DEFAULT_RATES (section 7), the card-cost validation (section 9, built from
the sheet's own literal figures, never this engine's own reproduction) --
do not depend on the window-height solve and are confirmed unaffected.
Three did depend on it and needed correcting: the covered-mass comparison
table (section 8, corrected in place above), the 1250 kVA cost illustration
(section 1, corrected in place above), and the no-load coefficient case
itself, which is large enough to need its own account here.

### The no-load coefficient case no longer stands as recorded

Section 6 argued 4.6 was too tight from two pieces of evidence: a 630 kVA
joint search that could not meet its own no-load ceiling "at any K... 3-20%
over depending on K," and (from the chart, section 13) a 1250 kVA
reproduction "25% heavy" against the real core. Section 13 already
corrected the second -- re-run, this engine matches the chart's flux
exactly and its schedule-vs-guarantee check lands within 2.2%. Checking the
first the same way, on the current engine, directly:

**630 kVA, joint search (flux and density both refit at each K,
`computeDesign` itself, not an approximation):**

| K | Flux | No-load | Limit | Over | Compliant |
|---|---|---|---|---|---|
| 0.40 | 1.420 T | 823 W | 825 W | -0.2% | **yes** |
| 0.44 | 1.420 T | 836 W | 825 W | +1.4% | no |
| 0.48 | 1.420 T | 880 W | 825 W | +6.7% | no |
| 0.52-0.70 | 1.420 T | 937-1162 W | 825 W | +13.5% to +40.8% | no |

K = 0.40 is fully compliant -- no-load, load loss, impedance, oil and
winding rise all pass (`compliance.nll.ok` through `compliance.wRise.ok`,
checked directly, not inferred). **"Cannot meet its own no-load ceiling at
any K" is false at the current engine.** A compliant, cheap design exists;
the original investigation did not find it.

**1250 kVA, the same check:** K = 0.40 through 0.52 are *all* compliant
(flux drops as low as 1.420 T at the floor, no-load lands 1379-1389 W
against a 1431 W limit, 3.0-3.6% under). The engine's own AUTO search
(`computeDesign(core1250, {autoFit: true})`, no override at all) lands on
**etK = 0.50, flux 1.420 T, no-load 1379 W, fully compliant.** The default,
no-intervention 1250 kVA enquiry is no-load compliant today. This is the
same reversal as the chart comparison in section 13, from the opposite
direction: not "the chart shows we are heavy," but "our own unprompted
suggestion is not heavy at all."

**Why 630 kVA still LOOKS non-compliant in normal use, and why that is not
evidence about the coefficient.** `computeDesign(core630, {autoFit: true})`
with etK on AUTO lands at etK = 0.66, still over limit -- not because K=0.40
is not there, but because `etkCurve` (CALIBRATION.md item 2) freezes flux
and density at whatever `fitToSchedule` already settled with the *default*
etK before sweeping, rather than refitting both at every K the way the
table above does. Checked directly: every single point on 630 kVA's own
`etkCurve` sweep reports `feasible: false`, including K = 0.40 -- the sweep
itself never sees the compliant point the joint search finds two rows
above. This is a real, current limitation of the AUTO search mechanism,
already partly documented (item 2's own "why the swept range" discussion,
the residual-mass investigation's K=0.42-vs-0.545 finding) -- it is a
search-quality gap, not evidence the loss schedule itself is unreachable.
Not fixed here; flagging the distinction is the point of this entry.

**Checked a third way, independent of any search:** `lossSchedule`'s own
no-load coefficient against each sheet's real guaranteed figure directly,
no fitting or search involved at all --

| Rating | Schedule (coefficient 4.6) | Real guarantee | Deviation |
|---|---|---|---|
| 630 kVA | 1195.6 W | 1300 W | **-8.0%** (schedule under-predicts) |
| 1250 kVA | 1431.4 W | 1400 W | **+2.2%** (schedule over-predicts) |

The two real points pull in *opposite directions* -- 630 kVA says the
coefficient should be higher, 1250 kVA says it is already very close to
right, if anything fractionally high. A coefficient that is uniformly "too
tight" would miss the same direction at both ratings; this one does not.
That is what a reasonably-calibrated coefficient checked against two
mid-range points looks like, not what "too tight" looks like.

### What this changes

Every specific piece of evidence this document previously recorded for
"4.6 is too tight" has either reversed or was already corrected:

- 630 kVA "unsatisfiable at any K" -- **false**, corrected above.
- 1250 kVA "25% heavy" against the chart -- **corrected in section 13**,
  now 2.2-3.1% agreement.
- 1250 kVA AUTO search -- **compliant**, not heavy, checked directly above.
- Direct schedule-vs-guarantee check -- **splits in opposite directions**,
  not a one-sided miss.

**The coefficient is not changed by this entry either.** This does not
prove 4.6 is correct -- two mid-range points splitting in opposite
directions is consistent with "about right" but is not proof of it, and
the exponent (0.805) remains just as unconfirmed at the ends of the range
as section 6 already said. What this entry does is remove the specific
evidence that was previously used to argue the coefficient needed lowering.
The case for touching it is now considerably weaker than what was on
record, not stronger -- exactly the kind of thing worth finding out before
acting on it rather than after. DATA-REQUEST-2026-08-11.md item 1 (more
real no-load figures away from the middle of the range) is unchanged as
the thing that would actually settle it.

---

## 15. wCore's limb term corrected to match the cutting chart

Not a calibration change -- two formulas in the same engine disagreed about
the same physical steel, and section 12/14's own investigation localised
which one to trust. `wCore`'s limb term used to be `aGross x 3 x Hw`,
treating every lamination as if it ran the full window height regardless of
step. A mitred-both-ends limb lamination's own length is `2 x width`
(drawing 22's Plate A, validated against a real cut plate to -1.4%), not
`Hw`. The limb term is now computed the same way Plate A is -- the same
`stepWidths` call, the same snapped widths real slit stock uses -- so
`wCore` and the cutting chart agree on the limb by construction, not by
coincidence. The yoke term is untouched: it already matched Plate B + Plate
C to within 0.5 kg on the reference checked, so there was nothing there to
fix.

1250 kVA reference, before and after:

| | Limb | Yoke | Core total | vs cutting chart (1706.3 kg) |
|---|---|---|---|---|
| Before | 725.7 kg (`aGross x 3Hw`) | 1093.3 kg | 1819.0 kg | +6.6% |
| After | 612.5 kg (Plate A, per step) | 1093.3 kg | **1705.8 kg** | +0.5 kg |

Core mass fell 113.2 kg on this reference -- almost exactly the internal
inconsistency section 14 measured between the two formulas, because that is
what it was. `design.wLimb`/`design.wYoke` are now exposed alongside
`wCore` (also split out on the calc sheet's own Core Weight rows), and the
default 1000 kVA case moved with everything downstream of it: less core,
less no-load loss, `compliant` flips to `true`, `etkNonCompliant` flips to
`false` -- a design that used to be flagged unable to meet its own no-load
ceiling at any K now can, because the core the old formula thought it
needed to build was never real. Every golden number in `engine.test.mjs`
moved and is recorded there with this reasoning; `reference-designs.test.mjs`
did not move at all, since both reference reproductions fix `etK`/`steps`
explicitly (`autoFit: false`) and `wCore` was never part of the
window-height solve either formula fed -- only the reported mass changed,
which is exactly what the cutting chart assertions there were already
checking.

### The no-load coefficient, checked once more -- not changed

Section 14 checked the coefficient against the old, inflated core mass.
Re-checked against the corrected one, same method, same two generic
no-override enquiries as section 14's own table (not the sheet
reproductions, which fix losses directly and were never testing the
schedule):

| | Before (section 14) | After (this fix) |
|---|---|---|
| 630 kVA AUTO, etK | 0.66, non-compliant | **0.52, compliant** (797.5 W against 825.0 W, -3.3%) |
| 1250 kVA AUTO, etK | 0.50, compliant, 1379 W (-3.6%) | **0.50, compliant, 1241.1 W (-13.3%)** -- more comfortably compliant, not less |
| 1250 kVA, sheet's own unfit reproduction | 1569.3 W against 1400 W declared, **+12.1%** | **1471.6 W against 1400 W, +5.1%** |

630 kVA's AUTO search no longer needs the separate K=0.40 manual check
section 14 relied on -- with the corrected mass, more points on `etkCurve`'s
own sweep read feasible, and the search finds a compliant point on its own.
That etkCurve/joint-search gap section 14 flagged as separate from the
coefficient question is accordingly less visible now, though not
necessarily closed at every rating -- not re-verified beyond these two.

Two checks are unaffected by this fix entirely, because neither depends on
this engine's own `wCore`: `lossSchedule`'s coefficient against each real
guarantee directly (630 kVA -8.0%, 1250 kVA +2.2%, unchanged to the first
decimal) and the chart's own external flux and mass run through `wPerKg`
(1443.1 W against 1400 W declared, +3.1%, unchanged) -- both were already
independent of the bug this section fixes, which is exactly why they did
not move.

**Coefficient not changed.** Every figure above moved toward compliance,
not away from it -- the corrected geometry makes 4.6 look, if anything,
slightly better calibrated at both ratings than section 14's own read
already suggested, not worse. That is not evidence for changing it either:
the two real guarantees still split in opposite directions on the one
check that does not depend on this engine's own geometry at all (-8.0% and
+2.2%), which is the actual test of the coefficient, and that test did not
move today. Recorded so the coefficient discussion sits on the corrected
core mass everywhere it is read, not so it can be acted on -- it still
cannot be, on two mid-range points.

---

## 16. Drawing 21 rebuilt on the same limb and yoke formulas as wCore and drawing 22

Section 15 fixed `wCore`'s limb term and left drawing 21 (the cutting
schedule, `stampingSchedule`) alone -- which meant it now disagreed with
`wCore` by 14-16% instead of the ~3% recorded before, since the two used to
share the same `Hw`-based limb shortcut and now only one of them did. Two
cutting documents in the same tool disagreeing by that much means a shop
can be quoted two different steel weights for the same core, so this was
not left as a second "acceptable discrepancy."

**Limb**, rebuilt the same way section 15 rebuilt `wCore`'s: average length
2w (Plate A, drawing 22, validated to -1.4% against a real cut plate),
combined with the 45 degree both-ends mitre relationship (long - short =
2w, a geometric fact of the mitre angle, not a second fit) to recover the
edges separately -- short = w, long = 3w. Not two independent guesses: one
validated average and one geometric constraint, solved together.

**Yoke, found while fixing the limb, not assumed to already be right.**
Rebuilding only the limb exposed a second, independent error that had been
sitting underneath it: drawing 21's yoke average was `2C` (C = limb centre
distance) alone, missing the `+dCore` term `wCore`'s own yoke span
(`2*cc + dCore`) always carried -- the outer limbs' own width, the same
"outside-to-outside" allowance every other yoke-length figure in this
engine already includes. Checked directly: with the old `2C`-only average,
drawing 21's yoke total ran 888.8 kg against `wCore`'s own 1093.3 kg on the
1250 kVA reference -- 18.7% short, invisible before this because the
limb's own +18.5% overstatement was landing the *combined* total close to
`wCore`'s old (also inflated) figure. Two wrongs, not an agreement.
Corrected to `2C + dCore + w` / `2C + dCore - w`, average `2C + dCore`,
matching `wCore`'s own yoke term -- same mitre relationship preserved,
only the anchor fixed.

1250 kVA reference:

| | Drawing 21 total | wCore | Deviation |
|---|---|---|---|
| Before section 15 (both Hw-based) | 1943.4 kg | 1819.0 kg | +6.8% |
| After section 15 alone (limb fixed, yoke not) | 1943.4 kg (unchanged) | 1705.8 kg | +13.9% |
| After this section (both fixed) | 1739.8 kg | 1705.8 kg | **+2.0%** |

The remaining ~2% is not a formula disagreement -- `stampingSchedule`
reports mass off the continuous stack depth per step; `wCore` and drawing
22 both round to a whole sheet count first (`Math.max(2, Math.round(stack
/ thk))`) and derive mass from that. Real integer sheets versus a
continuous approximation, not error. `reference-designs.test.mjs` now
asserts drawing 21's total against `wCore` directly (within 3%), not just
each against the real chart separately -- checking the two disagree by a
few per cent from counting whole sheets is the actual guarantee a shop
needs, not that each happens to be close to a historical reference on its
own.

DRAWINGS.md's own note on this is rewritten a third time, not patched --
the first two versions ("3% is acceptable," then "14-16% is now expected")
were both wrong in the same way: declaring a gap acceptable without
checking what was actually behind it. This time the check is the point,
not the conclusion.

## 17. Cooling, tank type and top-oil rise target as swept levers in searchDesigns

`searchDesigns` already swept core grade, flux, conductor material and
current density, tank type, and (opt-in) etK, steps and tap type. Cooling
type was entirely absent as a dimension, and top-oil rise target existed
only as a hardcoded binary gated by a boolean (`opts.allowHotter ? [45,
50] : [base.oilRiseTarget]`) rather than a real opt-in array like the
other levers.

**Rise target** is now generalised to the same opt-in pattern:
`opts.riseTargets` if supplied, else `[45, 50]` if `opts.allowHotter`,
else the design's own current value -- so no existing call site's
candidate count changes unless it opts in. This is a genuine cost lever,
not a cosmetic one: a lower target buys nothing but more fin/tank steel
for the same loss; a higher one (up to whatever the standard and fluid
ceiling in deriveSpec actually allow) saves tank steel at the cost of
running hotter. Both ends are gated by the same compliance check
(`d.compliance.rise.ok` and `d.compliance.wRise.ok`) every other
candidate is, so the trade is real, not free. `BudgetTab.tsx` now sweeps
`[current, current-5, current-10]` (floored at 30, deriveSpec's own
floor) by default in the live budget search.

**Cooling** is now a real opt-in dimension (`opts.coolings`, defaulting
to the design's own current value), wired the same way. It is
*deliberately not swept by default* in `BudgetTab.tsx`'s live search:
`buildBOM` has no line item for fans or oil pumps anywhere in the BOM.
A forced-cooling candidate (ONAF, OFAF, ODAF) needs less fin/tank steel
than ONAN for the same loss, so it would come out cheaper in this model
purely because its own fan/pump cost is missing, not because it
actually is cheaper. Sweeping cooling type in a live cost search before
that cost is added would recommend equipment this platform cannot
price. The engine-level capability is there for a caller that wants a
narrower, single-cooling-type re-check (e.g. "is ONAF ever cheaper than
ONAN at this rating, ignoring fan cost, purely to see the steel trade");
it should not drive the default search until fan/pump cost exists.

**Tank type** needed no change -- it was already swept
(`opts.tanks`, already wired into `BudgetTab.tsx`'s live search as
`params.dry ? [params.tankType] : ['fin', 'radiator']`). The user's
request to add it alongside cooling and rise target reflected what the
search was missing overall, not a gap in this dimension specifically.

Both dedup keys that identify "the same candidate" -- `searchDesigns`'
own internal `best` Map key, and `BudgetTab.tsx`'s separately exported
`candidateKey` (reused by `App.tsx` to match the previewed row) -- now
include cooling and rise target. Without this, two candidates differing
only in one of these new dimensions would either silently collapse to
one (the internal key) or be misidentified as each other in the results
table (the UI key).

ODAF's forced-cooling multiplier has always shared OFAF's 2.1 rather
than having its own -- this was already true, not changed here, but is
now recorded as a deliberate simplification in a code comment at the
point it is used: directed oil flow raises the winding-surface film
coefficient in a way this engine does not model separately from forced
air over a radiator.

No formula in `computeDesign`'s own reproduction path changed --
`searchDesigns` is a what-if search over the Budget tab, not part of how
a saved revision reprices on read. `ENGINE_VERSION` is not bumped for
this change; no golden number moved and none could, since the default
case never calls `searchDesigns`.

## 18. Outer design proportions -- reported in the calc sheet, checked against recalled figures

New calc-sheet section 10, "Outer design proportions" (unconditional, no
rate card needed -- moved the bom-gated materials section to 11 to make
room ahead of it, since these three ratios are geometry, not cost).
Three rows: fluid volume per kVA, tank-and-cooling mass per kVA, cooling
surface per kW of total loss. Reported as ratios rather than absolute
weights because a wrong tank/fin/oil figure is hardest to notice from an
absolute number alone, a 100 kVA tank "looks small" in kg either way, and
because the point of the request behind this was specifically whether the
small end of the range is dominated by tank and oil, which a ratio shows
directly and an absolute weight does not.

Current engine, IS Level 2, copper, ONAN, default fin/radiator crossover
(fin to 2500 kVA, radiator above), across the range:

| kVA | Oil, L/kVA | Tank, kg/kVA | Tank + fin, kg/kVA | Cooling surface, m2/kW loss | Tank type |
|---|---|---|---|---|---|
| 100 | 5.51 | 2.42 | 2.46 | 3.43 | fin |
| 250 | 2.82 | 1.18 | 1.30 | 3.68 | fin |
| 630 | 1.43 | 0.58 | 0.71 | 3.80 | fin |
| 1000 | 1.08 | 0.42 | 0.54 | 3.84 | fin |
| 1600 | 0.80 | 0.30 | 0.43 | 3.88 | fin |
| 2500 | 0.64 | 0.23 | 0.34 | 3.89 | fin |
| 5000 | 0.49 | 0.18 | 0.31 | 3.92 | radiator |

Confirms the shape of the claim this was asked to check: the small end
is dominated by tank and oil relative to rating, both ratios falling by
roughly a factor of 10 from 100 to 5000 kVA while the active part scales
far more slowly, because tank surface (which sets both steel and oil
volume) grows with the two-thirds power of a roughly-cubic volume while
kVA grows faster than that over most of this range.

Checked against two recalled reference figures, 4.56 L/kVA at 100 kVA
against 0.32 at 5000, and 2.40 kg/kVA tank at 100 against 0.44 at 5000.
Tank mass at 100 kVA matches closely (2.42 against 2.40). The other
three do not: oil per kVA is high by about 21% at 100 kVA and 53% at
5000, and tank mass at 5000 kVA moves the other direction from what was
recalled, 0.18 to 0.31 kg/kVA here (rising, not falling, from 2500 to
5000, where the tank type crossover to radiator also lands) against a
recalled 0.44. Rather than guess which figure moved, this is recorded
as-is: CALIBRATION.md sections 14 and 15 already found that this
session moved winding radial build and window height with the packing
and wCore fixes, both of which set tankW and tankH directly and so the
oil and tank figures with them, the same reason the no-load coefficient
comparison did not match a pre-fix recollection either. No fix is
proposed here; the current table is what the engine computes today, and
is what should be compared against, not re-derived to match an older
recollection.

## 19. Dual rating (ONAN/ONAF) from one tank -- what it would require

Investigation only, not implemented. Selling one physical build under
two name-plate points, e.g. 5000 kVA ONAN / 6250 kVA ONAF (the 0.8
natural-to-forced ratio in that example is the standard IEC/IS
convention, not a coincidence), is routine practice at this size and the
engine currently has no concept of it: p.kva is a single value that
drives turns, current density, loss targets and thermal sizing
throughout, and designTransformer evaluates exactly one rating against
exactly one cooling type per call.

What a dual rating actually needs, by what in the engine each part
touches:

1. Two rating figures, not one. The active part (core, windings, tap
   changer) is sized to the higher, forced-cooled rating -- that is what
   sets turns, conductor area and current density, since it carries the
   larger current. The natural rating is not a separate design, it is a
   derating of the same one: kvaNatural = kvaForced x naturalFraction
   (0.8 typically, per the convention above, but manufacturer and duty
   specific). core would need a second field, e.g. dualCooling and
   naturalFraction, alongside the single kva it already forces to mean
   "the rating this build is sized to."

2. Two loss guarantees, not one. lossSchedule and the compliance checks
   (d.compliance.nll/ll) are evaluated at whatever p.kva is. A dual-rated
   design is normally guaranteed at both points: losses at the forced
   rating are what the active part actually produces; losses at the
   natural rating are the same active part carrying less current, i.e.
   load loss scaled by naturalFraction squared, no-load loss unchanged.
   compliance would need to become two objects, or one with both points,
   and documentRegister and the report would need both nameplate loss
   lines, not one -- exactly the kind of change invariant 7 flags:
   landing this without reviewing documentRegister would leave a stale
   single-rating nameplate on a dual-rated design.

3. Two thermal constraints on one tank, not one. This is the part that
   is not just bookkeeping. designTransformer solves finAreaReq once,
   against one target rise, one loss figure and one forced multiplier
   (ONAN forced = 1.0 or ONAF forced = 1.5). A dual rating needs the SAME
   fin area to satisfy two separate checks at once: the top-oil and
   winding rise limits at the natural rating own (lower) loss with
   forced = 1.0, and the same limits at the forced rating (higher) loss
   with forced = 1.5. Whichever of the two is tighter sets the fin area
   actually built -- normally the forced point, since it carries more
   loss, but not provably always, and specifically not provable without
   computing both. The single solve for finAreaReq today would need to
   become a max over both evaluations, not a different formula, but it
   is a second evaluation of the same dissipation law, not a free
   extension of the first.

4. Fan and pump cost, which do not exist yet. Section 17 above already
   found buildBOM has no fan or pump line item at all -- ONAF is already
   free cooling capacity in the cost model today for a single-rating
   design, and a dual rating makes that gap load-bearing rather than
   cosmetic, since the fan bank is the entire mechanism that makes the
   forced point sellable. This has to be priced before a dual rating can
   be costed at all, not just before it can be searched over.

5. The nameplate and every document that echoes it. The rating plate,
   the test report, and any drawing that prints "kVA" currently assume
   one figure. A dual-rated nameplate carries both ratings and both
   loss and current figures against each, per IS 2026 / IEC 60076
   nameplate practice -- this is a documents-and-drawings change on top
   of the engine change, not instead of it.

None of this is a small add. It changes "one rating in, one design out"
(the assumption the whole engine is built on, computeDesign own
signature and every downstream consumer of p.kva) into "one rating pair
in, a design that is checked against both, sized by the harder one." The
natural place to start, if this is taken up, is item 3 (the dual thermal
constraint) and item 4 (fan/pump cost) together, since neither is honest
without the other -- a fin area sized for two points but costed as if
forced cooling were free is not actually costed for the design being
sold.

## 20. Cooling equipment cost: fans, oil pump and control gear

ENGINE_VERSION 1.13.0. Section 17 found buildBOM had no fan or pump line
item at all, so a forced-cooling candidate looked cheaper in a cost
search purely because that cost was missing. Closed directly: three new
buildBOM rows, gated on cooling type, computed from the design's own
geometry rather than a fixed count.

**Fan count** (CF-01, ONAF/OFAF/ODAF -- all three are air-forced, the
"AF" in each name): derived from finAreaReq (the cooling surface the
design actually needs) and forcedMul (1.5 ONAF, 2.1 OFAF/ODAF), not a
fixed number. finAreaReq x (forcedMul - 1) is the fraction of that
surface's dissipation forcing itself is contributing -- at forcedMul = 1
(ONAN) this is zero and fanCount is zero. Divided by a new fitted
parameter, p.fanUnitArea (default 3.0 m², range 1.5-8.0, deriveSpec's own
"Construction Constants" section, same as finDiss and tankDiss next to
it): the effective cooling surface one fan is assumed to service. This is
not sourced from any fan manufacturer's catalogue -- there is no textbook
or reference-sheet figure for it the way there is for the dissipation law
itself -- so it is fitted as a round, clearly-labelled placeholder in the
same category as the engine's other fitted-not-derived constants, meant
to be overridden once real fan air-delivery data is available. It only
ever affects a BOM quantity, never a compliance check, which limits what
a wrong value can actually do.

**Pump count** (CP-01, OFAF/ODAF only -- the oil-forced types): fixed at
1, one circulation pump set per cooling bank. Not derived from anything,
since there was no basis offered to derive it from and a single pump set
is the simplest defensible default; revisit if a specific rating is ever
shown to need more than one.

**Control gear and wiring** (CG-01, whenever either fans or a pump are
fitted): a lump, qty 1, per the request that this be a lump if that is
how the rate card works elsewhere -- it does, r.assembly and r.freight
are already lump rates.

**Rates**: DEFAULT_RATES gets coolingFan, oilPump and coolingControlGear,
all left at 0. Unlike core/condCu/tankMS (commodity rates) or even octc/
oltc/fittings/cableBox (accessory rates a real Mehir costing sheet gave a
figure for), there is no sheet and no commodity index behind a fan or
pump's rupee price -- it is a specific bought component whose price
depends on the vendor and spec chosen, not something to estimate from
first principles or borrow from an unrelated line. Left at 0 rather than
guessed: every ONAF/OFAF/ODAF BOM prices these rows at zero, visibly,
until a real quote is entered in the rate card (new "Cooling Equipment"
group in src/lib/rateKeys.ts, so the rate-card editor and item-master
picker both surface it the same way every other rate is surfaced). A
visible zero prompts entry; a plausible-looking nonzero figure would not
have, and would have been exactly the fabricated-looking value CLAUDE.md
invariant 5 rules out.

Verified: ONAN at 5000 kVA gets zero fan/pump rows (forcedMul = 1, no
behaviour change from before this section). ONAF gets fans only. OFAF and
ODAF get fans and a pump. All three forced types get the control-gear
lump. Default 1000 kVA golden case is ONAN, so none of engine.test.mjs's
existing goldens moved -- ENGINE_VERSION is bumped anyway (1.12.0 to
1.13.0) because this changes buildBOM's output shape and, once a real
rate is entered, its price, for every forced-cooled design: CLAUDE.md
invariant 4 is about what the formula can now produce, not only about
whether today's specific golden numbers happen to move.

With real cost now on these lines, section 17's reason for excluding
cooling from BudgetTab.tsx's default live sweep no longer holds. Cooling
is now swept there too, ONAN vs ONAF (not the full four -- OFAF/ODAF are
rarely the live cost question at the ratings this search normally runs
at, and each added cooling multiplies the whole grid, the same tradeoff
steps and tapType were already left out of).

## 21. Dual rating (natural + forced) as an optional second point

ENGINE_VERSION 1.13.0. Section 19 scoped this to the fin-area solve
specifically: the active part (turns, conductor area, current density)
stays sized to p.kva/p.cooling alone, exactly as a single-rating design
always has been; only the cooling surface needs to satisfy a second
point. Implemented as scoped, additive, off by default.

**core.dualRating** (boolean, false by default, alongside dualHV/dualLV
in the same "Rating & Enquiry" style -- a structural toggle, not a
derived parameter). When true, deriveSpec put()s three more fields, only
then, so a plain single-rating call site sees no new parameters at all:

- **cooling2**: the second rating's own cooling type. Auto-suggested as
  the natural type (ONAN) if the primary is forced-cooled, or the forced
  type (ONAF) if the primary is natural -- covers the dominant real case
  (X kVA ONAN / Y kVA ONAF) regardless of which one the user set as the
  primary rating.
- **kva2**: the second name-plate rating. Auto-suggested from kva by the
  0.8 IEC/IS natural-to-forced ratio between adjacent cooling stages, in
  whichever direction cooling2 implies (kva2 = kva x 0.8 if cooling2 is
  more natural than cooling, kva2 = kva / 0.8 if more forced), rounded to
  the nearest 25 kVA. Override with the declared figure.
- **limitNLL2 / limitLL2**: the second rating's own guaranteed-loss
  limits, auto-suggested from lossSchedule(kva2, ...) and overridable the
  same way limitNLL/limitLL already are (CLAUDE.md invariant 6).

**The fin-area solve** (designTransformer, oil branch): finAreaReq is now
the larger of two evaluations of the same dissipation law -- the primary
point's own loss and forced multiplier, and, when dualRating is on, the
second point's own loss (noLoad unchanged, loadLoss scaled by
(kva2/kva)^2 -- the same winding carrying less or more current) and
forced multiplier. tankDissip and the target rise are shared between both
checks: same tank, same standard, same fluid, only the loss and forced
multiplier differ. Whichever needs more area sets what is actually built.
oilRise/windRise (the primary point's own figures, used everywhere else
in the design) are recomputed against the FINAL finAreaReq, so if the
second point was the binding one, the primary point correctly shows up
running cooler than its own target, not at it -- the tank was not built
for the primary point alone. dualOilRise/dualWindRise are the second
point's own figures against that same final area.

engine.test.mjs adds a case at 5010/5000 kVA (deliberately close in kVA,
so the natural point's lower forced multiplier -- not a much smaller
loss -- is what has to win) confirming the natural check does bind over
the forced one there, and that both points land within the top-oil rise
limit once finAreaReq covers the larger of the two: exactly the "not
always the higher-loss point" case section 19 flagged before this was
built, now exercised on every test run rather than asserted from a
single hand check.

**Compliance and reporting**: a new dualCompliance object (nll/ll/total/
rise/wRise, null when dualRating is off) reports the second point's own
checks against limitNLL2/limitLL2 and the shared rise limits -- a
separate object, not folded into compliance/compliant, so no existing
caller of those (searchDesigns, fitEtkToCost) changes behaviour. The
nameplate (NamePlate.tsx) prints both ratings, both cooling types and
both load-loss/rise figures when dualCompliance exists, ordered by
ascending kVA for the conventional natural/forced reading regardless of
which one is params.kva. The routine test schedule
(routineTestSchedule) adds one row for the second rating's load loss,
explicitly labelled "calculated, not separately tested" -- IEC 60076-1
practice is one load-loss measurement, at the rating the existing row
already covers; the second rating's figure is a derating of that
measurement, not an independent guarantee, and the GTP should not claim
otherwise. ResultsDisplay.tsx adds a second Compliance card for the same
reason NamePlate does.

**Not done, deliberately out of the scope this was asked for**: no
second impedance figure. %Z is expressed on whichever rating's current
the design was built to (p.kva) -- section 19's item 1 and 2 (resizing
the active part's current/turns basis for a second current) were not
part of this request and are not implemented; only the thermal check
(item 3) was asked for and is what is built. A real dual-rated GTP
conventionally quotes %Z on one base for this same reason.

## 22. Known gap: dual-rated impedance is stated at the primary rating only

%Z = I_rated x Z_ohms / V_rated x 100. I_rated scales with kVA at fixed
voltage, so the same winding genuinely has a different %Z figure at a
different rating, not just a different loss -- unlike no-load loss
(same core, same flux, rating-independent) or load loss (a clean
current-squared scaling this engine already applies for the second
rating), impedance does not reduce to a scaling of the primary figure;
it would need its own calculation at kva2's own current.

Section 21's dual rating implementation does not compute it. This was a
deliberate scope boundary at the time (recorded there as "not done"),
but a boundary stated once in a markdown file a customer never sees is
not the same as the gap being visible where it matters -- a protection
engineer sizing relays or running a fault study off the second rating
needs this figure and would have no way to know it was never
calculated. Now surfaced in three places rather than left to this
document alone:

- **The engine** (packages/engine/index.js, designTransformer's
  compliance object): a comment at g.pctZ's own compliance check names
  the gap directly, so the next person reading dualCompliance does not
  assume it covers impedance the way it covers loss and rise.
- **The nameplate** (NamePlate.tsx): the Impedance field reads "X %
  (at Y kVA only)" when dual rating is active, instead of a bare
  percentage that would silently read as applying to both ratings.
- **The GTP / routine test schedule** (routineTestSchedule): the
  existing impedance row now names which rating it is stated at, and a
  new row explicitly states the second rating's impedance is not
  calculated, with a warning not to use the primary figure for
  protection studies at the second rating's point.

Not implemented, because it was not asked for and doing it honestly is
more than a scaling: it needs pctZ recomputed at kva2's own current,
which is g's own reactance/resistance geometry evaluated against a
different rated current -- not a trivial addition, and not attempted
here on the strength of "it would be nice to have" alone. A real
dual-rated GTP conventionally quotes %Z on one base for this same
reason (it is normal practice to declare which base an impedance figure
is on, not to avoid the question entirely) -- so stating the gap
honestly, rather than computing a second figure under time pressure, is
the more defensible choice today.

## 23. Cooling equipment rates: still zero, and why, plus a BOM warning

Section 20 left coolingFan, oilPump and coolingControlGear at ₹0 in
DEFAULT_RATES because there was no basis to set them from. Checked
again directly against this project's three reference sheets (1250 kVA
oil OLTC, both 630 kVA dry and 630 KVA CU Level 1 costing) before
writing this section: none of the three is a forced-cooled design --
all default to ONAN or are dry-type -- so none of them carries a fan,
pump or control-gear cost line to read a figure from. There is no
reference-sheet basis for these three rates, and none has been invented
in its place. They remain at ₹0, and a real quote from a fan/pump/
control-gear supplier -- or the figures already used on a past works
costing sheet for a forced-cooled unit, if one exists outside the three
sheets referenced so far -- is what should replace them, not an
estimate.

**BOM warning added** (buildBOM's new `warnings` array, ENGINE_VERSION
unchanged -- this is a reporting addition, not a formula change): when a
forced-cooled design carries any of the three cooling rows at ₹0, the
BOM now returns a warning naming which rows and which cooling type,
surfaced as a banner above the BOM tab (ResultsDisplay.tsx) and above
the printed report's Bill of Materials section (PrintReport.tsx) --
the two places a design actually gets quoted from. This is what CLAUDE.md
invariant 5 asks for directly: the dependent output (the BOM total on a
forced-cooled design) is marked, by name, as resting on a missing
parameter, rather than a ₹0 line sitting quietly among dozens of others
until someone notices.

**Fixed**: BudgetTab.tsx's default live search originally sequenced
this the wrong way round -- section 20 turned on the ONAN/ONAF sweep
as soon as buildBOM had cooling-cost rows to sweep over, before any
rate existed to put in them, so an ONAF candidate ranked in that
search was still priced without its own fan cost. A search is a
ranked recommendation, not a banner someone can notice and dismiss --
at a zero rate it would rank the forced-cooled candidate first for
looking cheaper than it really is, every time, silently, which
carries more weight than the BOM warning above catches. The sweep is
now gated directly on the rate card: coolings only becomes
['ONAN','ONAF'] when rates.coolingFan, rates.oilPump and
rates.coolingControlGear are all nonzero; otherwise it stays at the
design's own single current cooling, the same as before section 20
existed. Better the lever unavailable than available and wrong.

## 24. Radiator layout split from finLayout, tankType now surface-aware, conservator sized

ENGINE_VERSION 1.13.0 -> 1.14.0.

**The bug**: `finLayout` served both tank types. Its per-fin area used a
fixed 320 mm depth whenever `p.tankType !== "fin"`, everything else
identical to the fin-tank formula -- at 2500 kVA with tankType radiator
this returned 158 fins at 320 mm deep, a corrugated fin wall doing the
arithmetic, not an actual bank-and-header radiator layout. The bug was
in what called it for a radiator tank, not in the fin-tank formula
itself, which is untouched.

**Split into two functions.** `finLayout(d)` is now fin-tank-only: the
tankType ternary is gone, it always uses the fin-tank depth formula (the
one branch that was ever correct), and gained a `pitch` field --
centre-to-centre spacing, computed with the exact same 85%-of-tankL,
even-spacing formula `src/components/cad/geometry.ts`'s `finPlacements()`
already uses for the 3D/2D drawings, kept in step by hand (the engine
takes no imports, invariant 1) rather than shared, so this field and
what the drawings already show cannot read differently for the same
design once something is pointed at it.

`radiatorLayout(d)` is new, on a radiator's own geometry: panels bolted
into removable banks between header pipes, not fins on a wall. Panel
width (`p.radiatorPanelWidth`, default 520 mm) and pitch
(`p.radiatorPanelPitch`, default 45 mm) are editable inputs, not
derived -- they are a specific vendor's panel dimensions, same reason
lamination width is a real slitting-stock decision (`stepWidths`'
increment) rather than a continuous optimum. Panel height is the one
dimension actually derived: snapped down to the largest of a small
standard-heights ladder (600/900/1200/1500/1800/2100 mm, typical
practice, not one vendor's catalogue) that clears the tank's own
available vertical space. Bank count and panels-per-bank both come from
the same `finAreaReq` every other cooling-surface figure in this engine
already reads (section 20's fan count and `finLayout`'s own fin count
both use it the same way) against one panel's own developed area
(`2 x panelHeight x panelWidth`, the same both-faces basis `finLayout`
uses for a fin), capped at `p.radiatorPanelsPerBank` (default 16, a
handling practicality, not a physical limit) before a second bank
starts. LV/HV bank split mirrors `finLayout`'s own fin split, one level
up (banks instead of individual fins), same 1250 kVA sheet 2:1 fitted
ratio and same reason (bushings, cable box, tap-changer linkage crowd
the LV end).

Header pipe centres are reported as the panel height itself (the top and
bottom headers a bank's panels connect between are exactly one panel
height apart). Valves: 2 per bank (top and bottom isolating valves, so a
bank can be removed without draining the tank), not derived, standard
practice.

**tankType AUTO selection is now rating AND estimated-surface aware**,
not rating alone. Rating is a proxy for required cooling surface, not
the thing itself -- a design with a tight rise target or forced cooling
at a modest rating can need more surface than a fin wall practically
carries well under 2500 kVA, and the old rating-only rule would have
kept it on a fin wall regardless. Estimated from the loss schedule
directly (this design's own real `finAreaReq` is not known yet at this
point in `deriveSpec` -- it needs the full geometry solve
`designTransformer` runs later -- so this is a coarse pre-estimate off
nominal `finDiss`/50 K, not the design's own eventual figure) against a
practical fin-wall ceiling (90 m², itself a fitted round number, not a
vendor's own limit). Rating still dominates one-directionally: crossing
2500 kVA always forces radiator regardless of the estimate (mechanical
size and service access favour radiators above that regardless of a
lighter loss); the estimate only ever pulls a smaller rating UP to
radiator, never a larger one back down to fin. Checked across
630-5000 kVA at default assumptions: nothing between 630 and 2500 kVA
crossed the estimated ceiling (all stayed fin, as before), 3150 kVA and
above correctly cross to radiator, and the default 1000 kVA golden case
is unmoved -- the two-factor rule is a genuine safety net for atypical
loss/cooling combinations, not a change to the typical case.

**Conservator sizing** (`conservatorSize(d)`): previously a BOM cost
line folded into the AC-01 fittings lump with no dimensions at all --
CostCardTab.tsx's own "Conservator Dimensions" card said as much ("the
engine does not size a conservator... enter the works' own figures").
Conventional practice sizes it at about 10% of total oil volume
(`p.conservatorPct`, default 10) to allow for thermal expansion, mounted
above the tank on its own brackets -- modelled as a horizontal cylinder,
diameter and length solved from that volume at a fitted length-to-
diameter ratio (`p.conservatorAspect`, default 2.08, the one reference
figure on file: the 630 kVA sheet's own 330 mm dia x 685 mm long,
685/330 = 2.076). Only meaningful on a radiator tank -- returns zero on
a fin tank, matching this engine's own existing "a sealed fin tank...
drops the conservator and breather maintenance" reasoning already in
`impacts()`.

**Reported against the 630 kVA reference (CALIBRATION.md section 9,
card-cost.test.mjs's fixture: fluidLitres 588 L, tankType radiator, 28
PSR panels, and separately, the 330 x 685 mm conservator figure this
section is checked against):**

- Fed the reference's own real 588 L directly into `conservatorSize`
  (10% = 58.8 L, aspect 2.08): dia 330 mm, length 687 mm, against the
  reference's 330 x 685 -- the formula itself checks out almost exactly.
  `engine.test.mjs` asserts this at +-3 mm dia / +-5 mm length.
- This is necessarily a check of the formula alone, not an end-to-end
  live design: card-cost.test.mjs's own header already states there is
  "nothing to reproduce [this job's masses] from without guessing" --
  the sheet gives quantities directly, not the volts-per-turn or steps
  that produced them, unlike the 1250 kVA and 630 kVA dry references
  which do have a real over{} to reproduce from. A live AUTO-derived 630
  kVA design (tankType forced to radiator to match the reference, since
  630 kVA is below this engine's own ~2500 kVA fin/radiator default) was
  also run for comparison: fluidLitres came out 999 L against the
  reference's 588 L, and radiatorLayout gave 16 panels in one bank
  against the reference's real 28. Recorded here rather than treated as
  a new defect: a generic AUTO design has no claim to match one specific
  real job's own tank envelope when that job's own design basis (K,
  steps, duty) is not available to reproduce it from -- the same reason
  this reference has always been a fixture, not a live reproduction, in
  card-cost.test.mjs. Feeding the live design's own (unvalidated at this
  rating) fluidLitres through a correct conservator formula does not
  make the result meaningful; feeding the reference's own real oil
  figure through it does, which is the check `engine.test.mjs` actually
  asserts.

**Consumers rewired, and the 3D model built** (the follow-up this
section originally deferred): every consumer that called `finLayout`
unconditionally now branches on `p.tankType` first --
`partRecords.ts`, `CostCardTab.tsx`, `ManufacturingTab.tsx`,
`TankDrawings.tsx` drawing 14 (real Bank Position / Header Connection
Centres / Valve Positions in place of "to be specified"),
`OrthographicDrawing.tsx`, `ExplodedAssemblyDrawing.tsx` drawing 19 (new
conservator row), and `TransformerParts.tsx`, the 3D model. A radiator
design now gets `radiatorLayout`'s own panel/bank numbers everywhere,
not `finLayout`'s fin-tank numbers under a different tank type's name --
the live regression this section's own gap had reintroduced (a
consequence of removing finLayout's old radiator branch without yet
rewiring its callers) is closed, not just documented.

`geometry.ts` gained two placement helpers, `bankPlacements()` (bank
centres along the tank wall, one radiator bank playing the role one fin
plays for `finPlacements()`, one level up -- returns each bank's own
along-wall width, `panelsPerBank` panels at `panelPitch` centres) and
`conservatorPlacement()` (mounting point above the tank, offset toward
the HV end for the same reason drawing 14's own LV/HV split already
carries). `radiatorLayout`'s own `panelWidth` field turned out to be the
more physically correct choice for view-framing "how far does this
project off the tank wall" than a separate fitted constant would have
been -- it already IS that dimension (a real pressed-steel radiator
element's own depth, the same role `depth` plays in `finLayout`), so no
second guessed figure was added alongside it.

The 3D model draws a radiator bank as its own panel array: header pipes
top and bottom (cylinders spanning the bank's width), the bank's own
panels bolted between them at `panelPitch` centres, and isolating valves
at the tank-wall end of each header -- not a fin wall's box ticks. The
conservator is a horizontal cylinder at `conservatorSize`'s own computed
diameter and length, on two schematic support brackets sized to the
same clearance `conservatorPlacement()` mounts it at, with a schematic
breather pipe at one end. Bracket and breather dimensions are
schematic, not claimed as engineered -- the same "real number where the
engine gives one, a simple representative shape where it does not"
treatment drawing 13's stiffener marks and fitting circles already use,
not a new exception. Gated on `isRadiator` and a new `conservator`
visibility toggle, off entirely on a fin tank or a dry design.

No engine change in this pass (no formula moved, `ENGINE_VERSION`
unchanged) -- every fix here was in what a UI-layer consumer calls, not
in what the engine computes.

## 25. Fit to Budget: staged search, a web worker, and the cardCostModel gap section 24 missed

Three fixes, reported and built in the order asked for.

**The Firestore database wiring was checked first and turned out not to
be the live fault it looked like** (this section records the correction,
not a new finding): src/lib/firebase.ts called getFirestore(app) with no
database ID, which is a real bug, but every consumer that actually
matters -- lib/projects.ts and everything built on it (the entire
project list/load/save/revision path), lib/firebase.ts's own consumers
-- was already correctly wired to the named database. The only
consumers of the broken file (ProjectsModal.tsx and the four
src/components/db/ files) were unreachable from App.tsx, confirmed by
grep and by git history (src/lib/firebase.ts dates to the original
scaffold commit, untouched since). Fixed anyway (a real latent bug is
still a bug), and the dead subtree deleted -- a second, un-database-
scoped copy of the Firebase client sitting in the tree is exactly the
kind of trap that caused this investigation in the first place.

**Fit to Budget: the search was never crashing.** Confirmed directly:
buildBOM and designTransformer -- everything searchDesigns calls -- never
call finLayout or radiatorLayout at all, so the tank-type split could not
be throwing inside the search the way it first looked like it might. The
actual fault, measured directly rather than assumed: the full grid for a
typical BudgetTab search is **179,712 candidates** (exact count, grades x
flux x conds x dScales x tanks x gapScales x coolings x riseTargets x
etKs), and a single designTransformer + buildBOM call costs ~10-13 ms
(ten individual calls timed directly) -- 30 to 39 minutes, synchronous,
on the tab's own main thread. That is indistinguishable from "does not
work": nothing throws, so the console is empty, and the tab is simply
frozen for half an hour. The grid was not new -- it was already ~57,600
candidates (10+ minutes) before section 20 added riseTargets as a 3-way
sweep, which tripled an already-unusable search to fully dead.

**Fix 1 -- staged search** (`stagedSearchDesigns`, alongside the existing
`searchDesigns`, which is unchanged in what it computes -- dScales and
gapScales are now opt-in overridable the same way etKs/riseTargets/
coolings already were, defaulting to the exact same fixed ladders, so no
existing call site's output changes). Two stages, both built on the same
`searchDesigns` rather than a forked copy of its inner loop:

- Stage 1 screens every structural combination (core type, grade,
  conductor, tank type, cooling) at reduced resolution on the continuous
  levers -- 3 dScale points instead of 8, 1 gapScale instead of 3, the
  caller's own first/current rise target instead of the full list, ~4 etK
  points instead of 16. Flux is left full resolution (fluxRange() is
  already only 4-7 points per grade). Ranks structural combinations
  against each other, keeps the top few (opts.stagedTopN, default 5).
- Stage 2 re-runs `searchDesigns` restricted to each winning structural
  combination alone, at full flux/gapScale/riseTarget resolution and a
  dScale/etK window (`windowAround`) centred on wherever that
  combination's own stage-1 winner landed -- full resolution, but only in
  the region already known to be competitive.

This is a heuristic, not an exhaustive search, and is documented as one
in the function's own comment: a structural combination stage 1's coarse
sampling made look uncompetitive is never revisited in stage 2, even if
its true optimum (at some point stage 1 never happened to sample) would
have beaten the kept winners. Measured, not estimated, on the exact
opts BudgetTab builds:

| | Before | After |
|---|---|---|
| Candidates | 179,712 (exact) | 1,872 (stage 1) + ~9,000 (5 refinements) |
| Wall time | 30.0-38.9 min (measured per-candidate cost, extrapolated) | 76.46 s, measured for real |

**What this table and the tests below it actually establish, stated more
narrowly than the first version of this section did**: that staging finds
the same *cheapest candidate by tco* as the full grid, fast. Neither the
76.46 s / 75.01 min full-grid comparison on the real 1000 kVA case, nor
the engine.test.mjs case below it, filtered by `.feasible` before
comparing -- both picked the raw minimum-tco candidate regardless of
whether it actually meets impedance, thermal and loss compliance. That is
a real, useful confirmation that the staging *algorithm* is correct (it
finds the true minimum of the ranking the full grid would also find,
not an approximation of it) -- it is not a confirmation that either
search *returns a usable design*, which is a different question the
comparison never asked. Section 26 found the answer to that different
question on this exact case is no: zero candidates are feasible in the
default 1000 kVA search at all, staged or full, and it is not caused by
staging or by anything this section changed.

A new engine.test.mjs case checks staged search correctness the same
narrow way (not the full-scale timing, which would make the test suite
itself take half an hour) at a deliberately smaller grid sized so the one
dimension that matters for coarsening (etKs, 8 points) actually exceeds
its own coarse threshold: staged best tco landed within 0.00% of the true
full-grid minimum at that scale, stage 2 correctly refined only
stagedTopN structural combinations, and cancelling after stage 1
correctly stops before stage 2 while still returning stage 1's own
candidates. Again, this is the algorithm-correctness question, not the
usability one.

**Fix 2 -- a web worker** (new `src/workers/searchWorker.ts`). Staging
cut the typical case to under 90 seconds, but "typical" is not "every
case" -- a synchronous multi-minute run on the main thread was the actual
bug report, not merely a slow one, so the fix is not "make it fast",
it is "make it unable to freeze the tab regardless of how large the grid
ever gets again". The worker imports `stagedSearchDesigns` directly (the
engine has no framework dependency, so it runs in a worker exactly as it
runs anywhere else) and relays `{stage, phase, ...}` progress messages
back to the main thread. BudgetTab.tsx spawns one per search, shows a
progress line (`progressText()` turns the raw stage/phase shape into one
sentence a designer would read), and a Cancel button that calls
`worker.terminate()` directly for an immediate hard stop rather than
waiting on the next `shouldCancel` checkpoint inside the search itself.

**Fix 3 -- cardCostModel's own finLayout call**, the one consumer the
"rewire every consumer" pass in section 24 missed, because it lives in
the engine itself (`cardCostModel`, the per-kg costing model) rather than
a UI file the earlier `src/` grep ever covered. Same bug, same fix: reads
`radiatorLayout(d).totalPanels` on a radiator design instead of
`finLayout(d).n`. A new engine.test.mjs case checks this directly: a
2500 kVA radiator design's panel row now differs from what finLayout
alone would have given it (45 vs 53 in the checked case), not silently
matching it under a "PSR (pressed-steel radiator)" label.

No ENGINE_VERSION bump for any of the three -- none changes what a
single evaluated design computes (searchDesigns/stagedSearchDesigns are
a what-if search, not part of how a saved revision reprices on read,
the same reasoning section 20 already recorded; cardCostModel's fix only
changes which count a radiator design's panel row reads, not any
formula).

## 26. The default 1000 kVA Fit to Budget search returns zero feasible candidates, and the flux floor is not why

Follow-up to section 25's correction: once the staged-vs-full comparison
was properly filtered by `.feasible` instead of raw minimum tco, both the
76.46 s staged run and the 75.01 min full-grid run on the exact default
1000 kVA case returned **zero feasible candidates each**, out of 1,530
and 57,408 respectively. Not a staging artefact -- the full grid has the
identical problem, and the raw-cheapest candidate both runs agree on is
the same one (grade zdkh, CCA, fin, ONAN, etK 0.400), confirming again
that staging finds the true minimum of the grid, just not a usable one
on this case.

Breaking down the 510 deduplicated candidates from a representative run:
zOk true and thermalOk true for every single one -- impedance and
thermal are not the problem anywhere in the grid. lossOk is false for
all 510. Of those, only 33 fail on no-load loss; every one of the 510
fails on load loss. The closest candidate found (grade zdkh, etK 0.480)
reaches loadLoss 6,702 W against a limit of 6,356 W -- 5.4% over, close
but never inside. `params.limitLL` = 6356 is confirmed to be the
`lossSchedule()`-derived figure for this rating and level, not a manual
override -- the default case's own `over` is `{}`.

**Flux-floor hypothesis, tested directly and ruled out.** The base
(autoFit) design's own compliant point sits at flux B = 1.44 T, and
`fluxRange()` floors non-amorphous grades at 1.50 T -- a real, checkable
gap between what the continuous autoFit process can reach (down to the
1.42 T floor `fitToSchedule` itself uses) and what the search grid ever
tries. Tested by temporarily lowering `fluxRange`'s floor to 1.40 T
(1.40, 1.45 added ahead of the existing 1.50-1.80 ladder) and re-running
the exact same staged search: still zero feasible, out of 660
candidates this time, still all 660 failing on load loss specifically.
The closest-to-compliant candidate was still at flux 1.800 T -- the
*top* of the range, not the newly opened bottom -- meaning the search
was not even gravitating toward the new region. Reverted immediately
after the test; `fluxRange` is unchanged in the shipped engine.

**So the flux floor is not the cause.** The actual finding, per the
decision this section was investigating: 510 (and 660) out of 510 (660)
failing on load loss specifically, with the closest miss only 5.4% over
and the raw-cheapest candidate 17.8% over, points at the load-loss
target being difficult or impossible to reach across the *combinations*
this grid explores -- not at any one swept dimension's range being too
narrow. Left open, not investigated further here: whether this is a
property of `searchDesigns`' own discrete deltaLV/deltaHV/flux grid
genuinely never landing where the continuous `autoFit` bisection does
(most grid points are not fine-tuned to sit just inside the schedule
the way `autoFit` deliberately targets), or something else. No fix
attempted; this is a report, not a change -- `fluxRange`, `searchDesigns`
and `stagedSearchDesigns` are all unchanged by this section.

## 27. searchDesigns fits flux and density per candidate via fitToSchedule, instead of enumerating them -- section 26's zero-feasible finding, fixed

Section 26 left one hypothesis open: `fluxRange()`/`dScales` enumerate flux
and current density as discrete grid points, while `fitToSchedule` (the
function `computeDesign`'s own main path calls) reaches a compliant point
by a 10-iteration continuous bisection-style correction that lands *just*
inside the loss schedule. A discrete grid essentially never lands in that
narrow window by chance, which is exactly consistent with what section 26
measured: every candidate failing specifically on load loss, the closest
miss only 5.4% over, and zOk/thermalOk true everywhere -- the compliant
region exists, the grid just never samples it.

**The fix.** `searchDesigns` no longer sweeps `flux` (`fluxRange(g)`) or
density (the `dScale` multiplier ladder) as grid points at all. For each
remaining structural combination (core type, core grade, conductor, tank
type, cooling, top-oil rise target, etK, steps, tapType, gapScale), the
candidate is built with a grade-clamped starting flux and a
conductor-anchored starting density, `autoFit: true` forced regardless of
the live design's own autoFit setting, and `fitToSchedule(candBase, {})`
is called on it -- unlocked, so it fits both flux and density together --
exactly the call `computeDesign` makes on its own main path. The fitted
values are merged in and a final `designTransformer` call confirms the
design actually built from them, the same two-call shape (fit, then
confirm) `computeDesign` itself uses. `dScale` and `fluxRange` enumeration
are gone from the grid; `fluxRange()` itself is unchanged and still
exported, just no longer called by `searchDesigns`.

This also shrinks the grid: the old grid multiplied grade x flux x
conductor x dScale x tank x gapScale x cooling x riseTarget x etK. The new
one multiplies grade x conductor x tank x gapScale x cooling x riseTarget
x etK -- two whole dimensions gone. Each surviving candidate now costs
roughly eleven `designTransformer` calls instead of one (ten fitToSchedule
iterations plus the final confirming call), so the net wall-time change is
real but far smaller than the ~40x drop in raw candidate count alone would
suggest -- see the measurements below.

`stagedSearchDesigns` no longer windows a `dScale` dimension, because there
is not one to window: stage 1 coarsens etK only (gapScale and rise target
pinned to a single point, same as before), stage 2 re-runs the winning
structural combinations at full gapScale/riseTarget resolution with an etK
window centred on stage 1's own winner. The dedup key is unchanged.

**Verified on all three ratings the search runs at, using BudgetTab's own
production opts** (all grades, all conductors, fin+radiator tanks, full
ETK_RANGE, three rise targets, ONAN -- coolings only sweeps ONAN/ONAF once
fan/pump/control-gear rates are priced, which DEFAULT_RATES does not do,
per section 23):

| kVA | full candidates | full wall time | full feasible | staged candidates | staged wall time | staged best tco | full best tco (feasible) | match |
|---|---|---|---|---|---|---|---|---|
| 1000 | 2,922 | 688.1 s | 1,056 | 195 | 62.5 s | 5,242,387.96 | 5,242,387.96 | exact |
| 630 | 2,886 | 491.0 s | 906 | 198 | 31.1 s | 3,792,548.33 | 3,792,548.33 | exact |
| 2500 | 2,586 | 577.7 s | 1,254 | 144 | 61.3 s | 10,217,833.57 | 10,217,833.57 | exact |

Zero feasible candidates, on every rating tested, is now a substantial
fraction feasible (roughly a third to half of the deduplicated grid). The
staged search matches the full grid's true feasible-filtered optimum
exactly on all three ratings, not approximately -- the tco values above
are bit-for-bit identical between the staged and full runs, because both
searches are evaluating the same fitted candidate once they land on the
same structural/etK/gapScale/riseTarget point, not two different
approximations of it. This is the correctness check section 25 originally
claimed and section 26 corrected: it was never actually run against
feasible candidates before, because none existed to run it against.

The 1000 kVA full-grid best feasible candidate: grade zdkh, aluminium,
fin tank, ONAN, 50 K rise, etK 0.40, flux 1.78 T, deltaLV/deltaHV
0.87/0.94 A/mm2, 15 steps, OCTC. noLoad 816.7 W against a 1,196 W limit,
loadLoss 5,970.6 W against a 6,356 W limit -- comfortably inside the
schedule on both counts, not hugging the edge the way a discrete grid
point would by luck. etK landing at 0.40 (the bottom of ETK_RANGE) on all
three ratings' best feasible candidates is consistent with section 25's
unresolved etK-floor question -- worth another look now that the search
actually returns usable designs to check it against, but not investigated
in this section.

**Adoption reproduces its own reported price exactly.** Simulated
`App.tsx`'s `BUDGET_OVER_KEYS` adoption path directly: built `over` from
each of `coreType, coreGrade, flux, condLV, condHV, deltaLV, deltaHV,
tankType, cooling, oilRiseTarget, lvHvClr, etK, steps, tapType` read off a
candidate's own `inputs`, then called `computeDesign(core, over,
DEFAULT_RATES)` and compared the result against the candidate's own
reported price and tco. Tested on three feasible 1000 kVA candidates
spanning the cost range (cheapest, median, most expensive of the staged
set): all three reproduced their own `exFactory` and `tco` to the cent.
This works because `flux`, `deltaLV` and `deltaHV` are in `BUDGET_OVER_KEYS`
and therefore present in `over`, which makes `fitToSchedule`'s own
`lockF`/`lockD` gates both true on the adopted recompute -- it returns
`{}` immediately rather than re-fitting, so the adopted design uses
exactly the fitted values the search already found. This check has never
passed before this section, because no feasible candidate existed to
test it against.

No `ENGINE_VERSION` bump: this changes what `searchDesigns` and
`stagedSearchDesigns` explore, not what `computeDesign` returns for a
given `core`/`over`/`rates` -- the same reasoning sections 17, 23 and 25
already applied to earlier changes to these two functions. A saved
revision reprices identically before and after this section; only the
Fit to Budget search itself finds different (now feasible) candidates.
## 28. Two new real core charts, and the widest-pocket snap-down fix they confirm

Two real core charts, dimensions as stated on them:

**800 kVA OLTC (Samruddhi Milk).** Core diameter 236 mm, window height
357 mm, core limb centre 397 mm. Flux 1.60 T, specific loss 1.203 W/kg,
no-load loss 1160 W guaranteed max. Core mass 964.22 kg, 15 steps, widest
pocket 230 mm. Three-plate chart (V-notch, outer, centre), each with its
own total -- only the aggregate figures above are on file here, not the
individual plate weights.

**1250 kVA (750+500) OLTC furnace.** Core diameter 224 mm, window height
698 mm, core limb centre 375 mm. Flux 1.62 T, specific loss 1.24 W/kg,
no-load loss 1390 W guaranteed max. Core mass 1121.67 kg, 15 steps, widest
pocket 220 mm. Same three-plate structure, same caveat on plate-level detail.

Window width follows the same relationship `cc = Ww + dCore` this engine
already uses internally (section 16): Ww = limb centre - core diameter --
161 mm and 151 mm here, giving Hw/Ww of 2.22 and 4.62. The second of those
numbers is what section 27's K=0.32 investigation and the aspect-ratio
constraint that followed it are built on; not read further here.

**Widest pocket, checked against `stepWidths()` directly.** Both charts put
the widest step at 0.975-0.982 of the core diameter -- 230/236 and
220/224 -- never at or above it, which is the only physically possible
result: `wIdeal = 2R cos(a[0])` for the widest step is always strictly
less than the diameter, by construction. `stepWidths()` was rounding every
step's width UP to the nearest `stepIncrement` (10 mm default), which for
the widest step on both these charts pushes it PAST the core diameter --
233.15 mm -> 240 mm on the 236 mm core, 221.29 mm -> 230 mm on the 224 mm
core -- a lamination plate wider than the core it sits inside, which is
not a thing that can be built.

Rounding every step down instead reproduces both charts' widest pocket
exactly (233.15 -> 230, 221.29 -> 220), but moved the 1250 kVA distribution
reference's own Plate A total (section 16, validated to -1.4% against a
real cut plate) from 612.49 kg to 560.81 kg against its 621.09 kg target --
outside the +-5% tolerance. Rounding direction is not uniformly wrong,
only the specific case where rounding up produces a physically impossible
width is. Fixed with a clamp instead of a blanket change: round up as
before, unless that would put the step at or past the core diameter, in
which case round down. This reproduces both furnace charts' widest pocket
exactly while leaving the 1250 kVA distribution reference's Plate A total,
and every other step's rounding on every other design, untouched -- the
1250 kVA distribution reference's own widest step never gets close enough
to its core diameter to hit the clamp.

ENGINE_VERSION 1.15.0. Default case core mass 1612 -> 1577 kg (its own
widest step does hit the clamp), ex-works 2,310,742 -> 2,282,317, tank
length 1628 -> 1621 mm -- moved via the no-load loss and cost-driven K
search cascading from the corrected core mass, not a second change.
`reference-designs.test.mjs` and `card-cost.test.mjs` are both unaffected.

**Specific loss confirms M5, not M4, at building factor 1.10.** Both
charts' own W/kg figures (1.203 at 1.60 T, 1.24 at 1.62 T) match this
engine's M5 grade (`wRef: 1.25, bRef: 1.7`) at the stepLap building factor
(1.10) to within 1.2-1.9%: 1.225 and 1.255 W/kg predicted. M4
(`wRef: 1.05`) predicts 1.029 and 1.054 W/kg against the same charts --
14.4-15.0% under. `gradeSuggest` keys the AUTO grade off efficiency level,
not application, and neither chart states which level it was built to, so
this is confirmation the M5 curve itself is well fitted, not evidence that
any AUTO suggestion needs to change -- left as a validation, no code moved.

**Window height varies with duty far more than either reference design
alone suggested.** The two furnace charts are close in core diameter
(236 mm, 224 mm) but not remotely close in window height (357 mm,
698 mm) -- the 1250 kVA unit is dual-rated (750+500) with an OLTC, and
needs a genuinely taller window for that duty, not a design fault. Noted
here because section 27's K=0.32 finding (1.28-1.45 m LV coil height at
630/1000 kVA, more than double the two Mehir references' own 595-633 mm)
should be read as a symptom of the missing aspect constraint at those
specific ratings and duty, not as evidence that any *particular* window
height figure elsewhere in this document is wrong on its own -- window
height is duty-dependent to a degree this document had not yet measured
directly until these two charts arrived.
## 29. Window aspect ratio (Hw/Ww) added as a real manufacturability constraint

**The clearest example yet of a pattern this project keeps running into: an
unconstrained search does not find a real optimum, it finds whatever gap
is left in the model's own constraints, and reports it as a saving.**
Section 25/26 found this as a symptom (every search candidate failing on
load loss, no obvious cause). Section 27 found the mechanism (a discrete
grid never landing where a continuous fit does) and fixed it -- which
immediately uncovered a second, different gap: once density and flux stop
being the excuse, K keeps falling to whatever floor the sweep is given,
because nothing was checking whether the winding K=0.32 demands can
actually be built. The fix each time was not to narrow the search or move
a boundary -- it was to teach the model the constraint a real design
office already applies by inspection, so the search has to satisfy it too,
the same as impedance, thermal and loss already are. Moving the etK floor
from 0.40 to 0.32 would have "fixed" the symptom by hiding it further down
the range; this section fixes the actual gap, and the optimum comes back
to K=0.48-0.54 on its own, matching the reference designs, because that is
where the real optimum was the whole time.

Section 27's K=0.32 finding: once flux and density are fitted per candidate
instead of swept, the etK-floor question from section 25 stopped being an
unanswerable range-boundary question and became a real one -- lowering the
floor to 0.32 found a cheaper design on all three ratings tested (630,
1000, 2500 kVA), landing on the new floor itself each time. Inspected
directly: the K=0.32 winners run a 1.28-1.45 m LV coil height at
630-1000 kVA (versus 595-633 mm for the same structural point at K=0.544,
where the two real Mehir references sit) and a current density of
0.75 A/mm2, a hair above `fitToSchedule`'s own 0.7 A/mm2 floor. Nothing in
`compliance` (impedance, thermal, loss schedule) notices a winding that has
traded an ever-taller, ever-thinner coil for lower I2R loss -- the model
was finding a real minimum of its own cost function, not a bug in the
arithmetic, but a minimum outside what a winding machine or a tank can
actually hold.

**Measured range.** Window height over window width, four real designs:

| Design | Hw | Ww | Hw/Ww |
|---|---|---|---|
| 1250 kVA oil (Mehir, distribution) | 566.5 mm | 232.7 mm | 2.44 |
| 630 kVA dry (Mehir, distribution) | 634.1 mm | 240.4 mm | 2.64 |
| 800 kVA OLTC furnace (Samruddhi Milk) | 357 mm | 161 mm | 2.22 |
| 1250 kVA (750+500) OLTC furnace | 698 mm | 151 mm | **4.62** |

The furnace outlier is real, not noise (section 28): a dual-rated OLTC
furnace duty genuinely needs a taller, narrower window than a distribution
design does. One bound across every application would either reject a
legitimate furnace design or admit an unbuildable distribution one.

**The constraint.** New parameter `maxAspect`, AUTO-suggested from
application -- 2.8 for every application except furnace and rectifier
(margin above the 2.64 distribution figure measured), 5.0 for furnace and
rectifier (margin above the 4.62 furnace figure measured) -- editable
either way, range 2.0-6.0. Added to `designTransformer`'s own `compliance`
object (`compliance.aspect`), which is generic (`compliant =
Object.values(compliance).every(x => x.ok)`), so it participates in
`compliant` everywhere for free, the same as impedance, thermal and loss
checks already do. Also added to `etkCurve`'s own feasibility flag, so
`fitEtkToCost`'s AUTO-K selection on the *main* design path avoids an
unbuildable K too, not only a search candidate -- without this, the same
exploit available to `searchDesigns` would have been available to any
plain `computeDesign` call with AUTO etK and autoFit on.

**Verified on all three ratings, full grid, aspect constraint active,
etK range back at its production 0.40 floor:**

| kVA | full candidates | feasible (with aspect) | z/thermal/loss-compliant (aspect ignored) | best feasible etK | best feasible density | best feasible aspect |
|---|---|---|---|---|---|---|
| 630 | 2,886 | 288 | 924 | 0.50 | 1.41 A/mm2 | 2.60 |
| 1000 | 201 (staged) | 33 | -- | 0.48 | 1.04 A/mm2 | 2.60 |
| 2500 | 2,586 | 378 | 1,374 | 0.54 | 1.18 A/mm2 | 2.62 |

None of the three lands on the 0.40 floor any more -- the constraint
removed exactly the region the etK-floor question was actually probing.
Current density on the best candidate at every rating sits well clear of
the 0.7 A/mm2 floor (1.04-1.41 A/mm2), and aspect sits comfortably under
the 2.8 limit (2.60-2.62), not pinned at the new boundary the way etK was
pinned at 0.40 before this section. This settles the etK-floor question
from section 25/26: the floor itself was never wrong, the grid was finding
designs the floor correctly excludes now.

No `ENGINE_VERSION` bump beyond 1.15.0 (section 28) -- this section's own
change (the new `compliance.aspect` check and `maxAspect` parameter) does
not move the default case's golden numbers, since the default design's own
aspect ratio (2.51) already sits under its AUTO maxAspect (2.8).
## 30. No-load coefficient: back-solved against three real points, coefficient-only fit adopted

Section 6 left the no-load coefficient (4.6 in `lossSchedule`'s
`4.6 * kva^0.805 * m * kn`) unchanged on purpose, for a specific, named
reason: "there is no equivalent no-load figure from either sheet to
anchor a change against... What would settle it: guaranteed no-load loss
figures from two or three more real designs, at ratings away from the two
already available... one design at 100-300 kVA and one at 2000 kVA or
above, since a coefficient fitted to two adjacent mid-range points has no
evidence either way about whether the same exponent (0.805) holds at the
ends of the range."

Section 28's two furnace charts are the first real no-load figures since
then, and the gap they show is real: at Level 2 (m = 1.00), the current
formula predicts 999 W at 800 kVA against an 1160 W real guarantee -- 14%
tight -- and 1431 W at 1250 kVA against 1390 W (furnace) and 1400 W (the
Mehir oil reference)'s own guarantees, 2-3% loose. Three real points now:

| Rating | Real guarantee | Current formula (Level 2) | Deviation |
|---|---|---|---|
| 800 kVA (furnace) | 1160 W | 999 W | -13.8% |
| 1250 kVA (furnace) | 1390 W | 1431 W | +2.98% |
| 1250 kVA (Mehir oil reference) | 1400 W | 1431 W | +2.25% |

**Full two-parameter fit (coefficient and exponent), as asked.** Least
squares in log space against all three points: coefficient 73.2, exponent
0.413 (against the current 4.6 and 0.805). Fits all three points to within
+-0.36% -- essentially exact.

**This is not a fit I would ship without flagging first.** Section 6's own
caution is exactly what applies here: 800 kVA and 1250 kVA are both still
"the middle of the range" it asked to get evidence away from -- a 1.56x
span, not the 100-300 kVA and 2000 kVA-plus points it named. Two of the
three points share the same kVA (1250), so the exponent is effectively
determined by one single ratio (800:1250), not by evidence spanning the
range the formula has to serve. Extrapolated, the two-parameter fit
diverges from the current formula fast in both directions:

| kVA | current formula | two-parameter fit | ratio |
|---|---|---|---|
| 100 | 187 W | 491 W | 2.62x |
| 500 | 685 W | 955 W | 1.39x |
| 1250 | 1431 W | 1395 W | 0.97x |
| 2500 | 2501 W | 1857 W | 0.74x |
| 5000 | 4369 W | 2473 W | 0.57x |
| 31500 | 19226 W | 5292 W | 0.28x |

A 2.6x jump at 100 kVA and a formula predicting barely a quarter of the
current no-load loss at 31500 kVA is not a plausible correction from two
nearby real data points -- it is what an under-determined two-parameter
fit does when the data does not actually constrain the exponent.

**Coefficient-only fit, exponent held at the existing 0.805**, the same
move section 6 made for the load-loss coefficient (52 -> 32, exponent
0.766 untouched, "neither sheet gave evidence against either"):
geometric-mean coefficient across the three points, 4.75 (against the
current 4.6) -- a uniform +3.3% at every rating, not a range-dependent
reshaping. Fits the three points to -11.0%, +6.4%, +5.6% respectively --
worse on any single point than the two-parameter fit, better everywhere
else, because it is not spending its second degree of freedom on three
points that cannot actually support one.

**Decision: coefficient-only fit adopted, two-parameter fit rejected.**
`lossSchedule`'s no-load coefficient is now 4.75 (was 4.6), exponent 0.805
unchanged. ENGINE_VERSION 1.16.0. The two-parameter fit (coefficient 73.2,
exponent 0.413) is recorded here, deliberately, as the option NOT taken --
it agrees with all three points to within 0.36%, tighter than the adopted
fit's -11.0%/+6.4%/+5.6%, but the extrapolation table above (2.6x the
current prediction at 100 kVA, 0.28x at 31500 kVA) is why: two of the three
points share one kVA, so the exponent it implies is set by a single ratio,
not by evidence across the range the formula has to serve. Do not refit it
from these three points again without first getting the low-rating
(100-300 kVA) and high-rating (2000 kVA+) guarantees section 6 already
asked for -- that request still stands, unmet by this section\'s own two
mid-range points.

**Before/after ex-works, Level 2, no override, autoFit on:**

| kVA | before (4.6) | after (4.75) | change | no-load loss before -> after | limit before -> after |
|---|---|---|---|---|---|
| 630 | Rs 17,17,257 | Rs 17,17,257 | 0.0% | 791 -> 791 W | 825 -> 851 W |
| 1000 | Rs 22,82,317 | Rs 21,78,588 | -4.5% | 1143 -> 1202 W | 1196 -> 1235 W |
| 1250 | Rs 26,15,284 | Rs 25,38,053 | -3.0% | 1234 -> 1263 W | 1431 -> 1478 W |

630 kVA does not move at all -- its design was not no-load-limited to begin
with (something else, most likely the 1.42 T flux floor, was already
binding before the ceiling was), so a looser no-load ceiling bought it
nothing. 1000 and 1250 kVA both used more of the newly available headroom
(no-load loss rose toward the new, higher limit at each), trading a bigger
core for a smaller, cheaper one -- the schedule becoming more accurate
changed what the cheapest compliant design actually is, at the two ratings
where no-load loss was the binding constraint.
## 31. Staging's multi-basin failure, actually observed, and fixed

Section 25's own header named this as a possible failure mode of the
two-stage funnel: "a structural combination that stage 1's coarse point
sampling made look uncompetitive is never revisited in stage 2, even if
the true optimum for that combination... would have beaten the winners
that were kept." Section 29's aspect-constraint verification found it for
real: at 630 and 2500 kVA, `stagedSearchDesigns` returned zero feasible
candidates while the full grid found hundreds.

**Cause.** Stage 1 picked each structural combination's own representative
by raw cheapest tco among its coarse-etK samples, with no regard for
whether that cheapest point was feasible. An aspect-infeasible candidate
at etK 0.40 (cheap precisely because it is unbuildable, section 29) could
still be the cheapest point sampled for its structural combination -- and
ranking structural combinations against each other by that price let a
combination with no real feasible option out-rank, and crowd out of the
top-N cut, a combination whose true feasible region was narrower but
genuinely buildable. Stage 2 then never got to refine the combination that
actually had an answer.

**Fix.** Within each structural combination, prefer a feasible
representative over an infeasible one regardless of price -- an infeasible
candidate is not a cheaper version of a feasible one, it is not a real
option, and must never win the representative slot on price alone. When
ranking combinations for the top-N cut, combinations with a feasible
representative always outrank ones without, then sort by tco within each
group. `structKey`, `windowAround`, stage 2's own refinement and the final
dedup are all unchanged -- this is a ranking-order fix within stage 1,
nothing about what gets computed.

**Verified on all three ratings, full grid versus staged, aspect
constraint and the section 30 no-load coefficient both active:**

| kVA | full candidates | full feasible | full best tco | staged candidates | staged feasible | staged best tco | match |
|---|---|---|---|---|---|---|---|
| 630 | 2,904 | 360 | 4,096,973.60 | 216 | 123 | 4,096,973.60 | exact, 0.0000% |
| 1000 | 2,928 | 522 | 5,698,070.62 | 201 | 162 | 5,698,070.62 | exact, 0.0000% |
| 2500 | 2,610 | 414 | 11,414,074.53 | 147 | 147 | 11,414,074.53 | exact, 0.0000% |

Bit-for-bit identical on all three, not approximately close -- staging and
the full grid land on the same structural/etK point, so both compute the
same fitted candidate. The zero-feasible failure this section fixes is
gone; the section 25 header's own named risk was real, was hit, and this
is what closed it.

No `ENGINE_VERSION` bump: `stagedSearchDesigns` is a what-if search, not
part of how a saved revision reprices on read, the same reasoning applied
throughout sections 17, 23, 25 and 27.
## 32. maxAspect default raised to 3.0 -- real headroom to 3.0, the same exploit beyond it

Section 29's default (2.8) was a margin above the two real distribution
figures measured (2.44, 2.64), not itself derived from a buildable-limit
test. Worth checking before accepting it: at 630 kVA the best design sits
0.23% off that ceiling (section on binding constraints, this conversation)
-- close enough that the ceiling itself might be costing real money, or
might be exactly where a real winding stops being one.

**Swept 630 kVA (the rating pinned hardest against 2.8) at maxAspect
2.8/3.0/3.2/3.5, full production search options:**

| maxAspect | ex-works | vs 2.8 | etK | conductor | LV density | coil height | aspect actual |
|---|---|---|---|---|---|---|---|
| 2.8 | Rs 9,09,707 | -- | 0.48 | CCA | 1.34 A/mm2 | 696 mm | 2.79 (pinned) |
| 3.0 | Rs 9,02,755 | -0.76% | 0.46 | CCA | 1.30 A/mm2 | 731 mm | 2.99 (pinned) |
| 3.2 | Rs 8,43,827 | -7.8% | 0.46 | aluminium | 0.97 A/mm2 | 796 mm | 3.08 (not pinned) |
| 3.5 | Rs 8,43,827 | -7.8% | 0.46 | aluminium | 0.97 A/mm2 | 796 mm | 3.08 (not pinned) |

Two different regimes, not one curve. 2.8 -> 3.0 is a smooth, small move:
same conductor, density barely changes (1.34 -> 1.30 A/mm2), coil height
grows 5%, real 0.76% saving. 3.0 -> 3.2 is a jump to a different structural
combination entirely: conductor switches to aluminium and current density
collapses 25% in one step -- the same mechanism section 29's K=0.32
finding was (a low-density winding traded for lower loss, unconstrained by
anything that notices it), one step removed and centred on aluminium's own
naturally lower baseline density (roughly 1.95 A/mm2 typical against
copper's 2.5) rather than K. 3.5 gives numbers identical to 3.2 -- the
search stopped needing the ceiling at all past 3.08, confirming the
ceiling itself was never what was limiting this second regime; something
else (most likely the current-density floor fitToSchedule already has, or
the same one section 29 named) is, and raising maxAspect further will not
reach a third regime, it will just stop mattering the way it already has.

**Decision: default raised to 3.0 for every application except furnace and
rectifier (unchanged at 5.0).** The real, buildable saving stops at 3.0;
past it the 7.8% a naive reading of the sweep suggests is not a saving in
the same sense section 29 already named -- it is the identical exploit,
not a different, larger one. Recorded here so nobody reads the 3.2/3.5
rows later and reopens this without the density collapse alongside them.

Default case (1000 kVA) unaffected: its own aspect margin was 7.14% clear
of 2.8 already (this conversation's binding-constraint check), nowhere
near either ceiling. ENGINE_VERSION 1.17.0 -- a real move for any design
whose own aspect sits between 2.8 and 3.0, confirmed by the 2000 kVA
impedance-solve bracket in `engine.test.mjs` shifting again (-0.42% ->
-3.18%), the same cost-search cascade sections 28 and 30 each produced
there.
## 33. Correcting the record: every search recommending CCA or aluminium rested on two unsourced rates

**This is a substantial correction, not a minor caveat.** Every Fit to
Budget search this project has run, in every session, at every rating
tested, has recommended copper-clad aluminium or plain aluminium over
copper -- and every one of those recommendations rested on `condAl`
(Rs 340/kg) and `condCca` (Rs 560/kg), two rates `DEFAULT_RATES`' own
comment already said were never confirmed against anything. Checked
directly across the four ratings this session has used as its own test
set, full production search options, copper-only forced as the
comparison:

| kVA | winning conductor | winner ex-works | copper-only ex-works | copper premium |
|---|---|---|---|---|
| 630 | CCA | Rs 9,02,755 | Rs 15,59,642 | 72.76% |
| 1000 | aluminium | Rs 10,70,520 | Rs 21,00,145 | 96.18% |
| 1250 | aluminium | Rs 12,12,921 | Rs 23,78,323 | 96.08% |
| 2500 | CCA | Rs 18,69,025 | Rs 34,77,472 | 86.06% |

`condCu` (Rs 1,415/kg) is the one figure of the three actually taken from
a real sheet (the 630 kVA Level 1 costing sheet, section 7). `condAl` and
`condCca` are inherited placeholders that predate this project's
calibration work entirely. CCA is the more implausible of the two: it
physically contains copper and costs more to produce than plain
aluminium, so a rate at 40% of copper's cannot be right on its face, not
just "unconfirmed." Any Fit to Budget result, any cost narrative, any
reference to a "cheaper aluminium/CCA design" from any earlier section of
this document or any earlier session -- all of it rests on these two
numbers and should not be relied on until they are replaced with a real
supplier quote.

**Fix: searchDesigns will not recommend a conductor whose rate is still at
this unsourced placeholder.** `UNSOURCED_RATE_KEYS` (`condAl`, `condCca`)
and `unsourcedConductorRate(cond, rates)` gate the `conds` list
`searchDesigns` actually sweeps -- excluded unless the caller's own
`rates` object has moved the rate away from `DEFAULT_RATES`' own exact
placeholder value, which counts as a real, entered figure like any other
and lifts the exclusion for that conductor. `stagedSearchDesigns`
inherits this for free (it calls `searchDesigns` for every stage), and
attaches the same note to whichever array it returns. `unsourcedConductorNote()`
names exactly which material and which rate key needs a real entry, and is
surfaced end to end: `searchDesigns`/`stagedSearchDesigns` attach it as
`.excludedNote` on the results array, `searchWorker.ts` forwards it as its
own field on the `done` message (pulled off before anything crosses
`postMessage`, not relying on structured clone preserving a non-indexed
array property), and `BudgetTab.tsx` renders it next to the search
controls whenever a search excluded something.

An unsourced rate that silently wins every search it is offered is worse
than a missing one -- copper is the only conductor with a real rate, and
until aluminium and CCA strip quotes arrive it is the only conductor this
search can recommend. No `ENGINE_VERSION` bump: `computeDesign`'s own
output for a given input is unchanged (conductor selection there comes
from `condSuggest`, untouched by this section); only what `searchDesigns`
and `stagedSearchDesigns` are willing to recommend moved, the same
reasoning applied throughout sections 17, 23, 25, 27 and 31.
## 34. A second core plate construction exists (V-notch/outer/centre), not yet verified -- Construction A remains the only one implemented

The furnace core charts (section 28) use a genuinely different lamination
pattern from the two Mehir Transformers references this engine's existing
`coreCuttingChart()` already models. Reference for what Construction A
(limb / half-yoke / full-yoke, sections 12 and 15-16) already implements;
this section is the second pattern, from the 1250 kVA (750+500) OLTC
furnace chart specifically -- 224 mm core, 698 mm window, 375 mm limb
centre, 15 steps, three plate totals V-notch 397.69 kg, outer 500.25 kg,
centre 223.73 kg, core 1121.67 kg.

**Established, from the chart's own arithmetic (not inferred):**

- The three stated plate lengths (V-notch `2*cc + w`, outer `Hw + 2*w`,
  centre `outer - 52 mm`) are OUTER edges, not the mean/effective length
  the weight calculation actually needs -- reproducing the stated lengths
  literally overstates every plate by a wide margin (the first attempt at
  this, using Construction A's own already-validated yoke formula
  unchanged for V-notch, gave 562.77 kg against the real 397.69 kg, +41.5%).
  Same class of error as `wCore`'s own limb term before section 15's fix.
- The gap between stated and effective length scales linearly with each
  step's own width `w`, not a fixed mm figure -- consistent with a 45
  degree mitre (removes `w^2/2` area per mitred end, `w/2` off the mean
  length per end), the same geometric relationship Construction A's own
  limb term already established (section 15-16, "long - short = 2w").
- The centre plate's own stack (thickness column) is exactly half of
  V-notch's and outer's at every one of the fifteen steps -- confirms
  "two half-thickness plates per layer" as a real, checkable fact from the
  chart, not a guess.

**Not established -- inferred, and the inference does not verify clean:**

Coefficients backed out from the three chart totals to fit the mitre
deduction (V-notch `1.34w`, outer `1.12w`, centre `0.61w`) were fitted
against the totals, not derived from mitre geometry independently of them
-- "roughly two mitred ends plus an allowance" for outer, "roughly one"
for centre, but the allowance itself (~0.11-0.12w on both) has no
independent geometric basis yet, and V-notch's own residual (0.34w beyond
two plain mitred ends) was assumed to be the V-notch cutout without a
cutout dimension to check it against.

Combined with a further inference -- that "outer" and "centre" designate
LIMB POSITION (outer applies to the two outer limbs, centre to the one
centre limb) rather than a radial split within every limb's own cross
section -- these coefficients reproduce V-notch to +3.04% and outer to
+3.54%, close enough to confirm the general diagnosis (mitre deduction,
scaling with width) is the right class of fix, but not exact. Centre
missed by +21.8% to -38.6% across every stack/limb-count combination
tried (1/2/3 limbs, full/half stack depth before rounding) -- the gap does
not move like a rounding artefact, meaning a real piece of the geometry is
still missing, not a coefficient needing one more decimal place.

**Open questions, unresolved -- do not guess at these:**

1. What "outer" and "centre" actually designate: limb position (two outer
   limbs vs the one centre limb, as inferred above) or a radial split
   within each limb's own cross section (the original reading). The 3%
   residual on V-notch and outer even under the limb-position reading
   means this has not actually been confirmed either way.
2. The per-step plate count for outer and centre -- how many of each per
   step, and across how many limbs. "Two half plates per layer" fixes the
   mass-per-layer relationship for centre but not how many layers, or on
   how many limbs.
3. The exact geometric basis for the mitre-deduction coefficients
   themselves (1.34w / 1.12w / 0.61w), independent of fitting them against
   the three known totals -- what the V-notch cutout itself removes, and
   what the ~0.11-0.12w "allowance" on outer and centre actually is.

**Decision: Construction A remains the only implemented core plate
construction.** No `coreConstruction` parameter, no Construction B code,
no fitted coefficient shipped as a formula. A construction selectable in
the UI with a silently-fitted formula behind it is worse than not having
the option at all -- exactly this project's own standing rule against
inventing engineering data. Waiting on the designer to confirm what
"outer" and "centre" designate and the real per-step plate count before
any of this is implemented.
## 35. Construction B implemented -- V-notch/outer/centre, selectable alongside Construction A

Section 34 left this open pending the designer's answer. Answered directly:

- V-notch is the yoke, both top and bottom.
- Outer is the two outer limb plates.
- Centre is the single centre limb plate.
- Per layer: 2 V-notch, 2 outer, 1 centre. The centre stack column is half
  the others because there is one centre limb against two of everything
  else -- not half-thickness plates, section 34's own guess was wrong.

With the plate-count structure pinned, the length-deduction problem
(section 34: stated lengths are outer edges, the deduction scales with
width like a 45 degree mitre) became exactly determined -- three plate
totals, three unknown coefficients, solved directly rather than fitted
against noise. `MITRE_K = { vNotch: 1.44585, outer: 1.27514,
centre: 1.46509 }` (`packages/engine/index.js`) reproduces the chart's
three totals exactly: V-notch 397.69 kg, outer 500.25 kg, centre
223.73 kg, core 1121.67 kg, checked directly in `engine.test.mjs`.

**What this does and does not confirm.** Solving three coefficients
against three totals ALWAYS reproduces those totals exactly, regardless
of whether the underlying per-step model is correct away from this one
geometry -- that is arithmetic, not verification. Pure 45-degree-mitre
geometry alone (two ends, w/2 each) predicts 1.0 for V-notch and outer,
0.5 for centre; the solved values are well above that, meaning a real
additional deduction exists (the V-notch cutout itself, a limb-yoke joint
allowance, or both) that this engine cannot separate out from three
aggregate numbers alone. Unconfirmed at any rating besides this one 1250
kVA (750+500) furnace chart -- the same caveat drawing 22's own note
already carries for Construction A, extended here rather than invented
fresh. A second real Construction B chart, at different proportions,
would let these three coefficients actually be checked.

**Implementation.** `coreConstruction` (put(), options "A"/"B", default
"A" regardless of application -- Construction A is confirmed against two
real reference builds, Construction B against one furnace chart with a
tautological fit, so it is selectable, not auto-suggested). One shared
function, `coreConstructionB()`, computes both the priced core mass
(`wCore` inside `designTransformer`, via `wYoke = totalV`,
`wLimb = totalO + totalC`) and the cutting-chart display
(`coreCuttingChart()`) -- the same principle section 15 established for
Construction A's own limb term: the price and the steel-order document
always agree on the same core, by construction, not by coincidence.
`Drawings2D.tsx`'s cutting-chart drawing renders V-notch/outer/centre
tables when Construction B is selected, Plate A/B/C with the step-lap
shift breakdown otherwise.

**Cost comparison, same design, both constructions:**

| Design | Construction A wCore | Construction B wCore | A ex-works | B ex-works | wCore diff | ex-works diff |
|---|---|---|---|---|---|---|
| 1250 kVA furnace duty | 2022.8 kg | 2538.7 kg | Rs 33,72,502 | Rs 33,31,328 | +25.51% | -1.22% |
| 1000 kVA distribution (default) | 1444.6 kg | 1653.3 kg | Rs 21,78,588 | Rs 23,38,467 | +14.45% | +7.34% |

Construction B is not simply better or worse -- it is a different steel
distribution (much more limb, much less yoke, following directly from a
V-notch yoke needing far less steel than Construction A's split yoke
while the limb plates spanning the full window height need far more).
On furnace duty, where the chart it is fitted to actually comes from, it
uses noticeably more core steel but autoFit finds a net-cheaper design
anyway (a different flux/etK/tank trade becomes available). On a normal
distribution proportion it is straightforwardly worse on both counts.
Selecting Construction B for a design should follow what the works
actually intends to build, not a search result -- it is not a free lever
a cost search should be allowed to discover on its own merit given how
thin the evidence behind its own coefficients still is.

No `ENGINE_VERSION` bump: default is Construction A, byte-identical to
before this section for every existing design. Construction B only
activates when explicitly selected.
## 36. CCA removed from the search permanently; aluminium and copper rates confirmed

Section 33 excluded CCA and aluminium from `searchDesigns` for lack of a
sourced rate. The designer has since answered both, and they resolve
differently, not the same way:

- **Copper (`condCu`, Rs 1415/kg): confirmed.** Designer's own supplier
  range is Rs 1350-1450/kg -- the existing sheet-sourced figure sits
  inside it. No change.
- **Aluminium (`condAl`): now sourced, re-enters the search.** Designer's
  range is Rs 380-420/kg, set at 400 (was the unsourced placeholder, 340).
  `UNSOURCED_RATE_KEYS` no longer includes it -- `searchDesigns` will
  recommend aluminium again wherever it is genuinely cheaper.
- **CCA: excluded permanently, not a pricing question any more.**
  Standard manufacturers do not buy copper-clad aluminium winding wire --
  galvanic corrosion (a copper-aluminium junction under load-cycling
  thermal stress is a known failure point) and creep (aluminium's own
  long-term deformation under clamping pressure, which copper cladding
  does not fix). `MATERIALS_EXCLUDED_FROM_SEARCH` (`packages/engine/
  index.js`) excludes it unconditionally -- unlike the unsourced-rate
  mechanism, entering a real `condCca` rate does not re-enable it, checked
  directly (a Rs 900/kg entered rate still excludes it). `condCca`'s own
  rate figure in `DEFAULT_RATES` is left at its old placeholder (560) only
  because nothing reads it for pricing purposes any more, not because it
  is now considered sourced.

`unsourcedConductorNote()` now reports both exclusion reasons separately
when relevant -- "rate not sourced, enter one to include it" for a future
unsourced material, "not offered as a winding material... no rate
re-enables it" for CCA specifically, so a user reading the search UI
never mistakes a manufacturability exclusion for a pricing gap they could
close themselves.

No `ENGINE_VERSION` bump: `condSuggest` (the AUTO material choice on the
main design path) never offered CCA and is untouched; only what
`searchDesigns` explores and what `condAl` prices at moved.
## 37. Design margin: marginTargetLL/NLL replace the hardcoded 0.96

The HV conductor cross-check (this conversation, not yet its own section
until now) found the real 630 kVA winding running roughly double the
loss-optimal copper this engine's own fitToSchedule target implied --
1.475 A/mm2 against 2.95 A/mm2 -- and the designer's own stated practice
explains the gap directly: 6-8% margin on load loss, 8-10% on no-load,
not the flat 4% margin (0.96 target) `fitToSchedule` had hardcoded with
no evidence behind that specific number.

`marginTargetLL` (default 0.93, 7% margin) and `marginTargetNLL` (default
0.90, 10% margin) replace it, each independently editable -- a design
office with its own tighter or looser practice sets its own number, the
same as `maxAspect` or the coil/tank-height limits (section 39).

ENGINE_VERSION 1.18.0 (bundled with section 38's convergence fix below --
the margin change surfaced a real, pre-existing convergence fault that
needed fixing before this change's own numbers could be trusted, so both
ship under one version rather than shipping a known-broken intermediate).

## 38. fitToSchedule did not converge at every rating -- fixed with damping and a real exit condition

Raising the margin targets doubled as a stress test on the fitting loop
itself, and it failed one: at some ratings (1250 kVA specifically) the
load-loss correction never settled. Traced in detail before choosing a
fix, per instruction. Flux was NOT part of the instability -- pinned dead
flat at the grade ceiling every iteration, because the no-load schedule
genuinely cannot be met at any flux the grade allows at this rating (a
real infeasibility, already visible via `compliance.nll`, not a numerical
fault). The oscillation was entirely on the density side, and not "two
fits fighting" in the way first suspected -- it is the density corrector
chasing a DISCONTINUITY in `designTransformer`'s own geometry:
`lvAxCount`/`lvRadCount` (the LV parallel-conductor split) flips between
two configurations (4x6 and 5x5 in the traced case) at nearly identical
`deltaLV`, each giving a meaningfully different load loss for the same
current density. The corrector overshoots across that threshold every
pass -- a clean period-6 cycle, confirmed present under the OLD 0.96
target too (smaller amplitude, easy to miss at a fixed 10-iteration cutoff,
but the same fault), not something the margin change introduced.

**Fix.** Damping (`FIT_RELAX = 0.6`): each iteration moves only 60% of the
way from the current value toward what an undamped correction would ask
for, so a step is less likely to cross a threshold it would otherwise
bounce off both sides of. Real convergence check, not a fixed count: flux,
`deltaLV` and `deltaHV` must all stay within 0.2% relative spread across a
rolling window of the last 5 iterations (`FIT_CONVERGE_WINDOW`,
`FIT_CONVERGE_TOL`) before the loop exits early. Capped at
`FIT_MAX_ITERS = 60` as a safety bound, not a target -- checked across six
ratings (100 to 5000 kVA), five settle cleanly in 5-20 iterations; 1250 kVA
does not settle within 60 even damped, confirming this is a genuine
structural difficulty at that specific configuration, not fixable by
tuning the damping factor or tolerance further.

**Visibility, the part that matters most.** `autoFitConverged` (boolean)
is now returned from `fitToSchedule`, threaded through `computeDesign`
and every `searchDesigns` candidate, the same principle `etkNonCompliant`
already established: a result that failed to settle must never be
indistinguishable from one that did. Absent/locked dimensions (autoFit
off, or flux/density explicitly overridden) read as converged -- there was
nothing to fail to converge. `engine.test.mjs`'s default case now asserts
`autoFitConverged === true` directly.

Default case golden numbers moved again on top of section 37's own move --
the earlier post-margin numbers were themselves an under-converged
snapshot at the old fixed 10-iteration count, not a different design.
## 39. fitEtkToCost compared K candidates on a stale fit -- fixed, and it changed the true optimum

Section 38 fixed fitToSchedule's own convergence. Re-running the density
check it was meant to establish surfaced a second, separate fault: the K
search compared sixteen candidates using flux and density fitted for
whichever K fitToSchedule had started from, not their own. Traced
directly at 630 kVA -- fitToSchedule itself converges cleanly to a 7.11%
load-loss margin at K = 0.545, then fitEtkToCost moves K to 0.500 (cheaper
on the stale comparison) and the SAME flux/density, now built into a
different winding geometry, achieves only 0.59% margin. The margin
targets (section 37) were being honoured at the K they were fitted
against, then silently abandoned the moment a cheaper K was found.

**Fix: every K candidate is now re-fitted for itself.** `etkPoint()`
(new, shared by both stages of `etkCurve`) calls `fitToSchedule` fresh
for each K, so a candidate's reported cost is the cost of the design that
K would actually build, not a preview using someone else's fit.
`fitEtkToCost`'s own return now carries the winning point's fitted
flux/deltaLV/deltaHV alongside etK -- returning etK alone (the old
behaviour) would have left p0's stale values in place regardless of how
correctly the winner was chosen, the same bug one level further down.

**A second, subtler fault, found while verifying the first fix.** Simply
re-fitting at each K was not enough on its own: `fitToSchedule` is a
local iterative corrector, not a global solve, so the SAME K can settle
on a different fixed point depending on where the iteration started.
Starting every K's fit from `p`'s own carried-over flux/density (whatever
a DIFFERENT K's fit had left them at) reintroduced a version of the exact
problem being fixed -- checked directly on the default 1000 kVA case,
where this left K = 0.46 landing on a non-converging trajectory
(`autoFitConverged: false`) even after the stale-comparison fix, because
a plain clamp of the carried-over value into the grade's bounds is not a
reset -- it is a no-op whenever that value already sits inside them,
which it usually does. `etkPoint` now starts every K from
`fluxSuggest`/`densitySuggest`'s own fresh estimate (the same ones
`deriveSpec` itself uses), independent of whatever K the search happened
to run first. Locked flux/density (an explicit `over`) are exempted --
they keep the caller's own value, never reset.

**This changed the true optimum, not just the reported margin.** The
default 1000 kVA case's own cost-optimal K moved from 0.52 (the stale
comparison's answer) to 0.46 -- a genuinely different, cheaper design
(core mass 1640 -> 1040 kg, ex-works Rs 23,86,765 -> Rs 21,81,359, -8.6%)
that the old comparison could not see, confirmed against a full
16-point, full-precision, neutral-start scan of the whole K range (not
just the staged/fast one below). `ENGINE_VERSION` 1.19.0 -- every
AUTO-K, autoFit design's numbers move again, on top of sections 37 and
38's own moves, because the earlier K search was answering the wrong
question, not just answering the right one imprecisely.

**Performance, measured and reported as asked, not silently absorbed.**
A full re-fit at every one of the 16 `ETK_RANGE` points, at the same
precision `computeDesign`'s own main fit uses, costs roughly 3.7 s per
`computeDesign` call -- unusable on the interactive path. Two measures,
both keeping every comparison self-consistent (never the stale shortcut
section 39 exists to remove):

1. **Staged, the same way `stagedSearchDesigns` already is** (section
   25): 5 coarse points across the full range, refine with a
   full-resolution window around the coarse winner -- roughly 11 points
   instead of 16, both stages calling the same `etkPoint()`.
2. **A fast, loose-tolerance scan for ranking only** (`ETK_SCAN_MAX_ITERS
   = 8`, `ETK_SCAN_TOL = 0.02`, against the real fit's 60 iterations and
   0.2%) -- cheap enough to run at every staged point, used purely to
   decide which K wins. `fitEtkToCost` always re-fits the winner at full
   precision before returning anything, so a loose scan only ever
   affects which K is selected, never what gets reported for it.

Net: ~3.7 s -> ~1.5-1.7 s for the default case, confirmed to still find
the same true optimum as the full 16-point full-precision scan. Slower
than the original (incorrect) ~200 ms, and still not instant -- flagged
plainly rather than left implicit. Further speedup would mean fewer
staged points or a looser scan, at growing risk of misranking two closely
costed K candidates; not attempted without deciding that trade is worth
it first.

**Verified against the 1.475 A/mm2 HV target the whole investigation was
chasing, with the achieved margin alongside so the fit can be seen
actually holding this time:**

| kVA | LV density | HV density | Achieved LL margin | autoFitConverged |
|---|---|---|---|---|
| 630 | 1.640 A/mm2 | 1.740 A/mm2 | 6.92% (target ~7%) | true |
| 1250 | 1.770 A/mm2 | 1.880 A/mm2 | 6.95% (target ~7%) | true |

HV density is closer to the 1.475 A/mm2 target than section 37's own
first (uncoordinated) reading (1.86-1.89 A/mm2) but still meaningfully
above it, at 1.74-1.88 A/mm2 -- and this time the margin is genuinely
holding at both ratings, not silently abandoned the way it was before
this section's fix. The remaining gap to 1.475 A/mm2 is what section 37
always expected it to be: short-circuit or stray-loss allowance, not
something margin alone should close, and not investigated further here.

**Open, named rather than fixed here:** the same class of fault --
"something downstream silently recomputes geometry an earlier stage
fitted against" -- may exist elsewhere in this engine. Worth a sweep
before assuming this was the only instance.
## 40. Silent-invalidation sweep, and the Class B pin solver fix it found first

Section 39's own fix (every K candidate re-fitted for itself) was itself
an instance of a pattern worth naming directly: one stage of a pipeline
recomputing or overriding a quantity an earlier stage already solved or
fitted against, without checking that the earlier result still holds. A
deliberate sweep for other instances, prompted by three that had already
surfaced by accident (the K search on stale fits, the search ranking on
infeasible candidates, section 12/15/16's two cutting documents on
different limb formulas) found four more. Report only below; three are
addressed in this and the following two sections, one (item 4, unequal
turn distribution across HV groups) is left as already self-documented
and dependent on work not yet done (tap-section placement).

**The Class B pin solver (`src/lib/classBSolver.ts`), found first and
worst.** `bisectToTarget` calls `computeDesign()` up to 44 times per pin
solve. Section 39's own fix means every one of those 44 calls now runs a
full K search (~1.5-1.7s) unless `etK` happens to already be pinned --
measured directly before any fix: ~92s for a single pin solve, ~918s (15+
minutes) worst case for `solveAllPins` with two pins across its own
convergence passes. `solveAllPins` sits inside `App.tsx`'s own main
`useMemo`, so the entire app would freeze for 90+ seconds on every edit
whenever even one Class B pin is active -- a real feature this project
had shipped, and a real regression section 39's own fix introduced
without anyone checking the pin solver's own call pattern against it.

**Diagnosis, checked before choosing a fix, per instruction.** Was the
right fix "make computeDesign faster," or "stop re-running the K search
at all"? The second: a Class B solve is asking what lever value hits one
target. Re-optimising K inside every bisection step is not just slow, it
is wrong on its own terms -- K can jump between steps and move the design
through a second, uncontrolled channel, breaking the monotonic-in-the-
lever assumption bisection depends on. Confirmed against SOLVER.md
section 3 itself: a Class B solve moves exactly one lever.

**Fix.** `etK` is held at whatever the design already resolves to -- one
`computeDesign()` call to discover it, not 44 -- for the entire solve,
bisection and final result alike, and carried in the returned `overPatch`
so the persisted design does not silently revert to AUTO K (and pay the
search again) the moment the patch is applied. Not re-optimised at the
end either: doing so would move the design away from the value the solve
just reported as reaching the target, making a "reachable" result untrue
by the time it is shown. A design office that wants K re-optimised for
cost after solving a loss figure runs Fit to Budget for that,
deliberately -- not as a silent side effect of pinning something else.
`searchCatalog` (the material/grade-swap fallback when a target is not
reachable on the primary lever) holds the same pinned K across every
candidate it tries, rather than re-discovering it per candidate.

**Result, measured, not assumed reachable.** ~92s -> ~22-47s depending on
target, a real 50-75% cut, but this is NOT under the ~2s target and is
reported as such rather than accepted. The remaining cost is a different,
genuine bottleneck: `fitToSchedule`'s own density-fitting sub-loop
(section 38) is itself slow to converge -- up to the full 60-iteration
cap, ~660ms -- near a flux value at or close to the core grade's own
ceiling, and the default case's own current flux already sits exactly
there (1.78 T, m0h's own bMax). Any realistic no-load-loss target on this
design requires the bisection to evaluate points in or near that slow
region repeatedly. This is the same class of convergence difficulty
section 38 already named, in a new context (a bisection sweeping flux
across its full range, which section 38's own testing never had reason
to exercise this exhaustively) -- not fixed here, since it is a different
problem from what this section set out to solve, and speeding it up
further was not asked for.

## 41. HV multi-strand split fed back into the radial build and resistance calculation

`conductorSchedule` (the document/drawing generator) has always independently
recomputed an HV multi-parallel-strand split above `HV_STRAND_MAX_MM2` (37.6
mm2, the same practical single-conductor ceiling used elsewhere in this
engine) for display. `designTransformer` never saw that split: its own window-
height solve, radial build (`hvRadial`) and, through the mean turn length,
load loss and resistance were all sized against a single conductor's
footprint standing in for the whole turn, regardless of how many strands
actually run in parallel. This is the same shape of fault as the two cutting
documents in section 15/16: one stage computing a quantity that another,
earlier stage never got to see. Both existing reference sheets (630 kVA,
1250 kVA) stay under the 37.6 mm2 threshold, so neither reference caught it.
It only shows up at 5000 kVA and above, which is a real part of the rating
range this engine is asked to cover.

**Fix.** The strand-split computation moved into `designTransformer`'s own
`build()` closure -- the same formula `conductorSchedule` used to run on its
own (`hvAspect = 2.1`, `n = ceil(aHVreq / HV_STRAND_MAX_MM2)`, then
`hvRdCount`/`hvAxCount` from that) -- computed once, in one place, and
exposed on the design (`hvAxCount`, `hvRdCount`) for `conductorSchedule` to
read rather than recompute. The two can no longer disagree because there is
only one calculation left to disagree with itself.

The turn-level dimensions used everywhere downstream -- group/layer count,
`hvRadial`, and (through `wHVCovered`) the covering-copper cost -- changed
from a single strand's footprint plus one `hvPaper` covering to
`hvTurnAx = hvAxCount * (axHV + hvPaper)` and
`hvTurnRd = hvRdCount * (rdHV + hvPaper)`: every parallel strand gets its own
full covering, not a shared one. That convention is borrowed directly from
LV's own multi-strand split, which has used exactly this pattern
(`lvRadial = lvTurnLayers * lvRadCount * (tLV + lvIns)`) throughout this
engine already. It is reused here for consistency within the engine, not
because it has been independently confirmed for HV. Real construction may
use a lighter inter-strand covering than a full outer wrap per strand --
there is no reference sheet with a multi-strand HV winding to check against.
Flagged, not guessed past.

**Does a multi-strand winding need more radial space than the solid-block
formula assumed? Measured, not assumed either way.** The two ratings tested
do not move the same way, because the window-height bisection re-solves the
whole geometry jointly rather than simply padding the old design:

| | 5000 kVA before | 5000 kVA after | 10000 kVA before | 10000 kVA after |
|---|---|---|---|---|
| hvAxCount x hvRdCount | 1 x 1 | 3 x 1 | 1 x 1 | 4 x 1 |
| layers | 8 | 13 | 7 | 12 |
| hvRadial | 67.7 mm | 70.1 mm | 77.2 mm | 72.5 mm |
| load loss | 20282 W | 20273 W | 34623 W | 34475 W |
| ex-works | Rs 64.70 lakh | Rs 65.06 lakh | Rs 98.12 lakh | Rs 1.09 crore |

("before" is this engine with sections 37-40 applied but the strand split
still unfed -- isolated by reverting only the split logic, not by comparing
against a stale pre-section-37 baseline, so the numbers above are the split
itself, not bundled with the margin or convergence changes.)

At 5000 kVA, `hvRadial` grew by 2.4 mm (+3.5%): more strands, more layers,
and the per-strand covering nets out as more radial depth, matching the
naive expectation. At 10000 kVA, `hvRadial` fell by 4.7 mm despite covering
four strands instead of one: layer count rose from 7 to 12, and the
resulting per-layer radial thickness fell by enough to more than offset the
extra covering. So the honest answer is: it depends on how the strand split
reshapes the group/layer trade-off at that specific rating, not a fixed
"multi-strand always needs more room" rule -- the window-height solve moves
other dimensions in response, and which way the net radial figure goes is
an outcome of that solve, not a separate assumption this fix makes. Ex-works
moved +0.6% at 5000 kVA and +11.1% at 10000 kVA; the two ratings are not a
consistent multiple of each other because the discrete layer-count jump (7
to 12) changes duct count and mean turn length as well as radial depth.

**A separate, pre-existing problem surfaced while isolating this, not
caused by it.** 10000 kVA does not reach `autoFitConverged: true` either
before or after this fix -- confirmed by testing the reverted-split code
path directly rather than inferring it. This is the same slow-density-fit-
near-bMax problem section 40 already named at the default rating; 10000 kVA
was already in that regime before this change touched it. Left open, named
here so it is not mistaken for something this fix introduced.

Both existing reference designs (630 kVA, 1250 kVA) stay under
`HV_STRAND_MAX_MM2` and are byte-identical to before this change;
`reference-designs.test.mjs` and `card-cost.test.mjs` confirm it.


## 42. Search now holds a pinned flux or current density, instead of silently ignoring it

`searchDesigns` called `fitToSchedule(candBase, {})` on every candidate --
an empty `over`, regardless of what the live design being searched from
actually had pinned. `fitToSchedule`'s own lock checks (`over.flux`,
`over.deltaLV`/`over.deltaHV`) have worked correctly on the main design
path since section 38; the search simply never gave them anything to see.
A user who pins flux or current density is saying they have a reason --
often a tender requirement -- and a search that quietly explores and can
recommend candidates that ignore that reason is wrong in the same way the
K search comparing candidates on stale fits was wrong (section 39): the
search silently invalidating something the user, not even an earlier
search stage, deliberately fixed.

**Fix.** `searchDesigns(base, rates, band, opts)` reads `opts.over`
(defaulting to `{}`, so every existing call site that does not pass one is
unaffected). When it pins flux, the grade-clamped starting estimate
(`startFlux`, needed only to give an unlocked bisection a sane starting
point per grade) is skipped in favour of the design's own pinned value
exactly, and likewise for current density against the conductor-anchored
estimate. The real `over` is then passed to `fitToSchedule` itself, so its
own lock logic holds the pin on every candidate the same way it holds one
on the live design. `stagedSearchDesigns` needed no separate fix: it
passes `opts` through to both its stage-1 and stage-2 `searchDesigns`
calls via spread, so `opts.over` already reaches both.

A pinned value is not reclamped into a grade it does not actually fit --
a candidate the pin does not fit is honestly infeasible on the pin, not
quietly bent to make the grade look viable. `searchDesigns` now also
attaches `pinnedNote` to the results array it returns (same mechanism as
the existing `excludedNote`) naming which value is pinned and at what
figure, threaded through `searchWorker.ts` and surfaced on the Budget tab
exactly where `excludedNote` already is.

**Verified.** A 1.55 T flux pin held exactly (`|B - 1.55| < 0.001`) across
every candidate in a 3-grade x 1-conductor test grid, including grades
whose own bMax would have clamped an unpinned flux to a different value.
The unpinned case was re-checked on the same grid immediately after: flux
still varies freely across grades (2+ distinct values seen), so the fix
does not accidentally lock the search for everyone, only for a design that
actually pins something. `classBSolver.ts`'s own material-swap fallback
(`searchCatalog`) needed no equivalent fix -- it has always called the
real `computeDesign(core, { ...over, ...patch }, rates, [])` per candidate,
which is the main path this section brings `searchDesigns` up to, not a
second place that needed the same repair.


## 43. Correction: 10000 kVA's recorded non-convergence, and why leaving it recorded would have been worse than not recording it

This section originally logged `computeDesign({ ...ESSENTIALS, kva: 10000 },
{}, DEFAULT_RATES, [])` as returning `autoFitConverged: false`, attributed
to `fitToSchedule`'s density sub-loop struggling near the grade ceiling.
That entry is now wrong and is corrected here rather than deleted, because
a stale "broken" entry is a worse failure mode than no entry at all: it
tells the next person a fix is still needed when it either already exists
or the original diagnosis was itself incomplete.

Two separate things were true and got conflated. First, at the time this
was written, 10000 kVA's `autoFitConverged: false` was itself a
side-effect of whichever K `fitEtkToCost` happened to select that day --
item 5/6's shop-limit change (section 44) shifted the winning K to 0.48,
which happened to land density away from any discrete-geometry threshold,
so the rating now reports converged for a reason that has nothing to do
with the actual bug. Recording that as "fixed" would have been just as
wrong as recording it as "broken": neither the original K's failure nor
this K's success says anything about whether the underlying mechanism was
sound.

Second, and the real finding: that underlying mechanism -- `fitToSchedule`
oscillating around a discrete geometry threshold (`numGroups`/`layers`,
`lvAxCount`/`lvRadCount`, `hvAxCount`/`hvRdCount`, `hvDucts`) -- was never
specific to 10000 kVA or to flux sitting at a grade ceiling. Section 46
found it common across the whole flux range at both 1000 and 10000 kVA,
including at 1000 kVA's own default AUTO-K design, which had been
reporting `autoFitConverged: true` the entire time on a false positive
(the continuous window-spread check can be satisfied by chance mid-cycle --
see section 46). Section 46 is the actual fix; this entry is left here,
corrected, as the record of how "it converges now" was nearly taken at
face value for the wrong reason.


## 44. Window aspect ratio replaced by two direct shop limits: coil height and tank height

`maxAspect` (window height over window width, sections 28/32) was always a
proxy for the real question -- does this coil fit the winding machine, does
this tank fit under the crane -- inferred from two Mehir sheets and two
furnace core charts because the actual shop limits were not on file. Now
that they are, the ratio is replaced with the two real limits directly:
`coilHeightLimit` (880 mm default, checked against the taller of `hLV` and
`hHV`) and `tankHeightLimit` (1500 mm default, checked against `tankH`,
which covers the dry-type enclosure too -- both are computed for either
medium). `compliance.aspect` is gone; `compliance.coilHeight` and
`compliance.tankHeight` take its place, read by `searchDesigns`,
`fitEtkToCost`'s own feasibility filter, and the `documentRegister`-style
"missed" reasons list the same way `.aspect` was.

Deliberately **not** application-aware the way `maxAspect`'s default was.
A ratio limit varies by application because different duties produce
different ratios for the same physically buildable coil; a winding
machine's maximum coil length and a shop's crane/pit height are fixed
pieces of equipment that do not change with the duty being wound. A job
on genuinely different tooling still gets its own number, the same as
before -- both limits stay editable per design.

**A real consequence, not a bug:** because the two new limits are
numerically independent of the old ratio, they do not agree with it at
every rating -- a 2500 kVA furnace-duty design that was aspect-compliant
under `maxAspect`'s old furnace default (5.0) now fails on tank height
(1572 mm against the 1500 mm default): 630 kVA and 1250 kVA furnace duty
stay compliant (both comfortably under both new limits), 2500 kVA does
not. This is the fix doing its job -- a real physical ceiling catching a
design the inferred ratio did not, not a regression. The default 1000 kVA
case is unaffected (622 mm coil against 880 mm, 1330 mm tank against
1500 mm, both comfortably clear).

Because `fitEtkToCost`'s own K search uses this feasibility check to pick
the AUTO-K design (section 26), and the new limits do not draw the exact
same feasible/infeasible line the old ratio did, the chosen K -- and so the
whole downstream geometry -- can shift for a design near that old boundary
even when both the old and new checks pass. Observed directly: a 5000 kVA,
33/11 kV power-duty ONAF test case (used only for a value-agnostic
"fanCount > 0" assertion, not a golden number) moved from 9 to 10 fans.
Not a defect -- the same bracket-sensitivity cascade `maxAspect`'s own
default change (section 32, ENGINE_VERSION 1.17.0) already produced at
2000 kVA's impedance solve. `ENGINE_VERSION` bumped to 1.21.0.

## 45. Furnace duty stray allowance corrected against the designer's stated range

None of the eight application presets' `stray` figures (12/15/24/26/10/20/
22/14, CALIBRATION.md's own APPS table) had ever been checked against a
real source -- confirmed by searching this file, DRAWINGS.md, MANUFACTURING.md
and every code comment near the table: nothing. The designer's own stated
practice for harmonic-duty loads is 15-25% eddy and stray loss. Checking
the four presets that duty covers: rectifier (24), solar (20) and ups (22)
already sat inside that range. Furnace was the one outside it, at 26 -- one
point past the top, with nothing behind that specific figure either.

**Fix.** Furnace duty's `stray` corrected 26 -> 25, anchored at the top of
the designer's stated range rather than left one point past it. The top of
the range, not the middle, because furnace duty (arc furnace supply) is
the most harmonic-severe of the four -- current chopping and a wide
harmonic spectrum, more so than a solar inverter or a rectifier's more
regular ripple. The other seven application presets are unchanged and
still unsourced; only furnace was checked and fixed this pass.

Current density was not given a separate harmonic correction. `loadLoss =
(i2rLV + i2rHV) * (1 + stray/100)` already means a higher stray allowance
raises calculated load loss for the same geometry, and `fitToSchedule`
(autoFit) responds by targeting a lower current density to stay inside
the declared loss schedule -- the density correction the designer asked
to check happens automatically through the stray figure, not as a
separate mechanism that needed building. No golden number moved: the
default case is distribution duty, not furnace, and furnace's own two
reference points (630, 1250 kVA furnace charts used for the Construction B
cutting-chart test) call `coreCuttingChart` directly with explicit
geometry, bypassing `stray` entirely.


## 46. fitToSchedule oscillating around a discrete geometry threshold -- diagnosed at source, fixed, not worked around a fourth time

Slow Class B pin solves (section 40), the 1250 kVA oscillation (section 38)
and 10000 kVA's recorded non-convergence (section 43, now corrected) were
three symptoms of one cause, not three separate faults. Diagnosed before
any fix, as instructed.

**What actually happens.** In a free fit, flux converges to the grade
ceiling or floor within 2-4 iterations and stops moving -- confirmed by
direct trace. With flux fixed, every correction lands on `deltaLV`/
`deltaHV`, chasing the load-loss target. Changing density changes
conductor area, which changes `lvAxCount`/`lvRadCount`/`hvAxCount`/
`hvRdCount`/`numGroups`/`layers` -- integer quantities computed with
`floor()`/`ceil()`/`round()` inside `designTransformer`, each a step
function of a continuous input. When density's own fixed point sits near
one of these integer boundaries, a fractional-percent change in density
flips the discrete quantity, jumping load loss by roughly 1.5% for no
real change in conductor size. The corrector reacts to the jump and
pushes density back across the boundary next iteration -- a genuine
limit cycle, not slow convergence: traced 30+ iterations at 1000 kVA with
flux locked at 1.75 T (a plain interior value, not even a grade boundary)
and it never narrows.

**Why damping alone cannot fix it.** `FIT_RELAX` shrinks the step size of
a correction toward a *smooth* target. At a step discontinuity the
fixed-point equation has no solution at the boundary, so any nonzero step
across it flips the discrete quantity and produces the jump regardless of
step size -- damping slows the approach, it cannot stop the crossing.

**The correction to the original hypothesis.** This is not narrowly
"flux stuck at the ceiling." Locking flux at 1.75 T (interior, not a
boundary) at 1000 kVA reproduced the identical oscillation. A flux sweep
across the full range through the real `fitToSchedule`, before any fix,
found it common, not rare: 4 of 8 candidates failed to converge at
1000 kVA, 1 of 8 at 10000 kVA -- exactly why a Class B pin solve, which
tries flux candidates across a bisection rather than only the boundary,
is slow. Flux saturation is real and worth its own report (below), but it
is not the mechanism that causes the oscillation.

**The fix.** `fitToSchedule` now tracks a discrete geometry signature
(`discreteGeometrySignature`: `numGroups`, `layers`, `lvAxCount`,
`lvRadCount`, `hvAxCount`, `hvRdCount`, `hvDucts`) alongside its existing
continuous window-spread check. If the current signature matches one seen
2-8 iterations back, with a *different* signature seen strictly in
between (genuine alternation, not "hasn't changed recently," which the
continuous check already covers), a cycle is confirmed and the loop exits
immediately rather than grinding to `FIT_MAX_ITERS`.

Detecting the cycle is not sufficient on its own -- both discrete states a
fit alternates between are real, buildable designs, and stopping on
whichever one the loop happened to be at is the same arbitrary snapshot
the old behaviour produced. `resolveFitCycle` groups the recent history by
signature (using samples already computed during cycling, no extra
`designTransformer` calls) and, for each state, keeps the sample closest
to the intended margin target among that state's own compliant samples --
or its closest approach, if none of that state's samples are compliant.
The state closest to the margin target across all compliant states is
chosen; if no state is compliant, that is reported explicitly rather than
silently returning one of them anyway. `autoFitCycleNote` names every
state considered, which one was chosen and why -- the same principle
`etkNonCompliant` already established, applied to a different failure.

**A second, real bug found while verifying this, fixed before shipping.**
The chosen state's flux/density were being rounded to 2 decimal places
for a clean report, and rounding alone could cross back over the exact
threshold the choice was just made to land on -- found directly: choosing
(numGroups 7, layers 12, lvRadCount 5) at 5988 W, then rounding, silently
rebuilt (numGroups 6, layers 14) at 6160 W instead, undoing the
resolution the whole mechanism exists to provide. Fixed by verifying the
rounded values reproduce the chosen signature before rounding at all; if
rounding is unsafe, the unrounded values are returned instead of a
tidier number that quietly reverts the choice. Regression-tested
(engine.test.mjs: "returned flux/density reproduce the chosen state").

**Flux saturation, surfaced separately, as requested.** `autoFitFluxLimit`
is reported whenever flux is free and ends up pinned at the grade's own
ceiling or floor, regardless of whether density is also cycling --
`{ at: "ceiling"|"floor", value, noLoad, limit, compliant }`. The two
directions carry opposite meaning, both reported so the reader does not
have to work out which matters: saturating at the **ceiling** means the
fit would use MORE flux (a cheaper core) if the grade allowed it, and
generally still has no-load margin to spare -- not a compliance problem,
an economic one. Saturating at the **floor** means the fit would use LESS
flux if it could, and the design may still not meet its no-load target on
this grade at this geometry -- the case actually worth a human's
attention, matching the original hypothesis's own example exactly.

**A finding that changed the default case's own golden numbers.** Tracing
the OLD code directly at the default case's own winning K (0.46) found it
was *never* at a genuine fixed point -- `numGroups`/`layers` was still
alternating between 6 and 7 past iteration 40. The old continuous
window-spread check happened to be satisfied at iteration 41 anyway,
because five consecutive damped correction steps can have a small spread
purely by chance while the discrete signature underneath keeps flipping.
That is a false-positive convergence, not a real one: `autoFitConverged:
true` was reported, and a snapshot of whichever state was active at that
lucky moment became the recorded golden number (load loss 5991 W), with
no claim to being better than the alternative it was still cycling
against. `ENGINE_VERSION` bumped to 1.22.0; engine.test.mjs's default-case
numbers, the four impedance-deviation baselines (bracket-sensitive to any
change that moves the winning K, the same cascade every prior K-moving
change in this project has produced -- sections 30, 32, 39 among them),
and the fan-count/fin-area value-agnostic checks all updated to the new,
deliberately-chosen, genuinely stable numbers.

**Verified: the flux sweep, re-run after the fix.**

| flux (T) | 1000 kVA before | 1000 kVA after | 10000 kVA before | 10000 kVA after |
|---|---|---|---|---|
| 1.42 | converged | converged | converged | converged |
| 1.48 | oscillated | converged (cycle-resolved) | converged | converged |
| 1.54 | converged | converged (cycle-resolved) | converged | converged |
| 1.60 | oscillated | converged (cycle-resolved) | oscillated | converged (cycle-resolved) |
| 1.66 | converged | converged (cycle-resolved) | converged | converged (cycle-resolved) |
| 1.72 | oscillated | converged (cycle-resolved) | converged | converged (cycle-resolved) |
| 1.75 | oscillated | converged (cycle-resolved) | converged | converged |
| 1.78 | converged | converged (cycle-resolved) | converged | converged |

16 of 16 converge after the fix, against 12 of 16 before. Several points
that already reported "converged" before the fix are now flagged
"cycle-resolved" instead -- those were the same false-positive failure
the default case had (a lucky quiet window mid-cycle), caught now because
the discrete-signature check does not depend on chance the way the
continuous-only check did. Per-candidate time fell from 450-580ms (grinding
to `FIT_MAX_ITERS`) to well under 200ms typically, since a confirmed cycle
exits the loop immediately rather than running out the full cap -- a real
benefit for Class B pin solve speed, though re-measuring the full pin
solve was not part of this section's own scope.


## 47. Drawing 21 (stamping schedule) did not know Construction B existed

`stampingSchedule(d, steps)` took no `params` argument at all, so it could
never read `coreConstruction` -- selecting Construction B in the UI
correctly reached the engine and drawing 22 (confirmed directly: traced
`p.coreConstruction` through `designTransformer` and `coreCuttingChart`,
both read "B" correctly, `chart.construction` came back "B"), but drawing
21 had no way to know and always rendered Construction A's own
limb/yoke layout regardless of what was selected. Most likely what was
actually being looked at when Construction B "did not show".

**Fix.** `stampingSchedule(d, steps, p)` now takes the same third
argument `coreCuttingChart` already does, and delegates to the exact
same `coreConstructionB()` call when `p?.coreConstruction === "B"` --
not a second B-model of its own. Construction A keeps its own two
deliberately-different models (this schedule's continuous-stack
approximation vs drawing 22's whole-sheet chart, ~2% apart, unchanged
from before); Construction B has only ever had one model, so both
documents now use it and agree exactly -- confirmed directly, both
report 2129.92 kg core total at the same 1250 kVA furnace design.

The React side (`StampingSchedule` in Drawings2D.tsx) now branches the
same way `CoreCuttingChart` does: Construction A keeps its schematic and
limb/yoke table; Construction B renders the V-Notch/Outer/Centre tables
via a `plateTable()` helper pulled out to module scope so both
components call the identical rendering code on the identical rows, not
two copies that could drift apart. No schematic for B, same reasoning as
drawing 22: the three tables are already every number a schematic would
add.

`reference-designs.test.mjs`'s own `stampingSchedule` call updated to
pass `r1250.params` -- that reference is Construction A (default), so
the assertion value is unchanged (1739.83 kg, confirmed).


## 48. wCore is purchased weight; core loss needed a separate, assembled mass -- and the first fix attempt reproduced a bug this file already found once

Traced why Construction B's own cost search moved to a core 20% larger in
diameter than Construction A's at the same 1250 kVA furnace design, when
B's steel costs more per kg-equivalent (the real V-notch scrap penalty,
6-21% more steel than A for the identical geometry) -- the naive
expectation is a smaller core, not a bigger one. Root cause: `noLoad =
wPerKg * wCore` and `i0pct`'s own formula both used `wCore`, which is
construction-specific -- correctly so for cost (Construction B's cutting
pattern genuinely needs more purchased steel than A's for the same
finished core), wrongly so for loss physics. Scrap steel does not carry
flux. Using B's scrap-inflated purchased mass for `noLoad` made a
genuinely different core -- steel that generates no loss at all -- look
like it does, which pushed the flux-fitting correction down, which
pushed the required core cross-section up for the same K, which failed
the tank-height shop limit at low K specifically for B and forced the
search into the higher-K region it should never have needed.

**Fix.** `wCoreAssembled` is now a separate quantity: cost, the BOM and
the cutting charts keep `wCore` (purchased, construction-specific,
unchanged); `noLoad` and `i0pct` (exciting current) now read
`wCoreAssembled` instead. Named so the two cannot be confused again --
"purchased" and "assembled" appear in both the variable names and the
calc sheet's own row labels, and the calc sheet's no-load and exciting-
current rows now say explicitly "not the purchased weight above."

**The first attempt at `wCoreAssembled` was wrong, and was caught before
shipping.** The obvious-seeming derivation -- net/gross area times the
total mean magnetic path length (`aGross * (3*Hw + 2*(2*cc+dCore))`),
the standard textbook core-weight estimate -- turns out to be EXACTLY
the formula section 15 already found and replaced for `wCore` itself,
for the same reason: it treats every lamination as if it ran the full
window height regardless of step, which overstated the limb by +6.6%
against the 1250 kVA reference's own real cutting chart. Reusing it
under a new name reproduced the same overstatement, discovered by
checking the new quantity against wCore directly rather than trusting
the reasoning because the formula looked standard. Not shipped.

**What is actually used instead: Construction A's own limb + yoke
formula, computed unconditionally.** Construction A's formula (Plate A,
2 x width per step; the yoke's own aGross x span term) is this engine's
best validated estimate of what a real, finished, assembled core of a
given dCore/Hw/cc/steps actually weighs -- checked against two real
reference builds, one of them (the 1250 kVA sheet) to within 0.5 kg
against that sheet's own reported cutting-chart total (section 15). A
Construction A core and a Construction B core built to the same
dCore/Hw/cc are the same finished magnetic circuit; `wCoreAssembled` is
now Construction A's own formula regardless of which construction is
actually selected, since that formula is this engine's own best answer
to "what does a real, assembled core of this shape weigh," independent
of which cutting method built it.

**Construction A's own scrap fraction, checked first as instructed: not
separable from what this engine currently has, and reported as such
rather than guessed at.** Since `wCoreAssembled` IS Construction A's own
formula, `wCore` and `wCoreAssembled` are now identical BY CONSTRUCTION
for every Construction A design -- confirmed directly, equal to six
decimal places at the default case. This is not zero because A's real
fabrication has no mitre scrap at all (it certainly does, to some
physical degree); it is zero because this engine has no validated,
non-invented way to subtract a scrap allowance from a formula that
already matches a real reference to within 0.5 kg without either
guessing a fraction or reproducing the aGross x 3 x Hw formula already
shown wrong above. Every no-load figure this engine has produced under
Construction A -- which is every design that does not explicitly select
B, since A is the default and B is not auto-suggested -- is UNCHANGED by
this fix. That is narrower than "every no-load figure this tool has
produced is inflated," and is reported as the actual finding rather than
the one that was expected going in.

**Construction B's own scrap fraction is real and now correctly
excluded from loss physics.** At the 1250 kVA furnace design:
`wCoreAssembled` 1231.9 kg against purchased `wCore` 1485.1 kg, 17.1%
-- inside the 6-21% range section 45 already found at matched geometry,
now confirmed from the production formula itself rather than a separate
isolated check.

**Verified: the backwards K-search is gone.** At the same 1250 kVA
furnace design, Construction B's own cost-optimal `dCore` and `etK` now
match Construction A's exactly (239.8 mm, K = 0.48 -- both were),
confirming the shop-limit infeasibility the inflated `noLoad` was
manufacturing at low K is gone. Regression-tested in engine.test.mjs.

**Superseded by section 57 below, for the "match exactly" claim only.**
Section 57 gives Construction B a real, higher building factor than
Construction A (V-notch runs measurably more loss than master mitre), so
B's own cost-optimal point is no longer expected to match A's exactly --
it should, and now does, differ by a modest amount driven by that real
loss difference. The finding THIS section made -- that the old bug pushed
B toward a runaway BIGGER core, and that bug is gone -- still stands;
engine.test.mjs now checks the bounded, buildFactor-explained divergence
rather than exact equality, and the numbers this section quotes (239.8 mm,
K = 0.48 both) are the value at the time this section was written, not
current.

`wFrame` (clamping/frame mass) stays on `wCore`, not `wCoreAssembled`:
frame sizing is a mechanical consequence of the real, physical,
purchased core, not of its flux-carrying properties.

No golden number in engine.test.mjs moved -- the default case is
Construction A, and Construction A is now provably unaffected by this
fix. `reference-designs.test.mjs` and `card-cost.test.mjs` are also both
Construction A (the default) and unaffected. `ENGINE_VERSION` bumped to
1.24.0 regardless, since this is a real formula change reachable by any
design that selects Construction B, even though the default case does
not move -- the same principle as section 41's HV strand-split fix.

## 49. The K search was picking sample points on a staircase, not the optimum -- fixed to find the plateau and report it as a range

A fine-resolution sweep (CALIBRATION.md is not the place that sweep itself
is reported -- see the conversation that requested it) showed the ex-works-
vs-K curve is not smooth. It is a staircase: flat plateaus, each one a single
discrete winding configuration (numGroups/layers/lvRadCount and the rest),
separated by sharp transitions where the configuration flips. At 630 kVA the
winning plateau spans roughly K = 0.443-0.463; a coarse grid landing inside
it is luck, not a property of the search. The old `fitEtkToCost` evaluated a
fixed 0.02-step grid, refined around the cheapest point, and returned that
point's own K verbatim -- a point that can sit anywhere in its plateau,
including right at an edge, where the next small change to anything else
(a rate, a clearance, a schedule revision) tips the design into a different,
more expensive configuration for no engineering reason.

**Fix: find the plateau, not the sample.** `etkPoint` (`packages/engine/
index.js`) now returns its own discrete configuration `signature` --
`discreteGeometrySignature(d)`, the same function `fitToSchedule`'s own
cycle detector already used (section 46) -- alongside its cost. The existing
coarse-then-refine grid scan (`etkCurve`) is unchanged and still finds the
cheapest feasible sample, `fastBest`. What changes is what happens next:

- `pickPlateauMidpoint` first checks whether the curve already sampled a
  point with a *different* signature on each side of `fastBest` -- the
  refine window usually has, since it brackets the coarse winner tightly.
  If so, that point is reused directly, at zero extra cost.
- Where no such point exists, `findPlateauEdge` walks outward from
  `fastBest.etK` in fixed small steps until it finds one, then bisects
  between the last point still inside the plateau and the first point
  outside it -- on **signature**, not on cost. Cost is not monotonic near a
  transition (the diagnostic that motivated this fix found genuine local
  dips just past a boundary), so bisecting on cost would not reliably find
  the edge; the signature is a clean step function and bisects exactly.
- The two edges bracket the plateau. `fitEtkToCost` reports it as a range,
  `etkPlateauLo`/`etkPlateauHi` (both now threaded through `computeDesign`'s
  return, alongside `params.etK`), and builds the final design at the
  **midpoint**, rounded to three decimals -- not at `fastBest.etK` itself.
  A midpoint design keeps its configuration under a small perturbation from
  any direction; an edge design does not.
- The midpoint's own signature and feasibility are checked against
  `fastBest`'s before being accepted. If the midpoint calculation somehow
  lands outside the plateau it was built to represent (a narrow plateau,
  or a rounding artefact at three decimals), `fitEtkToCost` falls back to a
  precise refit of `fastBest.etK` itself rather than ship a design that
  silently is not what the range claims it is.

**Cost is provably unaffected.** Every point on a plateau shares the same
discrete configuration, so ex-works at the midpoint equals ex-works at
`fastBest` to within normal fit tolerance -- confirmed directly: the default
1000 kVA case's ex-works is unchanged (Rs 21,00,057, the same figure
engine.test.mjs already pinned) even though the reported `etK` moved from
the old grid winner (0.46) to the plateau midpoint (0.453). What moves is
only which K is *reported and built at* within a cost-equivalent range --
exactly the point of the fix.

**Performance, measured honestly.** The bisection adds real cost: roughly
a dozen extra fast `etkPoint` evaluations per design (two directions, each
walking to a confirmed opposite-signature point and then bisecting a fixed
number of iterations against it). Measured on the default 1000 kVA case,
`computeDesign` end-to-end: ~1449 ms before this fix, ~2732 ms after --
about 1.9x. Confirmed by instrumenting the expansion step directly that the
added cost is the bisection phase only; the expansion phase itself does not
fire for this case, because the refine window already contains a usable
opposite-signature point on both sides (the common case, not a fortunate
one -- the refine window is built specifically to bracket the coarse
winner). Iteration counts were tuned down from an initial, uncritically-set
10 per phase to 6, which recovers most of the difference without giving up
meaningful precision -- the plateau edges move by a few thousandths of K at
most between 7 and 6 iterations, well inside the range the search itself is
reporting as flat.

**Scope check: flux and density were swept too, report only.** Holding K
fixed at its plateau midpoint and sweeping flux (0.01 T steps, 1.42-1.72 T)
and separately deltaLV (0.05 A/mm2 steps) at the default 1000 kVA case shows
the same underlying structure -- long runs of one discrete signature with
cost falling smoothly inside each, interrupted by sharp transitions, and,
near several of those transitions, genuine local non-monotonicity (for
example deltaLV: Rs 16,87,327 at 2.30, Rs 17,26,591 at 2.35, back down to
Rs 16,69,516 at 2.40 -- a real dip just past the boundary, not sweep noise,
the same signature the K curve showed). The cause is the same one behind
section 46 and this fix: numGroups/layers/lvRadCount and the rest are
floor()/ceil()/round() of a continuous fit variable.

This does not currently need the same plateau-finding fix, for a narrower
reason than "it isn't a staircase": flux and density are not searched for a
cost optimum today. `fitToSchedule` fits them to satisfy the loss schedule
(with the 1.42 T floor), not to minimise ex-works, so there is no grid scan
over flux or density that a boundary sample could mislead the way the K
grid could. If a future change adds an explicit cost sweep over either --
the same class of feature this section's fix was written for -- it will
need the same treatment: bisect on `discreteGeometrySignature`, report a
range, build at the midpoint. Flagged here so that need is not rediscovered
from scratch; not implemented, because nothing today searches on this axis.

`ENGINE_VERSION` bumped to 1.25.0. No golden number in engine.test.mjs,
reference-designs.test.mjs or card-cost.test.mjs moved -- every plateau
sampled by an existing golden design keeps the same signature and,
therefore, the same cost at its midpoint as it had at the old grid winner.
What changed is real and reachable by any AUTO-`etK` design: the specific
`etK` value `computeDesign` reports and builds at, and the new
`etkPlateauLo`/`etkPlateauHi` fields now present whenever `fitEtkToCost`
actually ran.
## 50. A converged fit can still be a coin flip -- density can sit at a discrete boundary without ever cycling, and the resolution that exists for cycling is not, on its own, stable

Requested after section 49: does the same staircase apply to flux and
density, and if it does, does it matter given neither is cost-searched?
A fine sweep of both at the three reference ratings answered both parts.
Flux, holding K and density fixed, showed no signature change at all --
expected, since at fixed Et changing B resizes the core cross-section, not
the turn count, so it does not move the winding-discrete fields this
signature tracks. Density (deltaLV/deltaHV) is a different story: at 630
and 1000 kVA the fitted point sits inside a region where the winding
signature genuinely oscillates within a few thousandths of an A/mm2, not
just close to one edge -- confirmed with a 0.003-0.005 step scan around
each fitted value. At 1250 kVA the same scan found nothing -- a wide, flat,
single-signature band. This matched, exactly, which two ratings
`autoFitCycleNote` (section 46) already fires for and which one it does
not.

That match looked at first like the existing cycle detection already
covered this. It does not, for a reason worth stating plainly: cycle
detection only fires when the fit's own damped iteration happens to
*visibly cross* the boundary while converging. A trajectory that lands on
one side and settles there on its first approach never cycles and never
calls `resolveFitCycle`, even when the point it settled on is exactly as
close to the boundary as one that did cycle. Checked directly with a
starting-point sweep at 630 and 1000 kVA (holding K, rates and everything
else fixed, varying only where the density fit started): the final
discrete state, and so the reported price, depends on the starting point,
not only on the enquiry. At 630 kVA seven starting points across a
realistic spread produced three different states across a Rs 15,52,163 to
Rs 16,96,425 range -- about 9% -- and one starting point did not even
converge inside the iteration cap. At 1000 kVA two states spanned
Rs 20,51,984 to Rs 21,32,895, about 4%. Nothing about the enquiry changed
between these runs.

**Fixed: probe the converged point's own neighbourhood directly, report
the alternate.** `checkFitStability` (`packages/engine/index.js`, next to
`resolveFitCycle`) runs after the final fit, whenever something was
actually auto-fit (skipped if both flux and density are locked, or autoFit
is off). It nudges deltaLV, deltaHV and flux outward in small fixed steps
(0.005-0.03 A/mm2 for density, 0.005-0.02 T for flux) using
`designTransformer` alone -- never a re-fit, this asks whether the point
already held is fragile, not for a better one -- and stops at the first
step, on either axis, in either direction, where `discreteGeometrySignature`
differs from the base point. The nearest one found is priced with
`buildBOM` and returned alongside the design: `fitStable`, and when false,
`fitInstabilityNote`, `fitAlternateExFactory`, `fitAlternateSignature`,
`fitAlternateAxis`, `fitAlternateDelta`, `fitAlternateCompliant`.
`fitStable` reads true when nothing was probed, the same absent-reads-as-
fine convention `autoFitConverged` already uses.

This is deliberately distinct from `autoFitCycleNote`: that field says a
boundary was crossed during the fit and which side was kept.
`fitInstabilityNote` says the side that was kept, crossed or not, is this
close to a different, equally real, equally priced transformer. Both can
fire together and did in every case checked -- a state `resolveFitCycle`
had to arbitrate between is, unsurprisingly, also a state sitting right at
a boundary -- but they answer different questions and a design can in
principle trip one without the other (a trajectory that never cycles but
still lands within the probe radius of a boundary).

Cost: the probe is cheap -- `designTransformer` alone, no iteration -- and
the added time was within the run-to-run noise of the section 49
measurement on the same case, not a further, separate slowdown.

Surfaced in the UI the same way `etkNonCompliant` already is: a second
amber banner directly under the rating plate ("This Price Sits Right At A
Winding Configuration Boundary"), gated the same way -- absent while
viewing a budget preview (`searchDesigns` builds candidates directly and
never runs this fit at all) and driven by the browsed revision's own
frozen result when one is being viewed, never the live design.

No `ENGINE_VERSION` bump: this changes what `computeDesign` *reports*, not
what it *builds* -- every existing design still resolves to exactly the
state it resolved to before this section, at exactly the same price. The
invariant this bump exists to protect (a quotation issued last year
reprices exactly as issued) is untouched.

**Whether the choice can be made stable, not merely deterministic --
reported, not changed.** Requested: would ranking candidate states by
cheapest-compliant, or by most margin, instead of `resolveFitCycle`'s
current closest-to-target rule, give the same answer regardless of
starting point? Enumerated the real nearby states directly (not via a
single trajectory's own path) at both ratings. At 1000 kVA, of the two
states in play, `7|12|4|5|1|1|2` is the clearly, consistently cheaper
compliant one; at 630 kVA, `8|13|3|4|1|1|2` is. "Cheapest compliant" and
the current "closest to the 93%-of-limit margin target" rule mostly agree
in principle -- for a single state, pushing loss up toward its own ceiling
is both "closer to target" and "cheaper," since more permitted loss means
less copper.

The instability is not in which rule ranks states -- it is in which
states get compared at all. `resolveFitCycle` only ever sees states its
own trajectory happened to visit while genuinely cycling. A trajectory
that converges cleanly never calls it, so whatever it settled in stands
unquestioned even when a cheaper compliant neighbour sits two steps away.
Swapping the comparator inside `resolveFitCycle` for "cheapest compliant"
or "most margin" would not fix this on its own, because it would still
only ever compare whatever a single damped, path-dependent iteration
happened to stumble into. Genuine starting-point invariance needs the
same change section 49 made for K: replace passive discovery (wait for
cycling to reveal a neighbour) with active discovery (probe the
neighbourhood directly, the same mechanism `checkFitStability` above now
uses for reporting) before ranking. That is a real change to how
`fitToSchedule` settles on a state, not a one-line comparator swap, and is
not made here -- reported per the request, not implemented.
## 51. Making the choice actually stable, not just reported -- active neighbourhood resolution replaces resolveFitCycle

Section 50 reported the instability; this section fixes it. Requested
directly: a 9% cost swing from where a numerical fit happens to start is
not something a quotation tool can carry, and reporting that it happens
is not the same as resolving it.

**What changed.** `resolveFitCycle` (section 46) is gone. It only ever
compared states its own damped, path-dependent trajectory happened to
visit while genuinely cycling, and never ran at all when the trajectory
converged cleanly -- even onto a point sitting a fraction of a percent
from a cheaper compliant neighbour. In its place, `fitToSchedule`'s loop
now treats a detected cycle purely as an early exit (stop wasting
iterations bouncing between two states, hand the current point on) and a
new function, `resolveDiscreteNeighbourhood`, actively finds and prices
the real nearby discrete states and picks the cheapest one that still
meets the declared loss limits -- run whether or not a cycle fired, since
a clean convergence next to a boundary is exactly as arbitrary.

**How it searches.** `discreteGeometrySignature` (unchanged) still
identifies a winding configuration. Discovery sweeps a coupled multiplier
(deltaLV and deltaHV scaled together, matching the single factor
`fitToSchedule`'s own damped correction already uses) plus independent
per-axis probes and a small flux band, using `designTransformer` alone --
cheap, no `buildBOM`. For each distinct signature found, a second pass,
`refineWithinSignature`, bisects along the same coupled direction onto
that state's own compliance ceiling (cost falls smoothly as permitted
loss rises, right up to whichever binds first: the schedule or the
signature's own edge -- a real root of the physics, not a sampling
artefact). Only then does `buildBOM` run, once per distinct signature, to
pick the cheapest compliant one.

**Getting to actual starting-point invariance took four real bugs, found
in this order, each one by testing against the exact starting-point sweep
that found the original problem:**

1. *Refining along the seed's own ray reproduced the seed-dependence one
   level down.* The first version anchored both discovery and refinement
   on whatever deltaLV/deltaHV the caller's own trajectory had converged
   to. `fitToSchedule`'s damped correction scales both by one shared
   factor per iteration, so it preserves whatever LV:HV ratio the seed
   started with -- and different seeds converge onto different ratios
   once each conductor's own dMax clamp engages differently. Refining
   along that ray still gave a ~1-3% price spread across starts even when
   every start agreed on the signature. Fixed by anchoring discovery and
   refinement on the canonical `densitySuggest` ray -- a pure function of
   the spec, not of wherever this particular fit started -- the same reset
   `etkPoint` already applies to flux/density for the same reason
   (section 39). The seed itself is kept only to report what the raw,
   unresolved trajectory would have cost, and is deliberately excluded
   from competing for a signature's own discovery entry, or a
   seed-derived sample could still win that comparison and reintroduce
   the same dependency through the back door.

2. *The canonical ray's own search window was too narrow.* A ±25-35%
   window around the canonical suggestion found the right answer at 1000
   and 1250 kVA but left 630 kVA's cheapest compliant state unreachable --
   its own true resolution needs a density well outside that band. Fixed
   by widening the coupled sweep to 0.4x-1.8x of the canonical suggestion,
   matching the same [0.7, conductor's own dMax] bound `fitToSchedule`'s
   own iteration already clamps to, rather than an arbitrary window around
   a starting guess.

3. `pickPlateauMidpoint` (section 49) used to verify its own midpoint
   still carried `fastBest`'s own signature before accepting it -- correct
   when the K-plateau's full-precision call only ever refit at higher
   tolerance, wrong now that it also resolves density (this section), which
   deliberately moves to a different, cheaper signature whenever it finds
   one. The equality check rejected the resolution's own improvement on
   nearly every design, silently falling back to the unresolved point
   this whole section exists to avoid, at roughly twice the cost (the
   fallback itself also resolves). Fixed by dropping the signature check
   from that fallback condition, keeping only the feasibility check it was
   paired with.

4. *Pushing to the compliance ceiling and then rounding for a clean report
   can cross back over the limit.* The same concern section 46 first
   found for `resolveFitCycle`'s own chosen state, reintroduced here by
   deliberately parking at the edge of compliance rather than a point with
   margin to spare. Found directly: the first design tried this way came
   back non-compliant after 2-decimal rounding. Fixed the same way as
   before -- verify the rounded point is still both the right signature
   AND still compliant before accepting it; keep full precision otherwise.

**A fifth issue, found the same way, was about flux, not density.** An
earlier draft re-derived flux from `fluxSuggest` the same way density is
canonicalised, reasoning it should be just as seed-independent. That broke
`autoFitFluxLimit`'s own ceiling-saturation report at 1250 kVA: flux
genuinely needs fitting (it chases the no-load target, including
saturating at the grade's own ceiling when that is where the target puts
it), not just a starting guess, and the seed's own already-fitted flux is
the correct basis -- re-deriving it silently discarded a real fit for an
unfit suggestion. Fixed by keeping flux at the seed's own value throughout
(checked directly: flux does not move `discreteGeometrySignature` at all,
holding density fixed and sweeping flux across its full range finds no
signature change, so it was never the source of the instability this
section targets).

**A small residual remains, and is not the same bug.** Flux and density
are fit in the same coupled iteration, both feeding the same window-height
solve, so a different starting density can leave the iteration's own
converged flux a few thousandths of a tesla off a different one before
resolution ever runs. Checked directly across the same starting-point
sweep: this leaves a real but small residual, under 0.1% of ex-works, two
orders of magnitude below the >9% the discrete-signature instability
caused. This is a genuine, small, physical coupling between two
continuously-fitted quantities, not a discrete boundary a design can land
on either side of -- regression-tested at that tolerance, not papered over
with a wider one to make a test pass.

**Verification: the same starting-point sweep that found the problem,
reported in full.** Seven starting multipliers (0.85 to 1.40) on the
natural `densitySuggest` anchor, at each rating's own cost-optimal K:

| kVA | K | Discrete states across 7 starts | Price spread |
|---|---|---|---|
| 630 | 0.453 | 1 (was 3) | 0.000% (was ~9%) |
| 1000 | 0.465 | 1 (was 2) | 0.077% (was ~4%) |
| 1250 | 0.472 | 1 (was 1) | 0.000% (unchanged -- already stable) |

No rating still varies with starting point in the sense that prompted
this section. Regression-tested permanently in engine.test.mjs, not just
reported once here.

**Default case, and every other rating that cycles, moves.** The default
1000 kVA case is itself one of the designs that used to cycle -- its own
ex-works falls from Rs 21,00,057 to Rs 20,39,020 (etK moves 0.46 to
0.465), because the actively-chosen cheapest compliant state genuinely is
cheaper than wherever the old trajectory-limited resolution happened to
land. Every golden number downstream of it in engine.test.mjs moved with
it, along with the impedance-solve baselines at 100, 630 and 2000 kVA
(2500 kVA, already exact, stays exact) -- all recorded as found, per this
file's own convention, not tuned toward round numbers.

`autoFitConverged` is redefined: it now reports purely on the damped
iteration's own dynamics (did it reach a stable point without cycling),
independent of whether the point it reached, or resolution moved it to,
is any good. That question now belongs to `fitResolutionNote`
(`fitBoundaryFound`/`fitResolutionNote` on `computeDesign`'s own return,
superseded by `etkFitBoundaryFound`/`etkFitResolutionNote` when the K
search ran, the same pattern `etkFitConverged` already established) --
present whenever the neighbourhood search found more than the seed's own
state nearby, describing which state was chosen, its margin, and, when it
differs from the raw trajectory, what that would have cost. Surfaced in
the UI the same way `etkNonCompliant` already is, relabelled from a
warning to a disclosure ("Winding Configuration Resolved By Neighbourhood
Search") since the finding is no longer an open risk -- it is now a
routine, deterministic fact about where the price came from.

**Cost, measured on the default case:** ~1.45 s before section 49;
~2.7-3.0 s with section 49's K-plateau search alone; ~3.9-4.5 s with this
section's density resolution added on top (the coupled sweep's wider
0.4x-1.8x range, needed for correctness -- item 2 above -- is the largest
single contributor). Not optimised further here: the user's own framing
for this round was correctness over speed, and the K-plateau cache this
session separately declined to add would not help here either, for the
same reason (CLAUDE.md invariant 1, the engine stays stateless).

`ENGINE_VERSION` bumped to 1.26.0. This is exactly the class of change
invariant 4 exists for: a real formula change, reachable by any AUTO-fit
design, that moves the default case's own numbers -- not a reporting-only
addition like section 50's was.
## 52. Drawing 21 drew Construction A's plate shapes but not Construction B's -- coreConstructionB() needed its own outer/inner edges to fix that

Checked directly against the reference PDF Construction B was fitted from
(CALIBRATION.md section 35): its stamping schedule page carries three drawn
outlines above the table -- V-NOTCH, OUTER, CENTRE -- the shapes the core
shop actually cuts from, not just the table of lengths and weights. Drawing
21 (`StampingSchedule`, src/components/Drawings2D.tsx) already draws
Construction A's own two shapes (limb, yoke with a schematic centre-limb V
notch) but returned early with tables only, no shapes, whenever
`params.coreConstruction === "B"` -- confirmed by reading the component,
not assumed: the `isB` branch's own comment said so directly ("Construction
B has no schematic here").

**Why there was nothing to draw from.** `coreConstructionB()` (this file)
already computed a `length` per plate type -- V (yoke), O (outer limb), C
(centre limb) -- but that figure is MITRE_K-corrected specifically for the
mass calculation (section 35's own note: the correction folds in the
V-notch cutout's own material loss, "a genuine additional deduction... this
engine cannot separate out"). A drawn trapezoid needs its outer and inner
edges separately, and mass-correcting toward a mean length is not that.

**Fixed by adding `outerEdge`/`innerEdge` to each of V/O/C**, computed from
the plain 45-degree-double-mitre relationship this file's own Construction
A model already uses for `limbLong`/`limbShort` and `yokeLong`/`yokeShort`:
outerEdge is the STATED length this function already computed before the
MITRE_K correction (`2*cc+w` for V-notch, `Hw+2*w` for outer, that value
minus 52 for centre -- literally the same three formulas section 35's own
comment already names as "OUTER edges"), and innerEdge is outerEdge minus
2*width -- the geometric consequence of mitring both ends by one width
each, independent of MITRE_K, which corrects mass toward a mean length
after the notch is cut, not the plate's outer envelope before it. Checked
against the 1250 kVA furnace reference at its widest pocket (w=230):
outerEdge-innerEdge is exactly 460 (2*230) for all three plates, and the
outer plate's own innerEdge (723.5) lands exactly on Hw (723.5.09...) --
both confirm the geometry, not just the arithmetic.

**Drawing 21 now renders Construction B's own three shapes** the same way
it already rendered Construction A's two: from the widest pocket
(`sched.rows[0]`), with the other pockets noted as the same shapes at the
widths the schedule table already lists, dimensioned with real
engine-held numbers (outer edge, inner edge, width) via the same
DimensionHorizontal/DimensionVertical primitives every other drawing uses.

**The V-notch and the centre plate's own chevron point are schematic, not
engine-held, drawn that way on purpose.** Construction A's own existing
yoke V-notch was already schematic before this section -- its own caption
says so plainly ("shown schematically... its profile is not held by the
engine") because no chart on file gives a notch angle or depth, only the
three plate mass totals section 35 fitted MITRE_K against. The same is
true for Construction B: the "52" that shortens the centre plate relative
to the outer plate is a stated, given constant (CALIBRATION.md section
35), not decomposed into a notch depth and a point angle anywhere on file.
Inventing a precise angle to make the drawing look sharper would be
exactly what CLAUDE.md's invariant 5 exists to forbid -- a plausible
fabricated value in a customer document is worse than an honest
schematic one, so the centre plate's point and the V-notch plate's notch
are drawn at a fixed, proportional depth (not derived from any input) and
captioned the same way Construction A's own notch already was.

No `ENGINE_VERSION` bump: `outerEdge`/`innerEdge` are new, purely additive
fields, derived from figures this function already computed -- no existing
field changed, no mass, weight or price moves for any design.

## 53. Real V-notch geometry now known (depth W/2, 45/135 degree flanks) -- checked against the chart, does not reproduce it, `MITRE_K` left unchanged

The designer has now given the V-notch its actual profile: depth W/2 (W is
that pocket's own plate width), flanks at 45 and 135 degrees, apex centred
on the plate's inner edge (drawing 21, section 52 above, now drawn to this
real geometry instead of schematically -- see DRAWINGS.md). Section 34/35
left this open deliberately ("no chart on file gives a notch angle or
depth"); this section is the check that geometry against the one chart
`MITRE_K` was fitted to, per the designer's own instruction: replace the
fitted coefficient with the real derivation if it reproduces the chart,
report the deviation and leave the fit alone if it does not.

**The check.** A V-notch of depth W/2 with 45 degree flanks is a triangle
removed from the plain mitred trapezoid: base W (the notch's own opening at
the inner edge -- half-width equals depth at 45 degrees, so full opening is
2 x W/2 = W), height W/2, area W²/4. Computed directly against the same 15
steps (`dCore` 224, `cc` 375, `Hw` 698, 0.23 mm lamination) section 35's own
chart check already uses:

| Model | V-notch total |
|---|---|
| Plain mitred trapezoid, no notch at all (K = 1.0) | 448.59 kg |
| Real notch geometry (trapezoid minus the W/2-deep, 45-degree triangle) | 420.05 kg |
| `MITRE_K.vNotch` = 1.44585 (fitted, reproduces the chart by construction) | 397.69 kg |
| Chart (target) | 397.69 kg |

Real notch geometry overstates the chart by 22.36 kg, +5.62%. This does not
reproduce the chart to within the tolerance every other single-chart fit in
this file has been held to (Construction A's own three plates: -1.4%,
+2.8%, +4.3%, section 12/15). Per the designer's own instruction, `MITRE_K`
is **not** replaced -- the geometry is real and now drives the drawing
(section 52 above, updated for it), but the mass calculation still uses the
fitted coefficient, because the geometric derivation alone does not account
for the chart's own total.

**Why the gap is a real, not a rounding, residual -- and roughly where it
sits.** The outer plate has no notch at all (plain double 45 degree mitre,
nothing else), yet its own fitted `MITRE_K.outer` (1.27514) already
reproduces the chart at 500.25 kg against a plain-trapezoid-only total of
531.66 kg -- a 31.41 kg, 6.28% deduction with no notch anywhere in the
picture. That is close in size to the V-notch's own 22.36 kg (5.62%)
residual here, consistent with section 34/35's own standing diagnosis: a
real deduction beyond pure mitre geometry exists on every plate at this
joint (kerf, a fit allowance where limb and yoke meet, or both) that this
engine cannot separate from the notch's own material loss using three
aggregate chart totals alone. The V-notch's real geometry is therefore
very likely correct as drawn -- it is the *mass* fit that is short a second
effect this one chart cannot isolate, not the notch shape itself being
wrong. A second real Construction B chart, at different proportions (so the
notch-area term and the shared joint term scale differently against each
other), would let the two be told apart. Until then this is the same
single-chart-fitted-constant caveat every other constant in this file
already carries, now with a concrete, checked reason to believe it rather
than an unexplained residual.

**Questions for the manufacturer, not guessed at here:** what kerf width
does the cutting line actually take (the blade/laser removes a real strip
of steel along every cut, mitred or flat, that this engine has never been
given a number for), and what fit tolerance is allowed at the limb-yoke
interface (a deliberate clearance or overlap allowance where the two pieces
meet, separate from the cut itself). Either would apply to all three plates
uniformly regardless of shape, which is consistent with the outer plate's
own unexplained deduction existing with no notch involved at all -- and
either would let this section's own residual be split from the notch's
real, separately-derived material loss instead of the two being folded
together the way `MITRE_K` still folds them today.

No `ENGINE_VERSION` bump, no code change: this section is a check against
the existing fit, and the fit did not move.

## 54. Cutting method and joint stacking were conflated in one parameter -- split into two, and Construction C (diamond) added

The designer's own observation: Construction A's chart carries shift columns
at 0, 10 and 20 mm; those offsets were specified, separately, as belonging
to diamond cutting; the V-notch chart has no shift columns at all; and both
A and B use 45/135 degree cuts. So the real difference between A and B
might be joint stacking, not cut angle -- investigated directly before
changing anything.

**What actually differs between Construction A and Construction B.** Cut
angle: identical. Every length formula in both is built from the same 45
degree mitre relationship (`long - short = 2w`) -- Construction A's limb
(`length = 2 x width`, "a symmetric double 45 degree mitre with no straight
run between the two cuts," section 12) and yoke, and Construction B's
V-notch/outer/centre, whose `outerEdge - innerEdge = 2w` for all three
plates is checked directly as an invariant in `engine.test.mjs`, not
assumed. Neither construction has a flat/90 degree formula anywhere. Plate
shape: genuinely different -- B's yoke carries a real V-notch cutout with a
mating chevron point on the centre limb (section 52/53); A's yoke plates,
whichever of Plate B or Plate C, are plain mitred trapezoids with no
cutout. Stacking: present in A (25% of the yoke's steel, staggered across
0/10/20 mm), absent in B entirely (V/outer/centre are each counted
uniformly, no shift columns anywhere in the one furnace chart on file).

**Conclusion: Construction A is not diamond cutting under the wrong name.**
Its plates are cut at 45 degrees, confirmed by every formula, not inferred.
The 0/10/20 mm figures describe how already-mitred half-yoke pieces are
staggered in the stack -- a joint-stacking practice layered on top of a
mitred cut, not the cutting angle itself, and they only ever appear in
drawing 22's Plate B row (`coreCuttingChart`), never in drawing 21's own
schedule (`stampingSchedule`, which has never shown a shift breakdown for
Construction A at all).

**But the underlying observation was right: this engine conflated two
independent things into one parameter.** `coreConstruction` used to mean
both "what shape is the plate" and, for A specifically and only by
accident of which reference chart it happens to be checked against,
"is the yoke staggered." B's own furnace chart never had an opportunity to
show a stagger because the furnace reference simply does not stagger --
that silence was being read as "V-notch construction has no stacking
concept," when the truer reading is "no one has ever given this engine a
staggered V-notch chart to check." Restructured to say only what is
actually known:

- **`coreConstruction`** -- cut geometry only, from here on: `"A"` (master
  mitre cut, Plate A/B/C, confirmed against two real references), `"B"`
  (V-notch cut, confirmed against one furnace chart), `"C"` (diamond cut,
  flat 90 degree, no chart at all -- see below). Selecting between these
  no longer says anything about stacking.
- **`jointStacking`** -- `"staggered"` (default, matches every existing
  design's behaviour byte-for-byte, since Construction A always staggered
  25% of its yoke before this section existed) or `"continuous"`. Real data
  exists for staggered Construction A (the chart) and staggered
  Construction C (the designer's own specification, below); Construction B
  has none either way and does not consult this value at all.
- **`stackingOffset`** -- one shared parameter, not two, per the designer's
  own instruction, rather than a separate field per construction. Default
  10 mm, valid on both real sets. **The two sets are not equally
  confirmed and must not be presented as such:**
  - **Construction A's set, {0, 10, 20} mm, is real reference-chart data**
    (section 12: "the 50/25/25 division of its own sheets across the 0, 10
    and 20 mm step-lap shifts, which was stated directly, not fitted").
    Construction A always spans the full 50/25/25 fan across all three when
    staggered -- that is what the one chart shows, not a single pick -- so
    `stackingOffset`'s own value is accepted but not consulted for A.
  - **Construction C's set, {5, 10, 20} mm, is the designer's own direct
    specification for diamond cutting**, not fitted or charted against any
    reference. Construction C uses `stackingOffset` as a single value every
    staggered layer shares uniformly, because that is how it was specified
    -- a materially different mechanism from A's own fixed three-way fan,
    which is why the two are not forced into the same shape even though
    they share one parameter.

  Both remain mass-neutral in this model (below), and that is confirmed for
  both, not assumed for the second because it held for the first.

**Construction C, diamond cutting.** Flat 90 degree cuts, no mitre, no
chart on file at all -- so the mass model is derived from already-validated
relationships, not a new fitted number. A 45 degree mitre joint interlocks:
the limb's and yoke's own diagonal cuts fit together with neither gap nor
overlap, which is exactly why Construction A's own limb mean length (2w,
sections 15-16) is a mean -- long at one edge of its own width, short at
the other, the two mitred pieces' tapers complementing each other. A flat,
unmitred cut cannot do that: placed at the mean position it would gap
across half its own width and overlap across the other half, and a
magnetic joint gap is worse than an overlap. So a flat-cut piece is drawn
to the FARTHEST point the corner ever reaches, uniformly across its own
full width, guaranteeing overlap rather than a gap everywhere -- the same
"long edge" Construction A already computes (`limbLong = 3w`, `yokeLong =
2cc + dCore + w`, sections 15-16), used here without the mitre taper that
shortens it back to a mean, because there is no mitre to taper toward. This
is a known real trade-off (flat/butt-lap joints run with a deliberate
overlap and use more steel than an interlocking mitre for the same
magnetic path), not an invented number, but it has not been checked against
a real diamond-cut chart. On the default 1000 kVA case, Construction C's
own `wCore` (1333.0 kg) runs 31.1% above Construction A's (1017.2 kg) for
the same core -- a rough sense of direction only, not a validated figure,
until a real chart exists to check it against.

**Superseded by section 55 below.** The designer pointed out this 31.1%
figure assumes every layer must independently avoid a gap with no help
from its neighbours -- but a staggered joint's whole point is that
neighbouring, offset layers cover for each other, so a flat plate does not
need to reach the far corner on its own when staggering is selected. That
reading gives a very different number (close to Construction A's own, not
31% above it). Section 55 works through both readings and changes what
this function actually computes -- `coreConstructionC()` now takes
`jointStacking` into account, which the paragraph below (mass-neutral for
both A and C) predates and gets wrong for C specifically. Left here,
uncorrected in place, because the reasoning that follows explains what was
actually being computed at the time -- see section 55 for what changed and
why.

**`jointStacking`/`stackingOffset` were mass-neutral for both A and C
at the time this was written** (`node` check against `computeDesign`, both
constructions, `jointStacking: "continuous"` vs default, and
`stackingOffset` swept across its own full range): `wCore` did not move.
For Construction A this remains true and is not superseded -- Plate B has
always been "the identical per-length steel as Plate C, just cut in half"
(section 12), and staggering only stages where a joint falls, not how much
steel either plate needs, because every mitred plate is already
self-sufficient against a gap on its own. For Construction C, section 55
below found this was an artefact of always computing the conservative,
gap-avoiding length regardless of `jointStacking` -- once the function
actually reads `jointStacking`, staggering does change Construction C's
own mass, for a real physical reason, not a bug.

**Open question, not to be read as settled: is staggering loss-neutral?**
This model only ever claimed mass-neutrality, and only because that is
what the one real chart on file happens to show. It has never claimed
loss-neutrality, and should not be read as implying it by omission. In real
core construction a step-lap (staggered) joint measurably reduces no-load
loss compared to a butt (continuous, unstaggered) joint at the same
geometry -- that is the entire reason staggering is practised at all,
beyond whatever stacking convenience it offers. This engine's own
`noLoad`/exciting-current physics are driven by `wCoreAssembled`
(Construction A's own formula, unconditionally, section 48) and grade/flux
alone -- `jointStacking` does not enter that calculation anywhere, for any
construction. Until a real reference separates "core of this geometry,
staggered" from "same geometry, continuous" on measured loss, this engine
has no basis to charge or credit either state for it, and does not invent
one. Add to the open manufacturer questions (section 53): what measured
no-load loss difference, if any, is seen between staggered and continuous
joints at matched geometry, for both a mitred and a flat cut.

**Implementation.** `coreConstruction` option `"C"` added (`packages/engine/
index.js`), `coreConstructionC()` alongside `coreConstructionB()`, delegated
from `wLimb`/`wYoke` inside `designTransformer`, `stampingSchedule()` and
`coreCuttingChart()`, the same principle sections 15 and 35 established for
A's and B's own limb/yoke terms: the priced core and the steel-order
document always agree on the same core, by construction. `coreCuttingChart()`'s
Construction A branch now reads `jointStacking` to choose between the
existing 75/25 Plate C/B split (staggered) and 100% Plate C (continuous),
with the split's own arithmetic otherwise unchanged.

No `ENGINE_VERSION` bump: `coreConstruction` defaults to `"A"`,
`jointStacking` defaults to `"staggered"` -- reproducing, unconditionally,
the exact 75/25 split every existing design already computed before this
section existed. B and C are both opt-in, not auto-suggested (the same
footing section 35 established for B alone, now extended to C).
## 55. Construction C's mass depended on which of two defensible readings was used -- both now computed, chosen by `jointStacking`, neither presented as the settled answer

Section 54 shipped Construction C's mass using a single reading: every flat
plate must independently avoid a gap, with no help from any neighbouring
layer, so each is drawn to the farthest point the corner ever reaches (the
mitred trapezoid's own long edge, undone of its taper). That gave 1333.0 kg
against Construction A's 1017.2 kg on the default case -- 31.1% more core
steel for the same core. The designer's own objection: diamond cutting is a
real, established industry method, and no works would choose a pattern that
consumes 31% more steel than the alternative for the same job. The
derivation was probably too pessimistic.

**The missing piece: staggering changes what "avoiding a gap" requires.**
Section 54's own reading treats each layer as if it stood alone. But a
staggered joint's entire purpose is that it does not stand alone --
successive layers are offset from each other specifically so that at any
one point along the joint, only some layers have a cut there; the rest are
staggered to a different position and stay continuous through that point,
so flux can detour locally through them. That is the actual mechanism real
step-lap and diamond stacking are built around, not a simplification of it.
Under this reading, a flat plate does not need to reach the far corner on
its own -- it can be cut at the SAME mean length Construction A's own
mitred plates already use (`limbLen = 2w`, `yokeLen = 2*cc + dCore`,
sections 15-16), relying on the offset between layers to close the gap a
single plate's own geometry would otherwise leave.

**Both readings are geometrically defensible, and they are not the same
claim:**

| Reading | Basis | Limb length | Yoke length | `wCore` (default case) | vs Construction A |
|---|---|---|---|---|---|
| 1, self-sufficient | Each layer must avoid a gap entirely on its own | `3w` | `2cc + dCore + w` | 1333.0 kg | +31.1% |
| 2, offset-assisted | Neighbouring staggered layers cover for each other | `2w` | `2cc + dCore` | 1041.0 kg | +2.3% |

Reading 2's own +2.3% is not a residual diamond-specific penalty -- it is
the same gap this file already carries between Construction A's own two
internal models (the per-step continuous-stack approximation `stampingSchedule`
and drawing 21 use, 1039.7 kg on this case, versus the bulk `aGross`-based
formula `wCore`/`wLimbA`/`wYokeA` actually price from, 1017.2 kg -- a ~2%
gap documented since section 41, "real integer sheets vs. a continuous
approximation," not new here). `coreConstructionC()` is built the same
per-step way `coreConstructionB()` is, so it inherits that same ~2% gap
against Construction A's own bulk-priced figure, not a new discrepancy
diamond cutting introduces.

**Which reading applies depends on whether staggering is actually
selected, not a free choice between them.** Reading 2 only holds if there
genuinely are offset neighbouring layers to detour through. With
`jointStacking: "continuous"`, every layer's cut sits at the same position
-- there is no neighbour to rely on, and a mean-length flat piece would
leave a real, full-depth magnetic gap, not merely a higher-loss joint.
Continuous Construction C therefore still uses reading 1 (the
self-sufficient length); only staggered Construction C uses reading 2.
This is a genuine physical difference from Construction A, where every
mitred plate is already self-sufficient against a gap by the mitre alone
-- staggering Construction A only changes where the joint falls (section
54), but staggering Construction C changes how much steel each plate
needs, because the mitre's own gap-avoidance has no flat-cut equivalent to
fall back on.

**`coreConstructionC(dCore, cc, Hw, steps, thk, staggered, dens)`**
(`packages/engine/index.js`) now takes `staggered` (`params.jointStacking
!== "continuous"`) and switches between the two lengths above, rather than
always computing reading 1. `wLimb`/`wYoke` inside `designTransformer`,
`stampingSchedule()` and `coreCuttingChart()` all pass the same
`jointStacking`-derived flag through, so price, drawing 21 and drawing 22
continue to agree on the same core (the same principle sections 15 and 35
established).

**Neither reading is validated against a real diamond-cut chart.** Reading
2 (staggered) is the one that matches how real staggered joints are
actually built and is not known to overstate steel; reading 1 (continuous)
is deliberately the conservative, gap-avoiding bound for the one state
where no neighbouring layer exists to rely on. Report both when asked what
Construction C costs, not 31.1% alone -- staggered Construction C, the
setting a diamond-cut works would actually run, now prices within about 2%
of Construction A (2,047,006 against 2,039,020 ex-works on the default
case), not 31% above it; continuous Construction C remains the conservative
upper bound at +31.1% (2,144,794).

`ENGINE_VERSION` bumped to 1.27.0: this changes a reachable, already-shipped
formula (Construction C's own mass, for the staggered case specifically) --
not the default case (Construction A), so CLAUDE.md's golden-numbers table
is unaffected, but invariant 4 ("a quotation issued last year must reprice
exactly as issued") applies to any opt-in construction just as much as the
default, so the version moves regardless.

## 56. Core is bought finished, per kg -- scrap is the supplier's cost, not ours; priced by a construction-specific processing charge on the rate, not construction-specific mass

Manufacturer data, not a chart. Important framing correction from the
designer: the works buys finished core lamination at a rate per kg from an
outside supplier. Scrap from cutting -- the mitre offcuts, the notch
cutout, whatever a flat cut avoids -- never reaches the works at all; it is
the supplier's own material loss, recovered through what they charge to
process a given cut pattern, not through how much steel our own BOM says
was bought. Sections 48 and 52-55 had already modelled construction-
specific PURCHASED mass (`wCore`, `MITRE_K`, `coreConstructionC`) as the
cost difference between constructions -- correct for what a chart or a
designer's own worked reference shows about what a SUPPLIER'S steel order
looks like, wrong for what the WORKS actually pays, which is this
processing charge instead.

**`coreProcMitre` / `coreProcVNotch` / `coreProcDiamond`** (`DEFAULT_RATES`,
`packages/engine/index.js`), added to the core rate via
`coreProcessingRate()`: master mitre Rs 12-18/kg, V-notch Rs 6-9/kg, diamond
Rs 3-5/kg, defaults at each range's own midpoint (15 / 7.5 / 4.5), editable
per rate card like every other rate here. The ordering matches the real
cutting cost: a 45 degree mitre wastes real material slitting from
rectangular coil stock (highest charge), a flat diamond cut wastes almost
none (lowest), V-notch in between (a mitre plus one added notch cut).

**What this changes.** `buildBOM`'s own CR-01 line ("Core lamination") now
prices `wCoreAssembled` -- the same finished, flux-carrying core regardless
of cut geometry (section 48) -- at `r.core * d.ct.costMul +
coreProcessingRate(p.coreConstruction, r)`, not `wCore` (the construction-
specific purchased mass) at a flat rate. `cardCostModel`'s own Core row
moved the same way, for the same reason its own comment already gives:
"Core... share buildBOM's own rate keys... so both models move together."
`wCore`/`wLimb`/`wYoke` are unchanged and still exactly what they were --
this is not a mass model change, sections 52-55 stand -- they simply no
longer drive price. They remain what drawing 21/22 order steel against
(the supplier's own cutting schedule), which is exactly the document they
were always for.

**Everywhere else `wCore` stood in for the real, physical core -- not the
supplier's own steel order -- moved to `wCoreAssembled` too, the same
"physical part, not the construction-specific purchased figure" principle
section 48 already established for no-load loss:**
- **Tie rod sizing** (`hardwareSchedule`): tie rods clamp the real,
  assembled core, not scrap that never left the supplier's factory.
- **Shipped/handled mass** (`summarise()`'s `totalMass`, and
  `DesignImpactSummary`'s own weight-impact row): what gets lifted, shipped
  and supported is the assembled core -- a construction change alone (same
  core geometry) should not read as a weight change, since none of that
  scrap was ever physically present at the works.

Both were latent gaps, not new bugs: for Construction A, `wCore` and
`wCoreAssembled` are identical by construction (section 48), so neither
ever showed a wrong number until Construction B (and now C) existed to
actually separate the two.

**Test fixture note.** `card-cost.test.mjs` reproduces a real 1963-style
per-kg costing sheet, verified to the rupee, that predates both
`wCoreAssembled` and `coreConstruction` as concepts -- it gives one core
figure at one flat rate with no way to say whether that was purchased or
assembled, or what processing premium (if any) the shop's own Rs 240/kg
already folded in. Fixed by setting the fixture's own `wCoreAssembled`
equal to its `wCore` (no basis to invent a different assembled figure the
sheet never gave) and its own `coreProcMitre` to 0 (the sheet's flat rate
already reproduces the total exactly with no separate line for one, so it
was evidently all-inclusive already) -- the most literal reading of what
one flat historical rate can support, not a new assumption layered on top
of it.

`ENGINE_VERSION` bumped to 1.28.0 (with section 57 below, one bump for
both -- section 55 above already used 1.27.0, a real, previously shipped
version, so this round of changes takes the next number, not the same
one): reachable by the default case (Construction A, master mitre) --
CLAUDE.md's golden-numbers table updated in the same commit, per invariant
4.

## 57. Building factor by cut geometry and joint stacking -- previously one flat value per joint type, now six manufacturer figures

Manufacturer data, not a chart. `buildFactor` (ratio of built core loss to
catalogue/Epstein-strip loss) used to read `CORE_TYPES[ctk].bf`
unconditionally -- one number per `coreType` (step-lap, D-type, S-type,
amorphous...), with no way for `coreConstruction`/`jointStacking` to affect
it even though both are real, physical facts about the same joint the
building factor is meant to describe. The designer gave real ranges instead:

| Construction | Stacking | Range | Midpoint |
|---|---|---|---|
| Master mitre | Staggered | 1.10-1.15 | 1.125 (baseline) |
| V-notch | Staggered | 1.20-1.28 | 1.24 |
| Diamond | Staggered | 1.28-1.35 | 1.315 |
| Master mitre or V-notch | Continuous | 1.32-1.42 | 1.37 |
| Diamond | Continuous | 1.45-1.60 | 1.525 |

Master mitre and V-notch share one figure when continuous -- the designer
gave that pair as one combined range, not two, so `BUILD_FACTOR_MSC`
stores it that way rather than inventing a split the data does not give.

**Scope: applies only when `coreType` is `"stepLap"`.** That is the one
`CORE_TYPES` entry this session's whole `coreConstruction`/`jointStacking`
axis has always implicitly described -- a cut, mitred/notched/diamond-cut,
stacked circular core. D-type, S-type, amorphous wound and the rest keep
their own existing, unrelated `bf` constants unchanged: the designer's new
figures were given specifically for master mitre / V-notch / diamond,
staggered or continuous, not for those other named practices, and
`"stepLap"` is already the default `coreType` for every non-amorphous
design, so this reaches the overwhelming majority of real designs without
touching the others at all. (D-type in particular reads as another named
45-degree-mitred practice, `bf` 1.18 -- whether it and S-type are actually
the same underlying practice this session's `coreConstruction` axis
already covers, just under the old `coreType` framing, is an open
question worth the designer's own answer before touching it; not resolved
here.)

**Implementation.** `deriveSpec`'s `coreConstruction`/`jointStacking`/
`stackingOffset` `put()` calls moved earlier (right after `coreType`,
before `buildFactor`), since the new default needs both already resolved
-- previously `buildFactor` was put() straight after `coreType`, before
`coreConstruction` existed as a concept at all. `buildFactor`'s own range
widened from `[1.0, 1.45]` to `[1.0, 1.60]`, since the old ceiling could not
even reach the diamond-continuous midpoint (1.525), let alone its own
1.60 upper bound. The final value remains fully editable via the same
slider it always had -- "editable, defaulting to the midpoint" is
satisfied by the existing control, not a new one.

**This is a real, modelled loss penalty now, not an unstated one.** The
continuous-stacking warning banner (previous session, App.tsx) is removed:
it existed specifically because switching to continuous stacking showed no
loss penalty at all, while a real continuous joint measurably costs more
in practice -- exactly the gap this section closes. Diamond continuous
(1.525) in particular can push a design outside its declared loss limits
entirely where staggered would have been comfortably compliant (checked
directly: the default 1000 kVA case at Construction C, continuous stacking,
autoFit cannot find a compliant flux/density combination at all within this
job's own limits and returns non-compliant at the flux floor -- this is the
model correctly reporting an infeasible combination, not a bug).

**Construction B's own cost-optimal point no longer matches Construction
A's exactly** (section 48's own regression test updated, not deleted --
see the correction note there): V-notch's higher buildFactor (1.24 vs
1.125 staggered) is a real reason for autoFit to land somewhere genuinely
different, not the "backwards" bug section 48 fixed. Checked directly at
the 1250 kVA furnace design: dCore 236.2 mm (B) against 241.8 mm (A), 2.3%
apart; etK 0.442 against 0.472, 6.4% apart -- both a modest, explainable
divergence, not the old bug's own runaway-bigger-core shape.

`ENGINE_VERSION` 1.28.0 (shared bump with section 56 above): reachable by
the default case, golden numbers moved, CLAUDE.md updated in the same
commit.

## 58. Kerf and limb-yoke fit tolerance tested against MITRE_K -- does not reproduce the chart, MITRE_K kept

Manufacturer data, not a chart: blade kerf 0.8-1.2 mm (recommended 1.0),
limb-yoke fit tolerance 0.5-1.2 mm (recommended 0.75). Section 53 had
already found that the outer plate's own fitted deduction (`MITRE_K.outer`,
no notch involved at all) implied a real joint effect beyond pure mitre
geometry, and named kerf and fit tolerance directly as candidates. Tested
here with real numbers, per the designer's own instruction: replace
`MITRE_K` with the derivation if it reproduces the chart's three totals,
report the deviation and keep it if not.

**The derivation.** A 45 degree cut's blade removes a kerf-width strip
measured perpendicular to the cut line; projected onto the plate's own
length axis (what `MITRE_K` corrects), that is `kerf * cos(45 degrees)`,
not kerf itself -- a diagonal cut spreads the same perpendicular removal
across a longer cut line, so less of it lands on the length axis
specifically. Fit tolerance is given directly as a length-domain
clearance, and applied the same way for consistency (one clear geometric
rule, not a special case for each input) rather than left unadjusted,
which would treat the two inconsistently with no basis to prefer either
treatment. Each plate has two such mitred (or, for centre, mitred-and-
pointed) interfaces -- V-notch and outer at each end where they meet the
outer limbs, centre at each end where it meets the top and bottom yoke --
so the total length deduction beyond each plate's own pure-mitre baseline
is `2 * (kerf + fitTolerance) * cos(45 degrees)`, about 2.4749 mm at the
recommended values, applied on top of each plate's own already-established
baseline (V-notch and outer: `K = 1.0`; centre: `K = 0.5`, its own
pointed/chevron shape's real baseline, confirmed directly by shoelace-
formula area against the drawn geometry -- section 34/35's own stated
baselines, not re-derived here). V-notch's own real notch cutout (section
53, `W^2/4`) is subtracted separately, unchanged.

**Result, same 15-step 1250 kVA (750+500) furnace geometry section 35's
own chart check uses:**

| Plate | Derived | Chart | Deviation |
|---|---|---|---|
| V-notch | 418.57 kg | 397.69 kg | +5.25% |
| Outer | 530.18 kg | 500.25 kg | +5.98% |
| Centre | 278.08 kg | 223.73 kg | +24.29% |
| Core total | 1226.84 kg | 1121.67 kg | +9.38% |

**Does not reproduce the chart -- `MITRE_K` is kept, unchanged.** V-notch
and outer land within the same order of deviation as other single-chart
fits already accepted in this file (Construction A's own three plates:
-1.4% to +4.3%, sections 12/15) -- plausible, if not exact, and a real
improvement in kind over section 53's earlier notch-geometry-only check
(+5.62% for V-notch alone). Centre does not: +24.29% is far outside that
family, and checked directly -- widening the interface deduction well past
any physically defensible kerf/tolerance value (swept to 50 mm, twenty-five
times the recommended 2 mm total) only closes about half the gap (278.82
kg down to 248.92 kg against a 223.73 kg target), confirming this is not a
per-cut deduction centre needs more of, but a different effect entirely
that this derivation does not capture. Consistent with section 34/35's own
original finding that centre's fitted residual (`MITRE_K.centre = 1.46509`
against a 0.5 baseline, a 0.965 gap) was always disproportionately larger
than V-notch's (0.446) or outer's (0.275) -- unexplained then, still
unexplained now, not resolved by kerf and fit tolerance alone.

No code change: `MITRE_K` stays exactly as fitted (section 35), the mass
calculation is untouched. No `ENGINE_VERSION` bump -- this section is a
check against the existing fit, and the fit did not move, the same outcome
and the same reason as section 53's own check.

## 59. Centre plate's own outer edge was a fixed "-52 mm", not geometrically consistent with the V-notch it must mate with -- corrected to "-w", `MITRE_K.centre` refitted

Section 58's own centre residual -- +24.29%, not closing even at 25x the
recommended kerf/fit-tolerance deduction -- was flagged as a sign of "a
different effect entirely," not a bigger deduction. The designer's own
follow-up named the actual suspect directly: `outerCentre = outerOuter -
52` uses a FIXED 52 mm at every one of the fifteen steps, taken from one
chart's own stated comparison at (almost certainly) its widest pocket only
and never checked for whether it should instead scale with each step's own
width -- exactly the kind of extrapolation this file's own house style
distrusts on sight. With the V-notch's real geometry now known (depth W/2,
90 degree included angle, section 52/53), this is directly checkable: the
centre limb's chevron must physically reach into that notch to mate with
it, so its own required length is derivable, not just fittable.

**The derivation.** The outer limb, mitred plainly (no notch), reaches
only as far as the yoke's own inner (window-facing) edge -- confirmed
directly, already an established fact: "the outer plate's own innerEdge
lands exactly on Hw." The centre limb's chevron tip, by contrast, must
reach PAST that same inner edge, into the V-notch's own cavity, as far as
the notch's own apex -- W/2 further, cut INTO the yoke's body toward its
outer edge, at each end (top yoke and bottom yoke). So the centre limb's
own tip-to-tip reach is `Hw + W/2 + W/2 = Hw + w`, not `Hw` -- and since
the outer limb's own outer edge is `Hw + 2w`, the centre limb's own outer
edge is that figure less exactly one `w`: `outerCentre = outerOuter - w`.
This is not a new geometric idea -- it is the same "chevron point depth
W/2, mates with the notch by construction" relationship drawing 21's own
real geometry already uses (section 52/53, DRAWINGS.md drawing 21),
applied to the plate's own overall length instead of just its point shape.

A clean check confirms it, not just the derivation: with `outerCentre =
outerOuter - w`, the chevron's own flat (non-pointed) run works out to
`outerCentre - w` (section 52's own established chevron-length relationship)
`= Hw` exactly -- the centre limb's straight middle section spans exactly
the window height, the same physical quantity the outer limb's own inner
edge already spans. Two different plates, two different shapes, the same
window they both actually cross -- not a coincidence, confirmation.

**The old "-52" is not simply this relationship evaluated at the chart's
own widest step.** At the widest pocket (w = 220 mm in the reference
geometry), the derived subtraction is `w` = 220 mm, not 52 -- nor does 52
mm correspond to any of the chart's own fifteen step widths. The 52 was
never decomposed into a notch depth and a point angle on file (section 34
already said so directly); it appears to be a stated comparison the
original chart gave once, generalised into a fixed per-step constant
without checking whether it should scale -- exactly what this section
found it should.

**Checked against the chart, both ways:**

| Formula | Centre total (baseline, K=0.5, no kerf/tolerance) | Deviation |
|---|---|---|
| Old: `outerOuter - 52` | 278.82 kg | +24.63% |
| New: `outerOuter - w` | 237.29 kg | +6.06% |

| Formula | Centre total (with section 58's own kerf/fit-tolerance deduction) | Deviation |
|---|---|---|
| Old geometry | 278.08 kg | +24.29% |
| New geometry | 236.55 kg | +5.73% |

The corrected geometry alone -- no kerf, no fit tolerance, nothing beyond
the plain notch-depth derivation -- cuts centre's own deviation from
+24.63% to +6.06%, landing centre in the SAME family as V-notch's own
+5.25% and outer's own +5.98% (section 58) for the first time. This was
not achieved by adding a bigger deduction; the baseline itself moved,
because the baseline was wrong.

**`outerCentre = outerOuter - s.w`** (`coreConstructionB()`,
`packages/engine/index.js`) replaces the fixed `- 52`. **`MITRE_K.centre`
refitted from 1.46509 to 0.73751** -- solved the same way section 35
originally solved it (exactly reproduce the chart's own 223.73 kg centre
total), against the corrected `outerCentre`, not the old one. Refitting
against the old, wrong `outerCentre` and keeping the new one only in the
drawing would have let the drawn shape and the priced mass disagree on
the same plate, exactly the failure mode this file's own "document and
price agree by construction" principle (sections 15, 35, 52) exists to
prevent. The new residual (0.73751 - 0.5 = 0.238) is smaller than both
V-notch's own (0.446) and outer's own (0.275) -- a materially more
coherent picture than the old fit's 0.965, nearly double outer's own
residual for a plate this file's own baseline says needs LESS mitre
correction, not more.

**What this does and does not confirm.** The chart's own three totals
(397.69 / 500.25 / 223.73 kg) are unchanged and still reproduced exactly
by construction, the same caveat section 35 already carries: an exact fit
to three totals with three free coefficients does not, on its own, prove
the per-step model correct away from this one geometry. What is new here
is that centre's own coefficient no longer requires an implausibly large,
unexplained deduction to hit that total -- it requires one in the same
range the other two plates already need, which is itself evidence
(not proof) that the corrected geometry is the right one, not merely a
better-fitting one.

**A drawing was already right, by coincidence of scope, not by having
been checked.** Drawing 21's own chevron shape (DRAWINGS.md, drawing 21;
`Drawings2D.tsx`) reads `outerEdge` straight from `coreConstructionB()`,
so it updates automatically with this fix -- re-verified directly
(Puppeteer): the centre plate now draws visibly shorter (1041.7 mm against
the old ~1131 mm at the widest pocket) with the same real 45/135 degree
point geometry section 52/53 already gave it. The point's own SHAPE was
never wrong -- only the overall LENGTH the point sat on top of was.

**Unconfirmed at any rating besides this one**, the same caveat every
other single-chart-fitted constant in this file already carries -- but
this correction is now geometric, not fitted, so it should generalise
better than the constant it replaces, which by construction could not.

`ENGINE_VERSION` bumped to 1.29.0 (1.28.0 already shipped in the previous
commit): reachable by any design that selects Construction B -- checked
directly, the default case's own Construction A is untouched
(`outerCentre`/`MITRE_K.centre` are Construction B-only), so CLAUDE.md's
golden-numbers table needs no change, but invariant 4 requires the bump
regardless of whether the default case moves.

## 60. Centre limb T-joint split into its own axis, no-load loss localised to the corner/T-joint mass, step-lap defaults made rating-aware -- and the building-factor bands re-flagged as heuristics, not published constants

Research findings, three of them, landing on the same joint the last several
sections have been refining.

**Centre limb T-joint is a third independent axis.** `coreConstruction`
(cut geometry) and `jointStacking` (staggering) were already split apart
in section 54. A third fact was still folded into the first: whether the
centre limb's own T-joint -- where it meets each yoke -- is cut as a
chevron V-notch, a plain angled seat, or a butt joint. Construction B's own
label, "V-notch cut (V-notch, outer, centre)", said this was that
construction's own exclusive feature. It is not: a step-lap mitred core
(Construction A) normally also carries a V-notch centre limb in practice,
the same conflation section 54 already found once between cut geometry and
stacking, this time between cut geometry and the centre joint's own shape.

`centreJoint` (`packages/engine/index.js`, `deriveSpec`) is now its own
`put()`, three values (`vNotch`/`plainSeat`/`butt`), independent of both
`coreConstruction` and `jointStacking`. Its suggested default is the three
constructions' own traditional pairing -- Construction B suggests `vNotch`
(unchanged, it is B's whole identity), Construction A now also suggests
`vNotch` (the actual change this section makes: A used to have no centre-
joint concept at all), Construction C suggests `butt` (its own flat 90
degree cut has no chart evidence for a mitred notch). This is what "keep
the three manufacturer price tiers as presets that set all three axes at
once" means in practice: picking a `coreConstruction` re-suggests
`jointStacking` and `centreJoint` together, the same AUTO/SET cascade
`deriveSpec` already uses everywhere, not a separate preset mechanism --
and, like every AUTO field, a design can still set `centreJoint`
independently of `coreConstruction` (a Construction A core with a plain or
butt centre seat, or a Construction C core with a V-notch, are real,
selectable combinations, just not the suggested default).

**Only the V-notch's own geometry is drawn.** `plainSeat` and `butt` are
labelled and priced identically to their construction's own base geometry
-- there is no reference chart for either shape, so neither gets a drawn
notch of its own (CLAUDE.md invariant 5: no invented geometry). `Plate A`,
`Plate B` and `Plate C` (Construction A's own limb/half-yoke/full-yoke
plates, `plateTable()`, drawings 21/22) are UNCHANGED -- this section adds
a label, not a fourth plate or a renumbering. The research behind this
section also raised a question about whether Plate A/B/C's own names
should change; that question is about naming convention, inferential, and
not acted on here. This engine's own Plate A/B/C split is validated
against a real cutting chart (sections 12/15/16); nothing here touches it.

**No-load loss localised to the corner/T-joint mass.** The building factor
used to multiply the WHOLE assembled core's specific loss flatly:
`noLoad = w * buildFactor * wCoreAssembled`. Published sources put the
joint's own contribution to no-load loss at 3-4% on large power
transformers and up to 10% on small distribution units -- a flat factor
cannot represent that, since it applies the same multiplier to steel next
to a joint and steel in the middle of a straight run alike, and this
platform's own book of work sits mostly at the small end the flat form
mis-costs most.

Replaced with the split form the research specified:
`noLoad = (Wt - Wc) * w + Wc * w * Kc`, where `Wt` is `wCoreAssembled`
(section 48's own always-Construction-A-shape estimate of the real,
flux-carrying core, used here for the same reason it is used everywhere
else: loss physics should not depend on which construction cut the steel),
`Wc` is the corner-and-T-joint mass, `w` is the catalogue/Epstein-strip
specific loss (`wRef * (B/bRef)^1.9`, no building factor), and `Kc` is the
joint's own factor.

**`Wc`, derived, not invented.** Section 16 already established, and this
file already relies on, one real relationship: a mitred-both-ends limb
lamination's average length is `2w`, decomposing into a straight-run
rectangle (length `w`) plus two mitre wedges (the steel present because of
the 45 degree cut, not the run between cuts) averaging `w` between them --
exactly half of the trapezoid. `wJoint = 0.5 * wLimbA` (`wLimbA`, not
`wCore`/`wLimb`: the same section 48 convention of always using
Construction A's own limb formula for loss physics, regardless of which
construction is actually selected, so a Construction B or C design's own
no-load figure is not affected by how much of its own steel that
construction's particular cut wastes). Only the limb feeds this, not the
yoke body: corners and T-joints are where a limb ends, not where a yoke
runs straight.

**`Kc`, the existing manufacturer figures, reused, not replaced.**
`buildFactor` (section 57's own six manufacturer figures, `BUILD_FACTOR_MSC`)
is now read as the joint's own factor, not a flat whole-core multiplier.
This is not a convenience substitution: those figures were always
described as "building factor... by cut geometry and joint stacking" --
properties of the JOINT specifically (how it is cut, how it is stacked),
not of straight-run steel away from one. Concentrating them onto the mass
that is actually at the joint is arguably more faithful to what they were
always describing, not a reinterpretation invented for this section.

**Checked against the research's own range, at the default case.** At the
default 1000 kVA case (Construction A, staggered, `buildFactor` 1.125),
`Wc` comes to 189.2 kg against `wCoreAssembled` 1105.4 kg -- 17.1% of the
assembled core. Against what the OLD flat form would have given the SAME
geometry (`w * buildFactor * wCoreAssembled` = 1194.2 W), the split form
gives 1084.2 W -- a 9.2% reduction. 1000 kVA is squarely a small
distribution rating, and 9.2% sits right at the "up to 10 percent on small
distribution units" edge the research quotes, without this section having
tuned `Wc` or `Kc` to hit that number -- it falls out of reusing an
already-validated geometric relationship and an already-sourced factor.
Not proof the model is right (no chart backs `Wc` the way section 15/35
back the plate masses), but a real, unforced consistency check.

**Scope: `coreType` `"stepLap"` only**, the same scope section 57's own
`buildFactor` figures already carry -- D-type, S-type, amorphous and the
rest keep the flat form, since there is no joint-mass breakdown behind
those `bf` constants.

**This moves the default case, deliberately, and cascades further than the
no-load figure alone.** A 9.2% no-load reduction at fixed geometry is a
real change to the loss landscape `fitToSchedule`'s own discrete-
configuration search resolves against -- the same bracket-sensitivity
cascade every prior loss-moving change in this file has produced (sections
30/32/39/46/51/57 among them), not a new kind of effect. This default
case's own numbers move together, not just no-load, and its own dynamics
now converge cleanly where they used to cycle (`autoFitConverged` true, was
false) -- it still lands exactly at a zero-margin compliance boundary
(`fitResolutionNote` still fires), which is a separate fact from whether
the iteration cycled to get there. `engine.test.mjs` and CLAUDE.md's own
golden-numbers table updated in the same commit, re-verified directly
against `computeDesign`, not hand-adjusted. 2000 kVA's own impedance-solve
bracket crosses into a different discrete state (`impedanceDev` -0.95% to
-2.38%, still inside the range 100/630 kVA already sit in); 100, 630 and
2500 kVA are unmoved. 1250 kVA's own default AUTO-K design no longer
saturates flux at the grade ceiling (a real consequence of the lower
effective no-load figure, not a defect in the saturation reporting) --
`engine.test.mjs`'s own flux-saturation check moved to 2000 kVA, which
still saturates cleanly under the new model.

**Step-lap defaults made rating-aware.** `stackingOffset`'s own default
used to be a flat 10 mm regardless of rating. Below 160 kVA a step-lap
core is commonly built with a tighter 10 mm shift (fewer, narrower steps
make a 20 mm offset a bigger fraction of the yoke length); above it, 20 mm
is the more usual shop figure. `deriveSpec` now suggests `kva < 160 ? 10 :
20` -- still fully editable, Construction C's own explicit 5/10/20 mm
option list unaffected. Two further parameters recorded, editable, not yet
consulted by any mass or loss formula, the same "real manufacturer figure,
honestly not wired into a computation it cannot yet support" treatment
`stackingOffset` itself had before section 54 gave it a real consumer:
`overlapLength` (step-lap overlap between successive layers at the joint,
default 10 mm) and `laminationsPerStep` (sheets grouped at one cut position
before the joint advances, default 6 -- the midpoint of the manufacturer's
own stated 5-7 sheet range -- for `coreType` `"stepLap"`, 2 for
conventional construction).

**The building-factor bands are manufacturer heuristics, not published
constants.** Section 57 already said as much ("manufacturer data, not a
chart") but this is worth restating plainly now that a genuinely
peer-reviewed figure has been checked against one of the constants this
file has been treating as a fixed input: `CORE_TYPES.stepLap.bf` (1.10)
against `dType`'s 1.18 and `sType`'s 1.26 encode step-lap's own advantage
over D-type/S-type at 7.3% and 12.7% respectively -- an "8 to 12 percent"
sort of figure, which is what this platform was quoted. The peer-reviewed
literature instead puts step-lap's real core-loss benefit at 2 to 4.4
percent. This is not acted on here -- changing `CORE_TYPES`' own `bf`
constants without knowing which of D-type or S-type (or both) the
peer-reviewed comparison was actually made against would be swapping one
unverified number for another, not a correction -- but it is recorded so
the next person relying on `CORE_TYPES.stepLap`'s own advantage over
D-type/S-type knows that figure is a manufacturer quote overstating the
peer-reviewed benefit by roughly 2 to 3 times, not an independently
confirmed one.

**Flag: the master mitre versus V-notch conclusion (sections 48/57) depends
on which figure is right.** Section 57 concluded "V-notch runs measurably
more loss than master mitre" from `BUILD_FACTOR_MSC`'s own manufacturer
midpoints (master mitre staggered 1.125, V-notch staggered 1.24). Those are
the same class of quoted figure the paragraph above just found overstated
step-lap's own benefit by 2 to 3 times. The crossover point -- the V-notch
building factor at which its higher processing cost advantage (section 56:
V-notch's own `coreProcVNotch` Rs 6-9/kg against master mitre's own
`coreProcMitre` Rs 12-18/kg) and its loss disadvantage roughly offset -- is
1.137, close enough to master mitre's own 1.125 that the two constructions
would read as near-equivalent overall, not master-mitre-preferred. If
V-notch's true building factor sits nearer the peer-reviewed literature's
own lower end than the manufacturer's quoted 1.24, section 57's own
"master mitre is genuinely lower-loss" conclusion softens toward parity or
reverses. Not resolved here -- `BUILD_FACTOR_MSC` is left unchanged,
since swapping a manufacturer heuristic for an inferred crossover value
without the same chart-level confirmation section 15/35/48 hold every
other constant in this file to would trade one unverified figure for
another -- but recorded so the next design office decision between master
mitre and V-notch construction is made knowing the loss-driven case for
either currently rests on a manufacturer heuristic, not a settled figure.

**No renumbering of Plate A, B or C.** The research behind this section
also touched on plate naming; that part is inferential, this engine's own
Plate A/B/C split is validated against a real chart (sections 12/15/16),
and neither the names nor the geometry they describe are changed here.

`ENGINE_VERSION` bumped to 1.30.0: reachable by the default case (`coreType`
`"stepLap"`, the default for every non-amorphous design) -- every number
in CLAUDE.md's own golden-numbers table for the default case moved, and
that table is updated in the same commit.

## 61. Two more complete Mehir references -- 315 kVA (UGVCL tender) and 500 kVA -- and what they immediately show is wrong

Two complete design sheets, both 11/0.433 kV Dyn11 copper, oil. Unlike the
1250 and 630 kVA sheets these arrive with the full supporting calculation:
the 315 carries a short-circuit calculation to IS 2026:2011 Part V clause
4.1, a heat-dissipation calculation with its own fin count, and a fully
dimensioned lamination drawing set for all three plate shapes. That is
enough to check things this file has so far only been able to fit.

**As given, not derived.**

315 kVA, Level 1:
- Core 197 dia, window height 365, leg centre-to-centre 395, 16 steps,
  gross 294.1 cm2, stacking factor 0.97, net 285.28 cm2, flux 1.5182 T,
  grade 23HP80, 660 kg/set.
- LV 26 turns, 1 coil/phase, 3.28 x 10.78 x 8 DPC, 275.67 mm2 after a 1 mm
  corner radius, 1.52 A/mm2, ID 205, OD 267, axial 345.
- HV 1144 turns, 4 coils/phase, 2.92 dia super enamel, 6.69 mm2,
  1.43 A/mm2, ID 289, OD 385, axial 73 each.
- No-load 470 W, load 1025 W at half load and 3100 W at full. Impedance
  4.75 % declared, 4.20 % measured.
- Tank outside 1255 x 495 x 1010, 20 fins of 800 x 300 provided.
- Frame 1175 at 150 x 75, core bolt 255 M16, tie rod 575 M16, lifting rod
  285 M16, foot plate 410 at 75 x 12.
- Short circuit: Zs 0.288, Zt 18.246, I(HV) 0.343 kA, I(LV) 8.70 kA,
  system fault level 500 MVA, Us 12 kV.

500 kVA:
- Flux 1.3947 T, Et 10.416, no-load 545 W, core 942.3 kg, grade 23HP75,
  17 steps.
- LV 24 turns, 12 parallel conductors 3 axial by 4 radial, bare 3.0 x 11.0,
  DPC 3.35 x 11.35, ID 223, OD 285, radial 31.
- HV round enamelled wire 3.657 dia (9 SWG), 3.745 over enamel, 2 normal
  plus 2 tapping coils per phase, 290 and 291 turns per coil, ID 309,
  OD 404, radial 47.5.
- Load loss 3472 / 3622 / 3755 W and impedance 4.65 / 4.65 / 4.54 % at taps
  1, 5 and 8.
- Tank inside 1310 x 525 x 1205, oil 650 L, total mass 3345 kg.

**Two internal checks pass before the engine is involved at all**, which is
what makes these usable as references rather than as a list of numbers.
The 315's own stated flux follows from its own stated Et and net area:
9.615 / (4.44 x 50 x 0.028528) = 1.5182 T, exactly as printed. And its own
turns ratio closes: LV star phase voltage 433/sqrt(3) = 250 V over 26 turns
gives Et 9.6154, and 11000 / 9.6154 = 1144.0 HV turns, exactly the printed
figure. The sheet is self-consistent.

**What the engine reproduces, given the sheet's own Et, flux and step
count, with `autoFit` off.**

| Quantity | 315 sheet | engine | |
|---|---|---|---|
| LV turns | 26 | 26 | exact |
| HV turns | 1144 | 1144 | exact |
| Core diameter mm | 197 | 197.2 | +0.1% |
| Window width mm | 198 | 199.7 | +0.9% |
| Core mass kg/set | 660 | 672.5 | +1.9% |
| No-load W | 470 | 487 | +3.6% (grade m0h -- see below) |
| HV OD mm | 385 | 380.9 | -1.1% |
| LV OD mm | 267 | 273.0 | +2.2% |

That is a good reproduction of the core and the turns model, consistent
with what the 1250 and 630 kVA sheets already showed. **The no-load row
carries a condition**: 487 W is at core grade `m0h`, which is what the
0.23 mm Hi-B grade on the sheet (23HP80) actually corresponds to. This is
a Level 1 job, and `gradeSuggest("level1")` returns `m4` (0.27 mm), at
which the same design gives **582 W, +23.8 %**. Section 64 works out why
that mapping is wrong. What follows is not conditional on any of that.

| Quantity | 315 sheet | engine | |
|---|---|---|---|
| Window height mm | 365 | 438.7 | **+20.2%** |
| Window aspect Hw/Ww | 1.84 | 2.20 | see section 66 |
| Load loss W | 3100 | 3774 | **+21.7%** |
| LV conductor area mm2 | 275.67 | 161.54 | **-41.4%** |
| HV conductor area mm2 | 6.69 | 3.471 | **-48.1%** |
| LV current density A/mm2 | 1.52 | 2.60 | **+71%** |
| HV current density A/mm2 | 1.43 | 2.75 | **+92%** |
| HV construction | 4 coils/phase | single layer | see section 62 |
| Tank length mm | 1255 | 1323 | +5.4% |
| Tank height mm | 1010 | 1048 | +3.8% |

The 500 kVA, given its own Et and flux: LV turns 24 exact, HV 1056 at the
normal tap, LV ID 223 against 220.9 (-0.9%), HV OD 404 against 412.4
(+2.1%), no-load 545 W against 535 (-1.8%) -- and core mass 942.3 kg
against 867.2 (**-8.0%**), the opposite sign to the 315's own +1.9%.

**Finding 1: current density does not depend on the efficiency level, and
should.** `densitySuggest(kva, cond, dry, isHV)` takes the rating, the
conductor material, the medium and which winding -- not `effLevel`. Running
the 315 at `level1` and at `level2` returns the same 2.60 / 2.75 A/mm2 both
times, confirmed directly. But this sheet is a Level 1 job and runs
1.52 / 1.43 A/mm2, roughly 0.58 and 0.52 of our suggestion. That is not a
small fitting error, it is a missing dependency: the whole point of a
Level 1 design is that it buys a lower load loss with more copper, and the
only lever that does that is current density. CLAUDE.md already documents
the cascade "change the efficiency level and core grade, flux density and
current density follow" -- the first two do follow (`gradeSuggest` and
`fluxSuggest` both take `effLevel`), the third does not, despite being
documented as if it did. This is very likely the same root cause as the
LV-area gap standing open on the 1250 and 630 kVA references since
section 11, which no amount of re-fitting the packing ever closed; those
are both low-loss designs too. Not fixed here -- fixing it moves every
load loss, every copper mass and every price in the platform, and it
deserves its own section and its own `ENGINE_VERSION` bump rather than
being folded into a reference-intake commit.

**RESOLVED in section 70.** **Finding 2: `STEP_UTIL` stops at 15 steps and both new references are
past it.** `STEP_UTIL` holds odd counts 3 to 15 only, `put("steps", ...)`
offers exactly those as the UI options, and `const util = STEP_UTIL[p.steps]
|| 0.94` catches everything else. The 315 is a 16-step core and the 500 is
a 17-step core, so neither is selectable in the product at all, and asking
the engine for 16 steps silently returns a utilisation of 0.94 -- *worse*
than the 0.963 it holds for 15 steps, when 16 steps must in reality fill
the circle better than 15. The 315's own sheet gives the true figure
directly: gross 294.1 cm2 against the 197 mm circle's 304.81 cm2 is a
utilisation of **0.9649** at 16 steps. The fallback is therefore not merely
unfitted, it is the wrong side of the table it falls off. One real point is
not a curve, so `STEP_UTIL` is not extended here on this alone (the same
rule section 1 set for the clearance slope), but the fallback being
non-monotonic is a defect regardless of what the true 16-step figure is.

**Finding 3: the 315's stacking factor confirms the grade table.** Sheet
0.97 exactly, `CORE_GRADES.m4.sf` and `.m0h.sf` both 0.97. Nothing to
change; recorded because it is the first independent confirmation of an
`sf` value in this file.

Items raised by these two sheets are worked in sections 62 to 68, in the
order the design office raised them.

## 62. Effective winding height: the engine applies the Rogowski factor in the wrong direction, and the impedance solve has been hiding it

**SUPERSEDED IN PART by section 74. The conclusion below -- that the sign is
wrong and should be flipped -- did not survive being tested with the current
density corrected.** Flipping it degrades four independent geometric
agreements (the 1250 kVA's own window aspect, the 630 kVA's measured 4x2 LV
arrangement, the 1250's arrangement, the 1000 kVA default's impedance), and
the +11.9% below is measured against the 315's TESTED 4.20%, not against its
DECLARED 4.75%. Against the declared figure -- which is what a design
calculation targets and what this engine solves for -- the current form
lands within 1%. The 4.20% on test is the machine's own deviation from its
design, which is what the tender flagged in the first place. Read the
mechanism below as correct and the recommendation as withdrawn.


The 315 kVA measured 4.20 % against 4.75 % declared. IS 2026 allows
+/-10 %, so the acceptance band is 4.275 to 5.225 and the machine is
outside it. The design office traced the cause to the effective winding
height and asked whether the engine makes the same error.

**It does, and the designer's own arithmetic reproduces exactly.** Checked
independently: 0.95 x LV axial 345 = 327.75 mm, full window 365 mm, ratio
1.1137; 4.733 / 1.1137 = 4.250, their stated figure. A further 3.9 % build
tightening gives X 4.084, and with R% = 3100/315000 = 0.984,
sqrt(4.084^2 + 0.984^2) = 4.201 against 4.20 measured. Every step closes.

**The engine's own formula, evaluated at the sheet's own dimensions** (LV
205/267, HV 289/385, hilo 11 mm, 26 LV turns, iLV 420 A):

| effective height | hEff | X % | Z % | vs measured 4.20 |
|---|---|---|---|---|
| `min(hLV,hHV) x 0.95` (engine now) | 327.8 | 4.597 | 4.701 | **+11.9 %** |
| full window height | 365.0 | 4.128 | 4.244 | +1.0 % |
| `min(hLV,hHV) / 0.95` | 363.2 | 4.149 | 4.264 | +1.5 % |

**Why this has never shown up as a wrong impedance.** `autoWindow` bisects
the window height until calculated %Z equals the declared value, so the
engine reports 4.750 % on this design -- the declared figure, exactly --
no matter what `hEff` is. The error is not in the impedance the engine
prints, it is in the geometry it invents to print it: solving with the
current `hEff` lands on a **438.7 mm window against the sheet's 365 mm,
+20.2 %**. With `hEff` = the window, the same solve lands on 348.2 mm,
-4.6 %. A 20 % error in window height propagates into core mass, tank
height, oil volume and price, silently, while the one number a user would
check reads correct. This is the same class of fault as section 40's
silent invalidation: a solved output agreeing with its target says nothing
about whether the model underneath it is right.

**Finding: this is a sign error, not primarily a construction effect.**
The conventional statement of the Rogowski correction is that end fringing
makes the *effective* height **greater** than the physical winding height,
so the ideal reactance is multiplied by K_R < 1 -- equivalently
`hEff = h / K_R`. The engine does `hEff = h * 0.95`, which makes the
effective height *smaller* and X *larger*. The two differ by 1/0.95^2 =
1.1080, i.e. **+10.8 % on X** -- and the observed error at this geometry is
+11.9 % on Z. The sign error alone accounts for nearly all of it.
`calcSheet` even prints the row as "Heff = h x Rogowski factor", so the
formula and its own stated derivation agree with each other and both
disagree with the textbook.

**The designer's hypothesis and the sign fix are numerically
indistinguishable on this design, and probably on any design.** LV axial /
window here is 345/365 = 0.9452. So "the full window" and "h / 0.95" differ
by 0.51 % of effective height -- and they will differ by about that much on
*any* design whose end clearances take roughly 5 % of the window, which is
most of them. One reference cannot separate these two hypotheses. What
separates them is that one is a formula error demonstrable from theory
alone, and the other is a construction-dependent physical claim that would
need designs where the HV span and the LV height genuinely diverge.

**So: should the effective height depend on HV construction?** Not on this
evidence, and not first. A single-layer winding and four coils spanning
the window really are different -- axial gaps break the uniform current
sheet the classical formula assumes, and multi-coil windings do carry a
different leakage pattern -- but that is a second-order correction on top
of a first-order sign error, and fitting it now would fit it to a residual
that the sign fix mostly removes. Fix the direction first, on theory, then
re-measure the residual against designs that can actually distinguish the
two. Do not introduce a construction-dependent `hEff` on one data point;
that is the mistake section 1 declined to make on the clearance slope and
section 53 declined to make on `MITRE_K`.

**A related defect, found on the way.** `hvLayerMaxKva` is 500, so the
engine selects a single continuous layer winding for the 315 -- but the
real 315 is 4 coils/phase, and the real 500 is 4 coils/phase too. Both new
references are multi-coil at ratings where the engine says single-layer.
Whatever is decided about `hEff`, the construction selection itself is
wrong at these ratings.

**Blast radius, measured, not estimated.** Neither change is made here (the
design office asked for a report before any change to the factor), but both
variants were built and run against every reference. Window height falls on
every one: default 1000 kVA 603.0 -> 573.0 (window) or 577.8 (h/0.95);
1250 kVA 566.5 -> 481.7 or 531.5; 630 kVA 634.1 -> 499.6 or 619.1; 500 kVA
620.2 -> 525.3 or 588.6. Ex-works on the default case moves 19,92,278 ->
23,14,281 (window) or 20,97,139 (h/0.95). **Caveat on those prices: the Z
solve did not converge cleanly under either variant on every case** (the
default case lands at 4.891 % and 5.199 % rather than 5.000 %), because
changing what `hEff` depends on changes the bisection's own relation --
under `hEff = Hw` the solved variable appears on both sides. The window
figures show the direction and rough size honestly; the ex-works figures
should not be quoted until the solve is re-converged as part of the actual
fix. That re-convergence is part of the work, not a detail after it.

**Not changed here.** `ENGINE_VERSION` unmoved, no golden numbers touched.

## 63. Cooling: our tank constant is about half theirs, but the error runs the *opposite* way to the one feared, and the 20 fins are not a safety margin

The design office asked three things: whether our 300 W/m2 is wrong against
their 500, what a cooling margin would cost, and to record the 880 W
discrepancy on their own sheet. The answers are not the expected ones.

**Their method, reproduced exactly.** Tank 1255 x 495 x 1010 gives
2(L+W)H = 3.535 m2; at 500 W/m2 the tank carries 1767.5 W; with their
stated 2690 W total the remainder is 922.5 W, and at 136.4 W per 800 x 300
fin that is 6.76, rounded to the **7 fins** their sheet states. The method
is confirmed, which makes their constants usable.

**The two constants, side by side.**

| | ours | theirs |
|---|---|---|
| tank | 300 W/m2 at 50 K = **6.00 W/m2K** | 500 W/m2 = **12.50 W/m2K at 40 K**, 10.00 at 50 K |
| fin | 250 W/m2 at 50 K = 5.00 W/m2K | 136.4 W per 0.48 m2 fin = **284 W/m2** |

Our fin figure is close to theirs (250 against 284, -12 %). Our tank figure
is roughly **half** theirs. And the two halves are suspiciously exact: the
standard decomposition of tank-wall dissipation is about 6 W/m2K by
radiation plus about 6.5 W/m2K by convection, 12.5 W/m2K together. Our
300/50 is 6.00 exactly; their 500/40 is 12.50 exactly. That is consistent
with `tankDiss` having been set to the radiation term alone and the
convection term never added. Consistent with, not proof of -- the rise
basis of their 500 W/m2 is not stated on the sheet, and at 50 K it would
read 10.0 W/m2K instead. **Ask the manufacturer which rise their 500 W/m2
is quoted at**; the answer decides whether our figure is half or six
tenths of theirs, and it is the single cheapest question on this list.

**The direction matters, and it is not the direction the request assumed.**
A *low* dissipation constant does not make our tanks optimistic. It makes
the engine believe each square metre carries less heat than it really
does, so it demands **more** cooling surface, not less. Like for like --
their tank area, their guaranteed 3570 W, our coefficients, our 47.3 K
target -- the engine asks for 23.1 fins where their own method asks 14 and
the works fits 20. The engine is already the most conservative of the
three. Adding a margin on top would compound a conservatism that is
already there, and the resulting tank would be larger and dearer than what
a real works actually builds.

**The 20 fins are very close to what the physics requires, not a 3x
margin.** Run our own dissipation law over their *actual* provided cooling
-- their 3.535 m2 tank plus 20 fins, 9.60 m2 of fin surface -- at their own
guaranteed 3570 W: top-oil rise **51.3 K**, against the 50 K limit. Invert
it and ask how much fin our law needs on their tank at their loss to sit
exactly at 50 K: **20.9 fins**. They fit 20.

So the answer to "why 20 when you calculated 7" is most likely "because 20
is roughly what it takes". Their 7 is low for two compounding reasons, both
visible on their own sheet: it uses 2690 W rather than their own
guaranteed 3570 W, and 500 W/m2 flat is generous for a tank wall compared
with a rise-dependent law. Correct the loss alone and their method gives
14; correct the constant as well and it gives about 20. The question is
still worth putting to the manufacturer, but it should be put as "is your
500 W/m2 at 40 K, and is the 2690 W a different loss basis" rather than as
"why do you over-provide".

**Cooling margin, priced.** A margin multiplier on `finAreaReq` was built
and run (not committed, no default set, as instructed):

| margin | 315 kVA | 500 kVA | 1000 kVA |
|---|---|---|---|
| 1.00 | 9,69,304 | 13,20,864 | 19,92,278 |
| 1.25 | +0.53 % | +0.56 % | +0.43 % |
| 1.50 | +1.06 % | +1.12 % | +0.85 % |
| 2.00 | +2.12 % | +2.24 % | +1.71 % |
| 3.00 | +4.24 % | +4.49 % | +3.42 % |

Cooling is a **small price lever**: trebling the fin area costs between
3.4 % and 4.5 % of ex-works. Fin steel is thin and cheap relative to core,
copper and oil. This cuts both ways -- it means the platform's prices are
not very exposed to getting the cooling constant wrong, and it means
buying real thermal margin is cheap insurance. What it is not is a reason
to leave `tankDiss` unresolved, because the same constant also sets the
predicted rise that a heat run is judged against.

**RESOLVED in section 71: the 880 W is not a discrepancy.** This section
originally recorded it as an open question and warned "do not adopt 2690 W
for anything". That warning was wrong, and the resolution came out of
section 71's work rather than from any new data -- the sheet already
contained it. Their full-load copper loss is **2220 W**, and every figure
on the sheet follows:

- 50 % load, stated 1025 W = no-load 470 + 0.25 x 2220 = **1025** exactly.
- Heat dissipation, using 2690 W = no-load 470 + 2220 = **2690** exactly.
- I2R computed from their own stated conductor areas and mean turns is
  1814 W at 75 C and 1960 W at 100 C; x1.20 stray gives 2176 and 2352 W,
  bracketing 2220 W at about an 85 C reference.

So 2690 W is the design's own **calculated** total loss and 3100 W is the
**guaranteed** load loss, which carries tender margin -- about 28 % of it.
Two different quantities, both correct, never reconciled on the sheet
because a designer reading it would not need them to be. Nothing on their
sheet is wrong.

This matters beyond tidying an open question, in two directions. It means
their fin count should be judged against 2690 W, where their own 7 fins is
arithmetically right and the "why 20" question is about margin policy, not
error -- and separately it means **the real design's load-loss target is
2220 W, not 3100**, which is what section 71 measures the engine's own load
loss against.

**Nothing changed.** No constant moved, no margin parameter added, no
default set, `ENGINE_VERSION` unmoved.

## 64. The flux floor is not an economic turning point, the fit runs *toward* it rather than toward the ceiling on both new references, and the real no-load gap is the grade table

Three questions were put: what the 1.42 T floor is for, whether it is
justified, and what happens to the three real designs if it goes. The
measurements answer all three, and two of the answers invert the premise.

**What it is for.** `bMin` bounds `fitToSchedule`'s downward search on flux
(`packages/engine/index.js`, in `fitToSchedule`, `searchDesigns` and
`resolveDiscreteNeighbourhood`, 1.42 T for every CRGO grade, 1.20 T for
amorphous). Lower flux buys a lower no-load loss with a heavier core, so
without a bound the fit would chase an unmeetable no-load limit down
without end. The floor also drives an honest diagnostic: "Flux is already
at the 1.42 T floor for this core grade -- no lower K closes this."

**Is it justified? The behaviour yes, the value and its stated reason no.**
CLAUDE.md justifies it as "below that the core gets heavier faster than the
loss falls", which asserts an economic turning point at 1.42 T. There
isn't one. Ex-works against flux, `autoFit` off, everything else held:

| flux T | 315 kVA | 500 kVA | 1000 kVA default |
|---|---|---|---|
| 1.25 | 10,35,064 | 13,71,836 | 20,38,362 |
| 1.35 | 9,84,073 | 13,45,324 | 19,43,165 |
| 1.42 | 10,11,868 | 13,07,821 | 18,82,132 |
| 1.55 | 9,59,205 | 12,42,511 | 17,88,100 |
| 1.70 | 9,10,733 | 11,83,326 | 17,00,948 |

Cost falls monotonically as flux rises, across the whole range, on all
three. There is no minimum at 1.42 T and none anywhere in the interval --
cost always prefers more flux, and what pulls flux back down is the loss
limit, not the price. So 1.42 T is an arbitrary bound wearing an economic
justification that the engine's own cost model does not support. The bound
is still needed; the number and the sentence explaining it are not
evidence-based. CLAUDE.md's wording should be corrected when the value is.

**What happens to the references -- and the premise inverts here.** The
request described the fit as driving "toward the ceiling". Measured with
`autoFit` on, at four different floors:

| | fitted flux | where it lands |
|---|---|---|
| 315 kVA, limits 470/3100 | 1.4200 | **hard against the floor** |
| 500 kVA, limit 545 | 1.4215 | **hard against the floor** |
| 1000 kVA default | 1.7800 | against the grade ceiling |

The fit drives toward the ceiling only when the no-load limit is slack (the
1000 default). On both new references the limit binds and the fit drives
the other way, down onto the floor. And the real designs sit at **1.5182 T
and 1.534 T -- above where our fit lands**, not below. So the floor is not
what stops the engine reaching these designs; the fit's own downward drive
is, and removing the floor moves the engine *further* from both, not
closer.

One correction of record: of the three real flux figures (1.3947, 1.5182,
1.534) exactly **one** sits below the 1.42 T floor, not two. That one is
the 500 kVA, and our fit lands at 1.4215 there -- just above both the floor
and the real design.

**The golden case is untouched by the floor.** At floors 1.42, 1.35, 1.30
and 1.20 the default 1000 kVA fits to 1.7800 T every time, core 1105 kg,
no-load 1084 W, ex-works 19,92,278 -- identical. Whatever is eventually
decided about `bMin`, it does not move the golden-numbers table.

**The real no-load gap is the grade table, not the flux.** At the 315's own
flux, by grade:

| grade | wRef | 315 no-load W (sheet 470) | 500 no-load W (sheet 545) |
|---|---|---|---|
| m5, 0.30 mm | 1.25 | 698 (+48 %) | -- |
| m4, 0.27 mm | 1.05 | 582 (+24 %) | 639 (+17 %) |
| **m0h HiB, 0.23 mm** | 0.88 | **487 (+3.7 %)** | **535 (-1.8 %)** |
| zdkh, 0.23 mm | 0.78 | 432 (-8 %) | 474 (-13 %) |

Both sheets name their steel: **23HP80** on the 315 and **23HP75** on the
500. Both are 0.23 mm high-permeability grades, which is our `m0h`, and at
`m0h` the engine reproduces both no-load figures to within 4 %. But
`gradeSuggest("level1")` returns `m4`, 0.27 mm, and the 315 is a Level 1
job -- so the engine equips a real Level 1 design with thicker, lossier
steel than the works actually buys and then misses the no-load figure by
24 %. The works appears to use 0.23 mm Hi-B as its normal stock regardless
of the efficiency level, and to buy the level with flux and geometry
instead. Tying `coreGrade` to `effLevel` encodes a purchasing decision the
works does not make.

**Recommendation. The `gradeSuggest` half of this is DONE in section 70;
the floor is still untouched, as recommended.** Do not remove or lower the floor on
this evidence -- it is not the binding constraint on any of these three
designs, and the one design below it is below it by 0.025 T. Fix
`gradeSuggest` first: it is a first-order error worth 24 % of no-load loss
on a real reference, where the floor is worth nothing on two of the three.
The same ordering item 1 takes: correct the first-order term, then measure
what residual is actually left to fit. Both changes move prices and both
need their own `ENGINE_VERSION` bump.

**Nothing changed.** `bMin` unmoved, `gradeSuggest` unmoved,
`ENGINE_VERSION` unmoved.

## 65. Plate geometry from the dimensioned drawings: `MITRE_K` cannot be retired yet, and the reason is a 3 % disagreement the engine already has with itself

The lamination drawings dimension all three Construction B shapes -- outer
limb a trapezoid with 45 degree ends (P, Q), centre limb a hexagon with
45 degrees at all four corners (P, Q, T, S), yoke a trapezoid whose V-notch
is dimensioned as Q/2 and P/2, i.e. relative to the plate rather than as an
absolute. The proposal was to derive the plate areas directly and, if they
reproduce 660 kg and 942.3 kg, retire the three fitted `MITRE_K`
coefficients. They do not, and the reason is worth more than the result.

**Only one of the two charts is testable at all.** `coreConstructionB`
needs the window height and the leg centre-to-centre distance. The 315
sheet gives both (365 and 395). The 500 sheet gives neither -- no window
height, no leg centres, no core diameter. Its 942.3 kg therefore cannot be
reproduced from geometry by any model, correct or otherwise. **This is the
first thing to ask for**: the 500's window height, leg centres and core
diameter would turn a one-point check into a two-point one, which is the
difference between fitting and confirming (section 1's rule, section 53's
rule).

**The derived coefficients.** Reading the shapes with Q as the step's own
width: a trapezoid mitred 45 degrees at both ends has mean length equal to
its outer edge less one width, so `outer` = 1.00 against `outerOuter`
= Hw + 2w. The centre hexagon's chevron point is w/2 deep at each end
(section 52/53's own established figure, and the same w/2 the yoke's own
notch is dimensioned at, which is a real cross-check between two separate
drawings), giving a mean of Hw + w/2 against `outerCentre` = Hw + w, so
`centre` = 0.50. The yoke trapezoid's mean is 2cc, less the V-notch's own
triangular cutout (depth w/2 across width w, area w^2/4, equivalent length
w/4), giving `vNotch` = 1.25 against `outerVNotch` = 2cc + w.

| | fitted (now) | derived | difference |
|---|---|---|---|
| `outer` | 1.27514 | 1.00 | +0.275 |
| `centre` | 0.73751 | 0.50 | +0.238 |
| `vNotch` | 1.44585 | 1.25 | +0.196 |

The three fitted values sit above the three derived ones by +0.196 to
+0.275 w, averaging about +0.24 w -- **a roughly constant offset across
three independently fitted coefficients**. That is a real pattern and it is
what section 58 was chasing when it tested kerf and limb-yoke fit tolerance
and could not close the centre residual. It is suggestive of one systematic
per-plate length deduction rather than three unrelated shape errors. It is
not proof of one, and it is not acted on here.

**The test, at the 315's own geometry** (dCore 197, Hw 365, cc 395,
16 steps, 0.23 mm, sheet 660 kg/set):

| | yoke | outer | centre | total | vs 660 |
|---|---|---|---|---|---|
| fitted `MITRE_K` | 330.9 | 224.7 | 94.5 | 650.1 | **-1.5 %** |
| derived | 346.0 | 245.9 | 103.7 | 695.6 | **+5.4 %** |

On which reading the fitted values win and the derivation should be
discarded. **Except the test is confounded, and correcting the confounder
reverses the ranking.** `stepWidths(16, 197)` builds a ladder whose gross
area is 302.72 cm2 where the sheet's own is 294.1 cm2 -- 2.9 % of steel
that the plate model is then asked to account for and cannot. Scale both
results by the sheet's own area and the fitted model gives 631.6 kg
(**-4.3 %**) while the derived gives 675.8 kg (**+2.4 %**). Two defensible
normalisations, opposite conclusions, on one chart.

**The confounder is an inconsistency the engine already has with itself.**
The core area -- and therefore the flux, and therefore every loss and every
price -- comes from `STEP_UTIL`. The plate masses come from the
`stepWidths` ladder. These are two representations of the same physical
quantity and they do not agree:

| steps | ladder utilisation | `STEP_UTIL` | disagreement |
|---|---|---|---|
| 9 | 0.9742 | 0.9480 | +2.8 % |
| 13 | 0.9884 | 0.9600 | +3.0 % |
| 15 | 0.9823 | 0.9630 | +2.0 % |
| 16 | 0.9931 | (fallback 0.94) | +5.7 % |
| 17 | 0.9834 | (fallback 0.94) | +4.6 % |

The 315's own real 16-step ladder sits at 0.9649, **between** our two
figures -- the area basis is 2.6 % pessimistic and the cutting ladder 2.9 %
optimistic, on the same core. This is the same class of fault section 16
already named ("two cutting documents in one tool must not send a shop two
different steel weights"), one level further up: not two cutting documents
disagreeing, but the cutting geometry disagreeing with the magnetic area
the whole design is built on.

**Conclusion: `MITRE_K` is not retired.** The difference between the fitted
and derived models (about 7 % of core mass) is smaller than the confounder
between the two step-area models (up to 5.7 %), the one testable chart
cannot separate them, and the second chart is not testable at all. Retiring
three fitted constants in favour of a derivation that is only better under
one of two defensible normalisations would be trading a known fit for an
unknown one. Fix the step-area inconsistency first, get the 500's missing
geometry, then re-run this exact comparison -- at which point it should be
decisive either way.

**Also needed: the numeric dimensions.** The derived coefficients above
come from the drawings' *shape* descriptions plus the assumption that Q is
the step's own width. The actual dimensioned values of P, Q, T and S per
step are not in hand, and they would replace this inference with
arithmetic. That, plus the 500's window and leg centres, is the whole
remaining input this item needs.

**Nothing changed.** `MITRE_K` unmoved, `stepWidths` unmoved, `STEP_UTIL`
unmoved, `ENGINE_VERSION` unmoved.

## 66. Conductor modelling: corner radius on rectangular strip, and round enamelled wire as a real construction chosen by HV current

Two things the engine did not model, both stated outright on the new
sheets, both now implemented. `ENGINE_VERSION` 1.31.0.

**Corner radius.** Rectangular magnet wire is supplied with radiused
corners, so a strip's copper area is its nominal rectangle less
(4 - pi)r^2 over the four corners. The 315 sheet states this explicitly:
3.28 x 10.78 over 8 conductors is 282.87 mm2 of rectangle but **275.67 mm2
of copper**. At exactly r = 1 mm the formula gives 276.00 mm2, 0.12 % from
the sheet; back-solving the sheet's own figure gives r = 1.0237 mm. The
model and the default are both confirmed.

The correction runs the opposite way inside this engine to the way it reads
on the sheet. A designer starts from the ordered rectangle and works down
to copper; the engine starts from `aLVreq` -- the copper it needs -- and
works out to a size. So the fix is not to shrink the copper (which would
wrongly change resistance and mass) but to **inflate the envelope**:
`stripEnv = stripArea + (4 - pi) r^2` per strand, and the coil finds room
for the envelope. Before this, envelope and copper were the same number and
every strip winding in the platform was built marginally too small.
`cornerRadius` defaults to 1.0 mm, applies to rectangular strip in both
windings, and applies to neither foil (a rolled sheet, no meaningful
corner) nor round wire (no corners).

**Round enamelled wire.** Both new sheets wind round HV: the 315 at 2.92
dia super enamel, whose area works out at 6.697 mm2 against the sheet's
own stated 6.69, and the 500 at 9 SWG, 3.657 dia, 10.504 mm2. The engine
did have a round branch, but behind an undocumented, unreferenced
`aHVreq > 6` cutoff buried in the geometry closure -- which put **both**
real designs on strip. It is now a real parameter, `hvCondShape`
(auto/round/strip) with `hvRoundMaxAmp`.

**Why the threshold is a current and not a diameter.** A diameter limit is
the better physical statement -- the constraint is that round magnet wire
is drawn and enamelled only up to about 4 mm -- and it was implemented
that way first. It failed, informatively. At a commercially honest 4.0 mm
it flipped the 630 kVA dry reference to round and **broke that reference's
own measured winding structure**: its sheet's 6 coils of 13 layers came out
as 8 of 10, a hard assertion in `reference-designs.test.mjs`. The reason is
the coupling to section 61: `aHVreq` is `iHV / deltaHV`, and `deltaHV` is
about 1.9x what these works actually run, so the engine's computed
conductor is roughly half the real one and a diameter rule reads a real
strip winding as round. Current is an *input*, uncontaminated by that
error, so the rule is keyed to it instead.

The threshold is bracketed by two real designs rather than fitted to one:
the 500 kVA winds round at **15.15 A**, and the 630 kVA needs strip at
**19.09 A** for its own 6 x 13 structure to reproduce. 18 A sits between
them. It also lands from an unrelated direction: a 4.0 mm round wire
carries 17.97 A at the 1.43 A/mm2 these sheets actually run. Two
independent arguments, the same figure. **Revisit once `deltaHV` is
corrected** -- at that point the diameter form becomes viable and is the
better statement of the physics.

All five references now classify correctly: 315 round, 500 round, 630
strip, 1000 strip, 1250 strip.

**What moved, and what did not.** Setting `cornerRadius` to 0 reproduces
every ENGINE_VERSION 1.30.0 golden **exactly** -- 630 kVA 15,74,782,
1000 kVA 19,92,278, 1250 kVA 23,54,283 -- so the corner radius is the sole
mover and the shape work moves nothing on its own. On the default case
ex-works goes 19,92,278 -> 20,05,344 (+0.66 %), no-load 1084 -> 1088 W,
core 1105 -> 1109 kg, tank length 1532 -> 1541 mm; load loss, impedance and
efficiency are unmoved. 630 kVA moves +3.14 % and 1250 kVA -0.05 %, the
630's own size being a discrete winding-configuration flip rather than the
corner radius's direct cost, the same bracket sensitivity sections
30/32/39/46/51/57/60 all record.

**One real cost, recorded rather than smoothed over.** The 630 kVA's
impedance deviation worsens from -0.18 % to +5.21 % -- the corner radius
pushes that rating across a discrete boundary (7 coils of 14 layers become
6 of 16). Swept across fifteen ratings the change leaves 11 unchanged,
makes 315 and 630 worse and 1250 and 1600 better, so it is reshuffling
rather than a systematic loss of accuracy, and 4.735 % against 4.5 %
declared is still inside IS 2026's +/-10 %. The underlying cause is that
the **window-height solve has no neighbourhood resolution of its own**, the
way the loss fit gained one in sections 50-51. That is the real fix and it
is not this section's.

**A stale baseline found on the way.** `impedanceDev`'s recorded figures
for 100 and 630 kVA were 2.25 % and -3.78 % while the engine was actually
delivering -0.00 % and -0.18 %. Because that check only fails when a
deviation *grows*, a slack baseline silently licenses a regression all the
way back up to it -- 630's real degradation here was partly masked by it.
Both corrected to what the engine does. Same class as invariant 7 and the
golden-numbers table: a record whose only job is to be accurate, quietly
not being.

**Both new references are now enforced, not just documented.**
`reference-designs.test.mjs` carries the 315 (LV turns 26 and HV turns 1144
exact, core diameter, window width, core mass, no-load, HV OD, round shape)
and the 500 (LV turns, HV OD, no-load, round shape), plus four honest
`knownGap` entries: the 315's window height (+20.7 %, section 62), its load
loss (+22.0 %, section 61), the 500's core mass (-7.9 %, section 65) and a
new one -- core-to-LV clearance runs about 3 % generous on both (315
212.9 against 205, 500 230.1 against 223). Section 1 fitted the LV-to-HV
gap at 11 kV from the 1250/630 sheets and explicitly left the rest of the
clearance curve unverified; these are the first two designs to test its
core-side figure, and they agree with each other on the sign and size.

Grade note: both references are pinned to `m0h` in the test. Their sheets
name 23HP80 and 23HP75, both 0.23 mm Hi-B, which is `m0h` -- while
`gradeSuggest("level1")` returns the 0.27 mm `m4`. That is section 64's
open defect, pinned here so these references test geometry rather than
re-testing it.

## 67. Window aspect: there is no constraint left to bound, 1.84 is real, and the check that says section 62 must not be fixed on its own

**There is no aspect limit any more.** The 2.8 ceiling in the request was
`maxAspect` (sections 28/32), and section 44 removed it in favour of the
two shop limits it was always a proxy for -- `coilHeightLimit` and
`tankHeightLimit`. What survives is `put("aspect", ...)`, a **seed** for
the window bisection, not a constraint. Confirmed directly: seeding the
315 at 2.0 and at 3.8 both solve to 2.198. The solved window is free of it.

**Can the engine reach a 1.84 design? Structurally yes, currently no.**
Aspect is an output of the impedance solve, not an input, so nothing
forbids 1.84. The engine lands at 2.20 on this design. Where it lands is
governed by section 62's effective-height error, not by any aspect rule.

**Should a lower bound be added? No, and this design is the reason.** The
315 is a delivered, tendered machine at 1.84. Any lower bound above that
excludes a transformer that exists. Note that `aspect`'s own slider range
already starts at 2.0 -- above the real design -- which is harmless only
because the seed does not bind. If that range is ever made binding, it
would forbid this reference outright.

**The finding that matters here is a check on section 62.** Aspect against
the sheets, and what section 62's `hEff` change would do to it:

| | engine now | with s62 change | sheet |
|---|---|---|---|
| 315 kVA | 2.20 | 1.59 | **1.84** |
| 1250 kVA | **2.44** | 1.89 | **2.44** |
| 630 kVA dry | **2.63** | 1.67 | **2.64** |

The engine currently reproduces the 1250's and 630's own window shapes
almost exactly, and the section 62 change would break both while
overshooting the 315 past its target. Taken alone that looks like evidence
against section 62. It is not, and the reason is measurable.

**Two known errors are partly cancelling.** Section 62's measurement was
taken at the 315's *own* sheet dimensions, where no solver behaviour can
intervene: our formula gives 4.70 % against 4.20 % measured. That stands.
But in any *solved* geometry a second error pulls the other way. At the
315:

| | ours | sheet | |
|---|---|---|---|
| hilo | 11.00 | 11 | **0.0 %** |
| LV radial | 30.30 | 31 | -2.3 % |
| HV radial | 42.92 | 48 | -10.6 % |
| `dEff` | 0.03541 | 0.03733 | **-5.2 %** |

X is proportional to `dEff` and inversely proportional to `hEff`. The
`hEff` sign error pushes X **up 10.8 %**; the short radial build pushes it
**down 5.2 %**; the net on a solved geometry is **+5.1 %**, about half the
true formula error. On the 630, whose LV radial build is 35 % short
(section 11's open gap), the cancellation is larger still -- which is
exactly why its solved aspect looks right today.

**So: do not fix `hEff` on its own.** Correcting the effective height while
the radial build is still short removes the larger of two offsetting errors
and leaves the smaller one exposed, which is what the 1.89 and 1.67 columns
above are showing. The effective height (section 62), the current density
(section 61) and the radial build it drives are one piece of work, and the
references that currently agree do so by cancellation, not by being right.
This is the same lesson section 39 recorded when a stale fit made a
comparison look settled, and it is the reason section 62 stopped at a
report.

**One clean confirmation, worth recording on its own.** The 315's
LV-to-HV gap comes out at **11.00 mm against the sheet's 11 mm**. Section 1
fitted that intercept at 11 kV from the 1250 and 630 sheets and flagged
that only 11 kV was confirmed. This is a third design, a third rating,
same voltage class, landing exactly. The intercept is confirmed; the slope
above 11 kV remains untested, as section 1 said.

**Nothing changed.** No bound added, no parameter moved, `ENGINE_VERSION`
unmoved.
## 68. Short circuit to IS 2026:2011 Part V clause 4.1 -- system fault level added, and an HV/LV basis mismatch found while doing it

The 315 sheet carries a full short-circuit calculation, the first reference
to do so. It is reproduced exactly, all four figures, and it exposed a
second defect that had nothing to do with the source impedance.

**Their method, confirmed unambiguously.**

```
Zs = Um^2 / Sfault           = 12^2 / 500        = 0.288  ohm
Zt = (%Z/100) x V^2 / S      = 0.0475 x 11^2/0.315 = 18.246 ohm
Isc(HV) = V / (sqrt(3)(Zs + Zt)) = 11000/(1.732 x 18.534) = 0.343 kA
Isc(LV) = Isc(HV) x V(HV)/V(LV)  = 0.343 x 11000/433      = 8.70 kA
```

**The mixed voltage basis is real and is not ours to tidy.** `Zs` is built
on Um (12 kV) because a system fault level is quoted at the system's own
highest voltage; `Zt` and both currents are on the transformer's rated
11 kV. Using one voltage throughout reproduces neither figure -- Um in
`Zt` gives 21.714 against a stated 18.246, and Um in the current gives
0.374 kA against a stated 0.343. Only the mixed basis lands on all four,
and it lands exactly. That is enough to adopt the method as written rather
than as it might be tidied.

**`systemFaultMVA`, default 500.** A property of the network the machine
goes into, not of the machine, so it is an input with no defensible
derivation from the rating. 500 MVA is the sheet's own figure and a common
11 kV feeder assumption. **Setting it to 0 means an infinite bus and
reproduces the previous impedance-only figure exactly** -- verified:
`iscMult` comes back as 21.0526 against 100/%Z = 21.0526, to the last
digit. Including a 500 MVA source lowers the fault current by **1.55 %** at
this rating. Small here, and it grows as the transformer's own impedance
falls relative to the source's -- which is to say on larger units and
weaker systems, exactly where a withstand margin matters most.

**The defect found on the way: HV and LV fault currents were quoted on
different bases.** `iscHV` was `iHV * 100/%Z` where `iHV` is a **phase**
current on a delta HV, while `iscLV` was `iLV * 100/%Z` where `iLV` is a
phase current on a star LV and therefore also the line current. The two
were then printed side by side in `calcSheet` as though they were the same
kind of quantity. At the 315 that put the HV figure at 198 A where the
sheet says 343 A -- the ratio being exactly sqrt(3), which is the signature
of the error, not a coincidence. Both are now line currents, which is how a
sheet quotes them and how switchgear is rated. This was a live, user-facing
wrong number on every delta-HV design in the platform, and it was
independent of the source-impedance question that prompted the work.

`calcSheet` now shows the derivation as three rows -- system impedance,
transformer impedance, then the current -- cited to IS 2026 Part V clause
4.1 rather than the generic IEC withstand reference it carried before, so
a reader can check it against the same clause the sheet does.

**Enforced, not just recorded.** `reference-designs.test.mjs` asserts all
four figures against the sheet at 0.5 % tolerance.

**Version.** `ENGINE_VERSION` **1.32.0**, its own bump, committed
separately from section 66's 1.31.0. Both changed formulas, and invariant 4
asks for a bump per formula change, not per batch -- a quotation issued at
1.31.0 has to reprice at 1.31.0, which it cannot if 1.31.0 later means two
different fault-current models. No priced output moves here: fault current
does not enter the BOM, so the golden-numbers table is untouched by this
section and CLAUDE.md's table still reads as it did at 1.31.0.

## 69. `documentRegister` review for this batch (CLAUDE.md invariant 7)

Checked every row against what sections 61-68 actually built, not just the
rows the work obviously touched.

**One row was wrong, and had been for some time.** Row 2, the Complete
Engineering Calculation Report, described the Calculations tab as
"68 steps". It is 84 -- 82 before section 68 added two. The count had
drifted well before this batch and nothing near it had been edited, which
is precisely the failure mode invariant 7 describes. Corrected to 84.

**Rows checked and left alone, with the reason:**
- Row 2's `missing` list ("centre of gravity, transport weight, mechanical
  stress on the clamping structure and detailed short-circuit force
  calculation are not modelled") stays true. Section 68 added fault
  *current* to IS 2026 Part V; it did not add the electromagnetic *force*
  that current produces, which is a different calculation and still absent.
  The wording already says "force", so it is accurate as it stands -- worth
  stating explicitly, because "we now do short circuit" is exactly the
  half-truth that would have made this entry silently false.
- Row 21, Type Test Report, "need": unchanged. Computing a fault current
  does not produce a test certificate.
- No row claimed the platform could not model round conductor, corner
  radius or system fault level, so nothing became falsely pessimistic
  either. Sections 66 and 68 add engine capability that no register entry
  was describing as missing.

Statuses after this batch: 6 done, 14 part, 8 need, 28 rows.

## 70. `gradeSuggest` tied Level 1 to the wrong steel, and `STEP_UTIL` fell off a cliff past 15 steps -- both fixed against real sheets

Two defects section 61 and section 64 identified and left standing. Both
are closed here. `ENGINE_VERSION` 1.33.0.

**`gradeSuggest("level1")` returned `m4`.** At the sheets' own flux and
step counts:

| grade | | 315 (sheet 470 W) | 500 (sheet 545 W) |
|---|---|---|---|
| `m4` CRGO M4, 0.27 mm | wRef 1.05 | 586 W, **+24.7 %** | 640 W, **+17.4 %** |
| **`m0h`** M0H HiB, 0.23 mm | wRef 0.88 | **491 W, +4.5 %** | **536 W, -1.6 %** |
| `zdkh` laser-scribed, 0.23 mm | wRef 0.78 | 435 W, -7.3 % | 476 W, -12.7 % |

Both sheets name their steel -- **23HP80** on the 315 and **23HP75** on the
500, both 0.23 mm high-permeability -- and `m0h` reproduces both. So
`level1` now returns `m0h`.

The deeper point is that tying the *grade* to the efficiency level encoded
a purchasing decision this works does not make. It stocks 0.23 mm Hi-B and
buys the loss level with flux and geometry, which `fluxSuggest` already
varies by level. `level2` keeps `m0h` and `level3` keeps `zdkh`, unchanged
-- there is no Level 2 or Level 3 reference to move them against, and
`level1` now sharing `level2`'s grade is the finding, not a collision.

**Recorded because it is not visible in the table above: `m0h`'s wRef is
doing some compensating.** By catalogue naming 23HP80 is 0.80 W/kg at
1.7 T and 23HP75 is 0.75 -- at or below `zdkh`'s 0.78, not `m0h`'s 0.88.
And `zdkh` under-predicts both sheets, by 7 % and 13 %. So the engine
agrees with reality when fed 0.88 and disagrees when fed these grades' own
catalogue figures, which means roughly 10 % of no-load is being carried by
`wRef` that belongs somewhere else in the no-load model -- section 60's
joint-mass split being the obvious suspect. `m0h` is adopted on the
measured agreement, not on a claim that 0.88 is these grades' true specific
loss. **Do not "correct" `wRef` to 0.80 in isolation**; it would make both
references worse, which is the signature of removing one of two offsetting
errors, exactly as section 67 found for the effective height.

**`STEP_UTIL` stopped at 15 and everything past it fell onto a flat 0.94**
-- *lower* than the 0.963 held at 15, so asking the engine for more steps
made it believe the core filled its circle worse. Both new references are
past the old end of the table (16 and 17 steps), so neither was selectable
and both were told a 16- or 17-step core packs like a 5-step one.

The 16-step entry is **measured, not fitted**: the 315 sheet's own gross
294.1 cm2 against its 197 mm circle's 304.81 cm2 is **0.9649**.
`stepUtil(n)` now interpolates between tabulated counts and **holds** the
top value above the table. Holding is deliberate -- more steps cannot fill
a circle worse, so a held value is never wrong-signed, only conservative,
where a curve fitted past the last real measurement would be inventing the
thing sections 1 and 53 both declined to invent from a single point. 17 is
offered as a selectable count (the 500 is a 17-step core, and a real design
the product cannot express is a real gap) but takes 16's figure until
someone measures one.

**What actually moved, all five references, before and after:**

| | grade | no-load W | core kg | ex-works |
|---|---|---|---|---|
| 315 UGVCL Level 1 | m4 -> **m0h** | 595 -> **491** (+26.7 % -> **+4.5 %**) | 688 -> 678 | 9,82,077 -> 9,71,410 |
| 500 | m0h (same) | 546 -> 536 (+0.2 % -> -1.6 %) | 884 -> 869 | 13,37,632 -> 13,22,639 |
| 1250 OLTC | m0h (same) | 1371 -> 1371 | 1710 -> 1710 | **unchanged** |
| 630 dry | m0h (same) | 1033 -> 1033 | 1290 -> 1290 | **unchanged** |
| 1000 default | m0h (same) | 1088 -> 1088 | 1109 -> 1109 | **unchanged** |

**The golden-numbers table does not move**, because the default case is
Level 2 and was already on `m0h` at 15 steps. The version is still bumped:
a formula changed, and invariant 4 is per formula change, not per moved
price.

**One honest regression, not smoothed over.** The 500's core mass goes
from -6.2 % to **-7.8 %** against its sheet. The old 0.94 fallback
understated utilisation, which inflated the computed core toward the
sheet's 942.3 kg -- for the wrong reason. Removing a compensating error
makes the residual visible, and that residual is section 65's open
question: the `stepWidths` ladder and `STEP_UTIL` disagree by 2-3 % about
the same core's area, and this sheet gives no core diameter to settle
which is right. Getting a *worse* number by removing a wrong mechanism is
the correct trade; the alternative is keeping a defect because it happened
to point the right way on one design.

**Both references now run at their own step counts** (16 and 17) in
`reference-designs.test.mjs`, and neither is given a core grade any more --
the test asserts `gradeSuggest` finds `m0h` on its own, which is the fix.

## 71. The entangled fix, attempted and NOT landed: all three changes are blocked on the window solve having no discrete-neighbourhood resolution

The effective height (section 62), the current density (section 61) and the
LV radial build were to be corrected together, because section 67 showed
they partly cancel. All three were implemented and measured against all
five references. **None is committed.** Each is individually defensible and
each makes at least one reference materially worse, for a reason that is
now identified and is none of the three.

**First, two things the work established that are worth more than the fix
was going to be.**

**Our loss model is right; only the density feeding it is wrong.** Fed the
315's own stated current densities (1.52 / 1.43 A/mm2) the engine returns
`aLVreq` 276.3 mm2 against the sheet's 275.67 (**+0.2 %**), `aHVreq` 6.68
against 6.69 (**-0.1 %**), and a load loss of 2278 W against the sheet's
own calculated 2220 W (**+2.6 %**). Section 61 read the conductor-area gap
as evidence the area model was broken. It is not: it is exactly right, and
every bit of the gap is the current density handed to it.

**And the density gap is smaller than section 61 claimed, because `autoFit`
already closes most of it.** `densitySuggest` returns 2.60 / 2.75, but on
the normal path -- `autoFit` on, the sheet's own declared limits -- the
engine fits down to **2.10 / 2.22** and meets both limits (463 W against
470, 2947 W against 3100). The real design sits at 1.52 / 1.43 not because
our fit is broken but because it targets its own **calculated** 2220 W
rather than its **guaranteed** 3100 W: a 28 % margin, against the 7 %
`marginTargetLL` leaves. That is a commercial policy, not physics, and the
630 kVA reference's copper mass (280 kg against 292, -4 %) says the
suggestion is roughly right where no tender margin is in play. **Section
61's density finding is hereby narrowed**: `densitySuggest` not taking
`effLevel` is real, but it is worth far less than the 41 %/48 % area gap
that section implied, most of which is margin policy on one tender job.

**The measured matrix, all five references, each change alone and
together.** LV build in mm, copper in kg, arrangement as axial x radial.

| | impedance % | aspect | LV build | copper | arrangement |
|---|---|---|---|---|---|
| **315** (sheet: build 31, aspect 1.84, 1ax x 8rad) | | | | | |
| baseline | 4.75 | 2.20 | **30.3** | 204 | 1 x 5 |
| Rogowski only | 4.62 | 2.08 | 30.3 | 204 | 1 x 5 |
| strand aspect only | 4.75 | 2.16 | 17.4 | 191 | 1 x 5 |
| both | **6.51** | 1.60 | 40.7 | 217 | 1 x 5, **2 layers** |
| **630 dry** (sheet: build 20, Cu 292, 4ax x 2rad) | | | | | |
| baseline | **4.50** | 2.63 | 13.0 | 280 | **4 x 2** |
| Rogowski only | **5.07** | 2.25 | 32.0 | 303 | 4 x 2, **2 layers** |
| strand aspect only | 4.50 | 2.62 | 14.8 | 283 | **2 x 4** |
| both | 4.50 | 2.46 | 14.8 | 283 | **2 x 4** |
| **1250** (sheet: Cu 982, 5ax x 6rad) | | | | | |
| baseline | 4.93 | **2.44** | 30.7 | 555 | **4 x 5** |
| Rogowski only | 5.00 | 2.21 | 30.7 | 558 | 4 x 5 |
| strand aspect only | 5.28 | 2.31 | 33.2 | 564 | **2 x 9** |
| both | 5.00 | 2.22 | 33.2 | 564 | 2 x 9 |
| **500** (sheet: 3ax x 4rad) | | | | | |
| baseline | 4.65 | 2.89 | 24.4 | 320 | **2 x 4** |
| both | 4.49 | 2.75 | 25.9 | 322 | **1 x 7** |
| **1000 default** | | | | | |
| baseline | **5.00** | 2.57 | 31.2 | 618 | 4 x 5 |
| Rogowski only | **4.82** | 2.44 | 31.8 | 644 | 4 x 5 |
| both | 5.00 | 2.38 | 36.4 | 662 | 2 x 10 |

**Why the strand aspect fails.** The physical observation is not in doubt:
the 315 winds eight 3.28 x 10.78 flats -- 3.29:1 -- on their short edge,
and the engine sizes strands square. But squareness is compensating for the
density error. At our high density `aLVreq` is small, and a square stack of
a small area gives 30.3 mm against the sheet's 31; make the strand flat at
the same small area and the build collapses to 17.4. Correct only the
strand and the 315 gets worse. And the arrangement moves the wrong way on
three references at once: the 630's measured **4 x 2** becomes 2 x 4, the
1250's **5 x 6** target goes from 4 x 5 to 2 x 9, the 500's **3 x 4** goes
from 2 x 4 to 1 x 7. One aspect constant cannot serve them, which is the
same objection sections 9-11 raised when they retired `lvStripAspect`.

**Why the Rogowski fix fails, and this is the real finding.** It is correct
-- at the 315's own dimensions it moves predicted impedance from 4.70 % to
4.26 % against 4.20 % measured. But it shortens the window on every design,
and a shorter window tips the LV over a discrete layer boundary. On the 630
dry, `lvTurnLayers` goes 1 to 2, the build jumps **13.0 to 32.0 mm** in one
step, and %Z lands at **5.07 against 4.50 declared -- +12.7 %, outside IS
2026's own +/-10 %**. On the 1000 kVA default the solve misses its target
entirely, 4.82 against 5.00.

The window sweep shows why, and it is not a tuning problem:

```
630 dry, Rogowski applied, window swept:
  Hw 438 -> Z 11.97, 1 layer      Hw 536 -> Z 6.63, 1 layer
  Hw 554 -> Z  5.73, 1 layer      Hw 634 -> Z 5.07, 2 LAYERS
```

Z(Hw) is **discontinuous** at the layer boundary: the build more than
doubles in one step, so reactance jumps, and the declared 4.50 % can fall
in the gap between the two branches. `autoWindow` is a bisection, and a
bisection on a discontinuous function does not converge to a target that
lies in a jump -- it lands on whichever branch it was last on.

**So the blocker is none of the three changes.** It is that the
window-height solve has no discrete-neighbourhood resolution, where the
loss fit gained one in sections 50-51 for exactly this class of fault.
Section 66 already recorded this in passing, as the cause of the 630's
impedance deviation moving under the corner radius, and said "that is the
real fix and it is not this section's". It is now the thing standing
between the platform and three separate corrections it is otherwise ready
to make. The baseline agreements these references currently show -- the
1250's 2.44 aspect, the 630's 4 x 2 arrangement, the 315's 30.3 mm build --
are **compensations, not confirmations**, and every one of them breaks the
moment a single error is removed in isolation.

**Recommended order, not started here:**
1. Give `autoWindow` a discrete-neighbourhood resolution: detect that the
   solve is straddling a configuration jump, enumerate the nearby
   compliant states, and choose deliberately -- the same shape as
   `resolveDiscreteNeighbourhood`, and reusing its convention of reporting
   the choice rather than hiding it.
2. Then land the Rogowski sign fix, which is the best-evidenced of the
   three and whose only failure mode above is the solver.
3. Then density and strand aspect together, re-measured, since neither can
   be judged while the other is wrong.

**Nothing changed in the engine.** `ENGINE_VERSION` unmoved at 1.33.0, all
three suites green, no golden number touched. Section 63's 880 W open
question is closed by this work and corrected in place.

## 72. The LV area gap is closed: the area model was never wrong, and the density error is systematic to oil, not tender margin

The gap open since section 11 -- the engine's conductor areas and copper
masses running short against every reference -- is resolved. It was never
the area model.

**The area model is exact.** Fed the 315 kVA sheet's own stated current
densities (1.52 / 1.43 A/mm2), with nothing else changed:

| | engine | sheet | |
|---|---|---|---|
| `aLVreq` | 276.3 mm2 | 275.67 | **+0.2 %** |
| `aHVreq` | 6.68 mm2 | 6.69 | **-0.1 %** |
| load loss | 2278 W | 2220 (calculated) | **+2.6 %** |

Two conductor areas to a fifth of a per cent and the load loss to under
three. Sections 8-11 spent a long time on the packing and the axial/radial
split looking for a missing area; there was none. `aLVreq = iLV / dLV` was
always right, and every apparent area gap was the density handed to it.
This closes section 11's LV strand question and the `knownGap` entries that
have carried it on the 1250 and 630 kVA references.

**The density error is systematic, consistent, and specific to oil.**
Three sheets now state or imply their own current density:

| | `densitySuggest` | sheet | ratio |
|---|---|---|---|
| 1250 kVA oil | 2.50 | ~1.44 | **1.74** |
| 315 kVA oil | 2.60 | 1.52 | **1.71** |
| 630 kVA dry | 2.80 | 2.84 | **0.99** |

Two oil designs, four times apart in rating, land at the same **1.72**.
The one dry design lands at 1.00 -- so item 4's dry correction (x1.10,
fitted to that sheet) is confirmed by a second look, and it is the **oil
baseline that is about 1.72x too high**, not the medium correction and not
the rating slope. That the ratio is flat across 315 and 1250 kVA is the
useful part: it is an intercept error, the same shape as section 1's
clearance finding, and it does not need a new rating-dependent term.

**This supersedes "tender margin policy" as the explanation, and the
correction is worth stating plainly because it was my own.** The reasoning
that led there was: `autoFit` already pulls the 315 from 2.60 down to 2.10
and meets both declared limits, so the further drop to 1.52 looked like a
works choosing to build inside its guarantee. That is still true as far as
it goes. But it cannot explain why the **1250 kVA**, a different job at a
different rating, sits at the same ratio -- and section 11 had already
recorded that reference's own implied ~1.44 A/mm2 against a 2.5
suggestion, which is the same 1.74, from evidence that predates the 315
sheet entirely. One design carrying margin is policy. Two designs at the
same ratio, four times apart in rating, is a constant in the wrong place.

Margin is probably still *part* of it -- a designer aiming under a
guaranteed figure on the test floor is real, and section 11's own list of
reasons still stands -- but it is not the main term and it is not what
should be adjusted first. **Correct the oil baseline in `densitySuggest`;
do not reach for `marginTargetLL`.**

**What this gives the entangled work (section 71).** That section could not
judge the strand aspect because the density feeding it was wrong, and could
not judge the density because it had no target. There is now a target, from
two independent references agreeing to within 2 %: oil copper at these
ratings runs about **1.45-1.52 A/mm2**, roughly `densitySuggest / 1.72`.
The strand aspect can finally be measured against a correct area rather
than against one that was compensating for it.

**Nothing changed in the engine here.** This section records a confirmed
model and a quantified error; the fix belongs with the section 71 work,
after the window solve can survive it.

## 73. The window-height solve was a bisection on a dense staircase, reporting convergence it had not achieved

`autoWindow` bisects the window height until calculated %Z equals the
declared value. That is only valid if %Z(Hw) is continuous and monotone. It
is neither, and the engine has been reporting "converged yes" while missing
its own target by up to 5.75 %.

**What the function actually looks like.** Sweeping the window at 100 kVA
and printing the discrete signature at each step:

```
  Hw 302.5  Z  5.70   38|1|1|1|15|119|2
  Hw 302.5  Z  6.44   40|1|1|1|16|119|2
  Hw 302.5  Z 17.88   60|1|1|1|24|119|2
  Hw 307.7  Z  4.86   20|1|1|1|15|122|2
  Hw 309.0  Z  4.83   20|1|1|1|15|123|2
```

Not a smooth curve with a few jumps: a **dense staircase**. The LV foil's
own turn-layer count steps every millimetre or so of window, and %Z swings
between 4.8 % and 17.9 % inside a 5 mm span. A bisection over that
converges on a step, not a root -- and the old code then set `solvedZ =
true` regardless, because it had bracketed. `calcSheet` printed "converged
yes" underneath. Measured at HEAD: 315 kVA 3.41 % off its declared value,
630 kVA 5.21 %, 1250 kVA 5.75 %, all reported as converged. With section
62's effective-height correction applied it reached **12.7 %, outside IS
2026's own +/-10 %** -- which is what made this a correctness problem in
its own right rather than a tuning question.

**Two approaches were tried and rejected, both recorded because the second
looked right.** A coarse global sweep grouped into contiguous "branches",
refined within each: its verdict was **not stable against its own sweep
resolution** -- 63/100/500 kVA reported an unsolvable straddle at 64 and
128 samples and solved cleanly at 256, and 100 kVA flipped back at 512.
That is precisely the sampling artefact section 51 warned about, and a
solver whose answer depends on an arbitrary grid is not a solver. Assuming
monotonicity within a branch fails for the same reason: on a dense
staircase a "branch" is often one sample wide.

**What works is a LOCAL search anchored on the bisection's own answer.**
The bisection genuinely brackets, so it lands within one step of the
target; it simply cannot see the step. So scan a +/-10 % neighbourhood of
its answer finely enough to resolve individual steps, take the closest
achievable %Z, refine once around that. Verified stable: identical results
at 96, 192, 384 and 768 scan points. Deterministic, because the grid is
defined relative to the bisection's answer rather than to an arbitrary
global interval.

**Severity is scaled to the miss, deliberately.** On a dense staircase "the
declared value is not exactly achievable" is the normal case, not an
emergency, and a solver that cries wolf on nine designs in fourteen would
be ignored. So: an exact hit reports converged and says nothing; a miss
inside the standard's own impedance tolerance reports the choice and what
was reachable; a miss **outside** that tolerance sets `windowStraddle`,
which the UI raises as "Declared Impedance Is Not Achievable" and which
tells the user plainly that the design cannot be built as declared. That is
the requirement -- say so rather than return a nearest miss -- without
turning it into noise.

**Result, across the rating range:**

| kVA | HEAD %Z | dev | new %Z | dev | |
|---|---|---|---|---|---|
| 63 | 4.594 | 2.09 % | 4.410 | 1.99 % | better |
| 100 | 4.500 | 0.00 % | 4.560 | 1.34 % | worse |
| 315 | 4.347 | **3.41 %** | 4.525 | **0.56 %** | better |
| 630 | 4.735 | **5.21 %** | 4.450 | **1.12 %** | better |
| 1250 | 4.713 | **5.75 %** | 5.067 | **1.35 %** | better |
| 1600 | 5.000 | 0.00 % | 4.882 | 2.35 % | worse |
| 2000 | 4.879 | 2.42 % | 4.879 | 2.42 % | same |

Worst deviation across fourteen ratings falls from **5.75 % to 2.42 %**;
four better, two worse, eight unchanged. The two that get worse were exact
by luck -- the old bisection happened to land on a step that sat on the
target -- and are now honestly reported as near misses instead.

**A real side effect, worth more than it looks.** The loss fit no longer
cycles at 1000 kVA, at any flux from 1.60 to 1.78 T. Section 46's cycling
diagnosis was partly the loss fit chasing a geometry that was itself
jumping between window solutions; stabilise the window and the fit settles.
The cycle-detection path still needs exercising, so `engine.test.mjs`'s
fixture moves to 100 kVA, which still cycles at 1.55, 1.65 and 1.75 T
(315 kVA does too). **Do not delete that check if 100 kVA also stops
cycling** -- find another rating first, and if none cycles anywhere, say so
there rather than quietly dropping the coverage.

**Cost.** 2564 ms to 2717 ms per design, about 6 %. The 2.5 second baseline
is pre-existing and untouched by this.

`ENGINE_VERSION` 1.34.0. The default 1000 kVA case is unmoved, so the
golden-numbers table stands; 630 kVA ex-works falls 16,24,153 to 15,88,168
and 1250 kVA 23,53,174 to 23,01,914, both because a better-resolved window
is a smaller one.

**This unblocks section 71.** The Rogowski sign fix, the current density and
the strand aspect were all blocked on this solve, and can now be attempted
against a window solve that survives them.

## 74. The entangled fix, resolved: density is right and blocked, Rogowski is wrong to change, strand aspect is unfittable

With the window solve fixed (section 73) all three changes were implemented
and measured against all five references. The outcome is different for each,
and two of the three answers reverse what sections 61/62 expected.

**Current density: quantified, validated, and blocked on a different
defect.** The correction is `densitySuggest`'s oil baseline divided by 1.72
(section 72), the dry multiplier restated from 1.10 to 1.92 -- it was 1.10
only because the baseline beneath it was 1.72x high, and class F's 100 K
against oil's 55 K was never a 10% effect -- and the `isHV` offset removed,
because the two sheets stating both windings disagree about its sign
(315 oil runs HV BELOW LV, 1.43 against 1.52; 630 dry runs HV above, 2.89
against 2.79). With no offset all four measured densities land within 5.2%;
with +0.15 the oil HV is 16% out. Removing a constant fits better than
keeping it.

What it buys, at the sheets' own inputs:

| | before | after |
|---|---|---|
| 315 load loss vs its calculated 2220 W | 3779 W, **+70.2 %** | 2109 W, **-5.0 %** |
| 1250 copper vs 982 kg | 555 kg, **-43.4 %** | 1042 kg, **+6.1 %** |
| 630 dry copper vs 292 kg | 280 kg, -4.0 % | 284 kg, -2.7 % |
| 500 LV arrangement vs 3ax x 4rad | 2 x 4 | **3 x 4, exact** |
| 1250 LV arrangement vs 5ax x 6rad | 4 x 5 | **5 x 6, exact** |

Two arrangements that had never matched now match exactly, and the two
largest standing errors in this file close. **It is still not committed**,
because it breaks four hard assertions checked against real measured
documents: the 1250's HV OD (494 mm, goes from -1% to **+7.6 %**), its tank
length (1660 mm, to **+6.9 %**), and its own real cutting chart (Plate B
+10 %, Plate C +11.5 %, total +6.6 % against the "1250 KVA CORE CHART" on
file).

**The cause is not the density.** Sweeping HV density at the 1250 with LV
held corrected: HV OD is 508 mm (+2.8 %) at the OLD density and 531 mm
(+7.5 %) at the new one, and no HV density in the range reaches 494 mm.
Copper mass wants dHV near 1.60; HV OD wants it as high as possible; they
cannot both be satisfied. That is section 11's own open question -- the
fixed 2.1 HV conductor aspect ratio, "algebraically the same structural
defect `lvStripAspect` turned out to be: independent of scale, no response
to per-turn current" -- and section 11 recorded it as blocked on data,
DATA-REQUEST item 5, because neither sheet states HV conductor dimensions.
It still is. Correcting LV only was tried and is worse than doing nothing
useful: the 315's load loss goes to +36.2 % and the 1250's copper to
-24.0 %, so the HV half of the correction is the half that matters.

**So the density fix waits on one piece of data**: HV conductor dimensions
or strand count for the 1250 or 630 kVA reference. That single input turns
a blocked correction into a landable one, and it is the highest-value
outstanding request in this file.

**Rogowski: the section 62 recommendation is withdrawn.** With the density
corrected, flipping the sign degrades four independent geometric
agreements at once -- the 1250's window aspect (2.42 against a sheet 2.44,
becoming 2.21), the 630 dry's measured 4x2 LV arrangement (becoming 3x3),
its aspect (2.62 against 2.64, becoming 2.45), and the 1000 kVA default's
impedance (5.00 becoming 5.12). Four agreements against real documents do
not all break by coincidence.

The error in section 62's reasoning was the target, not the arithmetic. It
measured our prediction against the 315's **tested** 4.20 %. A design
calculation targets the **declared** value, 4.75 %, and that is what
`autoWindow` solves for -- and against 4.75 % the current form lands within
1 % at the sheet's own dimensions. The 4.20 % on test is the machine's
deviation from its own design, which is exactly what the tender flagged.
Reproducing a manufacturing deviation is not the engine's job. Section 62
is corrected in place.

**Strand aspect: no single constant fits.** The 315 winds a 3.29:1 flat and
the model sizes strands square, which is real. But with density corrected:

| | A = 1.0 (square) | A = 3.3 (the 315's flat) |
|---|---|---|
| 315 arrangement (sheet 1 x 8) | 2 x 4 | **1 x 8, exact** |
| 500 arrangement (sheet 3 x 4) | **3 x 4, exact** | 2 x 6 |
| 1250 arrangement (sheet 5 x 6) | **5 x 6, exact** | 3 x 10 |
| 630 arrangement (sheet 4 x 2) | 3 x 3 | 2 x 4 |

Each value reproduces some references exactly and breaks others. And the
500's own sheet states a 3.67:1 conductor while its arrangement comes out
right only at A = 1.0 -- so the strand SHAPE is real but the arrangement
RULE is what cannot accommodate it. That is the same objection sections
9-11 raised when they retired `lvStripAspect`, and it is not fixed by
choosing a better constant. Not implemented; the shape correction has to
arrive with a corrected axial/radial split, not before it.

**Net position.** Nothing committed from this section. The window solve
(section 73) is committed and stands on its own. Of the three changes: one
is right and waits on a single datum, one is withdrawn on evidence, one
needs a different fix first. `ENGINE_VERSION` unmoved at 1.34.0, all three
suites green, no golden number touched.
