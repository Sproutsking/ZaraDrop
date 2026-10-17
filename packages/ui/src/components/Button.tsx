import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  const palette = {
    primary: {
      background: '#3b82f6',
      color: '#ffffff',
      border: 'transparent'
    },
    secondary: {
      background: '#0f172a',
      color: '#e2e8f0',
      border: '1px solid rgba(148, 163, 184, 0.25)'
    },
    ghost: {
      background: 'transparent',
      color: '#cbd5e1',
      border: '1px solid rgba(148, 163, 184, 0.25)'
    }
  };

  return (
    <button
      {...props}
      style={{
        ...style,
        background: palette[variant].background,
        color: palette[variant].color,
        border: palette[variant].border,
        borderRadius: '0.75rem',
        padding: '0.72rem 1rem',
        fontSize: '0.92rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.2s ease'
      }}
    >
      {children}
    </button>
  );
}
