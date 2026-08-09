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
