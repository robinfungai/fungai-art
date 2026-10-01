/* MYCO · monthly lab-notebook + library digest — the SCHEDULE
 * ────────────────────────────────────────────────────────────────
 * 09:00 UTC on the 2nd of each month (moved from the 1st, Robin
 * 2026-10-01, so it reads the whole of the 1st). Starts the worker
 * (myco-monthly-digest-background.mjs) and returns at once: Netlify
 * stops a scheduled function after 30 seconds, and MYCO reading a month
 * of lab notes and Academy PDFs takes longer, so the reading happens in a
 * background function (15 minutes). 2026-09-29.
 *
 * A scheduled function can't be opened by URL (Netlify). To run it by
 * hand: the "Run now" button in Netlify, or open the worker directly —
 * /.netlify/functions/myco-monthly-digest-background?key=<DIGEST_KEY>.
 * What the worker needs: see its header.
 */

import { digestToken } from './myco-monthly-digest-background.mjs';

export const config = { schedule: '0 9 2 * *' };   // 09:00 UTC, 2nd of the month (Robin, 2026-10-01)

export default async (req) => {
  const url = new URL(req.url);
  // The scheduler calls without a key; a person needs DIGEST_KEY.
  const isScheduled = !!req.headers.get('x-nf-event') || req.method === 'POST';
  if (!isScheduled) {
    const key = process.env.DIGEST_KEY;
    if (!key || url.searchParams.get('key') !== key) return new Response('Not found', { status: 404 });
  }
  const token = digestToken();
  if (!token) {
    console.error('[digest] ANTHROPIC_API_KEY not set — skipping');
    return new Response(JSON.stringify({ ok: false, reason: 'no api key' }), { status: 503 });
  }
  const origin = /^https?:\/\//.test(url.origin) && !/localhost|127\.0\.0\.1/.test(url.origin) ? url.origin
    : (process.env.URL || 'https://www.fungai.art');
  const target = origin + '/.netlify/functions/myco-monthly-digest-background' + (url.searchParams.get('dry') === '1' ? '?dry=1' : '');
  try {
    const res = await fetch(target, { method: 'POST', headers: { 'x-digest-token': token } });
    console.log('[digest] worker started: HTTP ' + res.status);
    return new Response(JSON.stringify({ ok: res.status === 202 || res.ok, started: true, status: res.status }), { status: 200 });
  } catch (e) {
    console.error('[digest] could not start the worker:', e.message);
    return new Response(JSON.stringify({ ok: false, reason: e.message }), { status: 502 });
  }
};
