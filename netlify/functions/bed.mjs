import { store, prefix, getAuth, deny } from '../lib/auth.mjs';

// GET  /api/bed/:id — one patient record
// POST /api/bed/:id — { doc } writes it; { doc: null } removes it from the active list. Last write wins.
// Center teams can only read and write their own center's patients; the admin can reach every record.
// Removed records are kept (key "gone-bed-<id>") so the admin export still has every patient entered.
export default async (req, context) => {
  const who = await getAuth(req, context);
  if (!who) return deny();
  const s = store();
  const id = String(context.params.id || '').replace(/[^0-9]/g, '');
  if (!id) return new Response('bad id', { status: 400 });
  const p = prefix(context), key = p + 'bed-' + id;
  const mine = (doc) => who.role === 'admin' || (doc && doc.center === who.center);

  const cur = await s.get(key, { type: 'json' });
  if (req.method === 'POST') {
    let body = {};
    try { body = await req.json(); } catch { /* empty body */ }
    if (cur && !mine(cur)) return deny(403, 'not your center');
    if (body.doc) {
      if (who.role !== 'admin' && body.doc.center !== who.center) return deny(403, 'records are saved under your own center');
      await s.setJSON(key, { ...body.doc, updatedAt: Date.now() });
    } else if (cur) {
      await s.setJSON(p + 'gone-bed-' + id, { ...cur, removedAt: Date.now() });
      await s.delete(key);
    }
    return Response.json({ ok: true, serverTime: Date.now() });
  }

  return Response.json(
    { doc: cur && mine(cur) ? cur : null, serverTime: Date.now() },
    { headers: { 'cache-control': 'no-store' } }
  );
};

export const config = { path: '/api/bed/:id' };
