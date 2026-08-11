import React, { useEffect, useState } from 'react';
import {
  tappingSchedule, conductorSchedule, hardwareSchedule, insulationPieceList, finLayout, windingSchedule,
} from '@/packages/engine';
import { Card, Button, thCls, tdCls, inputCls, labelCls } from '../ui';
import { useAuth } from '../AuthContext';
import { useOrg } from '../OrgContext';
import { listShopNotes, saveShopNote, deleteShopNote, seedShopNotes } from '../../../lib/projects';
import type { ShopNote } from '../../../lib/types';

interface ManufacturingTabProps {
  design: any;
  params: any;
}

const f = (n: number, dp = 1) => (typeof n === 'number' ? n.toFixed(dp) : String(n));

/** windingSchedule's groupRows is one row per coil/disc, but the even-spread
 *  distribution it prints is always a run of "one more turn" groups
 *  followed by a run of the base count -- collapsing consecutive identical
 *  (turns, layers) rows into a numbered range keeps a 44-disc schedule
 *  readable as the two or three bands it actually is, without hiding any
 *  individual disc's own figure (still there via `from`-`to`). */
function bandRows(rows: { index: number; turns: number; layers: number }[]) {
  const bands: { from: number; to: number; turns: number; layers: number }[] = [];
  for (const r of rows) {
    const last = bands[bands.length - 1];
    if (last && last.turns === r.turns && last.layers === r.layers) last.to = r.index;
    else bands.push({ from: r.index, to: r.index, turns: r.turns, layers: r.layers });
  }
  return bands;
}

/** MANUFACTURING.md, build order steps 1-4. Reads straight off the live
 *  design and params -- nothing here is stored, exactly like every other
 *  tab (CLAUDE.md invariant 2), except the shop notes library itself, which
 *  is org-level standing instruction, not a computed design output. */
export function ManufacturingTab({ design: d, params: p }: ManufacturingTabProps) {
  const tap = tappingSchedule(d, p);
  const cond = conductorSchedule(d, p);
  const hw = hardwareSchedule(d, p);
  const ins = insulationPieceList(d, p);
  const fins = finLayout(d);
  const wind = windingSchedule(d, p);

  return (
    <div className="space-y-4">
      <Card title="Cooling Arrangement" subtitle={d.dry ? 'Dry type, no fin or radiator tank' : `${p.tankType === 'fin' ? 'Fin' : 'Radiator'} tank`}>
        {d.dry ? (
          <p className="text-[11px] text-steel px-1 py-2">Dry-type enclosure -- no fin or radiator layout applies.</p>
        ) : (
          <div className="px-1 space-y-2">
            <p className="text-[11px] text-ink2">
              {fins.n} {p.tankType === 'fin' ? 'fins' : 'radiator panels'} total, {fins.depth} mm deep,
              {' '}{Math.round(fins.height)} mm tall.
            </p>
            <table className="w-full max-w-md">
              <thead>
                <tr><th className={thCls}>End of tank</th><th className={`${thCls} text-right`}>Count</th></tr>
              </thead>
              <tbody>
                <tr><td className={tdCls}>LV end</td><td className={`${tdCls} text-right font-mono`}>{fins.lvEnd}</td></tr>
                <tr><td className={tdCls}>HV end</td><td className={`${tdCls} text-right font-mono`}>{fins.hvEnd}</td></tr>
              </tbody>
            </table>
            <p className="text-[10px] text-steel">
              Split 1:2 toward the HV end, fitted from the 1250 kVA reference sheet (2 LV / 4 HV) -- the LV end
              carries the bushings, cable box and tap changer linkage and has less wall space. Check against the
              works' own tank layout before cutting panels.
            </p>
          </div>
        )}
      </Card>

      <Card title="Tapping Schedule" subtitle={p.tapType === 'none' ? 'No tappings' : `${tap.rows.length} positions, ${tap.wholeStepTurns} turns per step`}>
        {tap.rows.length === 0 ? (
          <p className="text-[11px] text-steel px-1 py-2">No tappings, links only.</p>
        ) : (
          <>
            <p className="text-[11px] text-ink2 px-1 pb-2">
              Regulating section {tap.regulatingTurns} turns, centred in the winding (turn {tap.sectionStart} to{' '}
              {tap.sectionFinish}, {tap.turnsBelow} turns below and {tap.turnsAbove} above -- a placement
              assumption per MANUFACTURING.md, not a measured physical layout; see the note below).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={thCls}>Position</th>
                    <th className={`${thCls} text-right`}>Nominal %</th>
                    <th className={`${thCls} text-right`}>HV turns in circuit</th>
                    <th className={`${thCls} text-right`}>Voltage</th>
                    <th className={`${thCls} text-right`}>Volts/turn</th>
                    <th className={`${thCls} text-right`}>Rounding error</th>
                  </tr>
                </thead>
                <tbody>
                  {tap.rows.map((r: any) => (
                    <tr key={r.position} className={r.isNormal ? 'bg-sheetAlt' : ''}>
                      <td className={`${tdCls} font-mono`}>{r.isNormal ? 'N' : (r.position > 0 ? `+${r.position}` : r.position)}</td>
                      <td className={`${tdCls} text-right font-mono`}>{f(r.nominalPct, 2)}%</td>
                      <td className={`${tdCls} text-right font-mono`}>{r.turns}</td>
                      <td className={`${tdCls} text-right font-mono`}>{f(r.voltage, 0)} V</td>
                      <td className={`${tdCls} text-right font-mono`}>{f(r.et, 3)}</td>
                      <td className={`${tdCls} text-right font-mono ${Math.abs(r.etErrorPct) > 1 ? 'text-amber' : 'text-steel'}`}>{f(r.etErrorPct, 2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-steel px-1 pt-2">
              Turns per step are rounded to a whole number ({tap.wholeStepTurns}), so each tap's real voltage
              misses its nominal percentage by the rounding error shown -- not hidden, per MANUFACTURING.md.
              "HV turns in circuit" is also the turn number the tap is taken at: this engine winds HV as one
              continuous layer, so the two coincide (MANUFACTURING.md section 5 will separate them for a disc
              or crossover winding).
            </p>
          </>
        )}
      </Card>

      <Card title="Conductor and Covering Schedule">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
          <div>
            <div className="text-[11px] font-display uppercase tracking-[0.1em] text-ink2 mb-1">LV -- {d.cLV.name}</div>
            <table className="w-full">
              <tbody>
                <tr><td className={tdCls}>Construction</td><td className={`${tdCls} text-right`}>{cond.lv.construction}</td></tr>
                <tr><td className={tdCls}>Bare size</td><td className={`${tdCls} text-right font-mono`}>{f(cond.lv.bare.w, 2)} x {f(cond.lv.bare.t, 3)} mm</td></tr>
                <tr><td className={tdCls}>Radial layers</td><td className={`${tdCls} text-right font-mono`}>{cond.lv.layers}</td></tr>
                <tr><td className={tdCls}>Covering</td><td className={`${tdCls} text-right`}>{cond.lv.covering}</td></tr>
                <tr><td className={tdCls}>Parallel</td><td className={`${tdCls} text-right font-mono`}>{cond.lv.parallel}{cond.lv.arrangement ? ` (${cond.lv.arrangement})` : ''}</td></tr>
                <tr><td className={tdCls}>Transposition</td><td className={`${tdCls} text-right`}>{cond.lv.transposition ? 'Required' : 'Not required'}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div className="text-[11px] font-display uppercase tracking-[0.1em] text-ink2 mb-1">HV -- {d.cHV.name}</div>
            <table className="w-full">
              <tbody>
                <tr><td className={tdCls}>Bare size</td><td className={`${tdCls} text-right font-mono`}>{f(cond.hv.bare.w, 2)} x {f(cond.hv.bare.t, 2)} mm</td></tr>
                <tr><td className={tdCls}>Covered size</td><td className={`${tdCls} text-right font-mono`}>{f(cond.hv.covered.w, 2)} x {f(cond.hv.covered.t, 2)} mm</td></tr>
                <tr><td className={tdCls}>Covering</td><td className={`${tdCls} text-right`}>{cond.hv.covering}</td></tr>
                <tr><td className={tdCls}>Parallel</td><td className={`${tdCls} text-right font-mono`}>{cond.hv.parallel}{cond.hv.arrangement ? ` (${cond.hv.arrangement})` : ''}</td></tr>
                <tr><td className={tdCls}>Transposition</td><td className={`${tdCls} text-right`}>{cond.hv.transposition ? 'Required' : 'Not required'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        {cond.hv.parallel > 1 && (
          <p className="text-[10px] text-amber px-1 pt-2">
            HV split into {cond.hv.parallel} parallel conductors is a heuristic (practical single-strand ceiling),
            not confirmed against either reference sheet at this current -- check against the works' own practice.
          </p>
        )}
        {cond.lv.parallel > 1 && (
          <p className="text-[10px] text-steel px-1 pt-2">
            LV split into {cond.lv.parallel} parallel conductors matches the 630 kVA dry reference's own 4 axial x 2
            radial exactly; the 1250 kVA reference's own 5 axial by 6 radial over two layers is not reproduced
            structurally even where the overall LV OD is close -- check against the works' own practice at that rating.
          </p>
        )}
      </Card>

      <Card title="Winding Schedule" subtitle={`HV -- ${wind.hv.construction} construction`}>
        {wind.hv.construction === 'layer' ? (
          <p className="text-[11px] text-steel px-1 py-2">{wind.note}</p>
        ) : (
          <>
            <table className="w-full max-w-lg">
              <tbody>
                <tr><td className={tdCls}>{wind.hv.label === 'coil' ? 'Coils' : 'Discs'}</td><td className={`${tdCls} text-right font-mono`}>{wind.hv.groups}</td></tr>
                <tr><td className={tdCls}>Turns per axial layer</td><td className={`${tdCls} text-right font-mono`}>{wind.hv.turnsPerLayer}</td></tr>
                <tr><td className={tdCls}>Layers per {wind.hv.label}, at the fullest</td><td className={`${tdCls} text-right font-mono`}>{wind.hv.layersPerGroup}</td></tr>
                <tr><td className={tdCls}>Total HV turns (extreme tap)</td><td className={`${tdCls} text-right font-mono`}>{wind.hv.totalTurns}</td></tr>
              </tbody>
            </table>
            <div className="overflow-x-auto mt-3">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={thCls}>{wind.hv.label === 'coil' ? 'Coil' : 'Disc'} numbers</th>
                    <th className={`${thCls} text-right`}>Turns each</th>
                    <th className={`${thCls} text-right`}>Layers each</th>
                  </tr>
                </thead>
                <tbody>
                  {bandRows(wind.groupRows).map((b) => (
                    <tr key={b.from}>
                      <td className={`${tdCls} font-mono`}>{b.from === b.to ? b.from : `${b.from}-${b.to}`}</td>
                      <td className={`${tdCls} text-right font-mono`}>{b.turns}</td>
                      <td className={`${tdCls} text-right font-mono`}>{b.layers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-amber px-1 pt-2">{wind.note}</p>
          </>
        )}
      </Card>

      <Card title="Hardware Schedule" subtitle="Sized from core and coil geometry, fitted against the 1250 kVA reference sheet">
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Item</th><th className={thCls}>Size</th>
              <th className={`${thCls} text-right`}>Qty</th><th className={thCls}>Material</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={tdCls}>Tie rods</td>
              <td className={`${tdCls} font-mono`}>&#8960;{hw.tieRod.dia} x {hw.tieRod.length} mm, {hw.tieRod.threadLength} mm thread both ends</td>
              <td className={`${tdCls} text-right font-mono`}>{hw.tieRod.qty}</td>
              <td className={tdCls}>{hw.tieRod.material}</td>
            </tr>
            <tr>
              <td className={tdCls}>Core bolts</td>
              <td className={`${tdCls} font-mono`}>&#8960;{hw.coreBolt.dia} x {hw.coreBolt.length} mm</td>
              <td className={`${tdCls} text-right font-mono`}>{hw.coreBolt.qty}</td>
              <td className={tdCls}>{hw.coreBolt.material}</td>
            </tr>
            <tr>
              <td className={tdCls}>Foot plates</td>
              <td className={`${tdCls} font-mono`}>{hw.footPlate.w} x {hw.footPlate.t} mm flat</td>
              <td className={`${tdCls} text-right font-mono`}>{hw.footPlate.qty}</td>
              <td className={tdCls}>{hw.footPlate.material}</td>
            </tr>
            <tr>
              <td className={tdCls}>Core clamp channel</td>
              <td className={`${tdCls} font-mono`}>{hw.clampChannel.length} mm long, section {hw.clampChannel.section}, holes {hw.clampChannel.holePositions}</td>
              <td className={`${tdCls} text-right font-mono`}>2</td>
              <td className={tdCls}>MS channel</td>
            </tr>
            <tr>
              <td className={tdCls}>Lifting / pulling lugs</td>
              <td className={`${tdCls} font-mono`}>Plate thickness {hw.lugs.plateThickness}</td>
              <td className={`${tdCls} text-right font-mono`}>{hw.lugs.qty}</td>
              <td className={tdCls}>--</td>
            </tr>
            {hw.neutralBusbar && (
              <tr>
                <td className={tdCls}>Neutral busbar, calculated minimum</td>
                <td className={`${tdCls} font-mono`}>{hw.neutralBusbar.w} x {hw.neutralBusbar.t} mm ({hw.neutralBusbar.area} mm&sup2; from LV current density)</td>
                <td className={`${tdCls} text-right font-mono`}>1</td>
                <td className={tdCls}>{hw.neutralBusbar.material}</td>
              </tr>
            )}
            {hw.deltaWire.map((w: any) => (
              <tr key={w.side}>
                <td className={tdCls}>Delta wire, {w.side}</td>
                <td className={`${tdCls} font-mono`}>{f(w.w, 2)} x {f(w.t, 2)} mm, {w.covering}</td>
                <td className={`${tdCls} text-right font-mono`}>3</td>
                <td className={tdCls}>--</td>
              </tr>
            ))}
          </tbody>
        </table>
        {hw.neutralBusbar && (
          <p className="text-[10px] text-amber px-1 pt-2">{hw.neutralBusbar.note}</p>
        )}
        <p className="text-[10px] text-steel px-1 pt-2">
          "To be specified" fields have no worked example in either reference sheet and no clean geometric
          derivation -- printed rather than guessed. Material for rods and bolts is works practice, not
          computed: enter it once in the shop notes library below.
        </p>
      </Card>

      <Card title="Insulation Piece List">
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Item</th><th className={thCls}>Material</th>
              <th className={`${thCls} text-right`}>Qty</th><th className={`${thCls} text-right`}>Thickness</th>
            </tr>
          </thead>
          <tbody>
            {ins.derived.map((r: any) => (
              <tr key={r.item}>
                <td className={tdCls}>{r.item}</td>
                <td className={tdCls}>{r.material}</td>
                <td className={`${tdCls} text-right font-mono`}>{r.qty}</td>
                <td className={`${tdCls} text-right font-mono`}>
                  {f(r.thickness, 1)} mm{r.diameter ? `, &#8960;${f(r.diameter, 0)} x ${f(r.height, 0)} mm` : ''}
                </td>
              </tr>
            ))}
            {ins.pending.map((r: any) => (
              <tr key={r.item} className="text-steel">
                <td className={tdCls}>{r.item}</td>
                <td className={tdCls}>{r.material || '--'}</td>
                <td className={`${tdCls} text-right font-mono text-amber`}>{r.qty}</td>
                <td className={`${tdCls} text-right font-mono`}>{r.thickness != null ? `${f(r.thickness, 1)} mm` : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-steel px-1 pt-2">
          HT spacers, common blocks, CEEDEE blocks, oil ducts and dovetail strips depend on the axial disc or
          coil layout (MANUFACTURING.md section 6) and are not estimated -- their quantity is marked "to be
          specified" until that capability exists.
        </p>
      </Card>

      <ShopNotesLibrary />
    </div>
  );
}

const CATEGORY_LABELS: Record<ShopNote['category'], string> = {
  winding: 'Winding', core: 'Core', tank: 'Tank', general: 'General',
};

/** MANUFACTURING.md section 8: standing shop instructions, entered once at
 *  org level and selected per job, never generated -- see lib/projects.ts
 *  seedShopNotes for why the seven sheet examples are an explicit load, not
 *  an automatic one. */
function ShopNotesLibrary() {
  const { orgId } = useOrg();
  const { user } = useAuth();
  const uid = user?.uid || '';

  const [notes, setNotes] = useState<(ShopNote & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [text, setText] = useState('');
  const [category, setCategory] = useState<ShopNote['category']>('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    listShopNotes(orgId)
      .then((n) => { setNotes(n); setLoaded(true); })
      .catch((e) => { setError(String(e)); setLoaded(true); });
  }, [orgId, refreshKey]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await saveShopNote(orgId, uid, null, { text: text.trim(), category, fromReferenceSheet: false });
      setText('');
      setRefreshKey((k) => k + 1);
    } catch (e) {
      window.alert(`Save failed: ${e}`);
    }
    setSaving(false);
  };

  const handleDelete = async (n: ShopNote & { id: string }) => {
    if (!window.confirm('Remove this shop note? This cannot be undone.')) return;
    try {
      await deleteShopNote(orgId, n.id);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      window.alert(`Delete failed: ${e}`);
    }
  };

  const handleLoadExamples = async () => {
    if (!window.confirm('Load the seven example shop notes from the two reference sheets? Review and edit them afterwards -- they are examples, not this works\' own practice.')) return;
    setSaving(true);
    try {
      await seedShopNotes(orgId, uid);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      window.alert(`Load failed: ${e}`);
    }
    setSaving(false);
  };

  return (
    <Card title="Shop Notes Library" subtitle="Standing instructions, entered once, applied to any design -- never generated">
      {!loaded && <p className="text-[11px] text-steel px-1 py-2">Loading shop notes.</p>}
      {error && <p className="text-[11px] text-alert px-1 py-2">{error}</p>}

      {loaded && !error && (
        <>
          {notes.length === 0 && (
            <div className="px-1 pb-3 space-y-2">
              <p className="text-[11px] text-steel">No shop notes recorded yet.</p>
              <Button variant="secondary" onClick={handleLoadExamples}>Load Example Notes From The Reference Sheets</Button>
            </div>
          )}
          <div className="divide-y divide-line mb-3">
            {notes.map((n) => (
              <div key={n.id} className="py-2 px-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] font-display uppercase tracking-[0.1em] text-patina mr-2">{CATEGORY_LABELS[n.category]}</span>
                  {n.fromReferenceSheet && <span className="text-[9px] font-display uppercase tracking-[0.1em] text-amber mr-2">Example, review</span>}
                  <span className="text-[11px] text-ink">{n.text}</span>
                </div>
                <Button variant="destructive" onClick={() => handleDelete(n)}>Remove</Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-2 px-1 pt-2 border-t border-line">
            <div className="flex-1 min-w-[240px] space-y-1">
              <label className={labelCls}>New note</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ShopNote['category'])} className={inputCls}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Button variant="primary" onClick={handleAdd} disabled={saving}>Add</Button>
          </div>
        </>
      )}
    </Card>
  );
}
