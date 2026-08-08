import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function AccessoriesReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const isLarge = inputs.kVA > 1000;
  
  return (
    <div className="report-page">
      <ReportHeader title="Accessories & Fittings Layout" inputs={inputs} />
      
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">1. Bushings and Terminations</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm text-left">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2">Item</th>
                <th className="border border-slate-300 p-2">Specification</th>
                <th className="border border-slate-300 p-2 text-center">Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">HV Bushings</td>
                <td className="border border-slate-300 p-2">{inputs.hvVoltage >= 33000 ? '36kV' : '12kV'} Porcelain / Epoxy</td>
                <td className="border border-slate-300 p-2 text-center font-mono">3</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">LV Bushings (Ph + N)</td>
                <td className="border border-slate-300 p-2">1.1kV / 3.6kV Porcelain, {inputs.kVA > 500 ? 'Busbar Flag Type' : 'Stud Type'}</td>
                <td className="border border-slate-300 p-2 text-center font-mono">4</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Bushing CTs (If Applicable)</td>
                <td className="border border-slate-300 p-2">Neutral CT for WTI / REF protection</td>
                <td className="border border-slate-300 p-2 text-center font-mono">{isLarge ? 1 : '-'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">2. Standard Fittings & Valves</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm text-left">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2">Item</th>
                <th className="border border-slate-300 p-2">Location</th>
                <th className="border border-slate-300 p-2 text-center">Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Drain & Sampling Valve</td>
                <td className="border border-slate-300 p-2">Tank Bottom</td>
                <td className="border border-slate-300 p-2 text-center font-mono">1</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Filter Valve</td>
                <td className="border border-slate-300 p-2">Tank Top</td>
                <td className="border border-slate-300 p-2 text-center font-mono">1</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Earthing Terminals</td>
                <td className="border border-slate-300 p-2">Tank Base (Diagonal)</td>
                <td className="border border-slate-300 p-2 text-center font-mono">2</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Rating & Diagram Plate</td>
                <td className="border border-slate-300 p-2">Tank Side (Eye Level)</td>
                <td className="border border-slate-300 p-2 text-center font-mono">1</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Lifting Lugs & Jacking Pads</td>
                <td className="border border-slate-300 p-2">Tank Top Cover & Base</td>
                <td className="border border-slate-300 p-2 text-center font-mono">4+4</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold text-slate-800 uppercase bg-slate-100 p-2 mb-3">3. Protection & Monitoring Accessories</h3>
          <table className="w-full border-collapse border border-slate-300 text-sm text-left">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2">Item</th>
                <th className="border border-slate-300 p-2">Specification / Features</th>
                <th className="border border-slate-300 p-2 text-center">Qty</th>
              </tr>
            </thead>
            <tbody>
              {inputs.cooling === 'Oil Immersed' && (
                <>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Pressure Relief Valve (PRV)</td>
                    <td className="border border-slate-300 p-2">With Trip Contacts (For &gt;500kVA)</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">1</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Buchholz Relay</td>
                    <td className="border border-slate-300 p-2">Double Float with Alarm & Trip</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{inputs.tankType === 'Radiator & Conservator' && inputs.kVA >= 500 ? '1' : '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Oil Temperature Indicator (OTI)</td>
                    <td className="border border-slate-300 p-2">With Alarm & Trip Contacts</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{isLarge ? '1' : 'Dial Type'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Winding Temperature Indicator (WTI)</td>
                    <td className="border border-slate-300 p-2">With Alarm & Trip Contacts</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{isLarge ? '1' : '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Magnetic Oil Level Gauge (MOG)</td>
                    <td className="border border-slate-300 p-2">With Low Level Alarm Contact</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{inputs.tankType === 'Radiator & Conservator' ? '1' : '-'}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
