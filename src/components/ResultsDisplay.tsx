import React, { useState } from 'react';
import { calcSheet, inr } from '@/packages/engine';
import { Card, DataRow, DerivedRow, CheckMark, Button, cardCls, cardHeaderCls, cardTitleCls, cardSubtitleCls, cardBodyCls, thCls, tdCls } from './ui';
import { Drawings2D, CoreDrawing, CoreCrossSection, StampingSchedule } from './Drawings2D';
import { LvWindingDrawing, HvWindingDrawing, TapWindingDrawing } from './drawings/WindingDrawings';
import { InternalAssemblyDrawing } from './drawings/SectionDrawings';
import { CadViewerTab } from './cad/CadViewerTab';
import { DocumentsTab } from './documents/DocumentsTab';
import { ManufacturingTab } from './manufacturing/ManufacturingTab';
import { BudgetTab } from './budget/BudgetTab';
import { CostCardTab } from './costcard/CostCardTab';
import { CompareQuoteTab } from './compare/CompareQuoteTab';
import { PRICE_SOURCE_LABELS, type PriceResolution } from '../lib/pricing';
import { fmtMoney } from '../lib/format';

interface ResultsDisplayProps {
  core: any;
  design: any;
  bom: any;
  params: any;
  /** The live design being edited, unaffected by any budget preview. Every
   *  tab above follows `design`/`bom`/`params` (which track the preview when
   *  one is active) -- only the Budget tab needs the real one underneath, so
   *  it always searches and compares against what the user is actually
   *  editing, not a candidate they haven't adopted yet. */
  liveDesign: any;
  liveBom: any;
  liveParams: any;
  /** The live design's raw over -- what the user actually pinned, not
   *  liveParams' resolved values (every param is "resolved" whether it came
   *  from a pin or deriveSpec's own AUTO estimate; only over says which).
   *  Passed to the Budget tab so a pinned flux or current density is held
   *  by the search too, CALIBRATION.md section 42. */
  liveOver: Record<string, any>;
  project: any;
  rates: Record<string, number>;
  onRatesChange: (rates: Record<string, number>) => void;
  /** TASKS.md item 11.4's fully resolved rates (item/supplier price
   *  hierarchy applied, or the frozen snapshot for a revision) -- what the
   *  live BOM is actually priced at. `rates` above is the editable base rate
   *  card the RateField panel writes to; the Budget tab's search needs the
   *  landed cost the design will really be quoted at, per CALIBRATION.md
   *  section 2's K search, not the unresolved card underneath it. */
  effectiveRates: Record<string, number>;
  /** The real orgs/{orgId}/rateCards document the live `rates` were seeded
   *  from -- null only if the org has no rate card yet or the price on
   *  screen came from a revision whose own card no longer resolves. */
  rateCard: { id: string; name: string; effectiveFrom: number } | null;
  onManageRateCards: () => void;
  /** True while a budget preview, a viewed revision, or a locked live
   *  revision is on screen -- editing rates or switching the rate card
   *  would silently change what those show, the same ambiguity App.tsx's
   *  own aside already guards against for every other edit surface. */
  pricingLocked: boolean;
  /** TASKS.md item 11.4: which tier resolved each rate key currently in
   *  `rates`/`bom` -- keyed the same way a BOM row's own `rk` field is, so
   *  a row looks itself up directly. Empty for a budget preview (an
   *  engine-generated alternative, not a priced BOM) or when pricingLocked
   *  makes the concept moot for what's on screen. */
  rateSources: Record<string, PriceResolution>;
  /** Rate keys locked for this project only -- which rows get the "Locked"
   *  badge and the toggle's label. */
  priceLocks: Record<string, number>;
  onTogglePriceLock: (rateKey: string) => void;
  /** documentRegister #12: item master lookup by rateKey, same keying as
   *  rateSources -- a BOM row with an `rk` looks itself up here for the item
   *  master's own code and part number, distinct from the row's own BOM
   *  line code (e.g. "AC-01"). Empty Map for a row with no matching item;
   *  the row shows nothing extra rather than inventing one. */
  itemsByRateKey: Map<string, { code: string; partNumber: string }>;
  activePreviewKey: string | null;
  onSelectPreview: (candidate: any | null) => void;
  /** TASKS.md item 10: null/-1 while no project or no saved revision exists
   *  yet -- generating a server PDF needs a real saved revision to render
   *  (the Cloud Function loads it the same way this app does, from
   *  Firestore, never from in-memory state), so DocumentsTab disables the
   *  button rather than offering to render something that was never saved. */
  orgId: string;
  projectId: string | null;
  revision: number;
  /** CALIBRATION.md section 9: writes cardExtra into the live over object
   *  the same way any other override edit does (App.tsx's handleOverChange)
   *  -- not a separate persistence path. Disabled by the same pricingLocked
   *  condition as every other edit surface below. */
  onCardExtraChange: (value: number) => void;
}

type Tab = 'overview' | 'calculations' | 'bom' | 'card' | 'winding' | 'core' | 'drawings' | 'reports' | 'manufacturing' | '3d-model' | 'budget' | 'compare';

const TABS: { id: Tab; label: string; pending?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'calculations', label: 'Calculations' },
  { id: 'bom', label: 'BOM & Cost' },
  { id: 'card', label: 'Cost Card' },
  { id: 'budget', label: 'Fit to Budget' },
  { id: 'compare', label: 'Compare & Quote' },
  { id: 'winding', label: 'Winding Design' },
  { id: 'core', label: 'Core Parts' },
  { id: 'drawings', label: '2D Drawings' },
  { id: 'reports', label: 'Reports & Docs' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: '3d-model', label: '3D CAD Model' },
];

function RateField({ label, k, rates, onRatesChange }: { label: string; k: string; rates: Record<string, number>; onRatesChange: (r: Record<string, number>) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">{label}</label>
      <input
        type="number"
        value={rates[k]}
        onChange={(e) => onRatesChange({ ...rates, [k]: Number(e.target.value) })}
        className="w-full bg-white border border-rule rounded-[2px] p-1.5 text-ink font-mono text-[10px] focus:outline-none focus:border-copper"
      />
    </div>
  );
}

const fmtSourceDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * TASKS.md item 11.4: "an engineering default must be visibly distinct from
 * a supplier quotation... they must never look alike in a document that
 * goes to a customer." A supplier-sourced or project-locked rate is a
 * filled, coloured badge -- a commitment someone made in writing. An
 * engineering default is a dashed outline in steel -- an estimate, nothing
 * more. Neither is print:hidden: the distinction has to survive into
 * whatever gets printed or exported, not just the screen.
 */
function PriceSourceBadge({ source }: { source: PriceResolution | undefined }) {
  if (!source) return null;
  if (source.tier === 'engineering-default') {
    return (
      <span
        className="inline-block font-display uppercase text-[8px] tracking-[0.1em] text-steel border border-dashed border-steel rounded-[2px] px-1 py-0.5"
        title="Engineering default -- an estimate, not a supplier quotation"
      >
        Est.
      </span>
    );
  }
  const fill = source.tier === 'project-locked' ? 'bg-copper' : 'bg-patina';
  const detail = source.tier === 'project-locked'
    ? 'Locked'
    : `${source.supplierName || 'Supplier'}${source.date ? `, ${fmtSourceDate(source.date)}` : ''}`;
  return (
    <span
      className={`inline-block font-display uppercase text-[8px] tracking-[0.1em] text-white ${fill} rounded-[2px] px-1 py-0.5`}
      title={`${PRICE_SOURCE_LABELS[source.tier]} -- a supplier's own commitment, not an estimate`}
    >
      {detail}
    </span>
  );
}

export function ResultsDisplay({
  core, design, bom, params, liveDesign, liveBom, liveParams, liveOver, project, rates, onRatesChange, effectiveRates,
  rateCard, onManageRateCards, pricingLocked, rateSources, priceLocks, onTogglePriceLock, itemsByRateKey,
  activePreviewKey, onSelectPreview, onCardExtraChange, orgId, projectId, revision,
}: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const generatePDF = () => window.print();

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const designId = `TDE-${params.kva}-${Math.round(params.hv / 1000)}-${params.lv}`;
  const sheet = calcSheet(design, bom);
  const totalMass = design.wCore + design.wLV + design.wHV + design.wIns
    + design.wFrame + design.wTank + design.wFin + design.wEnclosure
    + design.fluidLitres * design.fluid.dens;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col order-2 lg:order-1 min-w-0">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 print:hidden shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`font-display uppercase text-[11px] tracking-[0.14em] px-3 py-1.5 rounded-[2px] border transition-colors ${
                  activeTab === t.id
                    ? 'bg-plate border-plate text-plateTx'
                    : 'bg-transparent border-rule text-ink2'
                }`}
              >
                {t.label}{t.pending ? ' *' : ''}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="confirm" onClick={handleSaveToCloud} disabled={isSaving}>
              {saveSuccess ? 'Saved' : isSaving ? 'Saving' : 'Save'}
            </Button>
            <Button variant="primary" onClick={generatePDF}>PDF Report</Button>
          </div>
        </div>

        <div key={activeTab} className="flex-1 print:w-full space-y-4 animate-fade">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <Card title="Design Summary" subtitle={designId}>
                <DataRow label="Rating" value={String(params.kva)} unit="kVA" />
                <DataRow label="Duty" value={design.dry ? 'Dry type' : 'Oil immersed'} />
                <DataRow label="Cooling" value={params.cooling} />
              </Card>

              <Card title="01. Electromagnetic Core Design">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                  <DataRow label="Volts per Turn" value={design.et.toFixed(3)} unit="V" />
                  <DataRow label="Flux Density" value={design.B.toFixed(2)} unit="T" />
                  <DataRow label="Net Core Area" value={design.aNet.toFixed(1)} unit="cm²" />
                  <DataRow label="Core Diameter" value={design.dCore.toFixed(1)} unit="mm" />
                </div>
              </Card>

              <Card title="02. Winding Architecture">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-[0.14em] text-copper py-1">
                      HV, Layer Winding, {design.layers} Layers
                    </div>
                    <DataRow label="Voltage" value={String(params.hv)} unit="V" />
                    <DataRow label="Current" value={design.iHV.toFixed(1)} unit="A" />
                    <DataRow label="Turns" value={String(design.nHV)} />
                    <DataRow label="Conductor Area" value={design.aHVreq.toFixed(2)} unit="mm²" />
                  </div>
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-[0.14em] text-copper py-1">
                      LV, {design.lvTurnLayers === design.nLV ? 'Full-Height Foil' : `Helical, ${design.lvTurnLayers} Layers`}
                    </div>
                    <DataRow label="Voltage" value={String(params.lv)} unit="V" />
                    <DataRow label="Current" value={design.iLV.toFixed(1)} unit="A" />
                    <DataRow label="Turns" value={String(design.nLV)} />
                    <DataRow label="Conductor Area" value={design.aLVreq.toFixed(2)} unit="mm²" />
                  </div>
                </div>
              </Card>

              <Card title="Derived Only" subtitle="Class D, cannot be set directly">
                <DerivedRow label="Window Width" value={design.Ww.toFixed(1)} unit="mm" editInstead="conductor sizes, clearances and layers" />
                <DerivedRow
                  label={design.dry ? 'Enclosure Dimensions' : 'Tank Dimensions'}
                  value={`${Math.round(design.tankL)} x ${Math.round(design.tankW)} x ${Math.round(design.tankH)}`}
                  unit="mm"
                  editInstead="clearances, cooling type and core diameter"
                />
                <DerivedRow
                  label="Oil Quantity"
                  value={design.dry ? 'Not applicable, dry type' : Math.round(design.fluidLitres).toString()}
                  unit={design.dry ? undefined : 'L'}
                  editInstead="the tank size drivers above"
                />
                <DerivedRow label="Core Weight" value={Math.round(design.wCore).toString()} unit="kg" editInstead="flux density, K and steps" />
                <DerivedRow label="LV Winding Mass" value={Math.round(design.wLV).toString()} unit="kg" editInstead="the geometry driver" />
                <DerivedRow label="HV Winding Mass" value={Math.round(design.wHV).toString()} unit="kg" editInstead="the geometry driver" />
                <DerivedRow label="Insulation Mass" value={Math.round(design.wIns).toString()} unit="kg" editInstead="the geometry driver" />
                <DerivedRow label="Frame Mass" value={Math.round(design.wFrame).toString()} unit="kg" editInstead="the geometry driver" />
                <DerivedRow
                  label={design.dry ? 'Enclosure Mass' : 'Tank and Fin Mass'}
                  value={Math.round(design.dry ? design.wEnclosure : design.wTank + design.wFin).toString()}
                  unit="kg"
                  editInstead="the geometry driver"
                />
                <DerivedRow label="Total Mass" value={Math.round(totalMass).toString()} unit="kg" editInstead="the geometry driver" />
              </Card>

              <Card title="Compliance" subtitle={`${params.effLevel} loss schedule`}>
                <table className="w-full">
                  <thead>
                    <tr><th className={thCls}>Check</th><th className={`${thCls} text-right`}>Value</th><th className={`${thCls} text-right`}>Limit</th><th className={`${thCls} text-right`}>OK</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['No-Load Loss (W)', design.compliance.nll],
                      ['Load Loss (W)', design.compliance.ll],
                      ['Total Loss (W)', design.compliance.total],
                      ['Impedance (%)', design.compliance.z],
                      ['Top Rise (K)', design.compliance.rise],
                      ['Winding Rise (K)', design.compliance.wRise],
                      ['Ratio Error (%)', design.compliance.ratio],
                      ['Coil Height (mm)', design.compliance.coilHeight],
                      ['Tank Height (mm)', design.compliance.tankHeight],
                    ].map(([label, c]: [string, any]) => (
                      <tr key={label}>
                        <td className={`${tdCls} text-ink2 text-[11px]`}>{label}</td>
                        <td className={`${tdCls} text-right font-mono text-[11px] ${!c ? 'text-steel' : c.ok ? 'text-ink' : 'text-alert'}`}>{c ? c.val.toFixed(2) : '—'}</td>
                        <td className={`${tdCls} text-right font-mono text-[11px] text-steel`}>{c ? c.lim.toFixed(2) : 'not declared'}</td>
                        {/* section 84: a null check is NOT a tick -- nothing was assessed, and it says so */}
                        <td className={`${tdCls} text-right font-mono text-[11px]`}>{c ? <CheckMark ok={c.ok} /> : <span className="text-steel text-[10px]">n/a</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              {design.dualCompliance && (
                <Card title="Compliance, Second Rating" subtitle={`${params.kva2} kVA, ${params.cooling2}`}>
                  <table className="w-full">
                    <thead>
                      <tr><th className={thCls}>Check</th><th className={`${thCls} text-right`}>Value</th><th className={`${thCls} text-right`}>Limit</th><th className={`${thCls} text-right`}>OK</th></tr>
                    </thead>
                    <tbody>
                      {[
                        ['No-Load Loss (W)', design.dualCompliance.nll],
                        ['Load Loss (W)', design.dualCompliance.ll],
                        ['Total Loss (W)', design.dualCompliance.total],
                        [design.dry ? 'Winding Rise (K)' : 'Top Rise (K)', design.dualCompliance.rise],
                        ['Winding Rise (K)', design.dualCompliance.wRise],
                      ].map(([label, c]: [string, any]) => (
                        <tr key={label}>
                          <td className={`${tdCls} text-ink2 text-[11px]`}>{label}</td>
                        <td className={`${tdCls} text-right font-mono text-[11px] ${!c ? 'text-steel' : c.ok ? 'text-ink' : 'text-alert'}`}>{c ? c.val.toFixed(2) : '—'}</td>
                        <td className={`${tdCls} text-right font-mono text-[11px] text-steel`}>{c ? c.lim.toFixed(2) : 'not declared'}</td>
                        {/* section 84: a null check is NOT a tick -- nothing was assessed, and it says so */}
                        <td className={`${tdCls} text-right font-mono text-[11px]`}>{c ? <CheckMark ok={c.ok} /> : <span className="text-steel text-[10px]">n/a</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-steel px-1 pt-2">
                    The fin area above is sized so both ratings pass at once (packages/engine's
                    designTransformer, CALIBRATION.md section 21) -- this table is the second
                    rating's own check, not a duplicate of the first.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* CALCULATIONS -- calcSheet() is built exactly for this: every quantity
              with its formula, substitution, result and reference. */}
          {activeTab === 'calculations' && (
            <div className="space-y-4">
              {sheet.map((section: any) => (
                <Card key={section.title} title={section.title} subtitle={section.ref}>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className={thCls}>Quantity</th>
                        <th className={`${thCls} hidden lg:table-cell`}>Formula</th>
                        <th className={`${thCls} hidden xl:table-cell`}>Substitution</th>
                        <th className={`${thCls} text-right`}>Result</th>
                        <th className={`${thCls} hidden lg:table-cell`}>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((r: any, i: number) => (
                        <tr key={i}>
                          <td className={`${tdCls} text-[11px] text-ink2`}>{r.q} <span className="text-steel">({r.sym})</span></td>
                          <td className={`${tdCls} font-mono text-[10px] text-steel hidden lg:table-cell`}>{r.formula}</td>
                          <td className={`${tdCls} font-mono text-[10px] text-steel hidden xl:table-cell`}>{r.sub}</td>
                          <td className={`${tdCls} text-right font-mono text-[11px] font-semibold text-ink`}>{r.res}</td>
                          <td className={`${tdCls} text-[10px] text-steel hidden lg:table-cell`}>{r.ref}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ))}
            </div>
          )}

          {/* BOM & COST */}
          {activeTab === 'bom' && (
            <div className="space-y-4">
              {bom.warnings?.map((w: any) => (
                <div key={w.code} className="bg-white border border-alert rounded-[2px] px-4 py-3 print:hidden">
                  <div className="text-[11px] font-display uppercase tracking-[0.14em] text-alert mb-1">
                    {w.title}
                  </div>
                  <p className="text-[11px] text-ink2">{w.message}</p>
                </div>
              ))}
              {bom.segments.map((seg: any) => (
                <Card key={seg.title} title={seg.title} subtitle={inr(seg.total)}>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className={thCls}>Code</th><th className={thCls}>Description</th>
                        <th className={`${thCls} text-right`}>Quantity</th><th className={thCls}>Unit</th>
                        <th className={`${thCls} text-right`}>Rate (₹)</th>
                        <th className={thCls}>Source</th>
                        <th className={`${thCls} text-right`}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seg.rows.map((r: any) => {
                        const item = r.rk ? itemsByRateKey.get(r.rk) : undefined;
                        return (
                        <tr key={r.code}>
                          <td className={`${tdCls} font-mono text-[10px] text-steel`}>{r.code}</td>
                          <td className={`${tdCls} text-[11px] text-ink2`}>
                            {r.desc}
                            {item && (item.code || item.partNumber) && (
                              <div className="font-mono text-[9px] text-steel mt-0.5">
                                {item.code && <>item {item.code}</>}
                                {item.code && item.partNumber && ' · '}
                                {item.partNumber && <>part# {item.partNumber}</>}
                              </div>
                            )}
                          </td>
                          <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.qty.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</td>
                          <td className={`${tdCls} text-[10px] text-steel`}>{r.unit}</td>
                          <td className={`${tdCls} text-right font-mono text-[11px]`}>{fmtMoney(r.rate)}</td>
                          <td className={tdCls}>
                            {r.rk && (
                              <div className="flex items-center gap-1.5">
                                <PriceSourceBadge source={rateSources[r.rk]} />
                                {!pricingLocked && (
                                  <button
                                    type="button"
                                    onClick={() => onTogglePriceLock(r.rk)}
                                    className="text-[8px] font-display uppercase tracking-[0.08em] text-steel underline underline-offset-2"
                                  >
                                    {r.rk in priceLocks ? 'Unlock' : 'Lock'}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className={`${tdCls} text-right font-mono text-[11px] font-semibold text-ink`}>{fmtMoney(r.qty * r.rate)}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              ))}

              <Card title="Build-Up to Price">
                <div className="max-w-md">
                  <DataRow label="Material" value={inr(bom.material)} />
                  <DataRow label="Labour" value={inr(bom.labourCost)} />
                  <DataRow label="Scrap Allowance" value={inr(bom.scrap)} />
                  <DataRow label="Factory Cost" value={inr(bom.factory)} />
                  <DataRow label="Overhead" value={inr(bom.overhead)} />
                  <DataRow label="Freight" value={inr(bom.freight)} />
                  <DataRow label="Margin" value={inr(bom.margin)} />
                  <DataRow label="Ex-Works Price, Excludes GST" value={inr(bom.exFactory)} tone="copper" />
                  <DataRow label={`GST at ${rates.gstPct}%`} value={inr(bom.gst)} />
                  <DataRow label="Delivered Price, Includes GST" value={inr(bom.withGst)} tone="copper" />
                </div>
                <p className="text-[10px] font-body text-steel mt-3 pt-3 border-t border-line">
                  Not part of the quoted price, the cost of the guaranteed losses over {params.years} years
                  at {inr(params.tariff)}/kWh, {(params.loadFactor * 100).toFixed(0)}% load factor: {inr(bom.energy.total)}.
                  Total cost of ownership, ex-works plus life-cycle losses: {inr(bom.tco)}.
                </p>
              </Card>
            </div>
          )}

          {/* COST CARD -- CALIBRATION.md section 9, additive alongside BOM &
              Cost above, not a replacement. Follows design/params/rates the
              same as every other tab (whatever is on screen, including a
              previewed budget option or a viewed revision), unlike Fit to
              Budget below which deliberately always uses the live ones. */}
          {activeTab === 'card' && (
            <CostCardTab design={design} params={params} rates={effectiveRates} onCardExtraChange={onCardExtraChange} readOnly={pricingLocked} />
          )}

          {/* FIT TO BUDGET -- searches and previews against the live design,
              never the currently previewed one, see ResultsDisplayProps note. */}
          {activeTab === 'budget' && (
            <BudgetTab
              design={liveDesign} bom={liveBom} params={liveParams} over={liveOver} rates={effectiveRates}
              activePreviewKey={activePreviewKey} onSelectPreview={onSelectPreview}
            />
          )}

          {/* COMPARE & QUOTE -- current working design (liveDesign/liveBom) vs
              whatever is currently previewed (design/bom/params, which equal
              the live ones when nothing is previewed -- the tab shows a
              placeholder in that case instead of comparing a design to itself). */}
          {activeTab === 'compare' && (
            <CompareQuoteTab
              liveDesign={liveDesign} liveBom={liveBom}
              design={design} bom={bom} params={params}
              activePreviewKey={activePreviewKey}
            />
          )}

          {/* WINDING DESIGN -- design.* fields directly */}
          {activeTab === 'winding' && (
            <div className="space-y-4">
              <Card title="HV Winding" subtitle={`Layer winding, ${design.layers} layers`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                  <DataRow label="Voltage" value={String(params.hv)} unit="V" />
                  <DataRow label="Current" value={design.iHV.toFixed(2)} unit="A" />
                  <DataRow label="Turns, Normal Tap" value={String(design.nHV)} />
                  <DataRow label="Turns, Extreme Tap" value={String(design.nHVmax)} />
                  <DataRow label="Conductor Area" value={design.aHVreq.toFixed(2)} unit="mm²" />
                  <DataRow label="Conductor Section" value={`${design.axHV.toFixed(1)} x ${design.rdHV.toFixed(1)}`} unit="mm" />
                  <DataRow label="Turns per Layer" value={String(design.turnsPerLayer)} />
                  <DataRow label="Volts per Layer" value={Math.round(design.voltsPerLayer).toString()} unit="V" />
                  <DataRow label="Inner Diameter" value={Math.round(design.hvID).toString()} unit="mm" />
                  <DataRow label="Outer Diameter" value={Math.round(design.hvOD).toString()} unit="mm" />
                  <DataRow label="Mean Turn Length" value={design.lmtHV.toFixed(3)} unit="m" />
                  <DataRow label="Resistance" value={design.rHV.toFixed(4)} unit="ohm" />
                  <DataRow label="I2R Loss" value={Math.round(design.i2rHV).toString()} unit="W" />
                </div>
              </Card>

              <Card title="LV Winding" subtitle={design.lvTurnLayers === design.nLV ? 'Full-height foil' : `Helical, ${design.lvTurnLayers} layers`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                  <DataRow label="Voltage" value={String(params.lv)} unit="V" />
                  <DataRow label="Current" value={design.iLV.toFixed(1)} unit="A" />
                  <DataRow label="Turns" value={String(design.nLV)} />
                  <DataRow label="Conductor Area" value={design.aLVreq.toFixed(2)} unit="mm²" />
                  <DataRow label="Foil" value={`${design.tLV.toFixed(2)} x ${Math.round(design.foilW)}`} unit="mm" />
                  <DataRow label="Radial Layers" value={String(design.lvTurnLayers)} />
                  <DataRow label="Inner Diameter" value={Math.round(design.lvID).toString()} unit="mm" />
                  <DataRow label="Outer Diameter" value={Math.round(design.lvOD).toString()} unit="mm" />
                  <DataRow label="Mean Turn Length" value={design.lmtLV.toFixed(3)} unit="m" />
                  <DataRow label="Resistance" value={design.rLV.toExponential(3)} unit="ohm" />
                  <DataRow label="I2R Loss" value={Math.round(design.i2rLV).toString()} unit="W" />
                </div>
              </Card>

              <Card title="Tappings">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                  <DataRow label="Tap Type" value={params.tapType === 'oltc' ? 'On-load' : params.tapType === 'octc' ? 'Off-circuit' : 'None'} />
                  <DataRow label="Tap Positions" value={String(design.tapSteps)} />
                  <DataRow label="Turns per Step" value={design.turnsPerStep.toFixed(2)} />
                  <DataRow label="Ratio Error" value={design.ratioErr.toFixed(4)} unit="%" tone={Math.abs(design.ratioErr) <= 0.5 ? 'ink' : 'alert'} />
                </div>
              </Card>

              <Card title="Insulation">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                  <DataRow label="Cylinder Thickness" value={params.cylThk.toFixed(1)} unit="mm" />
                  <DataRow label="HV Interlayer" value={params.hvInterlayer.toFixed(1)} unit="mm" />
                  <DataRow label="HV Paper Covering" value={params.hvPaper.toFixed(2)} unit="mm" />
                  <DataRow label="LV Interturn" value={params.lvIns.toFixed(2)} unit="mm" />
                  <DataRow label="HV Ducts" value={String(design.hvDucts)} />
                </div>
              </Card>

              {/* DRAWINGS.md, "Where each drawing appears": drawings 8, 9, 10
                  and the coil half-section from 20 -- the same components the
                  2D Drawings tab renders, reused here rather than rebuilt. */}
              <LvWindingDrawing design={design} params={params} project={project} />
              <HvWindingDrawing design={design} params={params} project={project} />
              <TapWindingDrawing design={design} params={params} project={project} />
              <InternalAssemblyDrawing design={design} params={params} project={project} />
            </div>
          )}

          {/* CORE PARTS -- design.* fields directly */}
          {activeTab === 'core' && (
            <div className="space-y-4">
              <Card title="Core Geometry" subtitle={design.shape === 'circ' ? 'Circular stepped' : 'Rectangular / wound'}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                  {design.shape === 'circ' ? (
                    <DataRow label="Core Diameter" value={design.dCore.toFixed(1)} unit="mm" />
                  ) : (
                    <DataRow label="Limb Section" value={`${design.coreW.toFixed(1)} x ${design.coreD.toFixed(1)}`} unit="mm" />
                  )}
                  <DataRow label="Net Core Area" value={design.aNet.toFixed(1)} unit="cm²" />
                  <DataRow label="Gross Core Area" value={design.aGross.toFixed(1)} unit="cm²" />
                  <DataRow label="Window Height" value={Math.round(design.Hw).toString()} unit="mm" />
                  <DataRow label="Window Width" value={Math.round(design.Ww).toString()} unit="mm" />
                  <DataRow label="Limb Centre Distance" value={Math.round(design.cc).toString()} unit="mm" />
                  <DataRow label="Core Height, Overall" value={Math.round(design.coreHeight).toString()} unit="mm" />
                  <DataRow label="Core Width, Overall" value={Math.round(design.coreWidth).toString()} unit="mm" />
                  <DataRow label="Yoke Depth" value={Math.round(design.yokeDepth).toString()} unit="mm" />
                </div>
              </Card>

              <Card title="Core Steel and Excitation" subtitle={design.grade.name}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                  <DataRow label="Joint Construction" value={design.ct.name.split(',')[0]} />
                  <DataRow label="Flux Density" value={design.B.toFixed(2)} unit="T" />
                  <DataRow label="Building Factor" value={params.buildFactor.toFixed(2)} />
                  <DataRow label="Specific Core Loss" value={design.wPerKg.toFixed(3)} unit="W/kg" />
                  <DataRow label="No-Load Loss" value={Math.round(design.noLoad).toString()} unit="W" tone="copper" />
                  <DataRow label="Exciting VA" value={design.vaPerKg.toFixed(2)} unit="VA/kg" />
                  <DataRow label="No-Load Current" value={design.i0pct.toFixed(2)} unit="%" />
                  <DataRow label="Sound Level" value={Math.round(design.noise).toString()} unit="dB(A)" />
                </div>
              </Card>

              {/* DRAWINGS.md, "Where each drawing appears": drawings 6, 7 and
                  21 -- the same components the 2D Drawings tab renders,
                  reused here rather than rebuilt. */}
              <CoreDrawing design={design} params={params} project={project} />
              <CoreCrossSection design={design} params={params} project={project} />
              <StampingSchedule design={design} params={params} project={project} />
            </div>
          )}
          {activeTab === 'drawings' && <Drawings2D design={design} params={params} project={project} />}
          {activeTab === 'reports' && (
            <DocumentsTab
              core={core} design={design} bom={bom} params={params} project={project}
              orgId={orgId} projectId={projectId} revision={revision}
            />
          )}
          {activeTab === 'manufacturing' && <ManufacturingTab design={design} params={params} />}
          {activeTab === '3d-model' && <CadViewerTab design={design} params={params} />}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-[320px] shrink-0 order-1 lg:order-2 flex flex-col gap-4 print:hidden">
        <Card title="Performance Metrics">
          <DataRow label="No-Load Loss" value={String(Math.round(design.noLoad))} unit="W" />
          <DataRow label="Load Loss" value={String(Math.round(design.loadLoss))} unit="W" />
          <DataRow label="Impedance" value={design.pctZ.toFixed(2)} unit="%" tone={design.compliance.z.ok ? 'ink' : 'alert'} />
          <DataRow label="Target Impedance" value={params.targetZ.toFixed(2)} unit="%" />
          {/* CALIBRATION.md section 86: the explanation belongs where the number
              is read. A customer seeing 4.80 against a declared 5.00 asks why
              here, not in a banner at the top of a different tab. */}
          {design.windowNote && (
            <p className="text-[10px] text-ink2 leading-snug py-1.5 border-t border-dashed border-line">
              <span className={design.windowStraddle ? 'text-alert' : 'text-amber'}>
                {design.windowStraddle ? 'Declared impedance is not achievable. ' : 'Declared impedance is not exactly achievable. '}
              </span>
              {design.windowNote}
            </p>
          )}
          <DataRow label="Efficiency, Full Load" value={design.eff100.toFixed(2)} unit="%" />
          <DataRow label="Current Density, LV" value={design.dLV.toFixed(2)} unit="A/mm²" />
          <DataRow label="Current Density, HV" value={design.dHV.toFixed(2)} unit="A/mm²" />
        </Card>

        <div className={cardCls}>
          <div className={cardHeaderCls}>
            <span className={cardTitleCls}>Price</span>
            {/* CALIBRATION.md section 83: three states, never green when nothing
                was assessed. "Compliant" on an unassessed design is the most
                dangerous label this product can print. */}
            <span className={cardSubtitleCls}>
              {design.complianceState === 'failed' ? 'Not Compliant'
                : design.complianceState === 'notAssessed' ? 'Not Assessed'
                : 'Compliant'}
            </span>
          </div>
          <div className={cardBodyCls}>
            <div className="py-1.5">
              <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">Ex-Works, Excludes GST</div>
              <div className="font-mono text-[20px] font-semibold text-copper">{inr(bom.exFactory)}</div>
            </div>
            <div className="py-1.5 border-t border-dashed border-line">
              <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">Delivered, Includes GST</div>
              <div className={`font-mono text-[18px] font-semibold ${design.complianceState === 'passed' ? 'text-good' : design.complianceState === 'notAssessed' ? 'text-amber' : 'text-alert'}`}>{inr(bom.withGst)}</div>
            </div>
          </div>
        </div>

        <Card
          title="Rate Card"
          subtitle={rateCard ? rateCard.name : 'No Rate Card Resolved'}
        >
          <p className="text-[10px] font-body text-steel mb-2">
            {pricingLocked
              ? 'What is on screen is not the live design -- return to it before changing rates or switching cards.'
              : rateCard
                ? `Effective from ${new Date(rateCard.effectiveFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}. Editing below only changes this design's live price -- it does not change the saved rate card.`
                : 'This price is not backed by a saved rate card -- open Manage Rate Cards to select or create one.'}
          </p>
          <div className={`grid grid-cols-2 gap-2 pt-1 ${pricingLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <RateField label="Core, ₹/kg" k="core" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Copper, ₹/kg" k="condCu" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Aluminium, ₹/kg" k="condAl" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Fluid, ₹/L" k="fluid" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Margin, %" k="marginPct" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="GST, %" k="gstPct" rates={rates} onRatesChange={onRatesChange} />
          </div>
          <div className="pt-2">
            <Button variant="secondary" onClick={onManageRateCards} disabled={pricingLocked}>Manage Rate Cards</Button>
          </div>
        </Card>
      </aside>
    </div>
  );
}
