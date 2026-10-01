-- ════════════════════════════════════════════════════════════════
-- formula_flags — the formula e-book (Robin, 2026-10-02)
--
-- A formula that did not live up to the standard is flagged where its
-- percentages show (the pro composer's practitioner tools, the formula
-- analysis page). Flags collect in "Formula e-book · flagged" on the
-- Admin page, and the MYCO monthly digest (on the 2nd) reads the open
-- ones and proposes engine or record changes.
--
-- Run after supabase-fa-is-admin.sql. Idempotent.
--
-- Who can do what:
--   · anyone signed in may FILE a flag, as themselves (flagged_by is
--     their own id) — a practitioner can flag, and cannot read back
--     anyone's flags, their own included;
--   · only an admin (fa_is_admin()) reads, updates and deletes.
--
-- No name, email or city is stored: `answers` are the quiz answers (the
-- quiz asks for none of those), `reason` is the flagger's own words.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.formula_flags (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  flagged_by     uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  source         text NOT NULL DEFAULT 'pro' CHECK (source IN ('pro', 'analysis')),
  formula_name   text CHECK (char_length(formula_name) <= 120),
  -- [{ "name": "Ajwain", "percentage": 17 }, ...] — a snapshot, as shown
  herbs          jsonb NOT NULL CHECK (jsonb_typeof(herbs) = 'array'),
  engine_version text CHECK (char_length(engine_version) <= 40),
  answers        jsonb,
  reason         text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 2000),
  tags           text[] NOT NULL DEFAULT '{}'
                 CHECK (tags <@ ARRAY['relevance', 'hierarchy', 'extraction', 'identity', 'safety', 'other']::text[]),
  status         text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'explained', 'fixed')),
  admin_note     text CHECK (char_length(admin_note) <= 2000),
  resolved_at    timestamptz
);

CREATE INDEX IF NOT EXISTS formula_flags_status_created ON public.formula_flags (status, created_at DESC);

ALTER TABLE public.formula_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "formula_flags insert own" ON public.formula_flags;
CREATE POLICY "formula_flags insert own" ON public.formula_flags
  FOR INSERT TO authenticated
  WITH CHECK (flagged_by = auth.uid() AND status = 'open' AND admin_note IS NULL AND resolved_at IS NULL);

DROP POLICY IF EXISTS "formula_flags admin read" ON public.formula_flags;
CREATE POLICY "formula_flags admin read" ON public.formula_flags
  FOR SELECT TO authenticated
  USING (public.fa_is_admin());

DROP POLICY IF EXISTS "formula_flags admin update" ON public.formula_flags;
CREATE POLICY "formula_flags admin update" ON public.formula_flags
  FOR UPDATE TO authenticated
  USING (public.fa_is_admin())
  WITH CHECK (public.fa_is_admin());

DROP POLICY IF EXISTS "formula_flags admin delete" ON public.formula_flags;
CREATE POLICY "formula_flags admin delete" ON public.formula_flags
  FOR DELETE TO authenticated
  USING (public.fa_is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.formula_flags TO authenticated;
REVOKE ALL ON public.formula_flags FROM anon;

-- Check: should return the four policies.
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'formula_flags';
