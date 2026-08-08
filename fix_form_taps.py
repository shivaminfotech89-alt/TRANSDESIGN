import re

with open('src/components/TransformerForm.tsx', 'r') as f:
    content = f.read()

tap_old = """            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Tap Changer Requirements</label>
              <select name="tapChanger" value={inputs.tapChanger || 'OCTC'} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="None">No Tappings</option>
                <option value="OCTC">OCTC (Off-Circuit Tap Changer)</option>
                <option value="OLTC">OLTC (On-Load Tap Changer)</option>
              </select>
            </div>"""

tap_new = """            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Tap Changer</label>
              <select name="tapChanger" value={inputs.tapChanger || 'OCTC'} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="None">No Tappings</option>
                <option value="OCTC">OCTC (Off-circuit tap changer)</option>
                <option value="OLTC">OLTC (On-load tap changer)</option>
              </select>
            </div>
            {inputs.tapChanger && inputs.tapChanger !== 'None' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-600 uppercase">Above Normal (%)</label>
                  <input type="number" step="0.5" name="tapRangeAbove" value={inputs.tapRangeAbove || 5.0} onChange={handleChange}
                    className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-md shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-600 uppercase">Below Normal (%)</label>
                  <input type="number" step="0.5" name="tapRangeBelow" value={inputs.tapRangeBelow || 5.0} onChange={handleChange}
                    className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-md shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-600 uppercase">Step Var (%)</label>
                  <input type="number" step="0.5" name="tapStepVariation" value={inputs.tapStepVariation || 2.5} onChange={handleChange}
                    className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-md shadow-sm" />
                </div>
              </div>
            )}"""

content = content.replace(tap_old, tap_new)

with open('src/components/TransformerForm.tsx', 'w') as f:
    f.write(content)
