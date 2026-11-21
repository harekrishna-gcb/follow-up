import {
  Ban,
  CircleCheck,
  CircleDashed,
  PhoneMissed,
  PhoneForwarded,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import type { CallStatus } from '../types';
import { daysSince, formatRelative, needsFollowUp } from '../utils/date';
import { cn } from '../utils/cn';

export const STATUS_META: Record<CallStatus, { badge: string; dot: string; tile: string; icon: LucideIcon }> = {
  'Not Called': {
    badge: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    tile: 'text-slate-600 bg-slate-50',
    icon: CircleDashed,
  },
  Spoke: {
    badge: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    tile: 'text-emerald-700 bg-emerald-50',
    icon: CircleCheck,
  },
  'No Answer': {
    badge: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    tile: 'text-amber-700 bg-amber-50',
    icon: PhoneMissed,
  },
  'Busy / Call Back': {
    badge: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
    tile: 'text-sky-700 bg-sky-50',
    icon: PhoneForwarded,
  },
  'Wrong Number': {
    badge: 'bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    tile: 'text-rose-700 bg-rose-50',
    icon: Ban,
  },
  'Not Interested': {
    badge: 'bg-stone-100 text-stone-600',
    dot: 'bg-stone-400',
    tile: 'text-stone-600 bg-stone-100',
    icon: UserX,
  },
};

export function StatusBadge({ status, className }: { status: CallStatus; className?: string }) {
  const meta = STATUS_META[status] ?? STATUS_META['Not Called'];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold',
        meta.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {status}
    </span>
  );
}

/** Status badge + "Not called in X days" / "3 days ago". */
export function LastCallSummary({
  lastCallDate,
  lastCallStatus,
}: {
  lastCallDate: string | null;
  lastCallStatus: CallStatus | null;
}) {
  if (!lastCallDate) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Not called yet
      </span>
    );
  }
  const overdue = needsFollowUp(lastCallDate);
  const days = daysSince(lastCallDate) ?? 0;
  return (
    <>
      <StatusBadge status={lastCallStatus ?? 'Not Called'} />
      <span className={cn('whitespace-nowrap text-xs', overdue ? 'font-semibold text-amber-700' : 'text-slate-500')}>
        {overdue ? `Not called in ${days} days` : formatRelative(lastCallDate)}
      </span>
    </>
  );
}
