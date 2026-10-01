# HACTT — HIE Acute Care Task Tool

A shared, live-syncing checklist for therapeutic hypothermia in neonatal HIE. The app holds one
active baby at a time. Any device that opens the site sees the same record; birth time, timers,
checklist items, Apgars, blood gases and Sarnat exams sync across devices within about five
seconds.

**No patient identifiers are stored.** A record is clinical data only.

This is a decision-support prototype, not a substitute for clinical judgment.

---

## Deploy

### 1. Push this folder to GitHub

```bash
cd site
git init
git add .
git commit -m "HACTT"
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

Netlify Blobs is enabled automatically on deployed sites. There are no API keys, environment
variables, or database setup steps.

---

## Flow

1. **Admit baby** — the start screen is one large button. Set time of birth (defaults to now)
   and birth weight, then tap the button.
2. **Checklist** — the header shows birth time, weight, Apgars (once you tap **Done** on the
   Apgar table), UVC / UAC / ETT depths, age, and the cooling-window countdown. Entering a cord
   gas ticks "Obtain cord gases"; entering a weight ticks "Enter birth weight".
3. **Reset data** — after confirming, wipes the record on every device and returns to the
   Admit screen.

## How sync works

| | |
|---|---|
| Storage | Netlify Blobs, one JSON blob for the active baby |
| Refresh | every device polls `GET /api/bed/1` every 5 seconds |
| Writes | `POST /api/bed/1` immediately on every edit |
| Conflicts | last write wins |
| Clock | timers anchor to server time, so a device with a wrong clock still shows the right elapsed time |

### Offline

If a device drops off the wifi it keeps working. Edits queue in local storage and push
automatically when the connection returns. The header chip shows the state:

- **Synced** — talking to the server
- **Offline · queued** — edits saved locally, will push on reconnect
- **This device only** — no backend reachable (e.g. opening `index.html` from disk)

Because last write wins, two people editing at the same moment can overwrite each other's most
recent change, and a device that was offline for a long time can overwrite newer work when it
reconnects. A reset on one device clears the record everywhere.

---

## Editing the app

`public/index.html` is a compiled single file generated from `HIE Acute Checklist.dc.html`.
Regenerate and replace it rather than hand-editing.

## A note on scope

The site is public to anyone with the URL and stores no identifiers, which is what keeps it
outside PHI territory. Adding names, MRNs, or an audit trail would need authentication and a
BAA-covered backend. Talk to your institution's privacy office first.
