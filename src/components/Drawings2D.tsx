import React, { useId } from 'react';
import { stepWidths, stampingSchedule, finLayout } from '@/packages/engine';
import { Card, DataRow, thCls, tdCls } from './ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
  drawingNo, ratingLabel,
} from './drawings/DrawingPrimitives';
import { PART_NUMBERS } from './drawings/partNumbers';
import { OrthographicDrawing } from './drawings/OrthographicDrawing';
import { LvWindingDrawing, HvWindingDrawing, TapWindingDrawing } from './drawings/WindingDrawings';
import { finPlacements } from './cad/geometry';

interface Drawings2DProps {
  design: any;
  params: any;
  project: any;
}

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
function CoreDrawing({ design, params, project }: Drawings2DProps) {
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

          <rect x={originX} y={topYokeY} width={coreWidthPx} height={yokeDepthPx} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
          <rect x={originX} y={bottomYokeY} width={coreWidthPx} height={yokeDepthPx} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
          {limbXpx.map((x, i) => (
            <rect key={i} x={x - dCorePx / 2} y={limbY} width={dCorePx} height={HwPx} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
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
          <DataRow label="Construction" value={params.coreType} />
          <DataRow label="Steps" value={String(params.steps)} />
          <DataRow label="Grade" value={design.grade.name} />
          <DataRow label="Net Core Area" value={design.aNet.toFixed(1)} unit="cm²" />
          <DataRow label="Gross Core Area" value={design.aGross.toFixed(1)} unit="cm²" />
          <DataRow label="Core Mass" value={design.wCore.toFixed(1)} unit="kg" />
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '06')} title="Core Drawing" rev={project?.revision ?? 0}
        sheet={6} totalSheets={21} fit={fit} standard={params.standard}
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
function CoreCrossSection({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  const steps = stepWidths(params.steps, design.dCore);
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
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
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
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '07')} title="Stepped Core Cross-Section" rev={project?.revision ?? 0}
        sheet={7} totalSheets={21} fit={fit} standard={params.standard}
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
function StampingSchedule({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  const steps = stepWidths(params.steps, design.dCore);
  const sched = stampingSchedule(design, steps);
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
        <polygon points={limbPoints} fill="none" stroke="var(--color-ink)" strokeWidth={1} strokeDasharray="5 2" />
        <polygon points={yokePoints} fill="none" stroke="var(--color-ink)" strokeWidth={1} strokeDasharray="5 2" />
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
      <p className="text-[10px] text-steel mt-1">
        Centre limb V notch shown schematically on the yoke's inner edge -- its profile is not held by the engine.
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
        sheet={21} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.grade.name} partNumber={PART_NUMBERS.core}
      />
    </Card>
  );
}

/** Not one of the numbered drawings yet -- a preliminary combined view of
 *  the tank envelope and fin count, ahead of the real drawing 13 (tank
 *  fabrication) and drawing 14 (fin/radiator) built to DRAWINGS.md in a
 *  later pass. Marked PRELIM rather than given a real drawing number so it
 *  is never mistaken for the finished one. */
/**
 * Fins mount on the tankW faces -- the long walls that run along the limb
 * row -- not the tankL ends: that is where the surface area is, and it
 * leaves the end walls clear for the bushings and fittings the GA and top
 * views put there. The previous version of this drawing put them on the
 * tankL ends instead, the same class of axis mistake fixed in the
 * orthographic set. This is a plan view (tankL horizontal, tankW vertical,
 * matching the top/bottom views' own axis convention) so that projection
 * is visible at all: an elevation looking along tankL sees a tankW face
 * edge-on, not face-on.
 *
 * finPlacements() is the same function the 3D model places fins with, so
 * the pitch and count drawn here cannot drift from what the 3D tab shows --
 * finLayout()'s own `perSide` is what both read, one fin bank per tankW
 * face, matching the side view's fin depth projection and the GA note's
 * fin count exactly, because all three call finLayout() on the same design
 * and nothing recomputes it differently.
 */
function TankAndFinLayout({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  const fins = finLayout(design);
  if (design.dry) {
    return (
      <Card title="Enclosure Layout">
        <p className="text-[11px] text-steel">Not applicable: dry-type construction has no tank or fin layout.</p>
      </Card>
    );
  }

  const box = { w: 380, h: 260 };
  const margin = { side: 40, top: 30, bottom: 46 };
  const fit = fitToViewBox(design.tankL, design.tankW + 2 * fins.depth, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 10);
  const tankLpx = design.tankL * fit.scale, tankWpx = design.tankW * fit.scale;
  const finDepthPx = fins.depth * fit.scale;
  const tx = margin.side + fit.offsetX, ty = margin.top + fit.offsetY + finDepthPx;

  const positions = finPlacements(fins.perSide, design.tankL, design.tankH, fins.height, 0);
  const pitch = positions.length > 1 ? positions[1].x - positions[0].x : 0;
  const tickW = Math.max(2, Math.min(6, (tankLpx / Math.max(1, fins.perSide)) * 0.4));

  const lengthDimY = ty + tankWpx + 16;
  const widthDimX = tx + tankLpx + 14;

  return (
    <Card title="Tank and Fin Layout" subtitle={`Preliminary, ahead of drawings 13 and 14 · ${fins.n} fins total, ${fins.perSide} per tankW face`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          {positions.map((p, i) => {
            const px = tx + tankLpx / 2 + p.x * fit.scale;
            return (
              <React.Fragment key={i}>
                <rect x={px - tickW / 2} y={ty - finDepthPx} width={tickW} height={finDepthPx} fill="none" stroke="var(--color-steel)" strokeWidth={0.6} />
                <rect x={px - tickW / 2} y={ty + tankWpx} width={tickW} height={finDepthPx} fill="none" stroke="var(--color-steel)" strokeWidth={0.6} />
              </React.Fragment>
            );
          })}
          <rect x={tx} y={ty} width={tankLpx} height={tankWpx} fill="none" stroke="var(--color-ink)" strokeWidth={1} />

          <DimensionHorizontal x1={tx} x2={tx + tankLpx} featureY={ty + tankWpx} dimY={lengthDimY} label={dimText(design.tankL)} arrowId={arrowId} />
          <DimensionVertical y1={ty} y2={ty + tankWpx} featureX={tx + tankLpx} dimX={widthDimX} label={dimText(design.tankW)} arrowId={arrowId} />
          {positions.length > 0 && (
            <DimensionVertical
              y1={ty - finDepthPx} y2={ty} featureX={tx + tankLpx / 2 + positions[0].x * fit.scale}
              dimX={tx - 14} label={dimText(fins.depth, { decimals: 1 })} arrowId={arrowId}
            />
          )}
          {positions.length > 1 && (
            <DimensionHorizontal
              x1={tx + tankLpx / 2 + positions[0].x * fit.scale} x2={tx + tankLpx / 2 + positions[1].x * fit.scale}
              featureY={ty - finDepthPx} dimY={ty - finDepthPx - 12} label={dimText(pitch, { decimals: 1 })} arrowId={arrowId}
            />
          )}
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0">
          <DataRow label="Tank Length x Width" value={`${Math.round(design.tankL)} x ${Math.round(design.tankW)}`} unit="mm" />
          <DataRow label="Fin Count" value={`${fins.n} total, ${fins.perSide} per face`} />
          <DataRow label="Fin Pitch" value={pitch.toFixed(1)} unit="mm" />
          <DataRow label="Fin Panel, Depth x Height" value={`${fins.depth} x ${Math.round(fins.height)}`} unit="mm" />
          <DataRow label="Dissipation per Fin" value={fins.per.toFixed(3)} unit="m²" />
        </div>
      </div>
      <TitleBlock
        drawingNo={`${project?.docPrefix || 'TDE'}-PRELIM-TANK`} title="Tank and Fin Layout (Preliminary)"
        rev={project?.revision ?? 0} sheet={14} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}

export function Drawings2D({ design, params, project }: Drawings2DProps) {
  return (
    <div className="space-y-4">
      <OrthographicDrawing design={design} params={params} project={project} view="ga" />
      <OrthographicDrawing design={design} params={params} project={project} view="front" />
      <OrthographicDrawing design={design} params={params} project={project} view="side" />
      <OrthographicDrawing design={design} params={params} project={project} view="top" />
      <OrthographicDrawing design={design} params={params} project={project} view="bottom" />
      <CoreDrawing design={design} params={params} project={project} />
      <CoreCrossSection design={design} params={params} project={project} />
      <StampingSchedule design={design} params={params} project={project} />
      <LvWindingDrawing design={design} params={params} project={project} />
      <HvWindingDrawing design={design} params={params} project={project} />
      <TapWindingDrawing design={design} params={params} project={project} />
      <TankAndFinLayout design={design} params={params} project={project} />
    </div>
  );
}
