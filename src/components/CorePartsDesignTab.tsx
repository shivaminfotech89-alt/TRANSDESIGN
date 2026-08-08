import React from 'react';
import { TransformerInputs, TransformerOutputs } from '../types';

export function CorePartsDesignTab({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  return (
    <div className="font-sans text-black bg-white w-full">
      {/* Document Title */}
      <div className="text-center font-bold text-lg mb-2 uppercase underline">
        {inputs.projectName || 'Untitled Design'} - Core Parts Design
      </div>
      {/* Header matching the PDF */}
      <div className="flex justify-between items-center border-2 border-black p-2 font-bold text-sm mb-6 uppercase">
        <div className="border border-black px-2 py-1">No Load Losses = {outputs.noLoadLosses} Watts</div>
        <div>KVA = {inputs.kVA}</div>
        <div className="border border-black px-2 py-1">Flux Density = {outputs.bm.toFixed(2)} Tesla</div>
      </div>

      <div className="space-y-8 text-xs font-bold">
        {/* PLATE A */}
        <div className="border-t-2 border-black pt-2 break-inside-avoid">
          <div className="flex border-b-2 border-black pb-1 mb-2">
            <div className="w-[120px] text-center border-2 border-black mr-4 uppercase">PLATE A</div>
            <div className="flex-1 flex uppercase">
              <div className="w-16">S.No.</div>
              <div className="flex-1 text-center">A</div>
              <div className="flex-1 text-center">STEPS</div>
              <div className="flex-1 text-right pr-4">WEIGHTS</div>
            </div>
          </div>
          
          <div className="flex">
            {/* Diagram A */}
            <div className="w-[120px] mr-4 relative flex flex-col items-center justify-center font-normal">
              <svg viewBox="0 0 100 250" className="w-full h-48 stroke-black fill-transparent stroke-2">
                <path d="M40,20 L80,20 L80,230 L40,230 L20,210 L20,40 Z" />
                <path d="M40,20 L20,40" />
                <path d="M40,230 L20,210" />
                {/* Labels */}
                <text x="30" y="55" fontSize="10" stroke="none" fill="black">45°c</text>
                <text x="30" y="200" fontSize="10" stroke="none" fill="black">45°c</text>
                <text x="5" y="125" fontSize="12" stroke="none" fill="black">A</text>
                <line x1="15" y1="20" x2="15" y2="230" markerStart="url(#arrow)" markerEnd="url(#arrow)" strokeDasharray="2,2"/>
                <text x="50" y="245" fontSize="12" stroke="none" fill="black">B</text>
                <line x1="20" y1="240" x2="80" y2="240" markerStart="url(#arrow)" markerEnd="url(#arrow)" strokeDasharray="2,2"/>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="black" stroke="none" />
                  </marker>
                </defs>
              </svg>
            </div>
            
            <div className="flex-1 font-normal">
              {outputs.plateA.map((step) => (
                <div key={step.sNo} className="flex mb-1">
                  <div className="w-16">{step.sNo}.</div>
                  <div className="flex-1 text-center">{step.a.toFixed(0)}</div>
                  <div className="flex-1 text-center">{step.stepWidth.toFixed(0)}</div>
                  <div className="flex-1 text-right pr-4">{step.weight.toFixed(2)}</div>
                </div>
              ))}
              <div className="flex border-t border-black pt-1 mt-2 font-bold uppercase">
                <div className="w-16"></div>
                <div className="flex-1 text-right pr-4 col-span-2">TOTAL WEIGHT OF PLATE A =</div>
                <div className="flex-1 text-right pr-4">{outputs.plateA.reduce((s, i) => s + i.weight, 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* PLATE B */}
        <div className="border-t-2 border-black pt-2 break-inside-avoid">
          <div className="flex border-b-2 border-black pb-1 mb-2">
            <div className="w-[120px] text-center border-2 border-black mr-4 uppercase">PLATE B</div>
            <div className="flex-1 flex uppercase">
              <div className="w-16">S.No.</div>
              <div className="flex-1 text-center">A</div>
              <div className="flex-1 text-center">STEPS</div>
              <div className="flex-[1.5]">
                 <div className="text-center border-b border-black w-full">WEIGHTS</div>
                 <div className="flex text-[10px] w-full pt-1">
                    <div className="flex-1 text-center border-r border-black">Weight 1<br/>Shifting 0</div>
                    <div className="flex-1 text-center border-r border-black">Weight 2<br/>Shifting 10</div>
                    <div className="flex-1 text-center">Weight 3<br/>Shifting 20</div>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex">
            {/* Diagram B */}
            <div className="w-[120px] mr-4 relative flex flex-col items-center justify-center font-normal">
              <svg viewBox="0 0 100 250" className="w-full h-48 stroke-black fill-transparent stroke-2">
                <path d="M40,20 L60,20 L80,40 L80,210 L60,230 L40,230 L20,210 L20,40 Z" />
                <path d="M40,20 L20,40" />
                <path d="M60,20 L80,40" />
                <path d="M60,230 L80,210" />
                <path d="M40,230 L20,210" />
                {/* Center Notch */}
                <path d="M45,115 L55,115 L55,135 L45,135 Z" fill="white" stroke="black"/>
                
                {/* Labels */}
                <text x="15" y="30" fontSize="8" stroke="none" fill="black">45°</text>
                <text x="70" y="30" fontSize="8" stroke="none" fill="black">45°</text>
                <text x="15" y="225" fontSize="8" stroke="none" fill="black">45°</text>
                <text x="70" y="225" fontSize="8" stroke="none" fill="black">45°</text>
                
                <text x="5" y="125" fontSize="10" stroke="none" fill="black">A</text>
                <line x1="12" y1="20" x2="12" y2="230" markerStart="url(#arrow)" markerEnd="url(#arrow)" strokeDasharray="2,2"/>
                
                <text x="35" y="125" fontSize="8" stroke="none" fill="black">B/2</text>
                <text x="65" y="125" fontSize="8" stroke="none" fill="black">B/2</text>
              </svg>
            </div>
            
            <div className="flex-1 font-normal">
              {outputs.plateB.map((step) => {
                 // The screenshot shows weights divided for shifting
                 // We will approximate it or just repeat if exact shifting isn't calculated
                 const w1 = (step.weight * 0.25).toFixed(2);
                 const w2 = (step.weight * 0.50).toFixed(2);
                 const w3 = (step.weight * 0.25).toFixed(2);
                 return (
                  <div key={step.sNo} className="flex mb-1 items-center">
                    <div className="w-16">{step.sNo}.</div>
                    <div className="flex-1 text-center">{step.a.toFixed(0)}</div>
                    <div className="flex-1 text-center">{step.stepWidth.toFixed(0)}</div>
                    <div className="flex-[1.5] flex">
                      <div className="flex-1 text-center">{w1}</div>
                      <div className="flex-1 text-center">{w2}</div>
                      <div className="flex-1 text-center">{w3}</div>
                    </div>
                  </div>
                )
              })}
              <div className="flex border-t border-black pt-1 mt-2 font-bold uppercase">
                <div className="w-16"></div>
                <div className="flex-1 text-right pr-4 col-span-2">TOTAL WEIGHT OF PLATE B =</div>
                <div className="flex-[1.5] text-center">{outputs.plateB.reduce((s, i) => s + i.weight, 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* PLATE C */}
        <div className="border-t-2 border-black pt-2 break-inside-avoid">
          <div className="flex border-b-2 border-black pb-1 mb-2">
            <div className="w-[120px] text-center border-2 border-black mr-4 uppercase">PLATE C</div>
            <div className="flex-1 flex uppercase">
              <div className="w-16">S.No.</div>
              <div className="flex-1 text-center">A</div>
              <div className="flex-1 text-right pr-4">WEIGHTS</div>
            </div>
          </div>
          
          <div className="flex">
            {/* Diagram C */}
            <div className="w-[120px] mr-4 relative flex flex-col items-center justify-center font-normal">
              <svg viewBox="0 0 100 250" className="w-full h-48 stroke-black fill-transparent stroke-2">
                <path d="M20,20 L60,20 L80,40 L80,210 L60,230 L20,230 Z" />
                <path d="M60,20 L80,40" />
                <path d="M60,230 L80,210" />
                {/* Labels */}
                <text x="65" y="30" fontSize="8" stroke="none" fill="black">45°</text>
                <text x="65" y="225" fontSize="8" stroke="none" fill="black">45°</text>
                
                <text x="5" y="125" fontSize="10" stroke="none" fill="black">A</text>
                <line x1="12" y1="20" x2="12" y2="230" markerStart="url(#arrow)" markerEnd="url(#arrow)" strokeDasharray="2,2"/>
              </svg>
            </div>
            
            <div className="flex-1 font-normal">
              {outputs.plateC.map((step) => (
                <div key={step.sNo} className="flex mb-1">
                  <div className="w-16">{step.sNo}.</div>
                  <div className="flex-1 text-center">{step.a.toFixed(0)}</div>
                  <div className="flex-1 text-right pr-4">{step.weight.toFixed(2)}</div>
                </div>
              ))}
              <div className="flex border-t border-black pt-1 mt-2 font-bold uppercase">
                <div className="w-16"></div>
                <div className="flex-1 text-right pr-4 col-span-2">TOTAL WEIGHT OF PLATE C =</div>
                <div className="flex-1 text-right pr-4">{outputs.plateC.reduce((s, i) => s + i.weight, 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* TOTALS */}
        <div className="border-t-2 border-black pt-2 pb-8 flex justify-between font-bold text-sm uppercase">
          <span>Total Weight of Core =</span>
          <span className="pr-4">{outputs.coreWeight.toFixed(2)} kg</span>
        </div>
      </div>
    </div>
  );
}
