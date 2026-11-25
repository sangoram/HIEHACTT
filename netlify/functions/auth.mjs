import crypto from 'node:crypto';
import { CENTERS, store, prefix, adminKey, hashCode, issue, getAuth, centerCodes, deny, sameCode } from '../lib/auth.mjs';

// GET  /api/auth                       → which centers have a team code, whether the admin key is configured
// POST /api/auth { center, code }      → sign in as that center's team
// POST /api/auth { admin: true, code } → sign in as admin
// POST /api/auth { action: 'setCode', center, code }   (admin) → set or change a center's team code
// POST /api/auth { action: 'disable', center }         (admin) → turn a center's sign-in off
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

  if (req.method !== 'POST') {
    return Response.json({
      adminConfigured: adminKey().length >= 8,
      centers: CENTERS.map((c) => ({ center: c, ready: !!codes[c], setAt: codes[c] ? codes[c].setAt : null })),
    }, { headers: { 'cache-control': 'no-store' } });
  }

  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (adminKey().length < 8) return deny(503, 'Sign-in is not set up yet: the site owner must add HACTT_ADMIN_KEY in Netlify.');

  // ---- admin actions ----
  if (body.action) {
    const who = await getAuth(req, context);
    if (!who || who.role !== 'admin') return deny(403, 'admin only');
    const c = String(body.center || '');
    if (!CENTERS.includes(c)) return deny(400, 'unknown center');
    if (body.action === 'setCode') {
      const code = String(body.code || '').trim();
      if (code.length < 6) return deny(400, 'Team codes need at least 6 characters.');
      const salt = crypto.randomBytes(16).toString('hex');
      codes[c] = { salt, hash: hashCode(code, salt), v: ((codes[c] && codes[c].v) || 0) + 1, setAt: Date.now() };
    } else if (body.action === 'disable') {
      delete codes[c];
    } else return deny(400, 'unknown action');
    await store().setJSON(p + 'auth-centers', codes);
    return Response.json({ ok: true, center: c, ready: !!codes[c] });
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
  if (!sameCode(hashCode(code, rec.salt), rec.hash)) { await noteFail(g.s, key, g.rec); return deny(401, 'That code is not right for ' + c + '.'); }
  if (g.rec.n) await g.s.delete(key);
  return Response.json(issue('center', c, rec.v));
};

export const config = { path: '/api/auth' };
