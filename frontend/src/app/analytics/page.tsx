'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error);
  }, []);

  const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <Shell>
      <div className="animate-in">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Financial insights across workflows</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {data?.insights.map((insight: any, i: number) => (
            <div key={i} className="card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[var(--text-tertiary)] font-semibold uppercase">{insight.label}</span>
                {insight.label.includes('Transactions') ? <Activity size={16} className="text-[var(--text-tertiary)]"/> : <TrendingUp size={16} className="text-[var(--text-tertiary)]"/>}
              </div>
              <h2 className="text-2xl font-bold font-mono text-[var(--text)]">
                {insight.label.includes('Transactions') ? insight.value : formatINR(insight.value)}
              </h2>
            </div>
          ))}
        </div>

        {/* Profit/Loss summary */}
        {data && (data.total_sales > 0 || data.total_purchases > 0) && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">Revenue</span>
                <span className="text-sm font-mono font-medium">₹{(data.total_sales || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">Expenses</span>
                <span className="text-sm font-mono font-medium">₹{(data.total_purchases || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">GST Liability</span>
                <span className="text-sm font-mono font-medium">₹{(data.total_gst || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-semibold">Net Profit</span>
                <span className={`text-lg font-mono font-bold ${
                  (data.total_sales - data.total_purchases) >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                }`}>
                  ₹{((data.total_sales || 0) - (data.total_purchases || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
