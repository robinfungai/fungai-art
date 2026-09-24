-- ════════════════════════════════════════════════════════════════
-- RBAC + access tiers on profiles
--
-- Replaces the hardcoded admin email lists in global-nav.js,
-- app-living.jsx and herbal-engine-2/index.html with a fact the
-- database owns. Run AFTER supabase-fa-is-admin.sql. Idempotent.
--
-- ── ⚠ WHY access_role AND NOT role ──────────────────────────────
-- public.profiles.role ALREADY EXISTS and is ALREADY IN USE, as the
-- member's PERSONA. ProfileEditor writes it from the vocabulary in
-- spore/data.jsx:
--
--   forager · herbalist · alchemist · ceremony · sound · artist
--   patron · collaborator · student · seeker · other · founder
--
-- supabase-academy-access.sql assumed that column was an
-- authorisation role and tried to constrain it to
-- ('member','forager','steward','admin'). Run against production on
-- 2026-09-24 it failed with
--
--   ERROR 23514: check constraint "profiles_role_check" is violated
--
-- and had it succeeded it would have been worse: saving any profile
-- would then fail, because the editor writes role:'alchemist'.
--
-- So authorisation gets its own column and the portal keeps its own.
-- Decision recorded in docs/COMMUNITY-AUDIT.md §6.
--
-- ── Tiers ───────────────────────────────────────────────────────
-- access_tier is an integer ladder, not an enum, so a tier can be
-- inserted between two existing ones without a type migration.
--
--   1   public          ← EVERYTHING is tier 1 today, deliberately
--   5   member
--   10  admin
--
-- MYCO is open to the whole world right now, through /foraging,
-- /extraction, /mixology and /community, and nothing in this file
-- changes that. Every existing row is tier 1 and an anonymous caller
-- is treated as tier 1, so the filter is a no-op on the day it ships.
-- It exists so that Q2 2027 — when MYCO moves behind the member
-- portal — is a data change and a config flip, not a rewrite.
-- ════════════════════════════════════════════════════════════════

-- ── 1 · Columns ─────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_role text NOT NULL DEFAULT 'member';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_tier int NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_access_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_access_role_check
      CHECK (access_role IN ('member','partner','admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_access_tier_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_access_tier_check
      CHECK (access_tier BETWEEN 1 AND 10);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_access_role_idx ON public.profiles (access_role);
CREATE INDEX IF NOT EXISTS profiles_access_tier_idx ON public.profiles (access_tier);

-- ── 2 · Seed admins ─────────────────────────────────────────────
-- By email, joined through auth.users, because profiles has no email
-- column of its own — Supabase keeps it in auth.
--
-- NOTE, recorded rather than argued: commit fc897e0 removed
-- teyae@fungai.art (Stephanie) from the codebase as "a person who
-- left". Robin was shown that and asked for both addresses seeded on
-- 2026-09-25. Revoking it later is one UPDATE:
--   update public.profiles set access_role='member', access_tier=5,
--          is_admin=false
--    where auth_user_id = (select id from auth.users
--                           where lower(email)='teyae@fungai.art');
UPDATE public.profiles p
   SET access_role = 'admin',
       access_tier = 10,
       is_admin    = true
  FROM auth.users u
 WHERE u.id = p.auth_user_id
   AND lower(u.email) IN ('robin@fungai.art', 'teyae@fungai.art')
   AND (p.access_role <> 'admin' OR p.access_tier <> 10 OR p.is_admin IS DISTINCT FROM true);

-- Anyone already flagged is_admin keeps it, whatever their email.
UPDATE public.profiles
   SET access_role = 'admin', access_tier = 10
 WHERE is_admin = true
   AND (access_role <> 'admin' OR access_tier <> 10);

-- Claimed profiles that are not admins are members, not public.
UPDATE public.profiles
   SET access_tier = 5
 WHERE auth_user_id IS NOT NULL
   AND access_role = 'member'
   AND access_tier < 5;

-- ── 3 · The escalation guard ────────────────────────────────────
-- THE POINT OF THIS FILE. profiles already has an UPDATE policy
-- letting a member edit their own row, and RLS cannot restrict WHICH
-- COLUMNS an update touches. So without this trigger any member could
--
--   update profiles set is_admin = true where auth_user_id = auth.uid()
--
-- and the client-side allowlist we are deleting was, absurdly, the
-- only thing standing in the way. A trigger is the right mechanism:
-- column privileges would also block the legitimate admin path.
CREATE OR REPLACE FUNCTION public.profiles_guard_privileges()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- No end-user JWT: the service role, a migration, or the SQL
  -- editor. Those are already trusted with the whole database.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins may set these columns, including on other people's rows.
  -- fa_is_admin() is SECURITY DEFINER and only SELECTs, so calling it
  -- from a BEFORE UPDATE trigger on this same table does not recurse.
  IF public.fa_is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.access_role IS DISTINCT FROM OLD.access_role
     OR NEW.access_tier IS DISTINCT FROM OLD.access_tier
     OR NEW.is_admin    IS DISTINCT FROM OLD.is_admin
  THEN
    RAISE EXCEPTION
      'access_role, access_tier and is_admin are admin-only (profile %)', OLD.id
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_privileges_trg ON public.profiles;
CREATE TRIGGER profiles_guard_privileges_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_privileges();

-- ── 4 · fa_is_admin(), now reading access_role ──────────────────
-- Still NOT profiles.role — see the header. is_admin stays in the
-- predicate because global-nav.js, is_admin_user() and every existing
-- policy already depend on it, and the seed above keeps the two in
-- step.
CREATE OR REPLACE FUNCTION public.fa_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid()
      AND (is_admin = true OR access_role = 'admin')
  );
$$;

-- The caller's tier, for chunk filtering. Anonymous is tier 1, which
-- is every row in the corpus today — so this returns "show them
-- everything" until somebody deliberately raises a tier.
CREATE OR REPLACE FUNCTION public.fa_access_tier()
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT access_tier FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1),
    1
  );
$$;

GRANT EXECUTE ON FUNCTION public.fa_is_admin()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fa_access_tier() TO anon, authenticated;

-- ── 5 · Tier on member-written content ──────────────────────────
-- Default 1 = public, so today's behaviour is unchanged and MYCO
-- keeps answering the whole world from the whole corpus.
ALTER TABLE public.lab_notes
  ADD COLUMN IF NOT EXISTS access_tier int NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF to_regclass('public.lab_chapters') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.lab_chapters
               ADD COLUMN IF NOT EXISTS access_tier int NOT NULL DEFAULT 1';
  END IF;
  IF to_regclass('public.snippets') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.snippets
               ADD COLUMN IF NOT EXISTS access_tier int NOT NULL DEFAULT 1';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lab_notes_access_tier_idx ON public.lab_notes (access_tier);

-- Deliberately NO policy change on lab_notes here. It is
-- SELECT USING (true) and it stays that way: MYCO reads it with the
-- anon key, and closing it today would silently empty MYCO's live
-- lab-note retrieval. The tier column is filtered in
-- src/server/myco/lab-notes.cjs, which is where the reader is.
-- When MYCO goes paid in Q2 2027, that policy is the thing to change,
-- together with moving that file to the service key.

-- ── Verify ──────────────────────────────────────────────────────
-- Who is an admin now:
--   select p.character_name, u.email, p.access_role, p.access_tier, p.is_admin
--     from public.profiles p left join auth.users u on u.id = p.auth_user_id
--    where p.access_role = 'admin' or p.is_admin = true;
--
-- Tier spread:
--   select access_tier, count(*) from public.profiles group by 1 order by 1;
--
-- The guard works — as a NON-admin member, this must raise 42501:
--   update public.profiles set is_admin = true where auth_user_id = auth.uid();
--
-- Everything still public to MYCO (expect 0):
--   select count(*) from public.lab_notes where access_tier > 1;
