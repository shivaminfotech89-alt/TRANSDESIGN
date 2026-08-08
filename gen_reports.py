import os

reports = {
    'ga_drawing': 'General Arrangement (GA)',
    'internal_assembly': 'Internal Assembly',
    'insulation_schedule': 'Insulation Schedule',
    'tank_drawing': 'Tank Fabrication Drawing',
    'radiator_drawing': 'Radiator Drawing',
    'accessories': 'Accessories Layout'
}

for report_id, report_name in reports.items():
    comp_name = "".join(x.title() for x in report_id.split('_')) + 'Report'
    file_path = f"src/components/reports/templates/{comp_name}.tsx"
    
    content = f"""import React from 'react';
import {{ TransformerOutputs, TransformerInputs }} from '../../../types';
import {{ ReportHeader }} from './ReportHeader';

export function {comp_name}({{ inputs, outputs }}: {{ inputs: TransformerInputs, outputs: TransformerOutputs }}) {{
  return (
    <div className="report-page">
      <ReportHeader title="{report_name}" inputs={{inputs}} />
      
      <div className="p-8 border-2 border-dashed border-slate-300 bg-slate-50 text-center rounded-lg mt-6">
        <h3 className="font-bold text-lg text-slate-700 mb-2">Detailed {report_name} View</h3>
        <p className="text-slate-500 mb-4">
          This report provides schematic and layout details based on the computed core and tank dimensions.
        </p>
        <div className="grid grid-cols-2 gap-4 text-left max-w-lg mx-auto bg-white p-4 border border-slate-200 rounded">
          <div className="font-semibold text-slate-600">Core Diameter:</div>
          <div className="font-mono text-slate-800">{{outputs.coreDia?.toFixed(1) || 'N/A'}} mm</div>
          
          <div className="font-semibold text-slate-600">Window Height:</div>
          <div className="font-mono text-slate-800">{{outputs.windowHeight?.toFixed(1) || 'N/A'}} mm</div>
          
          <div className="font-semibold text-slate-600">Limb Center:</div>
          <div className="font-mono text-slate-800">{{outputs.limbCenter?.toFixed(1) || 'N/A'}} mm</div>
          
          <div className="font-semibold text-slate-600">Tank Weight (Approx):</div>
          <div className="font-mono text-slate-800">{{(inputs.kVA * 0.9).toFixed(1)}} kg</div>
        </div>
      </div>
    </div>
  );
}}
"""
    with open(file_path, 'w') as f:
        f.write(content)

