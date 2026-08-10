/**
 * DRAWINGS.md, Universal requirements: "The same physical part carries the
 * same number in the drawing, the 3D model, the BOM and the report." This
 * is the one place those literals live -- src/components/cad/TransformerParts.tsx
 * and every drawing's title block both import from here, so there is no
 * second copy to drift out of sync.
 */
export const PART_NUMBERS = {
  core: 'CR-001',
  lvCoil: 'WD-LV-001',
  hvCoil: 'WD-HV-001',
  tank: 'TNK-001',
  tankCover: 'TNK-002',
  fins: 'RAD-001',
  hvBushing: 'BSH-HV-01',
  lvBushing: 'BSH-LV-01',
  baseChannel: 'FR-BASE-01',
  clampingFrame: 'FR-CLAMP-01',
  namePlate: 'ACC-NP-01',
} as const;
