import React, { useMemo, useState } from 'react';
import {
  deriveSpec, APPS, STANDARDS, EFF_LEVELS, CONDUCTORS,
} from '@/packages/engine';
import { labelCls, inputCls } from './ui';
import { LABELS, UNITS } from '../lib/paramLabels';

interface TransformerFormProps {
  core: any;
  over: Record<string, any>;
  onCoreChange: (core: any) => void;
  onOverChange: (over: Record<string, any>) => void;
}

const SECTIONS: { id: string; title: string; keys: string[] }[] = [
  { id: 'insulation', title: 'Insulation Levels', keys: ['umHV', 'bilHV', 'acHV', 'umLV', 'bilLV', 'acLV'] },
  { id: 'system', title: 'Cooling & Insulation System', keys: ['dryType', 'fluid', 'insClass', 'cooling', 'tankType', 'oilRiseTarget', 'refTemp', 'ambient', 'ambientAvg'] },
  { id: 'losses', title: 'Losses & Impedance', keys: ['limitNLL', 'limitLL', 'targetZ', 'zTol'] },
  { id: 'dual', title: 'Dual Rating', keys: ['kva2', 'cooling2', 'limitNLL2', 'limitLL2'] },
  { id: 'core', title: 'Core', keys: ['coreGrade', 'coreType', 'buildFactor', 'flux', 'steps', 'etK', 'aspect', 'autoWindow', 'autoFit', 'windowSpace'] },
  { id: 'windings', title: 'Windings', keys: ['condLV', 'condHV', 'deltaLV', 'deltaHV', 'stray'] },
  { id: 'tappings', title: 'Tappings', keys: ['tapType', 'tapPlus', 'tapMinus', 'tapStep'] },
  { id: 'clearances', title: 'Clearances', keys: ['coreLvClr', 'lvHvClr', 'phaseClr', 'endClrLV', 'endClrHV', 'hvTankClr', 'endTankClr', 'cylThk'] },
  { id: 'construction', title: 'Construction Constants', keys: ['lvIns', 'hvPaper', 'hvInterlayer', 'insFactor', 'topOilSpace', 'bottomClr', 'finDiss', 'tankDiss', 'fanUnitArea', 'airDiss'] },
  { id: 'economics', title: 'Economics', keys: ['tariff', 'years', 'loadFactor', 'pf'] },
];

const APP_OPTS = Object.entries(APPS).map(([k, v]: [string, any]) => [k, v.name]);
const STANDARD_OPTS = Object.entries(STANDARDS).map(([k, v]: [string, any]) => [k, v.name]);
const EFF_LEVEL_OPTS = Object.entries(EFF_LEVELS).map(([k, v]: [string, any]) => [k, v.name]);
const MEDIUM_OPTS = [['oil', 'Oil immersed'], ['dry', 'Dry type']];
const COND_PREF_OPTS = [['auto', 'Auto, from rating and efficiency level'], ...Object.entries(CONDUCTORS).map(([k, v]: [string, any]) => [k, v.name])];
const VECTOR_OPTS = [['Dyn11', 'Dyn11'], ['Yyn0', 'Yyn0'], ['YNd11', 'YNd11'], ['Dd0', 'Dd0']];
const FREQ_OPTS = [[50, '50 Hz'], [60, '60 Hz']];

function CoreField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function CoreSelect({ value, onChange, options }: { value: any; onChange: (v: any) => void; options: any[][] }) {
  return (
    <select
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        const orig = options.find((o) => String(o[0]) === raw)?.[0];
        onChange(orig !== undefined ? orig : raw);
      }}
      className={inputCls}
    >
      {options.map((o) => (
        <option key={String(o[0])} value={String(o[0])}>{o[1]}</option>
      ))}
    </select>
  );
}

function ParamRow({
  k, spec, over, onOverChange, expanded, onToggle,
}: {
  k: string;
  spec: { S: any; SUG: any; RNG: any; OPT: any; NOTE: any };
  over: Record<string, any>;
  onOverChange: (next: Record<string, any>) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { S, SUG, RNG, OPT, NOTE } = spec;
  if (!(k in SUG)) return null;
  const opts = OPT[k];
  const range = RNG[k];
  if (!opts && !range) return null;

  const isSet = over[k] !== undefined;
  const value = S[k];
  const sug = SUG[k];
  const label = LABELS[k] || k;
  const unit = UNITS[k] || '';

  const setOverride = (v: any) => onOverChange({ ...over, [k]: v });
  const resetToSuggested = () => {
    const next = { ...over };
    delete next[k];
    onOverChange(next);
  };

  const displayValue = typeof value === 'number'
    ? (Number.isInteger(value) ? String(value) : value.toFixed(2))
    : String(value);
  const sugDisplay = typeof sug === 'number'
    ? (Number.isInteger(sug) ? String(sug) : sug.toFixed(2))
    : String(sug);

  return (
    <div className="border-b border-line last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 py-1.5 text-left"
      >
        <span className="text-[11px] text-ink2">{label}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className={`font-mono text-[11px] ${isSet ? 'text-amber' : 'text-ink'}`}>
            {displayValue}<span className="text-steel ml-0.5">{unit}</span>
          </span>
          <span className={`text-[9px] font-display uppercase px-1 ${isSet ? 'text-amber' : 'text-patina'}`}>
            {isSet ? 'SET' : 'AUTO'}
          </span>
        </span>
      </button>

      {expanded && (
        <div className="pb-2 space-y-1.5">
          {opts ? (
            <select
              value={String(value)}
              onChange={(e) => {
                const raw = e.target.value;
                const orig = opts.find((o: any[]) => String(o[0]) === raw)?.[0];
                setOverride(orig !== undefined ? orig : raw);
              }}
              className={inputCls}
            >
              {opts.map((o: any[]) => (
                <option key={String(o[0])} value={String(o[0])}>
                  {o[1]}{String(o[0]) === String(sug) ? ' ✓ suggested' : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-steel">{range[0]}</span>
              <input
                type="range"
                min={range[0]} max={range[1]} step={range[2] ?? 1}
                value={value}
                onChange={(e) => setOverride(Number(e.target.value))}
                className="w-full accent-copper h-1"
              />
              <span className="font-mono text-[9px] text-steel">{range[1]}</span>
              <input
                type="number"
                step={range[2] ?? 1}
                value={value}
                onChange={(e) => setOverride(Number(e.target.value))}
                className="w-16 shrink-0 bg-white border border-rule rounded-[2px] p-1 text-ink font-mono text-[10px] text-center"
              />
            </div>
          )}

          {NOTE[k] && <p className="text-[10px] font-body text-steel leading-snug">{NOTE[k]}</p>}

          {isSet && (
            <button
              type="button"
              onClick={resetToSuggested}
              className="text-[10px] font-display uppercase tracking-[0.1em] text-patina"
            >
              Back to Suggested: {sugDisplay}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GroupHeader({ title, expanded, onToggle }: { title: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-2 border-b border-line bg-white hover:bg-sheetAlt transition-colors"
    >
      <span className="text-[11px] font-display uppercase tracking-[0.16em] text-ink2">{title}</span>
      <span className="font-display text-ink2 text-[13px] leading-none">{expanded ? '−' : '+'}</span>
    </button>
  );
}

export function TransformerForm({
  core, over, onCoreChange, onOverChange,
}: TransformerFormProps) {
  const [expandedSection, setExpandedSection] = useState<string>('rating');
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());

  const spec = useMemo(() => deriveSpec(core, over), [core, over]);

  const setCore = (patch: Record<string, any>) => onCoreChange({ ...core, ...patch });

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const toggleParam = (k: string) => {
    const next = new Set(expandedParams);
    if (next.has(k)) next.delete(k); else next.add(k);
    setExpandedParams(next);
  };

  return (
    <div className="border border-rule rounded-[2px] overflow-hidden bg-white">
      <div className="bg-plate text-plateTx text-[11px] font-display uppercase tracking-[0.16em] px-4 py-2">
        Specification
      </div>

      {/* Rating & enquiry -- the core object itself, no AUTO/SET here */}
      <div>
        <GroupHeader title="Rating & Enquiry" expanded={expandedSection === 'rating'} onToggle={() => toggleSection('rating')} />
        {expandedSection === 'rating' && (
          <div className="p-4 space-y-3">
            {/* Project name lives in the project bar (ProjectMeta.projectName),
                above the rating plate -- not here, since this section is the
                engine's core enquiry, not project metadata. */}
            <CoreField label="Application">
              <CoreSelect value={core.application} onChange={(v) => setCore({ application: v })} options={APP_OPTS} />
            </CoreField>
            <CoreField label="Design Standard">
              <CoreSelect value={core.standard} onChange={(v) => setCore({ standard: v })} options={STANDARD_OPTS} />
            </CoreField>
            <CoreField label="Rating (kVA)">
              <input type="number" value={core.kva} onChange={(e) => setCore({ kva: Number(e.target.value) })} className={inputCls} />
            </CoreField>
            <label className={`flex items-center gap-2 ${labelCls}`}>
              <input type="checkbox" checked={!!core.dualRating} onChange={(e) => setCore({ dualRating: e.target.checked })} />
              Dual rating (natural + forced cooling, one tank)
            </label>
            {core.dualRating && (
              <p className="text-[10px] font-body text-steel leading-snug">
                Rating above is sized for the active part (turns, conductor, current density) --
                enter the second name-plate point in Dual Rating below. The engine sizes the
                cooling surface to satisfy both.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <CoreField label="HV (V)">
                <input type="number" value={core.hv} onChange={(e) => setCore({ hv: Number(e.target.value) })} className={inputCls} />
              </CoreField>
              <CoreField label="LV (V)">
                <input type="number" value={core.lv} onChange={(e) => setCore({ lv: Number(e.target.value) })} className={inputCls} />
              </CoreField>
            </div>
            <label className={`flex items-center gap-2 ${labelCls}`}>
              <input type="checkbox" checked={!!core.dualHV} onChange={(e) => setCore({ dualHV: e.target.checked })} />
              Dual HV voltage
            </label>
            {core.dualHV && (
              <CoreField label="HV, second (V)">
                <input type="number" value={core.hv2} onChange={(e) => setCore({ hv2: Number(e.target.value) })} className={inputCls} />
              </CoreField>
            )}
            <label className={`flex items-center gap-2 ${labelCls}`}>
              <input type="checkbox" checked={!!core.dualLV} onChange={(e) => setCore({ dualLV: e.target.checked })} />
              Dual LV voltage
            </label>
            {core.dualLV && (
              <CoreField label="LV, second (V)">
                <input type="number" value={core.lv2} onChange={(e) => setCore({ lv2: Number(e.target.value) })} className={inputCls} />
              </CoreField>
            )}
            <div className="grid grid-cols-2 gap-3">
              <CoreField label="Frequency">
                <CoreSelect value={core.freq} onChange={(v) => setCore({ freq: v })} options={FREQ_OPTS} />
              </CoreField>
              <CoreField label="Vector Group">
                <CoreSelect value={core.vector} onChange={(v) => setCore({ vector: v })} options={VECTOR_OPTS} />
              </CoreField>
            </div>
            <CoreField label="Efficiency Level">
              <CoreSelect value={core.effLevel} onChange={(v) => setCore({ effLevel: v })} options={EFF_LEVEL_OPTS} />
            </CoreField>
            <CoreField label="Cooling Medium">
              <CoreSelect value={core.medium} onChange={(v) => setCore({ medium: v })} options={MEDIUM_OPTS} />
            </CoreField>
            <CoreField label="Conductor Preference">
              <CoreSelect value={core.condPref} onChange={(v) => setCore({ condPref: v })} options={COND_PREF_OPTS} />
            </CoreField>
          </div>
        )}
      </div>

      {/* Every derived parameter: AUTO from deriveSpec, or SET by the user.
          "dual" is hidden entirely rather than shown empty when the Dual
          Rating checkbox above is off: deriveSpec only put()s kva2/cooling2/
          limitNLL2/limitLL2 when core.dualRating is true, so ParamRow would
          render nothing for any of them anyway -- this just avoids an
          expandable section header over an empty body. */}
      {SECTIONS.filter((s) => s.id !== 'dual' || core.dualRating).map(({ id, title, keys }) => (
        <div key={id}>
          <GroupHeader title={title} expanded={expandedSection === id} onToggle={() => toggleSection(id)} />
          {expandedSection === id && (
            <div className="px-4">
              {keys.map((k) => (
                <ParamRow
                  key={k} k={k} spec={spec} over={over} onOverChange={onOverChange}
                  expanded={expandedParams.has(k)} onToggle={() => toggleParam(k)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
