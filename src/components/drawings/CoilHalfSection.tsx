import React from 'react';
import {
  dimText, DimensionHorizontal, DimensionVertical,
} from './DrawingPrimitives';

/**
 * DRAWINGS.md, drawings 11, 12 and 20: "the coil half-section detail" is
 * named in all three, and drawing 20 is explicit that it is one section
 * component, not several. This file is that component's geometry and
 * shapes -- centre line, half core limb, core-to-LV cylinder, LV coil,
 * LV-to-HV barrier, HV coil -- shared by every caller so a clearance value
 * is read from design/params in exactly one place. The cross-drawing
 * consistency this earns: every clearance on 11, 12 and 20 is the same
 * design.tLVin/tLVout/tHVin/tHVout the engine itself derived lvID/lvOD/
 * hvID/hvOD from, not a second calculation that could disagree with them.
 *
 * Radial boundaries (from the limb centreline, mm):
 *   0 -> R              half core limb (R = dCore/2)
 *   R -> R+tLVin        core-to-LV clearance (tLVin === params.coreLvClr)
 *   R+tLVin -> +tLVout  LV coil (width = lvRadial)
 *   +tLVout -> +tHVin   LV-to-HV gap (width = lvHvClr)
 *   +tHVin -> +tHVout   HV coil (width = hvRadial)
 * R+tHVout is exactly hvOD/2 -- buildBOM defines hvOD from tHVout the same
 * way, so "sum of core radius, core-to-LV, LV build, LV-to-HV gap and HV
 * build equals half the HV outside diameter" is true by construction, not
 * something this file has to separately enforce.
 *
 * The core-to-LV cylinder and the LV-to-HV barrier are placed and sized
 * exactly as buildBOM's own insulation-mass integral does: the cylinder at
 * 0.8*cylThk sitting against the LV coil's inner face, the barrier at the
 * full cylThk sitting against its outer face (buildBOM: cylVol uses
 * perim(coreLvClr) at 0.8*cylThk, then perim(coreLvClr+lvRadial) at the
 * full cylThk).
 */

export interface HalfSectionBounds {
  R: number; xLvIn: number; xLvOut: number; xHvIn: number; xHvOut: number;
  xCyl0: number; xCyl1: number; xBar0: number; xBar1: number;
  yTop: number; yBot: number; yLvTop: number; yLvBot: number; yHvTop: number; yHvBot: number;
}

export function halfSectionBounds(design: any, params: any): HalfSectionBounds {
  const R = design.dCore / 2;
  const xLvIn = R + design.tLVin, xLvOut = R + design.tLVout;
  const xHvIn = R + design.tHVin, xHvOut = R + design.tHVout;
  return {
    R, xLvIn, xLvOut, xHvIn, xHvOut,
    xCyl0: xLvIn - params.cylThk * 0.8, xCyl1: xLvIn,
    xBar0: xLvOut, xBar1: xLvOut + params.cylThk,
    yTop: 0, yBot: design.Hw,
    yLvTop: params.endClrLV, yLvBot: design.Hw - params.endClrLV,
    yHvTop: params.endClrHV, yHvBot: design.Hw - params.endClrHV,
  };
}

interface ShapesProps {
  design: any; params: any; b: HalfSectionBounds;
  scale: number; originX: number; originY: number;
  showInsulation?: boolean;
}

/** The shapes only -- core, cylinder, LV, barrier, HV, centre line. No
 *  dimensions, so a caller can draw several instances (drawing 20's three
 *  phases) without repeating the dimension set on each one. */
export function CoilHalfSectionShapes({ design, params, b, scale, originX, originY, showInsulation = true }: ShapesProps) {
  const mx = (mm: number) => originX + mm * scale;
  const my = (mm: number) => originY + mm * scale;
  return (
    <g>
      <rect x={mx(0)} y={my(b.yTop)} width={mx(b.R) - mx(0)} height={my(b.yBot) - my(b.yTop)} fill="var(--color-steel)" fillOpacity={0.3} stroke="var(--color-ink)" strokeWidth={1.5} />
      {showInsulation && (
        <rect x={mx(b.xCyl0)} y={my(b.yLvTop)} width={mx(b.xCyl1) - mx(b.xCyl0)} height={my(b.yLvBot) - my(b.yLvTop)} fill="var(--color-sheetAlt)" stroke="var(--color-ink2)" strokeWidth={0.5} />
      )}
      <rect x={mx(b.xLvIn)} y={my(b.yLvTop)} width={mx(b.xLvOut) - mx(b.xLvIn)} height={my(b.yLvBot) - my(b.yLvTop)} fill="var(--color-copper)" fillOpacity={0.25} stroke="var(--color-copper)" strokeWidth={1.5} />
      {showInsulation && (
        <rect x={mx(b.xBar0)} y={my(b.yLvTop)} width={mx(b.xBar1) - mx(b.xBar0)} height={my(b.yLvBot) - my(b.yLvTop)} fill="var(--color-sheetAlt)" stroke="var(--color-ink2)" strokeWidth={0.5} />
      )}
      <rect x={mx(b.xHvIn)} y={my(b.yHvTop)} width={mx(b.xHvOut) - mx(b.xHvIn)} height={my(b.yHvBot) - my(b.yHvTop)} fill="#6b3d1d" fillOpacity={0.22} stroke="#6b3d1d" strokeWidth={1.5} />
      <line x1={mx(0)} y1={my(b.yTop) - 6} x2={mx(0)} y2={my(b.yBot) + 6} stroke="var(--color-copper)" strokeWidth={0.5} strokeDasharray="6 2 1 2" />
    </g>
  );
}

interface DimsProps {
  design: any; params: any; b: HalfSectionBounds;
  scale: number; originX: number; originY: number; arrowId: string;
  radialDimY: number; axialDimX0: number;
}

/**
 * The complete clearance and axial-height dimension set, drawn once. Every
 * caller (11, 12, both of 20) uses this same function so "every clearance
 * shown on 11, 12 and 20 must read from the same resolved values" holds
 * structurally: there is only one place these dimension lines are drawn
 * from design/params, and it is this one.
 */
export function CoilHalfSectionDimensions({ design, params, b, scale, originX, originY, arrowId, radialDimY, axialDimX0 }: DimsProps) {
  const mx = (mm: number) => originX + mm * scale;
  const my = (mm: number) => originY + mm * scale;
  const gap = 12;
  return (
    <g>
      {/* Radial stack, nearest to farthest from the circle -- same
          chain-dimension convention as drawing 7. */}
      <DimensionHorizontal x1={mx(0)} x2={mx(b.R)} featureY={my(b.yTop)} dimY={radialDimY} label={dimText(b.R)} arrowId={arrowId} />
      <DimensionHorizontal x1={mx(b.R)} x2={mx(b.xLvIn)} featureY={my(b.yTop)} dimY={radialDimY + gap} label={dimText(params.coreLvClr)} arrowId={arrowId} />
      <DimensionHorizontal x1={mx(b.xLvIn)} x2={mx(b.xLvOut)} featureY={my(b.yTop)} dimY={radialDimY + gap * 2} label={dimText(design.lvRadial, { decimals: 1 })} arrowId={arrowId} />
      <DimensionHorizontal x1={mx(b.xLvOut)} x2={mx(b.xHvIn)} featureY={my(b.yTop)} dimY={radialDimY + gap * 3} label={dimText(params.lvHvClr)} arrowId={arrowId} />
      <DimensionHorizontal x1={mx(b.xHvIn)} x2={mx(b.xHvOut)} featureY={my(b.yTop)} dimY={radialDimY + gap * 4} label={dimText(design.hvRadial, { decimals: 1 })} arrowId={arrowId} />
      <DimensionHorizontal x1={mx(0)} x2={mx(b.xHvOut)} featureY={my(b.yTop)} dimY={radialDimY + gap * 5} label={dimText(b.xHvOut, { radius: true, decimals: 1 })} arrowId={arrowId} />

      {/* Axial, LV's own end clearance and height nearest the limb. */}
      <DimensionVertical y1={my(b.yTop)} y2={my(b.yLvTop)} featureX={mx(0)} dimX={axialDimX0} label={dimText(params.endClrLV)} arrowId={arrowId} />
      <DimensionVertical y1={my(b.yLvTop)} y2={my(b.yLvBot)} featureX={mx(0)} dimX={axialDimX0 - gap} label={dimText(design.hLV)} arrowId={arrowId} />
      {/* HV's own end clearance and height, one gutter further out. */}
      <DimensionVertical y1={my(b.yTop)} y2={my(b.yHvTop)} featureX={mx(b.xHvOut)} dimX={mx(b.xHvOut) + gap} label={dimText(params.endClrHV)} arrowId={arrowId} />
      <DimensionVertical y1={my(b.yHvTop)} y2={my(b.yHvBot)} featureX={mx(b.xHvOut)} dimX={mx(b.xHvOut) + gap * 2} label={dimText(design.hHV)} arrowId={arrowId} />
      {/* Overall window height. */}
      <DimensionVertical y1={my(b.yTop)} y2={my(b.yBot)} featureX={mx(0)} dimX={axialDimX0 - gap * 2} label={dimText(design.Hw)} arrowId={arrowId} />
    </g>
  );
}
