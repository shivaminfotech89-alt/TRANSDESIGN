import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function ProcessSheetReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  return (
    <div className="report-page">
      <ReportHeader title="Manufacturing Process Sheet" inputs={inputs} />
      
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1. Core Assembly</h3>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
            <li>Stack core laminations according to the core building steps.</li>
            <li>Ensure proper alignment of step-lap joints.</li>
            <li>Apply core binding tape or clamps firmly to avoid vibrations.</li>
            <li>Check limb center distance ({outputs.limbCenter?.toFixed(1)} mm).</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2. Winding Process</h3>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
            <li><strong>LV Winding:</strong> Wind {outputs.lvTurns} turns using {outputs.lvCondThick}x{outputs.lvCondWidth} mm conductor. Total layers: {outputs.lvLayers}.</li>
            <li>Apply interlayer insulation tightly.</li>
            <li>Maintain H-L gap of {outputs.hiloGap?.toFixed(1)} mm.</li>
            <li><strong>HV Winding:</strong> Wind {outputs.hvTurns} turns ({outputs.hvWindingType}). Follow turns distribution chart.</li>
            <li>Check ID and OD of coils to ensure clearance.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3. Core and Coil Assembly</h3>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
            <li>Carefully lower the winding assembly onto the core limbs.</li>
            <li>Place top yoke laminations and clamp securely.</li>
            <li>Make required tap connections (Tap positions: {outputs.tapPositions || 'N/A'}).</li>
            <li>Perform preliminary ratio and resistance checks.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">4. Drying and Tanking</h3>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
            <li>Place the active part in the drying oven (approx. 100°C - 110°C).</li>
            <li>Measure insulation resistance (IR) continuously until stabilized.</li>
            <li>Once dried, lower the active part into the tank.</li>
            <li>Fill with required {outputs.oilQuantity ? Math.round(outputs.oilQuantity) : 'N/A'} L of {inputs.cooling} oil under vacuum if required.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
