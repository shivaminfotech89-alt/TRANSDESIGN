import React, { useEffect, useState } from 'react';
import { documentRegister, routineTestSchedule, DOC_STATUS } from '@/packages/engine';
import { Card, Button, thCls, tdCls } from '../ui';
import { NamePlateDrawing } from '../drawings/NamePlateDrawing';
import { generateReportPdf, getDocumentUrl, listDocuments } from '../../../lib/projects';
import type { GeneratedDocument } from '../../../lib/types';

interface DocumentsTabProps {
  core: any;
  design: any;
  bom: any;
  params: any;
  project: any;
  orgId: string;
  projectId: string | null;
  revision: number;
}

/** DOC_STATUS keys are the engine's own vocabulary (done/part/need) -- this
 *  only maps them to a colour, it never re-labels or upgrades a status. */
const STATUS_TONE: Record<string, string> = { done: 'text-good', part: 'text-amber', need: 'text-alert' };

/** TASKS.md item 10: triggers functions/src/reportPdf.ts and lists what it
 *  has already produced. Reads listDocuments fresh on every generate so a
 *  new PDF shows up without a manual refresh -- there is no live listener
 *  here since a handful of documents per project never needs one. */
function PdfReportPanel({ orgId, projectId, revision }: { orgId: string; projectId: string | null; revision: number }) {
  const [docs, setDocs] = useState<(GeneratedDocument & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!projectId) return;
    listDocuments(orgId, projectId)
      .then((d) => { setDocs(d as any); setLoaded(true); })
      .catch((e) => { setError(String(e)); setLoaded(true); });
  };

  useEffect(() => { refresh(); }, [orgId, projectId]);

  const canGenerate = !!projectId && revision >= 0;

  const handleGenerate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError(null);
    try {
      await generateReportPdf(orgId, projectId, revision);
      refresh();
    } catch (e) {
      setError(String(e));
    }
    setGenerating(false);
  };

  const handleDownload = async (doc: GeneratedDocument) => {
    if (!doc.storagePath) return;
    try {
      const url = await getDocumentUrl(doc.storagePath);
      window.open(url, '_blank');
    } catch (e) {
      window.alert(`Could not resolve a download link: ${e}`);
    }
  };

  return (
    <Card
      title="PDF Report"
      subtitle="Server-rendered, not window.print() -- bookmarks, page numbers, revision and QR verification"
    >
      <div className="px-1 pb-2 space-y-2">
        {!canGenerate && (
          <p className="text-[11px] text-steel">Save this design as a revision first -- the report renders a saved revision, not what is currently on screen.</p>
        )}
        {canGenerate && (
          <Button variant="primary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Rendering' : `Generate PDF, Revision ${revision}`}
          </Button>
        )}
        {error && <p className="text-[11px] text-alert">{error}</p>}
      </div>

      {loaded && docs.length > 0 && (
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Document</th><th className={`${thCls} text-right`}>Revision</th>
              <th className={thCls}>Status</th><th className={thCls} />
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td className={`${tdCls} font-mono text-[10px] text-copper`}>{d.docNo}</td>
                <td className={`${tdCls} text-right font-mono text-[11px]`}>{d.revision}</td>
                <td className={`${tdCls} font-display uppercase text-[10px] ${STATUS_TONE[d.status === 'generated' ? 'done' : d.status === 'partial' ? 'part' : 'need']}`}>
                  {d.status}
                </td>
                <td className={`${tdCls} text-right`}>
                  <button
                    type="button"
                    onClick={() => handleDownload(d)}
                    className="text-[10px] font-display uppercase tracking-[0.08em] text-patina underline underline-offset-2"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export function DocumentsTab({ core, design, bom, params, project, orgId, projectId, revision }: DocumentsTabProps) {
  const register = documentRegister(core, design, bom, project);
  const tests = routineTestSchedule(design);

  const counts = register.reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <PdfReportPanel orgId={orgId} projectId={projectId} revision={revision} />

      <Card
        title="Document Register"
        subtitle={`${counts.done || 0} generated · ${counts.part || 0} partial · ${counts.need || 0} needs input`}
      >
        <p className="text-[10px] text-steel px-1 pb-2">
          Status comes from what this design currently produces. A document moves to Generated only when the
          platform actually produces it in full, never by editing the row.
        </p>
        <table className="w-full">
          <thead>
            <tr>
              <th className={`${thCls} w-10`}>No.</th>
              <th className={thCls}>Document</th>
              <th className={thCls}>Title</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} hidden lg:table-cell`}>Where Produced</th>
              <th className={`${thCls} hidden md:table-cell`}>Missing</th>
            </tr>
          </thead>
          <tbody>
            {register.map((r: any) => (
              <tr key={r.no}>
                <td className={`${tdCls} font-mono text-[10px] text-steel`}>{r.no}</td>
                <td className={`${tdCls} font-mono text-[10px] text-copper whitespace-nowrap`}>{r.doc}</td>
                <td className={`${tdCls} text-[11px] text-ink2`}>{r.title}</td>
                <td className={`${tdCls} font-display uppercase text-[10px] tracking-[0.1em] whitespace-nowrap ${STATUS_TONE[r.status]}`}>
                  {DOC_STATUS[r.status]}
                </td>
                <td className={`${tdCls} text-[10px] text-steel hidden lg:table-cell`}>{r.where}</td>
                <td className={`${tdCls} text-[10px] text-steel hidden md:table-cell`}>{r.missing || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Routine Test Schedule" subtitle="IEC 60076-1 / IS 2026 routine tests">
        <p className="text-[10px] text-steel px-1 pb-2">
          Design Value is the guaranteed figure this design is held to, not a test result. Measured is completed on
          the test floor and is never pre-filled with a predicted number.
        </p>
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Test</th>
              <th className={`${thCls} hidden lg:table-cell`}>Reference</th>
              <th className={thCls}>Design Value</th>
              <th className={`${thCls} hidden md:table-cell`}>Limit</th>
              <th className={`${thCls} text-right`}>Measured</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t: any, i: number) => (
              <tr key={i}>
                <td className={`${tdCls} text-[11px] text-ink2`}>{t.t}</td>
                <td className={`${tdCls} font-mono text-[10px] text-steel hidden lg:table-cell`}>{t.ref}</td>
                <td className={`${tdCls} font-mono text-[11px] text-ink`}>{t.exp}</td>
                <td className={`${tdCls} text-[10px] text-steel hidden md:table-cell`}>{t.lim}</td>
                <td className={`${tdCls} text-right`}>
                  <span className="inline-block font-display uppercase text-[9px] tracking-[0.14em] text-steel border border-rule rounded-[2px] px-1.5 py-0.5">
                    Pending
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <NamePlateDrawing design={design} params={params} project={project} />
    </div>
  );
}
