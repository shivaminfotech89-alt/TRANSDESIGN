# Drawing register

Twenty-two drawings, all generated from the calculated design. Every one carries
dimension lines on the drawing itself, not only in a table beside it. A drawing
without dimension lines is a picture and cannot be submitted -- drawing 22 is the
one exception, and says why where it's described.

Numbering 1 to 20 follows the master specification section 18. Drawing 21 is an
addition: the core shop cannot cut laminations without it. Drawing 22 is a second
addition, for the same reason: a real core cutting chart is a different document
from drawing 21's cutting schedule, not a restyling of it, and the shop needs both.

---

## Universal requirements

**Dimension lines.** Two extension lines, a dimension line with arrow
terminators at both ends, the value in monospace centred on it. Vertical
dimensions rotate their text ninety degrees. Diameters carry the diameter
symbol, radii an R prefix.

**Units.** Millimetres throughout, whole numbers except radial builds, foil
thickness and insulation which take one or two decimals. State "all dimensions
in mm" once per sheet.

**Projection.** First angle for IS, IEC, CBIP, SANS and GOST. Third angle for
ANSI and IEEE. Draw the projection symbol in the title block and switch it with
the selected standard: this is not cosmetic, a drawing read in the wrong
projection is read back to front.

**Title block.** Every sheet carries: drawing number, revision, sheet number of
total, scale, projection symbol, project name, customer, transformer rating and
voltage ratio, material where the sheet describes one part, part number where
applicable, designer, checker, approval status, and the date.

Designer, checker and approval status come from the approval workflow. Until
that exists, render the field labels with a blank rule to be signed, never a
placeholder name. An unsigned drawing is honest; an invented approver is not.

**Part numbers.** Format `{docPrefix}-{group}-{sequence}`, matching the numbers
the 3D inspection panel reports. The same physical part carries the same number
in the drawing, the 3D model, the BOM and the report.

**Tolerances.** The engine holds no dimensional tolerances. Show tolerances only
where a standard defines them and the design has been checked against them:
ratio error, impedance, losses, temperature rise. For manufacturing dimensions
print "tolerances per works standard, to be added" rather than inventing values.

**Scaling.** Fit model extents to the viewBox with a margin, computed from
geometry. No hardcoded scale factors.

**Colour.** Linework `ink`. Core grey-green, LV winding copper, HV winding
darker copper, insulation pale board, tank steel. Centre lines `copper` dash-dot,
hidden detail dashed, dimension lines `ink` (DESIGN.md, "Drawing linework" --
this was `ink2` and read as a caption, not a dimension; still lighter in
*weight* than a part outline, not colour).

---

## The orthographic set: drawings 1 to 5

These five share one geometry model and differ only in viewing direction. Build
one component with a view parameter, not five components.

### 1. General Arrangement
Front elevation of the complete unit, fully annotated. Ground line, base
channel, tank, fins or radiator banks, cover, three HV bushings labelled 1U 1V
1W, four LV bushings labelled 2u 2v 2w 2n, conservator where the tank type calls
for one, breather, pressure relief device, cable box, marshalling box, lifting
lugs, rating plate.
Dimension: overall height including bushings, tank height, base channel height,
overall length, bushing centres.
Note: fin count and depth or radiator bank count, cooling surface, bushing
voltage classes, total mass, fluid volume.

### 2. Front view
The same elevation stripped to outline and overall dimensions only. Overall
length, overall height, tank height, base height.

### 3. Side view
Viewed along the limb row. Tank width, overall width including fin or radiator
projection, overall height, base channel positions.

### 4. Top view
Cover plan. Tank outline, cover, bushing positions, fittings footprint, lifting
lug positions.
Dimension: tank length and width, bushing centres in both directions, lug
centres.

### 5. Bottom and foundation view
Underside plan. Base channel positions and spacing, drain valve pad, jacking
pad positions.
Dimension: base channel centres, overall footprint, plinth extent.
Note: foundation bolt positions are derived from the base channel geometry and
must be confirmed against the civil drawing. Mark this on the sheet.

---

## Core: drawings 6, 7 and 21

### 6. Core drawing
Front view of the three-limb core. Two yokes, three limbs, centre lines.
Dimension: limb width, limb centre distance C, window height, window width,
yoke depth, overall core width and height.
Note: construction, number of steps, grade, net and gross core area, core mass.

### 7. Stepped core drawing
Cross-section through one limb. Circumscribing circle dashed in `copper`, every
pocket drawn as a rectangle, widest at the stack centre, mirrored.
Dimension: core circle diameter, and the width of each pocket.
Beside it: pocket number, width, stack per side. Foot: utilisation factor.

### 21. Lamination stamping and cutting schedule
Construction A (master mitre cut): limb lamination as a trapezoid with forty
five degree mitres both ends, cut lines dashed. Yoke lamination with mitred
ends and centre limb V notch. Dimension on both: outer edge, inner edge,
width.
Beneath: cutting schedule of pocket, width, stack, sheet count, limb sheet long
and short edge, yoke sheet long and short edge, mass. Foot: total sheets and
mass.

Construction B (V-notch cut): three plate shapes, cut lines dashed, drawn
from the widest pocket -- the other pockets are the same shapes at the widths
the schedule table below already lists.
- V-notch plate (yoke): trapezoid mitred forty five degrees both ends, V notch
  cut into the inner edge at the centre for the centre limb. Real geometry,
  not schematic: depth W/2 (W is that pocket's own plate width), flanks at
  45 and 135 degrees, apex centred on the plate's inner edge.
- Outer plate (outer limb): trapezoid mitred forty five degrees both ends, no
  notch.
- Centre plate (centre limb): hexagonal, pointed at both ends with a chevron
  apex derived from the same depth-W/2, 45/135-degree geometry as the V-notch
  above, so the two mate by construction rather than by two independently
  chosen proportions.
Dimension all three: outer edge, inner edge (Construction A's plain-mitre
inner edge for V-notch/outer; the centre plate's own flat run, cOuter minus
one W/2 protrusion at each end, for centre -- that shape is a chevron, not a
plain-mitred trapezoid, so it is not the same figure engine.js's own
`innerEdge` field reports for it), width, notch depth (W/2), and the notch's
own 45/135 degree flank angles.
Beneath: the same V/outer/centre cutting schedule table Construction B
already had.

Construction C (diamond cut): two plate shapes, cut lines dashed, drawn from
the widest pocket, same convention as A and B above.
- Limb plate (three limbs): plain rectangle, no taper -- flat ninety degree
  cuts, not mitred, so the length is the same across the plate's own full
  width rather than tapering from a long edge to a short one.
- Yoke plate (top and bottom): plain rectangle, likewise.
Dimension both: length, width. No chart on file for this construction --
the length is derived from Construction A's own already-validated mitre
relationship with the taper removed (CALIBRATION.md section 54), not fitted
or invented, and should be read as a rough sense of direction only until a
real diamond-cut chart exists to check it against.
Beneath: the limb/yoke cutting schedule table, structured the same way as
Construction A/B's own tables above it.

**Joint stacking, independent of which of A/B/C is drawn above.** Whether
successive layers' yoke joints are staggered by an offset or left
continuous is its own choice (CALIBRATION.md section 54), shown on both
drawing 21 and drawing 22 as its own field, separate from the plate
construction field -- selecting a different plate cutting pattern no longer
silently changes the stacking too, and vice versa. Construction A's own
real reference chart stages 25% of its yoke steel across a fixed 0/10/20 mm
split when staggered; Construction C stages every staggered layer at one
chosen offset (5/10/20 mm, the designer's own specification, not charted);
Construction B has no stacking data at all, staggered or continuous, and
the field has no effect on it. Staggering does not change the mass shown on
either drawing (confirmed directly for both real cases) -- it changes only
where a joint falls, not how much steel either plate needs. It is not
known whether staggering changes no-load loss, and neither drawing should
be read as implying it does not.

### 22. Core cutting chart
A different document from drawing 21, not the same numbers laid out twice.
For Construction A, where drawing 21 models two plate types (limb, yoke)
from a single mitred long/short edge average, this models three -- Plate A
(limb, mitred both ends), Plate B (half yoke, step-lap), Plate C (full
yoke, mitred one end) -- because that is the layout a real core chart
actually uses, and the two documents are not meant to reconcile line for
line (CALIBRATION.md section 12). For Construction B this renders the same
V-notch/outer/centre tables drawing 21 does (one shared model, section
35/47 -- the two documents agree exactly here, unlike Construction A's own
two). For Construction C this renders the limb/yoke tables drawing 21 does,
likewise one shared model (section 54).

Header line: no-load loss, rating, flux density, plate construction, joint
stacking. Then, for Construction A, three tables (Plate A/B/C), each row
giving step number, length, width and weight, each table footed with its
own total; a fourth table breaks Plate B's own sheet count down by its
step-lap shift (0, 10, 20 mm) when staggered, omitted when continuous
stacking is selected, since Plate B then carries no sheets. For
Construction B, three tables (V-notch/outer/centre); for Construction C,
two (limb/yoke), captioned with the selected stacking and offset. Foot of
the whole sheet, every construction: core total, the sum of all its own
plates.

No dimension-line SVG, the one exception to this document's own universal
requirement above: every dimension this chart carries is already a number in
its own table -- length, width, weight, per step, per plate -- and a
schematic outline would add a picture to numbers that are already complete
and unambiguous on their own, not supply a dimension the table lacks.

All three plate length formulas are fitted to the one 1250 kVA chart on file,
each against the simplest relationship that reproduced its own plate total
without an arbitrary offset, not the closest fit available:
- Plate A: length = 2 x width exactly.
- Plate C: length = 2*cc + width -- the engine's own existing yoke edge
  (drawing 21's `yokeLong`), with the one mitre this plate actually has.
- Plate B: the same steel Plate C's own formula gives for the same sheet
  count, split 25/75 with Plate C (confirmed against the chart's own
  263.822/788.84 kg split, 0.2506 against a stated 0.25), cut as two
  half-length pieces per layer instead of one -- mass-conserving by
  construction.

Confirmed against the one chart on file to within 5% on every plate and the
core total (reference-designs.test.mjs). Not confirmed at any other rating --
ask for a second chart before trusting any of the three formulas away from
ratings near 1250 kVA, the same caveat every other single-chart-fitted
constant in this engine already carries.

Lamination width snapping (both drawings 21 and 22): standard slit stock
comes in whole increments, not a continuous circle-packing optimum --
`stepWidths`'s own `increment` parameter (default 10 mm, editable via
`p.stepIncrement`) rounds every step width UP to the next multiple, never
down or to nearest, since a step narrower than its standard width would
under-fill the circle at that radius. Stack depth is untouched -- only
width is standardised, since that is a slitting-stock decision, independent
of how many laminations deep a step runs. Confirmed against the 1250 kVA
reference: the unsnapped optimum for its 15 steps ends at 42 mm: snapped, it
ends at 50 mm, matching the real chart's own last step exactly, and the
full snapped sequence (270, 270, 260, 250, 240, 220, 210, 200, 180, 160,
150, 130, 100, 80, 50) tracks the chart's own (270, 260, 250, 240, 230, 220,
210, 200, 180, 160, 140, 120, 100, 80, 50) closely without being fitted to
it point for point.

---

## Windings: drawings 8, 9, 10

### 8. LV winding drawing
Inner cylinder, winding block, end blocks, start and finish tabs. Below
`lvFoilMaxKva` (ENGINE_VERSION 1.6.0), a single conductor per turn, radial
lines mark each real layer, as before this section existed. Above it, LV
multi-layer strip construction: the turn's own cross-section is
`lvAxCount` x `lvRadCount` parallel conductors, and the radial lines mark
every one of `lvTurnLayers` x `lvRadCount` cells this produces, layer
boundaries drawn heavier so they stay visually distinct from the
parallel-conductor divisions within a layer. `lvAxCount` (conductors laid
side by side along the winding height) is not visible in this radial
cross-section, same as HV's own axially-stacked coil or disc count isn't
shown here either — stated in the schedule instead.
Dimension: winding height, radial build, end block height, cylinder thickness,
inside and outside diameter.
Schedule: conductor and form, section (one conductor), area (one turn), turns
per phase, parallel conductors and their axial-by-radial arrangement (strip
construction only), radial layers, interturn insulation, mean turn, current,
current density, resistance at the reference temperature, mass for three
phases.

### 9. HV winding drawing
LV to HV gap, then the HV winding drawn as its actual construction
(MANUFACTURING.md section 5, ENGINE_VERSION 1.5.0): a single continuous
layer with every layer drawn separately and cooling ducts among them, as
before, for layer construction; crossover coils stacked axially, each with
its own internal layer divisions; or discs stacked axially with gaps
between them, one turn deep each. Construction, group count and layers
per group are read straight from the engine's own output
(`design.hvConstruction`/`numGroups`/`layers`), never decided by the
drawing. At a high group count (a disc winding routinely has several
dozen) a legible subset is drawn, same technique as drawing 14's radiator
panels, with a break mark between non-adjacent drawn groups; group count
and every dimension in the schedule are always the complete figures.
End blocks unchanged for all three constructions.
Dimension: winding height, radial build, gap to LV, inside and outside diameter.
Schedule: conductor, section, area, turns at normal and extreme tap,
construction, group count, layers times turns per layer, volts per layer,
interlayer insulation, duct count and width, mean turn, current, current
density, resistance, mass.

### 10. Tap winding drawing
For layer HV construction, the tapped section drawn schematically as
before -- a manufacturing layout choice, not a calculated quantity, so the
take-off position from the coil end still prints "to be specified."

For crossover and disc HV, each tap lead is drawn coming off the actual
coil or disc its turns-in-circuit falls within, found by walking the
winding schedule's own per-group turns -- the same group layout drawing 9
draws, so the two cannot disagree on where a group physically sits. The
regulating section (MANUFACTURING.md section 1) is shaded across the real
groups it spans, not a schematic band. Only tap positions landing in the
drawing's legible subset get a lead line; the table beside it is always
complete.

Dimension: winding height, radial build, gap to LV, inside and outside
diameter (from drawing 9's own layout); tap section height and take-off
position print "to be specified" only for layer construction.
Beside it, the tap table: position number, percentage, HV turns in circuit,
voltage at that tap, the resulting volts per turn, and (crossover/disc only)
which coil or disc that position comes off. All of this is computed: turns
per step and tap positions come from the engine.
Note: tap changer type, number of positions, step percentage, and
(crossover/disc only) the regulating section's turn count and group range.

---

## Insulation, assembly and internals: drawings 11, 12, 20

### 11. Insulation drawing
Radial section showing every insulating element between the core and the tank
wall: core to LV cylinder, LV to HV barrier, phase barriers, end insulation.
Dimension: every clearance and every cylinder thickness, plus the creepage path
along the end insulation.
Note: the impulse and AC withstand levels the clearances were derived from.
Mark clearly: material grades for pressboard, DDP and Nomex, end ring and
spacer detail, and creepage from the bushing catalogue are not held by the
engine. Print the fields with "to be specified" rather than filling them.

### 12. Internal assembly drawing
Transverse section through the tank on the centre line of one limb. Tank walls,
fluid level, core limb, LV and HV coils, top and bottom clamping frames, tie
rods, HV lead routed to the bushing.
Dimension: tank inside width and height, HV to tank wall, bottom clearance, top
fluid space, clamping frame depth.

### 20. Cross-sectional drawings
Two sheets sharing the section machinery.
**Longitudinal:** section along the limb row, all three phases visible.
**Transverse:** as drawing 12.
Both carry the coil half-section detail: centre line, half core limb, LV coil,
LV to HV gap, HV coil, yokes, with every radial clearance and every axial height
dimensioned. This is the drawing a design engineer reads to check clearances,
so it must be complete.

---

## Tank and cooling: drawings 13 and 14

### 13. Tank fabrication drawing
Tank plan and elevation with the fabrication detail: plate thicknesses,
stiffener positions, flange faces, valve and fitting positions, base frame.
Dimension: inside length, width and height, plate thickness, stiffener centres,
fitting positions.
Note: plate cutting list and weld symbols are not generated. Mark the sheet
"cutting list and welding detail to be added by the fabrication shop" rather
than leaving a reader to assume they are complete.

### 14. Radiator or fin drawing
For a fin tank: fin profile, depth, height, pitch, count, and the fin wall
extent along each side.
For radiators: bank position, panel count, panel size, header connection
centres and valve positions.
Dimension: fin depth and height, pitch, or panel dimensions and connection
centres.
Note: cooling surface required against surface provided, and the top-oil rise
the design was sized to. Header pipe sizes come from a vendor catalogue and are
marked as such.

---

## Layout drawings: 15, 16, 17

### 15. Bushing layout
Cover plan with all bushings positioned and labelled, phase to phase spacing,
phase to earth clearance in air, terminal marking per the vector group.
Dimension: bushing centres, spacing, creepage distance and arcing horn gap where
specified.
Note: bushing type and voltage class. Catalogue dimensions come from the vendor
and are marked as such.

### 16. Accessory layout
Cover and tank elevation with every fitting positioned: Buchholz where the tank
type has a conservator, PRD, OTI, WTI, breather, MOG, valves, earthing pads,
marshalling box, cable box, rating plate.
Note: positions are indicative until the accessory standard is configured. Say
so on the sheet.

### 17. Lead arrangement
Routing of HV leads from coil to bushing, LV leads from coil to LV bushings,
neutral lead, and tap leads to the tap changer.
Dimension: lead lengths, clearance from each lead to the tank wall and to the
core, and lead to lead spacing.
Note: lead cross-section sized on the same current density as its winding.

---

## Documentation drawings: 18 and 19

### 18. Nameplate drawing
The engraved plate to scale, with every value required by the selected standard.
Already generated in the Documents tab: reuse that component, do not build a
second.

### 19. Exploded assembly drawing
Two dimensional exploded view along the vertical axis: tank, cover, core and
coil assembly, LV winding, HV winding, insulation, radiators, bushings,
accessories. Leader lines to a numbered balloon on each part, and a parts list
keyed to the balloons giving part number, name, material, quantity and mass.
This is the 2D counterpart of the 3D exploded view and reads from the same part
records.

---

## Where each drawing appears

- **2D Drawings tab:** all twenty-one in order, then the dimension schedule and
  the cutting schedule.
- **Core tab:** drawings 6, 7 and 21 beneath the calculation cards.
- **Winding tab:** drawings 8, 9, 10 and the coil half-section from 20.
- **Documents tab:** drawing 18.

One component per drawing, reused. Never a second copy.

---

## Export

SVG and PNG from the rendered drawing directly. PDF through the report
pipeline. DXF requires a converter in a Cloud Function: until it exists, label
the control "DXF, backend required" rather than offering a button that fails.

---

## One core mass, three places it is computed -- now the same formula

This note went through two wrong states before landing here, both worth
knowing about since the same mistake (declaring a gap "acceptable" instead
of checking what was behind it) is exactly what let the first one stand for
as long as it did.

**Originally:** drawing 21's own cutting schedule mass exceeded `wCore` by
roughly three per cent, filed as "the schedule integrates real mitred
trapezoids, the loss calculation uses mean lengths, do not force either to
match the other." Both figures were built on the *same* Hw-based limb
shortcut at the time (`wCore`'s own limb term was `aGross x 3 x Hw`; drawing
21's own long/short mitred average reduces to the same idea) -- the three
per cent was two near-identical approximations differing only in rounding,
not two independently-reasoned figures that happened to agree.

**CALIBRATION.md section 15 (ENGINE_VERSION 1.11.0):** checked against a
real cut plate (drawing 22, section 12), that shared shortcut turned out to
overstate the limb by exactly the amount section 14 had already found as an
unexplained "25% heavy" core mass gap. `wCore`'s limb term was rebuilt on
drawing 22's own Plate A formula (mitred both ends, length = 2 x width, per
step, off the real snapped widths). Drawing 21 was left alone for one
commit -- which meant it now diverged from `wCore` by 14-16% instead of
three, since the shortcut the two used to share had been removed from only
one of them.

**CALIBRATION.md section 16 (same version): fixed properly, not left as a
second "acceptable" gap.** Drawing 21's own limb edges are now derived the
same way `wCore`'s are -- the same 2w average Plate A already validated,
combined with the 45 degree both-ends mitre relationship (long - short = 2w,
geometry, not a fit) to get the long and short edges separately: short = w,
long = 3w. Rebuilding the limb alone exposed a second, independent gap that
had been sitting underneath it the whole time: drawing 21's yoke average
(`2C`, C = limb centre distance) was missing the `+dCore` term `wCore`'s own
yoke span always carried -- 18.7% short on its own, invisible before only
because the limb's own overstatement (+18.5%) was landing the *combined*
total close to `wCore`'s old, also-inflated figure. Fixed the same way:
`2C + dCore + w` / `2C + dCore - w`, average `2C + dCore`, matching `wCore`'s
yoke term, same mitre relationship preserved.

**Verified again directly** (all four of `design.wCore`, the BOM's own
core line, drawing 21 and drawing 22, side by side on the 1250 kVA
reference): `wCore`, the BOM line and drawing 22 agree to within 0.03%;
drawing 21 sits 2.00% above them, exactly the residual described below,
not a regression. `stepIncrement` snapping confirmed reaching
`stepWidths` at the same time -- the narrowest step lands on the chart's
own 50 mm, not the unsnapped continuous ideal near 42 mm.

**Basis is now printed on both sheets, not only here.** A shop reading
drawing 21 and drawing 22 together, seeing their totals differ by about
two per cent, has no way to know from the sheets alone whether that is
expected or an error -- this note lived only in the source repository,
not on either drawing. Both now state their own basis directly: drawing
21 says its mass is from the continuous stack depth per step, for
estimating; drawing 22 says its mass is from whole sheet counts, the
physical quantity to order steel against. Order against drawing 22.

**All three -- `wCore`, drawing 21, drawing 22 -- now derive limb and yoke
from the same two edge-length formulas**, checked directly against each
other, not just against the one real reference chart (`reference-designs.test.mjs`,
"Cutting schedule vs wCore"). A few per cent residual remains, and is left
alone deliberately: drawing 21 reports mass off the continuous stack depth,
`wCore` and drawing 22 off a rounded whole sheet count -- real integer
sheets, not a formula disagreement. Two documents in this tool disagreeing
by double digits meant a shop could be quoted two different steel weights
for the same core; a few per cent from counting whole sheets is not that.
