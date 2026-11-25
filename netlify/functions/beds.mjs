import { store, prefix, getAuth, deny } from '../lib/auth.mjs';

// GET /api/beds — active patients (summary fields only), polled by the home screen.
// A center team sees its own center's patients; the admin sees every center.
export default async (req, context) => {
  const who = await getAuth(req, context);
  if (!who) return deny();
  const s = store();
  const pre = prefix(context) + 'bed-';
  const { blobs } = await s.list({ prefix: pre });

  const patients = (await Promise.all(
    blobs.map(async (b) => {
      const doc = await s.get(b.key, { type: 'json' });
      if (!doc) return null;
      if (who.role !== 'admin' && doc.center !== who.center) return null;
      return {
        id: b.key.slice(pre.length),
        center: doc.center || '',
        birth: doc.birth || null,
        ga: doc.ga || null,
        bw: doc.bw || '',
        updatedAt: doc.updatedAt || null,
        summary: doc.summary || null,
      };
    })
  )).filter(Boolean);

  return Response.json(
    { patients, role: who.role, center: who.center || '', serverTime: Date.now() },
    { headers: { 'cache-control': 'no-store' } }
  );
};

export const config = { path: '/api/beds' };
