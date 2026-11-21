/**
 * Authentication: PIN hashing (SHA-256 + salt from Script Properties),
 * session tokens stored in the Sessions sheet (7-day expiry).
 */

function getSalt_() {
  const salt = PropertiesService.getScriptProperties().getProperty('PIN_SALT');
  if (!salt) throw new Error('PIN_SALT is not set in Script Properties. Run setup() first.');
  return salt;
}

function hashPin_(pin) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    getSalt_() + ':' + String(pin),
    Utilities.Charset.UTF_8
  );
  return bytes.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

/** payload: { name | volunteerId, pin } */
function login_(p) {
  const ident = str_(p.volunteerId || p.name).trim();
  const pin = str_(p.pin).trim();
  if (!ident || !pin) throw new Error('Enter your name and PIN');

  // Simple brute-force protection: 5 wrong PINs locks that name for 15 minutes.
  const cache = CacheService.getScriptCache();
  const failKey = 'loginFail:' + ident.toLowerCase();
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= MAX_LOGIN_ATTEMPTS) {
    throw new Error('Too many wrong attempts. Please try again in 15 minutes.');
  }

  const volunteers = readTable_(SHEETS.VOLUNTEERS).rows;
  const v =
    findById_(volunteers, ident) ||
    volunteers.find((x) => str_(x.name).trim().toLowerCase() === ident.toLowerCase());

  if (!v || !bool_(v.active) || str_(v.pinHash) !== hashPin_(pin)) {
    cache.put(failKey, String(fails + 1), LOGIN_LOCKOUT_SECONDS);
    throw new Error('Incorrect name or PIN');
  }
  cache.remove(failKey);

  const role = v.role === 'admin' ? 'admin' : 'volunteer';
  const token = Utilities.getUuid();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS).toISOString();

  withLock_(() => {
    const sessions = readTable_(SHEETS.SESSIONS);
    // Housekeeping: drop expired sessions while we hold the lock.
    const now = Date.now();
    const alive = sessions.rows.filter((s) => new Date(s.expiresAt).getTime() > now);
    if (alive.length !== sessions.rows.length) rewriteTable_(sessions, alive);
    appendRecord_(sessions, { token: token, volunteerId: str_(v.id), role: role, expiresAt: expiresAt });
  });

  return { token: token, volunteer: { id: str_(v.id), name: str_(v.name), role: role } };
}

/**
 * Validates a token and returns the caller context { volunteerId, role, name }.
 * The role is read from the Volunteers sheet (source of truth) so that a
 * demotion or deactivation takes effect immediately, not after 7 days.
 */
function requireSession_(token) {
  const t = str_(token).trim();
  if (!t) throw new Error(SESSION_ERROR);

  const session = readTable_(SHEETS.SESSIONS).rows.find((s) => str_(s.token) === t);
  if (!session || !(new Date(session.expiresAt).getTime() > Date.now())) throw new Error(SESSION_ERROR);

  const v = findById_(readTable_(SHEETS.VOLUNTEERS).rows, session.volunteerId);
  if (!v || !bool_(v.active)) throw new Error(SESSION_ERROR);

  return {
    volunteerId: str_(v.id),
    name: str_(v.name),
    role: v.role === 'admin' ? 'admin' : 'volunteer',
  };
}

function logout_(token) {
  const t = str_(token).trim();
  withLock_(() => {
    const sessions = readTable_(SHEETS.SESSIONS);
    const s = sessions.rows.find((x) => str_(x.token) === t);
    if (s) deleteRecord_(sessions, s);
  });
  return { loggedOut: true };
}

function me_(ctx) {
  return { id: ctx.volunteerId, name: ctx.name, role: ctx.role };
}

/** payload: { currentPin, newPin } — any signed-in user, for themselves. */
function changePin_(p, ctx) {
  const currentPin = requirePin_(p.currentPin, 'Current PIN');
  const newPin = requirePin_(p.newPin, 'New PIN');
  if (currentPin === newPin) throw new Error('New PIN must be different from the current PIN');

  return withLock_(() => {
    const table = readTable_(SHEETS.VOLUNTEERS);
    const v = findById_(table.rows, ctx.volunteerId);
    if (!v) throw new Error('Volunteer not found');
    if (str_(v.pinHash) !== hashPin_(currentPin)) throw new Error('Current PIN is incorrect');
    v.pinHash = hashPin_(newPin);
    updateRecord_(table, v);
    return { changed: true };
  });
}

/** Removes every session of a volunteer (used on deactivate / PIN reset). */
function revokeSessionsFor_(volunteerId) {
  const sessions = readTable_(SHEETS.SESSIONS);
  const keep = sessions.rows.filter((s) => str_(s.volunteerId) !== String(volunteerId));
  if (keep.length !== sessions.rows.length) rewriteTable_(sessions, keep);
}
