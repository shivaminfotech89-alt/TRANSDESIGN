/**
 * Friendly labels and units for deriveSpec's parameter keys, shared between
 * TransformerForm (parameter rows) and DesignImpactSummary (from/to and
 * dependent-parameter reporting) so the two never drift apart.
 * Anything missing here falls back to the raw key name.
 */
export const LABELS: Record<string, string> = {
  umHV: 'Um, HV', bilHV: 'BIL, HV', acHV: 'AC withstand, HV',
  umLV: 'Um, LV', bilLV: 'BIL, LV', acLV: 'AC withstand, LV',
  dryType: 'Dry-type construction', fluid: 'Insulating fluid', insClass: 'Insulation class',
  cooling: 'Cooling', tankType: 'Tank type', oilRiseTarget: 'Rise target',
  refTemp: 'Loss reference temperature', ambient: 'Ambient, maximum', ambientAvg: 'Ambient, yearly average',
  limitNLL: 'No-load loss limit', limitLL: 'Load loss limit', targetZ: 'Target impedance', zTol: 'Impedance tolerance',
  kva2: 'Second rating', cooling2: 'Second rating, cooling', limitNLL2: 'Second rating, no-load loss limit', limitLL2: 'Second rating, load loss limit',
  coreGrade: 'Core steel grade', coreType: 'Core / joint construction', coreConstruction: 'Core plate cutting pattern',
  buildFactor: 'Building factor',
  flux: 'Flux density', steps: 'Core steps', etK: 'Volts-per-turn constant (K)', aspect: 'Window aspect ratio',
  autoWindow: 'Solve window height for impedance', autoFit: 'Fit flux / current density to loss limits',
  windowSpace: 'Window space factor numerator',
  condLV: 'LV conductor material', condHV: 'HV conductor material',
  deltaLV: 'LV current density', deltaHV: 'HV current density', stray: 'Stray loss allowance',
  tapType: 'Tap changer type', tapPlus: 'Tap range above normal', tapMinus: 'Tap range below normal', tapStep: 'Tap step size',
  coreLvClr: 'Core to LV clearance', lvHvClr: 'LV to HV clearance', phaseClr: 'Phase to phase clearance',
  endClrLV: 'LV end clearance', endClrHV: 'HV end clearance', hvTankClr: 'HV to tank clearance',
  endTankClr: 'End to tank clearance', cylThk: 'Insulating cylinder thickness',
  lvIns: 'LV interturn insulation', hvPaper: 'HV conductor paper covering', hvInterlayer: 'HV interlayer insulation',
  insFactor: 'Insulation mass factor', topOilSpace: 'Top oil / lead space', bottomClr: 'Bottom clearance',
  finDiss: 'Fin/radiator dissipation @50K', tankDiss: 'Tank wall dissipation @50K', airDiss: 'Dry-type coil dissipation coefficient',
  fanUnitArea: 'Cooling surface per fan',
  tariff: 'Energy tariff', years: 'Evaluation period', loadFactor: 'Average load factor', pf: 'Power factor',
  // Core-level enquiry fields (not derived, but still worth a friendly label
  // in the Design Impact Summary when one of these is what changed).
  application: 'Application', standard: 'Design standard', kva: 'Rating', hv: 'HV voltage', lv: 'LV voltage',
  freq: 'Frequency', vector: 'Vector group', effLevel: 'Efficiency level', medium: 'Cooling medium',
  condPref: 'Conductor preference', dualHV: 'Dual HV voltage', hv2: 'HV voltage, second', dualLV: 'Dual LV voltage', lv2: 'LV voltage, second',
  dualRating: 'Dual rating (natural + forced)',
};

/** Compact units shown next to a value, in the sidebar and the impact summary. */
export const UNITS: Record<string, string> = {
  umHV: 'kV', bilHV: 'kVp', acHV: 'kV', umLV: 'kV', bilLV: 'kVp', acLV: 'kV',
  oilRiseTarget: 'K', refTemp: '°C', ambient: '°C', ambientAvg: '°C',
  limitNLL: 'W', limitLL: 'W', targetZ: '%', zTol: '%', buildFactor: '×', flux: 'T',
  kva2: 'kVA', limitNLL2: 'W', limitLL2: 'W', fanUnitArea: 'm²',
  etK: '', aspect: '', windowSpace: '', deltaLV: 'A/mm²', deltaHV: 'A/mm²', stray: '%',
  tapPlus: '%', tapMinus: '%', tapStep: '%',
  coreLvClr: 'mm', lvHvClr: 'mm', phaseClr: 'mm', endClrLV: 'mm', endClrHV: 'mm',
  hvTankClr: 'mm', endTankClr: 'mm', cylThk: 'mm',
  lvIns: 'mm', hvPaper: 'mm', hvInterlayer: 'mm', insFactor: '×', topOilSpace: 'mm',
  bottomClr: 'mm', finDiss: 'W/m²', tankDiss: 'W/m²', airDiss: '',
  tariff: '₹/kWh', years: 'yr', loadFactor: '', pf: '',
  kva: 'kVA', hv: 'V', lv: 'V', hv2: 'V', lv2: 'V', freq: 'Hz',
};

export function labelFor(key: string): string {
  return LABELS[key] || key;
}

export function fmtValue(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === 'boolean') return v ? 'On' : 'Off';
  return String(v);
}

export function fmtWithUnit(key: string, v: unknown): string {
  const unit = UNITS[key];
  return unit ? `${fmtValue(v)} ${unit}` : fmtValue(v);
}
