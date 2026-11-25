import { store as getS, prefix as pfx, getAuth, deny } from '../lib/auth.mjs';

// POST /api/edits — { entries: [...] } appends list-change entries from the app.
//                   Each batch is its own blob, so two devices logging at once never overwrite each other.
// GET  /api/edits — every entry, newest first (admin only). Add ?format=csv to download a spreadsheet.
// Posting needs any signed-in team; a center team's entries are always filed under its own center.
//
// Entries describe edits people make to a baby's copy of the checklist (add / reword / remove / restore).
// They carry no names, MRNs or birth times: only center, age in hours, a short record tag and the text of the item.

const TEXT = ['action', 'cardId', 'card', 'itemId', 'from', 'to', 'center', 'rec', 'build', 'host'];
const COLUMNS = [
  ['time', (e) => new Date(e.t || e.at).toISOString()],
  ['action', (e) => e.action],
  ['center', (e) => e.center],
  ['age_hours', (e) => e.ageH],
  ['card', (e) => e.card],
  ['card_is_standard', (e) => (e.cardStd ? 'yes' : 'no')],
  ['item_is_standard', (e) => (e.itemId ? (e.itemStd ? 'yes' : 'no') : '')],
  ['from', (e) => e.from],
  ['to', (e) => e.to],
  ['item_id', (e) => e.itemId],
  ['card_id', (e) => e.cardId],
  ['record', (e) => e.rec],
  ['build', (e) => e.build],
  ['host', (e) => e.host],
  ['screen_width', (e) => e.w],
];

const clip = (v, n) => String(v == null ? '' : v).slice(0, n);

function clean(e, at) {
  const o = { at, t: Number(e.t) || at, ageH: Number(e.ageH) || 0, w: Number(e.w) || 0, cardStd: !!e.cardStd, itemStd: !!e.itemStd };
  TEXT.forEach((k) => { o[k] = clip(e[k], k === 'from' || k === 'to' ? 600 : 120); });
  return o;
}

// Quote for CSV, and stop a cell that starts with = + - @ from running as a spreadsheet formula.
function cell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export default async (req, context) => {
  const who = await getAuth(req, context);
  if (!who) return deny();
  const store = getS();
  // Keep deploy previews and branch deploys out of the production log.
  const prefix = pfx(context) + 'edit-';

  if (req.method === 'POST') {
    let body = {};
    try { body = await req.json(); } catch { /* empty body */ }
    const list = Array.isArray(body.entries) ? body.entries.slice(0, 50) : [];
    const at = Date.now();
    const entries = list.filter((e) => e && typeof e === 'object' && e.action).map((e) => clean(who.role === 'center' ? { ...e, center: who.center } : e, at));
    if (!entries.length) return new Response('no entries', { status: 400 });
    const key = prefix + at + '-' + Math.random().toString(36).slice(2, 8);
    await store.setJSON(key, { at, entries });
    return Response.json({ ok: true, saved: entries.length, serverTime: at });
  }

  const url = new URL(req.url);
  if (who.role !== 'admin') return deny(403, 'admin only');

  const { blobs } = await store.list({ prefix });
  const batches = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
  const entries = batches.filter(Boolean).flatMap((b) => b.entries || []).sort((a, b) => (b.t || 0) - (a.t || 0));

  if (url.searchParams.get('format') === 'csv') {
    const rows = [COLUMNS.map((c) => cell(c[0])).join(',')].concat(entries.map((e) => COLUMNS.map((c) => cell(c[1](e))).join(',')));
    return new Response('﻿' + rows.join('\r\n') + '\r\n', {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="hactt-list-changes.csv"',
        'cache-control': 'no-store',
      },
    });
  }

  return Response.json({ entries, count: entries.length, serverTime: Date.now() }, { headers: { 'cache-control': 'no-store' } });
};

export const config = { path: '/api/edits' };
