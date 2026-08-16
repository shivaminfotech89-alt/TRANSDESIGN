import React, { useId } from 'react';
import { Card, DataRow, thCls, tdCls } from '../ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
  drawingNo, ratingLabel,
} from './DrawingPrimitives';
import { PART_NUMBERS } from './partNumbers';
import { tappingSchedule, windingSchedule } from '@/packages/engine';

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

/** MANUFACTURING.md section 5 / DRAWINGS.md item 5: the real, ungapped
 *  axial layout of a crossover or disc HV winding's groups (coils or
 *  discs) -- one group's height is turnsPerLayer turns stacked axially
 *  (a crossover coil's own axial turns; one turn deep for a disc, since a
 *  disc's turns stack radially, not axially), groups themselves separated
 *  by groupGap. Shared by HvWindingDrawing and TapWindingDrawing so the
 *  two drawings' group positions are computed once, not twice -- they
 *  cannot disagree with each other, or with windingSchedule's own group
 *  count and per-group turns, because all three read the same
 *  design.numGroups/turnsPerLayer/groupGap this function is built from.
 *  Layer construction has no groups; callers branch on hvConstruction
 *  before calling this. */
function hvGroupLayout(design: any, params: any) {
  const groupH = design.turnsPerLayer * (design.axHV + params.hvPaper);
  const gap = design.groupGap;
  const groups: { y: number; h: number }[] = [];
  let y = 0;
  for (let i = 0; i < design.numGroups; i++) {
    groups.push({ y, h: groupH });
    y += groupH + gap;
  }
  return { groups, groupH, gap, totalH: Math.max(0, y - gap) };
}

/** Evenly sampled group indices so at most `max` are drawn -- the same
 *  technique FinOrRadiatorDrawing uses for a 116-panel radiator: a
 *  legible subset in the picture, the real complete count and every
 *  dimension in the schedule alongside it, never reduced. Always includes
 *  the first and last group, since those are the ones a winder locates
 *  the winding by (start and finish). */
function sampleGroupIndices(n: number, max: number): number[] {
  if (n <= max) return Array.from({ length: n }, (_, i) => i);
  const step = Math.max(1, Math.ceil(n / max));
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(i);
  if (out[out.length - 1] !== n - 1) out.push(n - 1);
  return out;
}

/** A short break mark between two drawn groups that are not adjacent in
 *  the real winding -- the standard drafting convention for "more of the
 *  same, not drawn," rather than leaving a gap that could be misread as
 *  physical spacing that isn't there. */
function BreakMark({ x, y }: { x: number; y: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" className="font-mono" fontSize={9} fill="var(--color-steel)">⋮</text>
  );
}

/** DRAWINGS.md, drawing 8: inner cylinder, winding block with turns drawn
 *  across the radial build, end blocks, start and finish tabs. Every
 *  lvTurnLayers division is a real radial layer boundary -- in the common
 *  full-height-foil regime that is one line per turn (lvTurnLayers === nLV);
 *  where the foil is thin enough to need several axial turns per radial
 *  layer instead, each division still bounds a real layer, just one that
 *  holds more than one turn, named in the note beneath.
 *
 *  ENGINE_VERSION 1.6.0, MANUFACTURING.md LV multi-layer strip
 *  construction: above p.lvFoilMaxKva, each radial layer is itself
 *  lvRadCount parallel conductors stacked radially (design.lvAxCount more
 *  stacked axially, not visible in this radial cross-section the same way
 *  HV's crossover coils aren't drawn axially subdivided here either --
 *  see the Parallel Conductors row instead). The radial division lines
 *  below now mark every one of the lvTurnLayers x lvRadCount cells this
 *  produces, not just the lvTurnLayers layer boundaries -- layer
 *  boundaries drawn heavier so the two are still visually distinct. Foil
 *  construction (lvRadCount === 1) reduces this to exactly the single set
 *  of layer lines this drawing always had. */
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
  const isStrip = design.lvConstruction === 'strip';
  const cellCount = design.lvTurnLayers * design.lvRadCount;
  const cellLines = Array.from({ length: cellCount - 1 }, (_, i) => ({
    x: lvX + ((i + 1) * lvW) / cellCount,
    isLayerBoundary: (i + 1) % design.lvRadCount === 0,
  }));

  const heightDimX = lvX + lvW + 16;
  const radialDimY = bottomEndY + endH + 14;

  return (
    <Card
      title="LV Winding Drawing"
      subtitle={`Drawing ${drawingNo(project, '08')} · ${design.cLV.name}, ${isStrip ? `multi-layer strip, ${design.lvAxCount}A x ${design.lvRadCount}R per layer` : 'full-height foil'}, radial scale exaggerated relative to height for legibility`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          {/* Inner cylinder */}
          <rect x={cylX} y={blockY} width={cylW} height={blockH} fill="var(--color-sheetAlt)" stroke="var(--color-ink)" strokeWidth={1.2} />
          {/* Winding block */}
          <rect x={lvX} y={blockY} width={lvW} height={blockH} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
          {cellLines.map((c, i) => (
            <line key={i} x1={c.x} y1={blockY} x2={c.x} y2={bottomEndY} stroke="var(--color-copper)" strokeWidth={c.isLayerBoundary ? 0.6 : 0.25} />
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
          <DataRow label="Conductor and Form" value={`${design.cLV.name}, ${isStrip ? 'multi-layer strip' : (perAxial > 1 ? 'helical strip' : 'full-height foil')}`} />
          <DataRow label="Section, One Conductor" value={`${design.foilW.toFixed(isStrip ? 2 : 0)} x ${design.tLV.toFixed(isStrip ? 3 : 2)}`} unit="mm" />
          <DataRow label="Area, One Turn" value={design.aLVreq.toFixed(1)} unit="mm²" />
          <DataRow label="Turns per Phase" value={String(design.nLV)} />
          {isStrip && (
            <DataRow label="Parallel Conductors" value={`${design.lvAxCount * design.lvRadCount} (${design.lvAxCount}A x ${design.lvRadCount}R)`} />
          )}
          <DataRow label="Radial Layers" value={!isStrip && perAxial > 1 ? `${design.lvTurnLayers} (${perAxial} turns each)` : String(design.lvTurnLayers)} />
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

/** DRAWINGS.md, drawing 9: LV to HV gap, then the HV winding drawn as what
 *  it actually is (MANUFACTURING.md section 5, ENGINE_VERSION 1.5.0):
 *
 *  - Layer: the original single continuous-layer rendering, unchanged --
 *    every radial layer drawn as a band across the full coil height,
 *    interlayer gaps and oil ducts spread among the layer boundaries.
 *  - Crossover: coils stacked axially (hvGroupLayout), each drawn as its
 *    own block with its own internal radial layer divisions -- a coil is
 *    a small layer winding in its own right, repeated numGroups times.
 *  - Disc: discs stacked axially, each one turn deep and the winding's
 *    full radial build wide -- no internal layer division (a disc's
 *    turns stack radially within one thin axial slice, not into several
 *    axially-stacked layers the way a coil's do).
 *
 *  Crossover and disc both read numGroups/layers/turnsPerLayer straight
 *  off `design` (designTransformer's own outputs) and groupRows straight
 *  off windingSchedule(design, params) -- the same function the
 *  Manufacturing tab's Winding Schedule card calls, so this drawing and
 *  that schedule cannot disagree about which group has how many turns.
 *  At high group counts the picture samples a legible subset
 *  (sampleGroupIndices, same technique as the 116-panel radiator
 *  drawing) with a break mark between non-adjacent drawn groups; the
 *  group count, turns and dimensions in the table beside it are always
 *  the complete, real figures. */
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

  const isLayer = design.hvConstruction === 'layer';
  const schedule = !isLayer ? windingSchedule(design, params) : null;
  const layout = !isLayer ? hvGroupLayout(design, params) : null;
  const drawnIdx = layout ? sampleGroupIndices(design.numGroups, 16) : [];
  const skippedSomewhere = layout ? drawnIdx.length < design.numGroups : false;

  // Layer construction: same layout as before this section existed --
  // layers*(rdHV+hvPaper) segments separated by hvInterlayer gaps, plus
  // hvDucts extra 6 mm oil-duct gaps spread evenly among the layer
  // boundaries. Their count and total width are real (the formula hvRadial
  // is built from); their exact position among the layers is not modelled
  // by the engine, so it is spread evenly rather than picked arbitrarily.
  const layerW = (design.rdHV + params.hvPaper) * scaleX;
  const ductAfter = new Set<number>();
  for (let d = 1; d <= design.hvDucts; d++) ductAfter.add(Math.round((design.layers * d) / (design.hvDucts + 1)));
  let cursor = hvX;
  const layerRects: { x: number; w: number }[] = [];
  const ductRects: { x: number; w: number }[] = [];
  if (isLayer) {
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
  }

  const heightDimX = hvX + hvW + 16;
  const radialDimY = bottomEndY + endH + 14;

  return (
    <Card
      title="HV Winding Drawing"
      subtitle={`Drawing ${drawingNo(project, '09')} · ${design.cHV.name}, ${
        isLayer ? 'single continuous layer' : `${design.hvConstruction}, ${design.numGroups} ${schedule!.hv.label}s`
      }, radial scale exaggerated relative to height for legibility`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          {/* LV to HV gap */}
          <rect x={gapX} y={blockY} width={gapW} height={blockH} fill="var(--color-sheetAlt)" stroke="var(--color-steel)" strokeWidth={0.6} strokeDasharray="3 2" />

          {isLayer && layerRects.map((r, i) => (
            <rect key={i} x={r.x} y={blockY} width={r.w} height={blockH} fill="none" stroke="var(--color-ink)" strokeWidth={1.2} />
          ))}
          {isLayer && ductRects.map((r, i) => (
            <rect key={i} x={r.x} y={blockY} width={r.w} height={blockH} fill="var(--color-sheet)" stroke="var(--color-steel)" strokeWidth={0.6} strokeDasharray="2 2" />
          ))}

          {!isLayer && layout && schedule && drawnIdx.map((gi, k) => {
            const g = layout.groups[gi];
            const gy = blockY + g.y * scaleY;
            const gh = Math.max(1, g.h * scaleY);
            const prevGi = k > 0 ? drawnIdx[k - 1] : null;
            const brokeBefore = prevGi != null && gi - prevGi > 1;
            return (
              <React.Fragment key={gi}>
                {brokeBefore && (
                  <BreakMark x={hvX + hvW / 2} y={(blockY + (layout.groups[prevGi!].y + layout.groups[prevGi!].h) * scaleY + gy) / 2} />
                )}
                <rect
                  x={hvX} y={gy} width={hvW} height={gh}
                  fill={design.hvConstruction === 'disc' ? 'var(--color-sheetAlt)' : 'none'}
                  stroke="var(--color-ink)" strokeWidth={1.2}
                />
                {design.hvConstruction === 'crossover' && Array.from({ length: design.layers - 1 }, (_, li) => (
                  <line
                    key={li} x1={hvX + ((li + 1) * hvW) / design.layers} y1={gy}
                    x2={hvX + ((li + 1) * hvW) / design.layers} y2={gy + gh}
                    stroke="var(--color-copper)" strokeWidth={0.25}
                  />
                ))}
              </React.Fragment>
            );
          })}

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
          <DataRow label="Construction" value={isLayer ? 'Single continuous layer' : `${design.hvConstruction}, ${design.numGroups} ${schedule!.hv.label}s`} />
          <DataRow label={isLayer ? 'Layers x Turns per Layer' : `Layers per ${schedule!.hv.label} (fullest) x Turns per Layer`} value={`${design.layers} x ${design.turnsPerLayer}`} />
          <DataRow label="Volts per Layer" value={design.voltsPerLayer.toFixed(1)} unit="V" />
          <DataRow label="Interlayer Insulation" value={params.hvInterlayer.toFixed(2)} unit="mm" />
          <DataRow label="Duct Count x Width" value={`${design.hvDucts} x 6`} unit="mm" />
          <DataRow label="Mean Turn" value={design.lmtHV.toFixed(3)} unit="m" />
          <DataRow label="Current" value={design.iHV.toFixed(2)} unit="A" />
          <DataRow label="Current Density" value={design.dHV.toFixed(2)} unit="A/mm²" />
          <DataRow label={`Resistance at ${design.refT} °C`} value={design.rHV.toFixed(3)} unit="Ω" />
          <DataRow label="Mass, 3 Phases" value={design.wHV.toFixed(1)} unit="kg" tone="copper" />
          {!isLayer && skippedSomewhere && (
            <p className="text-[10px] text-steel pt-1">
              {drawnIdx.length} of {design.numGroups} {schedule!.hv.label}s drawn for legibility; the full
              row-by-row breakdown is in the Manufacturing tab's Winding Schedule.
            </p>
          )}
          {!isLayer && (
            <p className="text-[10px] text-steel">
              Every {schedule!.hv.label} drawn at the same radial width ({design.hvRadial.toFixed(1)} mm) --
              actual turns vary by {schedule!.hv.label} as the Winding Schedule states; this drawing does not
              vary the width to match.
            </p>
          )}
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
 * DRAWINGS.md, drawing 10: the tap table is fully computed by
 * tappingSchedule(design, params) (packages/engine/index.js) -- the same
 * function the Manufacturing tab's Tapping Schedule card reads, so this
 * drawing and that schedule cannot disagree about a tap's turns, voltage
 * or volts-per-turn error.
 *
 * For crossover and disc HV (MANUFACTURING.md section 5), the tap leads
 * are drawn coming off the actual coil or disc each tap position's turn
 * count falls within -- found by walking windingSchedule's own per-group
 * turns cumulatively until it passes each position's turnsInCircuit, the
 * same group layout HvWindingDrawing draws, so the two pictures agree on
 * where each group physically sits. Only positions that land in the
 * legible drawn subset get a lead line in the picture; the table beside
 * it is always the complete list. The regulating section (turnsBelow /
 * turnsAbove from tappingSchedule) is shaded across the groups it spans,
 * showing where the tap changer's own coils or discs sit in the winding,
 * not just a schematic band.
 *
 * Layer HV construction has no coil or disc to attach a lead to -- winding
 * layout of which physical layer carries which tap is a manufacturing
 * choice, not a calculated quantity, so that case keeps the original
 * schematic band and "to be specified" take-off dimension.
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

  const tap = tappingSchedule(design, params);
  const principal = tap.rows.find((r: any) => r.isNormal) ?? tap.rows[0];
  const isLayer = design.hvConstruction === 'layer';

  const box = { w: 280, h: 260 };
  const margin = { top: 24, bottom: 30, side: 40 };
  const fit = fitToViewBox(design.hvRadial, design.hHV, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 6);
  const hvW = design.hvRadial * fit.scale, hvH = design.hHV * fit.scale;
  const hx = margin.side + fit.offsetX, hy = margin.top + fit.offsetY;

  // Multi-coil: real group layout, scaled the same way as HvWindingDrawing
  // (a fraction of hHV, since totalH <= hHV by construction), sampled for
  // legibility, with each drawn tap position's lead found by walking
  // windingSchedule's cumulative turns.
  const schedule = !isLayer ? windingSchedule(design, params) : null;
  const layout = !isLayer ? hvGroupLayout(design, params) : null;
  const groupScaleY = layout && layout.totalH > 0 ? hvH / (design.hHV) : 1;
  const drawnIdx = layout ? sampleGroupIndices(design.numGroups, 14) : [];

  let cumBefore: number[] = [];
  if (schedule) {
    let running = 0;
    cumBefore = schedule.groupRows.map((r: any) => { const before = running; running += r.turns; return before; });
  }
  /** Which group (0-based) a given turnsInCircuit count falls within --
   *  the same cumulative walk MANUFACTURING.md section 1's tap section
   *  placement will eventually drive the disc grading from. */
  const groupForTurns = (turns: number): number => {
    if (!schedule) return -1;
    let idx = 0;
    for (let i = 0; i < schedule.groupRows.length; i++) {
      if (turns > cumBefore[i]) idx = i; else break;
    }
    return idx;
  };
  const groupY = (gi: number) => hy + layout!.groups[gi].y * groupScaleY;
  const groupCenterY = (gi: number) => groupY(gi) + Math.max(1, layout!.groups[gi].h * groupScaleY) / 2;

  // tappingSchedule's own regulating section (sectionStart to sectionFinish)
  // reconstructed from turnsBelow/regulatingTurns rather than re-imported,
  // since turnsBelow + 1 = sectionStart and turnsBelow + regulatingTurns =
  // sectionFinish by that function's own definition.
  const regGroupStart = schedule ? groupForTurns(tap.turnsBelow + 1) : -1;
  const regGroupEnd = schedule ? groupForTurns(tap.turnsBelow + tap.regulatingTurns) : -1;

  const tapSectionH = hvH * 0.28; // schematic only -- layer construction has no group to place this against

  return (
    <Card title="Tap Winding Drawing" subtitle={`Drawing ${drawingNo(project, '10')} · ${tap.rows.length} positions${isLayer ? ', tapped section shown schematically' : `, regulating section spans ${schedule!.hv.label}s ${regGroupStart + 1}-${regGroupEnd + 1} of ${design.numGroups}`}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          <rect x={hx} y={hy} width={hvW} height={hvH} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />

          {isLayer && (
            <>
              <rect x={hx} y={hy} width={hvW} height={tapSectionH} fill="var(--color-sheetAlt)" stroke="var(--color-copper)" strokeWidth={0.8} strokeDasharray="4 2" />
              {tap.rows.map((p: any, i: number) => {
                const n = tap.rows.length;
                const leadY = hy + (n > 1 ? (i * tapSectionH) / (n - 1) : tapSectionH / 2);
                return (
                  <g key={p.position}>
                    <line x1={hx + hvW} y1={leadY} x2={hx + hvW + 24} y2={leadY} stroke="var(--color-ink2)" strokeWidth={0.6} />
                    <line x1={hx + hvW + 24} y1={leadY} x2={hx + hvW + 34} y2={hy - 6 + i * 5} stroke="var(--color-ink2)" strokeWidth={0.6} />
                    <text x={hx + hvW + 36} y={hy - 6 + i * 5} textAnchor="start" className="font-mono" fontSize={6} fill="var(--color-ink2)">{i + 1}</text>
                  </g>
                );
              })}
              <DimensionVertical y1={hy} y2={hy + tapSectionH} featureX={hx} dimX={hx - 16} label="to be specified" arrowId={arrowId} />
            </>
          )}

          {!isLayer && layout && schedule && (
            <>
              {/* Regulating section shading, top of its first group to bottom
                  of its last -- real position and extent, not schematic. */}
              {regGroupStart >= 0 && (
                <rect
                  x={hx} y={groupY(regGroupStart)} width={hvW}
                  height={Math.max(1, (groupY(regGroupEnd) + layout.groups[regGroupEnd].h * groupScaleY) - groupY(regGroupStart))}
                  fill="var(--color-sheetAlt)" stroke="var(--color-copper)" strokeWidth={0.8} strokeDasharray="4 2"
                />
              )}
              {drawnIdx.map((gi, k) => {
                const gy = groupY(gi), gh = Math.max(1, layout.groups[gi].h * groupScaleY);
                const prevGi = k > 0 ? drawnIdx[k - 1] : null;
                const brokeBefore = prevGi != null && gi - prevGi > 1;
                return (
                  <React.Fragment key={gi}>
                    {brokeBefore && <BreakMark x={hx + hvW / 2} y={(groupY(prevGi!) + (layout.groups[prevGi!].h * groupScaleY) + gy) / 2} />}
                    <rect x={hx} y={gy} width={hvW} height={gh} fill="none" stroke="var(--color-ink)" strokeWidth={0.9} />
                  </React.Fragment>
                );
              })}
              {tap.rows.map((p: any, i: number) => {
                const gi = groupForTurns(p.turns);
                if (!drawnIdx.includes(gi)) return null;
                const leadY = groupCenterY(gi);
                const stub = 10 + (i % 5) * 4;
                return (
                  <g key={p.position}>
                    <line x1={hx + hvW} y1={leadY} x2={hx + hvW + stub} y2={leadY} stroke="var(--color-ink2)" strokeWidth={0.6} />
                    <line x1={hx + hvW + stub} y1={leadY} x2={hx + hvW + stub + 10} y2={hy - 6 + i * 5} stroke="var(--color-ink2)" strokeWidth={0.6} />
                    <text x={hx + hvW + stub + 12} y={hy - 6 + i * 5} textAnchor="start" className="font-mono" fontSize={6} fill="var(--color-ink2)">{i + 1}</text>
                  </g>
                );
              })}
            </>
          )}

          <rect x={hx + hvW + 68} y={hy - 10} width={22} height={tap.rows.length * 5 + 8} fill="none" stroke="var(--color-ink)" strokeWidth={1.2} />
          <text x={hx + hvW + 79} y={hy + tap.rows.length * 2.5} textAnchor="middle" className="font-display uppercase" fontSize={5} fill="var(--color-ink2)" transform={`rotate(-90 ${hx + hvW + 79} ${hy + tap.rows.length * 2.5})`}>Terminal Block</text>

          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-ink2 leading-snug mb-2">
            {isLayer
              ? 'Tap take-off positions from the coil end: to be specified, a manufacturing layout choice, not engine output. The table is fully computed.'
              : `Tap leads shown coming off the ${schedule!.hv.label} each position's turns-in-circuit actually falls within (windingSchedule's own even distribution -- see the Manufacturing tab for the row-by-row turns). ${
                  drawnIdx.length < design.numGroups ? `Only positions landing in the ${drawnIdx.length} drawn ${schedule!.hv.label}s of ${design.numGroups} get a lead line in the picture; the table is always complete.` : 'All positions are shown.'
                }`}
          </p>
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCls}>Pos</th>
                <th className={`${thCls} text-right`}>%</th>
                <th className={`${thCls} text-right`}>HV Turns</th>
                <th className={`${thCls} text-right`}>Voltage</th>
                <th className={`${thCls} text-right`}>V / Turn</th>
                {!isLayer && <th className={`${thCls} text-right`}>{schedule!.hv.label}</th>}
              </tr>
            </thead>
            <tbody>
              {tap.rows.map((p: any, i: number) => (
                <tr key={p.position} className={p.position === principal.position ? 'bg-sheetAlt' : ''}>
                  <td className={`${tdCls} text-[11px] text-ink2`}>{i + 1}{p.position === principal.position ? ' (principal)' : ''}</td>
                  <td className={`${tdCls} text-right font-mono text-[11px]`}>{p.nominalPct > 0 ? '+' : ''}{p.nominalPct.toFixed(2)}</td>
                  <td className={`${tdCls} text-right font-mono text-[11px] font-semibold`}>{p.turns}</td>
                  <td className={`${tdCls} text-right font-mono text-[11px]`}>{p.voltage.toFixed(0)} V</td>
                  <td className={`${tdCls} text-right font-mono text-[11px] text-steel`}>{p.et.toFixed(3)}</td>
                  {!isLayer && <td className={`${tdCls} text-right font-mono text-[11px] text-steel`}>{groupForTurns(p.turns) + 1}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 space-y-0.5">
            <DataRow label="Tap Changer Type" value={params.tapType === 'oltc' ? 'On-load' : 'Off-circuit'} />
            <DataRow label="Number of Positions" value={String(tap.rows.length)} />
            <DataRow label="Step Percentage" value={params.tapStep.toFixed(3)} unit="%" />
            {!isLayer && (
              <DataRow
                label="Regulating Section"
                value={`${tap.regulatingTurns} turns, ${schedule!.hv.label}s ${regGroupStart + 1}-${regGroupEnd + 1}`}
              />
            )}
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
