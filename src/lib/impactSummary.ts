/**
 * SOLVER.md section 4: the Design Impact Summary, app-side half. impacts()
 * in the engine (extended in this same pass) covers the design-level
 * consequences -- weight, losses, efficiency, compliance, money. This file
 * covers the parts that need to know what the user actually did, which the
 * engine's before/after design comparison alone cannot: which parameter was
 * edited, which lever the solver moved and why, and which other parameters
 * moved as a side effect.
 *
 * "Unchanged parameters must not appear" (section 4) -- diffDependents only
 * returns keys whose value actually differs.
 */
import { labelFor, fmtWithUnit } from './paramLabels';

export interface DependentChange { key: string; label: string; from: string; to: string; }

export function diffDependents(
  prevParams: Record<string, any>,
  nextParams: Record<string, any>,
  excludeKeys: string[],
): DependentChange[] {
  const exclude = new Set(excludeKeys);
  const keys = new Set([...Object.keys(prevParams), ...Object.keys(nextParams)]);
  const out: DependentChange[] = [];
  for (const key of keys) {
    if (exclude.has(key)) continue;
    const a = prevParams[key];
    const b = nextParams[key];
    if (typeof a === 'object' || typeof b === 'object' || typeof a === 'function' || typeof b === 'function') continue;
    if (a === b) continue;
    if (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-9) continue;
    out.push({ key, label: labelFor(key), from: fmtWithUnit(key, a), to: fmtWithUnit(key, b) });
  }
  return out;
}
