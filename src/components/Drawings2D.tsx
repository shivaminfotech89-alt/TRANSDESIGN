import React, { useId } from 'react';
import { stepWidths, stampingSchedule, coreCuttingChart } from '@/packages/engine';
import { Card, DataRow, thCls, tdCls } from './ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
  drawingNo, ratingLabel,
} from './drawings/DrawingPrimitives';
import { PART_NUMBERS } from './drawings/partNumbers';
import { OrthographicDrawing } from './drawings/OrthographicDrawing';
import { LvWindingDrawing, HvWindingDrawing, TapWindingDrawing } from './drawings/WindingDrawings';
import { InsulationDrawing, InternalAssemblyDrawing, LongitudinalSectionDrawing } from './drawings/SectionDrawings';
import { TankFabricationDrawing, FinOrRadiatorDrawing } from './drawings/TankDrawings';
import { BushingLayoutDrawing, AccessoryLayoutDrawing, LeadArrangementDrawing } from './drawings/LayoutDrawings';
import { NamePlateDrawing } from './drawings/NamePlateDrawing';
import { ExplodedAssemblyDrawing } from './drawings/ExplodedAssemblyDrawing';

export interface Drawings2DProps {
  design: any;
  params: any;
  project: any;
}

/** Two genuinely different "construction" axes exist on a core, and a
 *  drawing that only shows one of them under the plain label "Construction"
 *  reads as though the other never changed anything -- confirmed directly:
 *  selecting Construction B left drawing 6's own "Construction" field
 *  reading "stepLap" (params.coreType, the whole-core fabrication method,
 *  step-lap laminated versus amorphous wound) unchanged, because that
 *  field was never about plate cutting pattern in the first place.
 *  PLATE_CONSTRUCTION_LABEL is the OTHER axis, always shown under its own
 *  name, in plain words rather than the raw "A"/"B" the engine uses
 *  internally -- a reader of a drawing should not need to know the
 *  engine's own option keys to know what was selected. */
const PLATE_CONSTRUCTION_LABEL: Record<string, string> = {
  A: 'Master mitre cut',
  B: 'V-notch cut',
  C: 'Diamond cut',
};
const plateConstructionLabel = (coreConstruction: string) =>
  PLATE_CONSTRUCTION_LABEL[coreConstruction] || coreConstruction;

/** CALIBRATION.md section 54: joint stacking is now independent of plate
 *  cut geometry above -- its own label, shown alongside the cut geometry
 *  rather than folded into it, for the same reason PLATE_CONSTRUCTION_LABEL
 *  exists: a reader should not need the engine's own option keys. */
const JOINT_STACKING_LABEL: Record<string, string> = {
  staggered: 'Staggered joints',
  continuous: 'Continuous joints',
};
const jointStackingLabel = (jointStacking: string) =>
  JOINT_STACKING_LABEL[jointStacking] || jointStacking || 'Staggered joints';

/**
 * DRAWINGS.md, "Start with the universal requirements" -- this file applies
 * the three universal pieces (DrawingPrimitives.tsx: dimension lines, the
 * title block, the fit-to-viewBox scale) to the drawings that already
 * existed, plus the orthographic set (1 to 5, DrawingPrimitives.tsx's
 * neighbour OrthographicDrawing.tsx). The rest of DRAWINGS.md's twenty-one
 * are future work, built one at a time on top of this.
 */

/** DRAWINGS.md, drawing 6: front view of the three-limb core, two yokes,
 *  three limbs, centre lines. A limb's front-view silhouette is its own
 *  circle diameter (dCore); the yoke bands are yokeDepth tall, coreHeight
 *  itself being defined as Hw + 2*yokeDepth, so the three stack exactly.
 *  Limb width and the core circle diameter dimensioned on drawing 7 read
 *  the same design.dCore -- one field, not two figures that could drift. */
export function CoreDrawing({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  const box = { w: 380, h: 420 };
  const margin = { side: 50, top: 66, bottom: 30, right: 70 };
  const fit = fitToViewBox(
    design.coreWidth, design.coreHeight,
    box.w - margin.side - margin.right, box.h - margin.top - margin.bottom, 10,
  );
  const originX = margin.side + fit.offsetX, originY = margin.top + fit.offsetY;
  const coreWidthPx = design.coreWidth * fit.scale, coreHeightPx = design.coreHeight * fit.scale;
  const yokeDepthPx = design.yokeDepth * fit.scale, HwPx = design.Hw * fit.scale;
  const dCorePx = design.dCore * fit.scale, ccPx = design.cc * fit.scale;

  const topYokeY = originY, limbY = originY + yokeDepthPx, bottomYokeY = limbY + HwPx;
  const centerX = originX + coreWidthPx / 2;
  const limbXpx = [centerX - ccPx, centerX, centerX + ccPx];

  return (
    <Card title="Core Drawing" subtitle={`Drawing ${drawingNo(project, '06')} · front view`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />

          <rect x={originX} y={topYokeY} width={coreWidthPx} height={yokeDepthPx} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
          <rect x={originX} y={bottomYokeY} width={coreWidthPx} height={yokeDepthPx} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
          {limbXpx.map((x, i) => (
            <rect key={i} x={x - dCorePx / 2} y={limbY} width={dCorePx} height={HwPx} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
          ))}

          {limbXpx.map((x, i) => (
            <line key={`cl${i}`} x1={x} y1={originY - 8} x2={x} y2={originY + coreHeightPx + 8} stroke="var(--color-copper)" strokeWidth={0.5} strokeDasharray="6 2 1 2" />
          ))}
          <line x1={originX - 8} y1={originY + coreHeightPx / 2} x2={originX + coreWidthPx + 8} y2={originY + coreHeightPx / 2} stroke="var(--color-copper)" strokeWidth={0.5} strokeDasharray="6 2 1 2" />

          {/* Stacked in the gutter above the core: limb width, limb centre
              distance, window width -- nearest to furthest, matching drawing
              7's chain-dimension convention. */}
          <DimensionHorizontal x1={limbXpx[1] - dCorePx / 2} x2={limbXpx[1] + dCorePx / 2} featureY={limbY} dimY={topYokeY - 14} label={dimText(design.dCore)} arrowId={arrowId} />
          <DimensionHorizontal x1={limbXpx[0]} x2={limbXpx[1]} featureY={topYokeY} dimY={topYokeY - 28} label={dimText(design.cc)} arrowId={arrowId} />
          <DimensionHorizontal x1={limbXpx[0] + dCorePx / 2} x2={limbXpx[1] - dCorePx / 2} featureY={limbY} dimY={topYokeY - 42} label={dimText(design.Ww)} arrowId={arrowId} />

          {/* Window height, inside the gap between two limbs. */}
          <DimensionVertical
            y1={limbY} y2={limbY + HwPx} featureX={limbXpx[0] + dCorePx / 2}
            dimX={(limbXpx[0] + limbXpx[1]) / 2} label={dimText(design.Hw)} arrowId={arrowId}
          />

          {/* Right-hand gutter: yoke depth, then overall core height. */}
          <DimensionVertical y1={topYokeY} y2={topYokeY + yokeDepthPx} featureX={originX + coreWidthPx} dimX={originX + coreWidthPx + 16} label={dimText(design.yokeDepth)} arrowId={arrowId} />
          <DimensionVertical y1={originY} y2={originY + coreHeightPx} featureX={originX + coreWidthPx} dimX={originX + coreWidthPx + 32} label={dimText(design.coreHeight)} arrowId={arrowId} />

          {/* Below: overall core width. */}
          <DimensionHorizontal x1={originX} x2={originX + coreWidthPx} featureY={originY + coreHeightPx} dimY={originY + coreHeightPx + 16} label={dimText(design.coreWidth)} arrowId={arrowId} />

          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <DataRow label="Core Type" value={params.coreType} />
          <DataRow label="Plate Construction" value={plateConstructionLabel(params.coreConstruction)} />
          <DataRow label="Steps" value={String(params.steps)} />
          <DataRow label="Grade" value={design.grade.name} />
          <DataRow label="Net Core Area" value={design.aNet.toFixed(1)} unit="cm²" />
          <DataRow label="Gross Core Area" value={design.aGross.toFixed(1)} unit="cm²" />
          <DataRow label="Core Mass" value={design.wCore.toFixed(1)} unit="kg" />
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '06')} title="Core Drawing" rev={project?.revision ?? 0}
        sheet={6} totalSheets={23} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.grade.name} partNumber={PART_NUMBERS.core}
      />
    </Card>
  );
}

/** DRAWINGS.md, drawing 7: cross-section through one limb, circumscribing
 *  circle dashed in copper, every pocket a rectangle, widest at the stack
 *  centre, mirrored. Dimensioned: the core circle diameter, and the width
 *  of every pocket -- chain-dimensioned in a gutter below the circle
 *  (extension lines run from each pocket's own edges down to its own
 *  stacked line), the standard way a multi-step profile is dimensioned
 *  when the steps are contiguous and there is no gap to slot a local
 *  dimension into. Widest (row 0, centre) sits nearest the circle since
 *  its own extension lines are shortest; each pocket outward needs a
 *  longer reach and nests inside the one above it because it is also
 *  narrower, so none of the stacked lines cross. The table beside it still
 *  gives every row's exact figures, per "Beside it: pocket number, width,
 *  stack per side". */
export function CoreCrossSection({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  const steps = stepWidths(params.steps, design.dCore, params.stepIncrement);
  const nRows = steps.rows.length;
  const stackGap = 9;
  const box = { w: 340, h: 300 + nRows * stackGap };
  const dimGutter = { right: 46, bottom: 24 + nRows * stackGap };
  const fit = fitToViewBox(design.dCore, design.dCore, box.w - dimGutter.right, box.h - dimGutter.bottom, 20);
  const cx = fit.offsetX + (design.dCore * fit.scale) / 2;
  const cy = fit.offsetY + (design.dCore * fit.scale) / 2;
  const Rpx = (design.dCore / 2) * fit.scale;

  const rects: { x: number; y: number; w: number; h: number }[] = [];
  // One representative rectangle per row (the upper mirrored instance, or
  // row 0 itself), used as the width dimension's anchor.
  const upperRects: { x: number; y: number; w: number; h: number }[] = [];
  steps.rows.forEach((row: any, i: number) => {
    const prevH = i === 0 ? 0 : steps.rows[i - 1].halfH;
    const w = row.w * fit.scale;
    const x = cx - w / 2;
    const h = row.t * fit.scale;
    if (i === 0) {
      const rect = { x, y: cy - h / 2, w, h };
      rects.push(rect);
      upperRects.push(rect);
    } else {
      const yTop = prevH * fit.scale;
      const upper = { x, y: cy - yTop - h, w, h };
      const lower = { x, y: cy + yTop, w, h };
      rects.push(upper, lower);
      upperRects.push(upper);
    }
  });

  const diaDimX = cx + Rpx + 20;
  const gutterStart = cy + Rpx + 16;

  return (
    <Card title="Core Cross-Section" subtitle={`Drawing ${drawingNo(project, '07')} · ${params.steps} steps, ${(steps.util * 100).toFixed(1)}% utilisation`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <circle cx={cx} cy={cy} r={Rpx} fill="none" stroke="var(--color-copper)" strokeDasharray="5 2 1 2" strokeWidth={0.75} />
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
          ))}
          <line x1={cx - Rpx - 6} y1={cy} x2={cx + Rpx + 6} y2={cy} stroke="var(--color-copper)" strokeWidth={0.5} strokeDasharray="6 2 1 2" />
          <line x1={cx} y1={cy - Rpx - 6} x2={cx} y2={cy + Rpx + 6} stroke="var(--color-copper)" strokeWidth={0.5} strokeDasharray="6 2 1 2" />

          <DimensionVertical
            y1={cy - Rpx} y2={cy + Rpx} featureX={cx + Rpx} dimX={diaDimX}
            label={dimText(design.dCore, { diameter: true })} arrowId={arrowId}
          />
          {steps.rows.map((row: any, i: number) => {
            const r = upperRects[i];
            return (
              <DimensionHorizontal
                key={i}
                x1={r.x} x2={r.x + r.w} featureY={r.y + r.h / 2} dimY={gutterStart + i * stackGap}
                label={dimText(row.w, { decimals: 1 })} arrowId={arrowId} fontSize={5.5}
              />
            );
          })}
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-3">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCls}>Pocket</th>
                <th className={`${thCls} text-right`}>Width</th>
                <th className={`${thCls} text-right`}>Stack per Side</th>
              </tr>
            </thead>
            <tbody>
              {steps.rows.map((row: any, i: number) => (
                <tr key={i}>
                  <td className={`${tdCls} text-[11px] text-ink2`}>{i + 1}</td>
                  <td className={`${tdCls} text-right font-mono text-[11px]`}>{row.w.toFixed(1)} mm</td>
                  <td className={`${tdCls} text-right font-mono text-[11px] text-steel`}>{i === 0 ? 'centre, full depth' : `${row.halfH.toFixed(1)} mm half-height`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <DataRow label="Core Diameter" value={design.dCore.toFixed(1)} unit="mm" />
          <DataRow label="Utilisation Factor" value={(steps.util * 100).toFixed(2)} unit="%" />
          <DataRow label="Plate Construction" value={plateConstructionLabel(params.coreConstruction)} />
          <p className="text-[10px] text-steel leading-snug">
            The stepped cross-section itself does not change between plate constructions -- the cutting pattern
            affects the limb and yoke plates' own edges, not the stepped-circle shape every construction shares.
          </p>
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '07')} title="Stepped Core Cross-Section" rev={project?.revision ?? 0}
        sheet={7} totalSheets={23} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.grade.name} partNumber={PART_NUMBERS.core}
      />
    </Card>
  );
}

/** DRAWINGS.md, drawing 21: both laminations for the widest (centre)
 *  pocket, side by side -- every other pocket's figures are in the
 *  schedule beneath, unchanged.
 *
 *  Limb: a trapezoid with 45-degree mitres both ends -- outer edge Hw+2w,
 *  inner edge Hw, so the mitre rise over its run of w is also w, exactly
 *  45 degrees.
 *
 *  Yoke: the same construction (outer 2C+w, inner 2C-w, same run w, same
 *  45 degrees), with a centre limb V notch cut into the inner edge --
 *  schematic only, the engine holds no notch profile, so it is drawn but
 *  not dimensioned.
 *
 *  Cut lines dashed, per the spec, since this sheet marks where the blade
 *  goes rather than showing an assembled edge. */
export function StampingSchedule({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  const steps = stepWidths(params.steps, design.dCore, params.stepIncrement);
  const sched = stampingSchedule(design, steps, params);
  const isB = sched.construction === 'B';
  const isC = sched.construction === 'C';

  // CALIBRATION.md section 52: the reference PDF Construction B was fitted
  // from (section 35) carries three drawn outlines above its own table --
  // V-NOTCH, OUTER, CENTRE, the shapes the core shop actually cuts from --
  // not a table alone. This used to return early with tables only ("no
  // schematic here"); coreConstructionB() now carries outerEdge/innerEdge
  // per plate (section 52) precisely so this could stop being true, the
  // same principle CoreCuttingChart's own note still applies to drawing 22
  // (a document that is only ever numbers, unlike this one).
  if (isB) {
    const bRow = sched.rows[0]; // widest pocket -- other pockets noted below
    const w = bRow.w;
    const vOuter = bRow.V.outerEdge, vInner = bRow.V.innerEdge;
    const oOuter = bRow.O.outerEdge, oInner = bRow.O.innerEdge;
    const cOuter = bRow.C.outerEdge, cInner = bRow.C.innerEdge;

    const gapMM = w * 0.55;
    const box = { w: 640, h: 200 };
    const margin = { top: 40, bottom: 40, side: 24 };
    const fit = fitToViewBox(
      vOuter + gapMM + oOuter + gapMM + cOuter, w,
      box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 8,
    );
    const h = w * fit.scale;
    const top = margin.top + fit.offsetY;
    const bottom = top + h;
    const startX = margin.side + fit.offsetX;

    // V-notch plate (yoke): trapezoid mitred both ends, outer edge on top,
    // V notch cut into the centre of the inner (bottom) edge for the
    // centre limb. Real geometry (DRAWINGS.md, drawing 21): depth W/2 (W
    // is this pocket's own plate width, w), flanks at 45 and 135 degrees.
    // tan(45) = 1, so the notch's half-width at the inner edge equals its
    // own depth -- both W/2 -- which is why notchHalfW and notchDepth
    // below are the same figure, and why the notch's full opening at the
    // inner edge (2 * halfW) comes out to exactly W, the plate's own width.
    // fit.scale is uniform in both drawn axes (h = w * fit.scale, same
    // fit.scale used for every length below), so this drawn notch really
    // is 45/135 degrees, not a schematic angle.
    const vOuterPx = vOuter * fit.scale, vInnerPx = vInner * fit.scale;
    const vCx = startX + vOuterPx / 2;
    const notchHalfW = h / 2, notchDepth = h / 2;
    const vApexY = bottom - notchDepth;
    const vPoints = [
      [vCx - vOuterPx / 2, top], [vCx + vOuterPx / 2, top],
      [vCx + vInnerPx / 2, bottom], [vCx + notchHalfW, bottom],
      [vCx, vApexY], [vCx - notchHalfW, bottom],
      [vCx - vInnerPx / 2, bottom],
    ].map((p) => p.join(',')).join(' ');

    // Outer plate (outer limb): plain trapezoid mitred both ends, no notch.
    const oOuterPx = oOuter * fit.scale, oInnerPx = oInner * fit.scale;
    const oStartX = startX + vOuterPx + gapMM * fit.scale;
    const oCx = oStartX + oOuterPx / 2;
    const oPoints = [
      [oCx - oOuterPx / 2, top], [oCx + oOuterPx / 2, top],
      [oCx + oInnerPx / 2, bottom], [oCx - oInnerPx / 2, bottom],
    ].map((p) => p.join(',')).join(' ');

    // Centre plate (centre limb): hexagonal, pointed at both ends -- the
    // chevron apex derived from the SAME notch geometry above (depth W/2,
    // 45/135 degree flanks), not a separate proportion, so the point is
    // the photonegative of the V-notch plate's own cutout and the two
    // mate by construction. Protrusion depth = notchDepth (same W/2);
    // the protrusion's base spans the plate's full drawn height h, which
    // at this pocket's own scale is W -- exactly the notch's own opening
    // width above. cFlatMM (the straight run between the two points) is
    // cOuter less one W/2 protrusion at each end -- not cInner, which is
    // the plain-mitre trapezoid figure (cOuter - 2w) engine.js's own
    // coreConstructionB() still reports for the mass-envelope check in
    // engine.test.mjs; that figure describes a different shape (a plain
    // trapezoid) from the chevron actually drawn here, so it is not the
    // right length for this line.
    const cOuterPx = cOuter * fit.scale;
    const cPointDepth = h / 2;
    const cFlatPx = cOuterPx - 2 * cPointDepth;
    const cFlatMM = cOuter - w;
    const cStartX = oStartX + oOuterPx + gapMM * fit.scale;
    const cMidY = top + h / 2;
    const cPoints = [
      [cStartX, cMidY],
      [cStartX + cPointDepth, top], [cStartX + cPointDepth + cFlatPx, top],
      [cStartX + cOuterPx, cMidY],
      [cStartX + cPointDepth + cFlatPx, bottom], [cStartX + cPointDepth, bottom],
    ].map((p) => p.join(',')).join(' ');

    return (
      <Card
        title="Core Stamping Schedule"
        subtitle={`Drawing ${drawingNo(project, '21')} · ${sched.thk} mm lamination · ${plateConstructionLabel(params.coreConstruction)}, widest pocket shown`}
      >
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="mx-auto block">
          <DimensionArrow id={arrowId} />
          <polygon points={vPoints} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} strokeDasharray="5 2" />
          <polygon points={oPoints} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} strokeDasharray="5 2" />
          <polygon points={cPoints} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} strokeDasharray="5 2" />
          <text x={vCx} y={top - 22} textAnchor="middle" className="font-display uppercase" fontSize={7} fill="var(--color-ink2)" letterSpacing={0.5}>V-Notch</text>
          <text x={oCx} y={top - 22} textAnchor="middle" className="font-display uppercase" fontSize={7} fill="var(--color-ink2)" letterSpacing={0.5}>Outer</text>
          <text x={(cStartX + cStartX + cOuterPx) / 2} y={top - 22} textAnchor="middle" className="font-display uppercase" fontSize={7} fill="var(--color-ink2)" letterSpacing={0.5}>Centre</text>

          <DimensionHorizontal
            x1={vCx - vOuterPx / 2} x2={vCx + vOuterPx / 2} featureY={top} dimY={top - 14}
            label={dimText(vOuter, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionHorizontal
            x1={vCx - vInnerPx / 2} x2={vCx + vInnerPx / 2} featureY={bottom} dimY={bottom + 14}
            label={dimText(vInner, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionVertical
            y1={top} y2={bottom} featureX={vCx - vOuterPx / 2} dimX={vCx - vOuterPx / 2 - 18}
            label={dimText(w, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionVertical
            y1={bottom} y2={vApexY} featureX={vCx} dimX={vCx + notchHalfW + 22}
            label={dimText(w / 2, { decimals: 1 })} arrowId={arrowId}
          />
          <text x={vCx - notchHalfW / 2 - 3} y={(bottom + vApexY) / 2} textAnchor="end"
            className="font-mono" fontSize={7} fill="var(--color-ink)">45°</text>
          <text x={vCx + notchHalfW / 2 + 3} y={(bottom + vApexY) / 2} textAnchor="start"
            className="font-mono" fontSize={7} fill="var(--color-ink)">135°</text>

          <DimensionHorizontal
            x1={oCx - oOuterPx / 2} x2={oCx + oOuterPx / 2} featureY={top} dimY={top - 14}
            label={dimText(oOuter, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionHorizontal
            x1={oCx - oInnerPx / 2} x2={oCx + oInnerPx / 2} featureY={bottom} dimY={bottom + 14}
            label={dimText(oInner, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionVertical
            y1={top} y2={bottom} featureX={oCx - oOuterPx / 2} dimX={oCx - oOuterPx / 2 - 18}
            label={dimText(w, { decimals: 1 })} arrowId={arrowId}
          />

          <DimensionHorizontal
            x1={cStartX} x2={cStartX + cOuterPx} featureY={top} dimY={top - 14}
            label={dimText(cOuter, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionHorizontal
            x1={cStartX + cPointDepth} x2={cStartX + cPointDepth + cFlatPx} featureY={bottom} dimY={bottom + 14}
            label={dimText(cFlatMM, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionVertical
            y1={top} y2={bottom} featureX={cStartX + cPointDepth} dimX={cStartX + cPointDepth - 18}
            label={dimText(w, { decimals: 1 })} arrowId={arrowId}
          />
          <UnitsNote x={6} y={box.h - 4} />
        </svg>
        <table className="w-full max-w-md mb-3">
          <tbody>
            <DataRow label="Plate Construction" value={plateConstructionLabel(params.coreConstruction)} />
            <DataRow label="No-load loss" value={design.noLoad.toFixed(0)} unit="W" />
            <DataRow label="Rating" value={ratingLabel(params)} />
            <DataRow label="Flux density" value={design.B.toFixed(3)} unit="T" />
          </tbody>
        </table>
        <p className="text-[10px] text-steel mb-1">
          Shapes drawn from the widest pocket (No. {bRow.i}, {w.toFixed(1)} mm) -- the other pockets below are the
          same three shapes at the widths this schedule lists, not a different cutting pattern.
        </p>
        <p className="text-[10px] text-steel mb-3">
          V notch and chevron point drawn to real geometry: depth W/2 (W is this pocket's own plate width),
          flanks at 45 and 135 degrees, apex centred on the plate's inner edge -- specified directly, not
          fitted (DRAWINGS.md, drawing 21). The centre plate's own chevron point uses the same depth and
          angle, so the two shapes mate by construction.
        </p>
        <p className="text-[10px] text-steel mb-3">
          This shape does not by itself set the mass below: computed directly, it overstates the reference
          chart's own V-notch total by 5.6 percent (CALIBRATION.md section 53), so the plate mass still uses
          the fitted MITRE_K coefficient, not the notch area shown here.
        </p>
        <p className="text-[10px] text-steel mb-3">
          Construction B has one known cutting model (CALIBRATION.md section 35), not a separate estimating
          approximation -- this schedule uses the same coreConstructionB() call drawing 22's cutting chart does, so
          the two agree exactly rather than differing by the ~2 percent Construction A's own two models do.
        </p>
        {plateTable(sched.rows, 'V-Notch -- Yoke, Top and Bottom', 'V', sched.totalV)}
        {plateTable(sched.rows, 'Outer -- Two Outer Limbs, Mitred Both Ends', 'O', sched.totalO)}
        {plateTable(sched.rows, 'Centre -- Centre Limb, Mitred Both Ends', 'C', sched.totalC)}
        <table className="w-full max-w-md">
          <tbody>
            <tr className="bg-sheetAlt font-semibold">
              <td className={`${tdCls} text-[11px] font-display uppercase tracking-[0.1em] text-ink2`}>Core Total</td>
              <td className={`${tdCls} text-right font-mono text-[13px] text-copper`}>{sched.chartTotal.toFixed(2)} kg</td>
            </tr>
          </tbody>
        </table>
        <TitleBlock
          drawingNo={drawingNo(project, '21')} title="Lamination Stamping and Cutting Schedule" rev={project?.revision ?? 0}
          sheet={22} totalSheets={23} fit={fit} standard={params.standard}
          projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
          material={design.grade.name} partNumber={PART_NUMBERS.core}
        />
      </Card>
    );
  }

  if (isC) {
    // CALIBRATION.md section 54: Construction C, diamond cutting -- flat 90
    // degree cuts, no mitre taper, so unlike Construction A/B's trapezoids
    // above, both plates are plain rectangles: the same length at every
    // point across their own width, not a long edge tapering to a short
    // one. Widest pocket shown, same convention as Construction A/B above.
    const cRow = sched.rows[0];
    const w = cRow.w;
    const limbLen = cRow.limb.length, yokeLen = cRow.yoke.length;

    const gapMM = w * 0.6;
    const box = { w: 520, h: 200 };
    const margin = { top: 40, bottom: 40, side: 24 };
    const fit = fitToViewBox(
      limbLen + gapMM + yokeLen, w,
      box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 8,
    );
    const h = w * fit.scale;
    const top = margin.top + fit.offsetY;
    const bottom = top + h;
    const startX = margin.side + fit.offsetX;

    const limbPx = limbLen * fit.scale;
    const limbCx = startX + limbPx / 2;
    const yokeStartX = startX + limbPx + gapMM * fit.scale;
    const yokePx = yokeLen * fit.scale;
    const yokeCx = yokeStartX + yokePx / 2;

    const staggered = params.jointStacking !== 'continuous'; // engine default, CALIBRATION.md section 54

    return (
      <Card
        title="Core Stamping Schedule"
        subtitle={`Drawing ${drawingNo(project, '21')} · ${sched.thk} mm lamination · ${plateConstructionLabel(params.coreConstruction)}, widest pocket shown`}
      >
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="mx-auto block">
          <DimensionArrow id={arrowId} />
          <rect x={startX} y={top} width={limbPx} height={h} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} strokeDasharray="5 2" />
          <rect x={yokeStartX} y={top} width={yokePx} height={h} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} strokeDasharray="5 2" />
          <text x={limbCx} y={top - 22} textAnchor="middle" className="font-display uppercase" fontSize={7} fill="var(--color-ink2)" letterSpacing={0.5}>Limb</text>
          <text x={yokeCx} y={top - 22} textAnchor="middle" className="font-display uppercase" fontSize={7} fill="var(--color-ink2)" letterSpacing={0.5}>Yoke</text>

          <DimensionHorizontal
            x1={startX} x2={startX + limbPx} featureY={top} dimY={top - 14}
            label={dimText(limbLen, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionVertical
            y1={top} y2={bottom} featureX={startX} dimX={startX - 18}
            label={dimText(w, { decimals: 1 })} arrowId={arrowId}
          />

          <DimensionHorizontal
            x1={yokeStartX} x2={yokeStartX + yokePx} featureY={top} dimY={top - 14}
            label={dimText(yokeLen, { decimals: 1 })} arrowId={arrowId}
          />
          <DimensionVertical
            y1={top} y2={bottom} featureX={yokeStartX + yokePx} dimX={yokeStartX + yokePx + 18}
            label={dimText(w, { decimals: 1 })} arrowId={arrowId}
          />
          <UnitsNote x={6} y={box.h - 4} />
        </svg>
        <table className="w-full max-w-md mb-3">
          <tbody>
            <DataRow label="Plate Construction" value={plateConstructionLabel(params.coreConstruction)} />
            <DataRow label="Joint Stacking" value={jointStackingLabel(params.jointStacking)} />
            {staggered && <DataRow label="Stacking Offset" value={params.stackingOffset ?? 10} unit="mm" />}
            <DataRow label="No-load loss" value={design.noLoad.toFixed(0)} unit="W" />
            <DataRow label="Rating" value={ratingLabel(params)} />
            <DataRow label="Flux density" value={design.B.toFixed(3)} unit="T" />
          </tbody>
        </table>
        <p className="text-[10px] text-steel mb-1">
          Shapes drawn from the widest pocket (No. {cRow.i}, {w.toFixed(1)} mm) -- the other pockets below are the
          same two shapes at the widths this schedule lists, not a different cutting pattern.
        </p>
        <p className="text-[10px] text-steel mb-3">
          Flat 90 degree cuts, no mitre -- both plates are rectangles, the same length across their own full
          width, not a tapered trapezoid (CALIBRATION.md section 54). No reference chart exists for this
          construction; the length is derived from Construction A's own already-validated mitre relationship
          with the taper removed, not fitted or invented.
        </p>
        <p className="text-[10px] text-steel mb-3">
          {staggered
            ? `Joints staggered ${params.stackingOffset ?? 10} mm between successive layers (designer-specified, not charted).`
            : 'Joints continuous -- no offset between successive layers.'} Stacking changes where the joint
          falls, not the mass below (confirmed directly, CALIBRATION.md section 54) -- it is not known
          whether it changes no-load loss, which this engine does not model either way.
        </p>
        {plateTable(sched.rows, 'Limb -- Three Limbs, Flat Cut', 'limb', sched.totalLimb)}
        {plateTable(sched.rows, 'Yoke -- Top and Bottom, Flat Cut', 'yoke', sched.totalYoke)}
        <table className="w-full max-w-md">
          <tbody>
            <tr className="bg-sheetAlt font-semibold">
              <td className={`${tdCls} text-[11px] font-display uppercase tracking-[0.1em] text-ink2`}>Core Total</td>
              <td className={`${tdCls} text-right font-mono text-[13px] text-copper`}>{sched.chartTotal.toFixed(2)} kg</td>
            </tr>
          </tbody>
        </table>
        <TitleBlock
          drawingNo={drawingNo(project, '21')} title="Lamination Stamping and Cutting Schedule" rev={project?.revision ?? 0}
          sheet={22} totalSheets={23} fit={fit} standard={params.standard}
          projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
          material={design.grade.name} partNumber={PART_NUMBERS.core}
        />
      </Card>
    );
  }

  const centre = sched.rows[0];

  const gapMM = centre.limbLong * 0.18;
  const box = { w: 560, h: 170 };
  const margin = { top: 34, bottom: 34, side: 26 };
  const fit = fitToViewBox(
    centre.limbLong + gapMM + centre.yokeLong, centre.w,
    box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 8,
  );
  const h = centre.w * fit.scale;
  const top = margin.top + fit.offsetY;
  const bottom = top + h;
  const startX = margin.side + fit.offsetX;

  const limbTopW = centre.limbLong * fit.scale, limbBotW = centre.limbShort * fit.scale;
  const limbCx = startX + limbTopW / 2;
  const limbPoints = [
    [limbCx - limbTopW / 2, top], [limbCx + limbTopW / 2, top],
    [limbCx + limbBotW / 2, bottom], [limbCx - limbBotW / 2, bottom],
  ].map((p) => p.join(',')).join(' ');

  const yokeTopW = centre.yokeLong * fit.scale, yokeBotW = centre.yokeShort * fit.scale;
  const yokeStartX = startX + limbTopW + gapMM * fit.scale;
  const yokeCx = yokeStartX + yokeTopW / 2;
  const notchHalfW = yokeBotW * 0.08, notchDepth = h * 0.4;
  const yokePoints = [
    [yokeCx - yokeTopW / 2, top], [yokeCx + yokeTopW / 2, top],
    [yokeCx + yokeBotW / 2, bottom], [yokeCx + notchHalfW, bottom],
    [yokeCx, bottom - notchDepth], [yokeCx - notchHalfW, bottom],
    [yokeCx - yokeBotW / 2, bottom],
  ].map((p) => p.join(',')).join(' ');

  return (
    <Card title="Core Stamping Schedule" subtitle={`Drawing ${drawingNo(project, '21')} · ${sched.thk} mm lamination, limb and yoke shown for the widest pocket`}>
      <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="mx-auto block">
        <DimensionArrow id={arrowId} />
        <polygon points={limbPoints} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} strokeDasharray="5 2" />
        <polygon points={yokePoints} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} strokeDasharray="5 2" />
        <text x={limbCx} y={top - 22} textAnchor="middle" className="font-display uppercase" fontSize={7} fill="var(--color-ink2)" letterSpacing={0.5}>Limb</text>
        <text x={yokeCx} y={top - 22} textAnchor="middle" className="font-display uppercase" fontSize={7} fill="var(--color-ink2)" letterSpacing={0.5}>Yoke</text>

        <DimensionHorizontal
          x1={limbCx - limbTopW / 2} x2={limbCx + limbTopW / 2} featureY={top} dimY={top - 14}
          label={dimText(centre.limbLong, { decimals: 1 })} arrowId={arrowId}
        />
        <DimensionHorizontal
          x1={limbCx - limbBotW / 2} x2={limbCx + limbBotW / 2} featureY={bottom} dimY={bottom + 14}
          label={dimText(centre.limbShort, { decimals: 1 })} arrowId={arrowId}
        />
        <DimensionVertical
          y1={top} y2={bottom} featureX={limbCx - limbTopW / 2} dimX={limbCx - limbTopW / 2 - 18}
          label={dimText(centre.w, { decimals: 1 })} arrowId={arrowId}
        />

        <DimensionHorizontal
          x1={yokeCx - yokeTopW / 2} x2={yokeCx + yokeTopW / 2} featureY={top} dimY={top - 14}
          label={dimText(centre.yokeLong, { decimals: 1 })} arrowId={arrowId}
        />
        <DimensionHorizontal
          x1={yokeCx - yokeBotW / 2} x2={yokeCx + yokeBotW / 2} featureY={bottom} dimY={bottom + 14}
          label={dimText(centre.yokeShort, { decimals: 1 })} arrowId={arrowId}
        />
        <DimensionVertical
          y1={top} y2={bottom} featureX={yokeCx + yokeTopW / 2} dimX={yokeCx + yokeTopW / 2 + 18}
          label={dimText(centre.w, { decimals: 1 })} arrowId={arrowId}
        />
        <UnitsNote x={6} y={box.h - 4} />
      </svg>
      <table className="w-full max-w-xs mt-2">
        <tbody>
          <DataRow label="Plate Construction" value={plateConstructionLabel(params.coreConstruction)} />
          <DataRow label="Joint Stacking" value={jointStackingLabel(params.jointStacking)} />
        </tbody>
      </table>
      <p className="text-[10px] text-steel mt-1">
        Centre limb V notch shown schematically on the yoke's inner edge -- its profile is not held by the engine.
      </p>
      <p className="text-[10px] text-steel mt-1">
        Mass below is from the continuous stack depth per step -- use this schedule for estimating. Drawing 22's
        cutting chart totals mass from whole sheet counts, the physical quantity to order steel against; the two
        totals differ by about 2 percent for that reason (real integer sheets vs. a continuous approximation), not
        because either is wrong.
      </p>
      <p className="text-[10px] text-steel mt-1">
        Joint stacking (CALIBRATION.md section 54) does not change the limb/yoke totals shown on this sheet --
        the 0/10/20 mm shift only appears in drawing 22's own Plate B breakdown, which this continuous-stack
        approximation does not model. Stacking does not change mass either way, and it is not known whether
        it changes no-load loss, which this engine does not model.
      </p>
      <table className="w-full mt-3">
        <thead>
          <tr>
            <th className={thCls}>Pocket</th>
            <th className={`${thCls} text-right`}>Width</th>
            <th className={`${thCls} text-right`}>Stack</th>
            <th className={`${thCls} text-right`}>Sheets</th>
            <th className={`${thCls} text-right`}>Limb Outer x Inner</th>
            <th className={`${thCls} text-right`}>Yoke Outer x Inner</th>
            <th className={`${thCls} text-right`}>Mass</th>
          </tr>
        </thead>
        <tbody>
          {sched.rows.map((r: any) => (
            <tr key={r.i}>
              <td className={`${tdCls} text-[11px] text-ink2`}>{r.i}</td>
              <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.w.toFixed(1)}</td>
              <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.stack.toFixed(1)}</td>
              <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.nSheets}</td>
              <td className={`${tdCls} text-right font-mono text-[10px] text-steel`}>{r.limbLong.toFixed(0)} x {r.limbShort.toFixed(0)}</td>
              <td className={`${tdCls} text-right font-mono text-[10px] text-steel`}>{r.yokeLong.toFixed(0)} x {r.yokeShort.toFixed(0)}</td>
              <td className={`${tdCls} text-right font-mono text-[11px] font-semibold text-ink`}>{r.mass.toFixed(1)} kg</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-sheetAlt font-semibold">
          <tr>
            <td colSpan={3} className={`${tdCls} text-right text-[10px] font-display uppercase tracking-[0.1em] text-ink2`}>Total</td>
            <td className={`${tdCls} text-right font-mono text-[11px]`}>{sched.totalSheets}</td>
            <td className={tdCls} colSpan={2} />
            <td className={`${tdCls} text-right font-mono text-[11px] text-copper`}>{sched.totalMass.toFixed(1)} kg</td>
          </tr>
        </tfoot>
      </table>
      <TitleBlock
        drawingNo={drawingNo(project, '21')} title="Lamination Stamping and Cutting Schedule" rev={project?.revision ?? 0}
        sheet={22} totalSheets={23} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.grade.name} partNumber={PART_NUMBERS.core}
      />
    </Card>
  );
}

/** DRAWINGS.md, drawing 22: the core CUTTING CHART -- a different document
 *  from drawing 21's cutting SCHEDULE above, not a restyling of it.
 *  Drawing 21 models limb and yoke from the mitred long/short edge
 *  average, two plate types; this is the layout the real chart it is
 *  checked against (CALIBRATION.md section 12) actually uses -- three
 *  plate types, laid out as three tables, no per-pocket geometric
 *  illustration, since every dimension the real chart carries is already
 *  a number in its own table, not something a schematic would add to.
 *  No dimension-line SVG for the same reason DRAWINGS.md's own universal
 *  requirement exists to prevent: a picture without its numbers is
 *  useless, and this document is only ever numbers. */
/** Shared by CoreCuttingChart (drawing 22) and StampingSchedule (drawing 21,
 *  Construction B only) -- both read the same coreConstructionB() rows, so
 *  both render them the same way rather than each keeping its own copy
 *  that could drift out of step with the other (CALIBRATION.md section
 *  35/47, the same "two documents must agree" principle as wCore vs the
 *  cutting chart). */
function plateTable(rows: any[], title: string, key: 'A' | 'B' | 'C' | 'V' | 'O' | 'limb' | 'yoke', total: number, note?: string) {
  return (
    <div className="mb-3">
      <div className="text-[11px] font-display uppercase tracking-[0.12em] text-copper mb-1">{title}</div>
      {note && <p className="text-[10px] text-steel mb-1">{note}</p>}
      <table className="w-full">
        <thead>
          <tr>
            <th className={thCls}>Step</th>
            <th className={`${thCls} text-right`}>Length</th>
            <th className={`${thCls} text-right`}>Width</th>
            <th className={`${thCls} text-right`}>Weight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.i}>
              <td className={`${tdCls} text-[11px] text-ink2`}>{r.i}</td>
              <td className={`${tdCls} text-right font-mono text-[11px]`}>{r[key].length.toFixed(1)}</td>
              <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.w.toFixed(1)}</td>
              <td className={`${tdCls} text-right font-mono text-[11px]`}>{r[key].weight.toFixed(2)} kg</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-sheetAlt font-semibold">
          <tr>
            <td colSpan={3} className={`${tdCls} text-right text-[10px] font-display uppercase tracking-[0.1em] text-ink2`}>Total</td>
            <td className={`${tdCls} text-right font-mono text-[11px] text-copper`}>{total.toFixed(2)} kg</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function CoreCuttingChart({ design, params, project }: Drawings2DProps) {
  const chart = coreCuttingChart(design, params);
  const isB = chart.construction === 'B';
  const isC = chart.construction === 'C';
  // CALIBRATION.md section 54: joint stacking is independent of plate cut
  // geometry -- read from params directly (chart.jointStacking only exists
  // on Construction A's own return) so the UI reads the same source
  // regardless of which construction is active.
  const staggered = params.jointStacking !== 'continuous';

  return (
    <Card
      title="Core Cutting Chart"
      subtitle={`Drawing ${drawingNo(project, '22')} · ${chart.thk} mm lamination · ${plateConstructionLabel(params.coreConstruction)}`}
    >
      <table className="w-full max-w-md mb-3">
        <tbody>
          <DataRow label="Plate Construction" value={plateConstructionLabel(params.coreConstruction)} />
          <DataRow label="Joint Stacking" value={jointStackingLabel(params.jointStacking)} />
          {staggered && !isB && <DataRow label="Stacking Offset" value={isC ? (params.stackingOffset ?? 10) : '0 / 10 / 20 (chart split)'} unit={isC ? 'mm' : undefined} />}
          <DataRow label="No-load loss" value={design.noLoad.toFixed(0)} unit="W" />
          <DataRow label="Rating" value={ratingLabel(params)} />
          <DataRow label="Flux density" value={design.B.toFixed(3)} unit="T" />
        </tbody>
      </table>
      {isB && (
        <p className="text-[10px] text-steel mb-3">
          Joint stacking has no effect on Construction B: the one furnace chart this construction is checked
          against (CALIBRATION.md section 35) shows no shift columns at all, so no staggered V-notch pattern is
          modelled either way.
        </p>
      )}

      {isB ? (
        <>
          {plateTable(chart.rows, 'V-Notch -- Yoke, Top and Bottom', 'V', chart.totalV)}
          {plateTable(chart.rows, 'Outer -- Two Outer Limbs, Mitred Both Ends', 'O', chart.totalO)}
          {plateTable(chart.rows, 'Centre -- Centre Limb, Mitred Both Ends', 'C', chart.totalC)}
        </>
      ) : isC ? (
        <>
          {plateTable(chart.rows, 'Limb -- Three Limbs, Flat Cut', 'limb', chart.totalLimb, 'Flat 90 degree cuts -- no mitre taper, see drawing 21 for the derivation.')}
          {plateTable(
            chart.rows, 'Yoke -- Top and Bottom, Flat Cut', 'yoke', chart.totalYoke,
            staggered
              ? `Every layer's joint offset ${params.stackingOffset ?? 10} mm from the last (designer-specified, not charted). Offset does not change the mass shown.`
              : 'Continuous -- no offset between successive layers.',
          )}
        </>
      ) : (
        <>
          {plateTable(chart.rows, 'Plate A -- Limb, Mitred Both Ends', 'A', chart.totalA)}
          {plateTable(
            chart.rows, 'Plate B -- Half Yoke, Step-Lap', 'B', chart.totalB,
            staggered
              ? "Shift 0/10/20 mm, the 0 mm group carrying half the sheets at each step (the real reference chart's own split, CALIBRATION.md section 12) -- see the shift breakdown below."
              : 'Continuous stacking selected -- all yoke steel is in Plate C this run, so Plate B carries no sheets.',
          )}
          {plateTable(chart.rows, 'Plate C -- Full Yoke, Mitred One End', 'C', chart.totalC)}

          {staggered && (
            <div className="mb-3">
              <div className="text-[11px] font-display uppercase tracking-[0.12em] text-ink2 mb-1">Plate B Shift Breakdown</div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={thCls}>Step</th>
                    <th className={`${thCls} text-right`}>Sheets</th>
                    <th className={`${thCls} text-right`}>Shift 0 mm</th>
                    <th className={`${thCls} text-right`}>Shift 10 mm</th>
                    <th className={`${thCls} text-right`}>Shift 20 mm</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((r: any) => (
                    <tr key={r.i}>
                      <td className={`${tdCls} text-[11px] text-ink2`}>{r.i}</td>
                      <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.B.sheets}</td>
                      <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.B.shift0}</td>
                      <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.B.shift10}</td>
                      <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.B.shift20}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <p className="text-[10px] text-steel mb-3">
        Stacking changes where each layer's joint falls, not the mass above (confirmed directly, CALIBRATION.md
        section 54). Whether it changes no-load loss is an open question this engine does not model either way --
        see section 54's own note on the manufacturer questions this raises.
      </p>

      <table className="w-full max-w-md">
        <tbody>
          <tr className="bg-sheetAlt font-semibold">
            <td className={`${tdCls} text-[11px] font-display uppercase tracking-[0.1em] text-ink2`}>Core Total</td>
            <td className={`${tdCls} text-right font-mono text-[13px] text-copper`}>{chart.chartTotal.toFixed(2)} kg</td>
          </tr>
        </tbody>
      </table>
      <p className="text-[10px] text-steel mt-2">
        Mass above is from whole sheet counts -- the physical quantity. Use this chart for ordering steel. Drawing
        21's stamping schedule totals mass from the continuous stack depth per step instead, for estimating; the
        two totals differ by about 2 percent for that reason (real integer sheets vs. a continuous approximation),
        not because either is wrong.
      </p>
      {isB ? (
        <p className="text-[10px] text-steel mt-2">
          Fitted to the one 1250 kVA (750+500) furnace core chart on file (CALIBRATION.md section 35) -- the
          plate-count structure is confirmed directly by the designer, but the three mitre-deduction coefficients
          were solved to reproduce that one chart's totals exactly, which any three coefficients against three
          totals will do regardless of correctness elsewhere. Not confirmed away from that one chart's own
          proportions.
        </p>
      ) : (
        <p className="text-[10px] text-steel mt-2">
          Fitted to the one 1250 kVA core cutting chart on file (CALIBRATION.md section 12) -- not confirmed at any
          other rating. A second chart, at a different rating, would let these three plate formulas be checked
          rather than assumed to hold away from ratings near 1250 kVA.
        </p>
      )}
      <TitleBlock
        drawingNo={drawingNo(project, '22')} title="Core Cutting Chart" rev={project?.revision ?? 0}
        sheet={23} totalSheets={23} fit={{ scale: 0 } as any} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.grade.name} partNumber={PART_NUMBERS.core}
      />
    </Card>
  );
}

/** All twenty-one of DRAWINGS.md's drawings, in order. Each child below is
 *  one fully self-contained, independently-numbered drawing (see the
 *  drawingNo() calls inside each component), so each gets its own
 *  .drawing-page wrapper -- the print-only rule that keeps a drawing's own
 *  title block and table together and starts the next drawing on a fresh
 *  page (index.css, CALIBRATION.md). On screen .drawing-page is a no-op;
 *  it only does anything under @media print. */
export function Drawings2D({ design, params, project }: Drawings2DProps) {
  // DRAWINGS.md, "Where each drawing appears": "all twenty-one in order,
  // then the dimension schedule and the cutting schedule" -- 1 to 19
  // ascending, then 20's two sheets (Longitudinal, Transverse), then 21
  // and 22 appended last. This array used to group 21/22 (core stamping/
  // cutting) right after 6/7 instead, because "Core: drawings 6, 7 and
  // 21" reads as one section in the register's own prose -- that heading
  // groups them by SUBJECT for the document to read well, it was never a
  // render-order instruction, and the section that IS the render-order
  // instruction ("Where each drawing appears") puts 21/22 at the end. The
  // sheet={N} on each component below already assumed this order (they
  // run 1-23 with no gap); only the array itself was out of step with
  // them.
  const drawings = [
    <OrthographicDrawing key="ga" design={design} params={params} project={project} view="ga" />,
    <OrthographicDrawing key="front" design={design} params={params} project={project} view="front" />,
    <OrthographicDrawing key="side" design={design} params={params} project={project} view="side" />,
    <OrthographicDrawing key="top" design={design} params={params} project={project} view="top" />,
    <OrthographicDrawing key="bottom" design={design} params={params} project={project} view="bottom" />,
    <CoreDrawing key="core" design={design} params={params} project={project} />,
    <CoreCrossSection key="core-xsec" design={design} params={params} project={project} />,
    <LvWindingDrawing key="lv-winding" design={design} params={params} project={project} />,
    <HvWindingDrawing key="hv-winding" design={design} params={params} project={project} />,
    <TapWindingDrawing key="tap-winding" design={design} params={params} project={project} />,
    <InsulationDrawing key="insulation" design={design} params={params} project={project} />,
    <InternalAssemblyDrawing key="internal-assembly" design={design} params={params} project={project} />,
    <TankFabricationDrawing key="tank-fab" design={design} params={params} project={project} />,
    <FinOrRadiatorDrawing key="fin-radiator" design={design} params={params} project={project} />,
    <BushingLayoutDrawing key="bushing-layout" design={design} params={params} project={project} />,
    <AccessoryLayoutDrawing key="accessory-layout" design={design} params={params} project={project} />,
    <LeadArrangementDrawing key="lead-arrangement" design={design} params={params} project={project} />,
    <NamePlateDrawing key="nameplate" design={design} params={params} project={project} />,
    <ExplodedAssemblyDrawing key="exploded-assembly" design={design} params={params} project={project} />,
    <LongitudinalSectionDrawing key="longitudinal-section" design={design} params={params} project={project} />,
    <InternalAssemblyDrawing key="internal-assembly-20t" design={design} params={params} project={project} drawingSeq="20T" sheet={21} />,
    <StampingSchedule key="stamping" design={design} params={params} project={project} />,
    <CoreCuttingChart key="cutting-chart" design={design} params={params} project={project} />,
  ];

  return (
    <div className="space-y-4">
      {drawings.map((el) => (
        <div key={el.key} className="drawing-page" data-drawing={el.key}>
          {el}
        </div>
      ))}
    </div>
  );
}
