import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

type DemoNoticeProps = { children?: ReactNode };

export function DemoNotice({ children = 'Preview data only. This section is not connected to live services.' }: DemoNoticeProps) {
  return <aside role="note" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px', border: '1px solid rgba(251, 191, 36, .28)', borderRadius: 8, background: 'rgba(251, 191, 36, .08)', color: '#f5d58a', font: '12px/1.5 "DM Sans", system-ui, sans-serif' }}>
    <TriangleAlert size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 1 }} />
    <span>{children}</span>
  </aside>;
}