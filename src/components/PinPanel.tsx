import React, { useState } from 'react';
import {
  PINNABLE_TARGETS, CLASS_B_TARGETS, OVER_KEY_LEVER,
  type PinSet,
} from '../lib/pinRegistry';
import { Card, Button } from './ui';

interface PinPanelProps {
  pins: PinSet;
  over: Record<string, any>;
  onRequestPin: (targetId: string, value: number) => void;
  onReleasePin: (targetId: string) => void;
}

/** Every lever currently claimed, whether by a new Class B pin or by an
 *  ordinary Class A row already set directly (over.flux, over.targetZ...).
 *  This is the "pin set" SOLVER.md section 2 rule 3 says must always be
 *  visible -- both sources are pins in the sense that matters: something is
 *  holding that lever and the solver (once built) must not move it. */
function activeHolders(pins: PinSet, over: Record<string, any>) {
  const rows: { label: string; leverLabel: string; value: string; onRelease?: () => void }[] = [];
  for (const p of Object.values(pins)) {
    const t = CLASS_B_TARGETS.find((x) => x.id === p.targetId);
    if (t) rows.push({ label: t.label, leverLabel: t.leverLabel, value: `${p.value} ${t.unit}` });
  }
  for (const [overKey, lever] of Object.entries(OVER_KEY_LEVER)) {
    if (over[overKey] !== undefined) {
      const t = CLASS_B_TARGETS.find((x) => x.lever === lever);
      rows.push({ label: overKey, leverLabel: t?.leverLabel || lever, value: String(over[overKey]) });
    }
  }
  return rows;
}

function PinRow({
  target, pin, onRequestPin, onReleasePin,
}: {
  target: (typeof PINNABLE_TARGETS)[number];
  pin?: { targetId: string; value: number };
  onRequestPin: (targetId: string, value: number) => void;
  onReleasePin: (targetId: string) => void;
}) {
  const [draft, setDraft] = useState('');

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-dashed border-line last:border-0">
      <div className="min-w-0">
        <div className="text-[11px] text-ink2">{target.label}</div>
        <div className="text-[9px] font-mono text-steel truncate">lever: {target.leverLabel}</div>
      </div>
      {pin ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-amber">{pin.value} {target.unit}</span>
          <Button variant="destructive" onClick={() => onReleasePin(target.id)}>Release</Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={target.unit}
            className="w-16 bg-white border border-rule rounded-[2px] p-1 text-ink font-mono text-[10px] text-center"
          />
          <Button
            variant="secondary"
            onClick={() => { if (draft !== '') onRequestPin(target.id, Number(draft)); }}
          >
            Pin
          </Button>
        </div>
      )}
    </div>
  );
}

export function PinPanel({ pins, over, onRequestPin, onReleasePin }: PinPanelProps) {
  const holders = activeHolders(pins, over);

  return (
    <Card title="Pin Registry" subtitle="SOLVER.md, step 1 -- no solving yet">
      <p className="text-[10px] font-body text-steel mb-2">
        Pinning a target registers what you want and checks whether its lever is
        already claimed. It does not yet solve for it -- that is SOLVER.md step 3.
      </p>

      <div className="mb-3">
        <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2 mb-1">
          Pin Set{holders.length === 0 && ' -- none'}
        </div>
        {holders.map((h) => (
          <div key={h.label} className="flex items-center justify-between text-[10px] font-mono py-0.5">
            <span className="text-ink2">{h.label} <span className="text-steel">({h.leverLabel})</span></span>
            <span className="text-amber">{h.value}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2 mb-1">
          Class B Targets
        </div>
        {PINNABLE_TARGETS.map((t) => (
          <PinRow key={t.id} target={t} pin={pins[t.id]} onRequestPin={onRequestPin} onReleasePin={onReleasePin} />
        ))}
      </div>

      <p className="text-[9px] font-mono text-steel mt-2 pt-2 border-t border-line">
        Impedance and temperature rise are already solved today (targetZ, oilRiseTarget
        in the sidebar) -- not shown here, but they hold the same levers for
        conflict checking.
      </p>
    </Card>
  );
}
