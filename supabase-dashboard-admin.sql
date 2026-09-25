-- ════════════════════════════════════════════════════════════════
-- Dashboard figures + announcements — both edited from the Admin page
--
-- site_figures   the numbers on the portal Dashboard (portal/dashboard.jsx)
-- announcements  a notice every member sees at the top of the Dashboard
--
-- Needs public.fa_is_admin() (supabase-fa-is-admin.sql, already run).
-- Run once in Supabase → SQL Editor. Idempotent.
--
-- Announcements are deliberately NOT encrypted: they are addressed to
-- everyone, so there is no one to keep them from. Private messages
-- between members are the end-to-end encrypted DMs (messages_e2e).
-- ════════════════════════════════════════════════════════════════

-- ── 1 · site_figures ────────────────────────────────────────────
-- `source` makes a figure live — the portal computes it:
--   members  profiles with a name · nodes  live network nodes ·
--   ahead    upcoming calendar events
-- Otherwise `value` is shown as typed.
-- `draft` figures reach keepers only — enforced HERE, by RLS, not only
-- hidden in the page — so a placeholder is never read as a fact.
CREATE TABLE IF NOT EXISTS public.site_figures (
  id          text        PRIMARY KEY CHECK (id ~ '^[a-z0-9_-]{1,40}$'),
  label       text        NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  value       numeric,
  source      text        CHECK (source IN ('members', 'nodes', 'ahead')),
  unit        text        CHECK (char_length(unit) <= 8),
  note        text        CHECK (char_length(note) <= 80),
  draft       boolean     NOT NULL DEFAULT true,
  sort        int         NOT NULL DEFAULT 100,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid        DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_figures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_figures_read" ON public.site_figures;
CREATE POLICY "site_figures_read"
  ON public.site_figures FOR SELECT
  TO authenticated
  USING (draft = false OR public.fa_is_admin());

DROP POLICY IF EXISTS "site_figures_admin_insert" ON public.site_figures;
CREATE POLICY "site_figures_admin_insert"
  ON public.site_figures FOR INSERT
  TO authenticated
  WITH CHECK (public.fa_is_admin());

DROP POLICY IF EXISTS "site_figures_admin_update" ON public.site_figures;
CREATE POLICY "site_figures_admin_update"
  ON public.site_figures FOR UPDATE
  TO authenticated
  USING (public.fa_is_admin())
  WITH CHECK (public.fa_is_admin());

DROP POLICY IF EXISTS "site_figures_admin_delete" ON public.site_figures;
CREATE POLICY "site_figures_admin_delete"
  ON public.site_figures FOR DELETE
  TO authenticated
  USING (public.fa_is_admin());

REVOKE ALL ON public.site_figures FROM anon;

-- The figures the Dashboard shipped with. The last four are the
-- placeholders Robin asked for — still drafts until edited.
INSERT INTO public.site_figures (id, label, value, source, unit, note, draft, sort) VALUES
  ('members',   'Hyphae in the network',        NULL, 'members', NULL, 'members with a profile', false, 10),
  ('herbs',     'Plants in the materia medica', 243,  NULL,      NULL, 'as of September 2026',   false, 20),
  ('nodes',     'Network nodes',                NULL, 'nodes',   NULL, 'live on the globe',      false, 30),
  ('ahead',     'Gatherings ahead',             NULL, 'ahead',   NULL, 'on the calendar',        false, 40),
  ('dinners',   'Dinners hosted',               24,   NULL,      NULL, NULL,                     true,  50),
  ('litres',    'Litres extracted',             180,  NULL,      'L',  NULL,                     true,  60),
  ('foraged',   'Kilos foraged this season',    96,   NULL,      'kg', NULL,                     true,  70),
  ('countries', 'Countries shipped to',         14,   NULL,      NULL, NULL,                     true,  80)
ON CONFLICT (id) DO NOTHING;

-- ── 2 · announcements ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body        text        NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid        DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at  timestamptz
);

CREATE INDEX IF NOT EXISTS announcements_created_idx ON public.announcements (created_at DESC);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Every signed-in member reads the live ones; keepers also see expired.
DROP POLICY IF EXISTS "announcements_read" ON public.announcements;
CREATE POLICY "announcements_read"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (expires_at IS NULL OR expires_at > now() OR public.fa_is_admin());

DROP POLICY IF EXISTS "announcements_admin_insert" ON public.announcements;
CREATE POLICY "announcements_admin_insert"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.fa_is_admin());

DROP POLICY IF EXISTS "announcements_admin_update" ON public.announcements;
CREATE POLICY "announcements_admin_update"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.fa_is_admin())
  WITH CHECK (public.fa_is_admin());

DROP POLICY IF EXISTS "announcements_admin_delete" ON public.announcements;
CREATE POLICY "announcements_admin_delete"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.fa_is_admin());

REVOKE ALL ON public.announcements FROM anon;

-- ── Verify ──────────────────────────────────────────────────────
--   select id, label, coalesce(source, value::text), draft from public.site_figures order by sort;
--   select title, created_at, expires_at from public.announcements order by created_at desc;
