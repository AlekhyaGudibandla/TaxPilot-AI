'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Download, FileJson, CheckCircle } from 'lucide-react';

export default function Returns() {
  const [returns, setReturns] = useState<any[]>([]);

  useEffect(() => {
    api.getGSTReturns().then(d => setReturns(d.returns || [])).catch(console.error);
  }, []);

  const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const downloadJson = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR_Export_${data.period}_${data.client.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Shell>
      <div className="animate-in">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Returns</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Ready to file Government GST returns</p>
        </div>

        {returns.length === 0 ? (
          <div className="card text-center py-16">
            <FileJson size={40} className="mx-auto text-[var(--text-tertiary)] mb-4" />
            <p className="text-[var(--text-secondary)]">No completed GST returns yet</p>
            <p className="text-sm text-[var(--text-tertiary)]">Run a GST Pipeline workflow to generate exportable returns</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Liability Computed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id}>
                     <td className="font-medium text-sm">{r.period}</td>
                     <td className="text-sm text-[var(--text-secondary)]">{r.client}</td>
                     <td>
                       <span className="badge badge-success flex items-center gap-1 w-max">
                         <CheckCircle size={12} /> {r.status}
                       </span>
                     </td>
                     <td className="text-sm font-mono font-bold text-[var(--text)]">
                       {formatINR(r.netPayable)}
                     </td>
                     <td>
                        <button className="btn btn-secondary py-1 px-3 text-xs flex items-center gap-1.5" onClick={() => downloadJson(r)}>
                           <Download size={14} /> Download JSON
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
