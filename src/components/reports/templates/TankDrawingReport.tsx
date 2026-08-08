import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function TankDrawingReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const tankDimensions = outputs.tankDimensions || { length: 0, width: 0, height: 0, weight: 0 };
  const plateThickness = inputs.kVA > 1000 ? 6 : inputs.kVA > 500 ? 5 : 4;
  const bottomThickness = plateThickness + 2;
  const coverThickness = plateThickness + 2;

  return (
    <div className="report-page">
      <ReportHeader title="Tank Fabrication Drawing Data" inputs={inputs} />
      
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1. Main Tank Dimensions (Internal)</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Length (X-axis)</td>
                <td className="border border-slate-300 p-2 font-mono w-1/4">{tankDimensions.length?.toFixed(0)} mm</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Side Plate Thk.</td>
                <td className="border border-slate-300 p-2 font-mono w-1/4">{plateThickness} mm (Mild Steel)</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Width (Y-axis)</td>
                <td className="border border-slate-300 p-2 font-mono">{tankDimensions.width?.toFixed(0)} mm</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Bottom Plate Thk.</td>
                <td className="border border-slate-300 p-2 font-mono">{bottomThickness} mm</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Height (Z-axis)</td>
                <td className="border border-slate-300 p-2 font-mono">{tankDimensions.height?.toFixed(0)} mm</td>
                <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Top Cover Thk.</td>
                <td className="border border-slate-300 p-2 font-mono">{coverThickness} mm</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2. Construction Details</h3>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
            <li><strong>Tank Type:</strong> {inputs.tankType}</li>
            <li><strong>Welding:</strong> All seams must be double welded (inside and outside) and tested for leaks at 0.35 kg/cm² above atmospheric pressure.</li>
            <li><strong>Lifting Lugs:</strong> 4 Nos. lifting lugs suitable for lifting active part + tank + oil ({outputs.totalWeight?.toFixed(0)} kg approx).</li>
            <li><strong>Jacking Pads:</strong> 4 Nos. base jacking pads with minimum 50mm clearance from ground level.</li>
            <li><strong>Painting:</strong> Inside with oil & heat resistant paint. Outside with 1 coat zinc chromate primer and 2 coats epoxy polyurethane (Min 100 microns).</li>
          </ul>
        </section>

        {inputs.tankType === 'Radiator & Conservator' && (
          <section>
            <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3. Conservator Details</h3>
            <table className="w-full border-collapse border border-slate-300 text-sm">
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Volume (Min 10% Oil)</td>
                  <td className="border border-slate-300 p-2 font-mono w-1/4">{((outputs.oilQuantity || 0) * 0.1).toFixed(0)} L</td>
                  <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Oil Level Gauge</td>
                  <td className="border border-slate-300 p-2 font-mono w-1/4">Prismatic / Magnetic</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Silica Gel Breather</td>
                  <td className="border border-slate-300 p-2 font-mono">1 No. with Oil Seal</td>
                  <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Drain Plug</td>
                  <td className="border border-slate-300 p-2 font-mono">1 No. (Bottom)</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
