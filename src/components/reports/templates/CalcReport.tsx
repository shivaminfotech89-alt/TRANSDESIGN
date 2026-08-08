import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function CalcReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const hvRes = (outputs.loadLosses * 0.45) / (3 * Math.pow(outputs.hvPhaseCurrent, 2)) || 0;
  const lvRes = (outputs.loadLosses * 0.45) / (3 * Math.pow(outputs.lvPhaseCurrent, 2)) || 0;

  return (
    <div className="report-page">
      <ReportHeader title="Complete Engineering Calculations" inputs={inputs} />
      
      <div className="space-y-6 text-sm">
        
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1.0 Core Calculations</h3>
          <table className="w-full border-collapse border border-slate-300">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2 text-left w-1/3">Parameter</th>
                <th className="border border-slate-300 p-2 text-left w-1/3">Formula / Derivation</th>
                <th className="border border-slate-300 p-2 text-right w-1/3">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2">Volts per Turn (Et)</td>
                <td className="border border-slate-300 p-2 text-xs font-mono text-slate-500">K × √(kVA)</td>
                <td className="border border-slate-300 p-2 text-right font-medium">{outputs.et?.toFixed(4)} V</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Net Core Area (Ai)</td>
                <td className="border border-slate-300 p-2 text-xs font-mono text-slate-500">Et / (4.44 × f × Bm)</td>
                <td className="border border-slate-300 p-2 text-right font-medium">{(outputs.ai * 10000)?.toFixed(2)} cm²</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Gross Core Area (Ag)</td>
                <td className="border border-slate-300 p-2 text-xs font-mono text-slate-500">Ai / Stacking Factor</td>
                <td className="border border-slate-300 p-2 text-right font-medium">{(outputs.ag * 10000)?.toFixed(2)} cm²</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Core Diameter (D)</td>
                <td className="border border-slate-300 p-2 text-xs font-mono text-slate-500">√(4 × Ag / (π × Ku))</td>
                <td className="border border-slate-300 p-2 text-right font-medium">{outputs.coreDia?.toFixed(2)} mm</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2.0 Winding Calculations</h3>
          <table className="w-full border-collapse border border-slate-300">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2 text-left w-1/3">Parameter</th>
                <th className="border border-slate-300 p-2 text-left w-1/3">LV Winding</th>
                <th className="border border-slate-300 p-2 text-left w-1/3">HV Winding</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2">Number of Turns</td>
                <td className="border border-slate-300 p-2">{outputs.lvTurns}</td>
                <td className="border border-slate-300 p-2">{outputs.hvTurns}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Conductor Area</td>
                <td className="border border-slate-300 p-2">{outputs.lvArea?.toFixed(2)} mm²</td>
                <td className="border border-slate-300 p-2">{outputs.hvArea?.toFixed(2)} mm²</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Current Density</td>
                <td className="border border-slate-300 p-2">{outputs.currentDensity} A/mm²</td>
                <td className="border border-slate-300 p-2">{outputs.currentDensity} A/mm²</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Resistance @ 75°C</td>
                <td className="border border-slate-300 p-2">{(lvRes * 1.2).toFixed(4)} Ω</td>
                <td className="border border-slate-300 p-2">{(hvRes * 1.2).toFixed(2)} Ω</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3.0 Performance & Losses</h3>
          <table className="w-full border-collapse border border-slate-300">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/3">Calculated No Load Loss</td>
                <td className="border border-slate-300 p-2 font-medium w-1/6">{outputs.noLoadLosses?.toFixed(1)} W</td>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/3">Guaranteed No Load Loss</td>
                <td className="border border-slate-300 p-2 w-1/6">{inputs.targetNoLoadLoss} W</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Calculated Load Loss</td>
                <td className="border border-slate-300 p-2 font-medium">{outputs.loadLosses?.toFixed(1)} W</td>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Guaranteed Load Loss</td>
                <td className="border border-slate-300 p-2">{inputs.targetLoadLoss} W</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Calculated %Z</td>
                <td className="border border-slate-300 p-2 font-medium">{outputs.impedance?.toFixed(2)} %</td>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Target %Z</td>
                <td className="border border-slate-300 p-2">{inputs.targetImpedance} %</td>
              </tr>
            </tbody>
          </table>
        </section>

      </div>
    </div>
  );
}
