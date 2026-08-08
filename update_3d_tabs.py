with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Update useState
content = content.replace(
    'useState<\n    "overview" | "calculations" | "winding" | "core" | "bom" | "reports"\n  >("overview");',
    'useState<\n    "overview" | "calculations" | "winding" | "core" | "bom" | "reports" | "3d-model"\n  >("overview");'
)
content = content.replace(
    'useState<"overview" | "calculations" | "winding" | "core" | "bom" | "reports">("overview");',
    'useState<"overview" | "calculations" | "winding" | "core" | "bom" | "reports" | "3d-model">("overview");'
)

# Update the buttons
nav_old = """            <button
              onClick={() => setActiveTab("reports")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "reports" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-emerald-900"}`}
            >
              Reports & Docs
            </button>
          </div>"""

nav_new = """            <button
              onClick={() => setActiveTab("reports")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "reports" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-emerald-900"}`}
            >
              Reports & Docs
            </button>
            <button
              onClick={() => setActiveTab("3d-model")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "3d-model" ? "text-purple-600 border-b-2 border-purple-600" : "text-slate-500 hover:text-purple-900"}`}
            >
              3D CAD Model
            </button>
          </div>"""
content = content.replace(nav_old, nav_new)

# Update the rendering logic
render_old = """          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ReportsManager inputs={inputs} outputs={outputs} />
            </div>
          )}"""

render_new = """          {/* 3D CAD MODEL TAB */}
          {activeTab === "3d-model" && (
            <div className="space-y-6 animate-in fade-in duration-300 print:hidden h-[800px]">
              <CadViewerTab inputs={inputs} outputs={outputs} />
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ReportsManager inputs={inputs} outputs={outputs} />
            </div>
          )}"""
content = content.replace(render_old, render_new)

imports_old = 'import { ReportsManager } from "./reports/ReportsManager";'
imports_new = 'import { ReportsManager } from "./reports/ReportsManager";\nimport { CadViewerTab } from "./cad/CadViewerTab";'
content = content.replace(imports_old, imports_new)

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
