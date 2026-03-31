'use client';
import { useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Calculator, IndianRupee, ArrowRight } from 'lucide-react';

export default function TaxCalculator() {
  const [income, setIncome] = useState('');
  const [regime, setRegime] = useState('new');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    const val = parseFloat(income);
    if (!val || val <= 0) return;
    setLoading(true);
    try {
      const res = await api.calcTax(val, regime);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <Shell>
      <div className="animate-in max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Tax Calculator</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Income tax computation — FY 2024-25</p>
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">
                Total Taxable Income
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  className="input pl-8"
                  type="number"
                  placeholder="e.g., 1200000"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && calculate()}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">
                Tax Regime
              </label>
              <div className="flex gap-2">
                {['new', 'old'].map(r => (
                  <button
                    key={r}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      regime === r
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)]'
                    }`}
                    onClick={() => setRegime(r)}
                  >
                    {r === 'new' ? 'New Regime' : 'Old Regime'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary w-full" onClick={calculate} disabled={loading}>
            <Calculator size={16} />
            {loading ? 'Calculating...' : 'Calculate Tax'}
          </button>
        </div>

        {result && (
          <div className="card animate-in">
            <h3 className="text-sm font-semibold mb-4">Tax Computation — {result.regime === 'new' ? 'New' : 'Old'} Regime</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">Income Tax</span>
                <span className="text-sm font-mono">{formatINR(result.tax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">Surcharge</span>
                <span className="text-sm font-mono">{formatINR(result.surcharge)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--bg-tertiary)]">
                <span className="text-sm text-[var(--text-secondary)]">Health & Education Cess (4%)</span>
                <span className="text-sm font-mono">{formatINR(result.cess)}</span>
              </div>
              <div className="flex justify-between py-3 bg-[var(--bg-tertiary)] rounded-lg px-3 -mx-1">
                <span className="font-semibold">Total Tax Payable</span>
                <span className="text-lg font-mono font-bold">{formatINR(result.total_tax)}</span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                Effective rate: {income ? ((result.total_tax / parseFloat(income)) * 100).toFixed(2) : '0'}%
              </p>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
