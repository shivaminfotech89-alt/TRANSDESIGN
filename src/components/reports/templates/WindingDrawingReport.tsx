import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function WindingDrawingReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  return (
    <div className="report-page">
      <ReportHeader title="Winding Manufacturing Drawing" inputs={inputs} />
      
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1. Low Voltage (LV) Winding</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Type</td>
                <td className="border border-slate-300 p-2 font-mono w-1/4">{outputs.lvWindingType}</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Turns</td>
                <td className="border border-slate-300 p-2 font-mono w-1/4">{outputs.lvTurns}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Conductor Size</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.lvCondThick} x {outputs.lvCondWidth} mm</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Dimensions</td>
                <td className="border border-slate-300 p-2 font-mono">ID: {outputs.lvId?.toFixed(1)} / OD: {outputs.lvOd?.toFixed(1)} mm</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Layers</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.lvLayers}</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Axial Length</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.lvAxial?.toFixed(1)} mm</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2. High Voltage (HV) Winding</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Type</td>
                <td className="border border-slate-300 p-2 font-mono w-1/4">{outputs.hvWindingType}</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Total Turns</td>
                <td className="border border-slate-300 p-2 font-mono w-1/4">{outputs.hvTurns}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Conductor Size</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.hvCondThick} x {outputs.hvCondWidth} mm</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Dimensions</td>
                <td className="border border-slate-300 p-2 font-mono">ID: {outputs.hvId?.toFixed(1)} / OD: {outputs.hvOd?.toFixed(1)} mm</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Layers / Discs</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.hvLayers || '-'}</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Axial Length</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.hvAxial?.toFixed(1)} mm</td>
              </tr>
            </tbody>
          </table>
        </section>

        {outputs.turnsDistribution && outputs.turnsDistribution.length > 0 && (
          <section>
            <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3. HV Turns Distribution</h3>
            <table className="w-full border-collapse border border-slate-300 text-sm text-center">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border border-slate-300 p-2 text-left">Arrangement</th>
                  <th className="border border-slate-300 p-2">Turns per Unit</th>
                  <th className="border border-slate-300 p-2">Total Turns</th>
                </tr>
              </thead>
              <tbody>
                {outputs.turnsDistribution.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-left">{t.label}</td>
                    <td className="border border-slate-300 p-2 font-mono">{t.turns}</td>
                    <td className="border border-slate-300 p-2 font-mono">{t.total}</td>
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
