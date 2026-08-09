import React from 'react';
import { Card, Button } from './ui';
import type { DependentChange } from '../lib/impactSummary';

interface EngineImpact { k: string; from?: string; to?: string; good: boolean; big?: boolean; body: string; }

interface DesignImpactSummaryProps {
  editTitle: string;
  editFrom: string;
  editTo: string;
  lever?: { label: string; from: string; to: string; why: string };
  dependents: DependentChange[];
  engineImpacts: EngineImpact[];
  onDismiss: () => void;
}

/**
 * SOLVER.md section 4. Shown after every change, for the one decision just
 * made -- not a diff of the whole design. Combines the app-known "what did
 * the user do" (edit / lever / dependents) with the engine's impacts(),
 * which already covers weight, losses, efficiency, compliance and money.
 */
export function DesignImpactSummary({
  editTitle, editFrom, editTo, lever, dependents, engineImpacts, onDismiss,
}: DesignImpactSummaryProps) {
  return (
    <div className="bg-white border border-copper rounded-[2px] print:hidden">
      <div className="bg-sheetAlt border-b border-line px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] font-display uppercase tracking-[0.18em] text-copper">Design Impact Summary</span>
        <Button variant="secondary" onClick={onDismiss}>Dismiss</Button>
      </div>
      <div className="px-3 py-3 space-y-3">
        <div>
          <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">{editTitle}</div>
          <div className="font-mono text-[13px] text-ink mt-0.5">
            <span className="text-steel">{editFrom}</span>
            <span className="text-steel mx-2">to</span>
            <span className="font-semibold">{editTo}</span>
          </div>
        </div>

        {lever && (
          <div className="border-t border-dashed border-line pt-2">
            <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">
              Lever Moved by Solver: {lever.label}
            </div>
            <div className="font-mono text-[12px] text-amber mt-0.5">{lever.from} to {lever.to}</div>
            <p className="text-[10px] font-body text-steel mt-1">Why this lever: {lever.why}</p>
          </div>
        )}

        {dependents.length > 0 && (
          <div className="border-t border-dashed border-line pt-2">
            <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2 mb-1">
              Dependent Parameters Moved ({dependents.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {dependents.map((d) => (
                <div key={d.key} className="flex items-baseline justify-between text-[10px] font-mono py-0.5 border-b border-dashed border-line">
                  <span className="text-ink2 font-sans">{d.label}</span>
                  <span><span className="text-steel">{d.from}</span> <span className="text-steel">-&gt;</span> <span className="text-ink">{d.to}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {engineImpacts.length > 0 && (
          <div className="border-t border-dashed border-line pt-2 space-y-3">
            {engineImpacts.map((imp) => (
              <div key={imp.k}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-display uppercase tracking-[0.14em] text-ink2">{imp.k}</span>
                  <span className={`text-[9px] font-display uppercase px-1 ${imp.good ? 'text-good' : 'text-alert'}`}>
                    {imp.good ? 'Favourable' : 'Unfavourable'}
                  </span>
                </div>
                {imp.from && imp.to && (
                  <div className="font-mono text-[11px] mt-0.5">
                    <span className="text-steel">{imp.from}</span>
                    <span className="text-steel mx-2">to</span>
                    <span className={imp.good ? 'text-good' : 'text-alert'}>{imp.to}</span>
                  </div>
                )}
                <p className="text-[10px] font-body text-ink2 mt-1 leading-snug">{imp.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
