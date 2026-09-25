-- ════════════════════════════════════════════════════════════════
-- profiles privacy — take members' emails out of a world-readable table
--
-- Audit, 2026-09-25 (docs/COMMUNITY-AUDIT-2.md, finding P1).
--
-- public.profiles can be SELECTed with the anon key, which ships in
-- every page of the site. Checked that day with that key alone, no
-- sign-in: all 12 rows readable, `email` filled in 8 of them, and
-- `contact` holding a login email in 2 more — because the portal wrote
-- the auth email into both columns on sign-in.
--
-- The client stopped writing them the same day (supabase-client.js
-- upsert + claimSeededProfile, app-living.jsx tryAutoLogin). This
-- clears what is already there, keeps `email` empty for good, and
-- limits what a signed-out visitor can read at all (§3). Nothing reads
-- profiles.email: netlify/functions/me.mjs falls back to
-- auth.users.email, and keepers get emails from the get_member_emails RPC.
--
-- Run once in Supabase → SQL Editor. Idempotent.
-- ════════════════════════════════════════════════════════════════

-- 1 · Empty the column, and keep it empty whatever an old client sends.
UPDATE public.profiles SET email = NULL WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.profiles_no_email()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email := NULL;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_no_email_trg ON public.profiles;
CREATE TRIGGER profiles_no_email_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_no_email();

-- 2 · `contact` is the member's own "Reach out" line, shown on their
--     profile — but the portal used to fill it with the login email
--     when it was blank. Clear exactly those: a contact that IS the
--     member's login email. Anything else they typed stays.
UPDATE public.profiles p
   SET contact = NULL
  FROM auth.users u
 WHERE u.id = p.auth_user_id
   AND p.contact IS NOT NULL
   AND lower(trim(p.contact)) = lower(u.email);

-- 3 · Signed-out visitors see a public card, nothing private.
--     Column privileges, because RLS decides rows, never columns. The
--     anon role keeps exactly the columns the signed-out page and the
--     invite-code signup read back — supabase-client.js
--     PUBLIC_PROFILE_COLS, which must match this list. Gone for anon:
--     email, contact, auth_user_id, is_admin, balance, dm_public_key,
--     and every column added later (access_role, access_tier, rank)
--     unless it is granted here. Signed-in members keep the full row.
REVOKE SELECT ON public.profiles FROM anon;
GRANT  SELECT (id, character_name, avatar_url, bio, role, location, pronouns,
               specialties, founding, rep, focus, node, joined, updated, favorite_plant)
  ON public.profiles TO anon;

-- ── Verify ──────────────────────────────────────────────────────
--   select count(*) filter (where email is not null)    as emails,
--          count(*) filter (where contact like '%@%')    as contacts_with_at
--     from public.profiles;                               -- expect 0 · (only typed ones)
--
-- And from outside, signed out, with only the anon key:
--   GET /rest/v1/profiles?select=email          → 401 permission denied
--   GET /rest/v1/profiles?select=character_name → the names, as before
