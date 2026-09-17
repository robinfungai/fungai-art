// netlify/functions/me.mjs  ·  GET /api/me
//
// Academy P0.5 · the authoritative answer to "who is calling?".
//
// Until now the portal decided that in the browser: it read a member
// snapshot out of localStorage and re-stamped `admin: true` when the
// cached email looked like Robin's. Anyone could edit that. Row-level
// security still protected the database, but every UI decision — which
// tabs exist, whose profile can be edited, what MYCO is told about the
// caller — rested on a value the visitor controls.
//
// This endpoint verifies the Supabase access token server-side and
// returns identity the client cannot forge:
//
//   { signedIn, profileId, name, email, role, isAdmin, tier,
//     entitlements: [...], repPoints }
//
// The browser may still cache this for rendering, but nothing
// privileged should be granted on the browser's word alone: the
// database enforces the same rules through fa_is_admin() /
// fa_is_member() / fa_has_entitlement() (supabase-academy-access.sql).
//
// Verification uses the SERVICE ROLE key with the caller's JWT — the
// key never leaves the function.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_ORIGINS = [
  'https://www.fungai.art',
  'https://fungai.art',
  'https://fungai-art.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
];

function corsFor(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type':                 'application/json',
    // Identity must never be cached by a CDN — it is per-caller.
    'Cache-Control':                'no-store, private',
    'Vary':                         'Origin, Authorization',
  };
}

// Reputation tiers. Single source of truth: the browser used to compute
// these in myco/context.js, which meant the model could be told any tier
// the visitor fancied. Tiers now come from the server with the rep count
// the database holds.
const TIERS = [
  { min: 300, tier: 'root_node' },
  { min: 100, tier: 'forager'   },
  { min:  40, tier: 'mycelium'  },
  { min:  10, tier: 'palawan'   },
  { min:   0, tier: 'spore'     },
];
function tierFor(rep) {
  const n = Number(rep) || 0;
  return (TIERS.find(t => n >= t.min) || TIERS[TIERS.length - 1]).tier;
}

const SIGNED_OUT = {
  signedIn: false, profileId: null, name: null, email: null,
  role: 'anonymous', isAdmin: false, tier: null, entitlements: [], repPoints: 0,
};

export default async (req) => {
  const origin = req.headers.get('origin') || '';
  const cors   = corsFor(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), { status: 405, headers: cors });
  }
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'ORIGIN_NOT_ALLOWED' }), { status: 403, headers: cors });
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    // Misconfiguration must not read as "you are signed out" — the
    // client would silently downgrade to anonymous and look broken.
    return new Response(JSON.stringify({ error: 'IDENTITY_UNAVAILABLE' }), { status: 503, headers: cors });
  }

  const auth  = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return new Response(JSON.stringify(SIGNED_OUT), { status: 200, headers: cors });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // The token is the only thing we trust, and only after Supabase
  // verifies its signature and expiry.
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData && userData.user;
  if (userErr || !user) {
    return new Response(JSON.stringify(SIGNED_OUT), { status: 200, headers: cors });
  }

  const { data: profile } = await admin
    .from('profiles')
    // select('*') rather than a column list: `role` only exists once
    // supabase-academy-access.sql has run, and a missing column would
    // fail the whole query and read as "no profile".
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  // Signed in with no linked profile — a real state (magic link clicked
  // before claiming a member row). Say so rather than inventing one.
  if (!profile) {
    return new Response(JSON.stringify({
      ...SIGNED_OUT, signedIn: true, email: user.email || null, role: 'unclaimed',
    }), { status: 200, headers: cors });
  }

  let entitlements = [];
  try {
    const { data: rows } = await admin
      .from('entitlements')
      .select('entitlement')
      .eq('profile_id', profile.id);
    entitlements = (rows || []).map(r => r.entitlement);
  } catch (_) {
    // Table not installed yet (supabase-academy-access.sql unrun) —
    // absence of entitlements is the safe answer, not an error.
  }

  const role    = profile.role || (profile.is_admin ? 'admin' : 'member');
  const isAdmin = !!profile.is_admin || role === 'admin';

  return new Response(JSON.stringify({
    signedIn:     true,
    profileId:    profile.id,
    name:         profile.character_name || null,
    email:        profile.email || user.email || null,
    role,
    isAdmin,
    tier:         tierFor(profile.rep),
    repPoints:    Number(profile.rep) || 0,
    entitlements,
  }), { status: 200, headers: cors });
};
