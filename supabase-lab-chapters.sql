-- ════════════════════════════════════════════════════════════════
-- lab_chapters — admin-creatable custom chapters for the Lab Notebook
--
-- Hardcoded LAB_CHAPTERS (microbes, spagyric, formulas, contra, etc.)
-- stay in /community/academy/index.html as defaults. This table adds
-- ADMIN-created extras on top — anything new Robin or Stephanie wants
-- to spin up (e.g. "Hopi tobacco field notes", "Bali ferments 2027").
--
-- The chapter id MUST be unique across both the hardcoded list and
-- this table; the rendering layer prefers cloud entries if collisions
-- happen, so an admin can override a default chapter's name/icon by
-- inserting one with the same id.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lab_chapters (
  id            text PRIMARY KEY,                              -- slug, e.g. "field_2027"
  icon          text,                                          -- single emoji/glyph
  name          text NOT NULL,
  sub           text,
  placeholder   text,
  sort_order    int NOT NULL DEFAULT 100,
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_chapters ENABLE ROW LEVEL SECURITY;

-- Read: anyone (lab notebook is public-readable).
DROP POLICY IF EXISTS "lab_chapters_select_public" ON public.lab_chapters;
CREATE POLICY "lab_chapters_select_public"
  ON public.lab_chapters FOR SELECT USING (true);

-- Write: admins only. Same gate as inventory + get_member_emails.
DROP POLICY IF EXISTS "lab_chapters_insert_admin" ON public.lab_chapters;
CREATE POLICY "lab_chapters_insert_admin"
  ON public.lab_chapters FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "lab_chapters_update_admin" ON public.lab_chapters;
CREATE POLICY "lab_chapters_update_admin"
  ON public.lab_chapters FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "lab_chapters_delete_admin" ON public.lab_chapters;
CREATE POLICY "lab_chapters_delete_admin"
  ON public.lab_chapters FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

GRANT SELECT ON public.lab_chapters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lab_chapters TO authenticated;
