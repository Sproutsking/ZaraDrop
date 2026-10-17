import type { ReactNode } from 'react';
import { Sidebar, type NavItem } from './Sidebar';

export type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  navItems: NavItem[];
  children: ReactNode;
};

export function AppShell({ title, subtitle, actions, navItems, children }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020817', color: '#e2e8f0' }}>
      <Sidebar title={title} navItems={navItems} />

      <main style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: '1rem',
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>
              {subtitle ?? 'Operations overview'}
            </div>
            <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 700 }}>{title}</h1>
          </div>
          {actions}
        </header>

        <div style={{ display: 'grid', gap: '1rem' }}>{children}</div>
      </main>
    </div>
  );
}
