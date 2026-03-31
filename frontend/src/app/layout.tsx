import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TaxPilot AI — CA Automation Platform',
  description: 'Multi-agent AI system for chartered accountant compliance automation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
