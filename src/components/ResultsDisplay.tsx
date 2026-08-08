import React, { useState } from 'react';
import { calcSheet, inr } from '@/packages/engine';
import { FileText, CheckCircle2, XCircle, CloudUpload } from 'lucide-react';

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
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
      {label} still reads the old engine's output shape and has not been rewired to computeDesign() yet.
    </div>
  );
}

function Stat({ label, value, unit, tone = 'slate' }: { label: string; value: string; unit?: string; tone?: 'slate' | 'blue' | 'emerald' | 'red' }) {
  const toneCls: Record<string, string> = {
    slate: 'text-slate-900', blue: 'text-blue-600', emerald: 'text-emerald-600', red: 'text-red-600',
  };
  return (
    <div className="flex flex-col">
      <span className="text-slate-500 text-xs mb-1 uppercase tracking-wide">{label}</span>
      <span className={`font-semibold ${toneCls[tone]}`}>
        {value}{unit && <span className="text-sm text-slate-500 font-normal ml-1">{unit}</span>}
      </span>
    </div>
  );
}

function RateField({ label, k, rates, onRatesChange }: { label: string; k: string; rates: Record<string, number>; onRatesChange: (r: Record<string, number>) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type="number"
        value={rates[k]}
        onChange={(e) => onRatesChange({ ...rates, [k]: Number(e.target.value) })}
        className="w-full bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col order-2 lg:order-1">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 print:hidden shrink-0">
          <div className="flex gap-2 border-b border-slate-200 w-full sm:w-auto overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`pb-3 px-1 uppercase tracking-wide text-xs font-bold transition-colors whitespace-nowrap ${activeTab === t.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {t.label}{t.pending ? ' *' : ''}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-4 py-2 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
            >
              {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <CloudUpload className="w-4 h-4" />}
              {saveSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold uppercase rounded-md shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4" /> PDF Report
            </button>
          </div>
        </div>

        <div className="flex-1 print:w-full">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-1">{params.kva} kVA Transformer Design</h2>
                <p className="text-slate-500 text-sm">
                  Design ID: {designId} • Three phase • {design.dry ? 'Dry type' : 'Oil immersed'}, {params.cooling}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-blue-600 text-xs tracking-wider mb-4 font-bold uppercase">01. Electromagnetic Core Design</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <Stat label="Volts per Turn (Et)" value={design.et.toFixed(3)} unit="V" />
                  <Stat label="Flux Density (B)" value={design.B.toFixed(2)} unit="T" />
                  <Stat label="Net Core Area" value={design.aNet.toFixed(1)} unit="cm²" />
                  <Stat label="Core Diameter" value={design.dCore.toFixed(1)} unit="mm" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-blue-600 text-xs tracking-wider mb-4 font-bold uppercase">02. Winding Architecture</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="font-semibold text-slate-800 border-b border-slate-100 pb-2">
                      HV Winding <span className="text-slate-500 text-sm font-normal ml-2">(Layer winding, {design.layers} layers)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Stat label="Voltage" value={String(params.hv)} unit="V" />
                      <Stat label="Current" value={design.iHV.toFixed(1)} unit="A" />
                      <Stat label="Turns" value={String(design.nHV)} />
                      <Stat label="Cond. Area" value={design.aHVreq.toFixed(2)} unit="mm²" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="font-semibold text-slate-800 border-b border-slate-100 pb-2">
                      LV Winding <span className="text-slate-500 text-sm font-normal ml-2">({design.lvTurnLayers === design.nLV ? 'Full-height foil' : `Helical, ${design.lvTurnLayers} layers`})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Stat label="Voltage" value={String(params.lv)} unit="V" />
                      <Stat label="Current" value={design.iLV.toFixed(1)} unit="A" />
                      <Stat label="Turns" value={String(design.nLV)} />
                      <Stat label="Cond. Area" value={design.aLVreq.toFixed(2)} unit="mm²" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl text-white">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-3 font-bold flex items-center justify-between">
                  <span>Compliance against the {params.effLevel} loss schedule</span>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${design.compliant ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {design.compliant ? 'Compliant' : 'Not compliant'}
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-slate-400 uppercase text-[10px]">
                    <tr><th className="text-left py-1 px-2">Check</th><th className="text-right py-1 px-2">Value</th><th className="text-right py-1 px-2">Limit</th><th className="text-right py-1 px-2">OK</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {[
                      ['No-load loss (W)', design.compliance.nll],
                      ['Load loss (W)', design.compliance.ll],
                      ['Total loss (W)', design.compliance.total],
                      ['Impedance (%)', design.compliance.z],
                      ['Top rise (K)', design.compliance.rise],
                      ['Winding rise (K)', design.compliance.wRise],
                      ['Ratio error (%)', design.compliance.ratio],
                    ].map(([label, c]: [string, any]) => (
                      <tr key={label}>
                        <td className="py-1.5 px-2 text-slate-300">{label}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-white">{c.val.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-500">{c.lim.toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-right">
                          {c.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" /> : <XCircle className="w-3.5 h-3.5 text-red-400 inline" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CALCULATIONS -- calcSheet() is built exactly for this: every quantity
              with its formula, substitution, result and reference. */}
          {activeTab === 'calculations' && (
            <div className="space-y-6">
              {sheet.map((section: any) => (
                <div key={section.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-baseline justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-800">{section.title}</h3>
                    <span className="text-[10px] text-slate-400">{section.ref}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                      <tr>
                        <th className="py-1.5 px-2 text-left">Quantity</th>
                        <th className="py-1.5 px-2 text-left hidden lg:table-cell">Formula</th>
                        <th className="py-1.5 px-2 text-left hidden xl:table-cell">Substitution</th>
                        <th className="py-1.5 px-2 text-right">Result</th>
                        <th className="py-1.5 px-2 text-left hidden lg:table-cell">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {section.rows.map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="py-1.5 px-2 text-slate-600">{r.q} <span className="text-slate-400">({r.sym})</span></td>
                          <td className="py-1.5 px-2 font-mono text-slate-500 hidden lg:table-cell">{r.formula}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-400 hidden xl:table-cell">{r.sub}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-semibold text-slate-900">{r.res}</td>
                          <td className="py-1.5 px-2 text-slate-400 hidden lg:table-cell">{r.ref}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* BOM & COST */}
          {activeTab === 'bom' && (
            <div className="space-y-6">
              {bom.segments.map((seg: any) => (
                <div key={seg.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">{seg.title}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-2">Code</th><th className="px-4 py-2">Description</th>
                          <th className="px-4 py-2 text-right">Quantity</th><th className="px-4 py-2">Unit</th>
                          <th className="px-4 py-2 text-right">Rate (₹)</th><th className="px-4 py-2 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {seg.rows.map((r: any) => (
                          <tr key={r.code} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
                            <td className="px-4 py-2">{r.desc}</td>
                            <td className="px-4 py-2 text-right font-mono">{r.qty.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{r.unit}</td>
                            <td className="px-4 py-2 text-right font-mono">{Math.round(r.rate).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900">{Math.round(r.qty * r.rate).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                        <tr><td colSpan={5} className="px-4 py-3 text-right uppercase text-xs tracking-wider">Segment Total</td>
                          <td className="px-4 py-3 text-right font-mono text-blue-700">{inr(seg.total)}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Build-up to Price</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm max-w-md">
                  <span className="text-slate-500">Material</span><span className="text-right font-mono">{inr(bom.material)}</span>
                  <span className="text-slate-500">Labour</span><span className="text-right font-mono">{inr(bom.labourCost)}</span>
                  <span className="text-slate-500">Scrap allowance</span><span className="text-right font-mono">{inr(bom.scrap)}</span>
                  <span className="text-slate-600 font-semibold border-t border-slate-100 pt-2">Factory cost</span><span className="text-right font-mono font-semibold border-t border-slate-100 pt-2">{inr(bom.factory)}</span>
                  <span className="text-slate-500">Overhead</span><span className="text-right font-mono">{inr(bom.overhead)}</span>
                  <span className="text-slate-500">Freight</span><span className="text-right font-mono">{inr(bom.freight)}</span>
                  <span className="text-slate-500">Margin</span><span className="text-right font-mono">{inr(bom.margin)}</span>
                  <span className="text-blue-700 font-bold border-t border-slate-200 pt-2">Ex-works price (excl. GST)</span>
                  <span className="text-right font-mono font-bold text-blue-700 border-t border-slate-200 pt-2">{inr(bom.exFactory)}</span>
                  <span className="text-slate-500">GST @ {rates.gstPct}%</span><span className="text-right font-mono">{inr(bom.gst)}</span>
                  <span className="text-emerald-700 font-bold border-t border-slate-200 pt-2">Delivered price (incl. GST)</span>
                  <span className="text-right font-mono font-bold text-emerald-700 border-t border-slate-200 pt-2">{inr(bom.withGst)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                  Not part of the quoted price — cost of the guaranteed losses over {params.years} years
                  at ₹{params.tariff}/kWh, {(params.loadFactor * 100).toFixed(0)}% load factor: {inr(bom.energy.total)}.
                  Total cost of ownership (ex-works + life-cycle losses): {inr(bom.tco)}.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'winding' && <Pending label="Winding Design" />}
          {activeTab === 'core' && <Pending label="Core Parts" />}
          {activeTab === 'reports' && <Pending label="Reports & Docs" />}
          {activeTab === '3d-model' && <Pending label="3D CAD Model" />}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-[320px] order-1 lg:order-2 flex flex-col gap-6 print:hidden">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-5">Performance Metrics</h2>
          <div className="space-y-5">
            <div className="flex justify-between items-end border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">No-Load Loss</div>
                <div className="text-xl font-semibold text-slate-900">{Math.round(design.noLoad)} <span className="text-sm text-slate-500 font-normal">W</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase">Load Loss</div>
                <div className="text-sm font-medium text-slate-700">{Math.round(design.loadLoss)} W</div>
              </div>
            </div>
            <div className="flex justify-between items-end border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Impedance</div>
                <div className="text-xl font-semibold text-slate-900">{design.pctZ.toFixed(2)} <span className="text-sm text-slate-500 font-normal">%</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase">Target</div>
                <div className="text-sm font-medium text-slate-700">{params.targetZ.toFixed(2)}%</div>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Efficiency, full load</div>
                <div className="text-xl font-semibold text-emerald-600">{design.eff100.toFixed(2)}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase">Current Dens. LV/HV</div>
                <div className="text-sm font-medium text-slate-700">{design.dLV.toFixed(2)} / {design.dHV.toFixed(2)} A/mm²</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${design.compliant ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <h2 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-5">Price (INR)</h2>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Ex-works — excludes GST</div>
              <div className="text-2xl font-bold text-blue-600 font-mono">{inr(bom.exFactory)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Delivered — includes GST</div>
              <div className="text-xl font-bold text-emerald-600 font-mono">{inr(bom.withGst)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xs font-bold text-slate-800 tracking-wide uppercase mb-1">Rate Card</h2>
          <p className="text-[10px] text-slate-400 mb-4">
            Session-only, seeded from DEFAULT_RATES. Full rate-card CRUD (orgs/rateCards) is TASKS.md item 4.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RateField label="Core ₹/kg" k="core" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Copper ₹/kg" k="condCu" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Aluminium ₹/kg" k="condAl" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Fluid ₹/L" k="fluid" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="Margin %" k="marginPct" rates={rates} onRatesChange={onRatesChange} />
            <RateField label="GST %" k="gstPct" rates={rates} onRatesChange={onRatesChange} />
          </div>
        </div>
      </aside>
    </div>
  );
}
