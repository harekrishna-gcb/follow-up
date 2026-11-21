import { cn } from '../utils/cn';

export function roundsTier(n: number) {
  if (n >= 16) return { label: 'Full 16 rounds', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' };
  if (n >= 5) return { label: 'Steady', text: 'text-brand-700', bg: 'bg-brand-50', ring: 'ring-brand-200' };
  if (n >= 1) return { label: 'Starting', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200' };
  return { label: 'Not chanting yet', text: 'text-slate-500', bg: 'bg-slate-100', ring: 'ring-slate-200' };
}

/** Compact "chanting rounds" indicator used on cards. */
export function RoundsBadge({ rounds, className }: { rounds: number; className?: string }) {
  const t = roundsTier(rounds);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1 ring-1 ring-inset',
        t.bg,
        t.ring,
        className,
      )}
      title={`${rounds} chanting rounds`}
    >
      <span className={cn('text-base font-bold leading-none tabular-nums', t.text)}>{rounds}</span>
      <span className={cn('mt-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide', t.text)}>rounds</span>
    </span>
  );
}
