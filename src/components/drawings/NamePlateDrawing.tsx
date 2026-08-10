import React from 'react';
import { Card } from '../ui';
import { NamePlate } from '../documents/NamePlate';
import { TitleBlock, drawingNo, ratingLabel } from './DrawingPrimitives';
import { PART_NUMBERS } from './partNumbers';

interface Props { design: any; params: any; project: any; }

/**
 * DRAWINGS.md, drawing 18: rating name plate. Reuses the Documents tab's
 * NamePlate component unchanged -- the plate content is identical wherever
 * it is shown, per "one component per drawing, reused" -- and only wraps it
 * in the title block a drawing sheet needs. There is no geometry to scale
 * here (the plate is a fabricated data label, not a dimensioned part), so
 * the title block reports scale as "n/a" rather than inventing one.
 */
export function NamePlateDrawing({ design, params, project }: Props) {
  const docNo = drawingNo(project, '18');
  return (
    <Card title="Rating Name Plate" subtitle={`Drawing ${docNo} · engraved data plate`}>
      <NamePlate design={design} params={params} project={project} docNo={docNo} />
      <TitleBlock
        drawingNo={docNo} title="Rating Name Plate" rev={project?.revision ?? 0}
        sheet={18} totalSheets={21} fit={{ scale: 0, offsetX: 0, offsetY: 0 }} standard={params.standard}
        projectName={project?.projectName} customer={project?.customer} ratingLabel={ratingLabel(params)}
        material="Anodised aluminium" partNumber={PART_NUMBERS.namePlate}
      />
    </Card>
  );
}
