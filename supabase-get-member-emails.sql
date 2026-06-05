-- ════════════════════════════════════════════════════════════════
-- get_member_emails() — admin-only RPC that returns the auth email
-- for every claimed profile.
--
-- Why: auth.users.email is RLS-gated for anonymous + authenticated
-- reads (Supabase default — correct security baseline). The admin
-- panel needs to see member emails to do real admin work (reach out,
-- onboard, troubleshoot sign-ins). This function runs as the table
-- owner (SECURITY DEFINER), checks that the caller is flagged
-- admin=true on their own profile, and only then returns the join
-- of profiles → auth.users on email.
--
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor
-- → New query → paste this whole file → Run).
--
-- After running:
--   • Admins (Robin, Stephanie) can call window.SBclient.rpc(
--       'get_member_emails') from the admin panel.
--   • Non-admins get an exception (visible in the toast).
--   • The function never exposes emails for unlinked / unclaimed
--     profiles — only rows where profiles.auth_user_id is set.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_member_emails()
RETURNS TABLE(profile_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
-- Lock down the search path so a malicious schema can't shadow
-- profiles / auth lookups when this DEFINER function runs.
SET search_path = public, auth
AS $$
BEGIN
  -- Gate: caller must be an admin on their own profile row.
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can read member emails'
      USING ERRCODE = '42501';  -- insufficient_privilege
  END IF;

  -- Join profiles to auth.users on the auth_user_id link. Only
  -- profiles with a linked auth user have an email to return.
  RETURN QUERY
  SELECT p.id AS profile_id, u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.auth_user_id
  WHERE p.auth_user_id IS NOT NULL;
END;
$$;

-- Authenticated users can attempt to call the function. The admin
-- gate inside the body decides whether they actually get data.
GRANT EXECUTE ON FUNCTION public.get_member_emails() TO authenticated;

-- Anon (unauthenticated) callers never see the function.
REVOKE EXECUTE ON FUNCTION public.get_member_emails() FROM anon;
