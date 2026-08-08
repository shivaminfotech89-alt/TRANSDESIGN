import re

with open('src/components/TransformerForm.tsx', 'r') as f:
    content = f.read()

# Add field to form
form_original = """        <SectionHeader id="rating" title="Rating & Voltages" icon={Zap} />
        {expandedSection === 'rating' && (
          <div className="p-4 space-y-4">"""

form_new = """        <SectionHeader id="rating" title="Rating & Voltages" icon={Zap} />
        {expandedSection === 'rating' && (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Project Name</label>
              <input type="text" name="projectName" value={inputs.projectName || ''} onChange={handleChange}
                className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>"""
content = content.replace(form_original, form_new)

with open('src/components/TransformerForm.tsx', 'w') as f:
    f.write(content)
