import { type ReactNode } from 'react';

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'error' | 'neutral' | 'navy';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  accent: 'bg-accent-50 text-accent-700 ring-accent-200',
  success: 'bg-success-50 text-success-700 ring-success-200',
  warning: 'bg-warning-50 text-warning-700 ring-warning-200',
  error: 'bg-error-50 text-error-700 ring-error-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  navy: 'bg-navy-50 text-navy-700 ring-navy-200',
};

export function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md';
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ring-1 ring-inset rounded-full ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${tones[tone]}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color =
    score >= 75 ? 'text-success-500' : score >= 55 ? 'text-brand-500' : 'text-warning-500';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={color}
          stroke="currentColor"
        />
      </svg>
      <span className={`absolute text-sm font-semibold ${color}`}>{score}</span>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = 'brand',
  className = '',
}: {
  value: number;
  tone?: 'brand' | 'success' | 'warning' | 'error';
  className?: string;
}) {
  const colors = {
    brand: 'bg-brand-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };
  return (
    <div className={`h-2 w-full rounded-full bg-slate-200 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${colors[tone]} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
