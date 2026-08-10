/**
 * Vector group parsing, shared by every place bushing count or labelling
 * depends on it: the 2D layout drawings (15, 16, 17), the orthographic set's
 * GA and top views, the 3D model, the drawing-19 parts list, and now the
 * engine's own BOM (buildBOM prices bushings on this same count, as of
 * ENGINE_VERSION 1.2.0). The parsing itself lives in packages/engine/index.js
 * so the engine can use it without reaching into src -- this module just
 * re-exports it, so nothing in the app layer had to change its import path.
 */
import { parseVectorGroup as engineParseVectorGroup } from '@/packages/engine';

export interface VectorGroup {
  hv: string; hvNeutral: boolean; lv: string; lvNeutral: boolean; clock: number;
  hvLabels: string[]; lvLabels: string[];
}

/** e.g. "Dyn11" -> HV delta, LV star with neutral, clock 11.
 *  "YNd11" -> HV star with neutral brought out, LV delta (no neutral
 *  possible on a delta -- there is no star point to bring out). Falls back
 *  to the engine's own default (Dyn11) if the string does not parse,
 *  rather than guessing a different one. */
export function parseVectorGroup(vector: string): VectorGroup {
  return engineParseVectorGroup(vector);
}

/** N evenly spread schematic positions across `span`, centred on 0 -- used
 *  for LV (and, when present, HV neutral) bushings, whose real spacing the
 *  engine does not derive. The count is always real (from the vector
 *  group); only the spacing between that many positions is illustrative. */
export function schematicPositions(n: number, span: number): number[] {
  if (n <= 1) return [0];
  return Array.from({ length: n }, (_, i) => -span / 2 + (span * i) / (n - 1));
}
