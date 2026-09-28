// netlify/functions/pro-access.mjs  ·  GET /api/pro-access
//
// The pro composer's door. Answers one question — may this caller use
// /find-your-formula-pro? — with the same rule /api/fyf/compose enforces
// (src/server/practitioner.mjs). The page uses it to show the sign-in
// wall; the compose endpoint checks again on every request, so this
// answer is a courtesy, never the lock.
//
//   → { practitioner: boolean, reason: string|null, name, rank }

import { verifyPractitioner } from '../../src/server/practitioner.mjs';

const ALLOWED_ORIGINS = [
  'https://www.fungai.art',
  'https://fungai.art',
  'https://fungai-art.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
];

function corsFor(origin) {
  return {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin, Authorization',
  };
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const cors   = corsFor(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), { status: 405, headers: cors });
  }
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'ORIGIN_NOT_ALLOWED' }), { status: 403, headers: cors });
  }
  let v;
  try { v = await verifyPractitioner(req); }
  catch (_) { v = { ok: false, reason: 'IDENTITY_UNAVAILABLE' }; }
  return new Response(JSON.stringify({
    practitioner: !!v.ok,
    reason:       v.reason || null,
    name:         v.name || null,
    rank:         v.rank || null,
  }), { status: 200, headers: cors });
}
