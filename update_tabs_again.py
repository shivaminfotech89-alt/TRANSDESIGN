with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Update useState
content = content.replace(
    'useState<\n    | "overview"\n    | "calculations"\n    | "winding"\n    | "core"\n    | "bom"\n  >("overview");',
    'useState<\n    | "overview"\n    | "calculations"\n    | "winding"\n    | "core"\n    | "bom"\n    | "reports"\n  >("overview");'
)

# Update the buttons
nav_old = """            <button
              onClick={() => setActiveTab("core")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "core" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              Core Parts
            </button>
          </div>"""

nav_new = """            <button
              onClick={() => setActiveTab("core")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "core" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              Core Parts
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors ${activeTab === "reports" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-emerald-900"}`}
            >
              Reports & Docs
            </button>
          </div>"""
content = content.replace(nav_old, nav_new)

# Update the rendering logic
render_old = """          {/* BOM TAB */}
          <div
            className={`${activeTab === "bom" ? "block" : "hidden"} print:block space-y-6`}
          >"""

render_new = """          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ReportsManager inputs={inputs} outputs={outputs} />
            </div>
          )}

          {/* BOM TAB */}
          <div
            className={`${activeTab === "bom" ? "block" : "hidden"} print:block space-y-6`}
          >"""
content = content.replace(render_old, render_new)

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
