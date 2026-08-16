import { getStore } from '@netlify/blobs';

// GET  /api/bed/:id — one bed
// POST /api/bed/:id — { doc } writes the bed; { doc: null } frees it. Last write wins.
export default async (req, context) => {
  const store = getStore('hactt');
  const id = String(context.params.id || '').replace(/[^0-9]/g, '');
  if (!id) return new Response('bad bed id', { status: 400 });

  const key = 'bed-' + id;

  if (req.method === 'POST') {
    let body = {};
    try { body = await req.json(); } catch { /* empty body */ }

    if (body.doc) {
      await store.setJSON(key, { ...body.doc, updatedAt: Date.now() });
    } else {
      await store.delete(key);
    }
    return Response.json({ ok: true, serverTime: Date.now() });
  }

  const doc = await store.get(key, { type: 'json' });
  return Response.json(
    { doc, serverTime: Date.now() },
    { headers: { 'cache-control': 'no-store' } }
  );
};

export const config = { path: '/api/bed/:id' };
