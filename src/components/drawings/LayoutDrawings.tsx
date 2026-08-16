import React, { useId } from 'react';
import { Card, DataRow } from '../ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
  drawingNo, ratingLabel, parseVectorGroup, schematicPositions,
} from './DrawingPrimitives';

interface Props { design: any; params: any; project: any; }

/**
 * DRAWINGS.md, "Layout drawings: 15, 16, 17". The one consistency point
 * that runs through all three: bushing count and labelling always follow
 * parseVectorGroup(params.vector) -- the same function OrthographicDrawing's
 * GA and top views now use -- never a hardcoded three or four.
 */

/** DRAWINGS.md, drawing 15: cover plan, bushings positioned and labelled
 *  per the vector group. HV centres are design.cc, real. LV centres,
 *  creepage distance, arcing horn gap and every catalogue dimension are
 *  not held by the engine and print "to be specified". */
export function BushingLayoutDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  const vg = parseVectorGroup(params.vector);

  const box = { w: 400, h: 300 };
  const margin = { top: 40, bottom: 50, side: 44 };
  const fit = fitToViewBox(design.tankL, design.tankW, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 8);
  const tankLpx = design.tankL * fit.scale, tankWpx = design.tankW * fit.scale;
  const tx = margin.side + fit.offsetX, ty = margin.top + fit.offsetY;
  const cx = tx + tankLpx / 2, cy = ty + tankWpx / 2;

  const hvXmm = [-design.cc, 0, design.cc, ...(vg.hvNeutral ? [design.cc * 0.5] : [])];
  const lvXmm = schematicPositions(vg.lvLabels.length, design.tankL * 0.5);
  const hvR = Math.max(3, Math.min(8, tankWpx * 0.08));
  const lvR = hvR * 0.7;

  return (
    <Card title="Bushing Layout" subtitle={`Drawing ${drawingNo(project, '15')} · cover plan, ${params.vector}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <rect x={tx} y={ty} width={tankLpx} height={tankWpx} fill="none" stroke="var(--color-ink)" strokeWidth={1.8} />

          {hvXmm.map((mmX, i) => (
            <g key={`hv${i}`}>
              <circle cx={cx + mmX * fit.scale} cy={cy - tankWpx * 0.18} r={hvR} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
              <text x={cx + mmX * fit.scale} y={cy - tankWpx * 0.18 - hvR - 3} textAnchor="middle" className="font-mono" fontSize={6} fill="var(--color-ink2)">{vg.hvLabels[i]}</text>
            </g>
          ))}
          {lvXmm.map((mmX, i) => (
            <g key={`lv${i}`}>
              <circle cx={cx + mmX * fit.scale} cy={cy + tankWpx * 0.22} r={lvR} fill="none" stroke="var(--color-steel)" strokeWidth={0.8} />
              <text x={cx + mmX * fit.scale} y={cy + tankWpx * 0.22 + lvR + 8} textAnchor="middle" className="font-mono" fontSize={5.5} fill="var(--color-steel)">{vg.lvLabels[i]}</text>
            </g>
          ))}

          <DimensionHorizontal x1={cx + hvXmm[0] * fit.scale} x2={cx + hvXmm[1] * fit.scale} featureY={cy - tankWpx * 0.18} dimY={ty - 14} label={dimText(design.cc)} arrowId={arrowId} />
          <DimensionHorizontal x1={cx + hvXmm[1] * fit.scale} x2={cx + hvXmm[2] * fit.scale} featureY={cy - tankWpx * 0.18} dimY={ty - 26} label={dimText(design.cc)} arrowId={arrowId} />
          {lvXmm.length > 1 && (
            <DimensionHorizontal x1={cx + lvXmm[0] * fit.scale} x2={cx + lvXmm[1] * fit.scale} featureY={cy + tankWpx * 0.22} dimY={ty + tankWpx + 16} label="to be specified" arrowId={arrowId} />
          )}
          <DimensionVertical y1={cy - tankWpx * 0.18} y2={cy + tankWpx * 0.22} featureX={cx + hvXmm[2] * fit.scale} dimX={cx + hvXmm[2] * fit.scale + hvR + 14} label="to be specified" arrowId={arrowId} />

          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <DataRow label="Vector Group" value={params.vector} />
          <DataRow label="HV Bushings" value={vg.hvLabels.join(', ')} />
          <DataRow label="LV Bushings" value={vg.lvLabels.join(', ')} />
          <DataRow label="HV Phase-to-Phase Spacing" value={design.cc.toFixed(1)} unit="mm" tone="copper" />
          <DataRow label="Phase-to-Earth Clearance in Air" value="to be specified" />
          <DataRow label="Creepage Distance" value="to be specified, from bushing catalogue" />
          <DataRow label="Arcing Horn Gap" value="to be specified, where fitted" />
          <DataRow label="HV / LV Bushing Voltage Class" value={`${params.umHV} / ${params.umLV} kV`} />
          <p className="text-[10px] text-steel pt-2 leading-snug">
            Bushing count and labelling follow the vector group, {params.vector}: {vg.hv === 'D' ? 'delta HV has no neutral bushing' : vg.hvNeutral ? 'HV neutral is brought out' : 'HV neutral is not brought out'};{' '}
            {vg.lv === 'd' ? 'delta LV has no neutral bushing' : vg.lvNeutral ? 'LV neutral is brought out' : 'LV neutral is not brought out'}.
            Catalogue dimensions and creepage distance come from the bushing vendor.
          </p>
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '15')} title="Bushing Layout" rev={project?.revision ?? 0}
        sheet={15} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}

const ACCESSORIES: { key: string; label: string; onlyConservator?: boolean }[] = [
  { key: 'buchholz', label: 'Buchholz relay', onlyConservator: true },
  { key: 'prd', label: 'Pressure relief device' },
  { key: 'oti', label: 'Oil temperature indicator' },
  { key: 'wti', label: 'Winding temperature indicator' },
  { key: 'breather', label: 'Breather' },
  { key: 'mog', label: 'Magnetic oil gauge', onlyConservator: true },
  { key: 'valve1', label: 'Drain valve' },
  { key: 'valve2', label: 'Filter valve' },
  { key: 'earth1', label: 'Earthing pad' },
  { key: 'marshalling', label: 'Marshalling box' },
  { key: 'cablebox', label: 'Cable box' },
  { key: 'plate', label: 'Rating plate' },
];

/** DRAWINGS.md, drawing 16: cover and tank elevation with every fitting
 *  positioned. Buchholz and the magnetic oil gauge only where the tank
 *  type has a conservator (radiator tank type, per this engine's own
 *  convention). None of these positions are engine output -- every one is
 *  schematic, and the sheet says so once, prominently, rather than once
 *  per fitting. */
export function AccessoryLayoutDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  const hasConservator = params.tankType === 'radiator';
  const fittings = ACCESSORIES.filter((a) => !a.onlyConservator || hasConservator);

  const box = { w: 420, h: 320 };
  const margin = { top: 20, bottom: 20, side: 40 };
  const gapMM = design.tankH * 0.1;
  const fit = fitToViewBox(design.tankL, design.tankW + gapMM + design.tankH, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 8);
  const tankLpx = design.tankL * fit.scale;
  const planH = design.tankW * fit.scale, elevH = design.tankH * fit.scale;
  const tx = margin.side + fit.offsetX;
  const planY = margin.top + fit.offsetY;
  const elevY = planY + planH + gapMM * fit.scale;

  const planSpots = schematicPositions(Math.min(6, fittings.length), tankLpx * 0.75);
  const elevSpots = schematicPositions(fittings.length - planSpots.length, tankLpx * 0.75);

  return (
    <Card title="Accessory Layout" subtitle={`Drawing ${drawingNo(project, '16')} · cover plan and tank elevation, positions indicative`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <rect x={tx} y={planY} width={tankLpx} height={planH} fill="none" stroke="var(--color-ink)" strokeWidth={1.8} />
          <rect x={tx} y={elevY} width={tankLpx} height={elevH} fill="none" stroke="var(--color-ink)" strokeWidth={1.8} />

          {fittings.slice(0, planSpots.length).map((f, i) => (
            <g key={f.key}>
              <circle cx={tx + tankLpx / 2 + planSpots[i]} cy={planY + planH / 2} r={3} fill="none" stroke="var(--color-ink2)" strokeWidth={0.7} strokeDasharray="2 1" />
              <text x={tx + tankLpx / 2 + planSpots[i]} y={planY + planH / 2 - 5} textAnchor="middle" className="font-mono" fontSize={4.5} fill="var(--color-ink2)">{i + 1}</text>
            </g>
          ))}
          {fittings.slice(planSpots.length).map((f, i) => (
            <g key={f.key}>
              <circle cx={tx + tankLpx / 2 + elevSpots[i]} cy={elevY + elevH * 0.4} r={3} fill="none" stroke="var(--color-ink2)" strokeWidth={0.7} strokeDasharray="2 1" />
              <text x={tx + tankLpx / 2 + elevSpots[i]} y={elevY + elevH * 0.4 - 5} textAnchor="middle" className="font-mono" fontSize={4.5} fill="var(--color-ink2)">{planSpots.length + i + 1}</text>
            </g>
          ))}
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-alert leading-snug mb-2">
            Every position below is indicative until the accessory standard is configured. None of it is engine
            output.
          </p>
          <table className="w-full text-[10px]">
            <tbody>
              {fittings.map((f, i) => (
                <tr key={f.key}>
                  <td className="py-0.5 text-ink2">{i + 1}. {f.label}</td>
                  <td className="text-right font-mono text-steel">to be specified</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!hasConservator && (
            <p className="text-[10px] text-steel pt-2 leading-snug">
              No conservator on a {params.tankType} tank: Buchholz relay and magnetic oil gauge do not apply.
            </p>
          )}
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '16')} title="Accessory Layout" rev={project?.revision ?? 0}
        sheet={16} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}

/** DRAWINGS.md, drawing 17: lead arrangement. Each lead's cross-section is
 *  sized on exactly the same current density as its own winding -- real,
 *  from the engine (area = current / density, the same division buildBOM
 *  itself does for the winding's own conductor area). Lead lengths,
 *  routing clearances and lead-to-lead spacing are manufacturing choices,
 *  not calculated quantities, so they print "to be specified". */
export function LeadArrangementDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  const vg = parseVectorGroup(params.vector);
  const hvLeadArea = design.iHV / design.dHV;
  const lvLeadArea = design.iLV / design.dLV;

  const box = { w: 380, h: 300 };
  const margin = { top: 30, bottom: 40, side: 40 };
  const fit = fitToViewBox(design.tankW, design.tankH, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 10);
  const tankWpx = design.tankW * fit.scale, tankHpx = design.tankH * fit.scale;
  const tx = margin.side + fit.offsetX, ty = margin.top + fit.offsetY;
  const coilX = tx + tankWpx * 0.3, coilTopY = ty + tankHpx * 0.25, coilBotY = ty + tankHpx * 0.75;
  const bushX = tx + tankWpx * 0.75;

  return (
    <Card title="Lead Arrangement" subtitle={`Drawing ${drawingNo(project, '17')} · schematic routing, ${params.vector}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <rect x={tx} y={ty} width={tankWpx} height={tankHpx} fill="none" stroke="var(--color-ink)" strokeWidth={1.8} />
          <rect x={coilX - 8} y={coilTopY} width={16} height={coilBotY - coilTopY} fill="var(--color-copper)" fillOpacity={0.2} stroke="var(--color-copper)" strokeWidth={1.5} />

          {/* HV lead: coil top to a bushing at the cover */}
          <path d={`M${coilX},${coilTopY} L${coilX},${ty + 10} L${bushX},${ty + 10} L${bushX},${ty - 6}`} fill="none" stroke="var(--color-ink)" strokeWidth={1.8} />
          <text x={(coilX + bushX) / 2} y={ty + 6} textAnchor="middle" className="font-mono" fontSize={5.5} fill="var(--color-ink2)">HV lead</text>

          {/* LV leads: coil to LV bushings, schematic count from the vector group */}
          {vg.lvLabels.map((label, i) => {
            const y = coilBotY - 10 - i * 14;
            return (
              <g key={label}>
                <path d={`M${coilX},${y} L${coilX - 26 - i * 6},${y} L${coilX - 26 - i * 6},${ty + tankHpx - 10}`} fill="none" stroke="var(--color-steel)" strokeWidth={0.9} />
                <text x={coilX - 30 - i * 6} y={ty + tankHpx - 4} textAnchor="middle" className="font-mono" fontSize={5} fill="var(--color-steel)">{label}</text>
              </g>
            );
          })}

          {/* Tap leads to a terminal block, schematic */}
          <path d={`M${coilX + 8},${coilTopY + 12} L${coilX + 34},${coilTopY + 12}`} fill="none" stroke="var(--color-ink2)" strokeWidth={0.8} />
          <rect x={coilX + 36} y={coilTopY + 6} width={14} height={12} fill="none" stroke="var(--color-ink)" strokeWidth={1.2} />
          <text x={coilX + 43} y={coilTopY + 26} textAnchor="middle" className="font-mono" fontSize={4.5} fill="var(--color-ink2)">Tap changer</text>

          <DimensionHorizontal x1={tx} x2={coilX - 26 - (vg.lvLabels.length - 1) * 6} featureY={ty + tankHpx - 10} dimY={ty + tankHpx + 16} label="to be specified" arrowId={arrowId} />
          <DimensionVertical y1={ty} y2={ty + tankHpx} featureX={tx} dimX={tx - 16} label={dimText(design.tankH)} arrowId={arrowId} />

          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <DataRow label="HV Lead Cross-Section" value={hvLeadArea.toFixed(1)} unit="mm²" tone="copper" />
          <DataRow label="HV Lead Current Density" value={design.dHV.toFixed(2)} unit="A/mm²" />
          <DataRow label="LV Lead Cross-Section" value={lvLeadArea.toFixed(1)} unit="mm²" tone="copper" />
          <DataRow label="LV Lead Current Density" value={design.dLV.toFixed(2)} unit="A/mm²" />
          <DataRow label="Neutral Lead" value={vg.lvNeutral ? `sized as LV, ${lvLeadArea.toFixed(1)} mm²` : 'not applicable, no LV neutral'} />
          <DataRow label="Lead Lengths" value="to be specified" />
          <DataRow label="Clearance to Tank Wall" value="to be specified" />
          <DataRow label="Clearance to Core" value="to be specified" />
          <DataRow label="Lead-to-Lead Spacing" value="to be specified" />
          <p className="text-[10px] text-steel pt-2 leading-snug">
            Each lead's cross-section is sized on the same current density as its own winding. Routing, lengths and
            clearances are manufacturing choices, not calculated.
          </p>
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '17')} title="Lead Arrangement" rev={project?.revision ?? 0}
        sheet={17} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}
