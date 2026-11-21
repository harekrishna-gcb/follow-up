/**
 * Single JSON endpoint.
 *
 * Request body (sent as text/plain — see the CORS note in Config.gs):
 *   { "action": "getContacts", "token": "...", "payload": { ... } }
 *
 * Response, always:
 *   { "success": true,  "data": ... }
 *   { "success": false, "error": "message" }
 */

/** Route table. public = no token needed; admin = server-side role check. */
function getRoutes_() {
  return {
    // Auth
    login: { public: true, fn: (p) => login_(p) },
    logout: { fn: (p, ctx, token) => logout_(token) },
    me: { fn: (p, ctx) => me_(ctx) },
    changePin: { fn: (p, ctx) => changePin_(p, ctx) },

    // Contacts
    getContacts: { fn: (p, ctx) => getContacts_(p, ctx) },
    getContact: { fn: (p, ctx) => getContact_(p, ctx) },
    addContact: { admin: true, fn: (p, ctx) => addContact_(p, ctx) },
    updateContact: { fn: (p, ctx) => updateContact_(p, ctx) },
    incrementField: { fn: (p, ctx) => incrementField_(p, ctx) },
    deleteContact: { admin: true, fn: (p, ctx) => deleteContact_(p, ctx) },

    // Assignment
    assignContacts: { admin: true, fn: (p, ctx) => assignContacts_(p, ctx) },

    // Calls
    logCall: { fn: (p, ctx) => logCall_(p, ctx) },
    getCallLogs: { fn: (p, ctx) => getCallLogs_(p, ctx) },

    // Dashboard
    getDashboard: { admin: true, fn: (p, ctx) => getDashboard_(p, ctx) },

    // Volunteers
    getVolunteers: { admin: true, fn: (p, ctx) => getVolunteers_(p, ctx) },
    addVolunteer: { admin: true, fn: (p, ctx) => addVolunteer_(p, ctx) },
    updateVolunteer: { admin: true, fn: (p, ctx) => updateVolunteer_(p, ctx) },
  };
}

function doGet() {
  return json_({ success: true, data: 'API running' });
}

function doPost(e) {
  let result;
  let action = '';
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    let body;
    try {
      body = JSON.parse(raw);
    } catch (parseErr) {
      throw new Error('Request body must be valid JSON');
    }

    action = String(body.action || '');
    const route = getRoutes_()[action];
    if (!route) throw new Error('Unknown action: ' + (action || '(none)'));

    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};

    // Every action except login must carry a valid session token.
    // The role comes from the server, never from the request.
    const ctx = route.public ? null : requireSession_(body.token);
    if (route.admin && ctx.role !== 'admin') {
      throw new Error('Only admins can do this');
    }

    result = { success: true, data: route.fn(payload, ctx, body.token) };
  } catch (err) {
    const message = (err && err.message) || String(err);
    console.error('[' + action + '] ' + message);
    result = { success: false, error: message };
  }
  return json_(result);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
