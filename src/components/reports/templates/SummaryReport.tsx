import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';
import { ReportHeader } from './ReportHeader';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export function SummaryReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  return (
    <div className="report-page">
      <ReportHeader title="Executive Design Summary" inputs={inputs} />
      
      <div className="grid grid-cols-2 gap-8 text-sm">
        <div className="space-y-6">
          <section>
            <h3 className="font-bold text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-3">Key Design Parameters</h3>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">Rating</span>
                <span className="font-bold">{inputs.kVA} kVA</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">Voltage Ratio</span>
                <span className="font-bold">{inputs.hvVoltage} / {inputs.lvVoltage} V</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">Core Material</span>
                <span className="font-bold">{inputs.coreMaterial}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">Conductor</span>
                <span className="font-bold">{inputs.conductor}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-3">Performance Validation</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">No Load Loss Guarantee</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{outputs.noLoadLosses?.toFixed(0)} / {inputs.targetNoLoadLoss} W</span>
                  {outputs.noLoadLosses! <= inputs.targetNoLoadLoss ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Load Loss Guarantee</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{outputs.loadLosses?.toFixed(0)} / {inputs.targetLoadLoss} W</span>
                  {outputs.loadLosses! <= inputs.targetLoadLoss ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Impedance (%Z)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{outputs.impedance?.toFixed(2)} / {inputs.targetImpedance} %</span>
                  {Math.abs(outputs.impedance! - inputs.targetImpedance) < (inputs.targetImpedance * 0.1) ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="font-bold text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-3">Cost & Materials Breakdown</h3>
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
                <span className="text-slate-600 uppercase font-bold text-xs tracking-wider">Estimated Factory Cost</span>
                <span className="text-2xl font-black text-slate-900">₹ {(outputs.totalMaterialCost * 1.35).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Core Weight (CRGO)</span>
                  <span className="font-mono font-medium">{outputs.coreWeight?.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Conductor Weight</span>
                  <span className="font-mono font-medium">{outputs.copperWeight?.toFixed(1)} kg</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-3">Overall Dimensions & Weight</h3>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">Estimated Total Weight</span>
                <span className="font-bold">~{((outputs.coreWeight + outputs.copperWeight) * 1.8).toFixed(0)} kg</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-600">Oil Quantity</span>
                <span className="font-bold">~{(inputs.kVA * 2.1).toFixed(0)} L</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
