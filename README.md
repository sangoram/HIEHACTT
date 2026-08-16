# HACTT — HIE Acute Care Task Tool (shared unit board)

A shared, live-syncing checklist for therapeutic hypothermia in neonatal HIE. Patients are
anchored to a bed (ICN 1–20). Any device on the site sees the same board; start times, timers,
checklist items, blood gases and notes sync across devices within about five seconds.

**No patient identifiers are stored.** A record is a bed number and clinical data only. Staff
match bed to baby at the cotside.

This is a decision-support prototype, not a substitute for clinical judgment.

---

## Deploy

### 1. Push this folder to GitHub

```bash
cd site
git init
git add .
git commit -m "HACTT unit board"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hactt.git
git push -u origin main
```

### 2. Connect it to Netlify

1. Netlify → **Add new site → Import an existing project** → GitHub → pick the repo.
2. Netlify reads `netlify.toml`, so the build settings should already be filled in:
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
3. **Deploy**.

Netlify Blobs is enabled automatically on deployed sites — there are no API keys, environment
variables, or database setup steps. Storage lives with the site.

### 3. Open it on the unit

Any device that opens the site URL joins the same board. No login.

---

## How sync works

| | |
|---|---|
| Storage | Netlify Blobs, one JSON blob per bed plus one archive blob |
| Refresh | every device polls `GET /api/beds` every 5 seconds |
| Writes | `POST /api/bed/:id` immediately on every edit |
| Conflicts | last write wins, per bed |
| Clock | timers anchor to server time, so a device with a wrong clock still shows the right elapsed time |

### Offline

If a device drops off the wifi it keeps working. Edits queue in local storage and push
automatically when the connection returns. The header chip shows the state:

- **Synced** — talking to the server
- **Offline · queued** — edits saved locally, will push on reconnect
- **This device only** — no backend reachable at all (e.g. opening `index.html` from disk).
  The app is fully usable, it just doesn't share.

Because last write wins, a device that was offline for a long time can overwrite newer work from
another device when it reconnects. For a single unit editing distinct beds this is rarely an
issue, but it is the tradeoff that was chosen for simplicity.

---

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/beds` | whole unit snapshot + archive + server time |
| GET | `/api/bed/:id` | one bed |
| POST | `/api/bed/:id` | `{ doc }` writes a bed, `{ doc: null }` frees it |
| GET | `/api/archive` | completed runs, newest first |
| POST | `/api/archive` | `{ entry }` prepends a completed run |

## Bed lifecycle

Tap an empty bed to admit. Tap **Archive & free bed** when cooling ends or the baby moves — the
run moves to **Completed runs** on the board and the bed returns to empty. The archive holds the
most recent 500 runs and exports to CSV.

## Editing the app

`public/index.html` is a compiled single file. It is generated from the source design component
`HIE Acute Checklist.dc.html`; regenerate and replace it rather than hand-editing.

---

## A note on scope

The site is public to anyone with the URL and stores no identifiers, which is what keeps it
outside PHI territory. If you later want names, MRNs, or an audit trail of who checked what, that
changes the compliance picture and the app needs authentication and a BAA-covered backend before
it goes near real patients. Talk to your institution's privacy office first.
