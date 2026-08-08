import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Add a third table in the calculations tab for the "Overall Dimensions & Thermal"

third_table = """
                  <div className="mt-8">
                    <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">Overall Dimensions & Thermal Checks</h4>
                    <table className="w-full text-sm border-t border-slate-200">
                      <thead className="bg-slate-100 text-[10px] uppercase text-slate-500">
                        <tr><th className="py-1 px-2 text-left">Parameter</th><th className="py-1 px-2 text-left hidden lg:table-cell">Equation</th><th className="py-1 px-2 text-right">Value</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr><td className="py-2 px-2 text-slate-600">Core Stack Height (Window)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">HV Axial + Clearance</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.windowHeight} mm</td></tr>
                        <tr><td className="py-2 px-2 text-slate-600">Limb Center Distance</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Core Dia + HV Radial + Gap</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.limbCenter} mm</td></tr>
                        <tr><td className="py-2 px-2 text-slate-600">Tank Dimensions (L×W×H)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Limb×Phases + Clearances</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.tankDimensions?.length} × {outputs.tankDimensions?.width} × {outputs.tankDimensions?.height} mm</td></tr>
                        <tr><td className="py-2 px-2 text-slate-600">Transformer Oil Required</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">kVA × 2.1 (Approx)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.oilQuantity} L</td></tr>
                        <tr><td className="py-2 px-2 text-slate-600">Tank Empty Weight</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Volume × Factor</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.tankDimensions?.weight} kg</td></tr>
                        <tr><td className="py-2 px-2 text-slate-600">Total Transformer Weight</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Core+Winding+Tank+Oil</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.totalWeight?.toFixed(1)} kg</td></tr>
                        <tr><td className="py-2 px-2 text-slate-600">Temperature Rise (Oil)</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Given limit</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.tempRise} °C</td></tr>
                        <tr><td className="py-2 px-2 text-slate-600">Temperature Gradient</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Winding - Oil Rise</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.tempGradient} °C</td></tr>
                        <tr><td className="py-2 px-2 text-slate-600">Thermal Time Constant</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">(Wt × C) / Losses</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.thermalTimeConstant} Hrs</td></tr>
                      </tbody>
                    </table>
                  </div>
"""

# Let's insert it right after the second table in calculations tab.
# We need to find the end of the second table.
end_of_second_table = """                      ) : null}
                    </tbody>
                  </table>"""

if end_of_second_table in content:
    content = content.replace(end_of_second_table, end_of_second_table + third_table)
else:
    print("Could not find insertion point!")

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
