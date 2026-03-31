'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Activity, FileText, Users, Clock, ArrowDownUp, Inbox, UploadCloud } from 'lucide-react';
import Link from 'next/link';

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
      <div className="animate-in pb-8">
        
        {/* Ledger Header Strip */}
        <div className="flex items-end justify-between mb-6 pb-4 border-b border-[var(--border)]">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] uppercase">Practice Dashboard</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 tracking-wide font-medium">MASTER OVERVIEW REPORT</p>
          </div>
          <div className="text-right text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest space-y-1">
            <p className="font-bold text-[var(--accent)]">FY 2025–26</p>
            <p>Generated: {loading ? '—' : new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Stats Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Client Portfolios', value: stats.clients || 0, icon: Users, color: 'text-[var(--text)]' },
            { label: 'GST Returns (GSTR)', value: stats.gst_returns || 0, icon: FileText, color: 'text-[var(--text)]' },
            { label: 'ITR Returns', value: stats.itr_returns || 0, icon: FileText, color: 'text-[var(--text)]' },
            { 
              label: 'Pending Processing', 
              value: stats.pending_tasks || 0, 
              icon: Activity, 
              color: (stats.pending_tasks || 0) > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]' 
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card !p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-default">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2">
                <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</div>
                <Icon size={14} className="text-[var(--text-tertiary)]" />
              </div>
              <div className={`text-4xl font-mono font-bold tracking-tight mt-2 ${color}`}>
                {loading ? '—' : value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Workflows */}
          <div className="card !p-0 overflow-hidden">
             {/* Block Header */}
            <div className="bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-[var(--text-secondary)]"/>
                <h2 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Processing Queue Ledger</h2>
              </div>
            </div>
            
            {workflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 bg-[var(--bg)] rounded-full flex items-center justify-center mb-3 border border-[var(--border)] shadow-sm">
                  <Inbox size={20} className="text-[var(--text-tertiary)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">No Active Operations</p>
                <p className="text-xs text-[var(--text-tertiary)] mb-4 max-w-[250px]">
                  Your processing queue is empty. Initiate a workflow to automatically compute GST ledgers.
                </p>
                <Link href="/workflows" className="btn btn-secondary text-xs py-1.5 border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg)] shadow-sm">
                  Run Workflow <ArrowDownUp size={12} className="rotate-90 ml-1" />
                </Link>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th className="flex items-center gap-1 cursor-pointer hover:text-[var(--accent)]">Date Evaluated <ArrowDownUp size={10} /></th>
                    <th className="cursor-pointer hover:text-[var(--accent)]">Process Type <ArrowDownUp size={10} className="inline ml-1"/></th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.slice(0, 5).map((w: any) => (
                    <tr key={w.id}>
                      <td className="text-[12px] font-mono whitespace-nowrap hidden sm:table-cell">
                        <Clock size={10} className="inline mr-1 text-[var(--text-tertiary)]" />
                        {w.created_at ? new Date(w.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="text-[12px] font-semibold text-[var(--text-secondary)]">{w.task_type}</td>
                      <td>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest shadow-sm ${
                          w.status === 'completed' ? 'bg-[#bbf7d0] text-[#16a34a] border-[#86efac]' :
                          w.status === 'running' ? 'bg-[#fde68a] text-[#d97706] border-[#fcd34d]' :
                          w.status === 'failed' ? 'bg-[#fecaca] text-[#dc2626] border-[#fca5a5]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Returns */}
          <div className="card !p-0 overflow-hidden">
             {/* Block Header */}
             <div className="bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[var(--text-secondary)]"/>
                <h2 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Computed Tax Returns</h2>
              </div>
            </div>

            {returns.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
               <div className="w-12 h-12 bg-[var(--bg)] rounded-full flex items-center justify-center mb-3 border border-[var(--border)] shadow-sm">
                 <UploadCloud size={20} className="text-[var(--text-tertiary)]" />
               </div>
               <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">No Finalized Returns</p>
               <p className="text-xs text-[var(--text-tertiary)] mb-4 max-w-[250px]">
                 Upload your client's raw invoices to automatically construct tax returns.
               </p>
               <Link href="/upload" className="btn btn-secondary text-xs py-1.5 border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg)] shadow-sm">
                 Upload Document <ArrowDownUp size={12} className="rotate-90 ml-1" />
               </Link>
             </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th className="cursor-pointer hover:text-[var(--accent)]">Period <ArrowDownUp size={10} className="inline ml-1" /></th>
                    <th>Form Type</th>
                    <th className="text-right cursor-pointer hover:text-[var(--accent)]">Net Liability <ArrowDownUp size={10} className="inline ml-1" /></th>
                  </tr>
                </thead>
                <tbody>
                  {returns.slice(0, 5).map((r: any) => (
                    <tr key={r.id}>
                      <td className="text-[12px] font-mono text-[var(--text-tertiary)]">{r.period}</td>
                      <td className="text-[12px] font-semibold text-[var(--text)] flex items-center gap-1.5 h-full pt-4">
                        {r.return_type}
                        <span className={`px-1 rounded-[3px] border shadow-sm text-[8px] font-bold uppercase ${
                          r.status === 'filed' ? 'bg-[#bbf7d0] text-[#16a34a] border-[#86efac]' : 'bg-[#fde68a] text-[#d97706] border-[#fcd34d]'
                        }`}>
                          {r.status === 'filed' ? 'FILED' : 'PREP'}
                        </span>
                      </td>
                      <td className="text-right text-[13px] font-mono font-bold text-[var(--accent)]">
                        ₹{(r.net_payable || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
