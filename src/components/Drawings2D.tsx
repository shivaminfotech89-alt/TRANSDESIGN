import React from 'react';
import { stepWidths, stampingSchedule, finLayout } from '@/packages/engine';
import { Card, DataRow, thCls, tdCls } from './ui';

interface Drawings2DProps {
  design: any;
  params: any;
}

/**
 * TASKS.md item 8 (2D drawings), scoped to what SOLVER.md-adjacent work has
 * engine data ready for: the stepped core cross-section (stepWidths), the
 * cutting/stamping schedule (stampingSchedule), the tank and fin layout
 * (finLayout), and a simplified general-arrangement elevation from the
 * design's own geometry fields. Real parametric SVG, scaled to the actual
 * design, not a static picture -- but not the full ten-drawing set TASKS.md
 * describes; the ones without a ready engine-data source (BOM cutting list
 * per plate, welded tank fabrication detail) are not attempted here.
 */

/** Stepped core cross-section, half above and half below the centre packet,
 *  reconstructed from stepWidths()'s cumulative half-heights exactly as
 *  stampingSchedule() itself does (see its `stack = i===0 ? t : 2*t`). */
function CoreCrossSection({ design, params }: Drawings2DProps) {
  const steps = stepWidths(params.steps, design.dCore);
  const R = design.dCore / 2;
  const box = 280;
  const scale = (box / 2 - 20) / R;
  const cx = box / 2, cy = box / 2;

  const rects: { x: number; y: number; w: number; h: number }[] = [];
  steps.rows.forEach((row: any, i: number) => {
    const prevH = i === 0 ? 0 : steps.rows[i - 1].halfH;
    const w = row.w * scale;
    const x = cx - w / 2;
    if (i === 0) {
      const h = row.t * scale;
      rects.push({ x, y: cy - h / 2, w, h });
    } else {
      const h = row.t * scale;
      const yTop = prevH * scale;
      rects.push({ x, y: cy + yTop, w, h });
      rects.push({ x, y: cy - yTop - h, w, h });
    }
  });

  return (
    <Card title="Core Cross-Section" subtitle={`${params.steps} steps, ${(steps.util * 100).toFixed(1)}% utilisation`}>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="shrink-0">
          <circle cx={cx} cy={cy} r={R * scale} fill="none" stroke="var(--color-line)" strokeDasharray="3 2" />
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
          ))}
          <line x1={cx - R * scale - 10} y1={cy} x2={cx + R * scale + 10} y2={cy} stroke="var(--color-steel)" strokeWidth={0.5} />
          <line x1={cx} y1={cy - R * scale - 10} x2={cx} y2={cy + R * scale + 10} stroke="var(--color-steel)" strokeWidth={0.5} />
        </svg>
        <div className="flex-1 min-w-0">
          <DataRow label="Core Diameter" value={design.dCore.toFixed(1)} unit="mm" />
          <DataRow label="Steps" value={String(params.steps)} />
          <DataRow label="Circle Utilisation" value={(steps.util * 100).toFixed(2)} unit="%" />
          <DataRow label="Stepped Area" value={(steps.area / 100).toFixed(1)} unit="cm²" />
        </div>
      </div>
    </Card>
  );
}

function StampingSchedule({ design, params }: Drawings2DProps) {
  const steps = stepWidths(params.steps, design.dCore);
  const sched = stampingSchedule(design, steps);
  return (
    <Card title="Core Stamping Schedule" subtitle={`${sched.thk} mm lamination`}>
      <table className="w-full">
        <thead>
          <tr>
            <th className={thCls}>Step</th>
            <th className={`${thCls} text-right`}>Width</th>
            <th className={`${thCls} text-right`}>Stack</th>
            <th className={`${thCls} text-right`}>Sheets</th>
            <th className={`${thCls} text-right`}>Limb L x S</th>
            <th className={`${thCls} text-right`}>Yoke L x S</th>
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
    </Card>
  );
}

function TankAndFinLayout({ design }: Drawings2DProps) {
  const fins = finLayout(design);
  if (design.dry) {
    return (
      <Card title="Enclosure Layout">
        <p className="text-[11px] text-steel">Not applicable: dry-type construction has no tank or fin layout.</p>
      </Card>
    );
  }

  const box = { w: 320, h: 220 };
  const margin = 20;
  const scale = Math.min((box.w - 2 * margin) / design.tankL, (box.h - 2 * margin) / design.tankH);
  const tankW = design.tankL * scale, tankH = design.tankH * scale;
  const tx = (box.w - tankW) / 2, ty = (box.h - tankH) / 2;
  const finW = 6, finGap = 2;
  const finH = Math.min(tankH * 0.7, (fins.height || 0) * scale);
  const finsToShow = Math.min(fins.perSide, Math.floor((tankH - 10) / (finW + finGap)));

  return (
    <Card title="Tank and Fin Layout" subtitle={`${fins.n} fins total, ${fins.perSide} per side`}>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
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
        </svg>
        <div className="flex-1 min-w-0">
          <DataRow label="Tank Length x Height" value={`${Math.round(design.tankL)} x ${Math.round(design.tankH)}`} unit="mm" />
          <DataRow label="Fin Count" value={String(fins.n)} />
          <DataRow label="Fin Panel" value={`${fins.depth} x ${Math.round(fins.height)}`} unit="mm" />
          <DataRow label="Dissipation per Fin" value={fins.per.toFixed(3)} unit="m²" />
        </div>
      </div>
    </Card>
  );
}

function GaElevation({ design }: Drawings2DProps) {
  if (design.dry) return null;
  const box = { w: 320, h: 260 };
  const margin = 20;
  const scale = Math.min((box.w - 2 * margin) / design.tankW, (box.h - 2 * margin) / design.tankH);
  const tankW = design.tankW * scale, tankH = design.tankH * scale;
  const tx = (box.w - tankW) / 2, ty = (box.h - tankH) / 2;
  const coreW = design.coreWidth * scale, coreH = design.coreHeight * scale;
  const cx = (box.w - coreW) / 2, cy = ty + (tankH - coreH) / 2 + tankH * 0.08;

  return (
    <Card title="General Arrangement, Elevation" subtitle="Front view, tank envelope and active part">
      <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
        <rect x={tx} y={ty} width={tankW} height={tankH} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
        <rect x={cx} y={cy} width={coreW} height={coreH} fill="none" stroke="var(--color-copper)" strokeWidth={1} strokeDasharray="4 2" />
      </svg>
      <div className="grid grid-cols-2 gap-x-4 mt-2">
        <DataRow label="Tank Width x Height" value={`${Math.round(design.tankW)} x ${Math.round(design.tankH)}`} unit="mm" />
        <DataRow label="Active Part Width x Height" value={`${Math.round(design.coreWidth)} x ${Math.round(design.coreHeight)}`} unit="mm" />
      </div>
    </Card>
  );
}

export function Drawings2D({ design, params }: Drawings2DProps) {
  return (
    <div className="space-y-4">
      <CoreCrossSection design={design} params={params} />
      <StampingSchedule design={design} params={params} />
      <TankAndFinLayout design={design} params={params} />
      <GaElevation design={design} params={params} />
    </div>
  );
}
