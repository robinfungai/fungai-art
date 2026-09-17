-- ════════════════════════════════════════════════════════════════
-- supabase-academy-access.sql  ·  Academy P0.5 — trust foundation
--
-- Closes two blockers from docs/academy/phase-0-audit.md:
--
--   B1  Identity/authorisation decided in the browser. This script adds
--       the server-side half: a role column, an entitlements table, and
--       SECURITY DEFINER helpers that policies (and /api/me) can trust.
--
--   B2  Academy knowledge tables are world-readable. lab_notes,
--       snippets and lab_chapters currently have SELECT USING (true),
--       so anyone holding the public anon key can read every note.
--       This script scopes them to signed-in members.
--
-- ⚠ BEHAVIOUR CHANGE — READ BEFORE RUNNING
--    After this script, reading academy notes/snippets/chapters
--    REQUIRES a Supabase session (magic-link sign-in). Members who have
--    only ever used the localStorage identity will see empty lists
--    until they sign in once. That is the point of the fix, but it is a
--    visible change — run it when you can tell members to sign in.
--    Step 7 prints how many profiles are actually linked to an auth
--    user, so you can see the size of that group BEFORE committing.
--
-- Idempotent: safe to run more than once.
-- ════════════════════════════════════════════════════════════════

-- ── 1 · Roles on profiles ────────────────────────────────────────
-- is_admin stays (everything already reads it); role adds the wider
-- vocabulary the Academy needs without a second source of truth.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('member','forager','steward','admin'));
  END IF;
END $$;

-- Keep role and is_admin in step for existing rows.
UPDATE public.profiles SET role = 'admin' WHERE is_admin = true AND role <> 'admin';

-- ── 2 · Entitlements ─────────────────────────────────────────────
-- One row per granted capability. Designed so membership TIERS can be
-- added later without rewriting a single policy: policies ask
-- has_entitlement('academy.read'), and how that entitlement is granted
-- (manually today, by tier tomorrow) stays an implementation detail.
CREATE TABLE IF NOT EXISTS public.entitlements (
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entitlement text NOT NULL,
  granted_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  note        text,
  PRIMARY KEY (profile_id, entitlement)
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- ── 3 · Helper functions ─────────────────────────────────────────
-- SECURITY DEFINER so a policy on profiles can call them without
-- re-entering profiles' own RLS (that recursion is what made the
-- earlier admin policies awkward). search_path pinned per Supabase
-- linter guidance.

-- The caller's profile id, or NULL when signed out.
CREATE OR REPLACE FUNCTION public.fa_profile_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Signed in AND linked to a profile row.
CREATE OR REPLACE FUNCTION public.fa_is_member()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.fa_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND (is_admin = true OR role = 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.fa_has_entitlement(p_entitlement text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.fa_is_admin() OR EXISTS (
    SELECT 1 FROM public.entitlements e
    JOIN public.profiles p ON p.id = e.profile_id
    WHERE p.auth_user_id = auth.uid() AND e.entitlement = p_entitlement
  );
$$;

GRANT EXECUTE ON FUNCTION public.fa_profile_id()            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fa_is_member()             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fa_is_admin()              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fa_has_entitlement(text)   TO anon, authenticated;

-- ── 4 · Entitlement visibility ──────────────────────────────────
-- Read your own; admins read all. No client writes at all — grants go
-- through the service role (a function or the SQL editor).
DROP POLICY IF EXISTS "entitlements_read_self" ON public.entitlements;
CREATE POLICY "entitlements_read_self"
  ON public.entitlements FOR SELECT
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR public.fa_is_admin()
  );

-- ── 5 · Academy content: members only (B2) ───────────────────────
-- Writes were already scoped (own row / admin) by earlier hardening;
-- only the world-readable SELECT changes here.
DROP POLICY IF EXISTS "lab_notes_select_public"    ON public.lab_notes;
CREATE POLICY "lab_notes_select_member"
  ON public.lab_notes FOR SELECT
  USING (public.fa_is_member());

DROP POLICY IF EXISTS "snippets_select_public"     ON public.snippets;
CREATE POLICY "snippets_select_member"
  ON public.snippets FOR SELECT
  USING (public.fa_is_member());

DROP POLICY IF EXISTS "lab_chapters_select_public" ON public.lab_chapters;
CREATE POLICY "lab_chapters_select_member"
  ON public.lab_chapters FOR SELECT
  USING (public.fa_is_member());

-- Anonymous INSERT on lab_notes/snippets was left open on purpose so
-- the portal could post without a session. With reads now requiring a
-- session, writes should match — otherwise anonymous users can still
-- fill tables they cannot read.
DROP POLICY IF EXISTS "lab_notes_insert_open" ON public.lab_notes;
CREATE POLICY "lab_notes_insert_member"
  ON public.lab_notes FOR INSERT
  WITH CHECK (public.fa_is_member());

DROP POLICY IF EXISTS "snippets_insert_open" ON public.snippets;
CREATE POLICY "snippets_insert_member"
  ON public.snippets FOR INSERT
  WITH CHECK (public.fa_is_member());

-- ── 6 · Audit log ────────────────────────────────────────────────
-- Who changed what, and which AI actions ran. Written by the service
-- role only; admins can read it. Never written from the browser.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_label text,                    -- email or 'system' / 'myco'
  action      text NOT NULL,           -- 'inventory.update', 'myco.answer', …
  entity      text,                    -- 'product_inventory', 'formula', …
  entity_id   text,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip          inet
);

CREATE INDEX IF NOT EXISTS audit_log_at_idx     ON public.audit_log (at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log (action, at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_read_admin" ON public.audit_log;
CREATE POLICY "audit_log_read_admin"
  ON public.audit_log FOR SELECT
  USING (public.fa_is_admin());
-- No INSERT/UPDATE/DELETE policy → service role only, by design.

-- ── 7 · Grant yourself the Academy entitlement ───────────────────
-- Admins pass every entitlement check already; this seeds the explicit
-- grant so the mechanism is exercised from day one.
INSERT INTO public.entitlements (profile_id, entitlement, note)
SELECT id, 'academy.read', 'seed · P0.5'
FROM public.profiles
WHERE is_admin = true OR role = 'admin'
ON CONFLICT (profile_id, entitlement) DO NOTHING;

-- ── 8 · Verification ─────────────────────────────────────────────
-- Run these after the script and read the numbers before announcing
-- anything to members.

-- How many members can still reach the academy? (profiles linked to an
-- auth user). Profiles with auth_user_id IS NULL must sign in once.
SELECT count(*) FILTER (WHERE auth_user_id IS NOT NULL) AS linked,
       count(*) FILTER (WHERE auth_user_id IS NULL)     AS needs_signin,
       count(*)                                          AS total
FROM public.profiles;

-- Policies now in force on the academy tables.
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('lab_notes','snippets','lab_chapters','entitlements','audit_log')
ORDER BY tablename, cmd, policyname;

-- Signed out, this must return 0 rows (run it from the anon REST API,
-- not the SQL editor — the editor runs as the service role):
--   curl "$SUPABASE_URL/rest/v1/lab_notes?select=id&limit=1" \
--        -H "apikey: $ANON_KEY"
