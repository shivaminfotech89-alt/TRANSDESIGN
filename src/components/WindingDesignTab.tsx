import React from 'react';
import { TransformerInputs, TransformerOutputs } from '../types';

export function WindingDesignTab({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  
  return (
    <div className="overflow-x-auto border border-[#27272A] print:border-black w-full bg-[#FFFFFF] print:overflow-visible break-inside-avoid">
      <div className="p-4 bg-[#FFFFFF] text-[#000000] font-sans relative min-w-[900px] text-xs font-bold" style={{ backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start mb-4">
          <div className="border-2 border-black px-2 py-1 bg-white uppercase text-sm">
            <span className="underline">WORKING DESIGN FOR:- MEHIR TRANSFORMERS - AHEMDABAD</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="border-2 border-black px-2 py-1 bg-white text-sm">
              <span className="underline">DATE:- {currentDate}</span>
            </div>
            <div className="border-2 border-black px-2 py-1 bg-white whitespace-nowrap text-sm font-bold">
              <div className="underline">No Load Losses = {outputs.noLoadLosses} Watts</div>
              <div className="border-t-2 border-black pt-1 underline">Load Losses = {outputs.loadLosses} Watts</div>
            </div>
          </div>
        </div>

        <div className="text-center absolute top-4 left-1/2 -translate-x-1/2 w-max mt-2">
           <div className="border-2 border-black px-2 bg-white mx-auto w-max mb-1 text-sm font-bold underline">
             {inputs.tapChanger && inputs.tapChanger !== 'None' ? `Taps at:- +${inputs.tapRangeAbove}% to -${inputs.tapRangeBelow}% @ ${inputs.tapStepVariation}%` : 'No Taps'}
           </div>
           <div className="font-bold border-2 border-black px-4 bg-white inline-block mx-auto mb-1 text-base">{inputs.tapChanger || 'OCTC'}</div>
           <h3 className="text-lg font-bold text-[#1E3A8A] underline uppercase mb-1">WINDING DESIGN RESULTS</h3>
           <div className="border-2 border-black px-4 py-1 bg-white inline-block text-base font-bold underline">
             {inputs.kVA} KVA Copper With Taps
           </div>
        </div>

        <div className="h-28"></div> {/* Spacer for absolute header */}

        {/* THREE COLUMNS: LV, CORE, HV */}
        <div className="flex justify-between gap-4 mb-6">
          
          {/* LV SIDE */}
          <div className="space-y-4 w-64 text-sm font-bold">
            <div className="space-y-3">
              <div className="flex"><span className="w-16">Turns</span> <span>=</span> <span className="ml-4 font-bold text-lg text-center flex-1">{outputs.lvTurns}</span></div>
              <div className="flex"><span className="w-16">T.P.L</span> <span>=</span> <span className="ml-4 text-center flex-1">{outputs.lvTpl}</span></div>
              <div className="flex"><span className="w-16">Layer</span> <span>=</span> <span className="ml-4 text-center flex-1">{outputs.lvLayers}</span></div>
              <div className="flex"><span className="w-16">I.D</span> <span>=</span> <span className="ml-4 text-center flex-1">{outputs.lvId} mm.</span></div>
              <div className="flex"><span className="w-16">O.D</span> <span>=</span> <span className="ml-4 text-center flex-1">{outputs.lvOd} mm.</span></div>
              <div className="flex items-center mt-2"><span className="w-16">Cond</span> <span>=</span> 
                <span className="ml-4 text-center flex-1 flex flex-col items-center">
                  <span className="border-b-2 border-black pb-1 w-full">{outputs.lvCondWidth} x {outputs.lvCondThick} ] 30</span>
                  <span className="pt-1 w-full">{outputs.lvCondWidth + 0.4} x {outputs.lvCondThick + 0.4}</span>
                </span>
              </div>
            </div>
            
            <div className="border-4 border-black px-4 py-1 w-max mx-auto my-4 text-center">
               <span className="underline">5A x 6R</span>
            </div>
            
            <div className="border-2 border-black px-2 py-1 bg-white w-max">
              <div className="underline mb-1">Inter Layer = 2 MM Oil Duct</div>
              <div className="border-t-2 border-black pt-1 underline">Covering = 0.40 mm TPC</div>
            </div>
            
            <div className="border-2 border-black px-2 py-1 bg-white w-max uppercase underline mt-2">
              USE EC GRADE COPPER ONLY VERY IMP.
            </div>
            
            <div className="flex border-2 border-black bg-white w-max mt-2">
              <div className="px-2 py-1 border-r-2 border-black underline">LV Coil Axial</div>
              <div className="px-2 py-1 underline font-bold w-24 text-center">{outputs.lvAxial} mm.</div>
            </div>
            
            <div className="flex border-2 border-black bg-white w-max mt-2">
              <div className="px-2 py-1 border-r-2 border-black underline">LV End Clearance</div>
              <div className="px-2 py-1 underline font-bold w-24 text-center">5 mm.</div>
            </div>
          </div>

          {/* CENTER CORE INFO */}
          <div className="flex flex-col items-center justify-start pt-12 w-64 text-sm font-bold">
            <div className="border-4 border-black p-3 space-y-4 w-full bg-white">
              <div className="flex"><span className="w-24">Core Dia</span> <span>=</span> <span className="ml-2 text-right flex-1">{outputs.coreDia.toFixed(0)} mm.</span></div>
              <div className="flex"><span className="w-24">L.T Amp</span> <span>=</span> <span className="ml-2 text-right flex-1">{outputs.lvPhaseCurrent.toFixed(0)} Amps</span></div>
              <div className="flex"><span className="w-24">H.T Amp</span> <span>=</span> <span className="ml-2 text-right flex-1">{outputs.hvPhaseCurrent.toFixed(0)} Amps</span></div>
              <div className="flex"><span className="w-24">Hilo</span> <span>=</span> <span className="ml-2 text-right flex-1">{outputs.hiloGap} mm.</span></div>
              <div className="flex"><span className="w-24">Ratio</span> <span>=</span> <span className="ml-2 text-right flex-1">{outputs.ratio}</span></div>
            </div>
          </div>

          {/* HV SIDE */}
          <div className="w-72 text-sm font-bold space-y-3">
            <div className="flex"><span className="w-32">L.V O.D</span> <span className="text-right flex-1">{outputs.lvOd} mm.</span></div>
            <div className="flex"><span className="w-32">Former Dia</span> <span className="text-right flex-1">{outputs.lvOd + 8} mm.</span></div>
            <div className="flex"><span className="w-32">P.C.Cylinedr</span> <span className="text-right flex-1">{outputs.lvOd + 8} x {outputs.lvOd + 12}</span></div>
            <div className="flex"><span className="w-32">Oil Duct</span> <span className="text-right flex-1">{outputs.lvOd + 12} x {outputs.hvId}</span></div>
            <div className="flex"><span className="w-32">H.V I.D</span> <span className="text-right flex-1">{outputs.hvId} mm.</span></div>
            <div className="flex"><span className="w-32">H.V O.D</span> <span className="text-right flex-1">{outputs.hvOd} mm.</span></div>
            <div className="flex"><span className="w-32">Original Cond</span> <span className="text-right flex-1">[ {outputs.hvCondWidth} x {outputs.hvCondThick} ] 1 BARE</span></div>
            <div className="flex"><span className="w-32">Tapping Cond.</span> <span className="text-right flex-1">[ {outputs.hvCondWidth} x {outputs.hvCondThick} ] 4 BARE</span></div>
            
            <div className="mt-4 border-t-2 border-black pt-2">
              <div className="border-4 border-black bg-white inline-block px-1 mb-1 underline">Turns Distribution :-</div>
              <div className="pl-6 font-bold space-y-1">
                {outputs.turnsDistribution?.map((dist, i) => (
                  <div key={i} className="flex"><span className="w-48">{dist.label}</span><span>= {dist.total}</span></div>
                ))}
                <div className="flex border-4 border-black w-max px-1 bg-white mt-1">
                  <span className="w-32 underline">Total Turns =</span><span className="underline ml-4">{outputs.totalHvTurnsDisplay}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 border-t-2 border-black pt-2">
              <div className="border-4 border-black bg-white inline-block px-1 mb-1 underline">Spacer Distribution :-</div>
              <div className="pl-6 font-bold space-y-1">
                {outputs.spacerDistribution?.map((dist, i) => (
                  <div key={i} className="flex"><span className="w-56">{dist.label}</span> <span>{dist.total}</span></div>
                ))}
                <div className="flex w-64 justify-end border-t-2 border-black pt-1">
                  <span className="border-4 border-black px-2 bg-white underline">{outputs.totalSpacerThickness}</span>
                </div>
              </div>
            </div>
            
            <div className="flex border-2 border-black bg-white w-max mt-4">
              <div className="px-2 py-1 border-r-2 border-black w-32 underline">H.V Axial</div>
              <div className="px-2 py-1 w-24 text-right underline">{outputs.hvAxial} mm.</div>
            </div>
            
            <div className="flex border-2 border-black bg-white w-max mt-2">
              <div className="px-2 py-1 border-r-2 border-black w-32 underline">H.V E Clearance</div>
              <div className="px-2 py-1 w-24 text-right underline">30 mm.</div>
            </div>
          </div>
        </div>

        {/* DIAGRAMS AND BOTTOM INFO */}
        <div className="flex justify-between items-start mt-8 mb-8">
          
          {/* LV Diagram */}
          <div className="relative w-[350px]">
             <div className="flex items-center">
               <div className="relative flex items-center justify-center">
                 <div className="absolute left-[-20px] h-full flex flex-col justify-between items-center">
                   <div className="border-t-2 border-black w-4"></div>
                   <div className="border-l-2 border-black h-full absolute left-2"></div>
                   <div className="bg-white py-1 text-sm relative z-10">{outputs.lvAxial}</div>
                   <div className="border-b-2 border-black w-4"></div>
                 </div>
                 <div className="w-16 border-2 border-black h-64 bg-white relative flex items-center justify-center ml-2">
                    <svg viewBox="0 0 100 100" className="w-full h-24">
                      <ellipse cx="50" cy="30" rx="40" ry="10" fill="none" stroke="black" strokeWidth="2"/>
                      <ellipse cx="50" cy="70" rx="40" ry="10" fill="none" stroke="black" strokeWidth="2"/>
                      <line x1="10" y1="30" x2="10" y2="70" stroke="black" strokeWidth="2"/>
                      <line x1="90" y1="30" x2="90" y2="70" stroke="black" strokeWidth="2"/>
                    </svg>
                 </div>
               </div>
               
               <div className="ml-8 relative">
                 <div className="h-64 flex flex-col justify-between absolute -left-6 items-end">
                   <div className="text-sm border-t-2 border-black w-4 -mr-4">
                     <span className="relative -top-2 left-4 bg-white px-1">0</span>
                   </div>
                   <div className="flex items-center relative">
                     <span className="bg-white px-1 absolute right-6 text-sm">{Math.round((outputs.lvAxial || 0) * 0.88)}</span>
                     <svg width="40" height="20" className="absolute right-1 top-2" style={{overflow:'visible'}}>
                        <path d="M 0 10 Q 15 10 15 0" fill="none" stroke="black" strokeWidth="1" />
                        <polygon points="12,3 15,0 18,3" fill="black" />
                     </svg>
                   </div>
                   <div className="text-sm border-b-2 border-black w-4 -mr-4">
                     <span className="relative top-0 left-4 bg-white px-1">{Math.round((outputs.lvAxial || 0) * 0.11)}</span>
                   </div>
                 </div>
                 <div className="border-4 border-black bg-white px-2 py-1 ml-10 text-xs font-bold leading-tight w-max">
                   <div className="underline">Transposition 1 No.</div>
                   <div className="underline">Very Important on</div>
                   <div className="underline">on Both Layers.</div>
                 </div>
               </div>
             </div>
             
             {outputs.tapPositions ? (
               <div className="border-2 border-black bg-white mt-4 p-1 w-[400px]">
                 <div className="font-bold">Taps at :- 0 -- {Math.round((outputs.hvTurns || 0) * 0.41)} (Break)</div>
                 <div className="font-bold text-sm leading-tight break-words">
                   {outputs.tapStepsList?.join(' -- ')}
                 </div>
                 <div className="font-bold mt-1">-- {outputs.hvTurns} (Finish).</div>
               </div>
             ) : (
               <div className="border-2 border-black bg-white mt-4 p-1 w-[400px]">
                 <div className="font-bold">No Tappings</div>
                 <div className="font-bold mt-1">0 -- {outputs.hvTurns} (Finish).</div>
               </div>
             )}
          </div>
          
          {/* HV Diagram */}
          <div className="relative mr-8">
             <div className="w-48 h-64 border-2 border-black bg-white relative mx-auto">
               <div className="absolute inset-4 border-2 border-black"></div>
               <div className="absolute top-0 left-1/2 h-full border-l border-black"></div>
             </div>
             <div className="absolute -top-6 w-full flex justify-center items-center">
               <div className="border-l-2 border-black h-4"></div>
               <div className="border-t-2 border-black w-16"></div>
               <div className="bg-white px-1 relative -top-3 text-xs">{outputs.lvAxial}</div>
               <div className="border-t-2 border-black w-16"></div>
               <div className="border-r-2 border-black h-4"></div>
             </div>
             
             <div className="absolute top-1/2 -right-12 flex items-center h-full transform -translate-y-1/2">
                <div className="bg-white py-1 text-xs relative z-10 pr-2">{outputs.lvAxial + 20}</div>
                <div className="absolute right-8 h-full flex flex-col justify-between items-center w-4">
                   <div className="border-t-2 border-black w-full"></div>
                   <div className="border-l-2 border-black h-full absolute right-2"></div>
                   <div className="border-b-2 border-black w-full"></div>
                </div>
             </div>
          </div>
        </div>

        {/* BOTTOM WEIGHTS AND NOTES */}
        <div className="flex justify-between items-end mt-8 border-b-2 border-black pb-2">
          <div className="flex border-4 border-black w-max bg-white font-bold text-sm h-max">
            <div className="px-2 py-1 border-r-4 border-black underline">L.T Covered Weight =</div>
            <div className="px-4 py-1 border-r-4 border-black text-center">{Math.round((outputs.copperWeight || 0) * 0.45)}</div>
            <div className="px-2 py-1 underline">Kg.</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex border-4 border-black bg-white font-bold text-sm w-max">
              <div className="px-2 py-1 border-r-4 border-black w-48 underline">H.T Covered Weight =</div>
              <div className="px-2 py-1 border-r-4 border-black w-16 text-center">{Math.round((outputs.copperWeight || 0) * 0.55)}</div>
              <div className="px-2 py-1 underline">Kg.</div>
            </div>
            <div className="flex border-4 border-black bg-white font-bold text-sm w-max">
              <div className="px-2 py-1 border-r-4 border-black w-48 underline">H.T Cov Tap Weight =</div>
              <div className="px-2 py-1 border-r-4 border-black w-16 text-center">110</div>
              <div className="px-2 py-1 underline">Kg.</div>
            </div>
          </div>
        </div>

        <div className="mt-2 text-sm font-bold pl-2 pb-8">
          <div className="underline mb-1">NOTES:-</div>
          <div className="underline mb-2">Very Imp:- Use only EC Grade Copper</div>
          <div className="bg-yellow-100 inline-block px-1 underline mb-2 w-max">
            LT Covering Should not be less than 0.44-0.45 mm Imported paper.
          </div>
          <br/>
          <div className="bg-yellow-100 inline-block px-1 underline mb-2 w-max">
            HT Covering Should be 0.34 - 0.35 mm thk TPC Imported covering.
          </div>
          <div className="underline mb-2">
            Pie Shape Phanti should not be less than 75 x 8 mm thk
          </div>
          <div className="underline">
            The Core shall be earthed through tinned copper earthing plate bolted on core frame channels.
          </div>
        </div>

      </div>
    </div>
  );
}
