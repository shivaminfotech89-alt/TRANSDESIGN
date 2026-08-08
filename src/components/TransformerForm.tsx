import React, { useMemo, useState } from 'react';
import {
  deriveSpec, APPS, STANDARDS, EFF_LEVELS, CONDUCTORS,
} from '@/packages/engine';
import {
  ChevronDown, ChevronUp, Settings2, Zap, Thermometer, Box, Database,
  DollarSign, ShieldCheck, Activity, SlidersHorizontal, Ruler,
} from 'lucide-react';

interface TransformerFormProps {
  core: any;
  over: Record<string, any>;
  onCoreChange: (core: any) => void;
  onOverChange: (over: Record<string, any>) => void;
  // Project metadata, not part of the engine's core enquiry -- see the
  // TODO(persistence) note in App.tsx.
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

/* Friendly labels for deriveSpec's keys. Anything missing here falls back to
   the raw key name, which is how you notice a new deriveSpec parameter that
   needs one added. */
const LABELS: Record<string, string> = {
  umHV: 'Um, HV', bilHV: 'BIL, HV', acHV: 'AC withstand, HV',
  umLV: 'Um, LV', bilLV: 'BIL, LV', acLV: 'AC withstand, LV',
  dryType: 'Dry-type construction', fluid: 'Insulating fluid', insClass: 'Insulation class',
  cooling: 'Cooling', tankType: 'Tank type', oilRiseTarget: 'Rise target',
  refTemp: 'Loss reference temperature', ambient: 'Ambient, maximum', ambientAvg: 'Ambient, yearly average',
  limitNLL: 'No-load loss limit', limitLL: 'Load loss limit', targetZ: 'Target impedance', zTol: 'Impedance tolerance',
  coreGrade: 'Core steel grade', coreType: 'Core / joint construction', buildFactor: 'Building factor',
  flux: 'Flux density', steps: 'Core steps', etK: 'Volts-per-turn constant (K)', aspect: 'Window aspect ratio',
  autoWindow: 'Solve window height for impedance', autoFit: 'Fit flux / current density to loss limits',
  windowSpace: 'Window space factor numerator',
  condLV: 'LV conductor material', condHV: 'HV conductor material',
  deltaLV: 'LV current density', deltaHV: 'HV current density', stray: 'Stray loss allowance',
  tapType: 'Tap changer type', tapPlus: 'Tap range above normal', tapMinus: 'Tap range below normal', tapStep: 'Tap step size',
  coreLvClr: 'Core to LV clearance', lvHvClr: 'LV to HV clearance', phaseClr: 'Phase to phase clearance',
  endClrLV: 'LV end clearance', endClrHV: 'HV end clearance', hvTankClr: 'HV to tank clearance',
  endTankClr: 'End to tank clearance', cylThk: 'Insulating cylinder thickness',
  lvIns: 'LV interturn insulation', hvPaper: 'HV conductor paper covering', hvInterlayer: 'HV interlayer insulation',
  insFactor: 'Insulation mass factor', topOilSpace: 'Top oil / lead space', bottomClr: 'Bottom clearance',
  finDiss: 'Fin/radiator dissipation @50K', tankDiss: 'Tank wall dissipation @50K', airDiss: 'Dry-type coil dissipation coefficient',
  tariff: 'Energy tariff', years: 'Evaluation period', loadFactor: 'Average load factor', pf: 'Power factor',
};

const SECTIONS: { id: string; title: string; icon: any; keys: string[] }[] = [
  { id: 'insulation', title: 'Insulation Levels', icon: ShieldCheck, keys: ['umHV', 'bilHV', 'acHV', 'umLV', 'bilLV', 'acLV'] },
  { id: 'system', title: 'Cooling & Insulation System', icon: Thermometer, keys: ['dryType', 'fluid', 'insClass', 'cooling', 'tankType', 'oilRiseTarget', 'refTemp', 'ambient', 'ambientAvg'] },
  { id: 'losses', title: 'Losses & Impedance', icon: Activity, keys: ['limitNLL', 'limitLL', 'targetZ', 'zTol'] },
  { id: 'core', title: 'Core', icon: Settings2, keys: ['coreGrade', 'coreType', 'buildFactor', 'flux', 'steps', 'etK', 'aspect', 'autoWindow', 'autoFit', 'windowSpace'] },
  { id: 'windings', title: 'Windings', icon: Database, keys: ['condLV', 'condHV', 'deltaLV', 'deltaHV', 'stray'] },
  { id: 'tappings', title: 'Tappings', icon: SlidersHorizontal, keys: ['tapType', 'tapPlus', 'tapMinus', 'tapStep'] },
  { id: 'clearances', title: 'Clearances', icon: Ruler, keys: ['coreLvClr', 'lvHvClr', 'phaseClr', 'endClrLV', 'endClrHV', 'hvTankClr', 'endTankClr', 'cylThk'] },
  { id: 'construction', title: 'Construction Constants', icon: Box, keys: ['lvIns', 'hvPaper', 'hvInterlayer', 'insFactor', 'topOilSpace', 'bottomClr', 'finDiss', 'tankDiss', 'airDiss'] },
  { id: 'economics', title: 'Economics', icon: DollarSign, keys: ['tariff', 'years', 'loadFactor', 'pf'] },
];

const APP_OPTS = Object.entries(APPS).map(([k, v]: [string, any]) => [k, v.name]);
const STANDARD_OPTS = Object.entries(STANDARDS).map(([k, v]: [string, any]) => [k, v.name]);
const EFF_LEVEL_OPTS = Object.entries(EFF_LEVELS).map(([k, v]: [string, any]) => [k, v.name]);
const MEDIUM_OPTS = [['oil', 'Oil immersed'], ['dry', 'Dry type']];
const COND_PREF_OPTS = [['auto', 'Auto, from rating and efficiency level'], ...Object.entries(CONDUCTORS).map(([k, v]: [string, any]) => [k, v.name])];
const VECTOR_OPTS = [['Dyn11', 'Dyn11'], ['Yyn0', 'Yyn0'], ['YNd11', 'YNd11'], ['Dd0', 'Dd0']];
const FREQ_OPTS = [[50, '50 Hz'], [60, '60 Hz']];

function inputCls(extra = '') {
  return `w-full bg-white border border-slate-300 p-2 text-slate-900 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 text-sm ${extra}`;
}

function CoreField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
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
      className={inputCls()}
    >
      {options.map((o) => (
        <option key={String(o[0])} value={String(o[0])}>{o[1]}</option>
      ))}
    </select>
  );
}

function ParamRow({
  k, spec, over, onOverChange,
}: {
  k: string;
  spec: { S: any; SUG: any; RNG: any; OPT: any; NOTE: any };
  over: Record<string, any>;
  onOverChange: (next: Record<string, any>) => void;
}) {
  const { S, SUG, RNG, OPT, NOTE } = spec;
  if (!(k in SUG)) return null;
  const opts = OPT[k];
  const range = RNG[k];
  if (!opts && !range) return null;

  const isSet = over[k] !== undefined;
  const value = S[k];
  const label = LABELS[k] || k;

  const setOverride = (v: any) => onOverChange({ ...over, [k]: v });
  const resetToSuggested = () => {
    const next = { ...over };
    delete next[k];
    onOverChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${isSet ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isSet ? 'SET' : 'AUTO'}
          </span>
          {isSet && (
            <button
              type="button"
              onClick={resetToSuggested}
              className="text-[9px] font-semibold text-slate-400 hover:text-blue-600 underline underline-offset-2"
            >
              Back to suggested
            </button>
          )}
        </div>
      </div>

      {opts ? (
        <CoreSelect value={value} onChange={setOverride} options={opts} />
      ) : (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={range[0]} max={range[1]} step={range[2] ?? 1}
            value={value}
            onChange={(e) => setOverride(Number(e.target.value))}
            className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            step={range[2] ?? 1}
            value={value}
            onChange={(e) => setOverride(Number(e.target.value))}
            className="w-20 shrink-0 bg-white border border-slate-300 p-1.5 text-slate-900 font-mono text-xs rounded-md text-center"
          />
        </div>
      )}

      {NOTE[k] && <p className="text-[10px] text-slate-400 leading-snug">{NOTE[k]}</p>}
    </div>
  );
}

export function TransformerForm({
  core, over, onCoreChange, onOverChange, projectName, onProjectNameChange,
}: TransformerFormProps) {
  const [expandedSection, setExpandedSection] = useState<string>('rating');

  const spec = useMemo(() => deriveSpec(core, over), [core, over]);

  const setCore = (patch: Record<string, any>) => onCoreChange({ ...core, ...patch });

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon: any }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-3 px-4 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title}</span>
      </div>
      {expandedSection === id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">

      {/* Rating & enquiry -- the core object itself, no AUTO/SET here */}
      <div>
        <SectionHeader id="rating" title="Rating & Enquiry" icon={Zap} />
        {expandedSection === 'rating' && (
          <div className="p-4 space-y-4">
            {/* Project metadata, not part of core/over -- disconnected until
                the projects/revisions persistence phase (see App.tsx). */}
            <CoreField label="Project Name">
              <input type="text" value={projectName} onChange={(e) => onProjectNameChange(e.target.value)} className={inputCls()} />
            </CoreField>
            <CoreField label="Application">
              <CoreSelect value={core.application} onChange={(v) => setCore({ application: v })} options={APP_OPTS} />
            </CoreField>
            <CoreField label="Design Standard">
              <CoreSelect value={core.standard} onChange={(v) => setCore({ standard: v })} options={STANDARD_OPTS} />
            </CoreField>
            <CoreField label="Rating (kVA)">
              <input type="number" value={core.kva} onChange={(e) => setCore({ kva: Number(e.target.value) })} className={inputCls('font-mono')} />
            </CoreField>
            <div className="grid grid-cols-2 gap-4">
              <CoreField label="HV (V)">
                <input type="number" value={core.hv} onChange={(e) => setCore({ hv: Number(e.target.value) })} className={inputCls('font-mono')} />
              </CoreField>
              <CoreField label="LV (V)">
                <input type="number" value={core.lv} onChange={(e) => setCore({ lv: Number(e.target.value) })} className={inputCls('font-mono')} />
              </CoreField>
            </div>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              <input type="checkbox" checked={!!core.dualHV} onChange={(e) => setCore({ dualHV: e.target.checked })} />
              Dual HV voltage
            </label>
            {core.dualHV && (
              <CoreField label="HV, second (V)">
                <input type="number" value={core.hv2} onChange={(e) => setCore({ hv2: Number(e.target.value) })} className={inputCls('font-mono')} />
              </CoreField>
            )}
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              <input type="checkbox" checked={!!core.dualLV} onChange={(e) => setCore({ dualLV: e.target.checked })} />
              Dual LV voltage
            </label>
            {core.dualLV && (
              <CoreField label="LV, second (V)">
                <input type="number" value={core.lv2} onChange={(e) => setCore({ lv2: Number(e.target.value) })} className={inputCls('font-mono')} />
              </CoreField>
            )}
            <div className="grid grid-cols-2 gap-4">
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

      {/* Every derived parameter: AUTO from deriveSpec, or SET by the user */}
      {SECTIONS.map(({ id, title, icon, keys }) => (
        <div key={id}>
          <SectionHeader id={id} title={title} icon={icon} />
          {expandedSection === id && (
            <div className="p-4 space-y-4">
              {keys.map((k) => (
                <ParamRow key={k} k={k} spec={spec} over={over} onOverChange={onOverChange} />
              ))}
            </div>
          )}
        </div>
      ))}

    </div>
  );
}
