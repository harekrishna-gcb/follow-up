/**
 * Volunteer management (admin only). Names must be unique because people log in by name.
 */

function assertUniqueName_(rows, name, exceptId) {
  const lower = name.toLowerCase();
  const dup = rows.find((r) => str_(r.name).trim().toLowerCase() === lower && str_(r.id) !== str_(exceptId));
  if (dup) throw new Error('A volunteer named "' + name + '" already exists');
}

function getVolunteers_() {
  const counts = {};
  readTable_(SHEETS.CONTACTS).rows.forEach((c) => {
    const a = str_(c.assignedTo);
    if (a) counts[a] = (counts[a] || 0) + 1;
  });
  return readTable_(SHEETS.VOLUNTEERS)
    .rows.map((r) => Object.assign(toVolunteer_(r), { assignedCount: counts[str_(r.id)] || 0 }))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
}

/** payload: { name, phone?, role, pin } */
function addVolunteer_(p) {
  const name = requireText_(p.name, 'Name', 60);
  const phone = optPhone_(p.phone, 'Phone');
  const role = requireRole_(p.role || 'volunteer');
  const pin = requirePin_(p.pin, 'PIN');

  return withLock_(() => {
    const table = readTable_(SHEETS.VOLUNTEERS);
    assertUniqueName_(table.rows, name, null);
    const record = { id: Utilities.getUuid(), name: name, phone: phone, pinHash: hashPin_(pin), role: role, active: true };
    appendRecord_(table, record);
    return Object.assign(toVolunteer_(record), { assignedCount: 0 });
  });
}

/** payload: { id, name?, phone?, role?, active?, pin? (reset) } */
function updateVolunteer_(p, ctx) {
  const id = requireId_(p.id, 'Volunteer id');

  return withLock_(() => {
    const table = readTable_(SHEETS.VOLUNTEERS);
    const v = findById_(table.rows, id);
    if (!v) throw new Error('Volunteer not found');

    const wasActiveAdmin = v.role === 'admin' && bool_(v.active);
    let revoke = false;

    if (has_(p, 'name')) {
      const name = requireText_(p.name, 'Name', 60);
      assertUniqueName_(table.rows, name, id);
      v.name = name;
    }
    if (has_(p, 'phone')) v.phone = optPhone_(p.phone, 'Phone');
    if (has_(p, 'role')) v.role = requireRole_(p.role);
    if (has_(p, 'active')) {
      const active = bool_(p.active);
      if (!active && id === ctx.volunteerId) throw new Error('You cannot deactivate yourself');
      if (!active && bool_(v.active)) revoke = true;
      v.active = active;
    }
    if (has_(p, 'pin') && str_(p.pin).trim()) {
      v.pinHash = hashPin_(requirePin_(p.pin, 'PIN'));
      if (id !== ctx.volunteerId) revoke = true; // resetting someone else's PIN signs them out
    }

    // Never leave the app without an active admin.
    const isActiveAdmin = v.role === 'admin' && bool_(v.active);
    if (wasActiveAdmin && !isActiveAdmin) {
      const others = table.rows.filter((r) => str_(r.id) !== id && r.role === 'admin' && bool_(r.active));
      if (!others.length) throw new Error('There must be at least one active admin');
    }

    updateRecord_(table, v);
    if (revoke) revokeSessionsFor_(id);
    return toVolunteer_(v);
  });
}
