import React from 'react';
import { documentRegister, routineTestSchedule, DOC_STATUS } from '@/packages/engine';
import { Card, thCls, tdCls } from '../ui';
import { NamePlateDrawing } from '../drawings/NamePlateDrawing';

interface DocumentsTabProps {
  core: any;
  design: any;
  bom: any;
  params: any;
  project: any;
}

/** DOC_STATUS keys are the engine's own vocabulary (done/part/need) -- this
 *  only maps them to a colour, it never re-labels or upgrades a status. */
const STATUS_TONE: Record<string, string> = { done: 'text-good', part: 'text-amber', need: 'text-alert' };

export function DocumentsTab({ core, design, bom, params, project }: DocumentsTabProps) {
  const register = documentRegister(core, design, bom, project);
  const tests = routineTestSchedule(design);

  const counts = register.reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
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
