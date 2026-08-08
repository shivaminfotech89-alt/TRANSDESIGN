import React, { useState } from 'react';
import { TransformerInputs, TransformerOutputs } from '../../types';
import { TransformerModel } from './TransformerModel';
import { Settings, Layers, Eye, EyeOff, Info, Box } from 'lucide-react';

export function CadViewerTab({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const [visibility, setVisibility] = useState({
    tank: true,
    conservator: true,
    radiators: true,
    bushings: true,
    core: true,
    lvWinding: true,
    hvWinding: true
  });

  const [exploded, setExploded] = useState(false);
  const [transparency, setTransparency] = useState(0);
  const [selectedPart, setSelectedPart] = useState<any>(null);

  const toggleVisibility = (part: keyof typeof visibility) => {
    setVisibility(prev => ({ ...prev, [part]: !prev[part] }));
  };

  return (
    <div className="flex h-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm relative">
      {/* 3D Canvas Area */}
      <div className="flex-1 relative bg-slate-50">
        <TransformerModel 
          inputs={inputs} 
          outputs={outputs} 
          visibility={visibility} 
          exploded={exploded}
          transparency={transparency}
          onSelectPart={(part) => setSelectedPart(part)}
        />
        
        {/* Overlay Controls Bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Exploded View</span>
            <button 
              onClick={() => setExploded(!exploded)}
              className={`w-10 h-5 rounded-full relative transition-colors ${exploded ? 'bg-purple-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${exploded ? 'translate-x-5' : ''}`}></div>
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Tank Transparency</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={transparency} 
              onChange={(e) => setTransparency(Number(e.target.value))}
              className="w-24 accent-purple-600"
            />
            <span className="text-xs font-mono text-slate-500 w-8">{transparency}%</span>
          </div>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Layers className="w-4 h-4 text-purple-600" />
            Model Inspector
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Visibility Controls */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Visibility</h4>
            <div className="space-y-1">
              {Object.keys(visibility).map(key => (
                <button
                  key={key}
                  onClick={() => toggleVisibility(key as keyof typeof visibility)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors border border-transparent hover:border-slate-200"
                >
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  {visibility[key as keyof typeof visibility] ? 
                    <Eye className="w-4 h-4 text-slate-400" /> : 
                    <EyeOff className="w-4 h-4 text-slate-300" />
                  }
                </button>
              ))}
            </div>
          </div>

          {/* Selected Part Properties */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> Part Inspection
            </h4>
            
            {selectedPart ? (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-3">
                <div className="flex items-start gap-3 border-b border-purple-200 pb-3 mb-2">
                  <div className="w-8 h-8 rounded bg-purple-200 flex items-center justify-center shrink-0">
                    <Box className="w-4 h-4 text-purple-700" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm leading-tight">{selectedPart.name}</div>
                    <div className="text-xs text-purple-600 font-mono mt-0.5">{selectedPart.partNumber}</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Material</span>
                    <span className="font-medium text-slate-700 text-right">{selectedPart.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dimensions</span>
                    <span className="font-medium text-slate-700 text-right">{selectedPart.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Weight</span>
                    <span className="font-mono font-medium text-slate-700">{selectedPart.weight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Est. Cost</span>
                    <span className="font-mono font-medium text-slate-700">{selectedPart.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplier</span>
                    <span className="font-medium text-slate-700">{selectedPart.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Drawing Ref</span>
                    <span className="font-mono font-medium text-blue-600 cursor-pointer hover:underline">{selectedPart.drawingRef || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                Click any component in the 3D model to view engineering properties and manufacturing details.
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">General Dimensions</h4>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Core Dia:</span>
                <span className="font-mono font-bold text-slate-700">{outputs.coreDia?.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Limb Center:</span>
                <span className="font-mono font-bold text-slate-700">{outputs.limbCenter?.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Window Ht:</span>
                <span className="font-mono font-bold text-slate-700">{outputs.windowHeight?.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tank (LxWxH):</span>
                <span className="font-mono font-bold text-slate-700">
                  {outputs.tankDimensions?.length}x{outputs.tankDimensions?.width}x{outputs.tankDimensions?.height}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Wt:</span>
                <span className="font-mono font-bold text-slate-700">{outputs.totalWeight?.toFixed(0)} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
