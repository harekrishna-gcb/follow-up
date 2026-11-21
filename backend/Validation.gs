/**
 * Input validation and type coercion. Every handler validates its payload
 * with these helpers; they throw an Error with a human-friendly message.
 */

function str_(v) {
  return v === undefined || v === null ? '' : String(v);
}

function num_(v) {
  const n = Number(v);
  return isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function bool_(v) {
  return v === true || String(v).toUpperCase() === 'TRUE';
}

function has_(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Strips spaces/dashes, a leading 0 or +91, leaving a bare 10-digit number. */
function normalizePhone_(raw) {
  let d = str_(raw).replace(/\D/g, '');
  while (d.length > 10 && (d.charAt(0) === '0' || d.indexOf('91') === 0)) {
    d = d.charAt(0) === '0' ? d.slice(1) : d.slice(2);
  }
  return d;
}

function requirePhone_(raw, label) {
  const d = normalizePhone_(raw);
  if (!/^\d{10}$/.test(d)) throw new Error((label || 'Phone') + ' must be a 10-digit number');
  return d;
}

function optPhone_(raw, label) {
  return str_(raw).trim() ? requirePhone_(raw, label) : '';
}

function requireText_(v, label, max) {
  const s = str_(v).trim();
  if (!s) throw new Error(label + ' is required');
  if (s.length > max) throw new Error(label + ' must be at most ' + max + ' characters');
  return s;
}

function optText_(v, label, max) {
  const s = str_(v).trim();
  if (s.length > max) throw new Error(label + ' must be at most ' + max + ' characters');
  return s;
}

function nonNegInt_(v, label) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  if (!isFinite(n) || Math.floor(n) !== n) throw new Error(label + ' must be a whole number');
  if (n < 0) throw new Error(label + ' cannot be negative');
  if (n > 100000) throw new Error(label + ' is too large');
  return n;
}

function optDate_(v, label) {
  const s = str_(v).trim();
  if (!s) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(new Date(s + 'T00:00:00Z').getTime())) {
    throw new Error(label + ' must be a valid date (YYYY-MM-DD)');
  }
  return s;
}

function requirePin_(v, label) {
  const s = str_(v).trim();
  if (!/^\d{4}$/.test(s)) throw new Error((label || 'PIN') + ' must be exactly 4 digits');
  return s;
}

function requireRole_(v) {
  const s = str_(v).trim();
  if (s !== 'admin' && s !== 'volunteer') throw new Error('Role must be "admin" or "volunteer"');
  return s;
}

function requireId_(v, label) {
  const s = str_(v).trim();
  if (!s) throw new Error((label || 'id') + ' is required');
  return s;
}

/**
 * Validates contact fields. With partial=true only the keys present in the
 * payload are validated and returned (used by updateContact).
 */
function validateContactFields_(p, partial) {
  const out = {};
  const want = (k) => !partial || has_(p, k);

  if (want('name')) out.name = requireText_(p.name, FIELD_LABELS.name, 100);
  if (want('phone')) out.phone = requirePhone_(p.phone, FIELD_LABELS.phone);
  if (want('area')) out.area = optText_(p.area, FIELD_LABELS.area, 100);
  if (want('pgName')) out.pgName = optText_(p.pgName, FIELD_LABELS.pgName, 100);
  if (want('firstContactDate')) out.firstContactDate = optDate_(p.firstContactDate, FIELD_LABELS.firstContactDate);
  if (want('booksReading')) out.booksReading = optText_(p.booksReading, FIELD_LABELS.booksReading, 500);
  if (want('notes')) out.notes = optText_(p.notes, FIELD_LABELS.notes, 5000);
  if (want('assignedTo')) out.assignedTo = str_(p.assignedTo).trim();
  NUMBER_FIELDS.forEach((f) => {
    if (want(f)) out[f] = nonNegInt_(p[f], FIELD_LABELS[f]);
  });
  return out;
}

/* ---------- Row -> API object mappers (never leak pinHash) ---------- */

function toContact_(r) {
  return {
    id: str_(r.id),
    name: str_(r.name),
    phone: str_(r.phone),
    area: str_(r.area),
    pgName: str_(r.pgName),
    firstContactDate: str_(r.firstContactDate),
    chantingRounds: num_(r.chantingRounds),
    booksReading: str_(r.booksReading),
    sundayServiceCount: num_(r.sundayServiceCount),
    tripsAttended: num_(r.tripsAttended),
    eventsAttended: num_(r.eventsAttended),
    weekdaySessionsAttended: num_(r.weekdaySessionsAttended),
    assignedTo: str_(r.assignedTo),
    notes: str_(r.notes),
    createdAt: str_(r.createdAt),
    updatedAt: str_(r.updatedAt),
  };
}

function toVolunteer_(r) {
  return {
    id: str_(r.id),
    name: str_(r.name),
    phone: str_(r.phone),
    role: r.role === 'admin' ? 'admin' : 'volunteer',
    active: bool_(r.active),
  };
}

function toCallLog_(r) {
  return {
    id: str_(r.id),
    contactId: str_(r.contactId),
    volunteerId: str_(r.volunteerId),
    callDate: str_(r.callDate),
    status: str_(r.status),
    remarks: str_(r.remarks),
  };
}
