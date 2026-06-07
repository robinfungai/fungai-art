-- ════════════════════════════════════════════════════════════════
-- formulas — cloud-shared formula book
--
-- Every blend saved in /mixology lands here, becomes visible in the
-- /academy Formula Log, and accepts member comments. The model is:
--   • One row per saved formula (name, herb list, maker, notes, who
--     made it = author_id linked to a profile).
--   • Comments are a separate table referencing the formula row.
--
-- Read access:  public (anyone can browse the academy log).
-- Write access: any signed-in network member can post; anyone can edit
--               their own; admins can edit/delete any.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.formulas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  herb_ids      text[] NOT NULL DEFAULT '{}',
  herb_names    text NOT NULL DEFAULT '',
  maker_label   text,                                        -- free-text "Maker" field (defaults to character_name)
  notes         text,                                         -- creator's own description of the blend
  author_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS formulas_created_at_idx ON public.formulas (created_at DESC);

CREATE TABLE IF NOT EXISTS public.formula_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id    uuid NOT NULL REFERENCES public.formulas(id) ON DELETE CASCADE,
  body          text NOT NULL,
  author_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_label  text,                                         -- snapshot of character_name at write time
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS formula_comments_formula_idx
  ON public.formula_comments (formula_id, created_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.formulas_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS formulas_updated_at ON public.formulas;
CREATE TRIGGER formulas_updated_at
  BEFORE UPDATE ON public.formulas
  FOR EACH ROW EXECUTE FUNCTION public.formulas_touch_updated_at();

ALTER TABLE public.formulas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_comments ENABLE ROW LEVEL SECURITY;

-- Read: anyone (academy formula log is open-browsable).
DROP POLICY IF EXISTS "formulas_select_public" ON public.formulas;
CREATE POLICY "formulas_select_public"
  ON public.formulas FOR SELECT USING (true);

DROP POLICY IF EXISTS "formula_comments_select_public" ON public.formula_comments;
CREATE POLICY "formula_comments_select_public"
  ON public.formula_comments FOR SELECT USING (true);

-- Insert: any authenticated user can post a formula or a comment.
DROP POLICY IF EXISTS "formulas_insert_authed" ON public.formulas;
CREATE POLICY "formulas_insert_authed"
  ON public.formulas FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "formula_comments_insert_authed" ON public.formula_comments;
CREATE POLICY "formula_comments_insert_authed"
  ON public.formula_comments FOR INSERT TO authenticated WITH CHECK (true);

-- Update / delete: only the row's author (matched via profiles.auth_user_id)
-- or an admin profile may modify. We don't allow anonymous edits.
DROP POLICY IF EXISTS "formulas_update_own_or_admin" ON public.formulas;
CREATE POLICY "formulas_update_own_or_admin"
  ON public.formulas FOR UPDATE TO authenticated USING (
    author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "formulas_delete_own_or_admin" ON public.formulas;
CREATE POLICY "formulas_delete_own_or_admin"
  ON public.formulas FOR DELETE TO authenticated USING (
    author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "formula_comments_update_own_or_admin" ON public.formula_comments;
CREATE POLICY "formula_comments_update_own_or_admin"
  ON public.formula_comments FOR UPDATE TO authenticated USING (
    author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "formula_comments_delete_own_or_admin" ON public.formula_comments;
CREATE POLICY "formula_comments_delete_own_or_admin"
  ON public.formula_comments FOR DELETE TO authenticated USING (
    author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

GRANT SELECT ON public.formulas, public.formula_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.formulas, public.formula_comments TO authenticated;
