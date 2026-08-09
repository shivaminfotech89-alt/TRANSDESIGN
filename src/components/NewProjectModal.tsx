import React, { useState } from 'react';
import { APPS, STANDARDS } from '@/packages/engine';
import { Card, Button, inputCls, labelCls } from './ui';

interface NewProjectModalProps {
  onClose: () => void;
  /** Starts a new project: the name (-> ProjectMeta.projectName) and a patch
   *  over ESSENTIALS for the handful of enquiry fields collected here. */
  onStart: (projectName: string, corePatch: Record<string, any>) => void;
}

const APP_OPTS = Object.entries(APPS).map(([k, v]: [string, any]) => [k, v.name]);
const STANDARD_OPTS = Object.entries(STANDARDS).map(([k, v]: [string, any]) => [k, v.name]);
const VECTOR_OPTS = ['Dyn11', 'Yyn0', 'YNd11', 'Dd0'];

export function NewProjectModal({ onClose, onStart }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState('Untitled Design');
  const [kva, setKva] = useState(1000);
  const [hv, setHv] = useState(11000);
  const [lv, setLv] = useState(433);
  const [vector, setVector] = useState('Dyn11');
  const [application, setApplication] = useState('distribution');
  const [standard, setStandard] = useState('IS');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(projectName, { kva, hv, lv, vector, application, standard });
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card title="New Transformer Design" subtitle="Enquiry basics">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className={labelCls}>Project Name</label>
              <input required value={projectName} onChange={(e) => setProjectName(e.target.value)} className={inputCls} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Rating (kVA)</label>
                <input type="number" required min={10} value={kva} onChange={(e) => setKva(Number(e.target.value))} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>HV (V)</label>
                <input type="number" required min={100} value={hv} onChange={(e) => setHv(Number(e.target.value))} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>LV (V)</label>
                <input type="number" required min={100} value={lv} onChange={(e) => setLv(Number(e.target.value))} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Vector Group</label>
                <select value={vector} onChange={(e) => setVector(e.target.value)} className={inputCls}>
                  {VECTOR_OPTS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Application</label>
                <select value={application} onChange={(e) => setApplication(e.target.value)} className={inputCls}>
                  {APP_OPTS.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Standard</label>
                <select value={standard} onChange={(e) => setStandard(e.target.value)} className={inputCls}>
                  {STANDARD_OPTS.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
                </select>
              </div>
            </div>

            <p className="text-[10px] font-body text-steel">
              Everything else (core grade, flux density, clearances, tappings...) is derived automatically
              and shown as AUTO in the sidebar. Override anything there once the design is open.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary">Start Design</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
