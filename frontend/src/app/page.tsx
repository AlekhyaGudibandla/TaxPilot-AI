'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Activity, FileText, Users, AlertTriangle, ArrowRight, Clock } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const workflows = data?.recent_workflows || [];
  const returns = data?.recent_returns || [];

  return (
    <Shell>
      <div className="animate-in">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Overview of your CA practice</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Clients', value: stats.clients || 0, icon: Users },
            { label: 'GST Returns', value: stats.gst_returns || 0, icon: FileText },
            { label: 'ITR Returns', value: stats.itr_returns || 0, icon: FileText },
            { label: 'Active Tasks', value: stats.pending_tasks || 0, icon: Activity },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="stat-value">{loading ? '—' : value}</div>
                  <div className="stat-label">{label}</div>
                </div>
                <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
                  <Icon size={18} className="text-[var(--text-tertiary)]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Workflows */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Activity size={16} /> Recent Workflows
            </h2>
            {workflows.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">
                No workflows yet. Upload documents to start.
              </p>
            ) : (
              <div className="space-y-3">
                {workflows.slice(0, 5).map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between py-2 border-b border-[var(--bg-tertiary)] last:border-0">
                    <div>
                      <p className="text-sm font-medium">{w.task_type}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        <Clock size={10} className="inline mr-1" />
                        {w.created_at ? new Date(w.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <span className={`badge ${
                      w.status === 'completed' ? 'badge-success' :
                      w.status === 'running' ? 'badge-warning' :
                      w.status === 'failed' ? 'badge-danger' : 'badge-neutral'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Returns */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <FileText size={16} /> Recent Returns
            </h2>
            {returns.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">
                No returns prepared yet.
              </p>
            ) : (
              <div className="space-y-3">
                {returns.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-[var(--bg-tertiary)] last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.return_type}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{r.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">₹{(r.net_payable || 0).toLocaleString()}</p>
                      <span className={`badge ${
                        r.status === 'filed' ? 'badge-success' :
                        r.status === 'prepared' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
