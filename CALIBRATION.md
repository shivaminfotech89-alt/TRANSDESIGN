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

| Design | Engine suggests | Designer uses |
|---|---|---|
| 1250 kVA oil | 0.450 | 0.544 |
| 630 kVA dry | 0.453 | 0.623 |

Raise the suggestion and let it vary with medium: dry types carry a higher
constant than oil. Do not simply set 0.55 everywhere.

Note this correction makes designs **dearer**, not cheaper: on the 1250 kVA it
moves core steel from 1570 to 2124 kg. It is a correction toward accuracy, not
toward cost. Both must be applied together.

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

---

## Not adopted

Their 7600 W load loss at 1250 kVA is a premium low-loss design, not a schedule
figure. The engine's Level 2 estimate for that rating is 12,253 W. Do not adopt
their losses as defaults.
