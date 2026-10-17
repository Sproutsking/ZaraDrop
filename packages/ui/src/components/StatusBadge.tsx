export function StatusBadge({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'green' | 'amber' | 'rose' }) {
  const tones = {
    blue: { background: 'rgba(59,130,246,0.14)', color: '#bfdbfe' },
    green: { background: 'rgba(34,197,94,0.14)', color: '#bbf7d0' },
    amber: { background: 'rgba(245,158,11,0.14)', color: '#fde68a' },
    rose: { background: 'rgba(244,63,94,0.14)', color: '#fecdd3' }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.35rem 0.7rem',
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: '0.75rem',
        ...tones[tone]
      }}
    >
      {label}
    </span>
  );
}
