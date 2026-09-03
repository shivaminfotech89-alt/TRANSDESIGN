import React from 'react';
import { cardCostModel, conductorSchedule, finLayout, radiatorLayout, conservatorSize, DEFAULT_CARD_RATES } from '@/packages/engine';
import { Card, DataRow, cardCls, cardHeaderCls, cardTitleCls, cardSubtitleCls, cardBodyCls, thCls, tdCls, inputCls } from '../ui';
import { fmtMoney } from '../../lib/format';

interface CostCardTabProps {
  design: any;
  params: any;
  rates: Record<string, number>;
  /** CALIBRATION.md section 93: the live BOM, shown beside the card total
   *  purely so the two figures are never mistaken for each other. The card
   *  is material only; ex-works is the full BOM. */
  bom: any;
  onCardExtraChange: (value: number) => void;
  readOnly?: boolean;
}

const f = (n: number, dp = 1) => (typeof n === 'number' && isFinite(n) ? n.toFixed(dp) : '--');
const kg = (n: number) => `${fmtMoney(n)} Kg`;

/** CALIBRATION.md section 9: the designer's own per-kg costing card,
 *  reproduced layout for layout against a real one ("630 KVA CU LEVEL 1
 *  Costing & Data") -- additive alongside the BOM & Cost tab, not a
 *  replacement. Reads straight off the live design/params/rates, nothing
 *  stored here except cardExtra, which is a design parameter like any
 *  other override (CLAUDE.md invariant 2) -- there is no formula for it. */
export function CostCardTab({ design: d, params: p, rates, bom, onCardExtraChange, readOnly }: CostCardTabProps) {
  const cost = cardCostModel(d, rates, DEFAULT_CARD_RATES, p.cardExtra || 0);
  const extraUnset = !(p.cardExtra > 0);
  const cond = conductorSchedule(d, p);
  // CALIBRATION.md section 24: finLayout is fin-tank-only -- a radiator
  // design reads radiatorLayout instead, not finLayout wearing a
  // radiator's name.
  const isRadiator = !d.dry && p.tankType === 'radiator';
  const fins = d.dry ? null : (isRadiator ? radiatorLayout(d) : finLayout(d));
  const cons = isRadiator ? conservatorSize(d) : null;

  const lossAt100 = d.totalLoss;
  const lossAt50 = d.noLoad + d.loadLoss * 0.25;
  const weightCoreWinding = d.wCore + d.wLVCovered + d.wHVCovered;
  const weightTankFittings = d.dry ? d.wEnclosure : d.wFrame + d.wTank + d.wFin;
  const weightOil = d.dry ? 0 : d.fluidLitres * d.fluid.dens;
  const totalWeight = weightCoreWinding + weightTankFittings + weightOil + d.wIns;

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className={`${cardHeaderCls} flex-col items-start gap-0.5`}>
          <span className={cardTitleCls}>
            {p.kva} KVA {d.cLV.short.toUpperCase()} LEVEL 1 COSTING &amp; DATA
          </span>
          <span className={cardSubtitleCls}>COMPLETE COSTING AND DETAILS FOR DRAWINGS AND GTP.</span>
          <span className={cardSubtitleCls}>Flux Density = {f(d.B, 4)} Tesla</span>
        </div>
        <div className={`${cardBodyCls} grid grid-cols-1 lg:grid-cols-2 gap-6`}>
          {/* Left column: Costing */}
          <div>
            <div className="text-[11px] font-display uppercase tracking-[0.14em] text-copper mb-2">Costing:-</div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thCls}>#</th><th className={thCls}>Item</th>
                  <th className={`${thCls} text-right`}>Qty</th><th className={thCls}>Unit</th>
                  <th className={`${thCls} text-right`}>Rate</th><th className={`${thCls} text-right`}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {cost.rows.map((r: any) => (
                  <tr key={r.no}>
                    <td className={`${tdCls} font-mono text-[10px] text-steel`}>{r.no}.)</td>
                    <td className={`${tdCls} text-[11px] text-ink2`}>{r.desc}</td>
                    <td className={`${tdCls} text-right font-mono text-[11px]`}>{f(r.qty, r.unit === "No's" ? 0 : 2)}</td>
                    <td className={`${tdCls} text-[10px] text-steel`}>{r.unit}</td>
                    <td className={`${tdCls} text-right font-mono text-[11px]`}>{fmtMoney(r.rate)}</td>
                    <td className={`${tdCls} text-right font-mono text-[11px] font-semibold text-ink`}>{fmtMoney(r.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td className={`${tdCls} font-mono text-[10px] text-steel`}>{cost.rows.length + 1}-{cost.rows.length + 2}.)</td>
                  <td className={`${tdCls} text-[11px] text-ink2`} colSpan={4}>
                    {cost.extraLabel}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-steel">Not derived, enter what the works would charge:</span>
                      <input
                        type="number"
                        value={p.cardExtra || 0}
                        onChange={(e) => onCardExtraChange(Number(e.target.value))}
                        disabled={readOnly}
                        className={`${inputCls} w-32`}
                      />
                    </div>
                  </td>
                  <td className={`${tdCls} text-right font-mono text-[11px] font-semibold text-ink align-top`}>{fmtMoney(cost.extra)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-sheetAlt">
                  <td className={tdCls} colSpan={5}>
                    <span className="text-[11px] font-display uppercase tracking-[0.12em] text-copper">Total, Material Only</span>
                    <div className="text-[10px] text-ink2 mt-0.5 normal-case tracking-normal">
                      Bought-in material at per-kg rates, plus Extra. No labour, scrap, overhead, freight, margin or GST.
                    </div>
                  </td>
                  <td className={`${tdCls} text-right font-mono text-[13px] font-bold text-copper`}>{fmtMoney(cost.total)}</td>
                </tr>
              </tfoot>
            </table>
            <p className="text-[10px] text-steel mt-2">
              No overhead, scrap, margin or GST here -- labour and miscellaneous sit inside the Extra line above.
              This total is not the BOM &amp; Cost tab's ex-works price and is not meant to reconcile with it: LT/HT
              weight above is covered conductor mass, that tab's WD-01/WD-02 lines price bare.
            </p>
            {/* CALIBRATION.md section 93: the card total and ex-works were being
                read as two prices for one design -- 14,01,844 against 16,16,114.
                They are two costing models, and the gap is mostly the markup
                chain the card does not carry plus an Extra nobody has entered.
                Both figures are now stated together, with which is quotable. */}
            <div className="mt-3 border border-line rounded-[2px] px-3 py-2 bg-sheetAlt">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">Card Total, Material Only</div>
                  <div className="font-mono text-[15px] font-semibold text-copper">{fmtMoney(cost.total)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-display uppercase tracking-[0.1em] text-ink2">Ex-Works, Full BOM, Excludes GST</div>
                  <div className="font-mono text-[15px] font-semibold text-ink">{fmtMoney(bom.exFactory)}</div>
                </div>
              </div>
              <p className="text-[10px] text-ink2 leading-snug mt-2">
                <span className="font-semibold">Quote the ex-works figure, not this card.</span> The two are different
                costing models and are not meant to reconcile: the card is bought-in material at per-kg rates, ex-works
                is the full BOM with labour, scrap, overhead, freight and margin on top.
              </p>
              {extraUnset && (
                <p className="text-[10px] text-amber leading-snug mt-1.5">
                  Extra is not set, so this card total is material alone and is understated as an estimate of anything.
                  The one real costing card held for comparison, the 630 kVA Mehir sheet, carried an Extra of
                  Rs 75,000 on a Rs 10,52,191 material subtotal -- 7.13% of the subtotal, 6.65% of its own total.
                  That is the only measured figure available; it is guidance for the order of magnitude, not a formula.
                </p>
              )}
            </div>
          </div>

          {/* Right column: losses + Drawing & GTP Data */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-display uppercase tracking-[0.14em] text-copper mb-2">Losses</div>
              <DataRow label="TOTAL losses at 50% load" value={f(lossAt50, 0)} unit="Watts" />
              <DataRow label="TOTAL losses at 100% load" value={f(lossAt100, 0)} unit="Watts" />
              <DataRow label="No-load loss limit, derived" value={d.compliance.nll ? f(d.compliance.nll.lim, 0) : "not declared"} unit={d.compliance.nll ? "Watts" : ""} />
              <DataRow label="Load loss limit, derived" value={f(d.loadLoss, 0)} unit="Watts" />
              <DataRow label="No-load loss, component" value={f(d.noLoad, 0)} unit="Watts" />
              <DataRow label="Load loss, component" value={f(d.loadLoss, 0)} unit="Watts" />
              <DataRow label="% Impedance" value={f(d.pctZ, 2)} unit="%" tone="copper" />
              <DataRow label="Quoted resistance, LV" value={d.rLV.toExponential(2)} unit="ohms" />
              <DataRow label="Quoted resistance, HV" value={f(d.rHV, 3)} unit="ohms" />
              {/* CALIBRATION.md section 93: these six lines were read as
                  contradicting each other -- a load loss of 5099 W sitting above
                  a "losses at 100% load" of 5882 W. They are a component and a
                  total. Which is which, and which one the standard actually
                  binds, has to be on the screen. */}
              <p className="text-[10px] text-ink2 leading-snug mt-1.5">
                The first two lines are <span className="font-semibold">totals</span> -- no-load plus load loss, at 50%
                and at 100% of rated load. IS 1180 (Part 1) : 2014 constrains those two totals and nothing else: it
                gives no separate no-load or load-loss limit. The four lines under them are components of those totals,
                not independently limited figures.
              </p>
              <p className="text-[10px] text-ink2 leading-snug mt-1">
                The two "derived" limits are not published values. They are the corner of the IS 1180 region, obtained by
                solving its two total conditions together -- any split of the total inside that region is equally
                compliant, and a design may trade core against copper freely so long as both totals hold. Outside the
                ratings IS 1180 lists, they are the engine's own estimate (CLAUDE.md invariant 6), not a limit at all.
              </p>
            </div>

            <div>
              <div className="text-[11px] font-display uppercase tracking-[0.14em] text-copper mb-2">Drawing &amp; GTP Data</div>
              <DataRow label="1. Weight of core and winding" value={kg(weightCoreWinding)} />
              <DataRow label="2. Weight of tank and fittings" value={kg(weightTankFittings)} />
              <DataRow label="3. Weight of oil" value={kg(weightOil)} />
              <DataRow label="4. Volume of oil" value={`${Math.round(d.dry ? 0 : d.fluidLitres).toLocaleString('en-IN')} Ltrs`} />
              <DataRow label="5. Total weight" value={kg(totalWeight)} tone="copper" />
              <p className="text-[9px] text-steel mt-1">
                Items 3 and 4 come from one figure here (fluid volume x density) -- the reference sheet this
                card was built against shows two slightly different oil figures of its own (costed vs GTP);
                that discrepancy is the sheet's, not reproduced here, since the engine holds only one.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card title="Core Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
          <DataRow label="Core diameter" value={f(d.dCore, 1)} unit="mm" />
          <DataRow label="Window height" value={f(d.Hw, 1)} unit="mm" />
          <DataRow label="Limb centre distance" value={f(d.cc, 1)} unit="mm" />
        </div>
      </Card>

      <Card title="LV Winding Data" subtitle={`${cond.lv.construction}, ${d.cLV.name}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
          <DataRow label="Turns" value={String(d.nLV)} />
          <DataRow label="ID / OD" value={`${f(d.lvID, 0)} / ${f(d.lvOD, 0)}`} unit="mm" />
          <DataRow label="Conductor, bare" value={`${f(cond.lv.bare.w, 2)} x ${f(cond.lv.bare.t, 3)}`} unit="mm" />
          <DataRow label="No. of conductors" value={String(cond.lv.parallel)} />
          <DataRow label="Area" value={f(d.aLVreq, 1)} unit="mm²" />
          <DataRow label="Current density" value={f(d.dLV, 2)} unit="A/mm²" />
          <DataRow label="Axial (winding height)" value={f(d.hLV, 1)} unit="mm" />
          <DataRow label="Weight, bare / covered" value={`${f(cond.lv.weight.bare, 1)} / ${f(cond.lv.weight.covered, 1)}`} unit="kg" />
        </div>
      </Card>

      <Card title="HV Winding Data" subtitle={`${d.hvConstruction}, ${d.cHV.name}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
          <DataRow label="Turns, normal / extreme" value={`${d.nHV} / ${d.nHVmax}`} />
          <DataRow label="ID / OD" value={`${f(d.hvID, 0)} / ${f(d.hvOD, 0)}`} unit="mm" />
          <DataRow label="Conductor, bare" value={`${f(cond.hv.bare.w, 2)} x ${f(cond.hv.bare.t, 2)}`} unit="mm" />
          <DataRow label="No. of conductors, A/x" value={`${cond.hv.parallel}${cond.hv.arrangement ? `, ${cond.hv.arrangement}` : ''}`} />
          <DataRow label="Area" value={f(d.aHVreq, 1)} unit="mm²" />
          <DataRow label="Current density" value={f(d.dHV, 2)} unit="A/mm²" />
          <DataRow label="Axial (winding height)" value={f(d.hHV, 1)} unit="mm" />
          <DataRow label="Weight, bare / covered" value={`${f(cond.hv.weight.bare, 1)} / ${f(cond.hv.weight.covered, 1)}`} unit="kg" />
          <DataRow
            label="Coil to coil / disc to disc gap"
            value={d.hvConstruction === 'layer' ? 'n/a, single layer' : f(d.groupGap, 1)}
            unit={d.hvConstruction === 'layer' ? undefined : 'mm'}
          />
          <DataRow label="Tap gap" value="To be specified" />
          <DataRow label="End clearance" value={f(p.endClrHV, 0)} unit="mm" />
        </div>
      </Card>

      {d.dry ? (
        <Card title="Enclosure" subtitle="Dry type -- no tank, conservator or fin/radiator layout applies">
          <DataRow label="Enclosure weight" value={kg(d.wEnclosure)} />
        </Card>
      ) : (
        <>
          <Card title="Conservator Dimensions">
            {isRadiator ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <DataRow label="Diameter" value={f(cons!.dia, 0)} unit="mm" />
                <DataRow label="Length" value={f(cons!.length, 0)} unit="mm" />
                <DataRow label="Volume" value={f(cons!.volumeL, 0)} unit="L" />
              </div>
            ) : (
              <p className="text-[11px] text-steel px-1 py-2">
                Not applicable: a sealed fin tank has no conservator (CALIBRATION.md section 24).
              </p>
            )}
          </Card>

          <Card title="Tank Details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
              <DataRow label="Length" value={f(d.tankL, 0)} unit="mm" />
              <DataRow label="Width" value={f(d.tankW, 0)} unit="mm" />
              <DataRow label="Height" value={f(d.tankH, 0)} unit="mm" />
            </div>
          </Card>

          <Card title="PSR / Fin Details" subtitle={isRadiator ? 'Pressed-steel radiator' : 'Corrugated fin'}>
            {isRadiator ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                  <DataRow label="Panel size" value={`${fins!.panelWidth} x ${Math.round(fins!.panelHeight)}`} unit="mm" />
                  <DataRow label="Total panels" value={String(fins!.totalPanels)} />
                  <DataRow label="Banks, panels per bank" value={`${fins!.bankCount} x ${fins!.panelsPerBank}`} />
                  <DataRow label="LV banks / HV banks" value={`${fins!.lvBanks} / ${fins!.hvBanks}`} />
                  <DataRow label="Header pipe centres" value={f(fins!.headerCentres, 0)} unit="mm" />
                  <DataRow label="Valves, total" value={String(fins!.totalValves)} />
                </div>
                <p className="text-[9px] text-steel mt-1">
                  Two isolating valves per bank (top and bottom), so a bank can be removed without draining the
                  tank -- standard practice, not derived from a specific vendor's fitting.
                </p>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <DataRow label="Panel size" value={`${fins!.depth} x ${Math.round(fins!.height)}`} unit="mm" />
                <DataRow label="Total panels" value={String(fins!.n)} />
                <DataRow label="LV end / HV end" value={`${fins!.lvEnd} / ${fins!.hvEnd}`} />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
