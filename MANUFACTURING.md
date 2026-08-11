# Manufacturing pack

The engine computes masses. A winder cannot wind from a mass in kilograms. This
specifies the piece-part layer that turns a design into something a shop can
build from, taken from the structure of two real working design sheets.

Each section marks what is derivable from the engine today, what needs new
engine capability first, and what is company practice that must be entered
rather than calculated.

---

## 1. Tapping schedule — derivable now

The most immediately useful item, and fully computable.

Real practice states taps as **turn numbers along the winding**, not as
percentages alone. The 1250 kVA sheet reads: 0, 258 break, 265, 272, 279, 286,
293, 300, 307, 314, 321, 328, 335, 342, 349, 356, 363, 370, 628 finish.

Generate a table with, for each tap position: position number, percentage, turn
number at which the tap is taken, HV turns in circuit, voltage at that tap, and
the resulting volts per turn.

Two rules from the sheets:

- **Whole turns.** Steps must be whole numbers of turns. The 1250 kVA uses
  exactly 7 turns per step, 16 steps of 7 giving 112 turns. Round the step and
  show the rounding error in the volts per turn column rather than hiding it.
- **The tapped section sits in the middle of the winding.** 258 to 370 out of
  628 on the 1250 kVA; "from two middle coils" on the 630 kVA. This balances
  ampere turns and limits axial short circuit force. Report the section start
  and finish turn, and the turns either side of it.

## 2. Conductor and covering schedule — derivable now

For each winding: bare conductor size, covered size, covering material and
thickness, number of conductors in parallel and their arrangement as axial by
radial, and whether transposition is required.

The sheets give this as "10.75 x 3.5 ) 8" with "4A x 2R" beneath, meaning eight
conductors in four axial by two radial. Follow that convention: your people
already read it.

Transposition rule: required whenever more than two conductors sit in parallel
radially. The 1250 kVA notes "Transposition 1 No, very important on both
layers".

## 3. Hardware schedule — derivable now

Count and size from the calculated geometry, never from a fixed list:

- Tie rods: diameter, length, quantity, thread length both ends, material
- Core bolts: same
- Foot plates: size, quantity
- Core clamp channel: section, length, hole positions
- Lifting lugs and pulling lugs: plate thickness, quantity
- Neutral busbar: cross-section from LV current, at the LV winding's own
  current density
- Delta wire: section and covering

The 1250 kVA sheet gives 18 mm diameter tie rods 635 mm long with 55 mm thread
both ends, 8 off, stainless throughout; core bolts 18 x 380, 8 off; foot plates
100 x 15 MS flat, 3 off; neutral busbar minimum 1500 mm², 100 x 15 copper.

## 4. Insulation piece list — partly derivable

Every insulating item as a count of pieces with material and thickness, not as a
mass. From the sheets:

| Item | Material | Quantity | Thickness |
|---|---|---|---|
| Yoke insulation | PCPB | 6 | 3.0 mm |
| Phase barrier | PCPB | 4 | 3.0 mm |
| Foot plate insulation | PCPB | 3 | 3.0 mm |
| Core clamp insulation | PCPB | 4 | 3.0 mm |
| HT spacers | PCPB | 3500 | 1.5 mm |
| Common blocks | PCPB | 72 | 8.0 mm |
| CEEDEE blocks | Permawood | 12 | — |
| Oil ducts | — | 36 and 72 | 3 and 5 mm |
| Dovetail strips | — | 36 | 3 + 2 mm |

Yoke insulation, phase barriers, foot plate and clamp insulation and the
cylinders are derivable from the core and coil geometry now. Spacer and block
counts depend on the axial design in section 6 and must wait for it.

Where a count is not yet derivable, print the row with the material and
thickness and mark the quantity "to be specified". Do not estimate it.

## 5. Winding schedule — needs engine capability first

Both designs use multi-coil HV windings, which the engine does not model.

- 1250 kVA: disc wound, 6 discs at 13 turns, 12 at 15, 8 at 14 in the
  transposition zone, 12 at 15, 6 at 13, totalling 628.
- 630 kVA: 6 crossover coils of 123 turns each, 13 layers of 10 turns.

The engine currently models HV as one continuous layer winding over the full
window height. That is right for small ratings and wrong above roughly 500 kVA,
and it changes both the radial build and the axial height.

**Add multi-coil HV winding to the engine before building this section.**
Support layer, crossover and disc construction, selected by rating and voltage
class, with the number of coils or discs and the turns in each as engine
outputs. Then the winding schedule is a direct print of those outputs.

Until it exists, show the section with a plain statement that it requires
multi-coil winding support, not a fabricated distribution.

## 6. Axial spacer and gap schedule — needs engine capability first

The 1250 kVA specifies every axial gap: 2 gaps of 3.0 mm, 16 of 1.5 mm, one of
7.5 mm at the tap break, 7 of 4.5 mm, 15 of 1.5 mm, 2 of 3.0 mm, summing to
97.5 mm within a 505 mm coil.

The engine uses a flat end block allowance and has no axial insulation design.
This section needs that capability, and it depends on section 5, since the gaps
sit between discs or coils.

## 7. Cooling arrangement — derivable now, one gap

Fin or radiator count, size and position per side. The 1250 kVA has **2
radiators on the LV side and 4 on the HV side**, fins 520 x 800, 9 fins per
radiator. The engine currently distributes cooling symmetrically. Add a per side
split, since the fitting layout on the LV side leaves less room.

## 8. Shop notes — company practice, must be entered

These are standing instructions, not calculations, and they vary by works.
Store them as an editable library at organisation level and let a design select
which apply. Never generate them.

Examples from the sheets, which show the character of what is wanted:

- Use only EC grade copper. Very important.
- LT covering should not be less than 0.44 to 0.45 mm imported paper.
- HT covering should be 0.34 to 0.35 mm TPC imported.
- Pie shape phanti should not be less than 75 x 8 mm thick.
- The core shall be earthed through a tinned copper earthing plate bolted on
  the core frame channels.
- MS steel plate on all LV cuts, very important.
- Complete stainless steel tie rods to be used.

Seed the library with these, marked as examples to be reviewed, and let the
user edit, add and remove. A note that came from a sheet is the works' own
instruction and must remain under their control.

---

## Where it appears

A **Manufacturing** tab beside Documents, and a section in the PDF package. Each
schedule is also a printable sheet on its own, since the winding shop, the core
shop and the tank shop each want only their own part.

## Build order

1. Tapping schedule, conductor and covering schedule, hardware schedule.
   All derivable now, and the tapping schedule alone is worth having.
2. Insulation piece list, with the counts that depend on axial design left
   marked as pending.
3. Cooling arrangement with the per side split.
4. Shop notes library.
5. Multi-coil HV winding in the engine, then the winding schedule.
6. Axial insulation design in the engine, then the spacer schedule.

Steps 5 and 6 are engine work and will move the golden numbers. Treat them as
their own phase with a version bump, not as part of the manufacturing pack.
