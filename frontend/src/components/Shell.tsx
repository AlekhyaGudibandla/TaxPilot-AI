'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Upload, FileText, GitCompare, Shield,
  Calculator, Users, Bot, BarChart3, Settings, ChevronRight
} from 'lucide-react';

const NAV_GROUPS = [
  { section: 'Main', items: [
    { href: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Client Master', icon: Users }
  ]},
  { section: 'Operations', items: [
    { href: '/upload', label: 'Document Ledger', icon: Upload },
    { href: '/workflows', label: 'Processing Queue', icon: GitCompare },
    { href: '/returns', label: 'GST Returns', icon: FileText },
    { href: '/calculator', label: 'Tax Estimator', icon: Calculator }
  ]},
  { section: 'Insights', items: [
    { href: '/audit', label: 'Audit Trail', icon: Shield },
    { href: '/analytics', label: 'Financial Analytics', icon: BarChart3 },
    { href: '/copilot', label: 'AI Copilot', icon: Bot }
  ]}
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="w-56 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[var(--accent)] rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">T</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[var(--text)]">TaxPilot AI</h1>
              <p className="text-[9px] text-[var(--accent)] font-semibold uppercase tracking-widest mt-0.5">CA Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-auto flex flex-col gap-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.section}>
              <h2 className="px-5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5">
                {group.section}
              </h2>
              <div className="flex flex-col space-y-0.5 px-3">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-all transform hover:translate-x-1 ${
                        active
                          ? 'bg-[var(--accent)] text-white shadow-md border-l-4 border-[#D8F3DC] rounded-r'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text)] rounded'
                      }`}
                    >
                      <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="text-[10px] text-[var(--text-tertiary)] font-mono space-y-1">
            <p className="flex justify-between"><span>FY:</span> <span className="text-[var(--text-secondary)] font-semibold">2025-26</span></p>
            <p className="flex justify-between"><span>Version:</span> <span className="text-[var(--text-secondary)] font-semibold">2.0</span></p>
            <p className="flex justify-between"><span>Agents:</span> <span className="text-[var(--text-secondary)] font-semibold">Online (9)</span></p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-[var(--bg-secondary)]">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
