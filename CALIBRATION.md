# Engine calibration against real working designs

Two production design sheets from Mehir Transformers, prepared by a working
designer, were compared against the engine. Given the designer's volts per turn
and clearances, the engine reproduces both transformers to within a few per
cent, so the geometry and turns model is sound. What needs correcting is what
the engine *suggests* when left to choose.

Reference designs:
- **1250 kVA, 11/0.433 kV, Dyn11, OLTC, oil, copper.** 1400 W no-load,
  7600 W load loss. Et 19.23, 13 LV turns, 572 HV turns normal and 628 at
  extreme tap, core 271 mm, 15 steps, hilo 11 mm, copper 982 kg,
  tank 1660 x 665 x 1175.
- **630 kVA, 11/0.433 kV, dry type, copper.** 1300 W no-load, 6200 W load loss.
  Et 15.63, 16 LV turns, 704 HV turns, core 245 mm, hilo 25 mm, LV radial build
  20 mm, copper 292 kg, LV axial 410 mm.

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
