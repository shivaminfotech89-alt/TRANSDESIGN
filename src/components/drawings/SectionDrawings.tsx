import React, { useId } from 'react';
import { Card, DataRow, thCls, tdCls } from '../ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
  drawingNo, ratingLabel,
} from './DrawingPrimitives';
import { PART_NUMBERS } from './partNumbers';
import { halfSectionBounds, CoilHalfSectionShapes, CoilHalfSectionDimensions } from './CoilHalfSection';

interface Props { design: any; params: any; project: any; }

/** DRAWINGS.md, drawing 11: insulation drawing. Just the half-section
 *  detail -- no tank, no yokes -- with the two insulation pieces
 *  (core-to-LV cylinder, LV-to-HV barrier) named individually, a
 *  schematic creepage path along the end insulation, and every material/
 *  geometry detail the engine does not hold printed "to be specified"
 *  rather than invented, per the standing rule. */
export function InsulationDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  const b = halfSectionBounds(design, params);
  const box = { w: 420, h: 490 };
  // DESIGN.md, "Drawing linework": top margin widened (was 20) for the
  // larger 8px dimension text -- this sheet stacks four annotation tiers
  // above the coil (thickness dimensions, cylinder/barrier labels, the
  // creepage path and its caption) in the same vertical gutter, and the
  // bigger text needs real room between tiers, not just a bigger font on
  // the old spacing -- checked directly, the old 20px margin overlapped
  // the thickness dimension chips into the creepage caption.
  const margin = { top: 50, right: 90, bottom: 18, axialGutter: 60 };
  const fit = fitToViewBox(b.xHvOut, design.Hw, box.w - margin.right - margin.axialGutter, box.h - margin.top - margin.bottom, 8);
  const originX = margin.axialGutter + fit.offsetX;
  const originY = margin.top + fit.offsetY;

  const radialDimY = originY + design.Hw * fit.scale + 14;
  const axialDimX0 = originX - 14;

  const mx = (mm: number) => originX + mm * fit.scale;
  const my = (mm: number) => originY + mm * fit.scale;

  // Schematic creepage path: a zig-zag tracing the end-insulation surface
  // from the LV end ring out to the HV end ring, over the top of the
  // barrier -- shape only, the engine holds no creepage figure to label it
  // with, so the length prints "to be specified".
  const creepY = my(b.yLvTop) - 8;
  const creepPath = `M${mx(b.xLvIn)},${my(b.yLvTop)} L${mx(b.xLvIn)},${creepY} L${mx(b.xHvOut)},${creepY} L${mx(b.xHvOut)},${my(b.yHvTop)}`;

  return (
    <Card title="Insulation Drawing" subtitle={`Drawing ${drawingNo(project, '11')} · radial section, core to HV outer edge`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <CoilHalfSectionShapes design={design} params={params} b={b} scale={fit.scale} originX={originX} originY={originY} />
          <path d={creepPath} fill="none" stroke="var(--color-alert)" strokeWidth={0.6} strokeDasharray="3 2" />
          <text x={(mx(b.xLvIn) + mx(b.xHvOut)) / 2} y={creepY - 6} textAnchor="middle" className="font-mono" fontSize={5.5} fill="var(--color-alert)">creepage: to be specified</text>

          {/* Anchored outward (end/start, not middle) and away from each
              other -- the cylinder and barrier are both thin enough that
              centring each label on its own narrow rect ran the two into
              each other regardless of font size. */}
          <text x={mx(b.xCyl0) - 2} y={my(b.yLvTop) - 26} textAnchor="end" className="font-mono" fontSize={5} fill="var(--color-ink2)">cylinder</text>
          <text x={mx(b.xBar1) + 2} y={my(b.yLvTop) - 26} textAnchor="start" className="font-mono" fontSize={5} fill="var(--color-ink2)">barrier</text>

          <CoilHalfSectionDimensions
            design={design} params={params} b={b} scale={fit.scale} originX={originX} originY={originY}
            arrowId={arrowId} radialDimY={radialDimY} axialDimX0={axialDimX0}
          />
          {/* Cylinder and barrier thicknesses, real from the engine's own
              insulation-mass formula (0.8*cylThk against the LV inner face,
              cylThk against its outer face). */}
          <DimensionHorizontal x1={mx(b.xCyl0)} x2={mx(b.xCyl1)} featureY={my(b.yLvTop)} dimY={my(b.yLvTop) - 44} label={dimText(params.cylThk * 0.8, { decimals: 2 })} arrowId={arrowId} />
          <DimensionHorizontal x1={mx(b.xBar0)} x2={mx(b.xBar1)} featureY={my(b.yLvTop)} dimY={my(b.yLvTop) - 44} label={dimText(params.cylThk, { decimals: 2 })} arrowId={arrowId} />

          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <DataRow label="Impulse Level, HV / LV" value={`${params.bilHV} / ${params.bilLV}`} unit="kVp" />
          <DataRow label="AC Withstand, HV / LV" value={`${params.acHV} / ${params.acLV}`} unit="kV" />
          <DataRow label="Core-to-LV Cylinder Grade" value="to be specified" />
          <DataRow label="LV-to-HV Barrier Grade" value="to be specified" />
          <DataRow label="Phase Barrier Detail" value="to be specified" />
          <DataRow label="End Ring and Spacer Detail" value="to be specified" />
          <DataRow label="Creepage Path Length" value="to be specified" />
          <DataRow label="Bushing Creepage" value="to be specified, from vendor catalogue" />
          <p className="text-[10px] text-steel pt-2 leading-snug">
            Material grades for pressboard, DDP and Nomex, end ring and spacer detail, and creepage from the
            bushing catalogue are not held by the engine.
          </p>
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '11')} title="Insulation Drawing" rev={project?.revision ?? 0}
        sheet={11} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}

/** DRAWINGS.md, drawing 12: transverse section through the tank on the
 *  centre line of one limb. Reuses the half-section detail unchanged, adds
 *  the tank wall, fluid level, clamping frames, tie rods and the HV lead.
 *  Y = 0 is the tank's own inside top; the stack top-oil space + yoke +
 *  window + yoke + bottom clearance is exactly buildBOM's own tankH
 *  formula (tankH = coreHeight + bottomClr + topOilSpace), so the drawn
 *  yokes and window land on the tank floor with nothing left over or
 *  short. X = 0 is the limb centreline, same half-section convention as
 *  drawing 7 and the winding drawings, extending out to the tank wall on
 *  one side. */
export function InternalAssemblyDrawing({ design, params, project, drawingSeq = '12', sheet = 12 }: Props & { drawingSeq?: string; sheet?: number }) {
  const arrowId = useId();
  if (design.dry) {
    return (
      <Card title="Internal Assembly Drawing" subtitle={`Drawing ${drawingNo(project, drawingSeq)}`}>
        <p className="text-[11px] text-steel">Not applicable: dry-type construction has no tank or fluid to section.</p>
      </Card>
    );
  }
  const b = halfSectionBounds(design, params);
  const tankHalfW = design.tankW / 2;

  const box = { w: 420, h: 460 };
  const margin = { top: 20, right: 26, bottom: 18, axialGutter: 70 };
  const fit = fitToViewBox(tankHalfW, design.tankH, box.w - margin.right - margin.axialGutter, box.h - margin.top - margin.bottom, 8);
  const originX = margin.axialGutter + fit.offsetX;
  const tankTopY = margin.top + fit.offsetY;

  const mx = (mm: number) => originX + mm * fit.scale;
  const my = (mm: number) => tankTopY + mm * fit.scale;

  const fluidY = params.topOilSpace;
  const yokeTopY = params.topOilSpace;
  const windowTopY = yokeTopY + design.yokeDepth;
  const windowBotY = windowTopY + design.Hw;
  const yokeBotY = windowBotY + design.yokeDepth;
  const tankBotY = design.tankH;

  const coilOriginY = tankTopY + windowTopY * fit.scale; // window-top (Y=0 in half-section mm) mapped into this drawing

  const radialDimY = my(tankBotY) + 14;
  const axialDimX0 = originX - 14;

  return (
    <Card title="Internal Assembly Drawing" subtitle={`Drawing ${drawingNo(project, drawingSeq)} · transverse section, centre line of one limb`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />

          {/* Tank wall and fluid */}
          <rect x={mx(0)} y={my(0)} width={mx(tankHalfW) - mx(0)} height={my(tankBotY) - my(0)} fill="none" stroke="var(--color-ink)" strokeWidth={2.1} />
          {!design.dry && (
            <rect x={mx(0)} y={my(fluidY)} width={mx(tankHalfW) - mx(0)} height={my(tankBotY) - my(fluidY)} fill="var(--color-copperLt)" fillOpacity={0.08} stroke="none" />
          )}
          {!design.dry && <line x1={mx(0)} y1={my(fluidY)} x2={mx(tankHalfW)} y2={my(fluidY)} stroke="var(--color-steel)" strokeWidth={0.6} strokeDasharray="8 2" />}

          {/* Yoke bands, top and bottom, spanning to the tank wall for
              visual context (their real width is coreWidth, not drawn full
              here since this is a transverse, not longitudinal, section). */}
          <rect x={mx(0)} y={my(yokeTopY)} width={mx(b.R) - mx(0)} height={my(windowTopY) - my(yokeTopY)} fill="var(--color-steel)" fillOpacity={0.3} stroke="var(--color-ink)" strokeWidth={1.5} />
          <rect x={mx(0)} y={my(windowBotY)} width={mx(b.R) - mx(0)} height={my(yokeBotY) - my(windowBotY)} fill="var(--color-steel)" fillOpacity={0.3} stroke="var(--color-ink)" strokeWidth={1.5} />

          <CoilHalfSectionShapes design={design} params={params} b={b} scale={fit.scale} originX={originX} originY={coilOriginY} />

          {/* Clamping frames, schematic -- not held by the engine. */}
          <rect x={mx(0)} y={my(yokeTopY) - 6} width={mx(b.xHvOut) - mx(0)} height={5} fill="none" stroke="var(--color-ink2)" strokeWidth={0.8} strokeDasharray="3 1" />
          <rect x={mx(0)} y={my(yokeBotY) + 1} width={mx(b.xHvOut) - mx(0)} height={5} fill="none" stroke="var(--color-ink2)" strokeWidth={0.8} strokeDasharray="3 1" />
          {/* Tie rod, schematic */}
          <line x1={mx(b.xHvOut) + 6} y1={my(yokeTopY) - 6} x2={mx(b.xHvOut) + 6} y2={my(yokeBotY) + 6} stroke="var(--color-ink2)" strokeWidth={1} strokeDasharray="1 2" />
          {/* HV lead, schematic, routed up to a bushing mark at the cover */}
          <path d={`M${mx(b.xHvOut) - 4},${my(windowTopY) + 10} L${mx(tankHalfW) * 0.7},${my(0) + 10} L${mx(tankHalfW) * 0.7},${my(0) - 4}`} fill="none" stroke="var(--color-ink2)" strokeWidth={0.8} />
          <rect x={mx(tankHalfW) * 0.7 - 4} y={my(0) - 10} width={8} height={8} fill="none" stroke="var(--color-ink)" strokeWidth={1.2} />

          <CoilHalfSectionDimensions
            design={design} params={params} b={b} scale={fit.scale} originX={originX} originY={coilOriginY}
            arrowId={arrowId} radialDimY={radialDimY} axialDimX0={axialDimX0}
          />
          <DimensionHorizontal x1={mx(b.xHvOut)} x2={mx(tankHalfW)} featureY={my(windowTopY)} dimY={radialDimY} label={dimText(params.hvTankClr)} arrowId={arrowId} />
          <DimensionHorizontal x1={mx(0)} x2={mx(tankHalfW)} featureY={my(0)} dimY={margin.top - 12} label={dimText(tankHalfW, { decimals: 1 })} arrowId={arrowId} />
          <DimensionVertical y1={my(0)} y2={my(tankBotY)} featureX={mx(tankHalfW)} dimX={mx(tankHalfW) + 14} label={dimText(design.tankH)} arrowId={arrowId} />
          <DimensionVertical y1={my(0)} y2={my(fluidY)} featureX={mx(0)} dimX={axialDimX0 - 36} label={dimText(params.topOilSpace)} arrowId={arrowId} />
          <DimensionVertical y1={my(yokeBotY)} y2={my(tankBotY)} featureX={mx(0)} dimX={axialDimX0 - 50} label={dimText(params.bottomClr)} arrowId={arrowId} />
          <DimensionVertical y1={my(yokeTopY) - 6} y2={my(yokeTopY) - 1} featureX={mx(b.xHvOut) * 0.5} dimX={mx(b.xHvOut) * 0.5} label="to be specified" arrowId={arrowId} />

          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <DataRow label="Tank Inside Width x Height" value={`${Math.round(design.tankW)} x ${Math.round(design.tankH)}`} unit="mm" />
          <DataRow label="HV to Tank Wall" value={String(params.hvTankClr)} unit="mm" />
          <DataRow label="Bottom Clearance" value={String(params.bottomClr)} unit="mm" />
          <DataRow label="Top Fluid Space" value={String(params.topOilSpace)} unit="mm" />
          <DataRow label="Clamping Frame Depth" value="to be specified" />
          <DataRow label="Fluid Level" value={design.dry ? 'n/a, dry type' : `${Math.round(params.topOilSpace)} mm below cover`} />
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, drawingSeq)} title="Internal Assembly Drawing" rev={project?.revision ?? 0}
        sheet={sheet} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.grade.name} partNumber={PART_NUMBERS.core}
      />
    </Card>
  );
}

/** DRAWINGS.md, drawing 20: two sheets sharing this section machinery.
 *  Transverse is literally InternalAssemblyDrawing again (drawing 20's own
 *  spec: "Transverse: as drawing 12") -- not a second copy, the same
 *  component under drawing 20's own number. Longitudinal sections along
 *  the limb row instead: all three phases, full width (not halved, since
 *  "all three phases visible" means showing the two outer limbs whole, not
 *  the half a limb half-section convention would leave). Every clearance
 *  is dimensioned once, on the centre phase; the outer two are geometrically
 *  identical (same design, same halfSectionBounds), so repeating the same
 *  dimension lines three times would only repeat the same six numbers, not
 *  add information -- CoilHalfSectionDimensions is deliberately called only
 *  once, but CoilHalfSectionShapes (unlabelled geometry) three times. */
export function LongitudinalSectionDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  if (design.dry) {
    return (
      <Card title="Cross-Sectional Drawing, Longitudinal" subtitle={`Drawing ${drawingNo(project, '20L')}`}>
        <p className="text-[11px] text-steel">Not applicable: dry-type construction has no tank or fluid to section.</p>
      </Card>
    );
  }
  const b = halfSectionBounds(design, params);

  // The outer limbs' HV coil is centred on +-cc and extends +-b.xHvOut from
  // there. tankL is built from coreWidth (the bare-core envelope, cc+dCore/2
  // per side) plus endTankClr -- unlike tankW, which correctly adds the
  // coil's own radial build (tankW = hvOD + 2*hvTankClr), tankL never adds
  // the coil's overhang past the bare core. For a large enough coil
  // relative to endTankClr this can overhang the drawn tank wall. Drawn
  // honestly rather than silently clipped or hidden: the viewBox uses
  // whichever reach is larger, and an overhang is called out on the sheet
  // if the engine's own numbers produce one, which is exactly the kind of
  // thing this drawing exists to catch.
  const outerReach = design.cc + b.xHvOut;
  const overhang = outerReach - design.tankL / 2;
  const halfExtent = Math.max(design.tankL / 2, outerReach);

  const box = { w: 460, h: 420 };
  const margin = { top: 20, side: 30, bottom: 18, axialGutter: 60 };
  const fit = fitToViewBox(halfExtent * 2, design.tankH, box.w - 2 * margin.side - margin.axialGutter, box.h - margin.top - margin.bottom, 8);
  const originX = margin.side + margin.axialGutter + fit.offsetX;
  const tankTopY = margin.top + fit.offsetY;

  const mx = (mm: number) => originX + mm * fit.scale;
  const my = (mm: number) => tankTopY + mm * fit.scale;

  const fluidY = params.topOilSpace;
  const yokeTopY = params.topOilSpace;
  const windowTopY = yokeTopY + design.yokeDepth;
  const windowBotY = windowTopY + design.Hw;
  const yokeBotY = windowBotY + design.yokeDepth;
  const tankBotY = design.tankH;
  const coilOriginY = tankTopY + windowTopY * fit.scale;

  const limbXmm = [-design.cc, 0, design.cc];
  const tankLeftMm = -design.tankL / 2, tankRightMm = design.tankL / 2;

  const radialDimY = my(tankBotY) + 14;
  const axialDimX0 = mx(tankLeftMm) - 14;

  return (
    <Card title="Cross-Sectional Drawing, Longitudinal" subtitle={`Drawing ${drawingNo(project, '20L')} · section along the limb row, all three phases`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />

          <rect x={mx(tankLeftMm)} y={my(0)} width={mx(tankRightMm) - mx(tankLeftMm)} height={my(tankBotY) - my(0)} fill="none" stroke="var(--color-ink)" strokeWidth={2.1} />
          {!design.dry && (
            <rect x={mx(tankLeftMm)} y={my(fluidY)} width={mx(tankRightMm) - mx(tankLeftMm)} height={my(tankBotY) - my(fluidY)} fill="var(--color-copperLt)" fillOpacity={0.08} stroke="none" />
          )}
          {!design.dry && <line x1={mx(tankLeftMm)} y1={my(fluidY)} x2={mx(tankRightMm)} y2={my(fluidY)} stroke="var(--color-steel)" strokeWidth={0.6} strokeDasharray="8 2" />}

          {/* Yokes, sliced lengthwise, spanning the full core width. */}
          <rect x={mx(-design.coreWidth / 2)} y={my(yokeTopY)} width={mx(design.coreWidth / 2) - mx(-design.coreWidth / 2)} height={my(windowTopY) - my(yokeTopY)} fill="var(--color-steel)" fillOpacity={0.3} stroke="var(--color-ink)" strokeWidth={1.5} />
          <rect x={mx(-design.coreWidth / 2)} y={my(windowBotY)} width={mx(design.coreWidth / 2) - mx(-design.coreWidth / 2)} height={my(yokeBotY) - my(windowBotY)} fill="var(--color-steel)" fillOpacity={0.3} stroke="var(--color-ink)" strokeWidth={1.5} />

          {limbXmm.map((cxmm, i) => (
            <g key={i}>
              <CoilHalfSectionShapes design={design} params={params} b={b} scale={fit.scale} originX={mx(cxmm)} originY={coilOriginY} />
              <g transform={`translate(${2 * mx(cxmm)},0) scale(-1,1)`}>
                <CoilHalfSectionShapes design={design} params={params} b={b} scale={fit.scale} originX={mx(cxmm)} originY={coilOriginY} showInsulation={false} />
              </g>
            </g>
          ))}

          {/* Full clearance and axial-height set, centre phase only. */}
          <CoilHalfSectionDimensions
            design={design} params={params} b={b} scale={fit.scale} originX={mx(0)} originY={coilOriginY}
            arrowId={arrowId} radialDimY={radialDimY} axialDimX0={axialDimX0}
          />
          <DimensionHorizontal x1={mx(tankLeftMm)} x2={mx(tankRightMm)} featureY={my(0)} dimY={margin.top - 12} label={dimText(design.tankL)} arrowId={arrowId} />
          <DimensionVertical y1={my(0)} y2={my(tankBotY)} featureX={mx(tankRightMm)} dimX={mx(tankRightMm) + 14} label={dimText(design.tankH)} arrowId={arrowId} />
          <DimensionHorizontal x1={mx(limbXmm[0])} x2={mx(limbXmm[1])} featureY={my(yokeTopY)} dimY={my(yokeTopY) - 14} label={dimText(design.cc)} arrowId={arrowId} />

          {overhang > 0.5 && (
            <text x={box.w / 2} y={box.h - 16} textAnchor="middle" className="font-mono" fontSize={6} fill="var(--color-alert)">
              Outer HV coil overhangs the drawn tank wall by {overhang.toFixed(0)} mm -- see note
            </text>
          )}
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[10px] text-ink2 leading-snug mb-2">
            Every clearance dimensioned on the centre phase applies equally to the outer two: same design, same
            geometry, repeating the same six numbers three times would add nothing.
          </p>
          <DataRow label="Tank Inside Length x Height" value={`${Math.round(design.tankL)} x ${Math.round(design.tankH)}`} unit="mm" />
          <DataRow label="Limb Centre Distance" value={design.cc.toFixed(1)} unit="mm" />
          <DataRow label="Core-to-LV Clearance" value={String(params.coreLvClr)} unit="mm" />
          <DataRow label="LV Radial Build" value={design.lvRadial.toFixed(1)} unit="mm" />
          <DataRow label="LV-to-HV Gap" value={String(params.lvHvClr)} unit="mm" />
          <DataRow label="HV Radial Build" value={design.hvRadial.toFixed(1)} unit="mm" />
          {overhang > 0.5 && (
            <p className="text-[10px] text-alert leading-snug pt-2">
              The outer limb's HV coil (centred on cc = {design.cc.toFixed(0)} mm, extending {b.xHvOut.toFixed(0)} mm
              further) reaches {outerReach.toFixed(0)} mm from centre, past the tank half-length of
              {' '}{(design.tankL / 2).toFixed(0)} mm that tankL = coreWidth + 2*endTankClr draws -- an overhang of
              {' '}{overhang.toFixed(0)} mm. tankW correctly sizes off hvOD; tankL does not add the coil's own radial
              build past the bare core the way tankW does. Worth checking against the engine's tankL formula.
            </p>
          )}
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '20L')} title="Cross-Sectional Drawing, Longitudinal" rev={project?.revision ?? 0}
        sheet={20} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}
