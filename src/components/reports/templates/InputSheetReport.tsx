import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function InputSheetReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  return (
    <div className="report-page">
      <ReportHeader title="Design Input Sheet" inputs={inputs} />
      
      <div className="space-y-6 text-sm">
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1.0 General Specifications</h3>
          <table className="w-full border-collapse border border-slate-300">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/4">Applicable Standard</td>
                <td className="border border-slate-300 p-2 w-1/4">IEC 60076 / IS 2026</td>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/4">Frequency</td>
                <td className="border border-slate-300 p-2 w-1/4">50 Hz</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Rated Power (kVA)</td>
                <td className="border border-slate-300 p-2">{inputs.kVA} kVA</td>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Phases</td>
                <td className="border border-slate-300 p-2">3 Phase</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Cooling Method</td>
                <td className="border border-slate-300 p-2">ONAN</td>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Vector Group</td>
                <td className="border border-slate-300 p-2">Dyn11</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2.0 Voltage & Current Ratings</h3>
          <table className="w-full border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="border border-slate-300 p-2 text-left w-1/3">Parameter</th>
                <th className="border border-slate-300 p-2 text-left w-1/3">High Voltage (HV)</th>
                <th className="border border-slate-300 p-2 text-left w-1/3">Low Voltage (LV)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold">Rated Voltage</td>
                <td className="border border-slate-300 p-2">{inputs.hvVoltage} V</td>
                <td className="border border-slate-300 p-2">{inputs.lvVoltage} V</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold">Rated Current</td>
                <td className="border border-slate-300 p-2">{(inputs.kVA * 1000 / (1.732 * inputs.hvVoltage)).toFixed(2)} A</td>
                <td className="border border-slate-300 p-2">{(inputs.kVA * 1000 / (1.732 * inputs.lvVoltage)).toFixed(2)} A</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold">Connection</td>
                <td className="border border-slate-300 p-2">Delta</td>
                <td className="border border-slate-300 p-2">Star</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3.0 Performance Guarantees</h3>
          <table className="w-full border-collapse border border-slate-300">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/3">No Load Loss (Max)</td>
                <td className="border border-slate-300 p-2 w-1/6">{inputs.targetNoLoadLoss} W</td>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold w-1/3">Load Loss (Max)</td>
                <td className="border border-slate-300 p-2 w-1/6">{inputs.targetLoadLoss} W</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Impedance (%Z)</td>
                <td className="border border-slate-300 p-2">{inputs.targetImpedance} %</td>
                <td className="border border-slate-300 p-2 bg-slate-50 font-semibold">Tolerance</td>
                <td className="border border-slate-300 p-2">± 10% (IEC)</td>
              </tr>
            </tbody>
          </table>
        </section>
        
        <div className="pt-20 flex justify-between">
          <div className="w-48 border-t border-slate-800 text-center pt-2 text-xs font-bold text-slate-600">Prepared By (Design Dept)</div>
          <div className="w-48 border-t border-slate-800 text-center pt-2 text-xs font-bold text-slate-600">Approved By (Engineering Head)</div>
        </div>
      </div>
    </div>
  );
}
