-- ════════════════════════════════════════════════════════════════
-- profiles.restrictions — feature restrictions that actually reach
-- the member (Robin, 2026-09-27)
--
-- WHY THIS EXISTS: the Admin page's "Restrict features" has always
-- saved to profiles.restrictions — and that column never existed. The
-- portal swallowed the error on purpose ("silently no-ops when the
-- column doesn't exist"), so every restriction ever set lived only in
-- the keeper's own browser. A restricted member's device never heard
-- about it. This adds the column, so the restriction follows the
-- member to any device they sign in on.
--
-- Keepers only: a member cannot clear their own restrictions. The
-- guard below refuses it, the same way profiles_guard_privileges
-- (supabase-rbac-tiers.sql) refuses a member promoting themselves.
--
-- Run once in Supabase → SQL Editor. Idempotent.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS restrictions text[] NOT NULL DEFAULT '{}';

-- Values are the feature ids the Admin page offers (RESTRICTABLE_FEATURES
-- in community/spore/app-living.jsx: extraction, mixology, community).
-- Not pinned by a CHECK, so adding a feature there needs no SQL.

CREATE OR REPLACE FUNCTION public.profiles_guard_restrictions()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Service role, or the SQL editor (no JWT): trusted already.
  IF coalesce(auth.jwt() ->> 'role', 'service_role') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.fa_is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.restrictions := '{}';
    RETURN NEW;
  END IF;
  IF NEW.restrictions IS DISTINCT FROM OLD.restrictions THEN
    RAISE EXCEPTION 'restrictions are set by keepers only (profile %)', OLD.id
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_restrictions_trg ON public.profiles;
CREATE TRIGGER profiles_guard_restrictions_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_restrictions();

-- ── Verify ──────────────────────────────────────────────────────
-- SELECT character_name, restrictions FROM public.profiles WHERE restrictions <> '{}';
