import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function CoreDrawingReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  return (
    <div className="report-page">
      <ReportHeader title="Core Manufacturing Drawing" inputs={inputs} />
      
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1. Core Dimensions</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/3">Core Diameter</td>
                <td className="border border-slate-300 p-2 font-mono w-1/3">{outputs.coreDia?.toFixed(2)} mm</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Limb Center</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.limbCenter?.toFixed(2)} mm</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Window Height</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.windowHeight?.toFixed(2)} mm</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2. Core Building Steps</h3>
          {outputs.coreSteps && outputs.coreSteps.length > 0 ? (
            <table className="w-full border-collapse border border-slate-300 text-sm text-center">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border border-slate-300 p-2">Step</th>
                  <th className="border border-slate-300 p-2">Width (mm)</th>
                  <th className="border border-slate-300 p-2">Thickness (mm)</th>
                  <th className="border border-slate-300 p-2">Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {outputs.coreSteps.map((step, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 font-mono">{step.step}</td>
                    <td className="border border-slate-300 p-2 font-mono">{step.width}</td>
                    <td className="border border-slate-300 p-2 font-mono">{step.thickness}</td>
                    <td className="border border-slate-300 p-2 font-mono">{step.weight?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 border border-dashed border-slate-300 text-center text-slate-500 text-sm">
              Core step details are not available.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
