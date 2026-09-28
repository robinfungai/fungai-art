// src/server/practitioner.mjs
//
// Who may use the pro composer (Robin, 2026-09-28: "a real sign-in gate").
//
// Until now /find-your-formula-pro was public and `_pro: true` was a
// client claim: anyone could reach the pro-only herbs (Ephedra and the
// eight practitioner-only plants) by sending that flag. Now the server
// honours `_pro` only for a verified practitioner:
//
//   a signed-in member whose profiles.rank is one of PRACTITIONER_RANKS,
//   or an admin (is_admin / role 'admin').
//
// Ranks are set by keepers on the Admin page (supabase-rbac-tiers.sql);
// no member can raise their own. To open the pro composer to another
// rank, add it here — this is the only place the rule lives.
//
// Verification uses the SERVICE ROLE key with the caller's JWT, exactly
// as netlify/functions/me.mjs does; the key never leaves the function.
//
// Local dev: the Vite dev server (vite.config.ts) sets
// FYF_DEV_PRACTITIONER=1 in its own process so the pro page can be tried
// on localhost:5173 without a service key. Netlify never runs that
// process, so the flag cannot exist in production.

import { createClient } from '@supabase/supabase-js';

export const PRACTITIONER_RANKS = ['facilitator', 'alchemist', 'founder'];

export function isPractitionerProfile(profile) {
  if (!profile) return false;
  const isAdmin = !!profile.is_admin || profile.role === 'admin';
  return isAdmin || PRACTITIONER_RANKS.includes(profile.rank);
}

/**
 * @param {Request} req
 * @returns {Promise<{ ok: boolean, reason: string|null, userId?: string,
 *   profileId?: string, name?: string|null, rank?: string|null, dev?: boolean }>}
 */
export async function verifyPractitioner(req) {
  const auth  = (req.headers.get && req.headers.get('authorization')) || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !KEY) {
    if (process.env.FYF_DEV_PRACTITIONER === '1') {
      return { ok: true, reason: null, name: 'Local dev', rank: 'dev', dev: true };
    }
    return { ok: false, reason: 'IDENTITY_UNAVAILABLE' };
  }
  if (!token) return { ok: false, reason: 'SIGNED_OUT' };

  const admin = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData && userData.user;
  if (userErr || !user) return { ok: false, reason: 'SIGNED_OUT' };

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (!profile) return { ok: false, reason: 'NO_PROFILE', userId: user.id };

  const ok = isPractitionerProfile(profile);
  return {
    ok,
    reason:    ok ? null : 'RANK_NOT_PRACTITIONER',
    userId:    user.id,
    profileId: profile.id,
    name:      profile.character_name || null,
    rank:      profile.rank || null,
  };
}
