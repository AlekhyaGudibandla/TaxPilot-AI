'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Shield } from 'lucide-react';

export default function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLogs().then(d => setLogs(d.logs || [])).catch(console.error);
  }, []);

  return (
    <Shell>
      <div className="animate-in">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Audit Trail</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Complete log of all agent actions and decisions</p>
        </div>

        {logs.length === 0 ? (
          <div className="card text-center py-16">
            <Shield size={40} className="mx-auto text-[var(--text-tertiary)] mb-4" />
            <p className="text-[var(--text-secondary)]">No audit logs yet</p>
            <p className="text-sm text-[var(--text-tertiary)]">Audit entries are created when agents process data</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Agent</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Client</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                     <td className="text-xs text-[var(--text-tertiary)]">{new Date(log.createdAt).toLocaleString()}</td>
                     <td className="font-medium text-sm text-[var(--accent)]">{log.agentName}</td>
                     <td>
                        <span className={`badge ${log.action.includes('Failed') || log.action.includes('Flagged') ? 'badge-danger' : 'badge-neutral'}`}>
                          {log.action}
                        </span>
                     </td>
                     <td className="text-sm text-[var(--text-secondary)]">{log.description}</td>
                     <td className="text-sm text-[var(--text-tertiary)]">{log.client?.name || 'System'}</td>
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
