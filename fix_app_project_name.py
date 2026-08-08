import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Default inputs
content = content.replace("    kVA: 1000,", "    projectName: 'Untitled Design',\n    kVA: 1000,")

# Header Title Update
header_original = '''            <h1 className="text-sm font-bold tracking-tight text-slate-900">
              TransDesign Engine <span className="text-blue-600 font-mono ml-1">v4.02</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Professional Transformer Design & Analysis
            </p>'''

header_new = '''            <h1 className="text-sm font-bold tracking-tight text-slate-900">
              TransDesign Engine <span className="text-blue-600 font-mono ml-1">v4.02</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
              <span>{inputs.projectName || 'Untitled Design'}</span>
              <span className="text-slate-300">|</span>
              <span>Professional Transformer Design & Analysis</span>
            </p>'''
content = content.replace(header_original, header_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
