-- ════════════════════════════════════════════════════════════════
-- fa_is_admin() — the admin predicate, for THIS schema
--
-- Run this before supabase-admin-board.sql. Idempotent.
--
-- ⚠ DO NOT use the fa_is_admin() in supabase-academy-access.sql.
--
--   That version reads:
--     WHERE auth_user_id = auth.uid() AND (is_admin = true OR role = 'admin')
--
--   and the file that defines it also tries to constrain the column:
--     CHECK (role IN ('member','forager','steward','admin'))
--
--   Both are wrong here, because public.profiles.role is ALREADY IN
--   USE for something else entirely. It is the portal's member
--   PERSONA, written by ProfileEditor (app-living.jsx ~2550) from the
--   vocabulary in spore/data.jsx:
--
--     forager · herbalist · alchemist · ceremony · sound · artist
--     patron · collaborator · student · seeker · other · founder
--
--   Two consequences, both found the hard way on 2026-09-24 when the
--   academy file was run against production and the ALTER failed:
--
--     1. The CHECK is violated by existing rows — only 'forager'
--        overlaps between the two vocabularies.
--     2. Worse, had it succeeded, saving any profile would fail. The
--        editor writes role:'alchemist' and the constraint rejects it.
--
--   And for the predicate itself: an admin who edited their own
--   profile would overwrite role='admin' with their persona and
--   silently stop being an admin.
--
--   So: is_admin only. It is the column global-nav.js, the Academy
--   and public.is_admin_user() already agree on.
--
-- THE REAL FIX, when someone has time: authorisation and persona want
-- two columns. Add profiles.access_role for the first, leave role to
-- the portal, and point fa_is_admin() at access_role. Until then this
-- function is correct and the academy file's is not — see
-- docs/COMMUNITY-AUDIT.md §6.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fa_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND is_admin = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.fa_is_admin() TO anon, authenticated;

-- ── Verify ──────────────────────────────────────────────────────
-- As yourself, signed in:
--   select public.fa_is_admin();
--
-- If false, you are not flagged as an admin:
--   select character_name, is_admin, role from public.profiles
--    where auth_user_id = auth.uid();
--   update public.profiles set is_admin = true
--    where auth_user_id = auth.uid();
--
-- The personas actually in use, for whoever writes access_role later:
--   select role, count(*) from public.profiles group by role order by 2 desc;
