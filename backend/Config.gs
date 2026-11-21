/**
 * Contact Follow-up App — Google Apps Script JSON API
 * ===================================================
 *
 * Architecture:
 *   React app (Vercel/Netlify) ──fetch POST──▶ this Web App (JSON API) ──▶ Google Sheet
 *
 * ---------------------------------------------------------------------------
 * CORS — WHY THE FRONTEND SENDS "text/plain"
 * ---------------------------------------------------------------------------
 * Apps Script Web Apps cannot answer CORS preflight (OPTIONS) requests.
 * A browser only skips the preflight for "simple" requests, so the frontend:
 *   1. Sends POST with header  Content-Type: text/plain;charset=utf-8
 *      (NOT application/json). The body is still a JSON string, and we parse
 *      it here with JSON.parse(e.postData.contents).
 *   2. Sends NO custom headers (no Authorization header). The session token
 *      travels inside the JSON body instead: { action, token, payload }.
 *   3. Uses fetch(..., { redirect: "follow" }), because Apps Script answers
 *      with a 302 redirect to script.googleusercontent.com, which serves the
 *      actual JSON with permissive CORS headers.
 *
 * Files in this project (all share one global scope, as Apps Script does):
 *   Config.gs      constants, sheet headers, field lists
 *   Api.gs         doGet / doPost, routing, response helpers
 *   Db.gs          generic sheet <-> object helpers, locking
 *   Validation.gs  input validation & type coercion
 *   Auth.gs        PIN hashing, sessions, login/logout/me/changePin
 *   Contacts.gs    contact CRUD, counters, assignment
 *   Calls.gs       call logs
 *   Dashboard.gs   admin dashboard aggregation
 *   Volunteers.gs  volunteer management
 *   Setup.gs       one-time setup() and optional backups
 */

const SHEETS = {
  CONTACTS: 'Contacts',
  VOLUNTEERS: 'Volunteers',
  CALL_LOGS: 'CallLogs',
  SESSIONS: 'Sessions',
};

/** camelCase headers that match JSON keys exactly, so rows map to objects generically. */
const HEADERS = {
  Contacts: [
    'id', 'name', 'phone', 'area', 'pgName', 'firstContactDate', 'chantingRounds',
    'booksReading', 'sundayServiceCount', 'tripsAttended', 'eventsAttended',
    'weekdaySessionsAttended', 'assignedTo', 'notes', 'createdAt', 'updatedAt',
  ],
  Volunteers: ['id', 'name', 'phone', 'pinHash', 'role', 'active'],
  CallLogs: ['id', 'contactId', 'volunteerId', 'callDate', 'status', 'remarks'],
  Sessions: ['token', 'volunteerId', 'role', 'expiresAt'],
};

const CALL_STATUSES = [
  'Not Called',
  'Spoke',
  'No Answer',
  'Busy / Call Back',
  'Wrong Number',
  'Not Interested',
];

/** The only fields incrementField may touch. */
const COUNTER_FIELDS = [
  'sundayServiceCount',
  'tripsAttended',
  'eventsAttended',
  'weekdaySessionsAttended',
];

const NUMBER_FIELDS = ['chantingRounds'].concat(COUNTER_FIELDS);

const FIELD_LABELS = {
  name: 'Name',
  phone: 'Phone',
  area: 'Area',
  pgName: 'PG name',
  firstContactDate: 'First contact date',
  chantingRounds: 'Chanting rounds',
  booksReading: 'Books reading',
  sundayServiceCount: 'Sunday Service',
  tripsAttended: 'Trips',
  eventsAttended: 'Events',
  weekdaySessionsAttended: 'Weekday Sessions',
  assignedTo: 'Assigned to',
  notes: 'Notes',
};

/** Fields an admin may set through addContact / updateContact. */
const CONTACT_EDITABLE_FIELDS = [
  'name', 'phone', 'area', 'pgName', 'firstContactDate', 'chantingRounds',
  'booksReading', 'sundayServiceCount', 'tripsAttended', 'eventsAttended',
  'weekdaySessionsAttended', 'assignedTo', 'notes',
];

/** Fields a volunteer may change on contacts assigned to them. */
const VOLUNTEER_EDITABLE_FIELDS = ['chantingRounds', 'booksReading', 'notes'].concat(COUNTER_FIELDS);

const SESSION_DAYS = 7;
const FOLLOW_UP_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_SECONDS = 15 * 60;

/** The frontend detects this wording ("session") and sends the user to /login. */
const SESSION_ERROR = 'Invalid or expired session. Please log in again.';
