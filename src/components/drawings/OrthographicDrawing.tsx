import React, { useId } from 'react';
import { finLayout } from '@/packages/engine';
import { hvBushingSpec, lvBushingSpec } from '../cad/geometry';
import { Card } from '../ui';
import {
  fitToViewBox, dimText, DimensionArrow, DimensionHorizontal, DimensionVertical, UnitsNote, TitleBlock,
  drawingNo, ratingLabel, parseVectorGroup, schematicPositions,
} from './DrawingPrimitives';

/**
 * DRAWINGS.md, "The orthographic set: drawings 1 to 5" -- one component, a
 * view parameter, not five components. All five share the same tank/core
 * geometry; they differ in which axis is horizontal and how much
 * annotation is drawn.
 *
 * Axis discipline (this is the exact bug fixed in the universal-requirements
 * pass, generalised): tankL always runs along the limb row -- it is the
 * horizontal axis for the GA, front and both plan views. tankW is the
 * depth, seen face-on only in the side view. Getting this backwards makes
 * the core envelope overhang the tank; every view below computes its
 * extents from one place (tankExtents/envelopeExtents) so the four views
 * that share an axis cannot silently disagree about it.
 */

export type OrthoView = 'ga' | 'front' | 'side' | 'top' | 'bottom';

interface Props {
  design: any;
  params: any;
  project: any;
  view: OrthoView;
}

const VIEW_META: Record<OrthoView, { seq: string; sheet: number; title: string }> = {
  ga: { seq: '01', sheet: 1, title: 'General Arrangement' },
  front: { seq: '02', sheet: 2, title: 'Front View' },
  side: { seq: '03', sheet: 3, title: 'Side View' },
  top: { seq: '04', sheet: 4, title: 'Top View' },
  bottom: { seq: '05', sheet: 5, title: 'Bottom and Foundation View' },
};

/** The coil assembly's depth-axis extent, i.e. what tankW is derived from
 *  (buildBOM: tankW = <this> + 2*hvTankClr). For a circular stepped core
 *  that is simply the HV coil outside diameter; for a rectangular/wound
 *  core (elliptical, rectangular, EI, amorphous-wound -- CORE_TYPES with
 *  shape "rect") the engine instead builds it up from the limb width and
 *  each radial layer, so this mirrors that exactly rather than reusing
 *  hvOD, which is not the relevant figure for those constructions. */
function coilDepthEnvelope(design: any): number {
  return design.shape === 'circ'
    ? design.hvOD
    : design.coreW + 2 * (design.p.coreLvClr + design.lvRadial + design.p.lvHvClr + design.hvRadial);
}

function tankExtents(view: OrthoView, design: any) {
  if (view === 'side') return { w: design.tankW, h: design.tankH };
  if (view === 'top' || view === 'bottom') return { w: design.tankL, h: design.tankW };
  return { w: design.tankL, h: design.tankH }; // ga, front
}

function envelopeExtents(view: OrthoView, design: any) {
  const depth = coilDepthEnvelope(design);
  if (view === 'side') return { w: depth, h: design.coreHeight };
  if (view === 'top' || view === 'bottom') return { w: design.coreWidth, h: depth };
  return { w: design.coreWidth, h: design.coreHeight }; // ga, front
}

function Bushing({ x, top, heightPx, footPx, label, color }: {
  x: number; top: number; heightPx: number; footPx: number; label: string; color: string;
}) {
  return (
    <g>
      <rect x={x - footPx / 2} y={top - heightPx} width={footPx} height={heightPx} fill="none" stroke={color} strokeWidth={0.8} />
      <text x={x} y={top - heightPx - 3} textAnchor="middle" className="font-mono" fontSize={6} fill="var(--color-ink2)">{label}</text>
    </g>
  );
}

export function OrthographicDrawing({ design, params, project, view }: Props) {
  const arrowId = useId();
  const meta = VIEW_META[view];
  const isGa = view === 'ga';
  const isSide = view === 'side';
  const isPlan = view === 'top' || view === 'bottom';
  const isTop = view === 'top';
  const isBottom = view === 'bottom';

  const hvBush = hvBushingSpec(params.umHV);
  const lvBush = lvBushingSpec(params.umLV);
  const fins = design.dry ? { n: 0, depth: 0, height: 0, perSide: 0, per: 0 } : finLayout(design);

  const tank = tankExtents(view, design);
  const env = envelopeExtents(view, design);

  const box = { w: 420, h: isGa ? 420 : 320 };
  const margin = { side: 48, top: 22, bottom: 56 };
  const topExtra = (isGa || view === 'front') ? hvBush.height : 0; // room for bushings projecting above the tank
  const sideExtra = isSide && !design.dry ? fins.depth : 0; // fin/radiator projection, side view only
  const fit = fitToViewBox(
    tank.w + 2 * sideExtra, tank.h + topExtra,
    box.w - 2 * margin.side, box.h - margin.top - margin.bottom, 10,
  );

  const tankWpx = tank.w * fit.scale, tankHpx = tank.h * fit.scale;
  const bushHpx = topExtra * fit.scale;
  const finDepthPx = sideExtra * fit.scale;
  const tx = margin.side + fit.offsetX + finDepthPx;
  const ty = margin.top + fit.offsetY + bushHpx;

  const envWpx = env.w * fit.scale, envHpx = env.h * fit.scale;
  const bias = isPlan ? 0 : tankHpx * 0.08;
  const ecx = tx + (tankWpx - envWpx) / 2;
  const ecy = ty + (tankHpx - envHpx) / 2 + bias;

  const lengthDimY = ty + tankHpx + 18;
  const dim2X = tx + tankWpx + 16;
  const dim3X = tx + tankWpx + 32;

  // mm-x = 0 is the tank's own horizontal centre, for views sharing the
  // tankL axis (ga, front, top, bottom) -- side view has no limb positions
  // to place (all three limbs are seen end-on, collapsed into one outline).
  const mmToPxX = (mmX: number) => tx + tankWpx / 2 + mmX * fit.scale;
  // Bushing count and labels always follow the vector group -- a Dyn11 has
  // three HV and four LV including neutral, a Dd0 has neither neutral.
  // Never hardcode four.
  const vg = parseVectorGroup(params.vector);
  const limbXmm = [-design.cc, 0, design.cc, ...(vg.hvNeutral ? [design.cc * 0.5] : [])];
  const hvBushHpx = hvBush.height * fit.scale, hvFootPx = Math.max(3, hvBush.footDia * fit.scale);
  const lvBushHpx = lvBush.height * fit.scale * 0.6, lvFootPx = Math.max(2.5, lvBush.footDia * fit.scale * 0.8);
  const lvXmm = schematicPositions(vg.lvLabels.length, tank.w * 0.7);

  const totalMass = design.wCore + design.wLV + design.wHV + design.wIns + design.wFrame
    + design.wTank + design.wFin + design.wEnclosure + design.fluidLitres * (design.fluid?.dens || 0);

  return (
    <Card
      title={meta.title}
      subtitle={`Drawing ${drawingNo(project, meta.seq)}${isGa ? ' · fully annotated customer approval sheet' : ' · outline and overall dimensions'}`}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="shrink-0">
          <DimensionArrow id={arrowId} />

          {/* Side view: fin/radiator projection either side of the tank body. */}
          {isSide && !design.dry && fins.depth > 0 && (
            <>
              <rect x={tx - finDepthPx} y={ty + tankHpx * 0.08} width={finDepthPx} height={tankHpx * 0.8} fill="none" stroke="var(--color-steel)" strokeWidth={0.6} />
              <rect x={tx + tankWpx} y={ty + tankHpx * 0.08} width={finDepthPx} height={tankHpx * 0.8} fill="none" stroke="var(--color-steel)" strokeWidth={0.6} />
            </>
          )}

          {/* Tank / footprint outline and the core+coil envelope inside it --
              drawn in every view so the "envelope sits inside the tank" check
              asked for is visible everywhere, not only where DRAWINGS.md's
              own content list happens to mention the active part. */}
          <rect x={tx} y={ty} width={tankWpx} height={tankHpx} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
          <rect x={ecx} y={ecy} width={envWpx} height={envHpx} fill="none" stroke="var(--color-copper)" strokeWidth={1} strokeDasharray="4 2" />

          {/* Cover line, elevation views only. */}
          {!isPlan && <line x1={tx} y1={ty} x2={tx + tankWpx} y2={ty} stroke="var(--color-ink)" strokeWidth={1.4} />}

          {/* Front: stripped to outline, but "overall height" includes the
              bushings (drawing 2's own dimension list), so a plain unlabelled
              boundary line marks how high they reach without GA's detail. */}
          {view === 'front' && (
            <line x1={tx} y1={ty - bushHpx} x2={tx + tankWpx} y2={ty - bushHpx} stroke="var(--color-steel)" strokeWidth={0.5} strokeDasharray="2 2" />
          )}

          {/* GA-only annotation. */}
          {isGa && (
            <>
              {limbXmm.map((mmX, i) => (
                <Bushing
                  key={`hv-${i}`} x={mmToPxX(mmX)} top={ty} heightPx={hvBushHpx} footPx={hvFootPx}
                  label={vg.hvLabels[i]} color="var(--color-ink)"
                />
              ))}
              {lvXmm.map((mmX, i) => (
                <Bushing
                  key={`lv-${i}`} x={mmToPxX(mmX)} top={ty} heightPx={lvBushHpx} footPx={lvFootPx}
                  label={vg.lvLabels[i]} color="var(--color-steel)"
                />
              ))}
              {params.tankType === 'radiator' && (
                <ellipse cx={tx + tankWpx * 0.78} cy={ty - hvBushHpx * 0.5} rx={tankWpx * 0.1} ry={4} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
              )}
              {/* Breather */}
              <circle cx={tx + tankWpx * 0.92} cy={ty - 4} r={2.5} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
              {/* Pressure relief device */}
              <circle cx={tx + tankWpx * 0.5} cy={ty - 3} r={3} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
              {/* Cable box and marshalling box, front face */}
              <rect x={tx + 6} y={ty + tankHpx * 0.55} width={14} height={10} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
              <rect x={tx + 24} y={ty + tankHpx * 0.55} width={14} height={10} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
              {/* Rating plate */}
              <rect x={tx + tankWpx - 26} y={ty + tankHpx * 0.3} width={18} height={10} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
              {/* Lifting lugs, top corners */}
              <path d={`M${tx + 4},${ty} l4,-6 l4,6`} fill="none" stroke="var(--color-ink2)" strokeWidth={0.8} />
              <path d={`M${tx + tankWpx - 8},${ty} l4,-6 l4,6`} fill="none" stroke="var(--color-ink2)" strokeWidth={0.8} />
              {/* Base channel band and ground line */}
              <rect x={tx - 4} y={ty + tankHpx} width={tankWpx + 8} height={9} fill="none" stroke="var(--color-ink)" strokeWidth={0.8} />
              <line x1={tx - 16} y1={ty + tankHpx + 9} x2={tx + tankWpx + 16} y2={ty + tankHpx + 9} stroke="var(--color-ink2)" strokeWidth={1.2} />
            </>
          )}

          {/* Top view: bushing plan positions and lifting lugs. */}
          {isTop && (
            <>
              {limbXmm.map((mmX, i) => (
                <g key={`hv-${i}`}>
                  <circle cx={mmToPxX(mmX)} cy={ty + tankHpx / 2} r={2.4} fill="none" stroke="var(--color-ink)" strokeWidth={0.8} />
                  <text x={mmToPxX(mmX)} y={ty - 4} textAnchor="middle" className="font-mono" fontSize={6} fill="var(--color-ink2)">{vg.hvLabels[i]}</text>
                </g>
              ))}
              {lvXmm.map((mmX, i) => (
                <g key={`lv-${i}`}>
                  <circle cx={mmToPxX(mmX)} cy={ty + tankHpx * 0.22} r={1.8} fill="none" stroke="var(--color-steel)" strokeWidth={0.7} />
                  <text x={mmToPxX(mmX)} y={ty + tankHpx * 0.22 - 4} textAnchor="middle" className="font-mono" fontSize={5.5} fill="var(--color-steel)">{vg.lvLabels[i]}</text>
                </g>
              ))}
              {[[tx + 5, ty + 5], [tx + tankWpx - 5, ty + 5], [tx + 5, ty + tankHpx - 5], [tx + tankWpx - 5, ty + tankHpx - 5]].map(([lx, ly], i) => (
                <rect key={i} x={lx - 2} y={ly - 2} width={4} height={4} fill="none" stroke="var(--color-ink2)" strokeWidth={0.6} />
              ))}
            </>
          )}

          {/* Bottom view: base channel bands and service pads. */}
          {isBottom && (
            <>
              <rect x={tx + tankWpx * 0.08} y={ty} width={tankWpx * 0.1} height={tankHpx} fill="none" stroke="var(--color-ink)" strokeWidth={0.8} />
              <rect x={tx + tankWpx * 0.82} y={ty} width={tankWpx * 0.1} height={tankHpx} fill="none" stroke="var(--color-ink)" strokeWidth={0.8} />
              <rect x={tx + tankWpx * 0.46} y={ty + tankHpx - 8} width={8} height={5} fill="none" stroke="var(--color-steel)" strokeWidth={0.6} />
              <text x={tx + tankWpx * 0.5} y={ty + tankHpx + 8} textAnchor="middle" className="font-mono" fontSize={5.5} fill="var(--color-steel)">DRAIN</text>
            </>
          )}

          {/* Dimensions common to every view: overall/tank length or footprint width, overall/tank height or depth. */}
          <DimensionHorizontal x1={tx} x2={tx + tankWpx} featureY={ty + tankHpx} dimY={lengthDimY} label={dimText(tank.w)} arrowId={arrowId} />
          <DimensionVertical y1={ty} y2={ty + tankHpx} featureX={tx + tankWpx} dimX={dim2X} label={dimText(tank.h)} arrowId={arrowId} />

          {/* GA and front: overall height including bushings, on a second line so it never overlaps the tank-height dimension. */}
          {(isGa || view === 'front') && (
            <DimensionVertical
              y1={ty - bushHpx} y2={ty + tankHpx} featureX={tx + tankWpx} dimX={dim3X}
              label={dimText(design.tankH + hvBush.height)} arrowId={arrowId}
            />
          )}

          {/* GA: base channel height -- not held by the engine (the 3D
              model's 100 mm is a decorative constant, not an engineering
              figure), so the sheet says so rather than inventing a number. */}
          {isGa && (
            <DimensionVertical
              y1={ty + tankHpx} y2={ty + tankHpx + 9} featureX={tx + tankWpx} dimX={dim2X}
              label="to be specified" arrowId={arrowId} fontSize={5}
            />
          )}

          {/* Side: overall width including the fin/radiator projection. */}
          {isSide && !design.dry && fins.depth > 0 && (
            <DimensionHorizontal
              x1={tx - finDepthPx} x2={tx + tankWpx + finDepthPx} featureY={ty} dimY={ty - 14}
              label={dimText(design.tankW + 2 * fins.depth)} arrowId={arrowId}
            />
          )}

          {/* GA: HV bushing centres, a real engine figure (limb centre distance). */}
          {isGa && (
            <DimensionHorizontal
              x1={mmToPxX(limbXmm[0])} x2={mmToPxX(limbXmm[2])} featureY={ty - hvBushHpx} dimY={ty - hvBushHpx - 12}
              label={dimText(design.cc * 2)} arrowId={arrowId}
            />
          )}
          {/* Top: bushing centres in the length direction, same real figure. */}
          {isTop && (
            <DimensionHorizontal
              x1={mmToPxX(limbXmm[0])} x2={mmToPxX(limbXmm[2])} featureY={ty - 8} dimY={ty - 18}
              label={dimText(design.cc * 2)} arrowId={arrowId}
            />
          )}

          <UnitsNote x={6} y={box.h - 6} />
        </svg>

        <div className="flex-1 min-w-0 space-y-2">
          {isGa && (
            <>
              <p className="text-[10px] text-ink2 leading-snug">
                HV bushings {vg.hvLabels.join('/')} on {dimText(design.cc * 2)} mm centres, real from the limb
                spacing. LV bushings {vg.lvLabels.join('/')}, base channel height and dimensions, and every
                accessory position (conservator, breather, pressure relief device, cable box, marshalling box,
                lifting lugs) are indicative only -- to be specified against your accessory standard, not engine
                output.
              </p>
              <table className="w-full text-[10px]">
                <tbody>
                  <tr><td className="py-0.5 text-ink2">Fin/radiator count, per side</td><td className="text-right font-mono text-ink">{fins.n} total, {fins.perSide} per side</td></tr>
                  <tr><td className="py-0.5 text-ink2">Fin panel, depth x height</td><td className="text-right font-mono text-ink">{design.dry ? 'n/a, dry type' : `${fins.depth} x ${Math.round(fins.height)} mm`}</td></tr>
                  <tr><td className="py-0.5 text-ink2">Cooling surface provided</td><td className="text-right font-mono text-ink">{design.dry ? 'n/a' : `${(fins.n * fins.per).toFixed(1)} m²`}</td></tr>
                  <tr><td className="py-0.5 text-ink2">HV / LV bushing voltage class</td><td className="text-right font-mono text-ink">{params.umHV} / {params.umLV} kV</td></tr>
                  <tr><td className="py-0.5 text-ink2">Total mass</td><td className="text-right font-mono text-ink">{Math.round(totalMass)} kg</td></tr>
                  <tr><td className="py-0.5 text-ink2">Fluid volume</td><td className="text-right font-mono text-ink">{design.dry ? 'n/a, dry type' : `${Math.round(design.fluidLitres)} L`}</td></tr>
                </tbody>
              </table>
            </>
          )}
          {isBottom && (
            <p className="text-[10px] text-ink2 leading-snug">
              Base channel centres and spacing, drain valve pad and jacking pad positions: to be specified, not held
              by the engine. Foundation bolt positions are derived from the base channel geometry and must be
              confirmed against the civil drawing.
            </p>
          )}
          {isTop && (
            <p className="text-[10px] text-ink2 leading-snug">
              Lug centres and the LV bushing centres: to be specified, not held by the engine. HV bushing centres
              above are real, from the limb spacing.
            </p>
          )}
        </div>
      </div>

      <TitleBlock
        drawingNo={drawingNo(project, meta.seq)} title={meta.title} rev={project?.revision ?? 0}
        sheet={meta.sheet} totalSheets={21} fit={fit} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
      />
    </Card>
  );
}
