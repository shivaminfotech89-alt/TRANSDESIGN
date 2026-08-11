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

---

If only some of these are available right now, send what you have — each
closes a separate, independent gap, so partial data is still useful.
