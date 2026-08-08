import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { NewProjectModal } from './components/NewProjectModal';", "import { NewProjectModal } from './components/NewProjectModal';\nimport { ProjectsModal } from './components/ProjectsModal';\nimport { FolderOpen } from 'lucide-react';")

# Add state for modal
content = content.replace("const [showNewProjectModal, setShowNewProjectModal] = useState(true);", "const [showNewProjectModal, setShowNewProjectModal] = useState(true);\n  const [showProjectsModal, setShowProjectsModal] = useState(false);\n  const [currentDocId, setCurrentDocId] = useState<string | null>(null);")

# Update new project modal handler to clear doc id
new_proj_old = """  const handleStartNewProject = (newInputs: any) => {
    setInputs(prev => ({
      ...prev,
      ...newInputs
    }));
    setShowNewProjectModal(false);
  };"""

new_proj_new = """  const handleStartNewProject = (newInputs: any) => {
    setInputs(prev => ({
      ...prev,
      ...newInputs
    }));
    setCurrentDocId(null);
    setShowNewProjectModal(false);
  };"""
content = content.replace(new_proj_old, new_proj_new)

# Add Projects header button
header_old = """          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" />
              New Project
            </button>"""

header_new = """          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjectsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Projects
            </button>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" />
              New Project
            </button>"""
content = content.replace(header_old, header_new)

# Add ProjectsModal render
modal_render = """      {showNewProjectModal && (
        <NewProjectModal 
          onClose={() => setShowNewProjectModal(false)}
          onStart={handleStartNewProject}
        />
      )}
      
      {showProjectsModal && (
        <ProjectsModal
          onClose={() => setShowProjectsModal(false)}
          currentInputs={inputs}
          currentDocId={currentDocId}
          onSaveComplete={(docId) => {
            setCurrentDocId(docId);
            setInputs(prev => ({...prev, projectName: prev.projectName})); // force update
          }}
          onLoadProject={(loadedInputs, docId) => {
            setInputs(loadedInputs);
            setCurrentDocId(docId);
          }}
        />
      )}"""

content = content.replace("""      {showNewProjectModal && (
        <NewProjectModal 
          onClose={() => setShowNewProjectModal(false)}
          onStart={handleStartNewProject}
        />
      )}""", modal_render)

with open('src/App.tsx', 'w') as f:
    f.write(content)
