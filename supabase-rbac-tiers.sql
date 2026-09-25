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
--   5–9 member, by RANK — Palawan 5 · Patron 6 · Facilitator 7 ·
--       Alchemist 8 · Founder 9 (§3b; profiles.rank, keepers only)
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

-- RANK (Robin, 2026-09-25): everyone starts Palawan; Patron is a
-- paying member; Facilitator and Alchemist are given; Founder is Robin.
-- Keepers set it on the Admin page. Admin is NOT a rank — it stays the
-- is_admin / access_role flag, so Robin is Founder + admin and Steph is
-- Facilitator + admin. Keep in step with RANKS in spore/data.jsx.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rank text NOT NULL DEFAULT 'palawan';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_rank_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_rank_check
      CHECK (rank IN ('palawan','patron','facilitator','alchemist','founder'));
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
-- (Robin confirmed again that evening: Steph stays an admin.)
UPDATE public.profiles
   SET access_role = 'admin', access_tier = 10
 WHERE is_admin = true
   AND (access_role <> 'admin' OR access_tier <> 10);

-- Two ranks that are facts rather than choices (Robin, 2026-09-25):
-- Robin is always Founder, Steph is Facilitator. Everyone else starts
-- Palawan (the column default) until a keeper confirms more.
UPDATE public.profiles p
   SET rank = 'founder'
  FROM auth.users u
 WHERE u.id = p.auth_user_id AND lower(u.email) = 'robin@fungai.art';

UPDATE public.profiles p
   SET rank = 'facilitator'
  FROM auth.users u
 WHERE u.id = p.auth_user_id AND lower(u.email) = 'teyae@fungai.art';

-- Claimed profiles that are not admins get the tier of their RANK
-- (§3b below). Unclaimed shells stay public.
-- (Filled in by the backfill at the end of §3b, once the function exists.)

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
--
-- `rank` is guarded too (2026-09-25): it sets the member's tier (§3b),
-- and every rank above Palawan must be confirmed by a keeper. No
-- member-side flow writes rank — the profile editor has no rank field —
-- so this breaks nothing.
--
-- AND INSERT, not only UPDATE. Fixed 2026-09-25, before this file was
-- ever run: the first draft guarded UPDATE alone and trusted any call
-- with no auth.uid(). But an anon-key request from a browser ALSO has
-- no auth.uid(), and "Allow anonymous insert of unclaimed profiles"
-- lets it insert — so it could insert a shell with access_role =
-- 'admin' (or rank = 'alchemist'), then claim it: the claim UPDATE
-- leaves those columns unchanged, so the UPDATE check never fired. Now
-- trust is the JWT's role — service_role, or no JWT at all (SQL editor,
-- migrations) — and a non-admin INSERT has the privileged columns
-- forced down.
CREATE OR REPLACE FUNCTION public.profiles_guard_privileges()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- The service role (webhooks, functions) or no JWT at all (the SQL
  -- editor, migrations). Already trusted with the whole database.
  IF coalesce(auth.jwt() ->> 'role', 'service_role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admins may set these columns, including on other people's rows.
  -- fa_is_admin() is SECURITY DEFINER and only SELECTs, so calling it
  -- from a BEFORE trigger on this same table does not recurse.
  IF public.fa_is_admin() THEN
    RETURN NEW;
  END IF;

  -- Anyone else creates an ordinary member row, whatever they sent.
  -- Forced rather than refused, so a normal profile insert still works.
  IF TG_OP = 'INSERT' THEN
    NEW.access_role := 'member';
    NEW.is_admin    := false;
    NEW.rank        := 'palawan';
    RETURN NEW;
  END IF;

  IF NEW.access_role IS DISTINCT FROM OLD.access_role
     OR NEW.access_tier IS DISTINCT FROM OLD.access_tier
     OR NEW.is_admin    IS DISTINCT FROM OLD.is_admin
     OR NEW.rank        IS DISTINCT FROM OLD.rank
  THEN
    RAISE EXCEPTION
      'access_role, access_tier, is_admin and rank are admin-only (profile %)', OLD.id
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_privileges_trg ON public.profiles;
CREATE TRIGGER profiles_guard_privileges_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_privileges();

-- ── 3b · Tier follows RANK (2026-09-25) ─────────────────────────
-- profiles.rank, which only keepers can change (above). Each rank is a
-- tier between member and admin — which is why access_tier is an
-- integer ladder:
--
--   1 public (unclaimed shells) · 5 Palawan · 6 Patron · 7 Facilitator
--   8 Alchemist · 9 Founder · 10 admin
--
-- Keep in step with RANKS in public/community/spore/data.jsx.
CREATE OR REPLACE FUNCTION public.fa_tier_for_rank(r text)
RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(r, 'palawan'))
    WHEN 'founder'     THEN 9
    WHEN 'alchemist'   THEN 8
    WHEN 'facilitator' THEN 7
    WHEN 'patron'      THEN 6
    ELSE 5                                -- palawan
  END;
$$;

-- Runs AFTER the guard on the same row: BEFORE triggers fire in name
-- order, and "profiles_guard…" sorts before "profiles_rank…". So the
-- guard judges what the caller sent, and this then writes the tier.
CREATE OR REPLACE FUNCTION public.profiles_rank_tier()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.access_role = 'admin' OR NEW.is_admin = true THEN
    NEW.access_tier := 10;
  ELSIF NEW.auth_user_id IS NULL THEN
    NEW.access_tier := 1;
  ELSE
    NEW.access_tier := public.fa_tier_for_rank(NEW.rank);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_rank_tier_trg ON public.profiles;
CREATE TRIGGER profiles_rank_tier_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_rank_tier();

-- Backfill every existing row to its rank's tier.
UPDATE public.profiles
   SET access_tier = CASE
         WHEN access_role = 'admin' OR is_admin = true THEN 10
         WHEN auth_user_id IS NULL THEN 1
         ELSE public.fa_tier_for_rank(rank)
       END;

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
