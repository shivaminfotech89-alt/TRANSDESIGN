import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function InsulationScheduleReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  return (
    <div className="report-page">
      <ReportHeader title="Insulation Schedule" inputs={inputs} />
      
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1. Core Insulation</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2 text-left">Description</th>
                <th className="border border-slate-300 p-2 text-left">Material</th>
                <th className="border border-slate-300 p-2 text-left">Dimension / Specs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Core Wrapping</td>
                <td className="border border-slate-300 p-2">Epoxy Dotted Paper / Fibreglass Tape</td>
                <td className="border border-slate-300 p-2 font-mono">0.25 mm thick, half-lap</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Core to LV Clearance</td>
                <td className="border border-slate-300 p-2">Pressboard Cylinders</td>
                <td className="border border-slate-300 p-2 font-mono">{(outputs.lvId! - outputs.coreDia!) / 2} mm radial</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2. Winding Insulation</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2 text-left">Description</th>
                <th className="border border-slate-300 p-2 text-left">Material</th>
                <th className="border border-slate-300 p-2 text-left">Dimension / Specs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">LV Inter-layer Insulation</td>
                <td className="border border-slate-300 p-2">Kraft Paper</td>
                <td className="border border-slate-300 p-2 font-mono">0.25 mm x {(outputs.lvLayers || 2) - 1} layers</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">LV to HV Gap (Main Duct)</td>
                <td className="border border-slate-300 p-2">Pressboard Cylinder + Oil Gap</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.hiloGap?.toFixed(1)} mm radial</td>
              </tr>
              {outputs.hvWindingType === 'Disc Winding' ? (
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">HV Inter-disc Spacers</td>
                  <td className="border border-slate-300 p-2">Pre-compressed Pressboard</td>
                  <td className="border border-slate-300 p-2 font-mono">1.5 mm to 3.0 mm (as per distribution)</td>
                </tr>
              ) : (
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">HV Inter-layer Insulation</td>
                  <td className="border border-slate-300 p-2">Kraft Paper</td>
                  <td className="border border-slate-300 p-2 font-mono">1.0 mm x {(outputs.hvLayers || 2) - 1} layers</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        
        {outputs.spacerDistribution && outputs.spacerDistribution.length > 0 && (
          <section>
            <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3. HV Spacer Distribution Detail</h3>
            <table className="w-full border-collapse border border-slate-300 text-sm text-center">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border border-slate-300 p-2 text-left">Arrangement</th>
                  <th className="border border-slate-300 p-2">Thickness per Unit (mm)</th>
                  <th className="border border-slate-300 p-2">Total Gap Build (mm)</th>
                </tr>
              </thead>
              <tbody>
                {outputs.spacerDistribution.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-left">{s.label}</td>
                    <td className="border border-slate-300 p-2 font-mono">{s.thickness?.toFixed(1)}</td>
                    <td className="border border-slate-300 p-2 font-mono">{s.total?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
