/**
 * The one place every part's identity -- name, part number, material,
 * dimensions, mass, quantity -- is computed from design/params. The 3D
 * inspection panel (TransformerParts.tsx) and the 2D exploded assembly
 * drawing (19) both read this, so a part carries one number and one mass
 * everywhere it appears, rather than each view holding its own copy that
 * could drift from the other.
 *
 * Every mass formula here is lifted unchanged from what TransformerParts.tsx
 * computed inline before this module existed -- core/LV/HV/tank/fin masses
 * from the engine's own totals (design.wCore etc, never a fabricated
 * per-unit split of a total the engine only gives as one number), base
 * channel/clamping frame/tie rods from the actual drawn geometry's volume
 * times steel density (the engine does not cost these separately), bushings
 * from bushHeight()'s own real height. The one behaviour change: bushing
 * quantity now follows parseVectorGroup(params.vector) instead of being
 * fixed at three HV and three LV -- TransformerParts.tsx previously never
 * rendered a fourth (neutral) bushing on either side regardless of vector
 * group, which this module and the 3D model it now drives both correct.
 *
 * ENGINE_VERSION 1.2.0: the engine's own BOM (buildBOM, packages/engine/
 * index.js) now sources its bushing quantity from the same parseVectorGroup
 * this module uses, rather than a fixed qty 3 HV / 4 LV -- the 2D drawings,
 * the 3D model and the BOM can no longer disagree on how many bushings a
 * design has.
 */
import { PART_NUMBERS } from '../components/drawings/partNumbers';
import { coreCrossSectionSpan, hvBushingSpec, lvBushingSpec } from '../components/cad/geometry';
import { finLayout } from '@/packages/engine';
import { parseVectorGroup } from './vectorGroup';

export interface PartRecord {
  /** Matches TransformerParts.tsx's visibility toggle key, for cross-reference. */
  key: string;
  group: string;
  name: string;
  partNumber: string;
  material: string;
  /** Dimensions of one unit. */
  unitDimensions: string;
  /** Mass of one unit, kg. Total for the row is unitMass * quantity,
   *  computed once wherever it is needed, never stored separately. */
  unitMass: number;
  quantity: number;
}

const STEEL_DENSITY = 7850; // kg/m^3, same constant the engine uses for tank/frame steel
const steelMass = (volumeMm3: number) => (volumeMm3 / 1e9) * STEEL_DENSITY;

export function computePartRecords(design: any, params: any): PartRecord[] {
  const vg = parseVectorGroup(params.vector);
  const crossSpan = coreCrossSectionSpan(params.steps, design.dCore);
  const hvBush = hvBushingSpec(params.umHV);
  const lvBush = lvBushingSpec(params.umLV);
  const fins = design.dry ? { n: 0, depth: 0, height: 0, perSide: 0 } : finLayout(design);

  const channelH = 100, channelW = 80;
  const channelLen = design.tankL * 0.95;
  const channelUnitMass = steelMass(channelLen * channelH * channelW);

  const frameDepth = crossSpan * 0.5, frameThk = 40;
  const frameLen = design.coreWidth * 1.05;
  const frameMass = 2 * steelMass(frameLen * frameThk * frameDepth);
  const tieRodDia = 22;
  const tieRodSpanY = design.coreHeight * 0.92;
  const tieRodMass = 4 * steelMass(Math.PI * (tieRodDia / 2) ** 2 * tieRodSpanY);

  const records: PartRecord[] = [
    {
      key: 'core', group: 'core', name: 'Stepped Core Assembly', partNumber: PART_NUMBERS.core,
      material: design.grade.name,
      unitDimensions: `${design.coreWidth.toFixed(0)} x ${design.coreHeight.toFixed(0)} x ${crossSpan.toFixed(0)} mm`,
      unitMass: design.wCore, quantity: 1,
    },
    {
      key: 'lvWinding', group: 'lvWinding', name: 'LV Coil Assembly, 3 Phases', partNumber: PART_NUMBERS.lvCoil,
      material: design.cLV.name,
      unitDimensions: `ID ${design.lvID.toFixed(0)} / OD ${design.lvOD.toFixed(0)} / Ht ${design.hLV.toFixed(0)} mm`,
      unitMass: design.wLV, quantity: 1,
    },
    {
      key: 'hvWinding', group: 'hvWinding', name: 'HV Coil Assembly, 3 Phases', partNumber: PART_NUMBERS.hvCoil,
      material: design.cHV.name,
      unitDimensions: `ID ${design.hvID.toFixed(0)} / OD ${design.hvOD.toFixed(0)} / Ht ${design.hHV.toFixed(0)} mm`,
      unitMass: design.wHV, quantity: 1,
    },
    {
      key: 'insulation', group: 'insulation', name: 'Insulation: Cylinders, Barriers and End Insulation',
      partNumber: PART_NUMBERS.insulation, material: 'Pressboard / kraft paper, oil-impregnated',
      unitDimensions: 'to be specified: individual cylinder and barrier thicknesses are drawing 11, not a single figure',
      unitMass: design.wIns, quantity: 1,
    },
    // Tank and cover are kept as two separate rows, left exactly as they
    // were: design.wTank (buildBOM) is the authoritative engine figure and
    // already bundles both end-cap plates into one costed total (TK-01,
    // "Tank body, cover, base channel"). Tank Cover's own unitMass below is
    // a presentational estimate only -- a UI-layer guess at a 20 mm cover
    // plate, not read from the engine and not reconciled against wTank -- so
    // the two rows' masses do not sum to a real total. Not fixed here; see
    // the drawing-18/19 commit for the full note.
    {
      key: 'tank', group: 'tank', name: 'Main Tank', partNumber: PART_NUMBERS.tank,
      material: 'Mild steel, IS 2062',
      unitDimensions: `${design.tankL.toFixed(0)} x ${design.tankW.toFixed(0)} x ${design.tankH.toFixed(0)} mm`,
      unitMass: design.wTank, quantity: 1,
    },
    {
      key: 'tankCover', group: 'tank', name: 'Tank Cover', partNumber: PART_NUMBERS.tankCover,
      material: 'Mild steel, IS 2062',
      unitDimensions: `${(design.tankL + 20).toFixed(0)} x ${(design.tankW + 20).toFixed(0)} x 20 mm`,
      unitMass: steelMass((design.tankL + 20) * (design.tankW + 20) * 20), quantity: 1,
    },
    ...(design.dry ? [] : [{
      key: 'fins', group: 'fins', name: params.tankType === 'fin' ? 'Radiator Fins' : 'Radiator Panels',
      partNumber: PART_NUMBERS.fins, material: params.tankType === 'fin' ? 'CRCA steel' : 'Pressed steel',
      unitDimensions: `${fins.depth.toFixed(0)} x ${Math.round(fins.height)} mm`,
      unitMass: fins.n > 0 ? design.wFin / fins.n : 0, quantity: fins.n,
    }]),
    {
      key: 'hvBushing', group: 'bushings', name: `HV Bushing${vg.hvLabels.length > 1 ? 's' : ''} (${vg.hvLabels.join('/')})`,
      partNumber: PART_NUMBERS.hvBushing, material: 'Porcelain, oil-filled',
      unitDimensions: `${params.umHV} kV, Ht ${hvBush.height} mm`,
      unitMass: hvBush.height * 0.05, quantity: vg.hvLabels.length,
    },
    {
      key: 'lvBushing', group: 'bushings', name: `LV Bushing${vg.lvLabels.length > 1 ? 's' : ''} (${vg.lvLabels.join('/')})`,
      partNumber: PART_NUMBERS.lvBushing, material: 'Porcelain, oil-filled',
      unitDimensions: `${params.umLV} kV, Ht ${lvBush.height} mm`,
      unitMass: lvBush.height * 0.04, quantity: vg.lvLabels.length,
    },
    {
      key: 'baseChannel', group: 'baseChannel', name: 'Base Channel', partNumber: PART_NUMBERS.baseChannel,
      material: 'Mild steel channel',
      unitDimensions: `${channelLen.toFixed(0)} x ${channelH} x ${channelW} mm`,
      unitMass: channelUnitMass, quantity: 2,
    },
    {
      key: 'clampingFrame', group: 'clampingFrame', name: 'Core Clamping Frame and Tie Rods',
      partNumber: PART_NUMBERS.clampingFrame, material: 'Mild steel',
      unitDimensions: `Frame ${frameLen.toFixed(0)} mm, 4 tie rods dia ${tieRodDia} mm`,
      unitMass: frameMass + tieRodMass, quantity: 1,
    },
    {
      key: 'namePlate', group: 'tank', name: 'Rating Name Plate', partNumber: PART_NUMBERS.namePlate,
      material: 'Anodised aluminium', unitDimensions: '300 x 200 x 2 mm', unitMass: 0.5, quantity: 1,
    },
  ];

  return records;
}
