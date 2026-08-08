import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function BOMReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const materials = [
    { code: 'M-001', name: 'CRGO Core Steel', spec: inputs.coreMaterial, qty: outputs.coreWeight, unit: 'kg' },
    { code: 'M-002', name: `${inputs.conductor} Conductor LV`, spec: 'Paper Covered', qty: outputs.copperWeight * 0.45, unit: 'kg' },
    { code: 'M-003', name: `${inputs.conductor} Conductor HV`, spec: 'Enamel/Paper', qty: outputs.copperWeight * 0.55, unit: 'kg' },
    { code: 'M-004', name: 'Transformer Oil', spec: 'Mineral Oil IEC 60296', qty: inputs.kVA * 2.1, unit: 'L' },
    { code: 'M-005', name: 'MS Tank Steel', spec: 'Mild Steel IS 2062', qty: inputs.kVA * 0.9, unit: 'kg' },
    { code: 'M-006', name: 'Pressboard Insulation', spec: 'Pre-compressed', qty: inputs.kVA * 0.15, unit: 'kg' },
  ];

  return (
    <div className="report-page">
      <ReportHeader title="Complete Bill of Materials" inputs={inputs} />
      
      <table className="w-full text-sm border-collapse border border-slate-300">
        <thead className="bg-slate-100 text-slate-800 uppercase text-xs">
          <tr>
            <th className="border border-slate-300 p-3 text-left w-24">Item Code</th>
            <th className="border border-slate-300 p-3 text-left">Description</th>
            <th className="border border-slate-300 p-3 text-left">Specification</th>
            <th className="border border-slate-300 p-3 text-right w-24">Quantity</th>
            <th className="border border-slate-300 p-3 text-left w-16">Unit</th>
          </tr>
        </thead>
        <tbody>
          {materials.map(m => (
            <tr key={m.code} className="hover:bg-slate-50">
              <td className="border border-slate-300 p-2 font-mono text-slate-500">{m.code}</td>
              <td className="border border-slate-300 p-2 font-bold text-slate-700">{m.name}</td>
              <td className="border border-slate-300 p-2 text-slate-600">{m.spec}</td>
              <td className="border border-slate-300 p-2 text-right font-mono">{m.qty?.toFixed(2) || "0.00"}</td>
              <td className="border border-slate-300 p-2 text-slate-600">{m.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
