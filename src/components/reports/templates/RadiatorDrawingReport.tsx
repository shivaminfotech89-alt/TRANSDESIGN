import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function RadiatorDrawingReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const needsRadiators = inputs.cooling === 'Oil Immersed' && inputs.tankType === 'Radiator & Conservator';
  const lossesKW = (outputs.loadLosses + outputs.noLoadLosses) / 1000;
  
  // Very rough estimate of radiator requirements based on losses
  const totalCoolingAreaReq = lossesKW * 0.45; // m^2 approx
  const areaPerFin = 1000 * 300 * 2 / 1000000; // Assume 1000x300mm fins
  const totalFins = Math.ceil(totalCoolingAreaReq / areaPerFin);
  
  const radBanks = totalFins > 30 ? 4 : 2;
  const finsPerBank = Math.ceil(totalFins / radBanks);

  return (
    <div className="report-page">
      <ReportHeader title="Radiator Drawing Data" inputs={inputs} />
      
      <div className="space-y-6">
        {needsRadiators ? (
          <>
            <section>
              <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1. Cooling System Requirements</h3>
              <table className="w-full border-collapse border border-slate-300 text-sm">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Total Losses (Design)</td>
                    <td className="border border-slate-300 p-2 font-mono w-1/4">{lossesKW.toFixed(2)} kW</td>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Cooling Type</td>
                    <td className="border border-slate-300 p-2 font-mono w-1/4">{inputs.cooling} (ONAN)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Target Temp Rise (Oil)</td>
                    <td className="border border-slate-300 p-2 font-mono">{inputs.tempRise || 50} °C</td>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Est. Dissipation Area</td>
                    <td className="border border-slate-300 p-2 font-mono">{totalCoolingAreaReq.toFixed(1)} m²</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2. Radiator Bank Configuration</h3>
              <table className="w-full border-collapse border border-slate-300 text-sm">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Number of Radiators</td>
                    <td className="border border-slate-300 p-2 font-mono w-1/4">{radBanks} Nos.</td>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-1/4">Elements per Radiator</td>
                    <td className="border border-slate-300 p-2 font-mono w-1/4">{finsPerBank} Elements</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Element Dimensions</td>
                    <td className="border border-slate-300 p-2 font-mono">1000 mm x 300 mm</td>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Material / Thickness</td>
                    <td className="border border-slate-300 p-2 font-mono">CRCA Steel / 1.0 mm</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Center Distance (C to C)</td>
                    <td className="border border-slate-300 p-2 font-mono">1000 mm</td>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Valves</td>
                    <td className="border border-slate-300 p-2 font-mono">Top & Bottom Butterfly Valves</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3. Radiator Testing & Finishing</h3>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
                <li>All radiators must be pressure tested individually at 2.0 kg/cm² using hot transformer oil / dry air.</li>
                <li>Surface preparation: Shot blasting or chemical cleaning before painting.</li>
                <li>Inner coating: Hot oil resistant varnish.</li>
                <li>Outer coating: Zinc primer followed by Polyurethane / Epoxy finish coat.</li>
              </ul>
            </section>
          </>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-300 bg-slate-50 text-center rounded-lg mt-6">
            <h3 className="font-bold text-lg text-slate-700 mb-2">Radiator Drawings Not Applicable</h3>
            <p className="text-slate-500 mb-4">
              This transformer design uses <strong>{inputs.tankType}</strong> with <strong>{inputs.cooling}</strong>. 
              Detachable radiators are generally not required for this configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
