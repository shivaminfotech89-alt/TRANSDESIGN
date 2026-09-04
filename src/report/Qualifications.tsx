import React from 'react';
import { COMPLIANCE_STATES } from '@/packages/engine';

/**
 * CALIBRATION.md section 94. Every qualification the app shows was absent from
 * the printed report -- the surface that leaves the building. This carries all
 * of them across.
 *
 * The words come from ONE source. Each note below renders an engine field --
 * `complianceNote`, `lossBreach`, `windowNote`, `zEdgeNote`, `coreMassAnomaly`,
 * `nonFiniteNote` -- verbatim, the same string the screen renders. Nothing here
 * restates a qualification in print-specific wording, so there is one place to
 * change any of them and no way for the two surfaces to drift apart. What IS
 * print-specific lives here and only here: which qualification belongs on which
 * page, and repeating the compliance state on every page (see `scope`).
 *
 * Placement matters more in print than on screen. `reportPdf.ts` captures one
 * PDF per `data-section` and merges them, so a qualification emitted outside
 * its own section lands on the wrong page -- and a reader holding a page cannot
 * scroll to find it. Every block below is rendered INSIDE the section holding
 * the value it qualifies.
 */

const box = 'border rounded-[2px] px-3 py-2 mb-3 text-[10px] leading-snug';
const alert = `${box} border-alert text-alert`;
const amber = `${box} border-amber text-amber`;
const plain = `${box} border-line text-ink2`;

/** The compliance state in WORDS. A printed page is often reproduced in
 *  monochrome, so colour alone states nothing -- this was the whole signal the
 *  report carried before. Never renders "compliant" for a state that is not. */
export function ComplianceBand({ design }: { design: any }) {
  const st = COMPLIANCE_STATES[design.complianceState] || COMPLIANCE_STATES.notAssessed;
  const failed = design.complianceState === 'failed';
  const passed = design.complianceState === 'passed';
  return (
    <div className={failed ? alert : passed ? plain : amber}>
      <span className={`font-semibold${passed ? ' text-ink' : ''}`}>Compliance: {st.label.toUpperCase()}.</span> {st.lead}
      {design.complianceNote && <div className="mt-1">{design.complianceNote}</div>}
    </div>
  );
}

/** Overrides (section 82) and non-finite values (section 85). Both are
 *  document-wide facts about how the design was produced, so they repeat with
 *  the compliance band rather than attaching to one value. */
export function ProvenanceBand({ design, over, rateCardId, result }: {
  design: any; over: Record<string, any>; rateCardId?: string; result: any;
}) {
  const keys = Object.keys(over || {}).filter((k) => over[k] !== undefined);
  const unsourcedRates = !rateCardId || rateCardId === 'default';
  if (!keys.length && !unsourcedRates && !result?.nonFiniteNote) return null;
  return (
    <>
      {result?.nonFiniteNote && <div className={alert}><span className="font-semibold">Computed value not a real number. </span>{result.nonFiniteNote}</div>}
      {keys.length > 0 && (
        <div className={plain}>
          <span className="font-semibold text-ink">{keys.length} parameter{keys.length === 1 ? '' : 's'} manually overridden: </span>
          {keys.join(', ')}. Everything else is derived. An override made in an earlier session persists until cleared.
        </div>
      )}
      {unsourcedRates && (
        <div className={amber}>
          <span className="font-semibold">Not priced from a saved rate card.</span> Every figure in this document that
          carries a price was built on the engine's default rates, not this works' own costs. Indicative only.
        </div>
      )}
    </>
  );
}

/** CALIBRATION.md section 97: the BOM's own basis note, on the page carrying
 *  the priced conductor lines it qualifies. Added to the engine in
 *  ENGINE_VERSION 1.39.0, AFTER section 94 carried the other qualifications
 *  across, and so missed by it -- the same drift this run keeps finding, this
 *  time in work of my own three commits old. A qualification added to the
 *  engine has to be given a home in the report in the same commit. */
export function BomBasisNote({ bom }: { bom: any }) {
  if (!bom?.rateBasisNote) return null;
  return <div className={plain}><span className="font-semibold text-ink">Conductor pricing basis. </span>{bom.rateBasisNote}</div>;
}

/** Qualifications that belong beside specific values, on the page carrying
 *  them. Each renders the engine's own string, unchanged. */
export function ValueQualifications({ design, result, show }: { design: any; result?: any; show: 'losses' | 'geometry' | 'all' }) {
  const losses = show === 'losses' || show === 'all';
  const geom = show === 'geometry' || show === 'all';
  return (
    <>
      {losses && design.lossBreach && <div className={alert}><span className="font-semibold">Loss schedule breached. </span>{design.lossBreach}</div>}
      {losses && design.isLossBasis === 'agreed' && (
        <div className={amber}>
          <span className="font-semibold">Interpolated loss limits. </span>
          IS 1180 (Part 1) : 2014 lists no {design.p?.kva} kVA row. The limits opposite were interpolated between the
          neighbouring listed ratings and are subject to agreement between user and supplier. Agree them in writing
          before quoting against them.
        </div>
      )}
      {losses && design.constraintNote && <div className={plain}>{design.constraintNote}</div>}
      {geom && design.windowNote && (
        <div className={design.windowStraddle ? alert : amber}>
          <span className="font-semibold">
            {design.windowStraddle ? 'Declared impedance is not achievable. ' : 'Declared impedance is not exactly achievable. '}
          </span>
          {design.windowNote}
        </div>
      )}
      {geom && design.zEdgeNote && <div className={amber}><span className="font-semibold">Impedance is close to its tolerance limit. </span>{design.zEdgeNote}</div>}
      {geom && design.coreMassAnomaly && <div className={alert}><span className="font-semibold">Core mass anomaly. </span>{design.coreMassAnomaly}</div>}
      {geom && result?.etkNonCompliant && result?.etkSearchNote && <div className={amber}><span className="font-semibold">No fully compliant K exists. </span>{result.etkSearchNote}</div>}
      {geom && result?.autoFitCycleNote && <div className={plain}>{result.autoFitCycleNote}</div>}
      {geom && result?.fitResolutionNote && <div className={plain}>{result.fitResolutionNote}</div>}
    </>
  );
}
