import React, { useEffect, useState } from 'react';
import { listRateCards, saveRateCard, newRateCardId, currentRateCard } from '../../lib/projects';
import { RATE_KEY_GROUPS } from '../lib/rateKeys';
import { withRateDefaults } from '../lib/pricing';
import { Card, Button, inputCls, labelCls } from './ui';
import type { RateCard, Rates } from '../../lib/types';

interface RateCardManagerProps {
  orgId: string;
  uid: string;
  liveRates: Rates;
  /** The card id the design currently open is actually priced against --
   *  distinct from whichever card is effective by date, since a viewed or
   *  locked revision may be priced against an older one. This is the row
   *  labelled "Active", not a date computation. */
  currentRateCardId: string;
  onClose: () => void;
  /** Switches the live design to this card's own rates -- a plain selection,
   *  not a save. */
  onSelect: (card: RateCard & { id: string }) => void;
  /** A new dated version was just saved and is now the active card. */
  onSaved: (card: RateCard & { id: string }) => void;
}

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * TASKS.md item 11.1: rate cards as real documents under
 * orgs/{orgId}/rateCards, effective-from dated. A card is never edited in
 * place -- saving always writes a new id with today's (or a chosen future)
 * effectiveFrom, so a revision that already froze a rateSnapshot from an
 * older card keeps reading exactly what it saved regardless of what this
 * screen does afterwards.
 */
export function RateCardManager({
  orgId, uid, liveRates, currentRateCardId, onClose, onSelect, onSaved,
}: RateCardManagerProps) {
  const [cards, setCards] = useState<(RateCard & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [draftName, setDraftName] = useState('Standard rates');
  const [draftEffectiveFrom, setDraftEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [draftRates, setDraftRates] = useState<Rates>(withRateDefaults(liveRates));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listRateCards(orgId)
      .then((c) => {
        setCards(c);
        setLoaded(true);
        const current = currentRateCard(c);
        if (current) setDraftName(current.name);
      })
      .catch((e) => { setError(String(e)); setLoaded(true); });
  }, [orgId, refreshKey]);

  const setField = (key: string, value: number) => setDraftRates((r) => ({ ...r, [key]: value }));

  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      const id = newRateCardId(orgId);
      const effectiveFrom = new Date(draftEffectiveFrom).getTime();
      const card: Omit<RateCard, 'updatedAt' | 'updatedBy'> = {
        name: draftName, currency: 'INR', rates: draftRates, effectiveFrom,
      };
      await saveRateCard(orgId, uid, id, card);
      setRefreshKey((k) => k + 1);
      onSaved({ ...card, id, updatedBy: uid, updatedAt: Date.now() });
    } catch (e) {
      window.alert(`Save failed: ${e}`);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <Card title="Rate Cards" subtitle="orgs/{orgId}/rateCards, effective-from dated">
          {!loaded && <p className="text-[11px] text-steel px-1 py-2">Loading rate cards.</p>}
          {error && <p className="text-[11px] text-alert px-1 py-2">{error}</p>}

          {loaded && !error && (
            <div className="divide-y divide-line mb-4">
              {cards.map((c) => (
                <div key={c.id} className="py-2 px-1 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-ink2">
                      {c.name}{c.id === currentRateCardId ? <span className="text-copper font-semibold"> (Active)</span> : ''}
                    </div>
                    <div className="text-[9px] font-mono text-steel">
                      Effective from {fmtDate(c.effectiveFrom)} &middot; updated {fmtDate(c.updatedAt)}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" onClick={() => onSelect(c)}>Use This Card</Button>
                    <Button variant="secondary" onClick={() => { setDraftName(c.name); setDraftRates(withRateDefaults(c.rates)); }}>
                      Edit As New Version
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-line pt-3">
            <div className="text-[11px] font-display uppercase tracking-[0.14em] text-ink mb-2">
              Save a New Dated Version
            </div>
            <p className="text-[10px] text-steel mb-3">
              Never overwrites an existing card -- a project that already priced against an older one keeps its own
              frozen snapshot regardless of what is saved here.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <label className={labelCls}>Name</label>
                <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Effective From</label>
                <input
                  type="date" value={draftEffectiveFrom}
                  onChange={(e) => setDraftEffectiveFrom(e.target.value)} className={inputCls}
                />
              </div>
            </div>

            {RATE_KEY_GROUPS.map((group) => (
              <div key={group.title} className="mb-3">
                <div className="text-[10px] font-display uppercase tracking-[0.1em] text-steel mb-1.5">{group.title}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.fields.map(([key, label, unit]) => (
                    <div key={key} className="space-y-0.5">
                      <label className="text-[9px] text-ink2">{label}, {unit}</label>
                      <input
                        type="number" value={draftRates[key] ?? 0}
                        onChange={(e) => setField(key, Number(e.target.value))}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="confirm" onClick={handleSaveVersion} disabled={saving}>
                {saving ? 'Saving' : 'Save New Version'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-line mt-3">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
