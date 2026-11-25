import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

// Shared sign-in helpers for every HACTT function.
// - Each center has one team access code, set by the admin. It is stored only as a salted PBKDF2 hash.
// - The admin key is the Netlify environment variable HACTT_ADMIN_KEY (never stored in the app).
// - A successful sign-in returns a signed token. Center tokens last 14 days; admin tokens 12 hours.
//   Changing a center's code signs everyone at that center out (the token carries the code's version).

// Sites the tool knows about. The admin can add more from the admin console (stored as <prefix>auth-sites).
// A site only becomes usable once the admin sets its team code.
export const DEFAULT_SITES = ['SLN', 'OAK', 'ROS', 'SF', 'SCL', 'WCR', 'LVL2'].map((id) => ({ id, name: '' })).concat([{ id: 'STAN', name: 'Stanford' }]);
export const CENTERS = DEFAULT_SITES.map((s) => s.id);
export async function getSites(context) {
  return (await getStore('hactt').get(prefix(context) + 'auth-sites', { type: 'json' })) || DEFAULT_SITES;
}
export async function centerIds(context) { return (await getSites(context)).map((s) => s.id); }
const CENTER_TTL = 14 * 24 * 3600 * 1000;
const ADMIN_TTL = 12 * 3600 * 1000;

export const store = () => getStore('hactt');

// Deploy previews and branch deploys keep their own records, codes and logs.
export function prefix(context) {
  const ctx = (context && context.deploy && context.deploy.context) || 'production';
  return ctx === 'production' ? '' : ctx + '-';
}

export function adminKey() {
  const k = (globalThis.Netlify && globalThis.Netlify.env && globalThis.Netlify.env.get('HACTT_ADMIN_KEY')) || process.env.HACTT_ADMIN_KEY || '';
  return String(k);
}

const b64 = (s) => Buffer.from(s).toString('base64url');
const signingKey = () => crypto.createHash('sha256').update('hactt-token:' + adminKey()).digest();
const mac = (s) => crypto.createHmac('sha256', signingKey()).update(s).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export function hashCode(code, salt) {
  return crypto.pbkdf2Sync(String(code), salt, 120000, 32, 'sha256').toString('hex');
}

export function makeToken(p) {
  const body = b64(JSON.stringify(p));
  return body + '.' + mac(body);
}

function readToken(t) {
  const [body, sig] = String(t || '').split('.');
  if (!body || !sig || !adminKey() || !same(sig, mac(body))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}

export async function centerCodes(context) {
  return (await store().get(prefix(context) + 'auth-centers', { type: 'json' })) || {};
}

export function issue(role, center, v, lv) {
  const exp = Date.now() + (role === 'admin' ? ADMIN_TTL : CENTER_TTL);
  return { token: makeToken({ r: role, c: center || '', v: v || 0, l: lv || 0, exp }), role, center: center || '', lead: !!lv, exp };
}

// Returns { role: 'admin' } or { role: 'center', center, lead } — or null when signed out, expired or revoked.
// A site lead signs in with the center's lead code: same patients as the team, plus changes to the site list.
export async function getAuth(req, context) {
  const h = req.headers.get('authorization') || '';
  const p = readToken(h.replace(/^Bearer\s+/i, ''));
  if (!p) return null;
  if (p.r === 'admin') return { role: 'admin' };
  if (p.r === 'center' && p.c) {
    const rec = (await centerCodes(context))[p.c];
    if (p.l) { if (!rec || !rec.lead || rec.lead.v !== p.l) return null; return { role: 'center', center: p.c, lead: true }; }
    if (!rec || rec.v !== p.v) return null; // code changed or disabled since this token was issued
    return { role: 'center', center: p.c, lead: false };
  }
  return null;
}

export const deny = (status = 401, msg = 'sign in required') => Response.json({ error: msg }, { status, headers: { 'cache-control': 'no-store' } });
export const sameCode = same;
