/**
 * Admin dashboard. "This week" = the last 7 days (rolling), and
 * "needs follow-up" = no call in the last 7 days (or never called),
 * so calledThisWeek + needsFollowUp = totalContacts.
 */
function getDashboard_() {
  const contacts = readTable_(SHEETS.CONTACTS).rows.map(toContact_);
  const volunteers = readTable_(SHEETS.VOLUNTEERS).rows.map(toVolunteer_);
  const lastCalls = lastCallMap_();
  const names = {};
  volunteers.forEach((v) => (names[v.id] = v.name));

  const weekAgo = Date.now() - FOLLOW_UP_DAYS * DAY_MS;
  const per = {};
  volunteers.forEach((v) => {
    per[v.id] = { id: v.id, name: v.name, role: v.role, active: v.active, assigned: 0, calledThisWeek: 0, pending: 0 };
  });

  let calledThisWeek = 0;
  let unassigned = 0;
  const overdue = [];

  decorateContacts_(contacts, lastCalls, names).forEach((c) => {
    const calledRecently = !!c.lastCallDate && new Date(c.lastCallDate).getTime() >= weekAgo;
    if (calledRecently) calledThisWeek++;
    else overdue.push(c);

    const stats = c.assignedTo ? per[c.assignedTo] : null;
    if (!stats) {
      unassigned++;
    } else {
      stats.assigned++;
      if (calledRecently) stats.calledThisWeek++;
      else stats.pending++;
    }
  });

  // Never-called first, then oldest call first.
  overdue.sort((a, b) => str_(a.lastCallDate).localeCompare(str_(b.lastCallDate)));

  const volunteerStats = Object.keys(per)
    .map((k) => per[k])
    .filter((v) => v.active || v.assigned > 0)
    .sort((a, b) => b.pending - a.pending || a.name.localeCompare(b.name));

  return {
    totals: {
      totalContacts: contacts.length,
      calledThisWeek: calledThisWeek,
      needsFollowUp: overdue.length,
      unassigned: unassigned,
    },
    volunteers: volunteerStats,
    overdue: overdue,
  };
}
