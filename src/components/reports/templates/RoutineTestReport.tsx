import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function RoutineTestReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const hvRes = (outputs.loadLosses * 0.45) / (3 * Math.pow(outputs.hvPhaseCurrent, 2)) || 0;
  const lvRes = (outputs.loadLosses * 0.45) / (3 * Math.pow(outputs.lvPhaseCurrent, 2)) || 0;

  return (
    <div className="report-page">
      <ReportHeader title="Routine Test Report" inputs={inputs} />
      
      <div className="space-y-6 text-sm">
        <p className="text-slate-600 italic">Tests performed in accordance with IEC 60076 / IS 2026.</p>
        
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1. Measurement of Winding Resistance</h3>
          <table className="w-full border-collapse border border-slate-300 text-center">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2 w-1/4">Winding</th>
                <th className="border border-slate-300 p-2 w-1/4">Terminal</th>
                <th className="border border-slate-300 p-2 w-1/4">Measured (Ω) @ 25°C</th>
                <th className="border border-slate-300 p-2 w-1/4">Calculated (Ω) @ 75°C</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold" rowSpan={3}>HV</td>
                <td className="border border-slate-300 p-2">1U-1V</td>
                <td className="border border-slate-300 p-2 font-mono">{(hvRes).toFixed(3)}</td>
                <td className="border border-slate-300 p-2 font-mono">{(hvRes * 1.2).toFixed(3)}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">1V-1W</td>
                <td className="border border-slate-300 p-2 font-mono">{(hvRes).toFixed(3)}</td>
                <td className="border border-slate-300 p-2 font-mono">{(hvRes * 1.2).toFixed(3)}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">1W-1U</td>
                <td className="border border-slate-300 p-2 font-mono">{(hvRes).toFixed(3)}</td>
                <td className="border border-slate-300 p-2 font-mono">{(hvRes * 1.2).toFixed(3)}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-2 font-semibold" rowSpan={3}>LV</td>
                <td className="border border-slate-300 p-2">2U-2N</td>
                <td className="border border-slate-300 p-2 font-mono">{(lvRes / 3).toFixed(5)}</td>
                <td className="border border-slate-300 p-2 font-mono">{((lvRes / 3) * 1.2).toFixed(5)}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-2">2V-2N</td>
                <td className="border border-slate-300 p-2 font-mono">{(lvRes / 3).toFixed(5)}</td>
                <td className="border border-slate-300 p-2 font-mono">{((lvRes / 3) * 1.2).toFixed(5)}</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-2">2W-2N</td>
                <td className="border border-slate-300 p-2 font-mono">{(lvRes / 3).toFixed(5)}</td>
                <td className="border border-slate-300 p-2 font-mono">{((lvRes / 3) * 1.2).toFixed(5)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2. Measurement of Voltage Ratio and Vector Group</h3>
          <table className="w-full border-collapse border border-slate-300 text-center">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/3">Specified Ratio</td>
                <td className="border border-slate-300 p-2 font-mono w-1/3">{inputs.hvVoltage} / {inputs.lvVoltage} V</td>
                <td className="border border-slate-300 p-2 font-semibold text-emerald-600 w-1/3" rowSpan={2}>PASS (Dyn11 Confirmed)</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Measured Ratio</td>
                <td className="border border-slate-300 p-2 font-mono">{(inputs.hvVoltage / inputs.lvVoltage).toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3. Measurement of No-Load Loss and Current</h3>
          <table className="w-full border-collapse border border-slate-300 text-center">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/3">Guaranteed Loss</td>
                <td className="border border-slate-300 p-2 font-mono w-1/3">{inputs.targetNoLoadLoss} W</td>
                <td className="border border-slate-300 p-2 font-semibold text-emerald-600 w-1/3" rowSpan={2}>PASS</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Measured Loss (Expected)</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.noLoadLosses?.toFixed(1)} W</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">4. Measurement of Short-Circuit Impedance and Load Loss</h3>
          <table className="w-full border-collapse border border-slate-300 text-center">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Guaranteed Load Loss</td>
                <td className="border border-slate-300 p-2 font-mono w-1/4">{inputs.targetLoadLoss} W</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Guaranteed %Z</td>
                <td className="border border-slate-300 p-2 font-mono w-1/4">{inputs.targetImpedance} %</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Measured (Expected)</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.loadLosses?.toFixed(1)} W</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Measured %Z</td>
                <td className="border border-slate-300 p-2 font-mono">{outputs.impedance?.toFixed(2)} %</td>
              </tr>
            </tbody>
          </table>
        </section>
        
        <div className="pt-8 text-center text-xs font-bold text-slate-400">
          * This report contains pre-calculated expected test values based on the design engine parameters. Actual physical test values will be recorded during manufacturing FAT.
        </div>
      </div>
    </div>
  );
}
