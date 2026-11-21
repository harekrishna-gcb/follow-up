/**
 * Run setup() ONCE from the Apps Script editor (select it in the toolbar, press Run).
 * It is safe to run again: it never deletes data.
 *
 *  - Generates a random PIN_SALT in Script Properties if you have not set one.
 *    (Do not change the salt later — every existing PIN would stop working.)
 *  - Creates the four sheets with camelCase headers, adding any missing columns.
 *  - Formats data cells as plain text so phones keep leading digits and
 *    ISO dates are not converted by Sheets.
 *  - Creates a default admin (name "Admin", PIN "1234") if there is no admin yet.
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PIN_SALT')) {
    props.setProperty('PIN_SALT', Utilities.getUuid() + Utilities.getUuid());
    console.log('Generated a random PIN_SALT in Script Properties.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach((name) => {
    const headers = HEADERS[name];
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      console.log('Created sheet ' + name);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      const existing = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0].map(String);
      const missing = headers.filter((h) => existing.indexOf(h) === -1);
      if (missing.length) {
        sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
        console.warn('Added missing columns to ' + name + ': ' + missing.join(', '));
      }
    }

    const width = sheet.getLastColumn();
    sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#FFF7ED');
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, sheet.getMaxRows(), width).setNumberFormat('@');
  });

  // Remove the empty default sheet, if present.
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);

  const volunteers = readTable_(SHEETS.VOLUNTEERS);
  if (!volunteers.rows.some((v) => v.role === 'admin')) {
    appendRecord_(volunteers, {
      id: Utilities.getUuid(),
      name: 'Admin',
      phone: '',
      pinHash: hashPin_('1234'),
      role: 'admin',
      active: true,
    });
    console.warn(
      'Default admin created → name "Admin", PIN "1234". ' +
        'CHANGE THIS PIN right after your first login (Settings → Change PIN).'
    );
  }

  console.log('Setup complete. Now deploy: Deploy → New deployment → Web app.');
}

/**
 * Optional: makes a dated copy of the whole spreadsheet in your Drive.
 * To run it automatically: Triggers (clock icon) → Add Trigger →
 * createBackup → Time-driven → Week timer.
 */
function createBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  const copy = DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + ' — backup ' + stamp);
  console.log('Backup created: ' + copy.getUrl());
}

/** Optional: removes expired sessions. Can be put on a daily trigger. */
function cleanupSessions() {
  withLock_(() => {
    const sessions = readTable_(SHEETS.SESSIONS);
    const now = Date.now();
    const alive = sessions.rows.filter((s) => new Date(s.expiresAt).getTime() > now);
    rewriteTable_(sessions, alive);
    console.log('Removed ' + (sessions.rows.length - alive.length) + ' expired sessions.');
  });
}
