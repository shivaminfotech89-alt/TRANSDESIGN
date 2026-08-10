import React, { useId } from 'react';
import { Card, DataRow, thCls, tdCls } from '../ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
  drawingNo, ratingLabel,
} from './DrawingPrimitives';
import { PART_NUMBERS } from './partNumbers';

interface Props { design: any; params: any; project: any; }

/**
 * DRAWINGS.md, "Windings: drawings 8, 9, 10". A winding's radial build (a
 * few tens of mm) is one to two orders of magnitude smaller than its axial
 * height (hundreds to a thousand-plus mm), so a single true-to-scale factor
 * would draw every turn and layer division thinner than a hairline --
 * legible for nothing. Both drawings below use two independently
 * geometry-derived scales, one per axis, exactly like a manufacturer's
 * "developed" winding section: still nothing hardcoded, just not the same
 * number in both directions. Said so on the sheet, not left for the reader
 * to assume it is a single uniform scale.
 */

function EndBlocks({ x, w, topY, h, bottomY }: { x: number; w: number; topY: number; h: number; bottomY: number }) {
  return (
    <>
      <rect x={x} y={topY} width={w} height={h} fill="var(--color-sheetAlt)" stroke="var(--color-ink2)" strokeWidth={0.6} />
      <rect x={x} y={bottomY} width={w} height={h} fill="var(--color-sheetAlt)" stroke="var(--color-ink2)" strokeWidth={0.6} />
    </>
  );
}

/** A small OD/ID circle pair, reusing exactly CoreCrossSection's diameter-
 *  dimension pattern, so the winding's ID and OD are graphically
 *  dimensioned too, not only stated in the schedule. */
function DiameterPair({ x, y, size, od, id, arrowId, odColor, idColor }: {
  x: number; y: number; size: number; od: number; id: number; arrowId: string; odColor: string; idColor: string;
}) {
  const R = size / 2;
  const cx = x + R, cy = y + R;
  const rOD = R, rID = R * (id / od);
  return (
    <g>
      <circle cx={cx} cy={cy} r={rOD} fill="none" stroke={odColor} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={rID} fill="none" stroke={idColor} strokeWidth={1} strokeDasharray="4 2" />
      <DimensionVertical y1={cy - rOD} y2={cy + rOD} featureX={cx + rOD} dimX={x + size + 16} label={dimText(od, { diameter: true })} arrowId={arrowId} />
      <DimensionVertical y1={cy - rID} y2={cy + rID} featureX={cx + rID} dimX={x + size + 32} label={dimText(id, { diameter: true })} arrowId={arrowId} />
    </g>
  );
}

/** DRAWINGS.md, drawing 8: inner cylinder, winding block with turns drawn
 *  across the radial build, end blocks, start and finish tabs. Every
 *  lvTurnLayers division is a real radial layer boundary -- in the common
 *  full-height-foil regime that is one line per turn (lvTurnLayers === nLV);
 *  where the foil is thin enough to need several axial turns per radial
 *  layer instead, each division still bounds a real layer, just one that
 *  holds more than one turn, named in the note beneath. */
export function LvWindingDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  const box = { w: 380, h: 320 };
  const margin = { top: 20, bottom: 34, left: 34 };
  const scaleY = (box.h - margin.top - margin.bottom) / (design.hLV + 2 * params.endClrLV);
  const scaleX = 60 / (params.cylThk + design.lvRadial);

  const blockH = design.hLV * scaleY, endH = params.endClrLV * scaleY;
  const originY = margin.top, blockY = originY + endH, bottomEndY = blockY + blockH;
  const cylX = margin.left, cylW = Math.max(2, params.cylThk * scaleX);
  const lvX = cylX + cylW, lvW = design.lvRadial * scaleX;

  const perAxial = Math.max(1, Math.round(design.nLV / design.lvTurnLayers));
  const turnLines = Array.from({ length: design.lvTurnLayers - 1 }, (_, i) => lvX + ((i + 1) * lvW) / design.lvTurnLayers);

  const heightDimX = lvX + lvW + 16;
  const radialDimY = bottomEndY + endH + 14;

  return (
    <Card
      title="LV Winding Drawing"
      subtitle={`Drawing ${drawingNo(project, '08')} · ${design.cLV.name}, radial scale exaggerated relative to height for legibility`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          {/* Inner cylinder */}
          <rect x={cylX} y={blockY} width={cylW} height={blockH} fill="var(--color-sheetAlt)" stroke="var(--color-ink)" strokeWidth={0.8} />
          {/* Winding block */}
          <rect x={lvX} y={blockY} width={lvW} height={blockH} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
          {turnLines.map((tx, i) => (
            <line key={i} x1={tx} y1={blockY} x2={tx} y2={bottomEndY} stroke="var(--color-copper)" strokeWidth={0.3} />
          ))}
          <EndBlocks x={lvX} w={lvW} topY={originY} h={endH} bottomY={bottomEndY} />
          {/* Start / finish tabs */}
          <line x1={lvX} y1={originY + endH * 0.3} x2={lvX - 14} y2={originY + endH * 0.3} stroke="var(--color-ink2)" strokeWidth={0.8} />
          <text x={lvX - 16} y={originY + endH * 0.3} textAnchor="end" className="font-mono" fontSize={6} fill="var(--color-ink2)">Start</text>
          <line x1={lvX} y1={bottomEndY + endH * 0.7} x2={lvX - 14} y2={bottomEndY + endH * 0.7} stroke="var(--color-ink2)" strokeWidth={0.8} />
          <text x={lvX - 16} y={bottomEndY + endH * 0.7} textAnchor="end" className="font-mono" fontSize={6} fill="var(--color-ink2)">Finish</text>

          <DimensionVertical y1={originY} y2={bottomEndY + endH} featureX={lvX + lvW} dimX={heightDimX} label={dimText(design.Hw)} arrowId={arrowId} />
          <DimensionVertical y1={blockY} y2={bottomEndY} featureX={cylX} dimX={cylX - 16} label={dimText(design.hLV)} arrowId={arrowId} />
          <DimensionVertical y1={originY} y2={blockY} featureX={cylX} dimX={cylX - 30} label={dimText(params.endClrLV)} arrowId={arrowId} />
          <DimensionHorizontal x1={cylX} x2={lvX} featureY={blockY} dimY={originY - 10} label={dimText(params.cylThk, { decimals: 1 })} arrowId={arrowId} />
          <DimensionHorizontal x1={lvX} x2={lvX + lvW} featureY={bottomEndY} dimY={radialDimY} label={dimText(design.lvRadial, { decimals: 1 })} arrowId={arrowId} />

          <DiameterPair
            x={lvX + lvW + 50} y={margin.top} size={90} od={design.lvOD} id={design.lvID}
            arrowId={arrowId} odColor="var(--color-ink)" idColor="var(--color-steel)"
          />
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <DataRow label="Conductor and Form" value={`${design.cLV.name}, ${perAxial > 1 ? 'helical strip' : 'full-height foil'}`} />
          <DataRow label="Section" value={`${design.foilW.toFixed(0)} x ${design.tLV.toFixed(2)}`} unit="mm" />
          <DataRow label="Area" value={design.aLVreq.toFixed(1)} unit="mm²" />
          <DataRow label="Turns per Phase" value={String(design.nLV)} />
          <DataRow label="Radial Layers" value={perAxial > 1 ? `${design.lvTurnLayers} (${perAxial} turns each)` : String(design.lvTurnLayers)} />
          <DataRow label="Interturn Insulation" value={params.lvIns.toFixed(2)} unit="mm" />
          <DataRow label="Mean Turn" value={design.lmtLV.toFixed(3)} unit="m" />
          <DataRow label="Current" value={design.iLV.toFixed(1)} unit="A" />
          <DataRow label="Current Density" value={design.dLV.toFixed(2)} unit="A/mm²" />
          <DataRow label={`Resistance at ${design.refT} °C`} value={design.rLV.toExponential(3)} unit="Ω" />
          <DataRow label="Mass, 3 Phases" value={design.wLV.toFixed(1)} unit="kg" tone="copper" />
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '08')} title="LV Winding Drawing" rev={project?.revision ?? 0}
        sheet={8} totalSheets={21} fit={{ scale: scaleY, offsetX: 0, offsetY: 0 }} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.cLV.name} partNumber={PART_NUMBERS.lvCoil}
      />
    </Card>
  );
}

/** DRAWINGS.md, drawing 9: LV to HV gap, winding block with every layer
 *  drawn separately, cooling ducts, end blocks. `layers` is sized for
 *  nHVmax (buildFactor of the tap range, engine: layers =
 *  ceil(nHVmax/turnsPerLayer)), so the layer count and duct count drawn
 *  here already account for the full tap range, same as drawing 10's tap
 *  table. */
export function HvWindingDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  const box = { w: 400, h: 320 };
  const margin = { top: 20, bottom: 34, left: 34 };
  const scaleY = (box.h - margin.top - margin.bottom) / (design.hHV + 2 * params.endClrHV);
  const scaleX = 90 / (params.lvHvClr + design.hvRadial);

  const blockH = design.hHV * scaleY, endH = params.endClrHV * scaleY;
  const originY = margin.top, blockY = originY + endH, bottomEndY = blockY + blockH;
  const gapX = margin.left, gapW = params.lvHvClr * scaleX;
  const hvX = gapX + gapW, hvW = design.hvRadial * scaleX;

  // Same construction as buildBOM's hvRadial: layers*(rdHV+hvPaper) segments
  // separated by hvInterlayer gaps, plus hvDucts extra 6 mm oil-duct gaps
  // spread evenly among the layer boundaries -- their count and total width
  // are real (the formula hvRadial is built from); their exact position
  // among the layers is not modelled by the engine, so it is spread evenly
  // rather than picked arbitrarily at one end.
  const layerW = (design.rdHV + params.hvPaper) * scaleX;
  const ductAfter = new Set<number>();
  for (let d = 1; d <= design.hvDucts; d++) ductAfter.add(Math.round((design.layers * d) / (design.hvDucts + 1)));
  let cursor = hvX;
  const layerRects: { x: number; w: number }[] = [];
  const ductRects: { x: number; w: number }[] = [];
  for (let i = 0; i < design.layers; i++) {
    layerRects.push({ x: cursor, w: layerW });
    cursor += layerW;
    if (i < design.layers - 1) {
      cursor += params.hvInterlayer * scaleX;
      if (ductAfter.has(i + 1)) {
        const ductW = 6 * scaleX;
        ductRects.push({ x: cursor, w: ductW });
        cursor += ductW;
      }
    }
  }

  const heightDimX = hvX + hvW + 16;
  const radialDimY = bottomEndY + endH + 14;

  return (
    <Card
      title="HV Winding Drawing"
      subtitle={`Drawing ${drawingNo(project, '09')} · ${design.cHV.name}, radial scale exaggerated relative to height for legibility`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          {/* LV to HV gap */}
          <rect x={gapX} y={blockY} width={gapW} height={blockH} fill="var(--color-sheetAlt)" stroke="var(--color-steel)" strokeWidth={0.6} strokeDasharray="3 2" />
          {layerRects.map((r, i) => (
            <rect key={i} x={r.x} y={blockY} width={r.w} height={blockH} fill="none" stroke="var(--color-ink)" strokeWidth={0.8} />
          ))}
          {ductRects.map((r, i) => (
            <rect key={i} x={r.x} y={blockY} width={r.w} height={blockH} fill="var(--color-sheet)" stroke="var(--color-steel)" strokeWidth={0.6} strokeDasharray="2 2" />
          ))}
          <EndBlocks x={hvX} w={hvW} topY={originY} h={endH} bottomY={bottomEndY} />
          <line x1={hvX} y1={originY + endH * 0.3} x2={hvX - 14} y2={originY + endH * 0.3} stroke="var(--color-ink2)" strokeWidth={0.8} />
          <text x={hvX - 16} y={originY + endH * 0.3} textAnchor="end" className="font-mono" fontSize={6} fill="var(--color-ink2)">Start</text>
          <line x1={hvX + hvW} y1={bottomEndY + endH * 0.7} x2={hvX + hvW + 14} y2={bottomEndY + endH * 0.7} stroke="var(--color-ink2)" strokeWidth={0.8} />
          <text x={hvX + hvW + 16} y={bottomEndY + endH * 0.7} textAnchor="start" className="font-mono" fontSize={6} fill="var(--color-ink2)">Finish</text>

          <DimensionVertical y1={originY} y2={bottomEndY + endH} featureX={hvX + hvW} dimX={heightDimX} label={dimText(design.Hw)} arrowId={arrowId} />
          <DimensionVertical y1={blockY} y2={bottomEndY} featureX={gapX} dimX={gapX - 16} label={dimText(design.hHV)} arrowId={arrowId} />
          <DimensionHorizontal x1={gapX} x2={hvX} featureY={blockY} dimY={originY - 10} label={dimText(params.lvHvClr)} arrowId={arrowId} />
          <DimensionHorizontal x1={hvX} x2={hvX + hvW} featureY={bottomEndY} dimY={radialDimY} label={dimText(design.hvRadial, { decimals: 1 })} arrowId={arrowId} />

          <DiameterPair
            x={hvX + hvW + 50} y={margin.top} size={100} od={design.hvOD} id={design.hvID}
            arrowId={arrowId} odColor="var(--color-ink)" idColor="var(--color-steel)"
          />
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <DataRow label="Conductor" value={design.cHV.name} />
          <DataRow label="Section" value={`${design.axHV.toFixed(2)} x ${design.rdHV.toFixed(2)}`} unit="mm" />
          <DataRow label="Area" value={design.aHVreq.toFixed(2)} unit="mm²" />
          <DataRow label="Turns, Normal / Extreme Tap" value={`${design.nHV} / ${design.nHVmax}`} />
          <DataRow label="Layers x Turns per Layer" value={`${design.layers} x ${design.turnsPerLayer}`} />
          <DataRow label="Volts per Layer" value={design.voltsPerLayer.toFixed(1)} unit="V" />
          <DataRow label="Interlayer Insulation" value={params.hvInterlayer.toFixed(2)} unit="mm" />
          <DataRow label="Duct Count x Width" value={`${design.hvDucts} x 6`} unit="mm" />
          <DataRow label="Mean Turn" value={design.lmtHV.toFixed(3)} unit="m" />
          <DataRow label="Current" value={design.iHV.toFixed(2)} unit="A" />
          <DataRow label="Current Density" value={design.dHV.toFixed(2)} unit="A/mm²" />
          <DataRow label={`Resistance at ${design.refT} °C`} value={design.rHV.toFixed(3)} unit="Ω" />
          <DataRow label="Mass, 3 Phases" value={design.wHV.toFixed(1)} unit="kg" tone="copper" />
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '09')} title="HV Winding Drawing" rev={project?.revision ?? 0}
        sheet={9} totalSheets={21} fit={{ scale: scaleY, offsetX: 0, offsetY: 0 }} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.cHV.name} partNumber={PART_NUMBERS.hvCoil}
      />
    </Card>
  );
}

/**
 * DRAWINGS.md, drawing 10 (new): the tap table is fully computed --
 * turns(pct) = round(nHV*(1+pct/100)) is exactly the formula the engine
 * itself uses for nHVmax (at pct = tapPlus), so the extreme-tap row here
 * reproduces design.nHVmax exactly rather than a second calculation that
 * could drift from it, and the pct = 0 row reproduces design.nHV exactly
 * for the same reason. Voltage at a tap is hvPh*(1+pct/100); volts per
 * turn is that divided by the tap's own rounded turns, so it is not quite
 * the nominal et at every position -- the real effect of rounding a
 * fractional turnsPerStep to a whole number of turns, which is exactly
 * what a real tap table is for.
 *
 * The physical tap section (its height and where each lead is taken off
 * the coil) is not modelled by the engine -- winding layout of which
 * layers carry the taps is a manufacturing choice, not a calculated
 * quantity -- so that drawing is schematic and those two dimensions print
 * "to be specified" rather than a invented figure.
 */
export function TapWindingDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  if (params.tapType === 'none') {
    return (
      <Card title="Tap Winding Drawing" subtitle={`Drawing ${drawingNo(project, '10')}`}>
        <p className="text-[11px] text-steel">No tappings on this design -- params.tapType is "none".</p>
      </Card>
    );
  }

  const positions: { pos: number; pct: number; turns: number; voltage: number; voltsPerTurn: number }[] = [];
  const n = design.tapSteps;
  for (let i = 0; i < n; i++) {
    const pct = -params.tapMinus + i * params.tapStep;
    const turns = Math.round(design.nHV * (1 + pct / 100));
    const voltage = design.hvPh * (1 + pct / 100);
    positions.push({ pos: i + 1, pct, turns, voltage, voltsPerTurn: voltage / turns });
  }
  const principal = positions.reduce((a, b) => (Math.abs(b.pct) < Math.abs(a.pct) ? b : a));

  const box = { w: 280, h: 260 };
  const margin = { top: 24, bottom: 30, side: 40 };
  const fit = fitToViewBox(design.hvRadial, design.hHV, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 6);
  const hvW = design.hvRadial * fit.scale, hvH = design.hHV * fit.scale;
  const hx = margin.side + fit.offsetX, hy = margin.top + fit.offsetY;
  const tapSectionH = hvH * 0.28; // schematic only -- see note above
  const leadGap = tapSectionH / Math.max(1, n - 1);

  return (
    <Card title="Tap Winding Drawing" subtitle={`Drawing ${drawingNo(project, '10')} · ${n} positions, tapped section shown schematically`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <rect x={hx} y={hy} width={hvW} height={hvH} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
          <rect x={hx} y={hy} width={hvW} height={tapSectionH} fill="var(--color-sheetAlt)" stroke="var(--color-copper)" strokeWidth={0.8} strokeDasharray="4 2" />
          {positions.map((p, i) => {
            const ly = hy + (i * leadGap) + leadGap * 0.5 * (n === 1 ? 1 : 0);
            const leadY = hy + (n > 1 ? (i * tapSectionH) / (n - 1) : tapSectionH / 2);
            return (
              <g key={p.pos}>
                <line x1={hx + hvW} y1={leadY} x2={hx + hvW + 24} y2={leadY} stroke="var(--color-ink2)" strokeWidth={0.6} />
                <line x1={hx + hvW + 24} y1={leadY} x2={hx + hvW + 34} y2={hy - 6 + i * 5} stroke="var(--color-ink2)" strokeWidth={0.6} />
                <text x={hx + hvW + 36} y={hy - 6 + i * 5} textAnchor="start" className="font-mono" fontSize={6} fill="var(--color-ink2)">{p.pos}</text>
              </g>
            );
          })}
          <rect x={hx + hvW + 48} y={hy - 10} width={22} height={n * 5 + 8} fill="none" stroke="var(--color-ink)" strokeWidth={0.8} />
          <text x={hx + hvW + 59} y={hy + n * 2.5} textAnchor="middle" className="font-display uppercase" fontSize={5} fill="var(--color-ink2)" transform={`rotate(-90 ${hx + hvW + 59} ${hy + n * 2.5})`}>Terminal Block</text>

          <DimensionVertical y1={hy} y2={hy + tapSectionH} featureX={hx} dimX={hx - 16} label="to be specified" arrowId={arrowId} fontSize={5} />
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-ink2 leading-snug mb-2">
            Tap take-off positions from the coil end: to be specified, a manufacturing layout choice, not engine
            output. The table is fully computed.
          </p>
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCls}>Pos</th>
                <th className={`${thCls} text-right`}>%</th>
                <th className={`${thCls} text-right`}>HV Turns</th>
                <th className={`${thCls} text-right`}>Voltage</th>
                <th className={`${thCls} text-right`}>V / Turn</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.pos} className={p.pos === principal.pos ? 'bg-sheetAlt' : ''}>
                  <td className={`${tdCls} text-[11px] text-ink2`}>{p.pos}{p.pos === principal.pos ? ' (principal)' : ''}</td>
                  <td className={`${tdCls} text-right font-mono text-[11px]`}>{p.pct > 0 ? '+' : ''}{p.pct.toFixed(2)}</td>
                  <td className={`${tdCls} text-right font-mono text-[11px] font-semibold`}>{p.turns}</td>
                  <td className={`${tdCls} text-right font-mono text-[11px]`}>{p.voltage.toFixed(0)} V</td>
                  <td className={`${tdCls} text-right font-mono text-[11px] text-steel`}>{p.voltsPerTurn.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 space-y-0.5">
            <DataRow label="Tap Changer Type" value={params.tapType === 'oltc' ? 'On-load' : 'Off-circuit'} />
            <DataRow label="Number of Positions" value={String(n)} />
            <DataRow label="Step Percentage" value={params.tapStep.toFixed(3)} unit="%" />
          </div>
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '10')} title="Tap Winding Drawing" rev={project?.revision ?? 0}
        sheet={10} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={design.cHV.name} partNumber={PART_NUMBERS.hvCoil}
      />
    </Card>
  );
}
