export type Role = 'admin' | 'volunteer';

export const CALL_STATUSES = [
  'Not Called',
  'Spoke',
  'No Answer',
  'Busy / Call Back',
  'Wrong Number',
  'Not Interested',
] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export const COUNTER_FIELDS = [
  'sundayServiceCount',
  'tripsAttended',
  'eventsAttended',
  'weekdaySessionsAttended',
] as const;
export type CounterField = (typeof COUNTER_FIELDS)[number];

export const COUNTER_LABELS: Record<CounterField, string> = {
  sundayServiceCount: 'Sunday Service',
  tripsAttended: 'Trips',
  eventsAttended: 'Events',
  weekdaySessionsAttended: 'Weekday Sessions',
};

/** A contact row as stored in the sheet. */
export interface ContactRecord {
  id: string;
  name: string;
  phone: string;
  area: string;
  pgName: string;
  /** YYYY-MM-DD or "" */
  firstContactDate: string;
  chantingRounds: number;
  booksReading: string;
  sundayServiceCount: number;
  tripsAttended: number;
  eventsAttended: number;
  weekdaySessionsAttended: number;
  /** volunteer id or "" */
  assignedTo: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** A contact as returned by getContacts/getContact (with computed fields). */
export interface Contact extends ContactRecord {
  lastCallDate: string | null;
  lastCallStatus: CallStatus | null;
  assignedToName: string | null;
}

export type ContactInput = Omit<ContactRecord, 'id' | 'createdAt' | 'updatedAt'>;

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  role: Role;
  active: boolean;
  assignedCount?: number;
}

export interface CallLog {
  id: string;
  contactId: string;
  volunteerId: string;
  volunteerName: string;
  /** ISO date-time */
  callDate: string;
  status: CallStatus;
  remarks: string;
  /** client-only: optimistic entry not yet saved */
  pending?: boolean;
}

export interface VolunteerStats {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  assigned: number;
  calledThisWeek: number;
  pending: number;
}

export interface DashboardData {
  totals: {
    totalContacts: number;
    calledThisWeek: number;
    needsFollowUp: number;
    unassigned: number;
  };
  volunteers: VolunteerStats[];
  overdue: Contact[];
}

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  volunteer: SessionUser;
}

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
