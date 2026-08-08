import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Update tabs state and header
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'overview' | 'winding' | 'core' | 'bom'>('overview');",
    "const [activeTab, setActiveTab] = useState<'overview' | 'calculations' | 'winding' | 'core' | 'bom'>('overview');"
)

tabs_html = """            <button onClick={() => setActiveTab('overview')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>Overview</button>
            <button onClick={() => setActiveTab('calculations')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'calculations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>Calculations</button>
            <button onClick={() => setActiveTab('winding')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'winding' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>Winding Design</button>"""
content = content.replace(
    """            <button onClick={() => setActiveTab('overview')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>Overview</button>
            <button onClick={() => setActiveTab('winding')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'winding' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>Winding Design</button>""",
    tabs_html
)

# Add projectName header to main ResultsDisplay component
project_header = """          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">{inputs.cooling}</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">{inputs.phases === 3 ? '3-PHASE' : '1-PHASE'}</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {inputs.kVA} kVA Transformer
              </h2>
              <div className="text-slate-500 font-medium mt-1">
                {inputs.projectName || 'Untitled Design'}
              </div>
            </div>"""

content = content.replace(
    """          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">{inputs.cooling}</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">{inputs.phases === 3 ? '3-PHASE' : '1-PHASE'}</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {inputs.kVA} kVA Transformer
              </h2>
            </div>""",
    project_header
)

calc_tab = """          {/* CALCULATIONS TAB */}
          <div className={`${activeTab === 'calculations' ? 'block' : 'hidden'} print:block space-y-6`}>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Engineering Calculations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 bg-slate-50 p-2 rounded">Electrical & Core</h4>
                  <table className="w-full text-sm">
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
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 bg-slate-50 p-2 rounded">Currents & Winding</h4>
                  <table className="w-full text-sm">
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
                  </table>
                </div>
              </div>
            </div>
          </div>
"""

content = content.replace("          {/* CORE TAB */}", calc_tab + "\n          {/* CORE TAB */}")

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
