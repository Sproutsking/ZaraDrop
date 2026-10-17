export type NavItem = {
  label: string;
  icon: string;
  active?: boolean;
};

export function Sidebar({ title, navItems }: { title: string; navItems: NavItem[] }) {
  return (
    <aside
      style={{
        width: '260px',
        padding: '1.25rem',
        background: '#0f172a',
        borderRight: '1px solid rgba(148, 163, 184, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          padding: '0.65rem 0.75rem',
          borderRadius: '0.9rem',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.22)'
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🚚</span>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#93c5fd' }}>
            ZaraDrop
          </div>
          <strong style={{ fontSize: '1rem' }}>{title}</strong>
        </div>
      </div>

      <nav style={{ display: 'grid', gap: '0.5rem' }}>
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '0.8rem 0.9rem',
              borderRadius: '0.75rem',
              background: item.active ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
              border: item.active ? '1px solid rgba(96, 165, 250, 0.25)' : '1px solid transparent',
              color: item.active ? '#eff6ff' : '#cbd5e1',
              fontWeight: item.active ? 600 : 500
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}
