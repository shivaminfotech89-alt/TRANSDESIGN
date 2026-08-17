/**
 * The engine's own costing rate keys (packages/engine/index.js's
 * DEFAULT_RATES), named and grouped once so the rate-card editor and the
 * item master's "which rate does this item price" picker read the same
 * list rather than each keeping a copy that could drift out of sync with
 * the other or with the engine.
 */
export interface RateKeyGroup {
  title: string;
  fields: [key: string, label: string, unit: string][];
}

export const RATE_KEY_GROUPS: RateKeyGroup[] = [
  {
    title: 'Materials',
    fields: [
      ['core', 'Core Steel', '₹/kg'], ['condCu', 'Copper', '₹/kg'], ['condAl', 'Aluminium', '₹/kg'],
      ['condCca', 'Copper-Clad Aluminium', '₹/kg'], ['insulation', 'Insulation', '₹/kg'],
      ['frameMS', 'Frame, Mild Steel', '₹/kg'], ['tankMS', 'Tank, Mild Steel', '₹/kg'],
      ['fin', 'Fin Wall', '₹/kg'], ['radiator', 'Radiator', '₹/kg'], ['fluid', 'Insulating Fluid', '₹/L'],
      ['paint', 'Paint', '₹/m²'], ['resin', 'Resin, Dry-Type', '₹/kg'], ['enclosure', 'Enclosure, Dry-Type', '₹/kg'],
    ],
  },
  {
    // CALIBRATION.md section 56: manufacturer data -- what the supplier
    // charges, per kg of finished core, above the base core rate, to
    // process a given cut geometry. Added to `core`, not multiplied; see
    // coreProcessingRate() in packages/engine/index.js.
    title: 'Core Processing, by Cut Geometry',
    fields: [
      ['coreProcMitre', 'Master Mitre Cut', '₹/kg'], ['coreProcVNotch', 'V-Notch Cut', '₹/kg'],
      ['coreProcDiamond', 'Diamond Cut', '₹/kg'],
    ],
  },
  {
    title: 'Bushings and Tap Gear',
    fields: [
      ['bushHV', 'HV Bushing, Base Rate', '₹/unit'], ['bushLV', 'LV Bushing, Base Rate', '₹/unit'],
      ['octc', 'Off-Circuit Tap Switch', '₹/set'], ['oltc', 'On-Load Tap Changer', '₹/set'],
      ['dualLink', 'Dual Voltage Link', '₹/set'],
    ],
  },
  {
    title: 'Accessories',
    fields: [
      ['cableBox', 'Cable Box / Marshalling Box', '₹/set'], ['fittings', 'Fittings', '₹/set'],
      ['plateSet', 'Rating Plate Set', '₹/set'],
    ],
  },
  {
    // CALIBRATION.md section 20: no cost basis for these three, so
    // DEFAULT_RATES ships them at 0 -- shown here so a zero is something
    // the user sees and can fill in, not something buried in a BOM total.
    title: 'Cooling Equipment (ONAF / OFAF / ODAF)',
    fields: [
      ['coolingFan', 'Cooling Fan, Unit Rate', '₹/no'], ['oilPump', 'Oil Circulation Pump, Unit Rate', '₹/no'],
      ['coolingControlGear', 'Cooling Control Gear and Wiring', '₹/lot'],
    ],
  },
  {
    title: 'Labour',
    fields: [
      ['labWind', 'Winding Labour', '₹/kg'], ['labCore', 'Core Labour', '₹/kg'],
      ['labTank', 'Tank / Enclosure Labour', '₹/kg'], ['assembly', 'Assembly and Testing', '₹/lot'],
    ],
  },
  {
    title: 'Overheads, Margin and Freight',
    fields: [
      ['overheadPct', 'Overhead', '%'], ['scrapPct', 'Scrap Allowance', '%'],
      ['freight', 'Freight', '₹'], ['marginPct', 'Margin', '%'], ['gstPct', 'GST', '%'],
    ],
  },
];

/** Flat lookup, key -> label, for anywhere that needs one rate key's name
 *  without walking the groups (a BOM row's source badge, an item's rate-key
 *  picker option list). */
export const RATE_KEY_LABELS: Record<string, string> = Object.fromEntries(
  RATE_KEY_GROUPS.flatMap((g) => g.fields.map(([key, label]) => [key, label])),
);
