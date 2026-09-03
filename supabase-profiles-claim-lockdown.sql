-- ════════════════════════════════════════════════════════════════
-- supabase-profiles-claim-lockdown.sql
--
-- Companion to supabase-profiles-insert-lockdown.sql.
--
-- The "Users can claim unclaimed profiles" UPDATE policy (which
-- lives in the Supabase console) currently reads:
--
--   USING  (auth_user_id IS NULL)
--   WITH CHECK (auth.uid() = auth_user_id)
--
-- Problem: the WITH CHECK constrains WHO the claimant becomes (must
-- set the row's auth_user_id to their own auth.uid()) but does NOT
-- constrain any OTHER column the UPDATE writes. An attacker can:
--
--   1. Sign in normally.
--   2. Find any unclaimed profile row (either seeded by the app or
--      inserted by them — the INSERT lockdown now forces is_admin=false
--      on anon-inserted rows, but the row exists).
--   3. Run:
--        UPDATE profiles
--           SET auth_user_id = auth.uid(),
--               is_admin     = true
--         WHERE id = <that row>;
--      USING passes (row is unclaimed), WITH CHECK passes
--      (auth.uid() = new auth_user_id). Attacker is now admin.
--
-- Fix: extend the WITH CHECK to also require is_admin IS DISTINCT
-- FROM true on the resulting row. Claiming stays possible; escalation
-- on the way in does not.
--
-- Idempotent. Uses ALTER POLICY (not DROP+CREATE) so the policy is
-- never briefly absent — no window where anon UPDATEs would slip
-- through.
-- ════════════════════════════════════════════════════════════════

ALTER POLICY "Users can claim unclaimed profiles"
  ON public.profiles
  USING (auth_user_id IS NULL)
  WITH CHECK (
    auth.uid() = auth_user_id
    AND (is_admin IS DISTINCT FROM true)
  );

-- Verify — with_check should include the new is_admin clause.
SELECT policyname, cmd, qual, with_check
  FROM pg_policies
 WHERE tablename = 'profiles'
   AND policyname = 'Users can claim unclaimed profiles';

-- ── ⚠ Adjacent sanity check ──────────────────────────────────────
-- Also worth confirming no pre-existing unclaimed rows already have
-- is_admin = true (leftover attack surface even after this policy
-- change). Empty result = clean; any rows returned should have
-- is_admin stripped or the row deleted.
--
--   SELECT id, character_name, is_admin, auth_user_id, created_at
--     FROM public.profiles
--    WHERE is_admin = true AND auth_user_id IS NULL;
