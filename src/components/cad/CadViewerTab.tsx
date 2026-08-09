import React, { useState } from 'react';
import { TransformerModel, type PresetView } from './TransformerModel';
import type { PartInfo } from './TransformerParts';
import { Card, DataRow, Button, labelCls } from '../ui';

interface CadViewerTabProps {
  design: any;
  params: any;
}

const VISIBILITY_LABELS: Record<string, string> = {
  core: 'Core', lvWinding: 'LV Windings', hvWinding: 'HV Windings',
  tank: 'Tank and Cover', fins: 'Fins', bushings: 'Bushings',
  baseChannel: 'Base Channel', clampingFrame: 'Clamping Frame and Tie Rods',
};

const VIEWS: { id: PresetView; label: string }[] = [
  { id: 'iso', label: 'Isometric' }, { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' }, { id: 'top', label: 'Top' },
];

export function CadViewerTab({ design, params }: CadViewerTabProps) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    core: true, lvWinding: true, hvWinding: true, tank: true, fins: true,
    bushings: true, baseChannel: true, clampingFrame: true,
  });
  const [exploded, setExploded] = useState(false);
  const [transparency, setTransparency] = useState(0);
  const [selectedPart, setSelectedPart] = useState<PartInfo | null>(null);
  const [view, setView] = useState<PresetView>('iso');
  const [viewToken, setViewToken] = useState(0);
  const [sectionEnabled, setSectionEnabled] = useState(false);
  const [sectionOffset, setSectionOffset] = useState(0);

  const toggleVisibility = (key: string) => setVisibility((v) => ({ ...v, [key]: !v[key] }));
  const goToView = (v: PresetView) => { setView(v); setViewToken((t) => t + 1); };

  const totalMass = design.wCore + design.wLV + design.wHV + design.wIns
    + design.wFrame + design.wTank + design.wFin + design.wEnclosure
    + design.fluidLitres * design.fluid.dens;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[720px]">
      <div className="flex-1 relative border border-rule rounded-[2px] bg-white overflow-hidden">
        <TransformerModel
          design={design} params={params} visibility={visibility}
          exploded={exploded} transparency={transparency}
          view={view} viewToken={viewToken}
          sectionEnabled={sectionEnabled} sectionOffset={sectionOffset}
          onSelectPart={setSelectedPart}
        />

        <div className="absolute top-3 left-3 flex gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => goToView(v.id)}
              className={`font-display uppercase text-[10px] tracking-[0.1em] px-2.5 py-1 rounded-[2px] border ${view === v.id ? 'bg-plate border-plate text-plateTx' : 'bg-white/90 border-rule text-ink2'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-4 bg-white/95 border border-rule rounded-[2px] px-4 py-2">
          <label className="flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.1em] text-ink2">
            <input type="checkbox" checked={exploded} onChange={(e) => setExploded(e.target.checked)} />
            Exploded
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">Tank Transparency</span>
            <input type="range" min={0} max={100} value={transparency} onChange={(e) => setTransparency(Number(e.target.value))} className="w-24 accent-copper" />
            <span className="font-mono text-[10px] text-steel w-8">{transparency}%</span>
          </div>
          <label className="flex items-center gap-2 text-[10px] font-display uppercase tracking-[0.1em] text-ink2">
            <input type="checkbox" checked={sectionEnabled} onChange={(e) => setSectionEnabled(e.target.checked)} />
            Section Plane
          </label>
          {sectionEnabled && (
            <input
              type="range" min={-design.tankW} max={design.tankW} value={sectionOffset}
              onChange={(e) => setSectionOffset(Number(e.target.value))} className="w-32 accent-copper"
            />
          )}
        </div>
      </div>

      <aside className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4 overflow-y-auto">
        <Card title="Visibility">
          <div className="space-y-1">
            {Object.entries(VISIBILITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleVisibility(key)}
                className="w-full flex items-center justify-between py-1 text-[11px] text-ink2"
              >
                <span>{label}</span>
                <span className={`text-[9px] font-display uppercase px-1 ${visibility[key] ? 'text-good' : 'text-steel'}`}>
                  {visibility[key] ? 'Shown' : 'Hidden'}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Part Inspection">
          {selectedPart ? (
            <div className="space-y-1">
              <div className="text-[12px] font-semibold text-ink">{selectedPart.name}</div>
              <div className="font-mono text-[10px] text-copper mb-2">{selectedPart.partNumber}</div>
              <DataRow label="Material" value={selectedPart.material} />
              <DataRow label="Dimensions" value={selectedPart.dimensions} />
              <DataRow label="Mass" value={selectedPart.mass} tone="copper" />
            </div>
          ) : (
            <p className="text-[10px] text-steel">Click any part in the model to inspect it.</p>
          )}
        </Card>

        <Card title="General Dimensions">
          <DataRow label="Core Diameter" value={design.dCore.toFixed(0)} unit="mm" />
          <DataRow label="Limb Centre" value={design.cc.toFixed(0)} unit="mm" />
          <DataRow label="Window Height" value={design.Hw.toFixed(0)} unit="mm" />
          <DataRow label="Tank" value={`${design.tankL.toFixed(0)} x ${design.tankW.toFixed(0)} x ${design.tankH.toFixed(0)}`} unit="mm" />
          <DataRow label="Total Mass" value={Math.round(totalMass).toString()} unit="kg" tone="copper" />
        </Card>
      </aside>
    </div>
  );
}
