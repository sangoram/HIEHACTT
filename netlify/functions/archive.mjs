import { getStore } from '@netlify/blobs';

// GET  /api/archive — completed runs, newest first
// POST /api/archive — { entry } prepended to the archive
export default async (req) => {
  const store = getStore('hactt');
  const current = (await store.get('archive', { type: 'json' })) || [];

  if (req.method === 'POST') {
    let body = {};
    try { body = await req.json(); } catch { /* empty body */ }
    if (!body.entry) return new Response('missing entry', { status: 400 });

    // Cap the archive so the blob stays small; export CSV for long-term records.
    const next = [body.entry, ...current].slice(0, 500);
    await store.setJSON('archive', next);
    return Response.json({ ok: true, count: next.length });
  }

  return Response.json(
    { archive: current, serverTime: Date.now() },
    { headers: { 'cache-control': 'no-store' } }
  );
};

export const config = { path: '/api/archive' };
