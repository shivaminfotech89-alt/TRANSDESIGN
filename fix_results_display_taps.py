import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Add validation warnings box at the top
header_end = """              <div className="text-slate-500 font-medium mt-1">
                {inputs.projectName || 'Untitled Design'}
              </div>
            </div>"""

warnings_box = """              <div className="text-slate-500 font-medium mt-1">
                {inputs.projectName || 'Untitled Design'}
              </div>
            </div>
          </div>
          
          {outputs.validationWarnings && outputs.validationWarnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 print:hidden">
              <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Design Constraints Alert
              </h4>
              <ul className="list-disc pl-5 text-xs text-red-700 space-y-1">
                {outputs.validationWarnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}"""

content = content.replace(header_end + "\n          </div>", warnings_box)

# Add tap data to calculations table
table2_end = """                      <tr><td className="py-2 px-2 text-slate-600">Impedance</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">%Z + (Wc / (kVA×10)) (Est.)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.impedance.toFixed(3)} %</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">No-Load Loss</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Core Wt × Sp. Loss</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.noLoadLosses} W</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Load Loss</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">I²R + Stray (Target)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.loadLosses} W</td></tr>
                    </tbody>
                  </table>"""

table2_new = """                      <tr><td className="py-2 px-2 text-slate-600">Impedance</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">%Z + (Wc / (kVA×10)) (Est.)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.impedance.toFixed(3)} %</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">No-Load Loss</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Core Wt × Sp. Loss</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.noLoadLosses} W</td></tr>
                      <tr><td className="py-2 px-2 text-slate-600">Load Loss</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">I²R + Stray (Target)</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.loadLosses} W</td></tr>
                      {outputs.tapPositions ? (
                        <>
                          <tr><td className="py-2 px-2 text-slate-600">Tap Positions</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">Calculated</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.tapPositions}</td></tr>
                          <tr><td className="py-2 px-2 text-slate-600">Turns Per Step</td><td className="py-2 px-2 text-slate-400 font-mono text-xs hidden lg:table-cell">HV Turns × %Step</td><td className="py-2 px-2 text-right font-mono font-medium">{outputs.turnsPerStep?.toFixed(1)}</td></tr>
                        </>
                      ) : null}
                    </tbody>
                  </table>"""

content = content.replace(table2_end, table2_new)

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
