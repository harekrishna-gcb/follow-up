export const DAY_MS = 24 * 60 * 60 * 1000;
export const FOLLOW_UP_DAYS = 7;

/** Parses ISO date-times, and treats bare YYYY-MM-DD as a local date (no timezone shift). */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days since the date (rolling 24h), or null. Matches the server's rule. */
export function daysSince(value: string | null | undefined): number | null {
  const d = parseDate(value);
  if (!d) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / DAY_MS));
}

/** No call in the last 7 days, or never called. */
export function needsFollowUp(lastCallDate: string | null | undefined): boolean {
  const d = parseDate(lastCallDate);
  return !d || Date.now() - d.getTime() >= FOLLOW_UP_DAYS * DAY_MS;
}

/** "Today", "Yesterday", "3 days ago", "2 weeks ago", "12 Mar 2024" */
export function formatRelative(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return '—';
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return w === 1 ? '1 week ago' : `${w} weeks ago`;
  }
  if (days < 365) {
    const mo = Math.floor(days / 30);
    return mo === 1 ? '1 month ago' : `${mo} months ago`;
  }
  return formatDate(value);
}

/** 12 Mar 2024 */
export function formatDate(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** 12 Mar, 4:35 pm */
export function formatDateTime(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return '—';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Today as YYYY-MM-DD in local time (for <input type="date">). */
export function todayISODate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
