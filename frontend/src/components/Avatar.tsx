import { cn } from '../utils/cn';

const PALETTE = [
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
];

const SIZES = {
  sm: 'h-9 w-9 text-[13px]',
  md: 'h-11 w-11 text-[15px]',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-20 w-20 text-2xl',
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full font-semibold',
        PALETTE[hash(name) % PALETTE.length],
        SIZES[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
