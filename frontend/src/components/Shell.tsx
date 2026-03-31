'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Upload, FileText, GitCompare, Shield,
  Calculator, Users, Bot, BarChart3, Settings, ChevronRight
} from 'lucide-react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/workflows', label: 'Workflows', icon: GitCompare },
  { href: '/returns', label: 'Returns', icon: FileText },
  { href: '/audit', label: 'Audit', icon: Shield },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/calculator', label: 'Tax Calculator', icon: Calculator },
  { href: '/copilot', label: 'AI Copilot', icon: Bot },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[var(--border)] flex flex-col bg-[var(--bg)]">
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--accent)] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">TaxPilot AI</h1>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">CA Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-[var(--accent)] text-white font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="text-[11px] text-[var(--text-tertiary)]">
            <p>FY 2024-25</p>
            <p className="mt-0.5">v2.0 • 9 Agents</p>
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
