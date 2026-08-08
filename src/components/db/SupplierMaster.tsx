import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Supplier } from '../../types/db';
import { Plus, Save, Edit2, Trash2, X } from 'lucide-react';

export function SupplierMaster() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  const loadSuppliers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'suppliers'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
      setSuppliers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, [user]);

  const handleSave = async () => {
    if (!user || !formData.name) return;
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        userId: user.uid,
        updatedAt: Date.now()
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'suppliers', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'suppliers'), {
          ...dataToSave,
          createdAt: Date.now()
        });
      }
      setEditingId(null);
      setFormData({});
      await loadSuppliers();
    } catch (e) {
      console.error(e);
      alert('Error saving supplier');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      await loadSuppliers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (s: Supplier) => {
    setEditingId(s.id!);
    setFormData(s);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Supplier Master</h3>
        {!editingId && (
          <button onClick={() => { setEditingId('new'); setFormData({}); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        )}
      </div>

      {editingId && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-700 mb-4">{editingId === 'new' ? 'Add New Supplier' : 'Edit Supplier'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Supplier Name *" className="border p-2 rounded" />
            <input name="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} placeholder="GST Number" className="border p-2 rounded" />
            <input name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} placeholder="Contact Person" className="border p-2 rounded" />
            <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone" className="border p-2 rounded" />
            <input name="email" value={formData.email || ''} onChange={handleChange} placeholder="Email" className="border p-2 rounded" />
            <input name="website" value={formData.website || ''} onChange={handleChange} placeholder="Website" className="border p-2 rounded" />
            <input name="paymentTerms" value={formData.paymentTerms || ''} onChange={handleChange} placeholder="Payment Terms" className="border p-2 rounded" />
            <input name="leadTime" type="number" value={formData.leadTime || ''} onChange={handleChange} placeholder="Lead Time (Days)" className="border p-2 rounded" />
            <textarea name="address" value={formData.address || ''} onChange={handleChange} placeholder="Full Address" className="border p-2 rounded md:col-span-2" rows={2} />
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Notes" className="border p-2 rounded md:col-span-2" rows={2} />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button onClick={() => { setEditingId(null); setFormData({}); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-bold">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold hover:bg-emerald-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Contact</th>
              <th className="p-3">GST</th>
              <th className="p-3">Lead Time</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">No suppliers found.</td></tr>
            )}
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">{s.name}</td>
                <td className="p-3 text-slate-600">
                  {s.contactPerson} <br/>
                  <span className="text-xs text-slate-400">{s.phone}</span>
                </td>
                <td className="p-3 text-slate-600">{s.gstNumber}</td>
                <td className="p-3 text-slate-600">{s.leadTime} Days</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(s.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
