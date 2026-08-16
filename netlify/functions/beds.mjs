import { getStore } from '@netlify/blobs';

// GET /api/beds — full unit snapshot, polled by every device every 5s.
export default async () => {
  const store = getStore('hactt');
  const { blobs } = await store.list({ prefix: 'bed-' });

  const entries = await Promise.all(
    blobs.map(async (b) => {
      const doc = await store.get(b.key, { type: 'json' });
      return [b.key.slice(4), doc];
    })
  );

  const beds = {};
  for (const [id, doc] of entries) if (doc) beds[id] = doc;

  const archive = (await store.get('archive', { type: 'json' })) || [];

  return Response.json(
    { beds, archive, serverTime: Date.now() },
    { headers: { 'cache-control': 'no-store' } }
  );
};

export const config = { path: '/api/beds' };
