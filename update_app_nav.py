import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { FolderOpen } from 'lucide-react';", "import { FolderOpen, Database } from 'lucide-react';\nimport { DatabaseManager } from './components/db/DatabaseManager';")

# Add state
content = content.replace("const [currentDocId, setCurrentDocId] = useState<string | null>(null);", "const [currentDocId, setCurrentDocId] = useState<string | null>(null);\n  const [mainView, setMainView] = useState<'designer' | 'database'>('designer');")

# Add button to header
header_buttons_old = """          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjectsModal(true)}"""

header_buttons_new = """          <div className="flex items-center gap-2">
            <button
              onClick={() => setMainView(mainView === 'designer' ? 'database' : 'designer')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${mainView === 'database' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <Database className="w-4 h-4" />
              {mainView === 'designer' ? 'Company Database' : 'Back to Designer'}
            </button>
            <button
              onClick={() => setShowProjectsModal(true)}"""
content = content.replace(header_buttons_old, header_buttons_new)

# Wrap designer in conditional
main_content_old = """      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="xl:col-span-3">
            <div className="sticky top-24">
              <TransformerForm inputs={inputs} onChange={handleInputChange} />
            </div>
          </div>
          
          {/* Right Column: Results */}
          <div className="xl:col-span-9 space-y-6">
            <ResultsDisplay outputs={outputs} inputs={inputs} />
          </div>
        </div>
      </main>"""

main_content_new = """      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mainView === 'designer' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Column: Form */}
            <div className="xl:col-span-3">
              <div className="sticky top-24">
                <TransformerForm inputs={inputs} onChange={handleInputChange} />
              </div>
            </div>
            
            {/* Right Column: Results */}
            <div className="xl:col-span-9 space-y-6">
              <ResultsDisplay outputs={outputs} inputs={inputs} />
            </div>
          </div>
        ) : (
          <DatabaseManager />
        )}
      </main>"""
content = content.replace(main_content_old, main_content_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
