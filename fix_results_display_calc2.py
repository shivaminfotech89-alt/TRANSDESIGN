import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Add extra rows to calculations tab
table1 = """                      <tr><td className="py-2 text-slate-600">Turns Ratio</td><td className="py-2 text-right font-mono font-medium">{outputs.ratio.toFixed(3)}</td></tr>
                      <tr><td className="py-2 text-slate-600">Core Stack Steps</td><td className="py-2 text-right font-mono font-medium">{outputs.coreSteps.length} Steps</td></tr>
                      <tr><td className="py-2 text-slate-600">H-L Clearance</td><td className="py-2 text-right font-mono font-medium">{outputs.hiloGap} mm</td></tr>
                      <tr><td className="py-2 text-slate-600">Mean Length of Turn</td><td className="py-2 text-right font-mono font-medium">{(outputs.coreDia + 100).toFixed(0)} mm (Approx)</td></tr>
"""

content = content.replace("                      <tr><td className=\"py-2 text-slate-600\">Turns Ratio</td><td className=\"py-2 text-right font-mono font-medium\">{outputs.ratio.toFixed(3)}</td></tr>\n", table1)

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
