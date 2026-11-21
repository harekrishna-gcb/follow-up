# Contact Follow-up App

A mobile-first app for a mentor and a team of volunteers. It tracks the people
they're in touch with (chanting rounds, books, attendance) and the follow-up
calls made to them.

```
React PWA (Vercel/Netlify)  ──fetch POST (text/plain)──▶  Apps Script Web App (JSON API)  ──▶  Google Sheet
```

```
folk_app/
├── backend/            Google Apps Script (.gs files) — paste into the Sheet's script editor
└── frontend/           Vite + React 18 + TypeScript + Tailwind + TanStack Query + PWA
    ├── src/api/        client.ts (fetch + CORS notes), one file per domain with hooks, mock.ts (demo backend)
    ├── src/components/ ContactCard, CallButton, WhatsAppButton, CounterButton, BottomNav, BottomSheet, …
    ├── src/context/    AuthContext.tsx
    ├── src/pages/      Login, Home, Profile, ContactFormPage, Dashboard, Volunteers, Settings
    └── src/utils/      phone.ts, date.ts, filters.ts
```

## Try it in 1 minute (demo mode, no Google setup)

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL. On your phone, use the "Network" URL while on the same Wi‑Fi.
`frontend/.env` contains `VITE_API_URL=mock`, which runs a fake backend inside the browser
with sample data. Log in as **Admin / 1234** or volunteer **Ravi / 1111** (also **Arjun / 2222**).

---

## Setup guide (real backend)

### a. Create the Sheet and paste the code
1. Go to <https://sheets.new> and name the spreadsheet, e.g. "Follow-up DB".
2. **Extensions → Apps Script**.
3. Delete the sample `Code.gs` content. For **each** file in `backend/`, click **+ → Script**,
   give it the same name (without `.gs`), and paste the contents:
   `Config`, `Api`, `Db`, `Validation`, `Auth`, `Contacts`, `Calls`, `Dashboard`, `Volunteers`, `Setup`.
   (You can also paste everything into one file. The order of files does not matter.)
4. Click **Save** (💾).

### b. Salt + `setup()`
1. *(Optional)* **Project Settings (⚙) → Script Properties → Add property**:
   `PIN_SALT` = any long random text. If you skip this, `setup()` generates one for you.
   ⚠️ Never change the salt later. If you do, every PIN stops working.
2. Choose `setup` in the function dropdown at the top and press **Run**.
3. Grant permissions: *Review permissions → your account → Advanced → Go to project (unsafe) → Allow*.
   This is your own script, so this warning is expected.
4. The log shows "Default admin created → name "Admin", PIN "1234"". The sheets
   `Contacts`, `Volunteers`, `CallLogs` and `Sessions` now exist.

### c. Deploy as a Web App
1. **Deploy → New deployment →** gear icon **→ Web app**.
2. *Execute as:* **Me**. *Who has access:* **Anyone**. The token system handles security.
3. **Deploy** and copy the **Web app URL** (it ends with `/exec`).
4. Quick check: open the URL in a browser. You should see `{"success":true,"data":"API running"}`.

### d. Configure the React app
```bash
cd frontend
npm install
cp .env.example .env      # then edit .env:
# VITE_API_URL=https://script.google.com/macros/s/XXXX/exec
```

### e. Run locally and test
```bash
npm run dev
```
Log in with **Admin / 1234**, then immediately go to **Settings → Change PIN**.

### f. Deploy the frontend (free)
**Vercel:** push `frontend/` to GitHub → <https://vercel.com/new> → import the repo
(set *Root Directory* to `frontend` if the repo has both folders) → add the environment variable
`VITE_API_URL` → Deploy.

**Netlify:** <https://app.netlify.com/start> → import the repo → base directory `frontend`,
build `npm run build`, publish `frontend/dist` (already set in `netlify.toml`) →
*Site settings → Environment variables →* `VITE_API_URL` → redeploy.

The app uses `HashRouter` and relative asset paths, so it works on any static host without rewrite rules.

### g. ⚠️ Updating the Apps Script later
After you edit the script: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
This keeps the **same URL**. Do *not* use "New deployment", because that creates a new URL and
the app would keep calling the old code.

### h. Install on the phone
- **Android (Chrome):** open the site → ⋮ menu → **Install app** (or use the button in Settings).
- **iPhone (Safari):** Share → **Add to Home Screen**.

---

## How CORS is handled (why requests look unusual)
Apps Script cannot answer CORS preflight (`OPTIONS`) requests. So the frontend sends a
"simple" request:
- `POST` with `Content-Type: text/plain;charset=utf-8`. The body is still JSON text.
- No custom headers. The session token is sent **in the body**: `{ action, token, payload }`.
- `redirect: "follow"`, because Apps Script replies with a 302 to `script.googleusercontent.com`.

These notes also appear as comments in `backend/Config.gs` and `frontend/src/api/client.ts`.

## API
One endpoint, `doPost`. Every response is `{ success: true, data }` or `{ success: false, error }`.

| Area | Actions |
|---|---|
| Auth | `login` (public), `logout`, `me`, `changePin` |
| Contacts | `getContacts`, `getContact`, `addContact`\*, `updateContact`, `incrementField`, `deleteContact`\* |
| Assignment | `assignContacts`\* `{ contactIds, volunteerId }` (`""` = unassign) |
| Calls | `logCall`, `getCallLogs` |
| Dashboard | `getDashboard`\* |
| Volunteers | `getVolunteers`\*, `addVolunteer`\*, `updateVolunteer`\* |

\* admin only, checked on the server. Volunteers only see contacts assigned to them. On those
contacts they can change only chanting, books, the four attendance counters and notes, and log calls.

## Design notes
- **Mobile-first**: content column max 480px (centered on desktop), sticky top bar, bottom tab
  bar, 44px+ tap targets, 16px inputs (stops iOS zoom), safe-area insets for notched phones.
- **One calm accent**: saffron `#F97316` on a light slate background. Each call status has its own color.
- **Feels fast despite a 1–3s backend**: the TanStack Query cache is saved to localStorage, so the app
  opens instantly with the last data. Updates are optimistic for +1 counters, logging calls and
  assignment. The profile shows the list's copy immediately while the full record loads.
- **Calling flow**: tap Call (or the phone icon on any card). When you come back to the app,
  the **Log call** sheet opens automatically. It has one-tap statuses and quick remark chips.
- **Admin bulk assign**: long-press a card (or tap the checklist icon) → select → **Assign to…**.
- Pull-to-refresh, skeleton loaders, helpful empty states, an offline banner, and a toast for every change.

## Testing checklist
- [ ] Health check: opening the `/exec` URL shows "API running".
- [ ] Login works with Admin / 1234. A wrong PIN shows "Incorrect name or PIN". 5 wrong tries locks that name for 15 minutes.
- [ ] Change PIN in Settings, log out, then log in with the new PIN.
- [ ] Add a contact with phone `+91 98765-43210`. It is saved as `9876543210`. Adding the same number again is rejected.
- [ ] Search by name, phone digits, area and PG. Filters for follow-up, rounds and volunteer work. Sort works.
- [ ] Profile: **Call** opens the dialer with `+91…`. **WhatsApp** opens `wa.me/91…`.
- [ ] Attendance +1 updates instantly, and the Sheet shows the new value a few seconds later. −1 never goes below 0.
- [ ] Log call → the entry appears at the top of history, and the card badge shows the new status.
- [ ] Edit a contact (admin: all fields; volunteer: only sadhana/attendance/notes).
- [ ] Add a volunteer, long-press contacts on Home, and assign them to that volunteer.
- [ ] Log in as that volunteer: they see only their contacts. They don't see Dashboard, Volunteers or the Add button.
- [ ] Dashboard totals match. Tapping a volunteer or "Needs follow-up" opens a filtered Home.
- [ ] Deactivating a volunteer signs them out (the next action sends them to Login).
- [ ] Delete a contact (admin). It disappears, and its CallLogs rows are removed.
- [ ] The app can be installed to the home screen and opens full-screen.

## Known limitations
- **Speed:** each Apps Script call takes about 1–3 s (sometimes 5 s after a period of inactivity). Caching and optimistic UI hide most of this.
- **Quotas (free Gmail):** about 20,000 URL calls/day and 6 min per execution. That is plenty for a small team.
  Simultaneous use is limited to about 30 concurrent executions, and writes are serialised by `LockService`.
- **Scale:** every request reads whole sheets. This is comfortable up to a few thousand contacts and
  ~20k call logs. Beyond that, archive old CallLogs or move to a real database.
- **Security:** 4-digit PINs with salted SHA-256, lockout after 5 tries, and 7-day sessions. Fine for
  this use, but not bank-grade. Anyone with edit access to the Sheet can see all data, so share the Sheet carefully.
- **Offline:** cached data can be viewed offline, but changes need a connection.

## Backups
- **Manual:** *File → Make a copy* or *File → Download → .xlsx*. Sheets also keeps *Version history*.
- **Automatic:** in Apps Script, **Triggers (⏰) → Add Trigger →** `createBackup` → *Time-driven* →
  *Week timer*. Each run saves a dated copy of the spreadsheet to your Drive.
- Optional: add a daily trigger for `cleanupSessions` to remove expired sessions.
