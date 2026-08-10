import React, { useMemo, useState } from 'react';
import { impacts, inr, APPS, STANDARDS } from '@/packages/engine';
import { Card, Button, thCls, tdCls } from '../ui';

interface CompareQuoteTabProps {
  /** The design actually being edited (core/over/pins), never the preview. */
  liveDesign: any;
  liveBom: any;
  /** What ResultsDisplay is currently showing everywhere else -- equals
   *  liveDesign/liveBom whenever nothing is previewed, and the previewed
   *  candidate's design/bom otherwise. This tab has nothing to show unless
   *  the two differ. */
  design: any;
  bom: any;
  params: any;
  activePreviewKey: string | null;
}

interface Impact { k: string; from: string; to: string; good: boolean; big?: boolean; body: string; }

/** impacts() entries that describe a construction choice rather than a
 *  consequence of one -- used to name what actually changed in the
 *  quotation paragraph, without re-deriving it from the raw designs. */
const CONSTRUCTION_KEYS = ['Conductor material', 'Core steel and joint', 'Tank and cooling', 'Flux density', 'Current density'];

function buildQuotationParagraph(a: any, ba: any, b: any, bb: any, p: any, impactsList: Impact[]): string {
  const dCost = bb.exFactory - ba.exFactory;
  const dEnergy = bb.energy.total - ba.energy.total;
  const net = dCost + dEnergy;
  const app = (APPS[p.application]?.name || p.application).toLowerCase();
  const std = STANDARDS[p.standard]?.name || p.standard;

  const changes = impactsList.filter((i) => CONSTRUCTION_KEYS.includes(i.k));
  const changeText = changes.length
    ? ` The alternative changes ${changes.map((i) => `${i.k.toLowerCase()} from ${i.from} to ${i.to}`).join('; ')}.`
    : '';

  const complianceNote = !b.compliant
    ? ` This design sits outside the declared loss schedule and cannot be offered as it stands, either the budget is raised or the enquiry is re-tendered at a lower efficiency level.`
    : '';

  return (
    `This alternative for the ${p.kva} kVA, ${p.hv / 1000} kV to ${p.lv} V ${p.vector} ${app} transformer (${std}) is offered `
    + `at an ex-works price of ${inr(bb.exFactory)}, delivered ${inr(bb.withGst)} including GST, against the standard design's `
    + `ex-works price of ${inr(ba.exFactory)}, delivered ${inr(ba.withGst)}, a ${dCost <= 0 ? 'saving' : 'increase'} of `
    + `${inr(Math.abs(dCost))} at the point of purchase.${changeText} The alternative returns a no-load loss of `
    + `${Math.round(b.noLoad)} W and a load loss of ${Math.round(b.loadLoss)} W, against ${Math.round(a.noLoad)} W and `
    + `${Math.round(a.loadLoss)} W for the standard design, at ${b.pctZ.toFixed(2)}% impedance and ${b.eff100.toFixed(2)}% `
    + `full-load efficiency. Evaluated over ${p.years} years at ₹${p.tariff}/kWh and ${(p.loadFactor * 100).toFixed(0)}% `
    + `average loading, the change in energy cost is ${inr(Math.abs(dEnergy))} ${dEnergy <= 0 ? 'saved' : 'spent'}, so the net `
    + `position over the life of the transformer is ${inr(Math.abs(net))} ${net <= 0 ? "in the buyer's favour" : 'against the buyer'}.`
    + complianceNote
  );
}

function MoneyRow({ label, value, favourable }: { label: string; value: string; favourable: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-dashed border-line last:border-0">
      <span className="text-[11px] text-ink2">{label}</span>
      <span className={`font-mono text-[13px] font-semibold ${favourable ? 'text-good' : 'text-alert'}`}>{value}</span>
    </div>
  );
}

/** The point of this tab: a design cheaper today can still cost more over
 *  its life. Every figure here is rupees, deliberately never a percentage,
 *  using the same formulas impacts()'s "Money, all in" entry does. */
function EnergyOverLife({ ba, bb, p }: { ba: any; bb: any; p: any }) {
  const dCost = bb.exFactory - ba.exFactory;
  const dDelivered = bb.withGst - ba.withGst;
  const dEnergy = bb.energy.total - ba.energy.total;
  const net = dCost + dEnergy;
  const sign = (n: number) => (n <= 0 ? '-' : '+');

  return (
    <Card title="Energy Cost Over the Design Life" subtitle={`${p.years} years at ₹${p.tariff}/kWh, ${(p.loadFactor * 100).toFixed(0)}% load factor`}>
      <MoneyRow label="Ex-Works Difference" value={`${sign(dCost)}${inr(Math.abs(dCost))}`} favourable={dCost <= 0} />
      <MoneyRow label="Delivered Difference, Incl. GST" value={`${sign(dDelivered)}${inr(Math.abs(dDelivered))}`} favourable={dDelivered <= 0} />
      <MoneyRow label={`Energy Cost Difference Over ${p.years} Years`} value={`${sign(dEnergy)}${inr(Math.abs(dEnergy))}`} favourable={dEnergy <= 0} />
      <MoneyRow label="Net Position Over the Design Life" value={`${sign(net)}${inr(Math.abs(net))}`} favourable={net <= 0} />
      <p className="text-[10px] text-steel mt-2 leading-snug">
        {net <= 0 ? "In the buyer's favour" : 'Against the buyer'} once the cost of the guaranteed losses is added to the
        purchase price. A design that costs less today can still cost more over its life, this is the number that
        settles that, in rupees.
      </p>
    </Card>
  );
}

function QuotationCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card title="Quotation Paragraph" subtitle="Ready to paste into an offer">
      <p className="text-[12px] font-body text-ink leading-relaxed">{text}</p>
      <div className="mt-3">
        <Button
          variant="primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Clipboard API unavailable (no secure context, permissions) --
              // the paragraph is still selectable and copyable by hand.
            }
          }}
        >
          {copied ? 'Copied' : 'Copy to Clipboard'}
        </Button>
      </div>
    </Card>
  );
}

export function CompareQuoteTab({ liveDesign, liveBom, design, bom, params, activePreviewKey }: CompareQuoteTabProps) {
  const isPreviewing = activePreviewKey !== null;

  const impactsList: Impact[] = useMemo(
    () => (isPreviewing ? impacts(liveDesign, liveBom, design, bom, params) : []),
    [isPreviewing, liveDesign, liveBom, design, bom, params],
  );
  const quotation = useMemo(
    () => (isPreviewing ? buildQuotationParagraph(liveDesign, liveBom, design, bom, params, impactsList) : ''),
    [isPreviewing, liveDesign, liveBom, design, bom, params, impactsList],
  );

  if (!isPreviewing) {
    return (
      <div className="border border-dashed border-rule rounded-[2px] bg-white p-8 text-center text-[11px] font-body text-steel">
        No budget option is currently previewed. Go to Fit to Budget and select Preview on a result to compare it
        here against the current working design.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card title="Comparing" subtitle="Current working design vs previewed budget option">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-display uppercase tracking-[0.1em] text-steel mb-1">Current Working Design</div>
            <div className="font-mono text-[14px] text-ink">{inr(liveBom.exFactory)} ex-works</div>
            <div className="font-mono text-[11px] text-steel">{inr(liveBom.withGst)} delivered</div>
          </div>
          <div>
            <div className="text-[10px] font-display uppercase tracking-[0.1em] text-steel mb-1">Previewed Budget Option</div>
            <div className="font-mono text-[14px] text-copper">{inr(bom.exFactory)} ex-works</div>
            <div className="font-mono text-[11px] text-steel">{inr(bom.withGst)} delivered</div>
          </div>
        </div>
      </Card>

      <EnergyOverLife ba={liveBom} bb={bom} p={params} />

      <Card title="Parameter-by-Parameter Comparison" subtitle={`${impactsList.length} change${impactsList.length === 1 ? '' : 's'}`}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Parameter</th>
              <th className={thCls}>Current Working Design</th>
              <th className={thCls}>Previewed Budget Option</th>
              <th className={`${thCls} text-right`}>Direction</th>
            </tr>
          </thead>
          <tbody>
            {impactsList.map((imp) => (
              <tr key={imp.k} className={imp.big ? 'bg-sheetAlt' : ''}>
                <td className={`${tdCls} text-[11px] text-ink2`}>{imp.k}</td>
                <td className={`${tdCls} font-mono text-[11px] text-steel`}>{imp.from}</td>
                <td className={`${tdCls} font-mono text-[11px] font-semibold ${imp.good ? 'text-good' : 'text-alert'}`}>{imp.to}</td>
                <td className={`${tdCls} text-right font-display uppercase text-[9px] tracking-[0.1em] ${imp.good ? 'text-good' : 'text-alert'}`}>
                  {imp.good ? 'Favourable' : 'Unfavourable'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-steel mt-2 px-1">
          "Money, all in" can mark a lower ex-works price Unfavourable: its direction is the net position over the
          design life, not the price alone. See Energy Cost Over the Design Life above for that in rupees.
        </p>
      </Card>

      <Card title="Impact Narratives">
        <div className="space-y-3">
          {impactsList.map((imp) => (
            <div key={imp.k} className={imp.big ? 'pt-2 border-t border-dashed border-line' : ''}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-display uppercase tracking-[0.14em] text-ink2">{imp.k}</span>
                <span className={`text-[9px] font-display uppercase px-1 ${imp.good ? 'text-good' : 'text-alert'}`}>
                  {imp.good ? 'Favourable' : 'Unfavourable'}
                </span>
              </div>
              <p className="text-[11px] font-body text-ink2 mt-1 leading-snug">{imp.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <QuotationCard text={quotation} />
    </div>
  );
}
