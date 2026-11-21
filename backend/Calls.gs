/**
 * Call logs: who called whom, when, and how it went.
 */

/** payload: { contactId, status, remarks?, callDate? (ISO, defaults to now) } */
function logCall_(p, ctx) {
  const contactId = requireId_(p.contactId, 'Contact id');
  const status = str_(p.status).trim();
  if (CALL_STATUSES.indexOf(status) === -1) throw new Error('Invalid call status');
  const remarks = optText_(p.remarks, 'Remarks', 1000);

  let callDate = nowIso_();
  if (p.callDate) {
    const d = new Date(p.callDate);
    if (isNaN(d.getTime())) throw new Error('Invalid call date');
    if (d.getTime() > Date.now() + 5 * 60 * 1000) throw new Error('Call date cannot be in the future');
    callDate = d.toISOString();
  }

  // Access check: volunteers may only log calls for their own contacts.
  requireContactRow_(readTable_(SHEETS.CONTACTS), contactId, ctx);

  return withLock_(() => {
    const table = readTable_(SHEETS.CALL_LOGS);
    const log = {
      id: Utilities.getUuid(),
      contactId: contactId,
      volunteerId: ctx.volunteerId,
      callDate: callDate,
      status: status,
      remarks: remarks,
    };
    appendRecord_(table, log);
    return Object.assign(toCallLog_(log), { volunteerName: ctx.name });
  });
}

/** payload: { contactId } — newest first. */
function getCallLogs_(p, ctx) {
  const contactId = requireId_(p.contactId, 'Contact id');
  requireContactRow_(readTable_(SHEETS.CONTACTS), contactId, ctx);

  const names = volunteerNameMap_();
  return readTable_(SHEETS.CALL_LOGS)
    .rows.filter((r) => str_(r.contactId) === contactId)
    .map((r) => Object.assign(toCallLog_(r), { volunteerName: names[str_(r.volunteerId)] || 'Unknown' }))
    .sort((a, b) => (a.callDate < b.callDate ? 1 : a.callDate > b.callDate ? -1 : 0));
}
