export type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  accent?: 'blue' | 'green' | 'amber' | 'rose';
};

export function StatCard({ label, value, detail, accent = 'blue' }: StatCardProps) {
  const accentMap = {
    blue: '#60a5fa',
    green: '#34d399',
    amber: '#fbbf24',
    rose: '#fb7185'
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.86)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: '1rem',
        padding: '1.1rem 1.2rem',
        display: 'grid',
        gap: '0.4rem'
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>{value}</div>
      <div style={{ color: accentMap[accent], fontSize: '0.8rem', fontWeight: 600 }}>{detail}</div>
    </div>
  );
}
