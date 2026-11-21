/**
 * Contacts: list, read, create, update, counters, delete, bulk assignment.
 * Volunteers only ever see / touch contacts assigned to them.
 */

/** contactId -> { callDate, status } of the most recent call. */
function lastCallMap_() {
  const map = {};
  readTable_(SHEETS.CALL_LOGS).rows.forEach((r) => {
    const id = str_(r.contactId);
    const d = str_(r.callDate);
    if (!map[id] || d > map[id].callDate) map[id] = { callDate: d, status: str_(r.status) };
  });
  return map;
}

/** volunteerId -> name */
function volunteerNameMap_() {
  const map = {};
  readTable_(SHEETS.VOLUNTEERS).rows.forEach((r) => (map[str_(r.id)] = str_(r.name)));
  return map;
}

/** Adds lastCallDate, lastCallStatus and assignedToName so the list needs no extra requests. */
function decorateContacts_(contacts, lastCalls, names) {
  lastCalls = lastCalls || lastCallMap_();
  names = names || volunteerNameMap_();
  return contacts.map((c) => {
    const lc = lastCalls[c.id];
    return Object.assign({}, c, {
      lastCallDate: lc ? lc.callDate : null,
      lastCallStatus: lc ? lc.status : null,
      assignedToName: c.assignedTo ? names[c.assignedTo] || null : null,
    });
  });
}

function canAccess_(contact, ctx) {
  return ctx.role === 'admin' || str_(contact.assignedTo) === ctx.volunteerId;
}

/** Finds a contact row and checks the caller may access it. */
function requireContactRow_(table, id, ctx) {
  const row = findById_(table.rows, requireId_(id, 'Contact id'));
  // Same message for "missing" and "forbidden", so ids can't be probed.
  if (!row || !canAccess_(row, ctx)) throw new Error('Contact not found');
  return row;
}

function requireActiveVolunteer_(volunteerId) {
  const v = findById_(readTable_(SHEETS.VOLUNTEERS).rows, volunteerId);
  if (!v) throw new Error('Volunteer not found');
  if (!bool_(v.active)) throw new Error('That volunteer is deactivated');
  return v;
}

function assertUniquePhone_(rows, phone, exceptId) {
  const dup = rows.find((r) => normalizePhone_(r.phone) === phone && str_(r.id) !== str_(exceptId));
  if (dup) throw new Error('A contact with this phone already exists (' + str_(dup.name) + ')');
}

/* ------------------------------ handlers ------------------------------ */

function getContacts_(p, ctx) {
  const all = readTable_(SHEETS.CONTACTS).rows.map(toContact_);
  const visible = ctx.role === 'admin' ? all : all.filter((c) => c.assignedTo === ctx.volunteerId);
  visible.sort((a, b) => a.name.localeCompare(b.name));
  return decorateContacts_(visible);
}

function getContact_(p, ctx) {
  const table = readTable_(SHEETS.CONTACTS);
  const row = requireContactRow_(table, p.id, ctx);
  return decorateContacts_([toContact_(row)])[0];
}

function addContact_(p) {
  const fields = validateContactFields_(p, false);
  if (fields.assignedTo) requireActiveVolunteer_(fields.assignedTo);

  return withLock_(() => {
    const table = readTable_(SHEETS.CONTACTS);
    assertUniquePhone_(table.rows, fields.phone, null);
    const now = nowIso_();
    const record = Object.assign({ id: Utilities.getUuid() }, fields, { createdAt: now, updatedAt: now });
    appendRecord_(table, record);
    return decorateContacts_([toContact_(record)], {})[0];
  });
}

/**
 * payload: { id, ...fields }
 * Admins may change any editable field. Volunteers may only change sadhana,
 * attendance and notes on their own contacts; other keys are ignored.
 */
function updateContact_(p, ctx) {
  const allowed = ctx.role === 'admin' ? CONTACT_EDITABLE_FIELDS : VOLUNTEER_EDITABLE_FIELDS;
  const input = {};
  allowed.forEach((k) => {
    if (has_(p, k)) input[k] = p[k];
  });
  const fields = validateContactFields_(input, true);
  if (fields.assignedTo) requireActiveVolunteer_(fields.assignedTo);

  return withLock_(() => {
    const table = readTable_(SHEETS.CONTACTS);
    const row = requireContactRow_(table, p.id, ctx);
    if (fields.phone) assertUniquePhone_(table.rows, fields.phone, row.id);
    Object.keys(fields).forEach((k) => (row[k] = fields[k]));
    row.updatedAt = nowIso_();
    updateRecord_(table, row);
    return decorateContacts_([toContact_(row)])[0];
  });
}

/** payload: { id, field, by } — by is +1 (default) or -1 (undo). Never below 0. */
function incrementField_(p, ctx) {
  const field = str_(p.field);
  if (COUNTER_FIELDS.indexOf(field) === -1) throw new Error('This field cannot be incremented');
  const by = p.by === undefined ? 1 : Number(p.by);
  if (by !== 1 && by !== -1) throw new Error('by must be 1 or -1');

  return withLock_(() => {
    const table = readTable_(SHEETS.CONTACTS);
    const row = requireContactRow_(table, p.id, ctx);
    row[field] = Math.max(0, num_(row[field]) + by);
    row.updatedAt = nowIso_();
    updateRecord_(table, row);
    // Plain record (no last-call decoration) keeps this hot path fast; the client merges it.
    return toContact_(row);
  });
}

/** Deletes a contact and its call history. */
function deleteContact_(p) {
  const id = requireId_(p.id, 'Contact id');
  return withLock_(() => {
    const table = readTable_(SHEETS.CONTACTS);
    const row = findById_(table.rows, id);
    if (!row) throw new Error('Contact not found');
    deleteRecord_(table, row);

    const logs = readTable_(SHEETS.CALL_LOGS);
    const keep = logs.rows.filter((l) => str_(l.contactId) !== id);
    if (keep.length !== logs.rows.length) rewriteTable_(logs, keep);
    return { id: id };
  });
}

/** payload: { contactIds: [], volunteerId } — volunteerId "" unassigns. */
function assignContacts_(p) {
  const ids = Array.isArray(p.contactIds) ? p.contactIds.map(String).filter(Boolean) : [];
  if (!ids.length) throw new Error('Select at least one contact');
  if (ids.length > 2000) throw new Error('Too many contacts in one request');

  const volunteerId = str_(p.volunteerId).trim();
  const volunteer = volunteerId ? requireActiveVolunteer_(volunteerId) : null;

  return withLock_(() => {
    const table = readTable_(SHEETS.CONTACTS);
    const wanted = {};
    ids.forEach((id) => (wanted[id] = true));
    const now = nowIso_();
    let updated = 0;
    table.rows.forEach((r) => {
      if (wanted[str_(r.id)]) {
        r.assignedTo = volunteerId;
        r.updatedAt = now;
        updated++;
      }
    });
    if (!updated) throw new Error('No matching contacts found');
    rewriteTable_(table, table.rows); // one batch write
    return {
      updated: updated,
      volunteerId: volunteerId,
      volunteerName: volunteer ? str_(volunteer.name) : null,
    };
  });
}
