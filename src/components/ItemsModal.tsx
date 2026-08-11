import React, { useEffect, useState } from 'react';
import { listItems, saveItem, deleteItem, listSuppliers } from '../../lib/projects';
import { RATE_KEY_GROUPS, RATE_KEY_LABELS } from '../lib/rateKeys';
import { Card, Button, inputCls, labelCls } from './ui';
import type { Item, ItemCategory, ItemPrice, Supplier } from '../../lib/types';

interface ItemsModalProps {
  orgId: string;
  uid: string;
  canEdit: boolean;
  onClose: () => void;
}

type ItemDraft = Omit<Item, 'updatedAt' | 'updatedBy' | 'prices'>;

const blankItemDraft = (): ItemDraft => ({
  code: '', description: '', unit: 'kg', category: 'A', rateKey: '', preferredSupplierId: '', partNumber: '',
});

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  A: 'A — Core & Coil Assembly',
  B: 'B — Tank, Cooling & Fluid',
  C: 'C — Accessories & Terminations',
  D: 'D — Additional Items',
};

const SOURCE_LABELS: Record<ItemPrice['source'], string> = {
  quotation: 'Written Quotation',
  purchase_order: 'Purchase Order',
  invoice: 'Invoice',
  rate_contract: 'Rate Contract',
  verbal: 'Verbal Confirmation',
  catalogue: 'Catalogue / Price List',
};

type PriceDraft = Omit<ItemPrice, 'createdAt' | 'createdBy' | 'effectiveFrom' | 'expiresAt'> & { effectiveFromText: string; expiresAtText: string };

const blankPriceDraft = (): PriceDraft => ({
  supplierId: '', unitPrice: 0, gstPct: 18, discountPct: 0, freight: 0,
  effectiveFromText: new Date().toISOString().slice(0, 10), expiresAtText: '',
  source: 'quotation', remarks: '', approved: false,
});

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * TASKS.md item 11.3: item master under orgs/{orgId}/items. Each item
 * carries its own price history (ItemPrice[]) rather than a subcollection --
 * the expected volume is a handful of quotes per item over time, and
 * keeping it embedded means adding a price is one read-modify-write of a
 * single document, not a second modal layer. Nothing here is ever deleted
 * from the price history once added, per "what makes a rate defensible six
 * months later" -- only the item's own code/description/rateKey/preferred
 * supplier are edited in place, being current facts rather than a dated
 * series.
 */
export function ItemsModal({ orgId, uid, canEdit, onClose }: ItemsModalProps) {
  const [items, setItems] = useState<(Item & { id: string })[]>([]);
  const [suppliers, setSuppliers] = useState<(Supplier & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingId, setEditingId] = useState<string | null | undefined>(undefined); // undefined = closed, null = new
  const [draft, setDraft] = useState<ItemDraft>(blankItemDraft());
  const [prices, setPrices] = useState<ItemPrice[]>([]);
  const [saving, setSaving] = useState(false);

  const [priceDraft, setPriceDraft] = useState<PriceDraft>(blankPriceDraft());
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    Promise.all([listItems(orgId), listSuppliers(orgId)])
      .then(([i, s]) => { setItems(i); setSuppliers(s); setLoaded(true); })
      .catch((e) => { setError(String(e)); setLoaded(true); });
  }, [orgId, refreshKey]);

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || id;

  const openNew = () => { setDraft(blankItemDraft()); setPrices([]); setEditingId(null); };
  const openEdit = (it: Item & { id: string }) => {
    setDraft({
      code: it.code, description: it.description, unit: it.unit, category: it.category,
      rateKey: it.rateKey, preferredSupplierId: it.preferredSupplierId, partNumber: it.partNumber || '',
    });
    setPrices(it.prices);
    setEditingId(it.id);
  };
  const closeForm = () => { setEditingId(undefined); setPriceDraft(blankPriceDraft()); };

  const handleSaveItem = async () => {
    if (!draft.code.trim()) { window.alert('Item code is required.'); return; }
    setSaving(true);
    try {
      const id = await saveItem(orgId, uid, editingId ?? null, { ...draft, prices });
      setRefreshKey((k) => k + 1);
      setEditingId(id); // stay open on a new item so a price can be added straight away
    } catch (e) {
      window.alert(`Save failed: ${e}`);
    }
    setSaving(false);
  };

  const handleDeleteItem = async (it: Item & { id: string }) => {
    if (!window.confirm(`Delete item "${it.code}"? This cannot be undone, including its price history.`)) return;
    try {
      await deleteItem(orgId, it.id);
      setRefreshKey((k) => k + 1);
      if (editingId === it.id) closeForm();
    } catch (e) {
      window.alert(`Delete failed: ${e}`);
    }
  };

  const handleAddPrice = async () => {
    if (editingId == null) return; // item must exist first
    if (!priceDraft.supplierId) { window.alert('Choose a supplier.'); return; }
    if (!priceDraft.effectiveFromText) { window.alert('Effective date is required.'); return; }
    setSavingPrice(true);
    try {
      const { effectiveFromText, expiresAtText, ...rest } = priceDraft;
      const newPrice: ItemPrice = {
        ...rest,
        effectiveFrom: new Date(effectiveFromText).getTime(),
        expiresAt: expiresAtText ? new Date(expiresAtText).getTime() : null,
        createdBy: uid, createdAt: Date.now(),
      };
      const nextPrices = [...prices, newPrice];
      await saveItem(orgId, uid, editingId, { ...draft, prices: nextPrices });
      setPrices(nextPrices);
      setPriceDraft(blankPriceDraft());
      setRefreshKey((k) => k + 1);
    } catch (e) {
      window.alert(`Add price failed: ${e}`);
    }
    setSavingPrice(false);
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <Card title="Item Master" subtitle="orgs/{orgId}/items">
          {!loaded && <p className="text-[11px] text-steel px-1 py-2">Loading items.</p>}
          {error && <p className="text-[11px] text-alert px-1 py-2">{error}</p>}
          {loaded && !error && items.length === 0 && editingId === undefined && (
            <p className="text-[11px] text-steel px-1 py-2">No items recorded yet.</p>
          )}

          {loaded && !error && (
            <div className="divide-y divide-line mb-3">
              {items.map((it) => (
                <div key={it.id} className="py-2.5 px-1 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-ink2 font-semibold">
                      {it.code} <span className="font-normal text-steel">{it.description}</span>
                    </div>
                    <div className="text-[9px] font-mono text-steel">
                      {CATEGORY_LABELS[it.category]} &middot; unit {it.unit}
                      {it.rateKey ? <> &middot; prices {RATE_KEY_LABELS[it.rateKey] || it.rateKey}</> : <> &middot; not wired to costing</>}
                      {it.partNumber ? <> &middot; part# {it.partNumber}</> : null}
                    </div>
                    <div className="text-[9px] text-steel">
                      {it.preferredSupplierId ? `Preferred supplier: ${supplierName(it.preferredSupplierId)}` : 'No preferred supplier'}
                      {' '}&middot; {it.prices.length} price record{it.prices.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" onClick={() => openEdit(it)}>Edit</Button>
                      <Button variant="destructive" onClick={() => handleDeleteItem(it)}>Delete</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {canEdit && editingId === undefined && (
            <div className="pt-1">
              <Button variant="primary" onClick={openNew}>Add Item</Button>
            </div>
          )}

          {canEdit && editingId !== undefined && (
            <div className="border-t border-line pt-3 mt-1">
              <div className="text-[11px] font-display uppercase tracking-[0.14em] text-ink mb-2">
                {editingId === null ? 'New Item' : 'Edit Item'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <label className={labelCls}>Item Code</label>
                  <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} className={inputCls} placeholder="e.g. RM-CU-EC-001" />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Unit</label>
                  <input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} className={inputCls} placeholder="kg, L, no, set..." />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Manufacturer / Catalogue Part Number</label>
                  <input value={draft.partNumber} onChange={(e) => setDraft({ ...draft, partNumber: e.target.value })} className={inputCls} placeholder="Optional -- distinct from the item code above" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className={labelCls}>Description</label>
                  <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Category</label>
                  <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as ItemCategory })} className={inputCls}>
                    {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Prices Which Rate</label>
                  <select value={draft.rateKey} onChange={(e) => setDraft({ ...draft, rateKey: e.target.value })} className={inputCls}>
                    <option value="">Not wired to costing yet</option>
                    {RATE_KEY_GROUPS.map((g) => (
                      <optgroup key={g.title} label={g.title}>
                        {g.fields.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className={labelCls}>Preferred Supplier (Company Default)</label>
                  <select
                    value={draft.preferredSupplierId}
                    onChange={(e) => setDraft({ ...draft, preferredSupplierId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">None designated</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mb-4">
                <Button variant="secondary" onClick={closeForm}>Close</Button>
                <Button variant="confirm" onClick={handleSaveItem} disabled={saving}>{saving ? 'Saving' : 'Save Item'}</Button>
              </div>

              {editingId != null && (
                <div className="border-t border-line pt-3">
                  <div className="text-[11px] font-display uppercase tracking-[0.14em] text-ink mb-2">Price History</div>
                  {prices.length === 0 && <p className="text-[10px] text-steel mb-2">No price recorded yet.</p>}
                  {prices.length > 0 && (
                    <div className="divide-y divide-line mb-3">
                      {[...prices].sort((a, b) => b.effectiveFrom - a.effectiveFrom).map((p, i) => (
                        <div key={i} className="py-2 text-[10px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-ink2">{supplierName(p.supplierId)}</span>
                            <span className="font-mono text-ink">₹{p.unitPrice.toLocaleString('en-IN')}</span>
                            {p.discountPct > 0 && <span className="text-steel">less {p.discountPct}% discount</span>}
                            {p.approved
                              ? <span className="text-good font-display uppercase text-[8px] tracking-[0.1em] border border-rule rounded-[2px] px-1">Approved</span>
                              : <span className="text-amber font-display uppercase text-[8px] tracking-[0.1em] border border-rule rounded-[2px] px-1">Unverified</span>}
                          </div>
                          <div className="font-mono text-steel">
                            effective {fmtDate(p.effectiveFrom)}{p.expiresAt ? `, expires ${fmtDate(p.expiresAt)}` : ', no expiry'}
                            {' '}&middot; GST {p.gstPct}% &middot; freight ₹{p.freight.toLocaleString('en-IN')} &middot; {SOURCE_LABELS[p.source]}
                          </div>
                          {p.remarks && <div className="text-ink2 mt-0.5">{p.remarks}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] font-display uppercase tracking-[0.1em] text-steel mb-1.5">Add a Price Record</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                    <div className="space-y-0.5 sm:col-span-2">
                      <label className="text-[9px] text-ink2">Supplier</label>
                      <select value={priceDraft.supplierId} onChange={(e) => setPriceDraft({ ...priceDraft, supplierId: e.target.value })} className={inputCls}>
                        <option value="">Choose a supplier</option>
                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-ink2">Source</label>
                      <select value={priceDraft.source} onChange={(e) => setPriceDraft({ ...priceDraft, source: e.target.value as ItemPrice['source'] })} className={inputCls}>
                        {(Object.keys(SOURCE_LABELS) as ItemPrice['source'][]).map((k) => <option key={k} value={k}>{SOURCE_LABELS[k]}</option>)}
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-ink2">Unit Price, ₹</label>
                      <input type="number" value={priceDraft.unitPrice} onChange={(e) => setPriceDraft({ ...priceDraft, unitPrice: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-ink2">GST, %</label>
                      <input type="number" value={priceDraft.gstPct} onChange={(e) => setPriceDraft({ ...priceDraft, gstPct: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-ink2">Discount, %</label>
                      <input type="number" value={priceDraft.discountPct} onChange={(e) => setPriceDraft({ ...priceDraft, discountPct: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-ink2">Freight, ₹</label>
                      <input type="number" value={priceDraft.freight} onChange={(e) => setPriceDraft({ ...priceDraft, freight: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-ink2">Effective From</label>
                      <input type="date" value={priceDraft.effectiveFromText} onChange={(e) => setPriceDraft({ ...priceDraft, effectiveFromText: e.target.value })} className={inputCls} />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-ink2">Expires (Optional)</label>
                      <input type="date" value={priceDraft.expiresAtText} onChange={(e) => setPriceDraft({ ...priceDraft, expiresAtText: e.target.value })} className={inputCls} />
                    </div>
                    <div className="space-y-0.5 sm:col-span-3">
                      <label className="text-[9px] text-ink2">Remarks</label>
                      <input value={priceDraft.remarks} onChange={(e) => setPriceDraft({ ...priceDraft, remarks: e.target.value })} className={inputCls} placeholder="e.g. quoted against enquiry ref, freight terms, validity" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-[10px] text-ink2 mb-3">
                    <input type="checkbox" checked={priceDraft.approved} onChange={(e) => setPriceDraft({ ...priceDraft, approved: e.target.checked })} />
                    Approved -- eligible as the fallback price when no company-preferred supplier price is active
                  </label>
                  <div className="flex justify-end">
                    <Button variant="confirm" onClick={handleAddPrice} disabled={savingPrice}>{savingPrice ? 'Adding' : 'Add Price Record'}</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-line mt-3">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
