import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

# Add tap steps array
tap_logic_old = """    let tapPositions = 0;
    let turnsPerStep = 0;
    if (inputs.tapChanger && inputs.tapChanger !== 'None') {
      const step = inputs.tapStepVariation || 2.5;
      const above = inputs.tapRangeAbove || 5.0;
      const below = inputs.tapRangeBelow || 5.0;
      tapPositions = Math.round(above / step) + Math.round(below / step) + 1;
      turnsPerStep = Number((hvTurns * (step / 100)).toFixed(2));
    }"""

tap_logic_new = """    let tapPositions = 0;
    let turnsPerStep = 0;
    let tapStepsList: number[] = [];
    if (inputs.tapChanger && inputs.tapChanger !== 'None') {
      const step = inputs.tapStepVariation || 2.5;
      const above = inputs.tapRangeAbove || 5.0;
      const below = inputs.tapRangeBelow || 5.0;
      tapPositions = Math.round(above / step) + Math.round(below / step) + 1;
      turnsPerStep = Number((hvTurns * (step / 100)).toFixed(2));
      
      const nominalTapTurns = hvTurns - Math.round(hvTurns * (above / 100));
      for (let i = 0; i < tapPositions; i++) {
        tapStepsList.push(Math.round(nominalTapTurns + (i * turnsPerStep)));
      }
    }"""
content = content.replace(tap_logic_old, tap_logic_new)

# Add to type
content = content.replace("turnsPerStep, validationWarnings", "turnsPerStep, validationWarnings, tapStepsList")

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)

# Update types
with open('src/types.ts', 'r') as f:
    types = f.read()
types = types.replace("turnsPerStep?: number;", "turnsPerStep?: number;\n  tapStepsList?: number[];")
with open('src/types.ts', 'w') as f:
    f.write(types)

# Update UI
with open('src/components/WindingDesignTab.tsx', 'r') as f:
    ui = f.read()

ui_taps_old = """             <div className="border-2 border-black bg-white mt-4 p-1 w-[400px]">
               <div className="font-bold">Taps at :- 0 -- {Math.round((outputs.hvTurns || 0) * 0.41)} (Break)</div>
               <div className="font-bold">258 -- 265 -- 272 -- 279 -- 286 -- 293 -- 300 -- 307 -- 314 -- 321</div>
               <div className="font-bold">-- 328 -- 335 -- 342 -- 349 -- 356 -- 363 -- 370 -- {outputs.hvTurns} (Finish).</div>
             </div>"""

ui_taps_new = """             {outputs.tapPositions ? (
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
             )}"""
             
ui = ui.replace(ui_taps_old, ui_taps_new)

header_tap = """             Taps at:- +10 % to - 10 % @ 1.25 %
           </div>
           <div className="font-bold border-2 border-black px-4 bg-white inline-block mx-auto mb-1 text-base">OLTC</div>"""

header_tap_new = """             {inputs.tapChanger && inputs.tapChanger !== 'None' ? `Taps at:- +${inputs.tapRangeAbove}% to -${inputs.tapRangeBelow}% @ ${inputs.tapStepVariation}%` : 'No Taps'}
           </div>
           <div className="font-bold border-2 border-black px-4 bg-white inline-block mx-auto mb-1 text-base">{inputs.tapChanger || 'OCTC'}</div>"""
ui = ui.replace(header_tap, header_tap_new)

with open('src/components/WindingDesignTab.tsx', 'w') as f:
    f.write(ui)
