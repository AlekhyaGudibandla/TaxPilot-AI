'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { GitCompare, Play, RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const TASK_TYPES = [
  { value: 'gst_monthly', label: 'GST Monthly (GSTR-1 + 3B)' },
  { value: 'itr_filing', label: 'Income Tax Return' },
  { value: 'tds_quarterly', label: 'TDS Quarterly Return' },
  { value: 'payroll', label: 'Payroll Processing' },
  { value: 'reconciliation', label: 'Full Reconciliation' },
  { value: 'full_compliance', label: 'Full Compliance Check' },
];

export default function Workflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ client_id: '', task_type: 'gst_monthly', period: '', financial_year: '2024-25' });
  const [starting, setStarting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    api.getWorkflows().then(d => setWorkflows(d.workflows || [])).catch(console.error);
    api.getClients().then(d => setClients(d.clients || [])).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const handleStart = async () => {
    if (!form.client_id) return alert('Select a client');
    setStarting(true);
    try {
      const res = await api.startWorkflow(form);
      setShowForm(false);
      alert(res.message || 'Workflow executed successfully!');
      setTimeout(load, 1000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setStarting(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle size={14} className="text-[var(--success)]" />;
    if (status === 'failed') return <XCircle size={14} className="text-[var(--danger)]" />;
    if (status === 'running') return <Loader2 size={14} className="animate-spin text-[var(--warning)]" />;
    return <Clock size={14} className="text-[var(--text-tertiary)]" />;
  };

  return (
    <Shell>
      <div className="animate-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">Multi-agent compliance pipelines</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={load}><RefreshCw size={14} /> Refresh</button>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              <Play size={14} /> New Workflow
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card mb-6 animate-in">
            <h3 className="text-sm font-semibold mb-4">Start Workflow</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className="input" value={form.client_id}
                onChange={e => setForm({...form, client_id: e.target.value})}>
                <option value="">Select Client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input" value={form.task_type}
                onChange={e => setForm({...form, task_type: e.target.value})}>
                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input className="input" type="month" placeholder="Period" value={form.period}
                onChange={e => setForm({...form, period: e.target.value})} />
              <input className="input" placeholder="Financial Year" value={form.financial_year}
                onChange={e => setForm({...form, financial_year: e.target.value})} />
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary" onClick={handleStart} disabled={starting}>
                {starting ? 'Starting...' : 'Run Pipeline'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {workflows.length === 0 ? (
          <div className="card text-center py-16">
            <GitCompare size={40} className="mx-auto text-[var(--text-tertiary)] mb-4" />
            <p className="text-[var(--text-secondary)]">No workflows yet</p>
            <p className="text-sm text-[var(--text-tertiary)]">Start a new workflow to automate compliance tasks</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Task Type</th>
                  <th>Agent</th>
                  <th>Agent</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Result Summary</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map(w => (
                  <tr key={w.id}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {statusIcon(w.status)}
                        <span className={`badge ${
                          w.status === 'completed' ? 'badge-success' :
                          w.status === 'running' ? 'badge-warning' :
                          w.status === 'failed' ? 'badge-danger' : 'badge-neutral'
                        }`}>{w.status}</span>
                      </div>
                    </td>
                    <td className="font-medium text-sm">{w.task_type}</td>
                    <td className="text-sm text-[var(--text-secondary)]">{w.assigned_agent || '—'}</td>
                    <td className="text-xs text-[var(--text-tertiary)]">
                      {w.started_at ? new Date(w.started_at).toLocaleString() : '—'}
                    </td>
                    <td className="text-xs text-[var(--text-tertiary)]">
                      {w.completed_at ? new Date(w.completed_at).toLocaleString() : '—'}
                    </td>
                    <td className="text-xs text-[var(--text-secondary)]">
                      {w.result ? (
                        <div className="flex flex-col gap-1 p-2 bg-[var(--bg-tertiary)] rounded min-w-[150px]">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-tertiary)]">Output GST:</span>
                            <span className="font-mono">₹{w.result.outputGst}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-tertiary)]">Eligible ITC:</span>
                            <span className="font-mono">₹{w.result.inputGst}</span>
                          </div>
                          <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1">
                            <span className="font-medium text-[var(--text)]">Net Payable:</span>
                            <span className={`font-mono font-bold ${w.result.netPayable > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                              ₹{w.result.netPayable}
                            </span>
                          </div>
                          {w.result.carryForward > 0 && (
                            <div className="flex justify-between">
                              <span className="text-[var(--warning)] font-medium">Carry Forward:</span>
                              <span className="font-mono text-[var(--warning)]">₹{w.result.carryForward}</span>
                            </div>
                          )}
                        </div>
                      ) : '—'}
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
