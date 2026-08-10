import React, { useEffect, useState } from 'react';
import { useOrg } from './OrgContext';
import { listProjects, duplicateProject, deleteProject } from '../../lib/projects';
import { inr } from '@/packages/engine';
import { Button, inputCls, labelCls } from './ui';
import type { Project } from '../../lib/types';

interface ProjectBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onSaveAsCopy: () => void;
  onNew: () => void;
  onOpen: (project: Project & { id: string }) => void;
  onOpenRevisions: () => void;
  currentProjectId: string | null;
  busy: boolean;
  /** Bump after a save so the Open list picks up the new/renamed project. */
  refreshKey: number;
  /** CLAUDE.md invariant 3: while a budget option is previewed, the price on
   *  screen is the candidate's, not core/over's -- saving would persist
   *  core/over while a different price sat on screen at that moment, which
   *  is exactly the "two prices for two designs" state the invariant
   *  forbids. Disabled until the preview is adopted or discarded. */
  previewActive: boolean;
  uid: string;
}

export function ProjectBar({
  projectName, onProjectNameChange, onSave, onSaveAsCopy, onNew, onOpen, onOpenRevisions, currentProjectId, busy,
  refreshKey, previewActive, uid,
}: ProjectBarProps) {
  const { orgId } = useOrg();
  const [projects, setProjects] = useState<(Project & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listProjects(orgId)
      .then((p) => { setProjects(p as (Project & { id: string })[]); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [orgId, refreshKey, reloadKey]);

  const handleDuplicate = async (e: React.MouseEvent, p: Project & { id: string }) => {
    e.stopPropagation();
    const newName = window.prompt('Name for the duplicate:', `${p.name} (Copy)`);
    if (!newName) return;
    setBusyProjectId(p.id);
    try {
      await duplicateProject(orgId, p.id, uid, newName);
      setReloadKey((k) => k + 1);
    } catch (err) {
      window.alert(`Duplicate failed: ${err}`);
    }
    setBusyProjectId(null);
  };

  const handleDelete = async (e: React.MouseEvent, p: Project & { id: string }) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${p.name}" and all its revisions? This cannot be undone.`)) return;
    setBusyProjectId(p.id);
    try {
      await deleteProject(orgId, p.id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      window.alert(`Delete failed: ${err}`);
    }
    setBusyProjectId(null);
  };

  return (
    <div className="bg-white border border-rule rounded-[2px] px-4 py-2 print:hidden">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px] space-y-1">
          <label className={labelCls}>Project Name</label>
          <input value={projectName} onChange={(e) => onProjectNameChange(e.target.value)} className={inputCls} />
        </div>

        <Button variant="confirm" onClick={onSave} disabled={busy || previewActive}>{busy ? 'Saving' : 'Save'}</Button>
        <Button variant="secondary" onClick={onSaveAsCopy} disabled={busy || previewActive || !currentProjectId}>Save As Copy</Button>
        {previewActive && (
          <p className="text-[9px] text-steel basis-full">Adopt or discard the previewed option before saving.</p>
        )}

        <div className="relative">
          <Button variant="secondary" onClick={() => setShowOpen((s) => !s)}>
            Open{loaded ? ` (${projects.length})` : ''}
          </Button>
          {showOpen && (
            <div className="absolute right-0 mt-1 w-96 bg-white border border-rule rounded-[2px] z-10 max-h-80 overflow-y-auto">
              {projects.length === 0 && (
                <div className="px-3 py-2 text-[11px] text-steel">No projects saved yet.</div>
              )}
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`border-b border-line last:border-0 hover:bg-sheetAlt ${p.id === currentProjectId ? 'bg-sheetAlt' : ''} ${busyProjectId === p.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <button type="button" onClick={() => { onOpen(p); setShowOpen(false); }} className="w-full text-left px-3 pt-2">
                    <div className={`text-[11px] ${p.id === currentProjectId ? 'text-copper font-semibold' : 'text-ink2'}`}>{p.name}</div>
                    <div className="text-[9px] font-mono text-steel">
                      {p.meta?.customer || 'No customer'} &middot; rev {p.currentRevision >= 0 ? p.currentRevision : 'none'}
                      &middot; updated {new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {p.summary && (
                      <div className="text-[9px] font-mono text-ink2 mt-0.5">
                        {p.summary.kva} kVA, {p.summary.hv / 1000} kV / {p.summary.lv} V &middot; Ex-works {inr(p.summary.exWorks)}
                        &middot; Delivered {inr(p.summary.delivered)} &middot; NL {p.summary.noLoadLoss} W, LL {p.summary.loadLoss} W
                      </div>
                    )}
                  </button>
                  <div className="flex gap-3 px-3 pb-1.5 pt-1">
                    <button type="button" onClick={(e) => handleDuplicate(e, p)} className="text-[9px] font-display uppercase tracking-[0.1em] text-steel underline underline-offset-2">
                      Duplicate
                    </button>
                    <button type="button" onClick={(e) => handleDelete(e, p)} className="text-[9px] font-display uppercase tracking-[0.1em] text-alert underline underline-offset-2">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button variant="secondary" onClick={onOpenRevisions} disabled={!currentProjectId}>Revisions</Button>
        <Button variant="primary" onClick={onNew}>New</Button>
      </div>
    </div>
  );
}
