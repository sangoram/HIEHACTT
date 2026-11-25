import BASE from './base-list.mjs';
import { store, prefix, CENTERS, centerCodes } from './auth.mjs';

// Three layers of checklist content:
//   master list  = the built-in list + every published admin update sent to all sites
//   site list    = the built-in list + the updates sent to that site that it accepted (required ones always apply)
//                  + the site's own changes, made by its site lead
//   baby's list  = a snapshot of the site list taken at admission, plus that baby's own edits (stored on the record)
// Every change is an "op" on cards and items, so changes can be reviewed, accepted, rejected or undone one by one.
// Storage: <prefix>list-master { draft:[op], updates:[{id,seq,at,note,required,targets,ops}] }
//          <prefix>list-site-<C> { ops:[op], decisions:{ updateId: { opIndex: 'a'|'r' } }, joinedSeq }

export const OPS = ['add_item', 'edit_item', 'remove_item', 'add_card', 'rename_card', 'remove_card'];
const clone = (x) => JSON.parse(JSON.stringify(x));
const clip = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
const newId = (p) => p + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);

export async function loadMaster(context) {
  return (await store().get(prefix(context) + 'list-master', { type: 'json' })) || { draft: [], updates: [] };
}
export const saveMaster = (context, m) => store().setJSON(prefix(context) + 'list-master', m);
export async function loadSite(context, c) {
  return (await store().get(prefix(context) + 'list-site-' + c, { type: 'json' })) || { ops: [], decisions: {}, joinedSeq: 0 };
}
export const saveSite = (context, c, s) => store().setJSON(prefix(context) + 'list-site-' + c, s);
export const lastSeq = (m) => (m.updates || []).reduce((a, u) => Math.max(a, u.seq || 0), 0);

// Turn a client-supplied op into a safe one; returns null if it is not usable.
export function cleanOp(o, idPrefix) {
  if (!o || !OPS.includes(o.t)) return null;
  const op = { t: o.t };
  const id = (v) => clip(v, 40).replace(/[^A-Za-z0-9_-]/g, '');
  if (o.t === 'add_item') { op.card = id(o.card); op.id = id(o.id) || newId(idPrefix + 'i'); op.label = clip(o.label, 300); op.critical = !!o.critical; if (!op.card || !op.label) return null; }
  if (o.t === 'edit_item') { op.id = id(o.id); if (o.label != null) op.label = clip(o.label, 300); if (o.critical != null) op.critical = !!o.critical; if (!op.id || (op.label == null && op.critical == null) || op.label === '') return null; }
  if (o.t === 'remove_item' || o.t === 'remove_card') { op.id = id(o.id); if (!op.id) return null; }
  if (o.t === 'add_card') { op.id = id(o.id) || newId(idPrefix + 'c'); op.title = clip(o.title, 80); op.window = clip(o.window, 40); if (!op.title) return null; }
  if (o.t === 'rename_card') { op.id = id(o.id); op.title = clip(o.title, 80); if (!op.id || !op.title) return null; }
  return op;
}

function findItem(list, id) {
  for (const s of list) { const i = (s.items || []).findIndex((x) => x.id === id); if (i >= 0) return { s, i, it: s.items[i] }; }
  return null;
}

// Plain-language description of an op, read against the list it is about to change.
export function describe(list, op) {
  const card = (cid) => { const s = list.find((x) => x.id === cid); return s ? s.title : 'a removed card'; };
  const item = (iid) => { const f = findItem(list, iid); return f ? { label: f.it.label, card: f.s.title, critical: !!f.it.critical } : null; };
  const q = (s) => '“' + s + '”';
  switch (op.t) {
    case 'add_item': return 'Add ' + q(op.label) + (op.critical ? ' (time-critical)' : '') + ' to ' + card(op.card);
    case 'edit_item': { const f = item(op.id); const parts = [];
      if (op.label != null) parts.push('Reword ' + (f ? q(f.label) : 'an item') + ' → ' + q(op.label));
      if (op.critical != null) parts.push((op.critical ? 'Flag ' : 'Unflag ') + (op.label == null && f ? q(f.label) + ' ' : '') + 'as time-critical');
      return parts.join(' · ') + (f ? ' (' + f.card + ')' : ''); }
    case 'remove_item': { const f = item(op.id); return 'Remove ' + (f ? q(f.label) + ' from ' + f.card : 'an item that is no longer on the list'); }
    case 'add_card': return 'Add a card ' + q(op.title);
    case 'rename_card': return 'Rename card ' + q(card(op.id)) + ' → ' + q(op.title);
    case 'remove_card': return 'Remove the card ' + q(card(op.id)) + ' and its items';
  }
  return op.t;
}

// Apply one op in place. src marks where an added or edited item came from ('master' or 'site') for display.
export function applyOp(list, op, src) {
  switch (op.t) {
    case 'add_item': { const s = list.find((x) => x.id === op.card); if (!s || findItem(list, op.id)) return false; s.items.push({ id: op.id, label: op.label, critical: !!op.critical, src }); return true; }
    case 'edit_item': { const f = findItem(list, op.id); if (!f) return false; if (op.label != null) f.it.label = op.label; if (op.critical != null) f.it.critical = !!op.critical; f.it.ed = src; return true; }
    case 'remove_item': { const f = findItem(list, op.id); if (!f) return false; f.s.items.splice(f.i, 1); return true; }
    case 'add_card': if (list.some((x) => x.id === op.id)) return false; list.push({ id: op.id, title: op.title, window: op.window || '', items: [], src }); return true;
    case 'rename_card': { const s = list.find((x) => x.id === op.id); if (!s) return false; s.title = op.title; s.ed = src; return true; }
    case 'remove_card': { const i = list.findIndex((x) => x.id === op.id); if (i < 0) return false; list.splice(i, 1); return true; }
  }
  return false;
}
const renumber = (list) => { list.forEach((s, i) => { s.n = i + 1; }); return list; };
const targets = (u, c) => u.targets === 'all' || (Array.isArray(u.targets) && u.targets.includes(c));

// Master list: built-in list + updates sent to all sites (+ the admin's unpublished draft, described).
export function masterView(m) {
  const list = clone(BASE);
  (m.updates || []).slice().sort((a, b) => a.seq - b.seq).forEach((u) => { if (u.targets === 'all') u.ops.forEach((op) => applyOp(list, op, 'master')); });
  const published = clone(renumber(list));
  const draft = (m.draft || []).map((op, i) => { const text = describe(list, op); applyOp(list, op, 'draft'); return { i, text }; });
  return { published, preview: renumber(list), draft };
}

// One site's list, with the updates it has received and the status of every change in them.
export function siteView(m, site, c) {
  const list = clone(BASE), updates = []; let pending = 0;
  (m.updates || []).slice().sort((a, b) => a.seq - b.seq).forEach((u) => {
    if (!targets(u, c)) return;
    const auto = u.required || u.seq <= (site.joinedSeq || 0);
    const dec = (site.decisions || {})[u.id] || {};
    const changes = u.ops.map((op, i) => {
      const text = describe(list, op);
      const status = u.required ? 'required' : (u.seq <= (site.joinedSeq || 0) ? 'included' : (dec[i] === 'a' ? 'accepted' : (dec[i] === 'r' ? 'rejected' : 'pending')));
      if (status !== 'rejected' && status !== 'pending') applyOp(list, op, 'master');
      if (status === 'pending') pending++;
      return { i, text, status };
    });
    updates.push({ id: u.id, seq: u.seq, at: u.at, note: u.note, required: !!u.required, auto, changes });
  });
  const own = (site.ops || []).map((op, i) => { const text = describe(list, op); const ok = applyOp(list, op, 'site'); return { i, text, ok, at: op.at }; });
  return { center: c, sections: renumber(list), updates: updates.reverse(), pending, own };
}

// Per-site status of each published update, for the admin console.
export async function statusBoard(context, m) {
  const sites = {}, codes = await centerCodes(context);
  for (const c of CENTERS) sites[c] = await loadSite(context, c);
  return (m.updates || []).slice().sort((a, b) => b.seq - a.seq).map((u) => ({
    id: u.id, seq: u.seq, at: u.at, note: u.note, required: !!u.required, targets: u.targets, count: u.ops.length,
    sites: CENTERS.filter((c) => targets(u, c)).map((c) => {
      const s = sites[c]; const dec = (s.decisions || {})[u.id] || {};
      if (!codes[c]) return { center: c, state: 'off' };
      if (u.required) return { center: c, state: 'required' };
      if (u.seq <= (s.joinedSeq || 0)) return { center: c, state: 'included' };
      const vals = u.ops.map((_, i) => dec[i]); const a = vals.filter((v) => v === 'a').length, r = vals.filter((v) => v === 'r').length;
      return { center: c, state: a + r < u.ops.length ? 'pending' : (r === 0 ? 'accepted' : (a === 0 ? 'rejected' : 'mixed')), accepted: a, rejected: r, total: u.ops.length };
    }),
  }));
}

// Write list changes into the same change log the app uses (admin-readable at /list-changes.html).
export async function logChanges(context, entries) {
  if (!entries.length) return;
  const at = Date.now();
  await store().setJSON(prefix(context) + 'edit-' + at + '-' + Math.random().toString(36).slice(2, 8), {
    at, entries: entries.map((e) => ({ at, t: at, ageH: 0, w: 0, cardStd: true, itemStd: true, itemId: '', cardId: '', rec: '', build: 'lists', host: '', ...e })),
  });
}
