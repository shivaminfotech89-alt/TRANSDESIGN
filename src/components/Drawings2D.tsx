import React, { useId } from 'react';
import { stepWidths, stampingSchedule, finLayout } from '@/packages/engine';
import { Card, DataRow, thCls, tdCls } from './ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
} from './drawings/DrawingPrimitives';
import { PART_NUMBERS } from './drawings/partNumbers';

interface Drawings2DProps {
  design: any;
  params: any;
  project: any;
}

/**
 * DRAWINGS.md, "Start with the universal requirements" -- this file applies
 * the three universal pieces (DrawingPrimitives.tsx: dimension lines, the
 * title block, the fit-to-viewBox scale) to the four drawings that already
 * existed. The other seventeen are TASKS.md/DRAWINGS.md future work, built
 * one at a time on top of this once dimensioning is confirmed to render.
 */

const pad2 = (n: number) => String(Math.max(0, n) || 0).padStart(2, '0');

/** `{docPrefix}-{tender}-R{rev}-D{seq}` -- same family as documentRegister()'s
 *  own numbering (docPrefix-tender-Rrev-seq), with a D so a drawing number
 *  never collides with that register's own sequence 1-28. */
function drawingNo(project: any, seq: string): string {
  const prefix = project?.docPrefix || 'TDE';
  const tender = project?.tender || 'ENQ';
  const rev = pad2(project?.revision ?? 0);
  return `${prefix}-${tender}-R${rev}-D${seq}`;
}

function ratingLabel(params: any): string {
  return `${params.kva} kVA, ${params.hv / 1000} kV / ${params.lv} V`;
}

/** DRAWINGS.md, drawing 7: cross-section through one limb, circumscribing
 *  circle dashed in copper, every pocket a rectangle, widest at the stack
 *  centre, mirrored. Dimensioned: the core circle diameter, and the widest
 *  (centre) pocket's width directly on the sheet -- dimensioning every
 *  pocket individually here would stack up to eight lines through a 280 mm
 *  circle illegibly, so the rest are given exactly, per pocket, in the
 *  table beside it, which is what "Beside it: pocket number, width, stack
 *  per side" already asks for. */
function CoreCrossSection({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  const steps = stepWidths(params.steps, design.dCore);
  const R = design.dCore / 2;
  const box = { w: 340, h: 360 };
  const dimGutter = { right: 46, bottom: 40 };
  const fit = fitToViewBox(design.dCore, design.dCore, box.w - dimGutter.right, box.h - dimGutter.bottom, 20);
  const cx = fit.offsetX + (design.dCore * fit.scale) / 2;
  const cy = fit.offsetY + (design.dCore * fit.scale) / 2;
  const Rpx = R * fit.scale;

  const rects: { x: number; y: number; w: number; h: number }[] = [];
  let centreRow: { x: number; w: number } | null = null;
  steps.rows.forEach((row: any, i: number) => {
    const prevH = i === 0 ? 0 : steps.rows[i - 1].halfH;
    const w = row.w * fit.scale;
    const x = cx - w / 2;
    if (i === 0) {
      const h = row.t * fit.scale;
      rects.push({ x, y: cy - h / 2, w, h });
      centreRow = { x, w };
    } else {
      const h = row.t * fit.scale;
      const yTop = prevH * fit.scale;
      rects.push({ x, y: cy + yTop, w, h });
      rects.push({ x, y: cy - yTop - h, w, h });
    }
  });

  const diaDimX = cx + Rpx + 20;
  const widthDimY = cy + Rpx + 18;

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
          {centreRow && (
            <DimensionHorizontal
              x1={(centreRow as any).x} x2={(centreRow as any).x + (centreRow as any).w}
              featureY={cy} dimY={widthDimY}
              label={dimText(steps.rows[0].w, { decimals: 1 })} arrowId={arrowId}
            />
          )}
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

/** DRAWINGS.md, drawing 21 (limb half): the lamination piece is a trapezoid
 *  with 45-degree mitres both ends -- outer edge Hw+2w, inner edge Hw, so
 *  the mitre rise over its run of w is also w, which is exactly 45 degrees.
 *  Shown for the widest (centre) pocket; every pocket's own figures are in
 *  the schedule beneath, unchanged. The yoke piece and its centre V notch
 *  are not attempted here -- DRAWINGS.md, drawing 21, is picked up in full
 *  in a later pass. */
function StampingSchedule({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  const steps = stepWidths(params.steps, design.dCore);
  const sched = stampingSchedule(design, steps);
  const centre = sched.rows[0];

  const box = { w: 460, h: 150 };
  const margin = { top: 34, bottom: 34, side: 40 };
  const fit = fitToViewBox(centre.limbLong, centre.w, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 8);
  const topW = centre.limbLong * fit.scale, botW = centre.limbShort * fit.scale, h = centre.w * fit.scale;
  const cx = box.w / 2;
  const top = margin.top + fit.offsetY;
  const bottom = top + h;

  const points = [
    [cx - topW / 2, top], [cx + topW / 2, top],
    [cx + botW / 2, bottom], [cx - botW / 2, bottom],
  ].map((p) => p.join(',')).join(' ');

  return (
    <Card title="Core Stamping Schedule" subtitle={`Drawing ${drawingNo(project, '21')} · ${sched.thk} mm lamination, limb piece shown for the widest pocket`}>
      <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="mx-auto block">
        <DimensionArrow id={arrowId} />
        <polygon points={points} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
        <DimensionHorizontal
          x1={cx - topW / 2} x2={cx + topW / 2} featureY={top} dimY={top - 14}
          label={dimText(centre.limbLong, { decimals: 1 })} arrowId={arrowId}
        />
        <DimensionHorizontal
          x1={cx - botW / 2} x2={cx + botW / 2} featureY={bottom} dimY={bottom + 14}
          label={dimText(centre.limbShort, { decimals: 1 })} arrowId={arrowId}
        />
        <DimensionVertical
          y1={top} y2={bottom} featureX={cx + topW / 2} dimX={cx + topW / 2 + 18}
          label={dimText(centre.w, { decimals: 1 })} arrowId={arrowId}
        />
        <UnitsNote x={6} y={box.h - 4} />
      </svg>
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

  const box = { w: 360, h: 280 };
  const margin = { side: 34, top: 20, bottom: 46 };
  const fit = fitToViewBox(design.tankL, design.tankH, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 10);
  const tankW = design.tankL * fit.scale, tankH = design.tankH * fit.scale;
  const tx = margin.side + fit.offsetX, ty = margin.top + fit.offsetY;
  const finW = 6, finGap = 2;
  const finH = Math.min(tankH * 0.7, (fins.height || 0) * fit.scale);
  const finsToShow = Math.min(fins.perSide, Math.floor((tankH - 10) / (finW + finGap)));

  const lengthDimY = ty + tankH + 16;
  const heightDimX = tx + tankW + 14;

  return (
    <Card title="Tank and Fin Layout" subtitle={`Preliminary · ahead of drawings 13 and 14 · ${fins.n} fins total, ${fins.perSide} per side`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <rect x={tx} y={ty} width={tankW} height={tankH} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
          {Array.from({ length: finsToShow }).map((_, i) => (
            <rect
              key={`l${i}`}
              x={tx - finW - 2} y={ty + 5 + i * (finH / finsToShow || 1)}
              width={finW} height={Math.max(2, finH / finsToShow - finGap)}
              fill="none" stroke="var(--color-steel)" strokeWidth={0.75}
            />
          ))}
          {Array.from({ length: finsToShow }).map((_, i) => (
            <rect
              key={`r${i}`}
              x={tx + tankW + 2} y={ty + 5 + i * (finH / finsToShow || 1)}
              width={finW} height={Math.max(2, finH / finsToShow - finGap)}
              fill="none" stroke="var(--color-steel)" strokeWidth={0.75}
            />
          ))}
          <DimensionHorizontal
            x1={tx} x2={tx + tankW} featureY={ty + tankH} dimY={lengthDimY}
            label={dimText(design.tankL)} arrowId={arrowId}
          />
          <DimensionVertical
            y1={ty} y2={ty + tankH} featureX={tx + tankW} dimX={heightDimX}
            label={dimText(design.tankH)} arrowId={arrowId}
          />
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0">
          <DataRow label="Tank Length x Height" value={`${Math.round(design.tankL)} x ${Math.round(design.tankH)}`} unit="mm" />
          <DataRow label="Fin Count" value={String(fins.n)} />
          <DataRow label="Fin Panel" value={`${fins.depth} x ${Math.round(fins.height)}`} unit="mm" />
          <DataRow label="Dissipation per Fin" value={fins.per.toFixed(3)} unit="m²" />
        </div>
      </div>
      <TitleBlock
        drawingNo={`${project?.docPrefix || 'TDE'}-PRELIM-TANK`} title="Tank and Fin Layout (Preliminary)"
        rev={project?.revision ?? 0} sheet={13} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}

/** Not one of the numbered drawings yet -- a preliminary outline ahead of
 *  the real orthographic set (drawings 1 to 5, one component with a view
 *  parameter) built to DRAWINGS.md in a later pass.
 *
 *  A front elevation's horizontal axis runs along the limb row, which is
 *  design.tankL (buildBOM: tankL = coreWidth + 2*endTankClr), not
 *  design.tankW (the side-view depth, matching hvOD -- DRAWINGS.md draws
 *  that dimension on drawing 3, the side view, not here). The previous
 *  version of this drawing compared coreWidth against tankW, the wrong
 *  axis, which is why adding a real dimension line here would otherwise
 *  have shown the active part overhanging the tank on both sides. */
function GaElevation({ design, params, project }: Drawings2DProps) {
  const arrowId = useId();
  if (design.dry) return null;
  const box = { w: 360, h: 320 };
  const margin = { side: 34, top: 20, bottom: 46 };
  const fit = fitToViewBox(design.tankL, design.tankH, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 10);
  const tankL = design.tankL * fit.scale, tankH = design.tankH * fit.scale;
  const tx = margin.side + fit.offsetX, ty = margin.top + fit.offsetY;
  const coreW = design.coreWidth * fit.scale, coreH = design.coreHeight * fit.scale;
  const cx = tx + (tankL - coreW) / 2, cy = ty + (tankH - coreH) / 2 + tankH * 0.08;

  const lengthDimY = ty + tankH + 16;
  const heightDimX = tx + tankL + 14;

  return (
    <Card title="General Arrangement, Elevation" subtitle="Preliminary · front view, tank envelope and active part">
      <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
        <DimensionArrow id={arrowId} />
        <rect x={tx} y={ty} width={tankL} height={tankH} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
        <rect x={cx} y={cy} width={coreW} height={coreH} fill="none" stroke="var(--color-copper)" strokeWidth={1} strokeDasharray="4 2" />
        <DimensionHorizontal
          x1={tx} x2={tx + tankL} featureY={ty + tankH} dimY={lengthDimY}
          label={dimText(design.tankL)} arrowId={arrowId}
        />
        <DimensionVertical
          y1={ty} y2={ty + tankH} featureX={tx + tankL} dimX={heightDimX}
          label={dimText(design.tankH)} arrowId={arrowId}
        />
        <UnitsNote x={6} y={box.h - 6} />
      </svg>
      <div className="grid grid-cols-2 gap-x-4 mt-2">
        <DataRow label="Tank Length x Height" value={`${Math.round(design.tankL)} x ${Math.round(design.tankH)}`} unit="mm" />
        <DataRow label="Active Part Width x Height" value={`${Math.round(design.coreWidth)} x ${Math.round(design.coreHeight)}`} unit="mm" />
      </div>
      <TitleBlock
        drawingNo={`${project?.docPrefix || 'TDE'}-PRELIM-GA`} title="General Arrangement (Preliminary)"
        rev={project?.revision ?? 0} sheet={1} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}

export function Drawings2D({ design, params, project }: Drawings2DProps) {
  return (
    <div className="space-y-4">
      <CoreCrossSection design={design} params={params} project={project} />
      <StampingSchedule design={design} params={params} project={project} />
      <TankAndFinLayout design={design} params={params} project={project} />
      <GaElevation design={design} params={params} project={project} />
    </div>
  );
}
