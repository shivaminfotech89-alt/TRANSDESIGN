import React, { useEffect, useState } from 'react';
import { useOrg } from './OrgContext';
import { listProjects } from '../../lib/projects';
import { Button, inputCls, labelCls } from './ui';
import type { Project } from '../../lib/types';

interface ProjectBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onSaveAsCopy: () => void;
  onNew: () => void;
  onOpen: (project: Project & { id: string }) => void;
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
}

export function ProjectBar({
  projectName, onProjectNameChange, onSave, onSaveAsCopy, onNew, onOpen, currentProjectId, busy, refreshKey,
  previewActive,
}: ProjectBarProps) {
  const { orgId } = useOrg();
  const [projects, setProjects] = useState<(Project & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showOpen, setShowOpen] = useState(false);

  useEffect(() => {
    listProjects(orgId)
      .then((p) => { setProjects(p as (Project & { id: string })[]); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [orgId, refreshKey]);

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
            <div className="absolute right-0 mt-1 w-72 bg-white border border-rule rounded-[2px] z-10 max-h-64 overflow-y-auto">
              {projects.length === 0 && (
                <div className="px-3 py-2 text-[11px] text-steel">No projects saved yet.</div>
              )}
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onOpen(p); setShowOpen(false); }}
                  className={`w-full text-left px-3 py-2 border-b border-line last:border-0 hover:bg-sheetAlt ${p.id === currentProjectId ? 'bg-sheetAlt' : ''}`}
                >
                  <div className={`text-[11px] ${p.id === currentProjectId ? 'text-copper font-semibold' : 'text-ink2'}`}>{p.name}</div>
                  <div className="text-[9px] font-mono text-steel">
                    {p.meta?.customer || 'No customer'} &middot; rev {p.currentRevision >= 0 ? p.currentRevision : 'none'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="primary" onClick={onNew}>New</Button>
      </div>
    </div>
  );
}
