import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen, Trash2, LogOut, LogIn } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { TransformerInputs } from '../types';

interface ProjectsModalProps {
  onClose: () => void;
  currentInputs: TransformerInputs;
  onLoadProject: (inputs: TransformerInputs, docId: string) => void;
  currentDocId: string | null;
  onSaveComplete: (docId: string) => void;
}

export function ProjectsModal({ onClose, currentInputs, onLoadProject, currentDocId, onSaveComplete }: ProjectsModalProps) {
  const { user, signIn, logOut } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState(currentInputs.projectName || 'Untitled Design');

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      projs.sort((a: any, b: any) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());
      setProjects(projs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async (isNew: boolean) => {
    if (!user) return;
    setLoading(true);
    try {
      const projectData = {
        userId: user.uid,
        projectName: saveName,
        kVA: currentInputs.kVA,
        hvVoltage: currentInputs.hvVoltage,
        lvVoltage: currentInputs.lvVoltage,
        phases: currentInputs.phases,
        conductor: currentInputs.conductor,
        referenceStandard: currentInputs.referenceStandard,
        cooling: currentInputs.cooling,
        tapChanger: currentInputs.tapChanger || 'OCTC',
        tapRangeAbove: currentInputs.tapRangeAbove || 5.0,
        tapRangeBelow: currentInputs.tapRangeBelow || 5.0,
        tapStepVariation: currentInputs.tapStepVariation || 2.5,
        targetImpedance: currentInputs.targetImpedance,
        targetLoadLoss: currentInputs.targetLoadLoss,
        targetNoLoadLoss: currentInputs.targetNoLoadLoss,
        maxFluxDensity: currentInputs.maxFluxDensity,
        maxCurrentDensityHv: currentInputs.maxCurrentDensityHv,
        maxCurrentDensityLv: currentInputs.maxCurrentDensityLv,
        updatedAt: serverTimestamp()
      };

      if (!isNew && currentDocId) {
        await updateDoc(doc(db, 'projects', currentDocId), projectData);
        onSaveComplete(currentDocId);
      } else {
        const docRef = await addDoc(collection(db, 'projects'), {
          ...projectData,
          createdAt: serverTimestamp()
        });
        onSaveComplete(docRef.id);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error saving project');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'projects', id));
      await loadProjects();
      if (id === currentDocId) {
        onSaveComplete(''); // Clear current doc id
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Project Manager</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!user ? (
            <div className="text-center py-12 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Sign in to save projects</h3>
              <p className="text-sm text-slate-500">Save your transformer designs to the cloud and access them anywhere.</p>
              <button onClick={signIn} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 mx-auto">
                <LogIn className="w-4 h-4" /> Sign In with Google
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Current Project Name</label>
                  <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} 
                    className="border border-slate-300 rounded p-2 text-sm w-64" />
                </div>
                <div className="flex gap-2">
                  {currentDocId && (
                    <button disabled={loading} onClick={() => handleSave(false)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold text-sm rounded hover:bg-blue-200 flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  )}
                  <button disabled={loading} onClick={() => handleSave(true)} className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded hover:bg-blue-700 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save As New
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Your Saved Projects</h3>
                {loading && <div className="text-sm text-slate-500">Loading...</div>}
                {!loading && projects.length === 0 && <div className="text-sm text-slate-500 italic">No saved projects found.</div>}
                
                <div className="space-y-2">
                  {projects.map(p => (
                    <div key={p.id} className={`flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors ${p.id === currentDocId ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'}`}>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {p.projectName}
                          {p.id === currentDocId && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Current</span>}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {p.kVA}kVA • {p.hvVoltage}/{p.lvVoltage}V • {p.conductor}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          onLoadProject(p as unknown as TransformerInputs, p.id);
                          onClose();
                        }} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-50">
                          Load
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <div className="text-xs text-slate-500">Signed in as {user.email}</div>
                <button onClick={logOut} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium">
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
