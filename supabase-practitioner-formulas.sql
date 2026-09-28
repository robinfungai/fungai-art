-- ════════════════════════════════════════════════════════════════
-- supabase-practitioner-formulas.sql  ·  pro composer client files
--
-- 2026-09-28. The pro composer (/find-your-formula-pro) lets a
-- practitioner save a formula under a client code with notes, reopen
-- it, and print it (public/find-your-formula-pro/practitioner.js).
--
-- A row belongs to the practitioner who wrote it and NO ONE else can
-- read it — not other members, not signed-out visitors. These are
-- health notes about a third person, so the page asks for a client
-- code, not a name, and the table keeps nothing it does not need.
--
-- Idempotent. Safe to run more than once.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.practitioner_formulas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner          uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_label   text NOT NULL CHECK (char_length(client_label) BETWEEN 1 AND 80),
  notes          text CHECK (notes IS NULL OR char_length(notes) <= 4000),
  -- { name, herbs: [{ name, percentage }], bottle_ml, dose, duration }
  formula        jsonb NOT NULL,
  -- the quiz answers the formula was composed from
  profile        jsonb,
  engine_version text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practitioner_formulas_owner_idx
  ON public.practitioner_formulas (owner, updated_at DESC);

ALTER TABLE public.practitioner_formulas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.practitioner_formulas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practitioner_formulas TO authenticated;

DROP POLICY IF EXISTS "practitioner_formulas_select_own" ON public.practitioner_formulas;
CREATE POLICY "practitioner_formulas_select_own" ON public.practitioner_formulas
  FOR SELECT TO authenticated USING (owner = auth.uid());

DROP POLICY IF EXISTS "practitioner_formulas_insert_own" ON public.practitioner_formulas;
CREATE POLICY "practitioner_formulas_insert_own" ON public.practitioner_formulas
  FOR INSERT TO authenticated WITH CHECK (owner = auth.uid());

DROP POLICY IF EXISTS "practitioner_formulas_update_own" ON public.practitioner_formulas;
CREATE POLICY "practitioner_formulas_update_own" ON public.practitioner_formulas
  FOR UPDATE TO authenticated USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());

DROP POLICY IF EXISTS "practitioner_formulas_delete_own" ON public.practitioner_formulas;
CREATE POLICY "practitioner_formulas_delete_own" ON public.practitioner_formulas
  FOR DELETE TO authenticated USING (owner = auth.uid());

-- ── Confirm ─────────────────────────────────────────────────────
-- rowsecurity must be true, and four policies listed.
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'practitioner_formulas';
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'practitioner_formulas' ORDER BY policyname;
