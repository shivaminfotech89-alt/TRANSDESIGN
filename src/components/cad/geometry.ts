/**
 * Pure geometry builders for the 3D model, all off design/params -- no
 * three.js imports here, just numbers, so this is unit-testable independent
 * of react-three-fiber. TransformerParts.tsx turns these into meshes.
 *
 * Axis convention (three.js, Y up): limbs run vertically (Y), yokes run
 * horizontally (X), phase spacing also runs along X. Z is depth.
 */
import { stepWidths, bushHeight } from '@/packages/engine';

export interface Slab { x: number; y: number; z: number; sizeX: number; sizeY: number; sizeZ: number; }

/**
 * One limb's stepped cross-section, extruded vertically. Reconstructed from
 * stepWidths()'s cumulative half-heights exactly as stampingSchedule() and
 * Drawings2D's core cross-section do: the centre packet (i=0) is full depth,
 * each further step is mirrored front and back of it -- "nested slabs,
 * widest at the centre of the stack".
 */
export function limbSlabs(steps: number, dCore: number, limbHeight: number): Slab[] {
  const sw = stepWidths(steps, dCore);
  const slabs: Slab[] = [];
  sw.rows.forEach((row: any, i: number) => {
    if (i === 0) {
      slabs.push({ x: 0, y: 0, z: 0, sizeX: row.w, sizeY: limbHeight, sizeZ: row.t });
    } else {
      const prevH = sw.rows[i - 1].halfH;
      const cz = prevH + row.t / 2;
      slabs.push({ x: 0, y: 0, z: cz, sizeX: row.w, sizeY: limbHeight, sizeZ: row.t });
      slabs.push({ x: 0, y: 0, z: -cz, sizeX: row.w, sizeY: limbHeight, sizeZ: row.t });
    }
  });
  return slabs;
}

/**
 * A yoke's stepped cross-section, extruded horizontally -- the same
 * stepWidths rows as the limb, rotated 90 degrees: what was the limb's
 * front-to-back stack becomes the yoke's top-to-bottom stack, and what was
 * the limb's width stays the yoke's depth. This is "yokes mirroring the
 * limb steps" -- literally the same row data, reoriented, not a separate
 * calculation.
 */
export function yokeSlabs(steps: number, dCore: number, yokeLength: number): Slab[] {
  const sw = stepWidths(steps, dCore);
  const slabs: Slab[] = [];
  sw.rows.forEach((row: any, i: number) => {
    if (i === 0) {
      slabs.push({ x: 0, y: 0, z: 0, sizeX: yokeLength, sizeY: row.t, sizeZ: row.w });
    } else {
      const prevH = sw.rows[i - 1].halfH;
      const cy = prevH + row.t / 2;
      slabs.push({ x: 0, y: cy, z: 0, sizeX: yokeLength, sizeY: row.t, sizeZ: row.w });
      slabs.push({ x: 0, y: -cy, z: 0, sizeX: yokeLength, sizeY: row.t, sizeZ: row.w });
    }
  });
  return slabs;
}

export function coreCrossSectionSpan(steps: number, dCore: number): number {
  const sw = stepWidths(steps, dCore);
  return 2 * sw.rows[sw.rows.length - 1].halfH;
}

export interface BushingSpec { height: number; footDia: number; }
export function hvBushingSpec(umHV: number): BushingSpec {
  const height = bushHeight(umHV);
  return { height, footDia: Math.max(30, height * 0.18) };
}
export function lvBushingSpec(umLV: number): BushingSpec {
  const height = bushHeight(umLV);
  return { height, footDia: Math.max(25, height * 0.2) };
}

export interface FinPlacement { x: number; y: number; z: number; }
/** Evenly spaced fin positions along both long sides of the tank, from
 *  finLayout()'s n/perSide -- real count and pitch, not a fixed decoration. */
export function finPlacements(perSide: number, tankL: number, tankH: number, finHeight: number, offsetZ: number): FinPlacement[] {
  if (perSide <= 0) return [];
  const usableL = tankL * 0.85;
  const pitch = usableL / Math.max(1, perSide - 1 || 1);
  const startX = -usableL / 2;
  const y = -tankH / 2 + finHeight / 2 + tankH * 0.05;
  const out: FinPlacement[] = [];
  for (let i = 0; i < perSide; i++) {
    const x = perSide === 1 ? 0 : startX + i * pitch;
    out.push({ x, y, z: offsetZ });
  }
  return out;
}

export interface BankPlacement { x: number; y: number; z: number; width: number; }
/** Evenly spaced radiator BANK positions along both long sides of the
 *  tank -- one radiatorLayout() bank is one visual/mechanical unit (header
 *  pipes plus its own panelsPerBank panels bolted together), the same role
 *  finPlacements()'s individual fins play for a fin wall, one level up.
 *  The returned `width` is the bank's own extent ALONG the tank wall
 *  (panelsPerBank panels at panelPitch centres, the X axis here) -- a
 *  different axis from radiatorLayout()'s own `panelWidth` field, which is
 *  each panel's projection OUT from the wall (the Z axis, what offsetZ is
 *  built from), the role finLayout()'s `depth` plays for a fin. Two
 *  different "widths" on two different axes, not a naming collision to
 *  resolve -- radiatorLayout() names the panel's own dimension, this
 *  function names the assembled bank's. */
export function bankPlacements(
  bankCount: number, panelsPerBank: number, panelPitch: number, tankL: number, tankH: number, panelHeight: number, offsetZ: number,
): BankPlacement[] {
  if (bankCount <= 0) return [];
  const bankWidth = Math.max(1, panelsPerBank - 1) * panelPitch;
  const usableL = tankL * 0.85;
  const pitch = usableL / Math.max(1, bankCount - 1 || 1);
  const startX = -usableL / 2;
  const y = -tankH / 2 + panelHeight / 2 + tankH * 0.05;
  const out: BankPlacement[] = [];
  for (let i = 0; i < bankCount; i++) {
    const x = bankCount === 1 ? 0 : startX + i * pitch;
    out.push({ x, y, z: offsetZ, width: bankWidth });
  }
  return out;
}

export interface ConservatorPlacement { x: number; y: number; z: number; }
/** Conservator centre, mounted above the tank on brackets -- offset toward
 *  the HV end (arbitrary but consistent with drawing 14's own LV/HV end
 *  split reasoning: the LV end already crowds bushings, cable box and tap
 *  changer linkage, so accessories that have a choice go to the HV end).
 *  y is measured from the tank's own vertical centre (this module's Y-up,
 *  limb-centred convention), high enough to clear the cover and bushings;
 *  bracket height is derived from that same clearance, not a separate
 *  invented figure. */
export function conservatorPlacement(tankL: number, tankH: number, bushingHeight: number): ConservatorPlacement {
  return { x: tankL * 0.22, y: tankH / 2 + bushingHeight + 60, z: 0 };
}
