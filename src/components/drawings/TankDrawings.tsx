import React, { useId } from 'react';
import { finLayout, radiatorLayout, conservatorSize } from '@/packages/engine';
import { Card, DataRow, thCls, tdCls } from '../ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
  drawingNo, ratingLabel,
} from './DrawingPrimitives';
import { PART_NUMBERS } from './partNumbers';
import { finPlacements, bankPlacements } from '../cad/geometry';

interface Props { design: any; params: any; project: any; }

/** DRAWINGS.md, drawing 13: tank plan and elevation with the fabrication
 *  detail. Plate thickness mirrors buildBOM's own tPlate formula exactly
 *  (kva > 2500 -> 6 mm, else 5 mm) rather than a second guess -- buildBOM
 *  does not export it, but it is a pure function of kva, which is real.
 *  Stiffener centres, fitting positions and the base frame are not held by
 *  the engine at all, so those print "to be specified" rather than an
 *  invented layout. */
export function TankFabricationDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  if (design.dry) {
    return (
      <Card title="Tank Fabrication Drawing" subtitle={`Drawing ${drawingNo(project, '13')}`}>
        <p className="text-[11px] text-steel">Not applicable: dry-type construction has an enclosure, not a fabricated tank.</p>
      </Card>
    );
  }
  const plateThk = params.kva > 2500 ? 6 : 5;

  const box = { w: 420, h: 500 };
  const margin = { top: 20, bottom: 20, side: 44 };
  const gapMM = design.tankH * 0.08;
  const fit = fitToViewBox(
    design.tankL, design.tankW + gapMM + design.tankH,
    box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 8,
  );
  const originX = margin.side + fit.offsetX;
  const planY = margin.top + fit.offsetY;
  const planH = design.tankW * fit.scale;
  const elevY = planY + planH + gapMM * fit.scale;
  const elevH = design.tankH * fit.scale;
  const tankLpx = design.tankL * fit.scale;
  const plateThkPx = Math.max(0.8, plateThk * fit.scale);

  const stiffenerXs = Array.from({ length: 5 }, (_, i) => originX + tankLpx * ((i + 1) / 6));

  return (
    <Card title="Tank Fabrication Drawing" subtitle={`Drawing ${drawingNo(project, '13')} · plan and elevation`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />

          {/* Plan */}
          <rect x={originX} y={planY} width={tankLpx} height={planH} fill="none" stroke="var(--color-ink)" strokeWidth={1.4} />
          <rect x={originX + plateThkPx} y={planY + plateThkPx} width={tankLpx - 2 * plateThkPx} height={planH - 2 * plateThkPx} fill="none" stroke="var(--color-ink2)" strokeWidth={0.5} />
          {stiffenerXs.map((sx, i) => (
            <line key={`ps${i}`} x1={sx} y1={planY} x2={sx} y2={planY + planH} stroke="var(--color-steel)" strokeWidth={0.6} strokeDasharray="2 2" />
          ))}
          {/* Fitting marks, schematic */}
          <circle cx={originX + tankLpx * 0.12} cy={planY + planH * 0.5} r={2.5} fill="none" stroke="var(--color-ink2)" strokeWidth={0.7} />
          <circle cx={originX + tankLpx * 0.88} cy={planY + planH * 0.5} r={2.5} fill="none" stroke="var(--color-ink2)" strokeWidth={0.7} />
          <DimensionHorizontal x1={originX} x2={originX + tankLpx} featureY={planY} dimY={planY - 12} label={dimText(design.tankL)} arrowId={arrowId} fontSize={5.5} />
          <DimensionVertical y1={planY} y2={planY + planH} featureX={originX} dimX={originX - 14} label={dimText(design.tankW)} arrowId={arrowId} fontSize={5.5} />

          {/* Elevation */}
          <rect x={originX} y={elevY} width={tankLpx} height={elevH} fill="none" stroke="var(--color-ink)" strokeWidth={1.4} />
          <rect x={originX + plateThkPx} y={elevY + plateThkPx} width={tankLpx - 2 * plateThkPx} height={elevH - 2 * plateThkPx} fill="none" stroke="var(--color-ink2)" strokeWidth={0.5} />
          {stiffenerXs.map((sx, i) => (
            <line key={`es${i}`} x1={sx} y1={elevY} x2={sx} y2={elevY + elevH} stroke="var(--color-steel)" strokeWidth={0.6} strokeDasharray="2 2" />
          ))}
          {/* Cover flange face */}
          <rect x={originX - 4} y={elevY - 5} width={tankLpx + 8} height={5} fill="var(--color-sheetAlt)" stroke="var(--color-ink)" strokeWidth={0.8} />
          {/* Base frame */}
          <rect x={originX - 6} y={elevY + elevH} width={tankLpx + 12} height={9} fill="none" stroke="var(--color-ink)" strokeWidth={0.8} />
          {/* Valve / fitting marks on the elevation */}
          <circle cx={originX + tankLpx * 0.1} cy={elevY + elevH * 0.9} r={2.5} fill="none" stroke="var(--color-ink2)" strokeWidth={0.7} />
          <circle cx={originX + tankLpx * 0.5} cy={elevY + elevH * 0.5} r={2.5} fill="none" stroke="var(--color-ink2)" strokeWidth={0.7} />

          <DimensionVertical y1={elevY} y2={elevY + elevH} featureX={originX + tankLpx} dimX={originX + tankLpx + 14} label={dimText(design.tankH)} arrowId={arrowId} fontSize={5.5} />
          <DimensionHorizontal x1={originX + plateThkPx} x2={originX + plateThkPx * 2} featureY={elevY} dimY={elevY - 12} label={dimText(plateThk, { decimals: 1 })} arrowId={arrowId} fontSize={5} />
          <DimensionHorizontal x1={stiffenerXs[0]} x2={stiffenerXs[1]} featureY={elevY} dimY={elevY - 24} label="to be specified" arrowId={arrowId} fontSize={5} />
          <DimensionVertical y1={elevY + elevH * 0.85} y2={elevY + elevH * 0.9} featureX={originX + tankLpx * 0.1} dimX={originX + tankLpx * 0.1 - 16} label="to be specified" arrowId={arrowId} fontSize={4.5} />

          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <DataRow label="Tank Inside Length x Width x Height" value={`${Math.round(design.tankL)} x ${Math.round(design.tankW)} x ${Math.round(design.tankH)}`} unit="mm" />
          <DataRow label="Plate Thickness" value={String(plateThk)} unit="mm" />
          <DataRow label="Tank Mass" value={design.wTank.toFixed(1)} unit="kg" tone="copper" />
          <DataRow label="Stiffener Centres" value="to be specified" />
          <DataRow label="Fitting Positions" value="to be specified" />
          <DataRow label="Base Frame Detail" value="to be specified" />
          <p className="text-[10px] text-steel pt-2 leading-snug">
            Cutting list and welding detail to be added by the fabrication shop.
          </p>
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '13')} title="Tank Fabrication Drawing" rev={project?.revision ?? 0}
        sheet={13} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material="Mild steel, IS 2062" partNumber={PART_NUMBERS.tank}
      />
    </Card>
  );
}

/** DRAWINGS.md, drawing 14: fin or radiator, driven by finLayout()/
 *  finPlacements() -- the same functions the 3D model and the GA note use,
 *  so count, pitch and depth cannot drift between the drawing, the 3D tab
 *  and the GA sheet. Fins/panels sit on the tankW faces, matching the side
 *  orthographic view and the (now corrected) preliminary tank layout, not
 *  the tankL ends. */
export function FinOrRadiatorDrawing({ design, params, project }: Props) {
  const arrowId = useId();
  if (design.dry) {
    return (
      <Card title="Radiator or Fin Drawing" subtitle={`Drawing ${drawingNo(project, '14')}`}>
        <p className="text-[11px] text-steel">Not applicable: dry-type construction has no tank-mounted cooling.</p>
      </Card>
    );
  }
  // CALIBRATION.md section 24: finLayout is fin-tank-only -- a radiator
  // design reads radiatorLayout, and its positions are BANKS (one header-
  // pipe-and-panels unit each), not individual fins.
  const isFin = params.tankType === 'fin';
  const fins = isFin ? finLayout(design) : null;
  const rad = isFin ? null : radiatorLayout(design);
  const cons = isFin ? null : conservatorSize(design);
  const depth = isFin ? fins!.depth : rad!.panelWidth;

  const box = { w: 380, h: 280 };
  const margin = { side: 40, top: 30, bottom: 46 };
  const fit = fitToViewBox(design.tankL, design.tankW + 2 * depth, box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 10);
  const tankLpx = design.tankL * fit.scale, tankWpx = design.tankW * fit.scale;
  const depthPx = depth * fit.scale;
  const tx = margin.side + fit.offsetX, ty = margin.top + fit.offsetY + depthPx;

  const positions = isFin
    ? finPlacements(fins!.perSide, design.tankL, design.tankH, fins!.height, 0)
    : bankPlacements(rad!.bankCount, rad!.panelsPerBank, rad!.panelPitch, design.tankL, design.tankH, rad!.panelHeight, 0);
  const pitch = positions.length > 1 ? positions[1].x - positions[0].x : 0;
  const wallExtent = positions.length > 1 ? positions[positions.length - 1].x - positions[0].x : 0;
  const perSideOrBank = isFin ? fins!.perSide : rad!.bankCount;
  const elemW = isFin ? Math.max(2, Math.min(6, (tankLpx / Math.max(1, perSideOrBank)) * 0.4)) : undefined;

  // At high fin counts (large ratings), drawing every position at elemW
  // would overlap them into a solid block -- illegible, not "showing the
  // count". Sampled evenly for the picture; pitch, wall extent and the
  // count in the table are still the real, complete numbers, never
  // reduced. Radiator banks are few enough (a handful, never dozens) that
  // every one is always drawn at its own real width.
  const drawStep = isFin ? Math.max(1, Math.ceil((elemW! * positions.length) / Math.max(1, tankLpx))) : 1;
  const drawnPositions = positions.filter((_, i) => i % drawStep === 0);

  const surfaceProvided = isFin ? fins!.n * fins!.per : rad!.totalPanels * rad!.per;

  return (
    <Card
      title="Radiator or Fin Drawing"
      subtitle={isFin
        ? `Drawing ${drawingNo(project, '14')} · fin tank, ${fins!.n} fins total, ${fins!.perSide} per tankW face`
        : `Drawing ${drawingNo(project, '14')} · radiator tank, ${rad!.totalPanels} panels total in ${rad!.bankCount} bank${rad!.bankCount === 1 ? '' : 's'} of ${rad!.panelsPerBank}`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />
          {drawnPositions.map((p, i) => {
            const px = tx + tankLpx / 2 + p.x * fit.scale;
            const w = isFin ? elemW! : Math.max(4, (p as any).width * fit.scale);
            return (
              <React.Fragment key={i}>
                <rect x={px - w / 2} y={ty - depthPx} width={w} height={depthPx} fill={isFin ? 'none' : 'var(--color-sheetAlt)'} stroke="var(--color-steel)" strokeWidth={0.6} />
                <rect x={px - w / 2} y={ty + tankWpx} width={w} height={depthPx} fill={isFin ? 'none' : 'var(--color-sheetAlt)'} stroke="var(--color-steel)" strokeWidth={0.6} />
                {!isFin && (
                  <>
                    {/* header pipes, top and bottom of the bank */}
                    <line x1={px - w / 2} y1={ty - depthPx * 0.15} x2={px + w / 2} y2={ty - depthPx * 0.15} stroke="var(--color-ink2)" strokeWidth={1.2} />
                    <line x1={px - w / 2} y1={ty + tankWpx + depthPx * 1.15} x2={px + w / 2} y2={ty + tankWpx + depthPx * 1.15} stroke="var(--color-ink2)" strokeWidth={1.2} />
                    {/* isolating valves at the tank-wall connection, top and bottom */}
                    <circle cx={px} cy={ty - depthPx - 4} r={2.2} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
                    <circle cx={px} cy={ty + tankWpx + depthPx + 4} r={2.2} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
                  </>
                )}
              </React.Fragment>
            );
          })}
          <rect x={tx} y={ty} width={tankLpx} height={tankWpx} fill="none" stroke="var(--color-ink)" strokeWidth={1} />

          <DimensionHorizontal x1={tx} x2={tx + tankLpx} featureY={ty + tankWpx} dimY={ty + tankWpx + depthPx + 16} label={dimText(design.tankL)} arrowId={arrowId} fontSize={5.5} />
          <DimensionVertical y1={ty} y2={ty + tankWpx} featureX={tx + tankLpx} dimX={tx + tankLpx + 14} label={dimText(design.tankW)} arrowId={arrowId} fontSize={5.5} />
          {positions.length > 0 && (
            <DimensionVertical
              y1={ty - depthPx} y2={ty} featureX={tx + tankLpx / 2 + positions[0].x * fit.scale}
              dimX={tx - 16} label={dimText(depth)} arrowId={arrowId} fontSize={5.5}
            />
          )}
          {positions.length > 1 && (
            <DimensionHorizontal
              x1={tx + tankLpx / 2 + positions[0].x * fit.scale} x2={tx + tankLpx / 2 + positions[1].x * fit.scale}
              featureY={ty - depthPx} dimY={ty - depthPx - 12} label={dimText(pitch, { decimals: 1 })} arrowId={arrowId} fontSize={5.5}
            />
          )}
          {positions.length > 1 && (
            <DimensionHorizontal
              x1={tx + tankLpx / 2 + positions[0].x * fit.scale} x2={tx + tankLpx / 2 + positions[positions.length - 1].x * fit.scale}
              featureY={ty - depthPx} dimY={ty - depthPx - 26} label={dimText(wallExtent, { decimals: 1 })} arrowId={arrowId} fontSize={5.5}
            />
          )}
          <UnitsNote x={6} y={box.h - 6} />
        </svg>
        <div className="flex-1 min-w-0 space-y-1">
          <table className="w-full">
            <tbody>
              {isFin ? (
                <>
                  <tr><td className={`${tdCls} text-[11px] text-ink2`}>Fin count</td><td className={`${tdCls} text-right font-mono text-[11px]`}>{fins!.n} total, {fins!.perSide} per face</td></tr>
                  <tr><td className={`${tdCls} text-[11px] text-ink2`}>Fin depth x height</td><td className={`${tdCls} text-right font-mono text-[11px]`}>{fins!.depth} x {Math.round(fins!.height)} mm</td></tr>
                </>
              ) : (
                <>
                  <tr><td className={`${tdCls} text-[11px] text-ink2`}>Panel count</td><td className={`${tdCls} text-right font-mono text-[11px]`}>{rad!.totalPanels} total, {rad!.panelsPerBank} per bank</td></tr>
                  <tr><td className={`${tdCls} text-[11px] text-ink2`}>Panel size</td><td className={`${tdCls} text-right font-mono text-[11px]`}>{rad!.panelWidth} x {Math.round(rad!.panelHeight)} mm</td></tr>
                  <tr><td className={`${tdCls} text-[11px] text-ink2`}>Bank count</td><td className={`${tdCls} text-right font-mono text-[11px]`}>{rad!.bankCount} ({rad!.lvBanks} LV end / {rad!.hvBanks} HV end)</td></tr>
                </>
              )}
              <tr><td className={`${tdCls} text-[11px] text-ink2`}>{isFin ? 'Pitch' : 'Bank pitch'}</td><td className={`${tdCls} text-right font-mono text-[11px]`}>{pitch.toFixed(1)} mm</td></tr>
              <tr><td className={`${tdCls} text-[11px] text-ink2`}>Wall extent, each tankW face</td><td className={`${tdCls} text-right font-mono text-[11px]`}>{wallExtent.toFixed(1)} mm</td></tr>
            </tbody>
          </table>
          {drawStep > 1 && (
            <p className="text-[10px] text-steel">
              Drawn every {drawStep} for legibility; count, pitch and wall extent above are the real, complete figures.
            </p>
          )}
          {!isFin && (
            <>
              <DataRow label="Bank Position" value={`${rad!.lvBanks} LV end, ${rad!.hvBanks} HV end`} />
              <DataRow label="Header Connection Centres" value={rad!.headerCentres.toFixed(0)} unit="mm" />
              <DataRow label="Valve Positions" value={`${rad!.totalValves} total, top and bottom of each bank`} />
              <p className="text-[10px] text-steel pt-1 leading-snug">
                Panel width, pitch and panels-per-bank are editable inputs (radiatorPanelWidth/Pitch/PerBank), not a
                specific vendor's catalogue -- header pipe size itself is vendor data, still to be specified.
              </p>
              {cons && cons.dia > 0 && (
                <p className="text-[10px] text-steel pt-1 leading-snug">
                  Conservator {Math.round(cons.dia)} dia x {Math.round(cons.length)} long mm, {Math.round(cons.volumeL)} L
                  {' '}-- see drawing 9 / the 3D model for its mounting.
                </p>
              )}
            </>
          )}
          <div className="pt-2 space-y-0.5">
            <DataRow label="Cooling Surface Required" value={design.finAreaReq.toFixed(1)} unit="m²" />
            <DataRow label="Cooling Surface Provided" value={surfaceProvided.toFixed(1)} unit="m²" tone={surfaceProvided >= design.finAreaReq ? 'copper' : 'alert'} />
            <DataRow label="Top-Oil Rise Design Target" value={design.riseTarget.toFixed(1)} unit="K" />
          </div>
        </div>
      </div>
      <TitleBlock
        drawingNo={drawingNo(project, '14')} title="Radiator or Fin Drawing" rev={project?.revision ?? 0}
        sheet={14} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material={isFin ? 'CRCA steel' : 'Pressed steel'} partNumber={PART_NUMBERS.fins}
      />
    </Card>
  );
}
