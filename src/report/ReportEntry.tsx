import React, { useEffect, useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { getProject, getRevision } from '../../lib/projects';
import { computeDesign } from '@/packages/engine';
import type { Project, Revision } from '../../lib/types';
import { PrintReport } from './PrintReport';

/**
 * TASKS.md item 10: the headless render target for the PDF Cloud Function.
 * Deliberately bypasses AuthProvider/AuthGate/OrgContext entirely -- those
 * exist to resolve "which org does this human belong to" interactively,
 * which is meaningless here: the org, project and revision are already
 * fixed in the URL, and identity comes from a Firebase custom token the
 * Cloud Function minted for the same uid that asked for the PDF, not from
 * a login screen. functions/src/index.ts stashes that token in
 * sessionStorage (via page.evaluateOnNewDocument) before navigating here,
 * never as a URL query parameter, so it never lands in a server access log
 * or browser history entry.
 *
 * Reads exactly what a saved revision holds and recomputes from it
 * (CLAUDE.md invariant 2) -- nothing here is a stored design value, the
 * same rule every other tab already follows.
 */
const TOKEN_KEY = 'td_report_token';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; project: Project; revision: Revision; result: ReturnType<typeof computeDesign> };

function parsePath(pathname: string): { orgId: string; projectId: string; rev: number } | null {
  // /report/{orgId}/{projectId}/{rev}
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 4 || parts[0] !== 'report') return null;
  const rev = Number(parts[3]);
  if (!Number.isFinite(rev)) return null;
  return { orgId: parts[1], projectId: parts[2], rev };
}

export function ReportEntry() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const route = parsePath(window.location.pathname);
      if (!route) { setState({ status: 'error', message: 'Malformed report URL.' }); return; }
      const token = window.sessionStorage.getItem(TOKEN_KEY);
      if (!token) { setState({ status: 'error', message: 'No report token present.' }); return; }
      try {
        await signInWithCustomToken(auth, token);
        const project = await getProject(route.orgId, route.projectId);
        if (!project) throw new Error(`Project ${route.projectId} not found.`);
        const revision = await getRevision(route.orgId, route.projectId, route.rev);
        if (!revision) throw new Error(`Revision ${route.rev} not found.`);
        const result = computeDesign(
          revision.input.core, revision.input.over, revision.rateSnapshot as any, revision.input.extras,
        );
        if (!cancelled) setState({ status: 'ready', project, revision, result });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', message: String(err) });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.status === 'loading') {
    return <div style={{ padding: 40, fontFamily: 'monospace' }}>Loading report data.</div>;
  }
  if (state.status === 'error') {
    // Rendered as plain, unstyled text on purpose: if this shows up in a
    // captured PDF it must be unmistakably an error page, never something
    // that could pass for a real report at a glance.
    return (
      <div style={{ padding: 40, fontFamily: 'monospace', color: '#A33C25' }}>
        REPORT GENERATION FAILED: {state.message}
      </div>
    );
  }

  return <PrintReport project={state.project} revision={state.revision} result={state.result} />;
}
