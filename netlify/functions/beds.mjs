import { getStore } from '@netlify/blobs';

// GET /api/beds — list of active patients (summary fields only), polled by the home screen.
// Records are keyed by deploy context so previews never read production data.
export default async (req, context) => {
  const store = getStore('hactt');
  const ctx = (context && context.deploy && context.deploy.context) || 'production';
  const prefix = (ctx === 'production' ? '' : ctx + '-') + 'bed-';
  const { blobs } = await store.list({ prefix });

  const patients = (await Promise.all(
    blobs.map(async (b) => {
      const doc = await store.get(b.key, { type: 'json' });
      if (!doc) return null;
      return {
        id: b.key.slice(prefix.length),
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
    { patients, serverTime: Date.now() },
    { headers: { 'cache-control': 'no-store' } }
  );
};

export const config = { path: '/api/beds' };
