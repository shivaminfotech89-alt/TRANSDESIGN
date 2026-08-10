import React, { useEffect, useMemo, useState } from 'react';
import { listRevisions, listMembers, lockRevision } from '../../lib/projects';
import { inr } from '@/packages/engine';
import { Card, Button } from './ui';
import type { Revision, Member } from '../../lib/types';

interface RevisionsModalProps {
  orgId: string;
  projectId: string;
  projectName: string;
  currentRevision: number;
  canEdit: boolean;
  onClose: () => void;
  /** Load this revision's own numbers everywhere, read-only, until the user
   *  copies it forward or returns to the live design. */
  onView: (rev: Revision & { id?: string }) => void;
  /** Fires right after a lock succeeds, so the caller can flip its own
   *  liveRevisionLocked flag immediately if this happens to be the revision
   *  loaded live -- without this the main app would only notice on the next
   *  open, even though the rules already enforce the lock either way. */
  onLocked: (rev: number) => void;
}

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  + ' ' + new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * DRAWINGS.md's sibling for the office side of the platform: every revision
 * this project has ever had, oldest facts never overwritten. `summary`
 * (written only from summarise()) is what is shown here -- browsing history
 * never runs the engine just to populate a list, per CLAUDE.md invariant 2.
 */
export function RevisionsModal({
  orgId, projectId, projectName, currentRevision, canEdit, onClose, onView, onLocked,
}: RevisionsModalProps) {
  const [revisions, setRevisions] = useState<(Revision & { id?: string })[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockingRev, setLockingRev] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoaded(false);
    Promise.all([listRevisions(orgId, projectId), listMembers(orgId)])
      .then(([revs, mem]) => { setRevisions(revs); setMembers(mem); setLoaded(true); })
      .catch((e) => { setError(String(e)); setLoaded(true); });
  }, [orgId, projectId, refreshKey]);

  const authorFor = useMemo(() => {
    const byUid = new Map(members.map((m) => [m.uid, m.email]));
    return (uid: string) => byUid.get(uid) || uid;
  }, [members]);

  const handleLock = async (rev: Revision & { id?: string }) => {
    if (!window.confirm(
      `Lock revision ${rev.rev}? Once a quotation has gone to the customer this revision must stop changing. `
      + 'This cannot be undone -- the rules do not permit unlocking a revision, only setting it locked once.',
    )) return;
    setLockingRev(rev.rev);
    try {
      await lockRevision(orgId, projectId, rev.rev);
      setRefreshKey((k) => k + 1);
      onLocked(rev.rev);
    } catch (e) {
      window.alert(`Lock failed: ${e}`);
    }
    setLockingRev(null);
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <Card title="Revisions" subtitle={projectName}>
          {!loaded && <p className="text-[11px] text-steel px-1 py-2">Loading revisions.</p>}
          {error && <p className="text-[11px] text-alert px-1 py-2">{error}</p>}
          {loaded && !error && revisions.length === 0 && (
            <p className="text-[11px] text-steel px-1 py-2">No revisions saved yet.</p>
          )}
          <div className="divide-y divide-line">
            {revisions.map((rev) => (
              <div key={rev.rev} className="py-3 px-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-display uppercase tracking-[0.1em] text-ink">
                      Rev {rev.rev}{rev.rev === currentRevision ? ' (Current)' : ''}
                    </span>
                    {rev.locked && (
                      <span className="text-[9px] font-display uppercase tracking-[0.12em] text-alert border border-rule rounded-[2px] px-1.5 py-0.5">
                        Locked
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-steel">{rev.engineVersion}</span>
                  </div>
                  <div className="text-[10px] font-mono text-steel mt-0.5">
                    {fmtDate(rev.createdAt)} &middot; {authorFor(rev.createdBy)}
                  </div>
                  {rev.note && <div className="text-[10px] text-ink2 mt-0.5">{rev.note}</div>}
                  <div className="text-[10px] font-mono text-ink2 mt-1">
                    {rev.summary.kva} kVA, {rev.summary.hv / 1000} kV / {rev.summary.lv} V &middot;{' '}
                    Ex-works {inr(rev.summary.exWorks)} &middot; Delivered {inr(rev.summary.delivered)} &middot;{' '}
                    {rev.summary.compliant ? 'Compliant' : 'Not Compliant'}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => onView(rev)}>View</Button>
                  {canEdit && !rev.locked && (
                    <Button variant="destructive" onClick={() => handleLock(rev)} disabled={lockingRev === rev.rev}>
                      {lockingRev === rev.rev ? 'Locking' : 'Lock'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-3">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
