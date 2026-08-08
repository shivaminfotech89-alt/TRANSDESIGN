import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Material } from '../../types/db';
import { Plus, Save, Edit2, Trash2 } from 'lucide-react';

export function MaterialMaster() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Material>>({});

  const loadMaterials = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'materials'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Material[];
      setMaterials(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMaterials();
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
        await updateDoc(doc(db, 'materials', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'materials'), { ...dataToSave, createdAt: Date.now() });
      }
      setEditingId(null);
      setFormData({});
      await loadMaterials();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    try {
      await deleteDoc(doc(db, 'materials', id));
      await loadMaterials();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (m: Material) => {
    setEditingId(m.id!);
    setFormData(m);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Material Master</h3>
        {!editingId && (
          <button onClick={() => { setEditingId('new'); setFormData({}); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Material
          </button>
        )}
      </div>

      {editingId && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-end gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Material Name *</label>
            <input name="name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Copper Strip" className="w-full border p-2 rounded" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
            <input name="category" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Conductor" className="w-full border p-2 rounded" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
            <input name="unit" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="e.g. kg, liter" className="w-full border p-2 rounded" />
          </div>
          <div className="flex gap-2">
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
              <th className="p-3">Material Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Unit</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map(m => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">{m.name}</td>
                <td className="p-3 text-slate-600">{m.category}</td>
                <td className="p-3 text-slate-600">{m.unit}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleEdit(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(m.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
