import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

replacement = """            {/* 3. MESSAGE & STRATEGY */}
            <div className="bg-slate-800 p-6 rounded-xl text-white">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Optimization Summary & Standards Compliance</div>
              <p className="text-sm leading-relaxed mb-3">{outputs.strategyMessage}</p>
              <div className="text-xs bg-slate-700/50 p-3 rounded-lg border border-slate-600/50 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">{outputs.complianceNote}</span>
              </div>
            </div>"""

content = content.replace("""            {/* 3. MESSAGE & STRATEGY */}
            <div className="bg-slate-800 p-6 rounded-xl text-white">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Optimization Summary</div>
              <p className="text-sm leading-relaxed">{outputs.strategyMessage}</p>
            </div>""", replacement)

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
