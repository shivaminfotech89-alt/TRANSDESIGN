import re

with open('src/components/TransformerForm.tsx', 'r') as f:
    content = f.read()

additional_inputs = """
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Vector Group</label>
            <select
              name="vectorGroup"
              value={inputs.vectorGroup || 'Dyn11'}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Dyn11">Dyn11</option>
              <option value="Yyn0">Yyn0</option>
              <option value="YNd11">YNd11</option>
              <option value="Dd0">Dd0</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tank Type</label>
            <select
              name="tankType"
              value={inputs.tankType || 'Radiator & Conservator'}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Radiator & Conservator">Radiator & Conservator</option>
              <option value="Corrugated Fin">Corrugated Fin</option>
              <option value="Sealed Type">Sealed Type</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Core Type</label>
            <select
              name="coreType"
              value={inputs.coreType || 'Step-Lap'}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Step-Lap">Step-Lap (Low Loss)</option>
              <option value="Conventional Mitered">Conventional Mitered</option>
              <option value="EI Core">EI Core (Small)</option>
              <option value="Amorphous">Amorphous Wound</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tap Changer</label>
            <select
              name="tapChanger"
              value={inputs.tapChanger || 'OCTC'}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="None">None</option>
              <option value="OCTC">OCTC (Off-Circuit)</option>
              <option value="OLTC">OLTC (On-Load)</option>
            </select>
          </div>
        </div>
"""

content = content.replace("        <div className=\"space-y-1.5\">\n          <label className=\"text-xs font-semibold text-slate-600 uppercase tracking-wide\">Core Material</label>", additional_inputs + "\n        <div className=\"space-y-1.5\">\n          <label className=\"text-xs font-semibold text-slate-600 uppercase tracking-wide\">Core Material</label>")

with open('src/components/TransformerForm.tsx', 'w') as f:
    f.write(content)
