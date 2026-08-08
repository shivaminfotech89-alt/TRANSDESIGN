import React from 'react';
import { TransformerOutputs, TransformerInputs } from '../../../types';

export function NamePlateReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const date = new Date().getFullYear();
  
  return (
    <div className="report-page flex flex-col items-center justify-center min-h-[600px] bg-slate-100">
      <div className="w-[700px] bg-gradient-to-br from-slate-200 to-slate-400 border-4 border-slate-500 rounded-lg shadow-2xl p-6 relative">
        {/* Screws */}
        <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-slate-300 border border-slate-500 shadow-inner"></div>
        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-slate-300 border border-slate-500 shadow-inner"></div>
        <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-slate-300 border border-slate-500 shadow-inner"></div>
        <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-slate-300 border border-slate-500 shadow-inner"></div>
        
        <div className="text-center border-b-2 border-slate-600 pb-4 mb-4">
          <h1 className="text-3xl font-black text-slate-800 tracking-widest uppercase">TRANSFORMER DESIGN ENGINE</h1>
          <h2 className="text-lg font-bold text-slate-700 tracking-widest uppercase mt-1">Power Transformer</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Rating</span> <span>{inputs.kVA} kVA</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Phases</span> <span>3</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>HV Volts</span> <span>{inputs.hvVoltage} V</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>HV Amps</span> <span>{(inputs.kVA * 1000 / (1.732 * inputs.hvVoltage)).toFixed(1)} A</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>LV Volts</span> <span>{inputs.lvVoltage} V</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>LV Amps</span> <span>{(inputs.kVA * 1000 / (1.732 * inputs.lvVoltage)).toFixed(1)} A</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Frequency</span> <span>50 Hz</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Impedance</span> <span>{inputs.targetImpedance} %</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Vector Group</span> <span>Dyn11</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Cooling</span> <span>ONAN</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Core Weight</span> <span>{outputs.coreWeight?.toFixed(0)} kg</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Coil Weight</span> <span>{outputs.copperWeight?.toFixed(0)} kg</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Oil Volume</span> <span>{(inputs.kVA * 2.1).toFixed(0)} L</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Total Weight</span> <span>{((outputs.coreWeight + outputs.copperWeight) * 1.8).toFixed(0)} kg</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Year of Mfg</span> <span>{date}</span>
          </div>
          <div className="flex justify-between border-b border-slate-400 pb-1">
            <span>Standard</span> <span>IS 2026 / IEC 60076</span>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs font-bold text-slate-700 tracking-widest uppercase">
          Manufactured By: AI Studio Engineering Corp.
        </div>
      </div>
      
      <p className="mt-8 text-slate-500 text-sm print:hidden">This is a dynamic preview of the laser-engraved name plate.</p>
    </div>
  );
}
