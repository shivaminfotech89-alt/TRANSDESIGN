import React, { useState } from 'react';
import { calcSheet, inr } from '@/packages/engine';
import { Card, DataRow, DerivedRow, CheckMark, Button, cardCls, cardHeaderCls, cardTitleCls, cardSubtitleCls, cardBodyCls, thCls, tdCls } from './ui';

interface ResultsDisplayProps {
  design: any;
  bom: any;
  params: any;
  rates: Record<string, number>;
  onRatesChange: (rates: Record<string, number>) => void;
}

type Tab = 'overview' | 'calculations' | 'bom' | 'winding' | 'core' | 'reports' | '3d-model';

const TABS: { id: Tab; label: string; pending?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'calculations', label: 'Calculations' },
  { id: 'bom', label: 'BOM & Cost' },
  { id: 'winding', label: 'Winding Design', pending: true },
  { id: 'core', label: 'Core Parts', pending: true },
  { id: 'reports', label: 'Reports & Docs', pending: true },
  { id: '3d-model', label: '3D CAD Model', pending: true },
];

function Pending({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-rule rounded-[2px] bg-white p-8 text-center text-[11px] font-body text-steel">
      {label} still reads the old engine's output shape and has not been rewired to computeDesign yet.
    </div>
  );
}

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

export function ResultsDisplay({ design, bom, params, rates, onRatesChange }: ResultsDisplayProps) {
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
                    ].map(([label, c]: [string, any]) => (
                      <tr key={label}>
                        <td className={`${tdCls} text-ink2 text-[11px]`}>{label}</td>
                        <td className={`${tdCls} text-right font-mono text-[11px] ${c.ok ? 'text-ink' : 'text-alert'}`}>{c.val.toFixed(2)}</td>
                        <td className={`${tdCls} text-right font-mono text-[11px] text-steel`}>{c.lim.toFixed(2)}</td>
                        <td className={`${tdCls} text-right font-mono text-[11px]`}><CheckMark ok={c.ok} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
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
              {bom.segments.map((seg: any) => (
                <Card key={seg.title} title={seg.title} subtitle={inr(seg.total)}>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className={thCls}>Code</th><th className={thCls}>Description</th>
                        <th className={`${thCls} text-right`}>Quantity</th><th className={thCls}>Unit</th>
                        <th className={`${thCls} text-right`}>Rate (₹)</th><th className={`${thCls} text-right`}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seg.rows.map((r: any) => (
                        <tr key={r.code}>
                          <td className={`${tdCls} font-mono text-[10px] text-steel`}>{r.code}</td>
                          <td className={`${tdCls} text-[11px] text-ink2`}>{r.desc}</td>
                          <td className={`${tdCls} text-right font-mono text-[11px]`}>{r.qty.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</td>
                          <td className={`${tdCls} text-[10px] text-steel`}>{r.unit}</td>
                          <td className={`${tdCls} text-right font-mono text-[11px]`}>{Math.round(r.rate).toLocaleString('en-IN')}</td>
                          <td className={`${tdCls} text-right font-mono text-[11px] font-semibold text-ink`}>{Math.round(r.qty * r.rate).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
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

          {activeTab === 'winding' && <Pending label="Winding Design" />}
          {activeTab === 'core' && <Pending label="Core Parts" />}
          {activeTab === 'reports' && <Pending label="Reports & Docs" />}
          {activeTab === '3d-model' && <Pending label="3D CAD Model" />}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-[320px] shrink-0 order-1 lg:order-2 flex flex-col gap-4 print:hidden">
        <Card title="Performance Metrics">
          <DataRow label="No-Load Loss" value={String(Math.round(design.noLoad))} unit="W" />
          <DataRow label="Load Loss" value={String(Math.round(design.loadLoss))} unit="W" />
          <DataRow label="Impedance" value={design.pctZ.toFixed(2)} unit="%" tone={design.compliance.z.ok ? 'ink' : 'alert'} />
          <DataRow label="Target Impedance" value={params.targetZ.toFixed(2)} unit="%" />
          <DataRow label="Efficiency, Full Load" value={design.eff100.toFixed(2)} unit="%" />
          <DataRow label="Current Density, LV" value={design.dLV.toFixed(2)} unit="A/mm²" />
          <DataRow label="Current Density, HV" value={design.dHV.toFixed(2)} unit="A/mm²" />
        </Card>

        <div className={cardCls}>
          <div className={cardHeaderCls}>
            <span className={cardTitleCls}>Price</span>
            <span className={cardSubtitleCls}>{design.compliant ? 'Compliant' : 'Not Compliant'}</span>
          </div>
          <div className={cardBodyCls}>
            <div className="py-1.5">
              <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">Ex-Works, Excludes GST</div>
              <div className="font-mono text-[20px] font-semibold text-copper">{inr(bom.exFactory)}</div>
            </div>
            <div className="py-1.5 border-t border-dashed border-line">
              <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">Delivered, Includes GST</div>
              <div className={`font-mono text-[18px] font-semibold ${design.compliant ? 'text-good' : 'text-alert'}`}>{inr(bom.withGst)}</div>
            </div>
          </div>
        </div>

        <Card title="Rate Card" subtitle="Session Only">
          <p className="text-[10px] font-body text-steel mb-2">
            Seeded from DEFAULT_RATES. Full rate-card management is TASKS.md item 4.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <RateField label="Core, ₹/kg" k="core" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Copper, ₹/kg" k="condCu" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Aluminium, ₹/kg" k="condAl" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Fluid, ₹/L" k="fluid" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Margin, %" k="marginPct" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="GST, %" k="gstPct" rates={rates} onRatesChange={onRatesChange} />
          </div>
        </Card>
      </aside>
    </div>
  );
}
