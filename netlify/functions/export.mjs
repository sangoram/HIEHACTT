import { store, prefix, getAuth, deny } from '../lib/auth.mjs';

// GET /api/export              (admin) → every patient record, active and removed, as JSON
// GET /api/export?format=csv   (admin) → one summary row per patient
export default async (req, context) => {
  const who = await getAuth(req, context);
  if (!who || who.role !== 'admin') return deny(403, 'admin only');
  const s = store(), p = prefix(context);
  const read = async (pre, status) => {
    const { blobs } = await s.list({ prefix: p + pre });
    return (await Promise.all(blobs.map(async (b) => {
      const doc = await s.get(b.key, { type: 'json' });
      return doc ? { id: b.key.slice((p + pre).length), status, ...doc } : null;
    }))).filter(Boolean);
  };
  const records = (await read('bed-', 'active')).concat(await read('gone-bed-', 'removed'))
    .sort((a, b) => (b.birth || 0) - (a.birth || 0));

  const url = new URL(req.url);
  if (url.searchParams.get('format') === 'csv') {
    const iso = (t) => (t ? new Date(t).toISOString() : '');
    const gasTxt = (g) => (g && g.t ? ['ph ' + (g.ph || ''), 'pco2 ' + (g.pco2 || ''), 'be ' + (g.bd || '')].join(' ') : '');
    const cols = [
      ['record', (r) => r.id], ['status', (r) => r.status], ['center', (r) => r.center], ['birth', (r) => iso(r.birth)],
      ['ga', (r) => (r.ga && r.ga.w ? r.ga.w + '+' + (r.ga.d || 0) : '')], ['bw_kg', (r) => r.bw],
      ['verdict', (r) => (r.summary && r.summary.verdict) || ''], ['worst_gas', (r) => (r.summary && r.summary.worst) || ''],
      ['latest_sarnat', (r) => (r.summary && r.summary.sarnat != null ? r.summary.sarnat : '')],
      ['sarnat_series', (r) => (r.sarnatLog || []).map((l) => l.score + '@' + l.hol + 'h').join(' ')],
      ['cord_art', (r) => gasTxt(r.cordArt)], ['cord_ven', (r) => gasTxt(r.cordVen)],
      ['baby_gases', (r) => (r.babyGases || []).map((g) => (g.time || '') + ' ' + gasTxt(g)).join(' | ')],
      ['tasks_checked', (r) => Object.keys(r.checked || {}).length],
      ['list_edits', (r) => { const c = r.custom || {}; return (c.add || []).length + Object.keys(c.mod || {}).length + Object.keys(c.hide || {}).length + (c.secs || []).length; }],
      ['updated', (r) => iso(r.updatedAt)], ['removed', (r) => iso(r.removedAt)],
    ];
    const cell = (v) => { let x = v == null ? '' : String(v); if (/^[=+\-@]/.test(x)) x = "'" + x; return '"' + x.replace(/"/g, '""') + '"'; };
    const rows = [cols.map((c) => cell(c[0])).join(',')].concat(records.map((r) => cols.map((c) => cell(c[1](r))).join(',')));
    return new Response('﻿' + rows.join('\r\n') + '\r\n', { headers: {
      'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="hactt-patients.csv"', 'cache-control': 'no-store' } });
  }
  return Response.json({ exportedAt: Date.now(), count: records.length, records }, { headers: { 'cache-control': 'no-store' } });
};

export const config = { path: '/api/export' };
