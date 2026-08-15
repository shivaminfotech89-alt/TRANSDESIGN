import React, { useEffect, useMemo, useRef, useState } from 'react';
import { etkCurve, ETK_RANGE, CORE_GRADES, CONDUCTORS, inr } from '@/packages/engine';
import { Card, Button, thCls, tdCls, inputCls, labelCls } from '../ui';

/** CALIBRATION.md section 25: the search itself now runs in
 *  src/workers/searchWorker.ts, off this tab's own main thread -- searchDesigns
 *  is no longer called directly here. Turns a progress message from the
 *  worker (packages/engine's stagedSearchDesigns own {stage, phase, ...}
 *  shape) into one line a designer reading it would actually understand,
 *  not the raw stage numbers. */
function progressText(info: any): string {
  if (!info) return 'Searching…';
  if (info.stage === 1 && info.phase === 'start') return 'Screening every material, grade and tank combination…';
  if (info.stage === 1 && info.phase === 'done') return `Screened ${info.count} combinations -- refining the best…`;
  if (info.stage === 2 && info.phase === 'tuple') return `Refining combination ${info.tuple} of ${info.of}…`;
  if (info.stage === 2 && info.phase === 'done') return 'Finishing…';
  return 'Searching…';
}

interface BudgetTabProps {
  /** The live design being edited -- never the previewed one. The search
   *  anchors on it and every "current design" comparison is against it,
   *  regardless of what the rest of the app is currently previewing. */
  design: any;
  bom: any;
  params: any;
  /** The live design's raw over -- CALIBRATION.md section 42. When it pins
   *  flux or current density, the search holds that pin on every candidate
   *  instead of silently refitting around it. */
  over: Record<string, any>;
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
    r.inputs.cooling, r.inputs.oilRiseTarget,
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

/** CALIBRATION.md section 2: K trades core steel for winding copper, and
 *  the cheapest point moves with the copper to steel price ratio rather
 *  than sitting at a fixed number -- this is the shape of that curve for
 *  the design on screen, not a claim about which point is right. K alone
 *  varies; flux, current density, steps, material and tank stay at the
 *  live design's own values, the same isolation packages/engine's own
 *  etkCurve() is built for, so the line shows K's own effect on price
 *  rather than several dimensions moving at once. */
function KSweepPanel({ params, rates }: { params: any; rates: Record<string, number> }) {
  const curve = useMemo(() => etkCurve(params, rates), [params, rates]);
  if (curve.length < 2) return null;

  const prices = curve.map((p) => p.exFactory);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = Math.max(1, maxPrice - minPrice);
  const feasiblePts = curve.filter((p) => p.feasible);
  const best = (feasiblePts.length ? feasiblePts : curve).reduce((a, b) => (b.exFactory < a.exFactory ? b : a));

  const W = 640, H = 190, padL = 64, padR = 16, padT = 28, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const kMin = ETK_RANGE[0], kMax = ETK_RANGE[ETK_RANGE.length - 1];
  const xAt = (k: number) => padL + ((k - kMin) / (kMax - kMin)) * plotW;
  const yAt = (price: number) => padT + (1 - (price - minPrice) / priceRange) * plotH;
  const pathD = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.etK).toFixed(1)} ${yAt(p.exFactory).toFixed(1)}`).join(' ');
  const bestX = xAt(best.etK), bestY = yAt(best.exFactory);
  const curX = xAt(params.etK);
  const bestLabelBelow = bestY < padT + 16;
  const curLabelRight = curX < padL + plotW / 2;

  return (
    <Card title="K Sweep" subtitle="Ex-works against volts per turn (K), everything else held at the current design">
      <div className="px-1 pb-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
          <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="var(--color-rule)" strokeWidth={1} />
          <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="var(--color-rule)" strokeWidth={1} />
          <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="9" fill="var(--color-steel)">{inr(maxPrice)}</text>
          <text x={padL - 6} y={H - padB} textAnchor="end" fontSize="9" fill="var(--color-steel)">{inr(minPrice)}</text>
          <text x={padL} y={H - padB + 14} textAnchor="middle" fontSize="9" fill="var(--color-steel)">{kMin.toFixed(2)}</text>
          <text x={W - padR} y={H - padB + 14} textAnchor="middle" fontSize="9" fill="var(--color-steel)">{kMax.toFixed(2)}</text>

          <line x1={curX} y1={padT} x2={curX} y2={H - padB} stroke="var(--color-steel)" strokeWidth={1} strokeDasharray="3,3" />
          <text x={curX + (curLabelRight ? 4 : -4)} y={padT - 6} textAnchor={curLabelRight ? 'start' : 'end'} fontSize="9" fill="var(--color-steel)">
            current design, K={params.etK.toFixed(2)}
          </text>

          <path d={pathD} fill="none" stroke="var(--color-ink2)" strokeWidth={1.5} />
          {curve.map((p) => (
            <circle key={p.etK} cx={xAt(p.etK)} cy={yAt(p.exFactory)} r={2}
              fill={p.feasible ? 'var(--color-ink2)' : 'var(--color-amber)'} />
          ))}

          <circle cx={bestX} cy={bestY} r={4} fill="none" stroke="var(--color-good)" strokeWidth={1.5} />
          <text x={bestX} y={bestY + (bestLabelBelow ? 16 : -8)} textAnchor="middle" fontSize="9" fontWeight={600} fill="var(--color-good)">
            cheapest, K={best.etK.toFixed(2)} · {inr(best.exFactory)}
          </text>
        </svg>
        <p className="text-[10px] text-steel px-1 pt-1">
          Flux, current density, steps, material and tank are held at the current design's own values -- only K
          moves along this line. Amber points miss the declared impedance, thermal or loss limit at that K.
        </p>
      </div>
    </Card>
  );
}

export function BudgetTab({ design, bom, params, over, rates, activePreviewKey, onSelectPreview }: BudgetTabProps) {
  const current = { design, bom, params };
  const [minLakh, setMinLakh] = useState(() => Math.max(0, Math.round((bom.exFactory / 1e5 - 2) * 100) / 100));
  const [maxLakh, setMaxLakh] = useState(() => Math.round((bom.exFactory / 1e5) * 100) / 100);
  const [band, setBand] = useState<{ min: number; max: number } | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  // CALIBRATION.md section 33: set whenever the engine left a conductor out
  // of the sweep because its rate is still at the unsourced DEFAULT_RATES
  // placeholder -- searchDesigns' own excludedNote, forwarded by the worker.
  const [excludedNote, setExcludedNote] = useState<string | null>(null);
  // CALIBRATION.md section 42: set whenever the live design has flux or
  // current density pinned -- searchDesigns' own pinnedNote, forwarded by
  // the worker, same mechanism as excludedNote above.
  const [pinnedNote, setPinnedNote] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Terminate any still-running search if this tab unmounts -- a worker
  // outlives its component otherwise, still burning CPU on a search nobody
  // is looking at the result of.
  useEffect(() => () => { workerRef.current?.terminate(); }, []);

  const cancelSearch = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setSearching(false);
    setProgress(null);
  };

  const runSearch = () => {
    const b = { min: minLakh * 1e5, max: maxLakh * 1e5 };
    const opts = {
      grades: Object.keys(CORE_GRADES),
      conds: Object.keys(CONDUCTORS),
      tanks: params.dry ? [params.tankType] : ['fin', 'radiator'],
      cores: [params.coreType],
      zTol: params.zTol,
      enforceLimits: true,
      // CALIBRATION.md section 2: K is swept alongside material, grade and
      // tank rather than left fixed, so a design that is cheaper mainly
      // because of a different K surfaces here too, not only in the
      // dedicated K Sweep panel below. steps and tapType are left at their
      // singleton default -- crossing either into this grid as well pushes
      // a sub-two-second search well past ten, for a lever that is rarely a
      // real cost choice on top of K, material and grade.
      etKs: ETK_RANGE,
      // Top-oil rise target is swept alongside K, material, grade and tank:
      // a lower target buys nothing but cost (more fin/tank steel for the
      // same loss), a higher one saves tank steel up to whatever the
      // standard and fluid actually allow (params.oilRiseTarget itself, if
      // deriveSpec or the user has already set it to that ceiling). This is
      // a fair trade because both ends are held to the same compliance
      // check (d.compliance.rise/wRise.ok) that gates feasible either way.
      riseTargets: [params.oilRiseTarget, Math.max(30, params.oilRiseTarget - 5), Math.max(30, params.oilRiseTarget - 10)],
      // CALIBRATION.md section 23: cooling is only swept once fan, pump and
      // control-gear rates are all actually priced -- DEFAULT_RATES ships
      // them at 0 (no reference-sheet basis, section 20/23), and a search
      // is a ranked recommendation, not a banner someone can notice and
      // dismiss: at a zero rate it would rank a forced-cooled candidate
      // first for looking cheaper than it really is, every time, silently.
      // Better the lever is unavailable than available and wrong. Once all
      // three are priced this is a fair trade (buildBOM's fan/pump/
      // control-gear rows are real cost by then), and sweeps ONAN vs ONAF
      // only, not the full four -- OFAF/ODAF are rarely the live cost
      // question at the ratings this search is normally run at, and each
      // added cooling multiplies the whole grid, the same tradeoff steps
      // and tapType were left out of above. Dry designs have no fan/pump
      // costing (oil-only geometry), so stay at their single current
      // cooling regardless.
      coolings: (() => {
        const coolingPriced = rates.coolingFan > 0 && rates.oilPump > 0 && rates.coolingControlGear > 0;
        return params.dry || !coolingPriced ? [params.cooling] : ['ONAN', 'ONAF'];
      })(),
      // CALIBRATION.md section 42: the live design's own pins, so the search
      // holds a pinned flux or current density on every candidate rather
      // than treating it the same as an AUTO-derived value it is free to
      // move. Undefined entries (nothing pinned) leave searchDesigns'
      // behaviour exactly as it was before this field existed.
      over,
    };
    // CALIBRATION.md section 25: runs in a worker, not on this thread --
    // the grid this opts object describes was 179,712 candidates before
    // staging, 30+ minutes synchronous on the tab's own main thread. Staging
    // (packages/engine's stagedSearchDesigns, which the worker calls) cuts
    // that to under 90 seconds typically, but a worker means even an
    // atypical, larger grid can never freeze the tab -- it can only ever
    // make the progress bar take longer, with a Cancel button that actually
    // works because the search is not blocking the thread the click handler
    // needs to run on.
    workerRef.current?.terminate();
    setSearchError(null);
    setExcludedNote(null);
    setPinnedNote(null);
    setSearching(true);
    setProgress({ stage: 1, phase: 'start' });

    const worker = new Worker(new URL('../../workers/searchWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.info);
      } else if (msg.type === 'done') {
        setResults(msg.results);
        setExcludedNote(msg.excludedNote ?? null);
        setPinnedNote(msg.pinnedNote ?? null);
        setBand(b);
        setSearching(false);
        setProgress(null);
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === 'error') {
        setSearchError(msg.message || 'The search failed unexpectedly.');
        setSearching(false);
        setProgress(null);
        worker.terminate();
        workerRef.current = null;
      }
    };
    worker.onerror = (e: ErrorEvent) => {
      setSearchError(e.message || 'The search worker failed to start.');
      setSearching(false);
      setProgress(null);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ type: 'search', base: params, rates, band: b, opts });
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
          <Button variant="primary" onClick={runSearch} disabled={searching}>{searching ? 'Searching…' : 'Search'}</Button>
          {searching && <Button variant="destructive" onClick={cancelSearch}>Cancel</Button>}
        </div>
        {searching && (
          <p className="text-[10px] text-steel px-1 pt-2 font-mono">{progressText(progress)}</p>
        )}
        {searchError && (
          <p className="text-[10px] text-alert px-1 pt-2">{searchError}</p>
        )}
        {excludedNote && (
          <p className="text-[10px] text-alert px-1 pt-2">{excludedNote}</p>
        )}
        {pinnedNote && (
          <p className="text-[10px] text-steel px-1 pt-2">{pinnedNote}</p>
        )}
      </Card>

      <KSweepPanel params={params} rates={rates} />

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
