import React, { useEffect, useState } from 'react';
import { listSuppliers, saveSupplier, deleteSupplier } from '../../lib/projects';
import { Card, Button, inputCls, labelCls } from './ui';
import type { Supplier } from '../../lib/types';

interface SuppliersModalProps {
  orgId: string;
  uid: string;
  canEdit: boolean;
  onClose: () => void;
}

type Draft = Omit<Supplier, 'updatedAt' | 'updatedBy'> & { materialsText: string };

const blankDraft = (): Draft => ({
  name: '', gstNumber: '', contact: { person: '', phone: '', email: '' },
  materialsSupplied: [], materialsText: '', leadTimeDays: 0, paymentTerms: '', rating: 3,
});

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * TASKS.md item 11.2: supplier master under orgs/{orgId}/suppliers. Editable
 * in place -- no effective-from dating here, that is what makes this
 * different from RateCardManager's rate cards (see lib/types.ts Supplier).
 */
export function SuppliersModal({ orgId, uid, canEdit, onClose }: SuppliersModalProps) {
  const [suppliers, setSuppliers] = useState<(Supplier & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingId, setEditingId] = useState<string | null | undefined>(undefined); // undefined = form closed, null = new
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSuppliers(orgId)
      .then((s) => { setSuppliers(s); setLoaded(true); })
      .catch((e) => { setError(String(e)); setLoaded(true); });
  }, [orgId, refreshKey]);

  const openNew = () => { setDraft(blankDraft()); setEditingId(null); };
  const openEdit = (s: Supplier & { id: string }) => {
    // Built field by field, not a spread of `s` -- `s` carries `id`, and a
    // stray `id` field inside the document body would fight with the real
    // one (the document's own path segment) the next time it is read back.
    setDraft({
      name: s.name, gstNumber: s.gstNumber, contact: { ...s.contact },
      materialsSupplied: s.materialsSupplied, materialsText: s.materialsSupplied.join(', '),
      leadTimeDays: s.leadTimeDays, paymentTerms: s.paymentTerms, rating: s.rating,
    });
    setEditingId(s.id);
  };
  const closeForm = () => setEditingId(undefined);

  const handleSave = async () => {
    if (!draft.name.trim()) { window.alert('Name is required.'); return; }
    setSaving(true);
    try {
      const { materialsText, ...rest } = draft;
      const supplier: Omit<Supplier, 'updatedAt' | 'updatedBy'> = {
        ...rest,
        materialsSupplied: materialsText.split(',').map((m) => m.trim()).filter(Boolean),
        rating: Math.min(5, Math.max(1, Math.round(draft.rating))),
      };
      await saveSupplier(orgId, uid, editingId ?? null, supplier);
      setRefreshKey((k) => k + 1);
      closeForm();
    } catch (e) {
      window.alert(`Save failed: ${e}`);
    }
    setSaving(false);
  };

  const handleDelete = async (s: Supplier & { id: string }) => {
    if (!window.confirm(`Delete supplier "${s.name}"? This cannot be undone.`)) return;
    try {
      await deleteSupplier(orgId, s.id);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      window.alert(`Delete failed: ${e}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <Card title="Suppliers" subtitle="orgs/{orgId}/suppliers">
          {!loaded && <p className="text-[11px] text-steel px-1 py-2">Loading suppliers.</p>}
          {error && <p className="text-[11px] text-alert px-1 py-2">{error}</p>}
          {loaded && !error && suppliers.length === 0 && editingId === undefined && (
            <p className="text-[11px] text-steel px-1 py-2">No suppliers recorded yet.</p>
          )}

          {loaded && !error && (
            <div className="divide-y divide-line mb-3">
              {suppliers.map((s) => (
                <div key={s.id} className="py-2.5 px-1 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-ink2 font-semibold">
                      {s.name} <span className="font-mono text-[9px] text-steel font-normal">{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</span>
                    </div>
                    <div className="text-[9px] font-mono text-steel">
                      GST {s.gstNumber || 'to be specified'} &middot; lead time {s.leadTimeDays} days &middot; {s.paymentTerms || 'terms to be specified'}
                    </div>
                    <div className="text-[9px] text-steel">
                      {s.contact.person || 'contact not set'}{s.contact.phone ? `, ${s.contact.phone}` : ''}{s.contact.email ? `, ${s.contact.email}` : ''}
                    </div>
                    {s.materialsSupplied.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.materialsSupplied.map((m) => (
                          <span key={m} className="text-[9px] font-mono text-ink2 border border-rule rounded-[2px] px-1.5 py-0.5">{m}</span>
                        ))}
                      </div>
                    )}
                    <div className="text-[8px] font-mono text-steel mt-1">updated {fmtDate(s.updatedAt)}</div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" onClick={() => openEdit(s)}>Edit</Button>
                      <Button variant="destructive" onClick={() => handleDelete(s)}>Delete</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {canEdit && editingId === undefined && (
            <div className="pt-1">
              <Button variant="primary" onClick={openNew}>Add Supplier</Button>
            </div>
          )}

          {canEdit && editingId !== undefined && (
            <div className="border-t border-line pt-3 mt-1">
              <div className="text-[11px] font-display uppercase tracking-[0.14em] text-ink mb-2">
                {editingId === null ? 'New Supplier' : 'Edit Supplier'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <label className={labelCls}>Name</label>
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>GST Number</label>
                  <input value={draft.gstNumber} onChange={(e) => setDraft({ ...draft, gstNumber: e.target.value })} className={inputCls} placeholder="15-character GSTIN" />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Contact Person</label>
                  <input
                    value={draft.contact.person}
                    onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, person: e.target.value } })}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Contact Phone</label>
                  <input
                    value={draft.contact.phone}
                    onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, phone: e.target.value } })}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Contact Email</label>
                  <input
                    value={draft.contact.email}
                    onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Lead Time, Days</label>
                  <input
                    type="number" value={draft.leadTimeDays}
                    onChange={(e) => setDraft({ ...draft, leadTimeDays: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Payment Terms</label>
                  <input
                    value={draft.paymentTerms} onChange={(e) => setDraft({ ...draft, paymentTerms: e.target.value })}
                    className={inputCls} placeholder="e.g. 30 days from invoice"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Rating, 1 to 5</label>
                  <input
                    type="number" min={1} max={5} value={draft.rating}
                    onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className={labelCls}>Materials Supplied</label>
                  <input
                    value={draft.materialsText} onChange={(e) => setDraft({ ...draft, materialsText: e.target.value })}
                    className={inputCls} placeholder="Comma-separated, e.g. Copper, CRGO Steel, Bushings"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={closeForm}>Cancel</Button>
                <Button variant="confirm" onClick={handleSave} disabled={saving}>{saving ? 'Saving' : 'Save Supplier'}</Button>
              </div>
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
