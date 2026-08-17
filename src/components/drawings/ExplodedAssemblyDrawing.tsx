import React, { useId, useMemo } from 'react';
import { Card } from '../ui';
import { computePartRecords, PartRecord } from '../../lib/partRecords';
import { conservatorSize } from '@/packages/engine';
import {
  fitToViewBox, DimensionArrow, UnitsNote, TitleBlock, drawingNo, ratingLabel,
} from './DrawingPrimitives';

interface Props { design: any; params: any; project: any; }

/**
 * DRAWINGS.md, drawing 19: the 2D counterpart of the 3D exploded view,
 * reading the same part records (src/lib/partRecords.ts) the 3D inspection
 * panel uses -- so a part carries one number and one mass in both places.
 *
 * Vertical order mirrors the 3D model's own explode offsets in
 * TransformerParts.tsx (tank pulled down, core and coils left near centre,
 * LV then HV then cover then bushings pulled progressively further up),
 * rather than re-deriving a second ordering -- the two exploded views should
 * agree on which way is "further exploded", not just on numbers and mass.
 * Structural items the 3D model tracks but DRAWINGS.md's prose does not
 * name individually (base channel, clamping frame) are slotted at their
 * physically sensible station rather than dropped, since the parts list
 * must be complete against the shared record set.
 *
 * Layer width is always a real mm dimension off design/params (tank length,
 * winding OD, bushing foot diameter and so on) so the fitted scale is
 * geometry-driven per the universal requirements; only the vertical slice
 * thickness and the gap between layers are schematic (there is no "real"
 * thickness for a silhouette in an exploded view), and neither is ever
 * printed as a dimension value.
 */
export function ExplodedAssemblyDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  const records = useMemo(() => computePartRecords(design, params), [design, params]);
  const byKey = useMemo(() => {
    const m: Record<string, PartRecord> = {};
    records.forEach((r) => { m[r.key] = r; });
    return m;
  }, [records]);

  const sliceH = Math.max(20, design.tankH * 0.05);
  const gap = Math.max(10, design.tankH * 0.03);

  type Row = { key: string; widthMm: number; count?: number; itemWidthMm?: number };
  const rows: Row[] = [
    { key: 'namePlate', widthMm: 300 },
    { key: 'lvBushing', widthMm: design.cc * 2, count: byKey.lvBushing?.quantity, itemWidthMm: 40 },
    { key: 'hvBushing', widthMm: design.cc * 2, count: byKey.hvBushing?.quantity, itemWidthMm: 40 },
    ...(byKey.fins ? [{ key: 'fins', widthMm: design.tankL * 0.85 }] : []),
    // CALIBRATION.md section 24: conservator is a new part record (only on
    // a radiator tank) -- included here on the same "parts list must be
    // complete against the shared record set" basis as every other row,
    // not left to silently drop off this drawing while still showing in
    // the 3D model and the BOM.
    ...(byKey.conservator ? [{ key: 'conservator', widthMm: conservatorSize(design).length }] : []),
    { key: 'tankCover', widthMm: design.tankL + 20 },
    { key: 'insulation', widthMm: design.hvOD },
    { key: 'hvWinding', widthMm: design.hvOD },
    { key: 'lvWinding', widthMm: design.lvOD },
    { key: 'clampingFrame', widthMm: design.coreWidth * 1.05 },
    { key: 'core', widthMm: design.coreWidth },
    { key: 'tank', widthMm: design.tankL },
    { key: 'baseChannel', widthMm: design.tankL * 0.95 },
  ].filter((r) => byKey[r.key]);

  const contentW = Math.max(...rows.map((r) => r.widthMm));
  const contentH = rows.length * sliceH + (rows.length - 1) * gap;

  const margin = { top: 24, bottom: 40, leftShapes: 20, balloonCol: 130 };
  // box.w used to be 620 -- far wider than every other drawing's own box
  // (280-460, see OrthographicDrawing/TankDrawings/SectionDrawings), which
  // left the parts table too little of the printed page's own width to sit
  // beside the diagram without wrapping onto many extra lines and pushing
  // the sheet past one page. Narrowing the SVG column to match the other
  // drawings' convention gives the table room at real print widths, not
  // just the wide on-screen layout.
  const boxW = 340;
  const drawW = boxW - margin.leftShapes - margin.balloonCol;
  // This drawing is reliably width-bound: contentW is a real transformer
  // dimension in mm while contentH is a schematic pixel budget, so scaling
  // to fit drawW leaves the height ratio slack. The old box.h formula (up
  // to 1100px) guessed a box first and fit content into it, reserving far
  // more height than the width-scaled content ever used and pushing the
  // sheet past one printed page. Size the box to the scaled content instead
  // -- rowPx floored so balloons and labels never crowd, box.h capped so an
  // unusually long parts list still degrades gracefully rather than growing
  // the page.
  const widthScale = Math.min(4, drawW / Math.max(1, contentW));
  const rowPx = Math.max(20, (sliceH + gap) * widthScale);
  const box = { w: boxW, h: Math.max(360, Math.min(620, margin.top + margin.bottom + rows.length * rowPx)) };
  const fit = fitToViewBox(contentW, contentH, drawW, box.h - margin.top - margin.bottom, 4);
  const cx = margin.leftShapes + drawW / 2;
  const balloonX = margin.leftShapes + drawW + 34;

  const rowY = (i: number) => margin.top + fit.offsetY + i * (sliceH + gap) * fit.scale + (sliceH * fit.scale) / 2;

  return (
    <Card title="Exploded Assembly" subtitle={`Drawing ${drawingNo(project, '19')} · vertical explode, ${rows.length} parts`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <line x1={cx} y1={margin.top} x2={cx} y2={box.h - margin.bottom} stroke="var(--color-copper)" strokeWidth={0.5} strokeDasharray="6 3 2 3" />

          {rows.map((row, i) => {
            const rec = byKey[row.key];
            const y = rowY(i);
            const h = sliceH * fit.scale;
            const isBushingGroup = row.key === 'hvBushing' || row.key === 'lvBushing';
            const isRing = row.key === 'lvWinding' || row.key === 'hvWinding' || row.key === 'insulation';
            const w = row.widthMm * fit.scale;

            return (
              <g key={row.key}>
                {isBushingGroup && row.count ? (
                  Array.from({ length: row.count }).map((_, u) => {
                    const span = row.widthMm * fit.scale;
                    const ux = row.count === 1 ? cx : cx - span / 2 + (span * u) / (row.count - 1);
                    const uw = Math.min(14, (row.itemWidthMm || 40) * fit.scale);
                    return (
                      <rect key={u} x={ux - uw / 2} y={y - h / 2} width={uw} height={h}
                        fill="var(--color-sheet)" stroke="var(--color-ink)" strokeWidth={1.2} />
                    );
                  })
                ) : isRing ? (
                  <ellipse cx={cx} cy={y} rx={w / 2} ry={h / 2}
                    fill="none" stroke={row.key === 'insulation' ? 'var(--color-steel)' : 'var(--color-copper)'}
                    strokeWidth={1} strokeDasharray={row.key === 'insulation' ? '3 2' : undefined} />
                ) : (
                  <rect x={cx - w / 2} y={y - h / 2} width={w} height={h}
                    fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
                )}

                <line x1={cx + w / 2} y1={y} x2={balloonX - 12} y2={y} stroke="var(--color-ink2)" strokeWidth={0.5} />
                <circle cx={balloonX} cy={y} r={8} fill="var(--color-sheet)" stroke="var(--color-ink)" strokeWidth={1.2} />
                <text x={balloonX} y={y} textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={8} fill="var(--color-ink)">
                  {i + 1}
                </text>
                <text x={balloonX + 14} y={y} dominantBaseline="central" className="font-mono" fontSize={6.5} fill="var(--color-steel)">
                  {rec?.name.length > 26 ? `${rec.name.slice(0, 24)}…` : rec?.name}
                </text>
              </g>
            );
          })}
          <UnitsNote x={6} y={box.h - 6} />
        </svg>

        <div className="flex-1 min-w-0 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-left">
                <th className="py-0.5 pr-2 text-steel font-display uppercase text-[8px] tracking-[0.1em]">No.</th>
                <th className="py-0.5 pr-2 text-steel font-display uppercase text-[8px] tracking-[0.1em]">Part No.</th>
                <th className="py-0.5 pr-2 text-steel font-display uppercase text-[8px] tracking-[0.1em]">Name</th>
                <th className="py-0.5 pr-2 text-steel font-display uppercase text-[8px] tracking-[0.1em]">Material</th>
                <th className="py-0.5 pr-2 text-steel font-display uppercase text-[8px] tracking-[0.1em] text-right">Qty</th>
                <th className="py-0.5 text-steel font-display uppercase text-[8px] tracking-[0.1em] text-right">Mass</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rec = byKey[row.key];
                return (
                  <tr key={row.key} className="border-t border-line">
                    <td className="py-1 pr-2 font-mono text-ink2">{i + 1}</td>
                    <td className="py-1 pr-2 font-mono text-copper whitespace-nowrap">{rec.partNumber}</td>
                    <td className="py-1 pr-2 text-ink2">{rec.name}</td>
                    <td className="py-1 pr-2 text-steel">{rec.material}</td>
                    <td className="py-1 pr-2 font-mono text-right">{rec.quantity}</td>
                    <td className="py-1 font-mono text-right">{(rec.unitMass * rec.quantity).toFixed(1)} kg</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-steel pt-2 leading-snug">
            Mass is unit mass times quantity, the same figures the 3D inspection panel reports for each part -- one
            number and one mass per part, in both views.
          </p>
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '19')} title="Exploded Assembly" rev={project?.revision ?? 0}
        sheet={19} totalSheets={23} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}
