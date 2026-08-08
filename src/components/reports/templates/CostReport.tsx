import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';

export function CostReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const materials = [
    { name: 'Core Material (CRGO)', cost: outputs.totalCoreCost },
    { name: 'Winding Conductor', cost: outputs.totalConductorCost },
    { name: 'Transformer Oil', cost: inputs.kVA * 2.1 * inputs.oilCostPerLitre },
    { name: 'Tank & Radiators', cost: inputs.kVA * 0.9 * inputs.steelCostPerKg },
    { name: 'Insulation & Pressboard', cost: outputs.totalMaterialCost * 0.05 },
    { name: 'Bushings & Accessories', cost: outputs.totalMaterialCost * 0.08 }
  ];
  
  const rawMaterialCost = materials.reduce((sum, m) => sum + m.cost, 0);
  const laborCost = rawMaterialCost * 0.12;
  const factoryOverhead = rawMaterialCost * 0.15;
  const totalCost = rawMaterialCost + laborCost + factoryOverhead;
  const margin = totalCost * 0.20;
  const finalPrice = totalCost + margin;

  return (
    <div className="report-page">
      <ReportHeader title="Cost Estimation Report" inputs={inputs} />
      
      <div className="flex gap-8">
        <div className="flex-1">
          <table className="w-full text-sm border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 uppercase text-xs">
              <tr>
                <th className="border border-slate-300 p-3 text-left">Cost Component</th>
                <th className="border border-slate-300 p-3 text-right">Amount (₹)</th>
                <th className="border border-slate-300 p-3 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 p-2 text-slate-700">{m.name}</td>
                  <td className="border border-slate-300 p-2 text-right font-mono">{m.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td className="border border-slate-300 p-2 text-right text-slate-500">{((m.cost / rawMaterialCost) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td className="border border-slate-300 p-2 text-slate-800">Total Raw Material</td>
                <td className="border border-slate-300 p-2 text-right font-mono">{rawMaterialCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td className="border border-slate-300 p-2 text-right text-slate-500">100%</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-slate-700">Direct Labour & Mfg</td>
                <td className="border border-slate-300 p-2 text-right font-mono">{laborCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td className="border border-slate-300 p-2 text-right text-slate-500">-</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-slate-700">Factory Overheads & Testing</td>
                <td className="border border-slate-300 p-2 text-right font-mono">{factoryOverhead.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td className="border border-slate-300 p-2 text-right text-slate-500">-</td>
              </tr>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                <td className="border border-slate-300 p-3 uppercase tracking-wider">Estimated Factory Cost</td>
                <td className="border border-slate-300 p-3 text-right font-mono text-lg">{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td className="border border-slate-300 p-3 text-right text-slate-500">-</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-slate-700">Profit Margin (20%)</td>
                <td className="border border-slate-300 p-2 text-right font-mono">{margin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td className="border border-slate-300 p-2 text-right text-slate-500">-</td>
              </tr>
              <tr className="bg-emerald-50 font-black text-emerald-900 border-t-2 border-emerald-400">
                <td className="border border-slate-300 p-3 uppercase tracking-wider">Recommended Selling Price</td>
                <td className="border border-slate-300 p-3 text-right font-mono text-xl">{finalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td className="border border-slate-300 p-3 text-right text-emerald-600">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
