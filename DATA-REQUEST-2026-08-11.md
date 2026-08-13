# Data needed to close the remaining engine gaps

We've now calibrated the engine against the 630 kVA and 1250 kVA sheets
(load loss schedule, material rates). Three gaps are left that only more
real sheet data can close — none of them can be worked out from what we
already have. All of it should already exist on sheets you've issued;
nothing here needs a new calculation or a new test build.

For every item below, please pull: **volts per turn, core diameter, number
of core steps, LV turns, HV turns, conductor arrangement (axial x radial,
and layers), and the hilo (LV-HV clearance).**

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
