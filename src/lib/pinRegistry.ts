/**
 * SOLVER.md section 6, step 1: the pin registry and conflict detection.
 *
 * No solving happens here. Pinning a Class B target just registers "the
 * engineer wants this output to hit this value" against the lever it would
 * need, and blocks the pin (or a conflicting direct override) if something
 * else already claims that lever. The actual bisection is SOLVER.md step 3.
 *
 * Two of the eight Class B rows in SOLVER.md section 1 -- impedance (lever:
 * window height) and temperature rise (lever: top-oil rise target) -- are
 * "already implemented": they're ordinary deriveSpec rows today (targetZ,
 * oilRiseTarget) with their own AUTO/SET behaviour, not new UI. They still
 * need to exist in this registry so conflict detection is complete (setting
 * targetZ directly must still be able to conflict with a lever it shares),
 * but they are not offered as new pins in the pin panel -- see
 * ALREADY_IMPLEMENTED below.
 */

export type LeverKey = 'flux' | 'currentDensity' | 'etK' | 'oilRiseTarget' | 'windowHeight';

export interface ClassBTarget {
  id: string;
  label: string;
  unit: string;
  lever: LeverKey;
  leverLabel: string;
  relationship: string;
}

export const CLASS_B_TARGETS: ClassBTarget[] = [
  { id: 'noLoadLoss', label: 'No-Load Loss', unit: 'W', lever: 'flux', leverLabel: 'Flux Density', relationship: 'P0 ∝ B^0.9 -- core weight rises as B falls, partly offsetting' },
  { id: 'loadLoss', label: 'Load Loss', unit: 'W', lever: 'currentDensity', leverLabel: 'Current Density, Both Windings', relationship: 'Pc ∝ J' },
  { id: 'coreDiameter', label: 'Core Diameter', unit: 'mm', lever: 'etK', leverLabel: 'Volts-Per-Turn Constant (K)', relationship: 'd ∝ √(Et/B), Et = K√S' },
  { id: 'lvTurns', label: 'Number of LV Turns', unit: 'turns', lever: 'etK', leverLabel: 'Volts-Per-Turn Constant (K)', relationship: 'N = round(V/Et), integer target, exact' },
  { id: 'conductorSize', label: 'Conductor Size', unit: 'mm²', lever: 'currentDensity', leverLabel: 'Current Density', relationship: 'a = I/J, so setting a sets J' },
  { id: 'impedance', label: 'Impedance', unit: '%', lever: 'windowHeight', leverLabel: 'Window Height', relationship: 'already implemented, via the existing bisection on window height' },
  { id: 'temperatureRise', label: 'Temperature Rise', unit: 'K', lever: 'oilRiseTarget', leverLabel: 'Top-Oil Rise Target', relationship: 'already implemented, via the existing cooling-surface solve' },
  { id: 'finArea', label: 'Radiator / Fin Area', unit: 'm²', lever: 'oilRiseTarget', leverLabel: 'Top-Oil Rise Target', relationship: 'inverse of temperature rise -- same lever' },
];

/** Targets that already have a direct, working Class A row (targetZ, oilRiseTarget)
 *  and so are not offered as new pins -- see the note in the module comment. */
export const ALREADY_IMPLEMENTED = new Set(['impedance', 'temperatureRise']);

export const PINNABLE_TARGETS = CLASS_B_TARGETS.filter((t) => !ALREADY_IMPLEMENTED.has(t.id));

/** Which `over` keys today's UI already uses to move each lever directly. */
export const LEVER_OVER_KEYS: Record<LeverKey, string[]> = {
  flux: ['flux'],
  currentDensity: ['deltaLV', 'deltaHV'],
  etK: ['etK'],
  oilRiseTarget: ['oilRiseTarget'],
  windowHeight: [],
};

export const OVER_KEY_LEVER: Record<string, LeverKey> = {};
for (const [lever, keys] of Object.entries(LEVER_OVER_KEYS)) {
  for (const k of keys) OVER_KEY_LEVER[k] = lever as LeverKey;
}

export interface Pin {
  targetId: string;
  value: number;
}

export type PinSet = Record<string, Pin>;

export type ConflictHolder =
  | { kind: 'pin'; targetId: string; label: string }
  | { kind: 'override'; overKey: string; label: string };

export interface Conflict {
  lever: LeverKey;
  leverLabel: string;
  holders: ConflictHolder[];
}

function pinsOnLever(lever: LeverKey, pins: PinSet, excludeTargetId?: string): ConflictHolder[] {
  return Object.values(pins)
    .filter((p) => p.targetId !== excludeTargetId)
    .map((p) => CLASS_B_TARGETS.find((t) => t.id === p.targetId))
    .filter((t): t is ClassBTarget => !!t && t.lever === lever)
    .map((t) => ({ kind: 'pin' as const, targetId: t.id, label: t.label }));
}

function overridesOnLever(lever: LeverKey, over: Record<string, any>): ConflictHolder[] {
  return LEVER_OVER_KEYS[lever]
    .filter((k) => over[k] !== undefined)
    .map((k) => ({ kind: 'override' as const, overKey: k, label: k }));
}

/** Would pinning `targetId` conflict with an existing pin or direct override on its lever? */
export function findConflictForPin(targetId: string, pins: PinSet, over: Record<string, any>): Conflict | null {
  const target = CLASS_B_TARGETS.find((t) => t.id === targetId);
  if (!target) return null;
  const holders = [
    ...pinsOnLever(target.lever, pins, targetId),
    ...overridesOnLever(target.lever, over),
  ];
  return holders.length ? { lever: target.lever, leverLabel: target.leverLabel, holders } : null;
}

/** Would directly overriding `overKey` (a Class A parameter row) conflict with an existing pin on its lever? */
export function findConflictForOverride(overKey: string, pins: PinSet): Conflict | null {
  const lever = OVER_KEY_LEVER[overKey];
  if (!lever) return null;
  const holders = pinsOnLever(lever, pins);
  const leverLabel = CLASS_B_TARGETS.find((t) => t.lever === lever)?.leverLabel || lever;
  return holders.length ? { lever, leverLabel, holders } : null;
}
