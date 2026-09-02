# Data needed to close the remaining engine gaps

We've now calibrated the engine against four of your sheets — 315, 500, 630
and 1250 kVA. The gaps below are the ones only more real sheet data can
close; none can be worked out from what we already have. All of it should
already exist on sheets you've issued; nothing here needs a new calculation
or a new test build.

**Item 0 is not like the others.** The rest would improve the engine. Item 0
is holding back a correction that is already written and tested and cannot
be committed without it. If only one thing on this list gets answered, that
is the one.

For every item below, please pull: **volts per turn, core diameter, number
of core steps, LV turns, HV turns, conductor arrangement (axial x radial,
and layers), and the hilo (LV-HV clearance).**

## 0. BLOCKER: HV conductor dimensions, for the 1250 kVA or the 630 kVA

**This is the one that matters. Everything else on this list improves the
engine; this one is holding back a correction that is already written,
already tested, and cannot be committed without it.**

### What we need

For **either** the 1250 kVA or the 630 kVA reference -- one is enough, both
is better -- for the **HV winding**:

1. **Bare conductor dimensions.** If rectangular, thickness x width in mm.
   If round, the diameter.
2. **Covered dimensions**, over the paper or enamel, the same way.
3. **Round or rectangular** -- stated explicitly, not inferred from the
   dimensions.
4. **Number of parallel strands** making up one turn.
5. **The arrangement of those strands, axial by radial** -- e.g. "2 axial
   by 3 radial", the same form the LV data on both sheets already gives.

We already have exactly this for the **315 kVA**: 2.92 mm diameter round
super enamel, single conductor, 6.69 mm2. That is one rating. **One more,
at a different rating, settles the question** -- the whole problem is that
a single point cannot tell us how the arrangement responds to rating and
current, and 315 kVA against either 630 or 1250 spans a wide enough range
to answer it.

### What it unblocks, plainly

The engine's suggested **oil current density is 1.72 times too high**. This
is not an estimate. Two independent designs, four times apart in rating,
give the same ratio:

| | engine suggests | your sheet | ratio |
|---|---|---|---|
| 1250 kVA, oil | 2.50 A/mm2 | about 1.44 | **1.74** |
| 315 kVA, oil | 2.60 A/mm2 | 1.52 | **1.71** |
| 630 kVA, dry | 2.80 A/mm2 | 2.84 | **0.99** |

The dry design lands at 1.00, so the medium correction is right and it is
the oil figure specifically that is wrong. Correcting it fixes, measured
against your own sheets:

- the **315 kVA load loss**, from **+70 %** against its own calculated
  2220 W to **-5 %**;
- the **1250 kVA copper mass**, from **-43 %** against its 982 kg to
  **+6 %**;
- the **LV conductor arrangement** on the 500 and 1250 kVA designs, which
  come out **exactly right** for the first time (3 axial x 4 radial and
  5 axial x 6 radial, matching both sheets).

### Why we cannot commit it without the HV conductor data

Correcting the density makes the HV conductor bigger, and the engine builds
the HV winding's radial depth from a **fixed 2.1 : 1 conductor shape that
has no real measurement behind it** -- it was a placeholder, and it is the
same defect we already found and fixed on the LV side once your sheets gave
us real LV conductor numbers. With a wrong HV shape, a bigger HV conductor
comes out too deep, and the 1250 kVA's HV outside diameter goes from 1 %
out to **7.6 %** out, its tank length to **6.9 %** out, and its own cutting
chart totals to **6.6 %** out -- all three checked against documents you
have already sent us.

We tested whether the LV half alone could be corrected and left HV as it
is. It is worse than doing nothing: the 315's load loss lands at +36 % and
the 1250's copper at -24 %. The HV half is the half that carries the
correction.

So: a correction worth roughly 70 % of a load loss figure and 43 % of a
copper mass is sitting finished and unusable, waiting on five numbers from
one sheet.

---

## 1. No-load and load loss at two or three more ratings

Ideally one in the **100-300 kVA** range and one at **2000 kVA or above**.
Guaranteed no-load loss and guaranteed load loss, with the rating, standard
and efficiency level, for each.

**What it fixes:** the no-load loss coefficient (currently 4.6 in the
formula). The load loss coefficient was confirmed against 630 kVA and 1250
kVA — both sheets agreed to within 1-2%. No-load loss was left untouched
because we only have those same two points, and both sit in the middle of
the rating range. We already have direct evidence the coefficient is too
tight: at 630 kVA, a full joint search over volts per turn, flux density
and current density together cannot bring no-load loss under the ceiling
the 4.6 coefficient implies, at any point — including running flux at its
floor. That's not a theoretical extrapolation worry, it's a design that
cannot meet its own no-load figure at any setting we can find. We need
points further from the middle of the range to know whether the coefficient
itself is wrong, or whether 630 kVA is some kind of outlier.

**Why the engine can't infer it:** no-load loss depends on core grade,
flux density and a scaling exponent together; nothing in the formula lets
it predict how well a mid-range fit holds at very small or very large
ratings. It has to be checked, not derived.

## 2. One sheet at 33 kV class

Any rating.

**What it fixes:** how the LV-HV clearance (hilo) grows above 11 kV. The
clearance rule is currently fitted against 11 kV sheets only.

**Why the engine can't infer it:** clearance versus voltage class is a
staged, standard-driven table (BIL, insulation level), not a smooth
formula — the engine's clearance slope above 11 kV is a straight-line
extension of the 11 kV point, unconfirmed by any sheet at a higher class.

## 3. One sheet where the HV winding splits into parallel strands

Any rating high enough that a single conductor would be impractically
large for the HV winding.

**What it fixes:** the strand-count ceiling for HV (currently 37.6 mm²
per strand, unconfirmed). The equivalent LV ceiling was confirmed against
both existing sheets; HV wasn't, because neither of our two reference
designs actually needs more than one strand at their ratings.

**Why the engine can't infer it:** the strand ceiling is a manufacturing
limit (how large a single conductor the winding machine and terminations
can actually handle), not something derivable from electrical design —
it has to come from an actual built winding that hit the limit.

## 4. Bare or covered conductor weight, on every sheet including the two we already have

For any sheet supplied — this covers the 630 kVA and 1250 kVA sheets already
on file as well as any new ones above — please state whether the conductor
weights given are bare or covered, and give both where the sheet has them.

**What it fixes:** the engine has been outputting bare conductor mass and
comparing it against what look like covered weights in the reference
sheets, understating copper mass by roughly 4-5% in every comparison made
so far. Because this touches the 630 and 1250 kVA sheets we've already
calibrated against, it's worth resolving on those two as well as on
whatever comes in from items 1-3.

**Why the engine can't infer it:** bare versus covered isn't distinguishable
from the weight figure alone; it has to come from the sheet's own labelling
or from whoever prepared it.

## 5. HV conductor dimensions and strand count, for the two sheets we already have

**This is item 0 above, which now states what it blocks and why. The two
supersets are the same request -- item 0 is the one to act on; the
questions at the end of this item are additional detail on the same
winding and are still open.**

For both the 630 kVA and 1250 kVA references: HV conductor bare and covered
dimensions, number of parallel strands, and their arrangement as axial by
radial — the same information we already have for LV on both sheets, just
for HV.

**What it fixes:** we already have this for LV on both sheets, and it let us
find and fix a real defect in how the engine chooses axial vs radial strand
count — the old rule used a fixed ratio that couldn't respond to how much
current a turn carries, when a real winding puts more strands radially as
current rises. HV is built the same way in the engine (`axHV`/`rdHV` from a
fixed 2.1 ratio) and is the leading suspect for the same defect, but we have
no HV strand data on either sheet to check it against — everything we tried
came back to a number the sheets don't actually state for either reference.

**Why the engine can't infer it:** this is exactly the LV situation before
these two sheets gave us real numbers to check against — a manufacturing
arrangement choice, not something derivable from the electrical design alone.

**Two specific, related questions on this same winding, not yet answered:**

- **Is the 630 kVA HV winding built from two parallel conductors?** The
  sheet states approximately 3.15 x 1.50 mm bare, 4.65 mm² as a single
  conductor, which at 19.1 A phase current is 4.1 A/mm² — implausibly high.
  The sheet's own stated HV copper mass, 323.64 kg, and its turns are
  consistent with two parallel conductors at roughly 6.5 mm² each, not one
  at 4.65 mm². If it is two parallel, please give the real individual
  conductor dimensions rather than the combined figure.

- **Does each parallel HV strand carry its own full covering, or a lighter
  shared covering between strands?** This only matters once a winding
  actually has more than one HV strand (the two sheets on file do not, at
  their ratings), so it cannot be checked against either reference — it
  first becomes a real question at the rating in question 1 above, and at
  5000 kVA and up generally, where the engine's own multi-strand HV split
  now applies (CALIBRATION.md section 41). The engine currently assumes
  full individual covering per strand, copied from the equivalent LV
  convention for lack of anything HV-specific to check it against — flagged
  as an assumption, not confirmed. A sheet with any multi-strand HV winding,
  at any rating, and its covered-conductor build-up would close this.

## 6. Tank internal length, width and height, and oil quantity, for any sheet — especially one at or below 630 kVA

For any sheet supplied, including the 630 kVA and 1250 kVA sheets already
on file if the tank drawing is at hand: tank **internal** length, width and
height, and the oil quantity. A rating at or below 630 kVA matters most —
we currently have no reproducible outer-envelope data at any small rating.

**What it fixes:** two independent things point the same way without
confirming each other. First, the engine's own oil-litres-per-kVA and
tank-mass-per-kVA figures run far higher at the small end of the range
(100 kVA) than the large end (5000 kVA) — expected in shape (tank surface
grows slower than kVA), but we have no small-rating sheet to check the
size of that curve against. Second, a cost card for a 630 kVA radiator
unit gives 588 L of oil; the engine's own generic design at that rating
computes 999 L, 70% more — but that cost card has no volts-per-turn or
step count behind it, so there is nothing to build a matching design from
and the gap could be the engine's or could be that one card's own
unrepresentative job. Checking the 1250 kVA reference's real tank
(1660 x 665 x 1175, already on file) found the tank is close by volume
(+3.6%) but the wrong shape (11% too tall, 5.8% too narrow) — the width
error traces to a clearance term (hvTankClr) that was never checked
against these sheets the way the LV-HV clearance was, but the height
error does not trace to anything we can currently identify, and 1250 kVA
is mid-range, not the small end where the other two signals live. A real
small-rating tank is the one piece of data that would show whether the
same height fault (or a different one) shows up down there too, rather
than us continuing to reason about it from a rating where it might not
even be the dominant effect.

**Why the engine can't infer it:** tank sizing is clearances and fitted
constants stacked on the winding geometry, not something the loss or
turns data already on file can check — it has to come from an actual
tank drawing or cost sheet that states the fabricated size.

---

If only some of these are available right now, send what you have — each
closes a separate, independent gap, so partial data is still useful.
