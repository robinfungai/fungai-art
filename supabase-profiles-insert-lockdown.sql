-- ════════════════════════════════════════════════════════════════
-- supabase-profiles-insert-lockdown.sql
--
-- Audit finding (2026-09-03): the "Allow anonymous insert of
-- unclaimed profiles" policy from supabase-allow-unclaimed-inserts.sql
-- only checks `auth_user_id IS NULL`. It does NOT restrict `is_admin`
-- or `restrictions` in the WITH CHECK, so anon can:
--
--     INSERT INTO profiles
--       (character_name, auth_user_id, is_admin)
--     VALUES
--       ('evil', NULL, true);
--
-- If the "Users can claim unclaimed profiles" UPDATE policy (which
-- lives in the Supabase console, not in this tree) lets a signed-in
-- user set `auth_user_id = auth.uid()` on an unclaimed row without
-- also forcing `is_admin = false`, the anon insert + claim UPDATE
-- combination is an admin-escalation path.
--
-- Fix: tighten the INSERT WITH CHECK to force is_admin = false and
-- restrictions = '{}' on any anon-created row. Real admins are
-- promoted via a separate authenticated flow, not via seed rows.
--
-- Also flags for Robin (see comment below) the claim UPDATE policy
-- Robin needs to confirm has WITH CHECK (is_admin = false OR the
-- claimant is already an admin).
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1) Drop the loose policy (Postgres has no CREATE OR REPLACE for
--    policies, so this is the idiomatic replace pattern).
DROP POLICY IF EXISTS "Allow anonymous insert of unclaimed profiles"
  ON public.profiles;

-- 2) Recreate with hard WITH CHECK on escalation-shaped columns.
CREATE POLICY "Allow anonymous insert of unclaimed profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth_user_id IS NULL
    AND (is_admin IS DISTINCT FROM true)      -- true if column is missing, false, or null
    AND (
      restrictions IS NULL
      OR restrictions = '{}'::jsonb
      OR restrictions = '[]'::jsonb
    )
  );

-- ── ⚠ ROBIN — VERIFY IN SUPABASE CONSOLE ────────────────────────
-- The paired policy is "Users can claim unclaimed profiles" (UPDATE).
-- It lives in the Supabase dashboard, not in this repo. Please open
-- Supabase → Authentication → Policies → profiles → find the
-- "Users can claim unclaimed profiles" UPDATE policy and confirm its
-- WITH CHECK clause includes something like:
--
--   auth_user_id = auth.uid()
--   AND (
--     is_admin IS DISTINCT FROM true
--     OR EXISTS (SELECT 1 FROM public.profiles p
--                 WHERE p.auth_user_id = auth.uid() AND p.is_admin)
--   )
--
-- If it doesn't, an admin-escalation window still exists through
-- claim UPDATE even after this INSERT lockdown. If it does — this
-- lockdown closes the vector completely.

-- Verify.
SELECT policyname, cmd, qual, with_check
  FROM pg_policies
 WHERE tablename = 'profiles'
   AND policyname = 'Allow anonymous insert of unclaimed profiles';
