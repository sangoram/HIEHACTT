import { CENTERS, getAuth, deny } from '../lib/auth.mjs';
import { loadMaster, saveMaster, loadSite, saveSite, lastSeq, cleanOp, masterView, siteView, statusBoard, logChanges } from '../lib/lists.mjs';

// GET  /api/lists?center=C   → that site's list, the admin updates it received (with each change's status), its own changes
// GET  /api/lists            (admin) → master list, unpublished draft, published updates with every site's status
// POST /api/lists { action, ... }
//   siteOps   { center, ops }               site lead or admin — change the site's own list
//   siteUndo  { center, index }             site lead or admin — undo one of the site's own changes
//   decide    { center, updateId, i|'all', decision:'a'|'r' }   site lead or admin — accept or reject (not for required updates)
//   draftOps  { ops } · draftUndo { index } · draftClear       admin — edit the master list before publishing
//   publish   { note, required, targets:'all'|[centers] }       admin — send the draft out as an update
export default async (req, context) => {
  const who = await getAuth(req, context);
  if (!who) return deny();
  const isAdmin = who.role === 'admin';
  const url = new URL(req.url);
  const m = await loadMaster(context);
  const headers = { 'cache-control': 'no-store' };

  if (req.method !== 'POST') {
    const c = isAdmin ? url.searchParams.get('center') : who.center;
    if (!c) return Response.json({ master: masterView(m), updates: await statusBoard(context, m), lastSeq: lastSeq(m) }, { headers });
    if (!CENTERS.includes(c)) return deny(400, 'unknown center');
    return Response.json({ ...siteView(m, await loadSite(context, c), c), canEdit: isAdmin || !!who.lead }, { headers });
  }

  let b = {};
  try { b = await req.json(); } catch { /* empty */ }
  const act = String(b.action || '');

  if (['siteOps', 'siteUndo', 'decide'].includes(act)) {
    const c = isAdmin ? String(b.center || '') : who.center;
    if (!CENTERS.includes(c)) return deny(400, 'unknown center');
    if (!isAdmin && !who.lead) return deny(403, 'Only the site lead can change the site list.');
    const s = await loadSite(context, c);
    const before = siteView(m, s, c);
    const log = [];
    if (act === 'siteOps') {
      const ops = (Array.isArray(b.ops) ? b.ops : []).slice(0, 60).map((o) => cleanOp(o, 's')).filter(Boolean);
      if (!ops.length) return deny(400, 'nothing to change');
      ops.forEach((op) => { op.at = Date.now(); op.by = isAdmin ? 'admin' : 'lead'; s.ops.push(op); });
      const after = siteView(m, s, c);
      after.own.slice(-ops.length).forEach((o) => log.push({ action: 'site_change', center: c, card: 'Site list', to: o.text }));
    } else if (act === 'siteUndo') {
      const i = Number(b.index); if (!(i >= 0 && i < s.ops.length)) return deny(400, 'no such change');
      log.push({ action: 'site_undo', center: c, card: 'Site list', from: (before.own[i] || {}).text || '' });
      s.ops.splice(i, 1);
    } else {
      const u = (m.updates || []).find((x) => x.id === b.updateId);
      if (!u || !(u.targets === 'all' || (u.targets || []).includes(c))) return deny(404, 'no such update');
      if (u.required) return deny(400, 'Required updates cannot be rejected.');
      const d = b.decision === 'r' ? 'r' : 'a';
      s.decisions = s.decisions || {}; const dec = (s.decisions[u.id] = s.decisions[u.id] || {});
      const idx = b.i === 'all' ? u.ops.map((_, i) => i) : [Number(b.i)].filter((i) => i >= 0 && i < u.ops.length);
      const view = before.updates.find((x) => x.id === u.id);
      idx.forEach((i) => { dec[i] = d; log.push({ action: d === 'a' ? 'update_accepted' : 'update_rejected', center: c, card: 'Update ' + u.seq + (u.note ? ' — ' + u.note : ''), to: view ? view.changes[i].text : '' }); });
    }
    await saveSite(context, c, s);
    await logChanges(context, log);
    return Response.json({ ...siteView(m, s, c), canEdit: true }, { headers });
  }

  if (!isAdmin) return deny(403, 'admin only');
  m.draft = m.draft || []; m.updates = m.updates || [];
  if (act === 'draftOps') {
    const ops = (Array.isArray(b.ops) ? b.ops : []).slice(0, 60).map((o) => cleanOp(o, 'm')).filter(Boolean);
    if (!ops.length) return deny(400, 'nothing to change');
    m.draft.push(...ops);
  } else if (act === 'draftUndo') {
    const i = Number(b.index); if (!(i >= 0 && i < m.draft.length)) return deny(400, 'no such change'); m.draft.splice(i, 1);
  } else if (act === 'draftClear') {
    m.draft = [];
  } else if (act === 'publish') {
    if (!m.draft.length) return deny(400, 'Make at least one change to the master list first.');
    const tg = b.targets === 'all' ? 'all' : (Array.isArray(b.targets) ? b.targets.filter((c) => CENTERS.includes(c)) : []);
    if (tg !== 'all' && !tg.length) return deny(400, 'Choose at least one site.');
    const texts = masterView(m).draft.map((d) => d.text);
    const u = { id: 'u' + Date.now().toString(36), seq: lastSeq(m) + 1, at: Date.now(), note: String(b.note || '').slice(0, 200), required: !!b.required, targets: tg, ops: m.draft };
    m.updates.push(u); m.draft = [];
    await logChanges(context, texts.map((t) => ({ action: 'master_published', center: tg === 'all' ? 'ALL' : tg.join(' '), card: 'Update ' + u.seq + (u.required ? ' (required)' : '') + (u.note ? ' — ' + u.note : ''), to: t })));
  } else return deny(400, 'unknown action');
  await saveMaster(context, m);
  return Response.json({ master: masterView(m), updates: await statusBoard(context, m), lastSeq: lastSeq(m) }, { headers });
};

export const config = { path: '/api/lists' };
