-- ════════════════════════════════════════════════════════════════
-- Add missing fields for the public-facing profile detail view +
-- per-member feature restrictions controlled by admins.
--
-- Run once in Supabase SQL Editor. All three statements are additive
-- and IF NOT EXISTS-guarded, safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1. When the row was created (for "Member since · month + year")
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 2. Free-text "favourite plant or mushroom" the member writes themselves
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS favorite_plant text;

-- 3. Per-member feature restrictions — admin can block someone from
--    specific pages (e.g. 'foraging', 'extraction', 'mixology'). Empty
--    array = no restrictions = full access.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS restrictions text[] NOT NULL DEFAULT '{}';

-- 4. Admin flag column — needed so RLS can allow Robin / Stephanie to
--    update other members' rows (specifically to set restrictions).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Promote Robin and Stephanie to admin
UPDATE profiles
SET is_admin = true
WHERE LOWER(TRIM(character_name)) IN ('robin', 'stephanie');

-- 5. RLS policy: admins can UPDATE any profile.
--    Lets the Admin → Restrict features UI actually save.
--
--    Implemented via a SECURITY DEFINER function rather than an inline
--    EXISTS (SELECT FROM profiles...) — the inline form is technically
--    recursive (a policy on `profiles` reading `profiles`), and while
--    Postgres usually handles it, in some cases it can throw
--    "infinite recursion detected in policy". SECURITY DEFINER runs as
--    the function owner and bypasses RLS for the lookup, eliminating
--    the recursion risk entirely.

CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = uid AND is_admin = true
  );
$$;

-- Drop the old (potentially recursive) version if it exists from an earlier run
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- Verify columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
