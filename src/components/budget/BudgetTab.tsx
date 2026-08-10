import React, { useMemo, useState } from 'react';
import { searchDesigns, CORE_GRADES, CONDUCTORS, inr } from '@/packages/engine';
import { Card, Button, thCls, tdCls, inputCls, labelCls } from '../ui';

interface BudgetTabProps {
  /** The live design being edited -- never the previewed one. The search
   *  anchors on it and every "current design" comparison is against it,
   *  regardless of what the rest of the app is currently previewing. */
  design: any;
  bom: any;
  params: any;
  rates: Record<string, number>;
  activePreviewKey: string | null;
  onSelectPreview: (candidate: any | null) => void;
}

/** Same dedup key searchDesigns() itself uses to collapse near-duplicate
 *  candidates, reused here only to tell "is this row the previewed one."
 *  Exported so App.tsx can compute the same key for whatever candidate it
 *  is currently previewing, without a second source of truth for identity. */
export function candidateKey(r: any): string {
  return [r.inputs.coreType, r.inputs.coreGrade, r.inputs.condLV, r.inputs.tankType,
    r.d.B.toFixed(2), r.d.dLV.toFixed(2), r.d.dHV.toFixed(2)].join('|');
}

function describeCandidate(r: any): string {
  const grade = CORE_GRADES[r.inputs.coreGrade]?.name.split(',')[0] || r.inputs.coreGrade;
  const tank = r.inputs.tankType === 'fin' ? 'Fin tank' : 'Radiator tank';
  return `${grade} · ${r.d.B.toFixed(2)} T · ${tank}`;
}

function ResultRow({ r, current, activePreviewKey, onSelectPreview, showMaterial }: {
  r: any; current: any; activePreviewKey: string | null;
  onSelectPreview: (c: any | null) => void; showMaterial: boolean;
}) {
  const key = candidateKey(r);
  const isPreviewed = key === activePreviewKey;
  const diff = r.price - current.bom.exFactory;
  return (
    <tr className={isPreviewed ? 'bg-sheetAlt' : ''}>
      {showMaterial && <td className={`${tdCls} text-[11px] text-ink2`}>{CONDUCTORS[r.inputs.condLV]?.short || r.inputs.condLV}</td>}
      <td className={`${tdCls} text-[10px] text-steel`}>{describeCandidate(r)}</td>
      <td className={`${tdCls} text-right font-mono text-[11px] text-ink`}>{inr(r.price)}</td>
      <td className={`${tdCls} text-right font-mono text-[11px] text-ink hidden md:table-cell`}>{inr(r.bom.withGst)}</td>
      <td className={`${tdCls} text-right font-mono text-[11px] text-steel hidden lg:table-cell`}>{Math.round(r.d.noLoad)} W</td>
      <td className={`${tdCls} text-right font-mono text-[11px] text-steel hidden lg:table-cell`}>{Math.round(r.d.loadLoss)} W</td>
      <td className={`${tdCls} text-right font-mono text-[11px] text-steel hidden xl:table-cell`}>{inr(r.tco)}</td>
      <td className={`${tdCls} text-right font-mono text-[11px] ${diff <= 0 ? 'text-good' : 'text-ink'}`}>
        {diff <= 0 ? '-' : '+'}{inr(Math.abs(diff))}
      </td>
      <td className={`${tdCls} text-right`}>
        <Button variant={isPreviewed ? 'confirm' : 'secondary'} onClick={() => onSelectPreview(isPreviewed ? null : r)}>
          {isPreviewed ? 'Previewing' : 'Preview'}
        </Button>
      </td>
    </tr>
  );
}

function ResultsTable({ rows, current, activePreviewKey, onSelectPreview, showMaterial, emptyNote }: {
  rows: any[]; current: any; activePreviewKey: string | null;
  onSelectPreview: (c: any | null) => void; showMaterial: boolean; emptyNote: string;
}) {
  if (!rows.length) {
    return <p className="text-[11px] text-steel px-1 py-2">{emptyNote}</p>;
  }
  return (
    <table className="w-full">
      <thead>
        <tr>
          {showMaterial && <th className={thCls}>Material</th>}
          <th className={thCls}>Design</th>
          <th className={`${thCls} text-right`}>Ex-Works</th>
          <th className={`${thCls} text-right hidden md:table-cell`}>Delivered</th>
          <th className={`${thCls} text-right hidden lg:table-cell`}>No-Load</th>
          <th className={`${thCls} text-right hidden lg:table-cell`}>Load Loss</th>
          <th className={`${thCls} text-right hidden xl:table-cell`}>20-Yr Ownership</th>
          <th className={`${thCls} text-right`}>Vs Current</th>
          <th className={thCls}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <ResultRow key={candidateKey(r)} r={r} current={current} activePreviewKey={activePreviewKey}
            onSelectPreview={onSelectPreview} showMaterial={showMaterial} />
        ))}
      </tbody>
    </table>
  );
}

export function BudgetTab({ design, bom, params, rates, activePreviewKey, onSelectPreview }: BudgetTabProps) {
  const current = { design, bom, params };
  const [minLakh, setMinLakh] = useState(() => Math.max(0, Math.round((bom.exFactory / 1e5 - 2) * 100) / 100));
  const [maxLakh, setMaxLakh] = useState(() => Math.round((bom.exFactory / 1e5) * 100) / 100);
  const [band, setBand] = useState<{ min: number; max: number } | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const runSearch = () => {
    const b = { min: minLakh * 1e5, max: maxLakh * 1e5 };
    const opts = {
      grades: Object.keys(CORE_GRADES),
      conds: Object.keys(CONDUCTORS),
      tanks: params.dry ? [params.tankType] : ['fin', 'radiator'],
      cores: [params.coreType],
      allowHotter: false,
      zTol: params.zTol,
      enforceLimits: true,
    };
    setResults(searchDesigns(params, rates, b, opts));
    setBand(b);
  };

  const feasible = useMemo(() => results.filter((r) => r.feasible), [results]);
  const inBand = useMemo(() => feasible.filter((r) => r.withinBudget), [feasible]);
  const sameMaterial = useMemo(
    () => inBand.filter((r) => r.inputs.condLV === params.condLV).sort((a, b) => a.price - b.price),
    [inBand, params.condLV],
  );
  const altMaterial = useMemo(
    () => inBand.filter((r) => r.inputs.condLV !== params.condLV).sort((a, b) => a.price - b.price),
    [inBand, params.condLV],
  );
  const cheapestByMaterial = useMemo(() => Object.keys(CONDUCTORS).map((c) => {
    const cands = feasible.filter((r) => r.inputs.condLV === c);
    return cands.length ? cands.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  }).filter(Boolean) as any[], [feasible]);
  const achievable = useMemo(() => {
    if (!feasible.length) return null;
    const prices = feasible.map((r) => r.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [feasible]);

  let guidance: string | null = null;
  if (band && !inBand.length) {
    if (!achievable) {
      guidance = 'No valid design was found at all under the current search settings. Try a wider impedance tolerance or a different tank type.';
    } else if (band.max < achievable.min) {
      guidance = `Every valid design for this rating costs at least ${inr(achievable.min)} ex-works. Raise the maximum, or take the cheapest option in the table above.`;
    } else if (band.min > achievable.max) {
      guidance = `No valid design reaches ${inr(band.min)} ex-works; the most expensive valid design found is ${inr(achievable.max)}. Lower the minimum.`;
    } else {
      guidance = `Designs for this rating range from ${inr(achievable.min)} to ${inr(achievable.max)} ex-works, but none of the searched combinations landed between ${inr(band.min)} and ${inr(band.max)}. Widen the band, or relax a constraint such as the impedance tolerance.`;
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Budget Band" subtitle={`Current design ${inr(bom.exFactory)} ex-works`}>
        <p className="text-[10px] text-steel px-1 pb-2">
          A design cheaper than the minimum is rejected here too. A customer who names a band wants it used, not
          undercut.
        </p>
        <div className="flex flex-wrap items-end gap-3 px-1">
          <div className="space-y-1">
            <label className={labelCls}>Minimum (₹ lakh)</label>
            <input type="number" step={0.1} value={minLakh} onChange={(e) => setMinLakh(Number(e.target.value))} className={`${inputCls} w-32`} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Maximum (₹ lakh)</label>
            <input type="number" step={0.1} value={maxLakh} onChange={(e) => setMaxLakh(Number(e.target.value))} className={`${inputCls} w-32`} />
          </div>
          <Button variant="primary" onClick={runSearch}>Search</Button>
        </div>
      </Card>

      {results.length > 0 && (
        <>
          <Card title="Cheapest Design by Conductor Material" subtitle="Band ignored, feasibility still enforced">
            <ResultsTable
              rows={cheapestByMaterial} current={current} activePreviewKey={activePreviewKey}
              onSelectPreview={onSelectPreview} showMaterial
              emptyNote="No feasible design was found in any conductor material."
            />
          </Card>

          {guidance && (
            <div className="bg-white border border-amber rounded-[2px] px-4 py-3">
              <div className="text-[11px] font-display uppercase tracking-[0.14em] text-amber mb-1">
                Nothing Landed in {inr(minLakh * 1e5)} to {inr(maxLakh * 1e5)}
              </div>
              <p className="text-[11px] text-ink2">{guidance}</p>
            </div>
          )}

          <Card title="Same Material, Different Design" subtitle={CONDUCTORS[params.condLV]?.name}>
            <ResultsTable
              rows={sameMaterial} current={current} activePreviewKey={activePreviewKey}
              onSelectPreview={onSelectPreview} showMaterial={false}
              emptyNote="No same-material design lands inside this band."
            />
          </Card>

          <Card title="Alternative Winding Material">
            <ResultsTable
              rows={altMaterial} current={current} activePreviewKey={activePreviewKey}
              onSelectPreview={onSelectPreview} showMaterial
              emptyNote="No alternative-material design lands inside this band."
            />
          </Card>
        </>
      )}
    </div>
  );
}
