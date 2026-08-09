# Parametric solver specification

Goal: the engineer edits any parameter and the design regenerates, consistently.

The difficulty is that most of the parameters on the wish list are **outputs**,
not inputs. Setting an output means back-solving for an input, and there is
rarely exactly one input that could have produced it. A system that silently
picks one is not parametric; it is unpredictable. This document defines how each
parameter is handled so that behaviour is always explainable.

---

## 1. Four classes of parameter

Every editable parameter belongs to exactly one class. The UI must show which.

### Class A — Direct inputs
Set the value, the engine runs forward. No solving.

Flux density, current density (LV and HV), core material, core construction,
conductor material, clearances, insulation levels, tap range and step, ambient,
reference temperature, stray loss allowance, all rates and economics.

### Class B — Solved on one lever
The parameter is an output, but exactly one input moves it monotonically, so it
can be hit exactly by bisection — the same technique already used for impedance.
The user sees which lever moved and by how much.

| Target | Lever | Relationship |
|---|---|---|
| No-load loss | flux density | P₀ ∝ B^0.9 (core weight rises as B falls, partly offsetting) |
| Load loss | current density, both windings scaled together | Pc ∝ J |
| Core diameter | volts per turn constant K | d ∝ √(Et/B), Et = K√S |
| Number of LV turns | volts per turn constant K | N = round(V/Et), integer target, exact |
| Conductor size | current density | a = I/J, so setting a sets J |
| Impedance | window height | already implemented |
| Temperature rise | cooling surface | already implemented |
| Radiator or fin area | top-oil rise target | inverse of the above |

### Class C — Searches, not solves
The target is reachable by many combinations. There is no single correct answer,
so the engine must **offer options and let the engineer choose**, exactly as the
budget search already does.

Efficiency, total losses, overall weight, target manufacturing cost, maximum
tank dimensions for transport.

Reuse `searchDesigns`. Rank by cost of ownership. Present at least three
distinct options with their trade-offs. Never auto-apply one.

### Class D — Derived only
Cannot be set, only influenced. Attempting to edit shows what to change instead.

| Parameter | Why | Edit this instead |
|---|---|---|
| Window width | It is the built radial stack plus clearances | conductor sizes, clearances, layers |
| Tank dimensions | Follow core, coils and clearances | clearances, cooling type, core diameter |
| Oil quantity | Tank volume minus active part | tank size drivers above |
| Core weight | Geometry times density | flux density, K, steps |
| Any mass | Geometry times density | the geometry driver |

Say this plainly in the UI. A greyed field with "derived from X — edit X" is
honest. A field that accepts a number and quietly ignores it is not.

---

## 2. Pinning, and how conflicts are resolved

Class B targets compete for levers, and the design has finite degrees of
freedom. Setting impedance and window height simultaneously is over-determined:
impedance is solved *by* window height.

Rules:

1. Any parameter the user sets becomes **pinned**. Pinned values are never
   changed by the solver.
2. Before solving, check whether the requested pin conflicts with an existing
   pin over the same lever. If it does, **ask** which to release. Do not guess.
3. Show the pin set permanently in the UI. The engineer must be able to see at a
   glance which values are fixed and which are free.

Known conflicts to detect:

| Pinning both of these | Conflict | Resolution offered |
|---|---|---|
| Impedance and window height | Same lever | Release one |
| No-load loss and flux density | Same lever | Release one, or change core grade |
| Load loss and current density | Same lever | Release one, or change conductor material |
| Core diameter and LV turns | Both solve through K | Release one, or change flux density |
| Efficiency and both loss figures | Over-determined | Efficiency follows; release it |

---

## 3. Solver behaviour

For every Class B solve:

- Bisection on the lever, 44 iterations, over the lever's declared valid range.
- **Verify monotonicity first** by evaluating both bounds. If the target lies
  outside the range spanned by them, do not clamp silently. Report: "No-load
  loss of 800 W is not reachable with M4 steel between 1.20 and 1.73 T. The
  closest is 1,043 W at 1.20 T. Change to a lower-loss grade to go further."
- Respect the physical floors already in the engine, in particular the 1.42 T
  flux floor below which the core gains weight faster than it loses loss.
- After solving, run the full forward calculation and revalidate compliance.
  A solve that hits its target but breaks temperature rise is a failure, and
  must be reported as one.

---

## 4. Design Impact Summary

Shown after every change. `impacts()` in the engine already produces most of
this; extend rather than replace it.

For each change:
- Parameter edited, from → to
- Lever moved by the solver, from → to, and why that lever
- Every dependent parameter that moved, from → to
- Cost impact: ex-works and delivered, in rupees and percent
- Weight impact: core, conductor, total
- Loss impact: no-load, load, and the twenty-year energy cost of the difference
- Efficiency impact at full and half load
- Compliance: every check that changed state, and the overall verdict
- A plain-language note on what it means on the shop floor and in service

**Unchanged parameters must not appear.** The summary is for reading the
consequences of one decision, not a diff of the whole design.

---

## 5. What regenerates, and when

On any change, in this order:

1. Solve (Class B) or search (Class C)
2. Full forward calculation: electrical, magnetic, geometry, thermal
3. Compliance revalidation against the selected standard
4. Weights and material quantities
5. BOM and cost build-up including GST and margin
6. 2D drawings, 3D model, calculation sheet, document register

Steps 2 to 6 are already pure functions of the parameter set, so they follow
automatically. Do not cache derived values anywhere. If a number is stored, it
can go stale; if it is derived, it cannot.

Performance: the forward calculation is roughly a millisecond, a solve about
fifty. Both are fine synchronously. A Class C search evaluates hundreds of
designs and must run off the main thread with a progress indicator.

---

## 6. Implementation order

1. Pin registry: which parameters are pinned, which lever each owns, conflict
   detection. No solving yet.
2. Class D handling: mark derived parameters read-only with the "edit this
   instead" message. Cheap, and removes the largest source of false expectation.
3. Class B solver: generic bisection taking a target, a lever, a range and a
   forward evaluator. One function serves every row in the table above.
4. Design Impact Summary, extending `impacts()`.
5. Class C searches, reusing `searchDesigns`, presented as options.

Do not begin with Class C. It is the most impressive and the least trustworthy
until the pin system underneath it is sound.
