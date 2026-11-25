import crypto from 'node:crypto';
import { getSites, store, prefix, adminKey, hashCode, issue, getAuth, centerCodes, deny, sameCode } from '../lib/auth.mjs';
import { loadMaster, loadSite, saveSite, lastSeq } from '../lib/lists.mjs';

// GET  /api/auth                       → which centers have a team code, whether the admin key is configured
// POST /api/auth { center, code }      → sign in as that center's team
// POST /api/auth { admin: true, code } → sign in as admin
// POST /api/auth { action: 'setCode', center, code }   (admin) → set or change a center's team code
// POST /api/auth { action: 'setLead', center, code }   (admin) → set or change a center's site-lead code
// POST /api/auth { action: 'disable', center }         (admin) → turn a center's sign-in off (team and lead)
// POST /api/auth { action: 'disableLead', center }     (admin) → turn off only the site-lead code
// POST /api/auth { action: 'addSite', id, name }       (admin) → add a site (it stays off until its team code is set)
// POST /api/auth { action: 'renameSite', center, name } (admin) → change a site's full name (its code stays the same)
// POST /api/auth { action: 'deleteSite', center }      (admin) → delete a site with no active patients: its codes and
//                                                       site list go; removed-patient records and the change log stay
// The same sign-in box takes either code: the lead code signs in as site lead.
// After 8 wrong codes from one network address within 15 minutes, that address may try only once every
// 30 seconds. Nobody is locked out, and devices already signed in are never affected.

const FREE_TRIES = 8, WINDOW_MS = 15 * 60 * 1000, WAIT_MS = 30 * 1000;

async function failGate(key) {
  const s = store(); const now = Date.now();
  let rec = (await s.get(key, { type: 'json' })) || { n: 0, first: now };
  if (now - (rec.first || 0) > WINDOW_MS) rec = { n: 0, first: now };
  return { s, rec, locked: rec.n >= FREE_TRIES && now - (rec.last || 0) < WAIT_MS };
}
async function noteFail(s, key, rec) {
  await s.setJSON(key, { first: rec.first || Date.now(), n: (rec.n || 0) + 1, last: Date.now() });
}

export default async (req, context) => {
  const p = prefix(context);
  const ip = String((context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'na').replace(/[^0-9a-fA-F:.]/g, '').slice(0, 45);
  const codes = await centerCodes(context);
  const sites = await getSites(context), CENTERS = sites.map((s) => s.id);

  if (req.method !== 'POST') {
    return Response.json({
      adminConfigured: adminKey().length >= 8,
      centers: sites.map(({ id: c, name }) => ({ center: c, name: name || '', ready: !!codes[c], setAt: codes[c] ? codes[c].setAt : null, leadReady: !!(codes[c] && codes[c].lead), leadSetAt: codes[c] && codes[c].lead ? codes[c].lead.setAt : null })),
    }, { headers: { 'cache-control': 'no-store' } });
  }

  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (adminKey().length < 8) return deny(503, 'Sign-in is not set up yet: the site owner must add HACTT_ADMIN_KEY in Netlify.');

  // ---- admin actions ----
  if (body.action) {
    const who = await getAuth(req, context);
    if (!who || who.role !== 'admin') return deny(403, 'admin only');
    if (body.action === 'addSite') {
      const id = String(body.id || '').trim().toUpperCase(), name = String(body.name || '').trim().slice(0, 40);
      if (!/^[A-Z][A-Z0-9]{1,7}$/.test(id)) return deny(400, 'Site codes are 2–8 letters or numbers, starting with a letter (e.g. STAN).');
      if (CENTERS.includes(id)) return deny(400, id + ' already exists.');
      await store().setJSON(p + 'auth-sites', sites.concat([{ id, name, addedAt: Date.now() }]));
      return Response.json({ ok: true, center: id });
    }
    if (body.action === 'renameSite' || body.action === 'deleteSite') {
      const c = String(body.center || '');
      if (!CENTERS.includes(c)) return deny(400, 'unknown site');
      if (body.action === 'renameSite') {
        const name = String(body.name || '').trim().slice(0, 40);
        await store().setJSON(p + 'auth-sites', sites.map((s) => (s.id === c ? { ...s, name } : s)));
        return Response.json({ ok: true, center: c, name });
      }
      const s = store(); const { blobs } = await s.list({ prefix: p + 'bed-' });
      let active = 0;
      for (const b of blobs) { const d = await s.get(b.key, { type: 'json' }); if (d && d.center === c) active++; }
      if (active) return deny(409, c + ' still has ' + active + ' active patient' + (active === 1 ? '' : 's') + '. Open them from the patient list and remove them (or change their center) first.');
      delete codes[c];
      await s.setJSON(p + 'auth-centers', codes);
      await s.delete(p + 'list-site-' + c);
      await s.setJSON(p + 'auth-sites', sites.filter((x) => x.id !== c));
      return Response.json({ ok: true, center: c, deleted: true });
    }
    const c = String(body.center || '');
    if (!CENTERS.includes(c)) return deny(400, 'unknown center');
    const code = String(body.code || '').trim();
    if (body.action === 'setCode') {
      if (code.length < 6) return deny(400, 'Team codes need at least 6 characters.');
      if (codes[c] && codes[c].lead && sameCode(hashCode(code, codes[c].lead.salt), codes[c].lead.hash)) return deny(400, 'Use a different code from the site-lead code.');
      const salt = crypto.randomBytes(16).toString('hex');
      const first = !codes[c];
      codes[c] = { ...(codes[c] || {}), salt, hash: hashCode(code, salt), v: ((codes[c] && codes[c].v) || 0) + 1, setAt: Date.now() };
      if (first) { // a site switched on for the first time starts from the current master list
        const s = await loadSite(context, c);
        if (!s.ops.length && !Object.keys(s.decisions || {}).length) { s.joinedSeq = lastSeq(await loadMaster(context)); await saveSite(context, c, s); }
      }
    } else if (body.action === 'setLead') {
      if (!codes[c]) return deny(400, 'Set the team code first.');
      if (code.length < 8) return deny(400, 'Site-lead codes need at least 8 characters.');
      if (sameCode(hashCode(code, codes[c].salt), codes[c].hash)) return deny(400, 'Use a different code from the team code.');
      const salt = crypto.randomBytes(16).toString('hex');
      codes[c].lead = { salt, hash: hashCode(code, salt), v: ((codes[c].lead && codes[c].lead.v) || 0) + 1, setAt: Date.now() };
    } else if (body.action === 'disable') {
      delete codes[c];
    } else if (body.action === 'disableLead') {
      if (codes[c]) delete codes[c].lead;
    } else return deny(400, 'unknown action');
    await store().setJSON(p + 'auth-centers', codes);
    return Response.json({ ok: true, center: c, ready: !!codes[c], leadReady: !!(codes[c] && codes[c].lead) });
  }

  // ---- sign in ----
  const code = String(body.code || '').trim();
  if (body.admin) {
    const key = p + 'auth-fail-admin-' + ip; const g = await failGate(key);
    if (g.locked) return deny(429, 'Too many wrong keys — wait 30 seconds, then try again.');
    if (!sameCode(code, adminKey())) { await noteFail(g.s, key, g.rec); return deny(401, 'That admin key is not right.'); }
    await g.s.delete(key);
    return Response.json(issue('admin'));
  }
  const c = String(body.center || '');
  if (!CENTERS.includes(c)) return deny(400, 'Choose your center.');
  const rec = codes[c];
  if (!rec) return deny(403, 'Sign-in for ' + c + ' has not been set up yet — ask the admin for a team code.');
  const key = p + 'auth-fail-' + c + '-' + ip; const g = await failGate(key);
  if (g.locked) return deny(429, 'Too many wrong codes — wait 30 seconds, then try again.');
  const isLead = !!(rec.lead && sameCode(hashCode(code, rec.lead.salt), rec.lead.hash));
  if (!isLead && !sameCode(hashCode(code, rec.salt), rec.hash)) { await noteFail(g.s, key, g.rec); return deny(401, 'That code is not right for ' + c + '.'); }
  if (g.rec.n) await g.s.delete(key);
  return Response.json(issue('center', c, rec.v, isLead ? rec.lead.v : 0));
};

export const config = { path: '/api/auth' };
