import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

tabs_old = "const [activeTab, setActiveTab] = useState<'overview' | 'calculations' | 'winding' | 'core' | 'bom'>('overview');"
tabs_new = "const [activeTab, setActiveTab] = useState<'overview' | 'calculations' | 'winding' | 'core' | 'bom' | 'reports'>('overview');"
content = content.replace(tabs_old, tabs_new)

nav_old = """            <button onClick={() => setActiveTab('bom')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'bom' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>BOM & Costing</button>
          </div>"""

nav_new = """            <button onClick={() => setActiveTab('bom')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'bom' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>BOM & Costing</button>
            <button onClick={() => setActiveTab('reports')} className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === 'reports' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-emerald-700'}`}>Reports & Docs</button>
          </div>"""
content = content.replace(nav_old, nav_new)

imports_old = "import { WindingDesignTab } from './WindingDesignTab';"
imports_new = "import { WindingDesignTab } from './WindingDesignTab';\nimport { ReportsManager } from './reports/ReportsManager';"
content = content.replace(imports_old, imports_new)

render_old = """          {/* BOM & Costing Tab */}
          {activeTab === 'bom' && (
            <div className="space-y-6 print-container animate-in fade-in duration-300">"""

render_new = """          {activeTab === 'reports' && (
            <div className="animate-in fade-in duration-300">
              <ReportsManager inputs={inputs} outputs={outputs} />
            </div>
          )}
          
          {/* BOM & Costing Tab */}
          {activeTab === 'bom' && (
            <div className="space-y-6 print-container animate-in fade-in duration-300">"""
content = content.replace(render_old, render_new)


with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
