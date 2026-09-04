import React, { useEffect, useState } from 'react';
import { ComplianceBand, ProvenanceBand, ValueQualifications, BomBasisNote } from './Qualifications';
import QRCode from 'qrcode';
import {
  calcSheet, buildBOM, documentRegister, routineTestSchedule,
  tappingSchedule, conductorSchedule, hardwareSchedule, windingSchedule,
  computeDesign, inr, DOC_STATUS,
} from '@/packages/engine';
import { RatingPlate } from '../components/RatingPlate';
import { NamePlateDrawing } from '../components/drawings/NamePlateDrawing';
import { thCls, tdCls } from '../components/ui';
import { fmtMoney } from '../lib/format';
import type { Project, Revision } from '../../lib/types';

interface PrintReportProps {
  project: Project;
  revision: Revision;
  result: ReturnType<typeof computeDesign>;
}

const pad2 = (n: number) => String(Math.max(0, n) || 0).padStart(2, '0');

/** Same family as drawingNo() (DrawingPrimitives.tsx) and documentRegister()'s
 *  own numbering -- RPT so this whole-report number can never collide with
 *  either. One number for the whole document, printed on every page via
 *  Puppeteer's own footer template (functions/src/index.ts), not per section. */
function reportDocNo(meta: Project['meta'], rev: number): string {
  const prefix = meta?.docPrefix || 'TDE';
  const tender = meta?.tender || 'ENQ';
  return `${prefix}-${tender}-R${pad2(rev)}-RPT`;
}

const STATUS_TONE: Record<string, string> = { done: 'text-good', part: 'text-amber', need: 'text-alert' };

/** functions/src/reportPdf.ts captures one page.pdf() per section (toggling
 *  data-section visibility via window.__showSection, not a React re-render,
 *  so the Cloud Function does not have to wait on React state to settle
 *  between captures) and merges them with pdf-lib, building the bookmark
 *  outline from exactly the page counts each capture actually produced --
 *  not guessed page numbers. This id/title list is duplicated in that file
 *  (a separate npm package, no shared import) -- keep both in sync if a
 *  section is added, removed or renamed. */
export const REPORT_SECTIONS: Array<{ id: string; title: string }> = [
  { id: 'cover', title: 'Rating Plate' },
  { id: 'calculations', title: 'Design Calculation Sheet' },
  { id: 'bom', title: 'Bill of Materials & Cost' },
  { id: 'manufacturing', title: 'Manufacturing Schedules' },
  { id: 'register', title: 'Document Register & Routine Tests' },
  { id: 'nameplate', title: 'Rating Name Plate' },
];

/** DESIGN.md's own Card, reimplemented with static classes rather than the
 *  Tailwind JIT ones (ui.tsx's cardCls etc.) since this component is not
 *  guaranteed to render inside the same Tailwind build context a headless
 *  Puppeteer navigation reuses -- it is, in this app (same bundle, same
 *  route), so plain inline style is belt and braces, not a real difference
 *  in output today. */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-rule rounded-[2px] mb-4 break-inside-avoid">
      <div className="bg-sheetAlt border-b border-line px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] font-display uppercase tracking-[0.18em] text-ink">{title}</span>
        {subtitle && <span className="font-mono text-[10px] text-steel">{subtitle}</span>}
      </div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}

/**
 * TASKS.md item 10: the actual report content Puppeteer captures.
 * documentRegister() decides what this design can actually produce in
 * full -- CLAUDE.md invariant 7 -- so status is read from it, never
 * assumed. Sections not in this pass (individual 2D drawings, DRAWINGS.md's
 * full 21-drawing set) are a deliberate v1 scope cut, not an oversight:
 * this report covers the calculation sheet, BOM, manufacturing schedules,
 * document register and name plate, which is already a genuinely long
 * document (calcSheet alone runs to several pages at DESIGN.md's density).
 */
export function PrintReport({ project, revision, result }: PrintReportProps) {
  const { design, bom, params } = result;
  const meta = revision.input.meta;
  const docNo = reportDocNo(meta, revision.rev);
  const isDraft = !revision.locked;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // The QR target is the app's own project URL -- there is no public
    // verification endpoint yet (TASKS.md does not ask for one), so this
    // is "open this project in the app," which at least gets a reviewer
    // to the source of truth rather than nowhere.
    const url = `${window.location.origin}/#/orgs/${project.id}`;
    QRCode.toDataURL(url, { margin: 1, width: 160 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [project.id]);

  useEffect(() => {
    // Direct DOM toggling, not React state: functions/src/reportPdf.ts calls
    // this from page.evaluate() between page.pdf() captures, one section at
    // a time, and needs the visibility change to be synchronous and settled
    // before the very next call -- round-tripping through a React re-render
    // for every one of six captures is slower and adds nothing here, since
    // no section's own content depends on any other section being hidden.
    (window as any).__showSection = (id: string | null) => {
      document.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => {
        el.style.display = id === null || el.dataset.section === id ? '' : 'none';
      });
    };
    return () => { delete (window as any).__showSection; };
  }, []);

  /* CALIBRATION.md section 94: one wording per qualification, taken from the
     engine fields the screen already renders. What is print-specific is only
     WHERE each one goes -- reportPdf.ts captures one PDF per data-section, so
     a qualification must be emitted inside the section holding its own value
     or it lands on another page, and a reader holding a page cannot scroll. */
  const over = revision.input?.over || {};
  const bands = (
    <>
      <ComplianceBand design={design} />
      <ProvenanceBand design={design} over={over} rateCardId={revision.rateCardId} result={result} />
    </>
  );

  const sheet = calcSheet(design, bom);
  const register = documentRegister(revision.input.core, design, bom, meta);
  const tests = routineTestSchedule(design);
  const tap = tappingSchedule(design, params);
  const cond = conductorSchedule(design, params);
  const hw = hardwareSchedule(design, params);
  const wind = windingSchedule(design, params);

  return (
    <div id="report-root" className="bg-sheet min-h-screen" data-doc-no={docNo} data-revision={revision.rev}>
      <style>{`
        @page { margin: 18mm 14mm; }
        .report-page-break { break-before: page; }
        body { background: white; }
      `}
      </style>

      {/* Cover / rating plate page */}
      <div className="p-6 max-w-[1000px] mx-auto" data-section="cover">
        {isDraft && (
          <div
            style={{
              position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%) rotate(-30deg)',
              fontSize: 90, color: 'rgba(163,60,37,0.12)', fontFamily: 'Arial Narrow, sans-serif',
              fontWeight: 700, letterSpacing: '0.1em', zIndex: 0, pointerEvents: 'none', whiteSpace: 'nowrap',
            }}
          >
            DRAFT, NOT ISSUED
          </div>
        )}

        <div className="flex items-start justify-between mb-4" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div className="text-[10px] font-display uppercase tracking-[0.4em] text-copper">Design Office</div>
            <div className="text-[24px] font-display uppercase text-ink leading-none mt-1">
              {meta.projectName || project.name}
            </div>
            <div className="text-[10px] font-mono text-ink2 mt-1">
              Customer: {meta.customer || '--'} &middot; Tender: {meta.tender || '--'}
            </div>
          </div>
          <div className="text-right">
            {qrDataUrl && <img src={qrDataUrl} width={80} height={80} alt="QR" />}
            <div className="font-mono text-[10px] text-ink2 mt-1">{docNo}</div>
            <div className="font-mono text-[10px] text-steel">Revision {revision.rev}{revision.locked ? ', issued' : ', draft'}</div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {bands}
          <RatingPlate design={design} bom={bom} params={params} />
        </div>
      </div>

      {/* Calculation sheet */}
      <div className="report-page-break p-6 max-w-[1000px] mx-auto" data-section="calculations">
        <div className="text-[11px] font-display uppercase tracking-[0.18em] text-copper mb-3">Design Calculation Sheet</div>
        {bands}
        <ValueQualifications design={design} result={result} show="all" />
        {sheet.map((section: any) => (
          <Section key={section.title} title={section.title} subtitle={section.ref}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thCls}>Quantity</th>
                  <th className={thCls}>Formula</th>
                  <th className={thCls}>Substitution</th>
                  <th className={`${thCls} text-right`}>Result</th>
                  <th className={thCls}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className={`${tdCls} text-[11px] text-ink2`}>{r.q} <span className="text-steel">({r.sym})</span></td>
                    <td className={`${tdCls} font-mono text-[10px] text-steel`}>{r.formula}</td>
                    <td className={`${tdCls} font-mono text-[10px] text-steel`}>{r.sub}</td>
                    <td className={`${tdCls} text-right font-mono text-[11px] font-semibold text-ink`}>{r.res}</td>
                    <td className={`${tdCls} text-[10px] text-steel`}>{r.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ))}
      </div>

      {/* Bill of materials */}
      <div className="report-page-break p-6 max-w-[1000px] mx-auto" data-section="bom">
        {bands}
        <BomBasisNote bom={bom} />
        <div className="text-[11px] font-display uppercase tracking-[0.18em] text-copper mb-3">Bill of Materials &amp; Cost</div>
        {bom.warnings?.map((w: any) => (
          <div key={w.code} className="bg-white border border-alert rounded-[2px] px-4 py-3 mb-3">
            <div className="text-[11px] font-display uppercase tracking-[0.14em] text-alert mb-1">{w.title}</div>
            <p className="text-[11px] text-ink2">{w.message}</p>
          </div>
        ))}
        {bom.segments.map((seg: any) => (
          <Section key={seg.title} title={seg.title} subtitle={inr(seg.total)}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thCls}>Code</th><th className={thCls}>Description</th>
                  <th className={`${thCls} text-right`}>Quantity</th><th className={thCls}>Unit</th>
                  <th className={`${thCls} text-right`}>Rate</th><th className={`${thCls} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {seg.rows.map((r: any) => (
                  <tr key={r.code}>
                    <td className={`${tdCls} font-mono text-[10px] text-steel`}>{r.code}</td>
                    <td className={`${tdCls} text-[11px] text-ink2`}>{r.desc}</td>
                    <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.qty.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</td>
                    <td className={`${tdCls} text-[10px] text-steel`}>{r.unit}</td>
                    <td className={`${tdCls} text-right font-mono text-[11px]`}>{fmtMoney(r.rate)}</td>
                    <td className={`${tdCls} text-right font-mono text-[11px] font-semibold text-ink`}>{fmtMoney(r.qty * r.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ))}
        <Section title="Build-Up to Price">
          <table className="w-full max-w-md">
            <tbody>
              {[
                ['Material', bom.material], ['Labour', bom.labourCost], ['Scrap allowance', bom.scrap],
                ['Factory cost', bom.factory], ['Overhead', bom.overhead], ['Freight', bom.freight],
                ['Margin', bom.margin], ['Ex-works price, excludes GST', bom.exFactory],
                [`GST at ${params.gstPct}%`, bom.gst], ['Delivered price, includes GST', bom.withGst],
              ].map(([label, value]: any) => (
                <tr key={label}>
                  <td className={tdCls}>{label}</td>
                  <td className={`${tdCls} text-right font-mono font-semibold`}>{inr(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      {/* Manufacturing schedules */}
      <div className="report-page-break p-6 max-w-[1000px] mx-auto" data-section="manufacturing">
        {bands}
        <ValueQualifications design={design} result={result} show="all" />
        <div className="text-[11px] font-display uppercase tracking-[0.18em] text-copper mb-3">Manufacturing Schedules</div>

        {tap.rows.length > 0 && (
          <Section title="Tapping Schedule">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thCls}>Position</th><th className={`${thCls} text-right`}>Nominal %</th>
                  <th className={`${thCls} text-right`}>HV turns</th><th className={`${thCls} text-right`}>Voltage</th>
                </tr>
              </thead>
              <tbody>
                {tap.rows.map((r: any) => (
                  <tr key={r.position}>
                    <td className={`${tdCls} font-mono`}>{r.isNormal ? 'N' : (r.position > 0 ? `+${r.position}` : r.position)}</td>
                    <td className={`${tdCls} text-right font-mono`}>{r.nominalPct.toFixed(2)}%</td>
                    <td className={`${tdCls} text-right font-mono`}>{r.turns}</td>
                    <td className={`${tdCls} text-right font-mono`}>{r.voltage.toFixed(0)} V</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        <Section title="Conductor and Covering Schedule">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-display uppercase text-ink2 mb-1">LV -- {design.cLV.name}</div>
              <table className="w-full">
                <tbody>
                  <tr><td className={tdCls}>Construction</td><td className={`${tdCls} text-right`}>{cond.lv.construction}</td></tr>
                  <tr><td className={tdCls}>Bare size</td><td className={`${tdCls} text-right font-mono`}>{cond.lv.bare.w.toFixed(2)} x {cond.lv.bare.t.toFixed(3)} mm</td></tr>
                  <tr><td className={tdCls}>Parallel</td><td className={`${tdCls} text-right font-mono`}>{cond.lv.parallel}{cond.lv.arrangement ? ` (${cond.lv.arrangement})` : ''}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="text-[11px] font-display uppercase text-ink2 mb-1">HV -- {design.cHV.name}</div>
              <table className="w-full">
                <tbody>
                  <tr><td className={tdCls}>Bare size</td><td className={`${tdCls} text-right font-mono`}>{cond.hv.bare.w.toFixed(2)} x {cond.hv.bare.t.toFixed(2)} mm</td></tr>
                  <tr><td className={tdCls}>Covered size</td><td className={`${tdCls} text-right font-mono`}>{cond.hv.covered.w.toFixed(2)} x {cond.hv.covered.t.toFixed(2)} mm</td></tr>
                  <tr><td className={tdCls}>Parallel</td><td className={`${tdCls} text-right font-mono`}>{cond.hv.parallel}{cond.hv.arrangement ? ` (${cond.hv.arrangement})` : ''}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section title="Winding Schedule" subtitle={`HV -- ${wind.hv.construction} construction`}>
          {wind.hv.construction === 'layer' ? (
            <p className="text-[11px] text-steel">{wind.note}</p>
          ) : (
            <table className="w-full max-w-lg">
              <tbody>
                <tr><td className={tdCls}>{wind.hv.label === 'coil' ? 'Coils' : 'Discs'}</td><td className={`${tdCls} text-right font-mono`}>{wind.hv.groups}</td></tr>
                <tr><td className={tdCls}>Turns per axial layer</td><td className={`${tdCls} text-right font-mono`}>{wind.hv.turnsPerLayer}</td></tr>
                <tr><td className={tdCls}>Total HV turns (extreme tap)</td><td className={`${tdCls} text-right font-mono`}>{wind.hv.totalTurns}</td></tr>
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Hardware Schedule">
          <table className="w-full">
            <thead>
              <tr><th className={thCls}>Item</th><th className={thCls}>Size</th><th className={`${thCls} text-right`}>Qty</th></tr>
            </thead>
            <tbody>
              <tr>
                <td className={tdCls}>Tie rods</td>
                <td className={`${tdCls} font-mono`}>&#8960;{hw.tieRod.dia} x {hw.tieRod.length} mm</td>
                <td className={`${tdCls} text-right font-mono`}>{hw.tieRod.qty}</td>
              </tr>
              <tr>
                <td className={tdCls}>Core bolts</td>
                <td className={`${tdCls} font-mono`}>&#8960;{hw.coreBolt.dia} x {hw.coreBolt.length} mm</td>
                <td className={`${tdCls} text-right font-mono`}>{hw.coreBolt.qty}</td>
              </tr>
              <tr>
                <td className={tdCls}>Foot plates</td>
                <td className={`${tdCls} font-mono`}>{hw.footPlate.w} x {hw.footPlate.t} mm</td>
                <td className={`${tdCls} text-right font-mono`}>{hw.footPlate.qty}</td>
              </tr>
            </tbody>
          </table>
        </Section>
      </div>

      {/* Document register and routine tests */}
      <div className="report-page-break p-6 max-w-[1000px] mx-auto" data-section="register">
        {bands}
        <Section title="Document Register">
          <table className="w-full">
            <thead>
              <tr>
                <th className={`${thCls} w-10`}>No.</th><th className={thCls}>Document</th><th className={thCls}>Title</th>
                <th className={thCls}>Status</th><th className={thCls}>Where Produced</th>
              </tr>
            </thead>
            <tbody>
              {register.map((r: any) => (
                <tr key={r.no}>
                  <td className={`${tdCls} font-mono text-[10px] text-steel`}>{r.no}</td>
                  <td className={`${tdCls} font-mono text-[10px] text-copper`}>{r.doc}</td>
                  <td className={`${tdCls} text-[11px] text-ink2`}>{r.title}</td>
                  <td className={`${tdCls} font-display uppercase text-[10px] ${STATUS_TONE[r.status]}`}>{DOC_STATUS[r.status]}</td>
                  <td className={`${tdCls} text-[10px] text-steel`}>{r.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Routine Test Schedule">
          <table className="w-full">
            <thead>
              <tr><th className={thCls}>Test</th><th className={thCls}>Design Value</th><th className={thCls}>Limit</th></tr>
            </thead>
            <tbody>
              {tests.map((t: any, i: number) => (
                <tr key={i}>
                  <td className={`${tdCls} text-[11px] text-ink2`}>{t.t}</td>
                  <td className={`${tdCls} font-mono text-[11px]`}>{t.exp}</td>
                  <td className={`${tdCls} text-[10px] text-steel`}>{t.lim}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      {/* Name plate */}
      <div className="report-page-break p-6 max-w-[1000px] mx-auto" data-section="nameplate">
        {bands}
        <NamePlateDrawing design={design} params={params} project={meta} />
      </div>

      {/* Puppeteer's own ready signal -- functions/src/index.ts waits on this
          selector rather than a fixed timeout, since calcSheet/buildBOM run
          synchronously but the QR code (image decode) does not. */}
      <div id="report-ready" data-ready={qrDataUrl ? 'true' : 'false'} style={{ display: 'none' }} />
    </div>
  );
}
