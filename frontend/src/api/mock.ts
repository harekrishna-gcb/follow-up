/**
 * Demo backend (VITE_API_URL=mock). Implements the same actions, role checks and
 * validation as the Apps Script API, storing data in this browser's localStorage.
 * Handy for trying the UI before the Google Sheet is set up. Not for real data:
 * PINs are stored in plain text here.
 *
 * Demo logins:  Admin / 1234   ·   Ravi / 1111   ·   Arjun / 2222
 */
import type { ApiResponse } from '../types';

const DB_KEY = 'fu.mockdb.v1';
const DAY = 86_400_000;
const STATUSES = ['Not Called', 'Spoke', 'No Answer', 'Busy / Call Back', 'Wrong Number', 'Not Interested'];
const COUNTERS = ['sundayServiceCount', 'tripsAttended', 'eventsAttended', 'weekdaySessionsAttended'];
const NUMBERS = ['chantingRounds', ...COUNTERS];
const ADMIN_FIELDS = ['name', 'phone', 'area', 'pgName', 'firstContactDate', 'booksReading', 'assignedTo', 'notes', ...NUMBERS];
const VOLUNTEER_FIELDS = ['chantingRounds', 'booksReading', 'notes', ...COUNTERS];

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
interface Db {
  contacts: Row[];
  volunteers: Row[];
  callLogs: Row[];
  sessions: Row[];
}
interface Ctx {
  volunteerId: string;
  role: 'admin' | 'volunteer';
  name: string;
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const iso = (msAgo = 0) => new Date(Date.now() - msAgo).toISOString();
const dateOnly = (msAgo: number) => iso(msAgo).slice(0, 10);

function seed(): Db {
  const admin = { id: uid(), name: 'Admin', phone: '9000000001', pin: '1234', role: 'admin', active: true };
  const ravi = { id: uid(), name: 'Ravi', phone: '9000000002', pin: '1111', role: 'volunteer', active: true };
  const arjun = { id: uid(), name: 'Arjun', phone: '9000000003', pin: '2222', role: 'volunteer', active: true };
  const people: [string, string, string, number, string, string][] = [
    ['Aarav Sharma', 'Koramangala', 'Sri Sai PG', 16, 'Bhagavad Gita As It Is', ravi.id],
    ['Rohan Verma', 'HSR Layout', 'Green Nest PG', 4, 'Science of Self-Realization', ravi.id],
    ['Karthik Iyer', 'BTM Layout', 'Sunrise Mens PG', 8, 'Perfect Questions, Perfect Answers', ravi.id],
    ['Siddharth Rao', 'Indiranagar', 'Comfort Stay', 0, '', ravi.id],
    ['Aditya Kulkarni', 'Whitefield', 'Elite PG', 2, 'Beyond Birth and Death', ravi.id],
    ['Vikram Singh', 'Koramangala', 'Sri Sai PG', 16, 'Srimad Bhagavatam', arjun.id],
    ['Nikhil Reddy', 'Marathahalli', 'Royal Residency', 1, '', arjun.id],
    ['Pranav Joshi', 'HSR Layout', 'Green Nest PG', 12, 'Nectar of Devotion', arjun.id],
    ['Harsh Patel', 'Electronic City', 'Tech Park PG', 0, '', arjun.id],
    ['Manish Gupta', 'BTM Layout', 'Sunrise Mens PG', 6, 'Bhagavad Gita As It Is', ''],
    ['Rahul Nair', 'Indiranagar', 'Comfort Stay', 0, '', ''],
    ['Ankit Mishra', 'Bellandur', 'Lake View PG', 20, 'Caitanya Caritamrta', admin.id],
    ['Sai Krishna', 'Koramangala', 'Sri Sai PG', 3, 'Easy Journey to Other Planets', ''],
    ['Deepak Yadav', 'Whitefield', 'Elite PG', 0, '', ravi.id],
  ];
  const contacts = people.map(([name, area, pgName, rounds, books, assignedTo], i) => ({
    id: uid(),
    name,
    phone: String(9876500000 + i * 7919).slice(0, 10),
    area,
    pgName,
    firstContactDate: dateOnly((40 + i * 23) * DAY),
    chantingRounds: rounds,
    booksReading: books,
    sundayServiceCount: (i * 3) % 9,
    tripsAttended: i % 3,
    eventsAttended: (i * 2) % 5,
    weekdaySessionsAttended: (i * 5) % 11,
    assignedTo,
    notes: i % 4 === 0 ? 'Interested in the weekend retreat. Prefers calls after 7 pm.' : '',
    createdAt: iso((40 + i * 23) * DAY),
    updatedAt: iso(i * DAY),
  }));
  const remarks = ['Will come on Sunday', 'Call back in the evening', '', 'Exams this week', 'Asked about the trip', ''];
  const callLogs: Row[] = [];
  contacts.forEach((c, i) => {
    if (i % 5 === 3) return; // some never called
    const n = 1 + (i % 3);
    for (let k = 0; k < n; k++) {
      const daysAgo = (i % 4) * 3 + k * 6 + (i % 2);
      callLogs.push({
        id: uid(),
        contactId: c.id,
        volunteerId: c.assignedTo || admin.id,
        callDate: iso(daysAgo * DAY + i * 3_600_000),
        status: STATUSES[1 + ((i + k) % 5)],
        remarks: remarks[(i + k) % remarks.length],
      });
    }
  });
  return { contacts, volunteers: [admin, ravi, arjun], callLogs, sessions: [] };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* fall through */
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: Db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/* ------------------------------ validation ------------------------------ */

const fail = (msg: string): never => {
  throw new Error(msg);
};
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

function normPhone(raw: unknown) {
  let d = str(raw).replace(/\D/g, '');
  while (d.length > 10 && (d.startsWith('0') || d.startsWith('91'))) d = d.startsWith('0') ? d.slice(1) : d.slice(2);
  return d;
}
function phone(raw: unknown, required = true) {
  if (!required && !str(raw).trim()) return '';
  const d = normPhone(raw);
  return /^\d{10}$/.test(d) ? d : fail('Phone must be a 10-digit number');
}
function text(v: unknown, label: string, max: number, required = false) {
  const s = str(v).trim();
  if (required && !s) fail(`${label} is required`);
  if (s.length > max) fail(`${label} must be at most ${max} characters`);
  return s;
}
function count(v: unknown, label: string) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  if (!Number.isInteger(n)) fail(`${label} must be a whole number`);
  if (n < 0) fail(`${label} cannot be negative`);
  return n;
}
function pin(v: unknown, label = 'PIN') {
  const s = str(v).trim();
  return /^\d{4}$/.test(s) ? s : fail(`${label} must be exactly 4 digits`);
}

function contactFields(p: Row, partial: boolean) {
  const out: Row = {};
  const want = (k: string) => !partial || has(p, k);
  if (want('name')) out.name = text(p.name, 'Name', 100, true);
  if (want('phone')) out.phone = phone(p.phone);
  if (want('area')) out.area = text(p.area, 'Area', 100);
  if (want('pgName')) out.pgName = text(p.pgName, 'PG name', 100);
  if (want('firstContactDate')) {
    const d = str(p.firstContactDate).trim();
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) fail('First contact date must be a valid date');
    out.firstContactDate = d;
  }
  if (want('booksReading')) out.booksReading = text(p.booksReading, 'Books reading', 500);
  if (want('notes')) out.notes = text(p.notes, 'Notes', 5000);
  if (want('assignedTo')) out.assignedTo = str(p.assignedTo).trim();
  NUMBERS.forEach((f) => {
    if (want(f)) out[f] = count(p[f], f);
  });
  return out;
}

/* -------------------------------- helpers ------------------------------- */

const publicVolunteer = (v: Row) => ({ id: v.id, name: v.name, phone: v.phone, role: v.role, active: !!v.active });

function decorate(db: Db, contacts: Row[]): Row[] {
  const last: Record<string, Row> = {};
  db.callLogs.forEach((l) => {
    if (!last[l.contactId] || l.callDate > last[l.contactId].callDate) last[l.contactId] = l;
  });
  const names: Record<string, string> = {};
  db.volunteers.forEach((v) => (names[v.id] = v.name));
  return contacts.map((c) => ({
    ...c,
    lastCallDate: last[c.id]?.callDate ?? null,
    lastCallStatus: last[c.id]?.status ?? null,
    assignedToName: c.assignedTo ? names[c.assignedTo] ?? null : null,
  }));
}

function contactFor(db: Db, id: unknown, ctx: Ctx) {
  const c = db.contacts.find((x) => x.id === str(id));
  if (!c || (ctx.role !== 'admin' && c.assignedTo !== ctx.volunteerId)) fail('Contact not found');
  return c as Row;
}

function activeVolunteer(db: Db, id: string) {
  const v = db.volunteers.find((x) => x.id === id) ?? fail('Volunteer not found');
  if (!v.active) fail('That volunteer is deactivated');
  return v;
}

function uniquePhone(db: Db, p: string, exceptId?: string) {
  const dup = db.contacts.find((c) => normPhone(c.phone) === p && c.id !== exceptId);
  if (dup) fail(`A contact with this phone already exists (${dup.name})`);
}

function uniqueName(db: Db, name: string, exceptId?: string) {
  if (db.volunteers.some((v) => v.name.toLowerCase() === name.toLowerCase() && v.id !== exceptId)) {
    fail(`A volunteer named "${name}" already exists`);
  }
}

/* -------------------------------- actions ------------------------------- */

type Handler = (db: Db, p: Row, ctx: Ctx, token: string) => unknown;
const ADMIN = new Set([
  'addContact', 'deleteContact', 'assignContacts', 'getDashboard', 'getVolunteers', 'addVolunteer', 'updateVolunteer',
]);

const handlers: Record<string, Handler> = {
  logout: (db, _p, _c, token) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    return { loggedOut: true };
  },
  me: (_db, _p, ctx) => ({ id: ctx.volunteerId, name: ctx.name, role: ctx.role }),
  changePin: (db, p, ctx) => {
    const cur = pin(p.currentPin, 'Current PIN');
    const next = pin(p.newPin, 'New PIN');
    if (cur === next) fail('New PIN must be different from the current PIN');
    const v = db.volunteers.find((x) => x.id === ctx.volunteerId)!;
    if (v.pin !== cur) fail('Current PIN is incorrect');
    v.pin = next;
    return { changed: true };
  },

  getContacts: (db, _p, ctx) =>
    decorate(db, ctx.role === 'admin' ? db.contacts : db.contacts.filter((c) => c.assignedTo === ctx.volunteerId)).sort(
      (a, b) => a.name.localeCompare(b.name),
    ),
  getContact: (db, p, ctx) => decorate(db, [contactFor(db, p.id, ctx)])[0],
  addContact: (db, p) => {
    const f = contactFields(p, false);
    if (f.assignedTo) activeVolunteer(db, f.assignedTo);
    uniquePhone(db, f.phone);
    const now = iso();
    const c = { id: uid(), ...f, createdAt: now, updatedAt: now };
    db.contacts.push(c);
    return decorate(db, [c])[0];
  },
  updateContact: (db, p, ctx) => {
    const allowed = ctx.role === 'admin' ? ADMIN_FIELDS : VOLUNTEER_FIELDS;
    const input: Row = {};
    allowed.forEach((k) => has(p, k) && (input[k] = p[k]));
    const f = contactFields(input, true);
    if (f.assignedTo) activeVolunteer(db, f.assignedTo);
    const c = contactFor(db, p.id, ctx);
    if (f.phone) uniquePhone(db, f.phone, c.id);
    Object.assign(c, f, { updatedAt: iso() });
    return decorate(db, [c])[0];
  },
  incrementField: (db, p, ctx) => {
    if (!COUNTERS.includes(str(p.field))) fail('This field cannot be incremented');
    const by = p.by === undefined ? 1 : Number(p.by);
    if (by !== 1 && by !== -1) fail('by must be 1 or -1');
    const c = contactFor(db, p.id, ctx);
    c[p.field] = Math.max(0, Number(c[p.field] || 0) + by);
    c.updatedAt = iso();
    return { ...c };
  },
  deleteContact: (db, p) => {
    const id = str(p.id);
    if (!db.contacts.some((c) => c.id === id)) fail('Contact not found');
    db.contacts = db.contacts.filter((c) => c.id !== id);
    db.callLogs = db.callLogs.filter((l) => l.contactId !== id);
    return { id };
  },
  assignContacts: (db, p) => {
    const ids: string[] = Array.isArray(p.contactIds) ? p.contactIds.map(String) : [];
    if (!ids.length) fail('Select at least one contact');
    const vid = str(p.volunteerId).trim();
    const v = vid ? activeVolunteer(db, vid) : null;
    let updated = 0;
    db.contacts.forEach((c) => {
      if (ids.includes(c.id)) {
        c.assignedTo = vid;
        c.updatedAt = iso();
        updated++;
      }
    });
    if (!updated) fail('No matching contacts found');
    return { updated, volunteerId: vid, volunteerName: v?.name ?? null };
  },

  logCall: (db, p, ctx) => {
    contactFor(db, p.contactId, ctx);
    if (!STATUSES.includes(str(p.status))) fail('Invalid call status');
    const log = {
      id: uid(),
      contactId: str(p.contactId),
      volunteerId: ctx.volunteerId,
      callDate: iso(),
      status: str(p.status),
      remarks: text(p.remarks, 'Remarks', 1000),
    };
    db.callLogs.push(log);
    return { ...log, volunteerName: ctx.name };
  },
  getCallLogs: (db, p, ctx) => {
    contactFor(db, p.contactId, ctx);
    const names: Record<string, string> = {};
    db.volunteers.forEach((v) => (names[v.id] = v.name));
    return db.callLogs
      .filter((l) => l.contactId === str(p.contactId))
      .map((l): Row => ({ ...l, volunteerName: names[l.volunteerId] ?? 'Unknown' }))
      .sort((a, b) => b.callDate.localeCompare(a.callDate));
  },

  getDashboard: (db) => {
    const weekAgo = Date.now() - 7 * DAY;
    const per: Record<string, Row> = {};
    db.volunteers.forEach(
      (v) => (per[v.id] = { id: v.id, name: v.name, role: v.role, active: !!v.active, assigned: 0, calledThisWeek: 0, pending: 0 }),
    );
    let called = 0;
    let unassigned = 0;
    const overdue: Row[] = [];
    decorate(db, db.contacts).forEach((c) => {
      const recent = !!c.lastCallDate && new Date(c.lastCallDate).getTime() >= weekAgo;
      if (recent) called++;
      else overdue.push(c);
      const s = c.assignedTo ? per[c.assignedTo] : null;
      if (!s) unassigned++;
      else {
        s.assigned++;
        if (recent) s.calledThisWeek++;
        else s.pending++;
      }
    });
    overdue.sort((a, b) => str(a.lastCallDate).localeCompare(str(b.lastCallDate)));
    return {
      totals: { totalContacts: db.contacts.length, calledThisWeek: called, needsFollowUp: overdue.length, unassigned },
      volunteers: Object.values(per)
        .filter((v) => v.active || v.assigned > 0)
        .sort((a, b) => b.pending - a.pending || a.name.localeCompare(b.name)),
      overdue,
    };
  },

  getVolunteers: (db) =>
    db.volunteers
      .map((v) => ({ ...publicVolunteer(v), assignedCount: db.contacts.filter((c) => c.assignedTo === v.id).length }))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)),
  addVolunteer: (db, p) => {
    const name = text(p.name, 'Name', 60, true);
    uniqueName(db, name);
    const role = p.role === 'admin' ? 'admin' : 'volunteer';
    const v = { id: uid(), name, phone: phone(p.phone, false), pin: pin(p.pin), role, active: true };
    db.volunteers.push(v);
    return { ...publicVolunteer(v), assignedCount: 0 };
  },
  updateVolunteer: (db, p, ctx) => {
    const v = db.volunteers.find((x) => x.id === str(p.id)) ?? fail('Volunteer not found');
    const wasAdmin = v.role === 'admin' && v.active;
    const next = { ...v };
    if (has(p, 'name')) {
      next.name = text(p.name, 'Name', 60, true);
      uniqueName(db, next.name, v.id);
    }
    if (has(p, 'phone')) next.phone = phone(p.phone, false);
    if (has(p, 'role')) next.role = p.role === 'admin' ? 'admin' : 'volunteer';
    if (has(p, 'active')) {
      if (!p.active && v.id === ctx.volunteerId) fail('You cannot deactivate yourself');
      next.active = !!p.active;
    }
    if (has(p, 'pin') && str(p.pin).trim()) next.pin = pin(p.pin);
    if (wasAdmin && !(next.role === 'admin' && next.active)) {
      if (!db.volunteers.some((x) => x.id !== v.id && x.role === 'admin' && x.active)) {
        fail('There must be at least one active admin');
      }
    }
    Object.assign(v, next);
    if (!v.active || (has(p, 'pin') && str(p.pin).trim() && v.id !== ctx.volunteerId)) {
      db.sessions = db.sessions.filter((s) => s.volunteerId !== v.id);
    }
    return publicVolunteer(v);
  },
};

function login(db: Db, p: Row) {
  const ident = str(p.volunteerId || p.name).trim().toLowerCase();
  if (!ident || !str(p.pin)) fail('Enter your name and PIN');
  const v = db.volunteers.find((x) => x.id === ident || x.name.toLowerCase() === ident);
  if (!v || !v.active || v.pin !== str(p.pin).trim()) fail('Incorrect name or PIN');
  const token = uid();
  db.sessions.push({ token, volunteerId: v!.id, role: v!.role, expiresAt: iso(-7 * DAY) });
  return { token, volunteer: { id: v!.id, name: v!.name, role: v!.role } };
}

function session(db: Db, token: unknown): Ctx {
  const s = db.sessions.find((x) => x.token === token && new Date(x.expiresAt).getTime() > Date.now());
  const v = s && db.volunteers.find((x) => x.id === s.volunteerId);
  if (!v || !v.active) fail('Invalid or expired session. Please log in again.');
  return { volunteerId: v!.id, role: v!.role, name: v!.name };
}

/** Same contract as the Apps Script doPost: JSON string in, { success, data | error } out. */
export async function mockHandle<T>(body: string): Promise<ApiResponse<T>> {
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 450)); // feel the latency
  const db = load();
  try {
    const { action, token, payload = {} } = JSON.parse(body) as { action: string; token?: string; payload?: Row };
    let data: unknown;
    if (action === 'login') {
      data = login(db, payload);
    } else {
      const handler = handlers[action] ?? fail(`Unknown action: ${action}`);
      const ctx = session(db, token);
      if (ADMIN.has(action) && ctx.role !== 'admin') fail('Only admins can do this');
      data = handler(db, payload, ctx, String(token));
    }
    save(db);
    return { success: true, data: JSON.parse(JSON.stringify(data)) as T };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/** Resets the demo data (used from Settings). */
export function resetMockDb() {
  localStorage.removeItem(DB_KEY);
}
