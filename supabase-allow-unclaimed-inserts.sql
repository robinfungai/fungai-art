-- ════════════════════════════════════════════════════════════════
-- Allow anyone (including unauthenticated users) to insert a profile
-- with auth_user_id IS NULL — i.e. an "unclaimed seed" that a real
-- person can later claim by signing in via magic link.
--
-- Why: without this, only signed-in users can create profiles. That
-- means Robin (admin) cannot pre-create profiles for new founders /
-- palawan, and invite-code users (5858) cannot create their own
-- profile before going through the magic-link flow.
--
-- Safety:
--   • This policy CANNOT be used to create a profile attached to
--     someone else's auth user — the WITH CHECK requires auth_user_id
--     to be NULL.
--   • Existing UPDATE policy ("Users can claim unclaimed profiles")
--     still requires auth.uid() to match auth_user_id, so claiming /
--     editing remains gated.
--   • The unique index on character_name (added in supabase-dedupe.sql)
--     prevents flooding with duplicate names.
--   • If you ever see abuse, you can drop this policy with:
--       DROP POLICY "Allow anonymous insert of unclaimed profiles" ON profiles;
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "Allow anonymous insert of unclaimed profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth_user_id IS NULL);

-- Verify the policy is in place
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
