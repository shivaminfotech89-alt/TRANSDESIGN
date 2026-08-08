import re

with open('src/components/NewProjectModal.tsx', 'r') as f:
    content = f.read()

# Add state
content = content.replace("  const [kVA, setKVA] = useState(1000);", "  const [projectName, setProjectName] = useState('New Transformer');\n  const [kVA, setKVA] = useState(1000);")

# Add to submit
submit_original = """    onStart({
      kVA,"""
submit_new = """    onStart({
      projectName,
      kVA,"""
content = content.replace(submit_original, submit_new)

# Add field to form
form_original = """            {/* Primary Inputs */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">1. Core Requirements</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">"""

form_new = """            {/* Primary Inputs */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">1. Core Requirements</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-1.5 md:col-span-6">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Project Name</label>
                  <input type="text" required value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. 1000kVA Distribution Transformer"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
                </div>"""
content = content.replace(form_original, form_new)

with open('src/components/NewProjectModal.tsx', 'w') as f:
    f.write(content)
