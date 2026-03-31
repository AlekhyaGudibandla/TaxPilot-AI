'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Plus, Trash2, Building2 } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', entity_type: 'individual', pan: '', gstin: '', tan: '', is_gst_registered: false });

  const load = () => api.getClients().then(d => setClients(d.clients || [])).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    await api.createClient(form);
    setForm({ name: '', entity_type: 'individual', pan: '', gstin: '', tan: '', is_gst_registered: false });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    await api.deleteClient(id);
    load();
  };

  return (
    <Shell>
      <div className="animate-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">Manage client entities</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Add Client
          </button>
        </div>

        {showForm && (
          <div className="card mb-6 animate-in">
            <h3 className="text-sm font-semibold mb-4">New Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input className="input" placeholder="Company/Individual Name *" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
              <select className="input" value={form.entity_type}
                onChange={e => setForm({...form, entity_type: e.target.value})}>
                <option value="individual">Individual</option>
                <option value="proprietorship">Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="llp">LLP</option>
                <option value="pvt_ltd">Pvt Ltd</option>
                <option value="public_ltd">Public Ltd</option>
              </select>
              <input className="input" placeholder="PAN" value={form.pan}
                onChange={e => setForm({...form, pan: e.target.value.toUpperCase()})} maxLength={10} />
              <input className="input" placeholder="GSTIN" value={form.gstin}
                onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} maxLength={15} />
              <input className="input" placeholder="TAN" value={form.tan}
                onChange={e => setForm({...form, tan: e.target.value.toUpperCase()})} maxLength={10} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_gst_registered}
                  onChange={e => setForm({...form, is_gst_registered: e.target.checked})} />
                GST Registered
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={handleCreate}>Create Client</button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="card text-center py-16">
            <Building2 size={40} className="mx-auto text-[var(--text-tertiary)] mb-4" />
            <p className="text-[var(--text-secondary)]">No clients yet</p>
            <p className="text-sm text-[var(--text-tertiary)]">Add your first client to get started</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>PAN</th>
                  <th>GSTIN</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td><span className="badge badge-neutral">{c.entity_type}</span></td>
                    <td className="font-mono text-xs">{c.pan || '—'}</td>
                    <td className="font-mono text-xs">{c.gstin || '—'}</td>
                    <td className="text-xs text-[var(--text-tertiary)]">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <button className="btn-ghost" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
