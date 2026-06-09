-- ════════════════════════════════════════════════════════════════
-- snippets — small member-shared notes inside /community/academy
--
-- Lightweight posts: a title (optional), a body, and an optional kind
-- tag (tip / insight / incentive / field-note / question / recipe).
-- Any signed-in member can post; anyone can read.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.snippets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text,
  body          text NOT NULL,
  kind          text DEFAULT 'tip',
  author_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_label  text,
  reactions     int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snippets_created_idx
  ON public.snippets (created_at DESC);

ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- Read: anyone.
DROP POLICY IF EXISTS "snippets_select_public" ON public.snippets;
CREATE POLICY "snippets_select_public"
  ON public.snippets FOR SELECT USING (true);

-- Insert: any visitor. The original policy gated this on the
-- `authenticated` role, but Robin's normal flow has localStorage as
-- the source-of-truth identity, with the Supabase auth session often
-- expired by the time he posts. Snippets are low-stakes — the spore
-- portal supplies author_label client-side, admins can moderate any
-- noise. If you want to lock it down later, tighten this policy.
DROP POLICY IF EXISTS "snippets_insert_authed" ON public.snippets;
DROP POLICY IF EXISTS "snippets_insert_open"   ON public.snippets;
CREATE POLICY "snippets_insert_open"
  ON public.snippets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Update / delete: author or admin.
DROP POLICY IF EXISTS "snippets_update_own_or_admin" ON public.snippets;
CREATE POLICY "snippets_update_own_or_admin"
  ON public.snippets FOR UPDATE TO authenticated USING (
    author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "snippets_delete_own_or_admin" ON public.snippets;
CREATE POLICY "snippets_delete_own_or_admin"
  ON public.snippets FOR DELETE TO authenticated USING (
    author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

GRANT SELECT ON public.snippets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.snippets TO authenticated;
