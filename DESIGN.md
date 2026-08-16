# Visual specification

The interface is meant to read as a piece of engineering equipment, not a SaaS
dashboard: a drawing sheet with an engraved nameplate on it. Every choice below
is deliberate. Do not substitute a generic component library.

## Palette

Use these as CSS variables or inline styles. Tailwind's default palette does not
contain them.

```
sheet      #E4E8E3   page background, pale grey-green drawing sheet
sheetAlt   #DAE0DA   card headers, table header rows
line       #C1CAC3   hairlines, dashed row separators, grid paper
rule       #AEB9B1   card and input borders
ink        #13232E   primary text, drawing linework
ink2       #43565F   secondary text, labels
copper     #9C5A2B   primary accent: section headings, key figures, buttons
copperLt   #C57E45   copper on dark backgrounds
patina     #1D6B5E   secondary accent: save, confirm, "back to suggested"
steel      #78888D   tertiary text, units, hints
alert      #A33C25   failed checks, destructive actions
good       #2E6B4F   passed checks
amber      #8A6A1E   overridden values (SET badge), preview banner
plate      #1B2A32   nameplate background, active tab
plateTx    #DDE3DC   text on plate
plateEtch  #8FA0A6   etched labels on plate
```

## Typography

Three stacks, no web fonts:

```
display  'Arial Narrow','Helvetica Neue Condensed','Franklin Gothic Medium',Impact,sans-serif
mono     ui-monospace,'SF Mono',Menlo,Consolas,monospace
body     system-ui,-apple-system,'Segoe UI',Roboto,sans-serif
```

- **Display** for all headings, labels, buttons and tabs. Always uppercase with
  wide letter-spacing (0.14em to 0.24em). This gives the engraved nameplate feel.
- **Mono** for every number without exception. Prices, dimensions, losses,
  document numbers, part numbers. Right-aligned in tables.
- **Body** for prose only: explanations, notes, reason text.

Base font size is small. Labels 11px, table data 11px, notes 10px, section
headings 11px uppercase. The interface is dense on purpose: an engineer wants
the whole design sheet visible without scrolling.

## Drawing linework

The 2D drawings (DRAWINGS.md) are a different reading distance from the rest
of the interface -- printed, or read at arm's length on screen, not scanned
in a dense table -- so they carry their own three-tier weight, heaviest to
lightest, and none of the three is allowed to collapse into another:

```
part outlines        ink, 1.5-2.1 stroke   the plate, coil, tank and core
                                            shapes themselves -- solid,
                                            unmistakably the object drawn
dimension lines       ink, 0.75-0.9 stroke  extension lines, the dimension
  and value                                 line, arrow terminators, and the
                       ink, 8px mono bold    value sitting on it -- dark and
                                             legible as a measurement, but
                                             visibly lighter in WEIGHT than
                                             the outline it measures
notes and captions    ink2 or steel,        "to be specified", part labels,
                       5-6px                schematic caveats -- deliberately
                                             the quietest element on the sheet
```

Dimension text and lines were `ink2` at 5-6.5px until this section -- pale
enough, and small enough, to read as a caption rather than a dimension,
especially printed. Fixed by moving the VALUE and every line that carries it
(extension lines, the dimension line, arrow terminators) to `ink` -- the same
colour as the part outline it measures, not a paler one -- at a visibly
larger 8px, semibold. The outline itself moved too, roughly 1.5x its old
stroke width across the board (0.4 to 0.6, 0.6 to 0.9, 0.8 to 1.2, 1.0 to
1.5, 1.2 to 1.8, 1.4 to 2.1) so it still reads as heavier than the dimension
line measuring it -- colour alone stopped doing that job once dimension lines
also went to `ink`, so weight now carries the hierarchy instead. Notes and
captions (schematic disclaimers, "to be specified" placeholders, part labels
like "cylinder"/"barrier") are untouched -- they were never the complaint,
and darkening them too would flatten the sheet to one weight, which reads as
*harder* to scan, not easier.

Implemented once, in `DrawingPrimitives.tsx`'s `DimensionHorizontal`/
`DimensionVertical`/`DimensionArrow` -- every drawing inherits it from there,
not per-drawing. A drawing with an unusually dense dimension set (the coil
half-section detail reused across drawings 11, 12 and 20) is not a reason to
carve out a smaller exception: if the standard size does not fit, the layout
is too small, not the text.

## Background

Graph paper across the whole page, fixed, behind everything:

```css
background-image:
  linear-gradient(#C1CAC3 1px, transparent 1px),
  linear-gradient(90deg, #C1CAC3 1px, transparent 1px);
background-size: 24px 24px, 24px 24px;
opacity: 0.5;
```

## Header

Two lines, left aligned:
- "DESIGN OFFICE" — display font, 10px, uppercase, letter-spacing 0.4em, copper.
- "TRANSFORMER DESIGN & COSTING" — display font, 30px, uppercase, ink.

Right aligned, mono 10px, ink2: the active standard, then "All figures in
Indian Rupees".

## The rating plate

The signature element. A dark engraved metal plate directly under the header,
always visible, updating live as the design changes.

- Background `plate`, with an inset border effect:
  `box-shadow: inset 0 0 0 1px #33454E, inset 0 0 0 5px #1B2A32, inset 0 0 0 6px #2A3B44`
- Four bolt heads, 7px circles in `#0E1920` with a `0 1px 0 #3D515B` highlight,
  one in each corner, absolutely positioned 8px in.
- Top row, left: a small etched line naming the transformer type, application
  and standard (plateEtch, 10px, letter-spacing 0.34em, uppercase). Below it the
  rating in display font at 26px in `#E8B887` — for example
  "1000 kVA · 11 kV to 433 V".
- Top row, right: "DELIVERED PRICE INCL. GST" as an etched label, the figure
  below it in mono at 22px in `#9FD3C4` (or `#E3A08C` when the design fails a
  compliance check), and the ex-works figure under that in 10px plateEtch.
- Divider hairline in `#33454E`.
- Below: a 6-column grid (3 on mobile) of cells. Each cell is an etched label
  (9px, letter-spacing 0.22em, uppercase, plateEtch) above a mono value (13px,
  plateTx). Twelve cells: vector group, impedance, no-load loss, load loss,
  efficiency, insulation level, cooling, HV/LV current, turns, tappings,
  temperature rise, total mass.

## Layout

- Page max width 1500px, 16px padding.
- Below the plate: project bar, then a two column grid — 340px sidebar, main
  area — collapsing to one column under 1024px.
- Sidebar: white card, `rule` border, dark `plate` header strip reading
  "SPECIFICATION". Inside, collapsible groups. Each group header is a full-width
  button: 11px display uppercase, letter-spacing 0.16em, with a + or − on the
  right. Groups have a bottom hairline in `line`.

## Parameter rows

The core interaction. Each derived parameter is a row that expands.

Collapsed: label on the left in 11px ink2; on the right the value in mono 11px
with its unit in `steel`, then a badge — `AUTO` in `patina` or `SET` in `amber`,
9px, uppercase. When overridden the value itself is `amber`, not ink.

Expanded, below the row: a range slider with `accent-color: #9C5A2B`, the min
and max in mono 9px steel at either end, a number input in the middle; or a
select for option parameters, with " ✓ suggested" appended to the suggested
option's label. Under that the reason text in 10px steel. If overridden, a
"BACK TO SUGGESTED: value" link in 10px display uppercase, `patina`.

## Tabs

Small pill buttons, 11px display uppercase, letter-spacing 0.14em, 12px
horizontal padding, 6px vertical, square-ish corners (2px radius). Inactive:
transparent background, `rule` border, `ink2` text. Active: `plate` background,
`plate` border, `plateTx` text.

## Cards

White background, 1px `rule` border, 2px radius. Header strip in `sheetAlt` with
a bottom hairline in `line`, containing an 11px display uppercase title on the
left (letter-spacing 0.18em) and optional mono 10px `steel` subtitle right.
Content padded 12px horizontal, 8px vertical.

## Data rows inside cards

Label left in 11px ink2, value right in mono 11px semibold, unit after the value
in normal weight `steel`. Separated by a 1px dashed bottom border in `line`.
Key figures use `copper` for the value; failed checks use `alert`.

## Tables

Header row: `sheetAlt` background, 10px display uppercase, letter-spacing 0.14em,
ink2, left aligned. Body rows: 1px `line` bottom border, 5px by 8px padding.
Numeric columns right aligned in mono 11px. Section divider rows within a table
use the `sheet` background with `copper` text in 10px display uppercase.

## Buttons

- Primary action: `copper` background, white text, 11px display uppercase,
  letter-spacing 0.14em.
- Confirm or save: `patina` background, white text.
- Secondary: transparent with `rule` border, `ink2` text.
- Destructive: transparent with `rule` border, `alert` text.
- Disabled: `steel` background.

## Currency and numbers

Indian formatting throughout: `toLocaleString("en-IN")`, rupee symbol, and lakh
or crore for large figures ("₹16,01,393" with "16.01 L" alongside where space is
tight). Never abbreviate a price without also showing the full figure somewhere
on the same screen.

## Prohibited

- No em dashes in interface copy.
- No rounded pill shapes, no drop shadows on cards, no gradients except the
  nameplate inset.
- No emoji, no icon fonts. The only decorative elements are the bolt heads.
- No animation beyond a 0.35s fade on tab content.
