import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Replace Calculations table
old_table = """                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="py-2 text-slate-600">kVA / Phase</td><td className="py-2 text-right font-mono font-medium">{outputs.sPhase.toFixed(2)}</td></tr>
                      <tr><td className="py-2 text-slate-600">Voltage Per Turn (Et)</td><td className="py-2 text-right font-mono font-medium">{outputs.et.toFixed(4)} V</td></tr>
                      <tr><td className="py-2 text-slate-600">K Factor</td><td className="py-2 text-right font-mono font-medium">{outputs.kFactor.toFixed(3)}</td></tr>
                      <tr><td className="py-2 text-slate-600">Flux Density (Bm)</td><td className="py-2 text-right font-mono font-medium">{outputs.bm.toFixed(3)} T</td></tr>
                      <tr><td className="py-2 text-slate-600">Net Iron Area (Ai)</td><td className="py-2 text-right font-mono font-medium">{(outputs.ai * 10000).toFixed(2)} cm²</td></tr>
                      <tr><td className="py-2 text-slate-600">Gross Iron Area (Ag)</td><td className="py-2 text-right font-mono font-medium">{(outputs.ag * 10000).toFixed(2)} cm²</td></tr>
                      <tr><td className="py-2 text-slate-600">Core Diameter</td><td className="py-2 text-right font-mono font-medium">{outputs.coreDia.toFixed(1)} mm</td></tr>
                      <tr><td className="py-2 text-slate-600">HV Phase Voltage</td><td className="py-2 text-right font-mono font-medium">{outputs.hvPhaseVoltage.toFixed(1)} V</td></tr>
                      <tr><td className="py-2 text-slate-600">LV Phase Voltage</td><td className="py-2 text-right font-mono font-medium">{outputs.lvPhaseVoltage.toFixed(1)} V</td></tr>
                      <tr><td className="py-2 text-slate-600">Turns Ratio</td><td className="py-2 text-right font-mono font-medium">{outputs.ratio.toFixed(3)}</td></tr>
                      <tr><td className="py-2 text-slate-600">Core Stack Steps</td><td className="py-2 text-right font-mono font-medium">{outputs.coreSteps.length} Steps</td></tr>
                      <tr><td className="py-2 text-slate-600">H-L Clearance</td><td className="py-2 text-right font-mono font-medium">{outputs.hiloGap} mm</td></tr>
                      <tr><td className="py-2 text-slate-600">Mean Length of Turn</td><td className="py-2 text-right font-mono font-medium">{(outputs.coreDia + 100).toFixed(0)} mm (Approx)</td></tr>
                    </tbody>
                  </table>"""

new_table = """                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-[10px] uppercase text-slate-500">
                      <tr><th className="py-1 px-2 text-left">Parameter</th><th className="py-1 px-2 text-left hidden lg:table-cell">Equation</th><th className="py-1 px-2 text-right">Value</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="py-2 px-2 text-slate-600">kVA / Phase (Q)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Total kVA / Phases</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.sPhase.toFixed(2)}</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Voltage Per Turn (Et)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">K × √(Q)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.et.toFixed(4)} V</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">K Factor</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Constant</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.kFactor.toFixed(3)}</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Flux Density (Bm)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Target Limit</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.bm.toFixed(3)} T</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Net Iron Area (Ai)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Et / (4.44 × f × Bm)</td><td className="py-2 px-2 text-right font-mono font-medium">{(outputs.ai * 10000).toFixed(2)} cm²</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Gross Iron Area (Ag)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Ai / Stacking Factor</td><td className="py-2 px-2 text-right font-mono font-medium">{(outputs.ag * 10000).toFixed(2)} cm²</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Core Diameter</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">√((4 × Ag) / (π × Ks))</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.coreDia.toFixed(1)} mm</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">HV Phase Voltage</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">HV / (√3 if 3-ph)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.hvPhaseVoltage.toFixed(1)} V</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">LV Phase Voltage</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">LV / (√3 if 3-ph)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.lvPhaseVoltage.toFixed(1)} V</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Turns Ratio</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">HV / LV</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.ratio.toFixed(3)}</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Core Stack Steps</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Algorithm</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.coreSteps.length}</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">H-L Clearance</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">BIL dependent</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.hiloGap} mm</td></tr>
                    </tbody>
                  </table>"""
content = content.replace(old_table, new_table)

old_table_2 = """                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="py-2 text-slate-600">HV Phase Current</td><td className="py-2 text-right font-mono font-medium">{outputs.hvPhaseCurrent.toFixed(2)} A</td></tr>
                      <tr><td className="py-2 text-slate-600">LV Phase Current</td><td className="py-2 text-right font-mono font-medium">{outputs.lvPhaseCurrent.toFixed(2)} A</td></tr>
                      <tr><td className="py-2 text-slate-600">Current Density</td><td className="py-2 text-right font-mono font-medium">{outputs.currentDensity.toFixed(3)} A/mm²</td></tr>
                      <tr><td className="py-2 text-slate-600">HV Area</td><td className="py-2 text-right font-mono font-medium">{outputs.hvArea.toFixed(2)} mm²</td></tr>
                      <tr><td className="py-2 text-slate-600">LV Area</td><td className="py-2 text-right font-mono font-medium">{outputs.lvArea.toFixed(2)} mm²</td></tr>
                      <tr><td className="py-2 text-slate-600">HV Turns (Tap)</td><td className="py-2 text-right font-mono font-medium">{outputs.hvTurns}</td></tr>
                      <tr><td className="py-2 text-slate-600">LV Turns</td><td className="py-2 text-right font-mono font-medium">{outputs.lvTurns}</td></tr>
                      <tr><td className="py-2 text-slate-600">Impedance</td><td className="py-2 text-right font-mono font-medium">{outputs.impedance.toFixed(3)} %</td></tr>
                      <tr><td className="py-2 text-slate-600">No-Load Loss</td><td className="py-2 text-right font-mono font-medium">{outputs.noLoadLosses} W</td></tr>
                      <tr><td className="py-2 text-slate-600">Load Loss</td><td className="py-2 text-right font-mono font-medium">{outputs.loadLosses} W</td></tr>
                    </tbody>
                  </table>"""

new_table_2 = """                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-[10px] uppercase text-slate-500">
                      <tr><th className="py-1 px-2 text-left">Parameter</th><th className="py-1 px-2 text-left hidden lg:table-cell">Equation</th><th className="py-1 px-2 text-right">Value</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="py-2 px-2 text-slate-600">HV Phase Current</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">kVA / (Phases × HV Phase V)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.hvPhaseCurrent.toFixed(2)} A</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">LV Phase Current</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">kVA / (Phases × LV Phase V)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.lvPhaseCurrent.toFixed(2)} A</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Current Density</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Max Allowed</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.currentDensity.toFixed(3)} A/mm²</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">HV Area</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">HV Current / Density</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.hvArea.toFixed(2)} mm²</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">LV Area</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">LV Current / Density</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.lvArea.toFixed(2)} mm²</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">HV Turns (Tap)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">HV Phase V / Et</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.hvTurns}</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">LV Turns</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">LV Phase V / Et</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.lvTurns}</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Impedance</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">%Z + (Wc / (kVA×10)) (Est.)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.impedance.toFixed(3)} %</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">No-Load Loss</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Core Wt × Sp. Loss</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.noLoadLosses} W</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Load Loss</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">I²R + Stray (Target)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.loadLosses} W</td></tr>
                    </tbody>
                  </table>"""
content = content.replace(old_table_2, new_table_2)

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
