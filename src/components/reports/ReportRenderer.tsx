import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../types';
import { InputSheetReport } from './templates/InputSheetReport';
import { CalcReport } from './templates/CalcReport';
import { SummaryReport } from './templates/SummaryReport';
import { BOMReport } from './templates/BOMReport';
import { CostReport } from './templates/CostReport';
import { NamePlateReport } from './templates/NamePlateReport';
import { RoutineTestReport } from './templates/RoutineTestReport';
import { CoreDrawingReport } from './templates/CoreDrawingReport';
import { WindingDrawingReport } from './templates/WindingDrawingReport';
import { ProcessSheetReport } from './templates/ProcessSheetReport';
import { GaDrawingReport } from './templates/GaDrawingReport';
import { InternalAssemblyReport } from './templates/InternalAssemblyReport';
import { InsulationScheduleReport } from './templates/InsulationScheduleReport';
import { TankDrawingReport } from './templates/TankDrawingReport';
import { RadiatorDrawingReport } from './templates/RadiatorDrawingReport';
import { AccessoriesReport } from './templates/AccessoriesReport';

export function ReportRenderer({ reportId, inputs, outputs }: { reportId: string, inputs: TransformerInputs, outputs: TransformerOutputs }) {
  
  // Render based on ID
  switch (reportId) {
    case 'input_sheet': return <InputSheetReport inputs={inputs} outputs={outputs} />;
    case 'calc_report': return <CalcReport inputs={inputs} outputs={outputs} />;
    case 'summary': return <SummaryReport inputs={inputs} outputs={outputs} />;
    case 'complete_bom': return <BOMReport inputs={inputs} outputs={outputs} />;
    case 'cost_estimation': return <CostReport inputs={inputs} outputs={outputs} />;
    case 'name_plate': return <NamePlateReport inputs={inputs} outputs={outputs} />;
    case 'routine_test': return <RoutineTestReport inputs={inputs} outputs={outputs} />;
    case 'core_drawing': return <CoreDrawingReport inputs={inputs} outputs={outputs} />;
    case 'winding_drawing': return <WindingDrawingReport inputs={inputs} outputs={outputs} />;
    case 'process_sheet': return <ProcessSheetReport inputs={inputs} outputs={outputs} />;
    case 'ga_drawing': return <GaDrawingReport inputs={inputs} outputs={outputs} />;
    case 'internal_assembly': return <InternalAssemblyReport inputs={inputs} outputs={outputs} />;
    case 'insulation_schedule': return <InsulationScheduleReport inputs={inputs} outputs={outputs} />;
    case 'tank_drawing': return <TankDrawingReport inputs={inputs} outputs={outputs} />;
    case 'radiator_drawing': return <RadiatorDrawingReport inputs={inputs} outputs={outputs} />;
    case 'accessories': return <AccessoriesReport inputs={inputs} outputs={outputs} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="font-bold text-lg mb-2 text-slate-700">Under Construction</h3>
          <p className="text-sm">The {reportId} report template is being finalized.</p>
          <p className="text-xs mt-4">Data mapping and schema validation in progress.</p>
        </div>
      );
  }
}
