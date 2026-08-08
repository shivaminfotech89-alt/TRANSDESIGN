import React from 'react';
import { TransformerInputs } from '../../../types';
import { Zap } from 'lucide-react';

export function ReportHeader({ title, inputs }: { title: string, inputs: TransformerInputs }) {
  const date = new Date().toLocaleDateString('en-GB');
  const designId = `TDE-${inputs.kVA}-${Math.round(inputs.hvVoltage/1000)}-${inputs.lvVoltage}`;

  return (
    <div className="border-b-2 border-slate-800 pb-4 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Transformer Design Engine</h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Engineering Documentation System</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Document No.</div>
          <div className="font-mono text-sm font-bold text-slate-900">{designId}-{title.substring(0, 3).toUpperCase()}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{title}</h2>
        <div className="flex gap-6 text-xs text-slate-600 font-medium">
          <div><span className="text-slate-400 mr-1 uppercase">Date:</span> {date}</div>
          <div><span className="text-slate-400 mr-1 uppercase">Rev:</span> 00</div>
          <div><span className="text-slate-400 mr-1 uppercase">Status:</span> APPROVED</div>
        </div>
      </div>
    </div>
  );
}
