# HACTT — HIE Acute Care Task Tool

A shared, live-syncing checklist for therapeutic hypothermia in neonatal HIE. The app holds any number of
active babies, each identified only by center of birth and date/time of birth. Any device that opens the site sees the same record; birth time, timers,
checklist items, Apgars, blood gases and Sarnat exams sync across devices within about five
seconds.

**No names or MRNs are stored.** Each record carries center of birth and date/time of birth, which are
identifiers under HIPAA Safe Harbor — review with your privacy office, and consider an access code.

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

## What's new in demo-v2 (Oct 2026)

- **Cooling decision · live** — a summary card that combines entry criteria, physiologic criterion (A / B+D / C+D)
  and the latest Sarnat exam into one verdict, with Entry / Physiology / Neuro status pills.
- **Do next** — overdue timers first, then missing decision data, then the next time-critical tasks, each with a
  one-tap Done or Go.
- **First-hours timeline** — birth → now → 6-h cooling window, with completed tasks, gases and Sarnat exams plotted
  (first hour expanded so 10- and 30-minute deadlines are readable).
- **Transport handoff summary** — one tap builds a copy-ready note: birth data, Apgars, eligibility with criteria,
  all gases, Sarnat series in prose, key times, completed and outstanding tasks.
- **Header edits save on Enter / Save** — birth time, weight and GA can be corrected without half-typed values
  syncing; weight accepts kg (3.45) or grams (3450); GA accepts 39+2, 39 2/7, 39w2d, 39.2 or 39.
- **Gas form** — pick Cord arterial / Cord venous / Baby gas, enter pH, pCO₂, BE, then Save. Nothing reaches the
  verdict until saved; saved gases list with Edit / ✕; out-of-range values are blocked. pO₂ removed.
- **Active patients** — the home screen lists every active baby, grouped by center of birth
  (SLN, OAK, ROS, SF, SCL, WCR, LVL2) and sorted by date/time of birth. Admitting requires choosing a center;
  the header shows ← Patients, a center selector and Remove patient (type RESET to confirm).
- **Modified Sarnat evaluations** — renamed throughout; each logged evaluation can be edited (findings and time
  performed) or deleted; logging uses a Time performed field and shows hour of life.
- **Feedback** — a Feedback button (header and admit screen) posts comments to a Netlify Form named
  `feedback`; set an email notification for that form in Netlify to receive them. If posting fails, the box offers a
  pre-filled email instead.
- **Sarnat trend** — header and handoff show the exam series (e.g. 5 → 2, improving); cord gas appears on the timeline.
- **Preview isolation** — deploy previews and branch deploys store their record separately from production.
- **Safety** — no more prefilled example gases (old records are cleaned on load); 35 0/7–35 6/7 wk shows
  "discuss with family / cooling center" instead of ineligible; duplicate placenta item removed; Reset now requires
  typing RESET.

## Flow

1. **Admit baby** — the start screen is one large button. Set time of birth (defaults to now)
   and birth weight, then tap the button.
2. **Checklist** — the header shows birth time, weight, Apgars (once you tap **Done** on the
   Apgar table), UVC / UAC / ETT depths, age, and the cooling-window countdown. Entering a cord
   gas ticks "Obtain cord gases"; entering a weight ticks "Enter birth weight".
3. **Reset data** — after typing RESET to confirm, wipes the record on every device and returns to the
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
