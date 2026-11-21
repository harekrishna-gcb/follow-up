import type { Contact } from '../types';
import { needsFollowUp } from './date';
import { normalizePhone } from './phone';

export type RoundsFilter = 'any' | '0' | '1-4' | '5-15' | '16+';
export type SortKey = 'name' | 'lastCall' | 'rounds';

export interface HomeFilters {
  /** 'all' | 'unassigned' | volunteer id */
  volunteer: string;
  rounds: RoundsFilter;
  followUp: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: HomeFilters = { volunteer: 'all', rounds: 'any', followUp: false, sort: 'name' };
export const FILTERS_KEY = 'fu.home.filters';
export const QUERY_KEY = 'fu.home.query';

export const ROUNDS_OPTIONS: { value: RoundsFilter; label: string }[] = [
  { value: 'any', label: 'Any rounds' },
  { value: '0', label: '0 rounds' },
  { value: '1-4', label: '1–4 rounds' },
  { value: '5-15', label: '5–15 rounds' },
  { value: '16+', label: '16+ rounds' },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'lastCall', label: 'Longest since last call' },
  { value: 'rounds', label: 'Most chanting rounds' },
];

export function matchesRounds(n: number, f: RoundsFilter): boolean {
  switch (f) {
    case '0':
      return n === 0;
    case '1-4':
      return n >= 1 && n <= 4;
    case '5-15':
      return n >= 5 && n <= 15;
    case '16+':
      return n >= 16;
    default:
      return true;
  }
}

export function activeFilterCount(f: HomeFilters): number {
  return Number(f.volunteer !== 'all') + Number(f.rounds !== 'any') + Number(f.followUp);
}

/** Client-side, instant search + filter + sort. */
export function applyFilters(contacts: Contact[], query: string, f: HomeFilters): Contact[] {
  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');

  const out = contacts.filter((c) => {
    if (f.volunteer === 'unassigned' && c.assignedTo) return false;
    if (f.volunteer !== 'all' && f.volunteer !== 'unassigned' && c.assignedTo !== f.volunteer) return false;
    if (!matchesRounds(c.chantingRounds, f.rounds)) return false;
    if (f.followUp && !needsFollowUp(c.lastCallDate)) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.area.toLowerCase().includes(q) ||
      c.pgName.toLowerCase().includes(q) ||
      (qDigits.length >= 3 && normalizePhone(c.phone).includes(qDigits))
    );
  });

  const byName = (a: Contact, b: Contact) => a.name.localeCompare(b.name);
  if (f.sort === 'lastCall') {
    out.sort((a, b) => (a.lastCallDate ?? '').localeCompare(b.lastCallDate ?? '') || byName(a, b));
  } else if (f.sort === 'rounds') {
    out.sort((a, b) => b.chantingRounds - a.chantingRounds || byName(a, b));
  } else {
    out.sort(byName);
  }
  return out;
}

/** Lets other screens (e.g. Dashboard) open Home with filters pre-set. */
export function presetHomeFilters(partial: Partial<HomeFilters>): void {
  try {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify({ ...DEFAULT_FILTERS, ...partial }));
    sessionStorage.setItem(QUERY_KEY, JSON.stringify(''));
  } catch {
    /* storage unavailable */
  }
}
