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
impedance.

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

### What the search actually finds

The 1250 kVA reference, at its own guaranteed losses, 15 steps and OLTC (the
values sections 1 and 3-5 hold fixed so this isolates K alone), swept against
`DEFAULT_RATES`:

| K | Ex-works |
|---|---|
| 0.40 | ₹26,17,771 |
| 0.46 | ₹25,87,246 |
| **0.50** | **₹25,83,272 (cheapest)** |
| 0.54 (designer's own, rounds to this step) | ₹26,02,728 |
| 0.58 | ₹26,12,780 |
| 0.70 | ₹26,98,226 |

The curve is genuinely U-shaped and the minimum (K = 0.50) is about ₹19,000
(0.8%) cheaper than the designer's own K = 0.544 at these rates -- a real but
modest saving, not a dramatic one. The 1000 kVA default enquiry (no reference
overrides, ordinary Level 2 distribution) shows the same shape at a smaller
scale: the AUTO suggestion is still 0.545, but `fitEtkToCost` raises the
built design to K = 0.48, ₹15,48,160 against ₹15,52,599 pinned at 0.545.

Moving the rates moves the minimum, confirming the trade is real rather than
noise:

- **Copper at ₹1600/kg** (up from ₹1050): the 1250 kVA optimum moves from
  K = 0.50 to **K = 0.58**. Dearer copper makes fewer turns worth more, so
  the balance shifts toward a bigger core and less winding metal.
- **CRGO at ₹240/kg** (down from ₹305): the optimum stays at K = 0.50 at this
  step size on this design. Cheaper steel pushes the same direction as dearer
  copper -- more core is worth buying either way -- but a 21% cut here isn't
  as large a swing as the 52% copper rise above, and 0.02 steps aren't fine
  enough to show a small shift. The direction is right; do not read the flat
  result as "steel price doesn't matter."

### Why the designer's own sheet sits above the computed optimum

Both reference designs were priced at K = 0.544 / 0.623, above what
`DEFAULT_RATES` optimises to. The copper-price sweep above shows exactly the
direction that would explain it: a designer facing copper that is dear
relative to steel, or steel that is cheap relative to copper, rationally
lands on a higher K than one at this engine's default rates would. The most
likely explanation is that Mehir Transformers' own CRGO cost, or their
supplier terms on it, sit below what `DEFAULT_RATES.core` assumes -- not that
0.544 is wrong, but that it is the right answer to a different set of prices
than the ones shipped as the engine's default. This is a hypothesis, not a
confirmed number: nothing in the two reference sheets states their actual
steel cost, and it is not asserted as a test.

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

**ENGINE_VERSION 1.4.0** (section 2, above): both reference designs give
`etK` explicitly, so `fitEtkToCost` never runs against them and neither
group's numbers moved. Only enquiries that leave `etK` on AUTO see the new
economically-raised value -- `engine.test.mjs`'s default 1000 kVA case is
one, and its golden numbers moved accordingly, recorded there.

---

## Not adopted

Their 7600 W load loss at 1250 kVA is a premium low-loss design, not a schedule
figure. The engine's Level 2 estimate for that rating is 12,253 W. Do not adopt
their losses as defaults.
