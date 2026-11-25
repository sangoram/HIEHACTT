# HIE-NeuroSafe (formerly HACTT, HIE Acute Care Task Tool)

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

## Checklists: master, site and baby (Nov 2026)

- **Master list (admin)** — `/admin.html` → *Master list & updates*. Edit the checklist, then *Publish update* with a
  short note, sent to all sites (it then becomes part of the master list) or to chosen sites. Tick **Required** for
  safety corrections: they apply at once and cannot be rejected. The board shows each site's response.
- **Site list (site lead)** — `/site.html`. Each center has a **site-lead code** (set in the admin console; it signs in
  like the team code). The lead reviews admin updates change by change (Accept / Reject), edits the site's own list,
  and can undo any site change. Team members can view the site list but not change it. A lead (or the admin) can
  also use *Save to <site> site list* on a baby's edited card to make those edits the site standard.
- **Baby's list** — each new admission takes a snapshot of its site's list; per-baby edits work as before. Babies
  already in the tool keep the list they started with, so items never shift mid-case.
- A site switched on for the first time starts from the current master list. All list changes go to the change log.
- **App updates** — changes to the app itself (qualification logic, views, features) reach every site once merged.
  Open screens notice a new version within a minute, show a 30-second notice, and reload (waiting if someone is
  typing); patient data is on the server, so nothing is lost.

## Sign-in (Nov 2026)

- **Center team codes** — the app opens on a sign-in screen. Each center (SLN, OAK, ROS, SF, SCL, WCR, LVL2, STAN · Stanford, plus any the admin adds) has
  one code shared by its whole team; a team sees only its own center's patients and can only save patients under
  its own center. Sign-in lasts 14 days on a device; *Sign out* clears that device's copy of the data.
- **Admin** — signs in with the admin key, sees and edits every center's patients, and uses `/admin.html` to set,
  change or turn off each center's code (changing a code signs that center out) and to download all data:
  every record as JSON, a one-row-per-patient CSV, and the list-change log. Patients a team removes are kept for
  the admin export (`gone-bed-<id>`). The list-change log (`/list-changes.html`) is admin only.
- **Setup (required before anyone can sign in):** Netlify → Site configuration → Environment variables → add
  `HACTT_ADMIN_KEY` (8+ characters, keep it private; it applies to production and previews), then redeploy.
  Sign in at `/admin.html` with it and set a code for each center.
- **How it's protected:** codes are stored only as salted PBKDF2 hashes; the server checks every request, so one
  center cannot read or overwrite another's records. After 8 wrong codes in 15 minutes, a network address may try
  only once every 30 seconds. Signed tokens last 14 days (team) or 12 hours (admin). Changing `HACTT_ADMIN_KEY`
  signs everyone out.
- **Still a prototype:** a shared team code is not individual accounts, there is no per-person audit trail, and
  center + birth time count as identifiers. Review with your privacy office before real clinical use.
- Handoff summary is now set in Arial. Every page carries "Copyright © 2026 Ashvin Sangoram. All rights reserved."

## What's new in demo-v3 (Nov 2026)

- **Layout** — the first-hours timeline now sits at the bottom of the header (Hide / Show folds it away). Blood-gas
  entry and modified Sarnat scoring are two cards side by side directly under the header, followed by the cooling
  decision, Do next, and the checklist cards. Card 2 · Step 3 shows the latest Sarnat result and links up to the card.
- **Lists are editable per baby** — every card has an *Add a to-do* box and an *Edit list* button: reword an item,
  flag it time-critical, remove it (standard items can be restored; added ones are deleted), or restore the standard
  list. *Add a card* at the bottom creates a new card for this baby. Edits are stored on that baby's record
  (`custom`), sync to every device viewing the baby, appear in the handoff summary, and never touch the standard
  list — the next admission starts clean. Edited cards and items are labelled.
- **List-change log** — each edit is posted to `/api/edits` (queued on the device while offline). View it at
  `/list-changes.html`: counts, the most frequent changes, the full log, and a CSV download
  (`/api/edits?format=csv`). Entries hold center, age in hours, a short record tag and the item text — no names,
  MRNs or birth times. Reading the log needs the admin sign-in.
- The header is sticky only on wide, tall windows (over 760 px wide and 900 px tall); otherwise it scrolls with the page.

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
| Storage | Netlify Blobs, one JSON blob per active patient (plus kept copies of removed ones, admin only) |
| Refresh | every signed-in device polls `GET /api/bed/<id>` every 5 seconds |
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

`public/index.html` is a compiled single-file bundle. The app's markup and logic live as a JSON string inside
`<script type="__bundler/template">`: unpack it, edit, and re-encode (`json.dumps(..., ensure_ascii=False)` with
`</` written as `<\u002F`) rather than hand-editing the file.

## A note on scope

The site needs a center team code or the admin key, and stores no names or MRNs. It is still not a
PHI-grade system: shared team codes, no per-person audit trail, and center + birth time are identifiers under
HIPAA Safe Harbor. Adding names or MRNs would need individual accounts and a BAA-covered backend. Talk to your
institution's privacy office first.