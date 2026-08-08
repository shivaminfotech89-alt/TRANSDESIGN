import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace("import { Zap, Activity } from 'lucide-react';", "import { Zap, Activity, Plus } from 'lucide-react';\nimport { NewProjectModal } from './components/NewProjectModal';")

# Add state
content = content.replace("  const [inputs, setInputs] = useState<TransformerInputs>({", "  const [showNewModal, setShowNewModal] = useState(false);\n  const [inputs, setInputs] = useState<TransformerInputs>({")

# Add button
header_content = """          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-600 font-semibold">SYSTEM READY</span>
          </div>"""
          
new_header_content = """          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-bold text-xs transition-colors border border-blue-200 shadow-sm mr-2">
            <Plus className="w-4 h-4" /> NEW PROJECT
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-600 font-semibold">SYSTEM READY</span>
          </div>"""

content = content.replace(header_content, new_header_content)

# Add modal to return
content = content.replace("      </main>\n    </div>", "      </main>\n      {showNewModal && (\n        <NewProjectModal \n          onClose={() => setShowNewModal(false)} \n          onStart={(newInputs) => { setInputs(prev => ({...prev, ...newInputs})); setShowNewModal(false); }}\n        />\n      )}\n    </div>")

with open('src/App.tsx', 'w') as f:
    f.write(content)
