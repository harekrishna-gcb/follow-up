/**
 * Generic sheet <-> object helpers.
 * Reads happen in one batch with getDataRange().getValues();
 * writes use setValues. Each record carries a hidden _row (1-based sheet row).
 */

function getSheet_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" not found. Run setup() first.');
  return sheet;
}

/** Reads a whole sheet into { sheet, headers, rows[] }. Blank rows are skipped. */
function readTable_(name) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  const headers = values.length ? values[0].map(String) : [];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (r.every((v) => v === '' || v === null)) continue;
    const obj = { _row: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) obj[headers[j]] = cellToValue_(r[j]);
    }
    rows.push(obj);
  }
  return { sheet: sheet, headers: headers, rows: rows };
}

/** Dates typed into the Sheet by hand come back as Date objects; normalise to ISO strings. */
function cellToValue_(v) {
  if (v instanceof Date) {
    const tz = Session.getScriptTimeZone();
    const isMidnight = Utilities.formatDate(v, tz, 'HH:mm:ss') === '00:00:00';
    return isMidnight ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : v.toISOString();
  }
  return v;
}

function toRow_(headers, obj) {
  return headers.map((h) => {
    const v = obj[h];
    return v === undefined || v === null ? '' : v;
  });
}

/** Makes sure the sheet has at least `rowNumber` rows (getRange beyond max rows throws). */
function ensureRows_(sheet, rowNumber) {
  const max = sheet.getMaxRows();
  if (rowNumber > max) sheet.insertRowsAfter(max, Math.max(100, rowNumber - max));
}

function appendRecord_(table, obj) {
  const row = toRow_(table.headers, obj);
  const r = table.sheet.getLastRow() + 1;
  ensureRows_(table.sheet, r);
  table.sheet
    .getRange(r, 1, 1, row.length)
    .setNumberFormat('@') // plain text: keeps leading zeros and ISO strings intact
    .setValues([row]);
  obj._row = r;
  table.rows.push(obj);
  return obj;
}

function updateRecord_(table, obj) {
  table.sheet.getRange(obj._row, 1, 1, table.headers.length).setValues([toRow_(table.headers, obj)]);
}

/** Deletes one record. Invalidates _row of later records in the same table object. */
function deleteRecord_(table, obj) {
  table.sheet.deleteRow(obj._row);
}

/** Replaces all data rows (below the header) with `rows` in a single write. */
function rewriteTable_(table, rows) {
  const sheet = table.sheet;
  const width = table.headers.length;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, width).clearContent();
  if (rows.length) {
    ensureRows_(sheet, rows.length + 1);
    sheet
      .getRange(2, 1, rows.length, width)
      .setNumberFormat('@')
      .setValues(rows.map((r) => toRow_(table.headers, r)));
  }
  rows.forEach((r, i) => (r._row = i + 2));
  table.rows = rows;
}

/** Every write runs inside the script lock so concurrent volunteers never clobber each other. */
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('The server is busy. Please try again in a moment.');
  try {
    const result = fn();
    SpreadsheetApp.flush();
    return result;
  } finally {
    lock.releaseLock();
  }
}

function nowIso_() {
  return new Date().toISOString();
}

function findById_(rows, id) {
  const key = String(id || '');
  if (!key) return null;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === key) return rows[i];
  }
  return null;
}
