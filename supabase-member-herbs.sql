-- ════════════════════════════════════════════════════════════════
-- member_herbs — each member's personal "herbs I work with now" list
--
-- One row per (profile, herb) pair. The herb_id is a free-text string
-- matching either the mixology H[] id or the herb-engine-ids.json id
-- (these use different naming conventions but the rendering layer
-- normalises by display name).
--
-- The list answers "what am I currently studying / formulating / using
-- in my own practice" — a public-readable, member-curated index.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.member_herbs (
  profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  herb_id       text NOT NULL,
  herb_name     text,                                          -- display name snapshot
  note          text,                                          -- free text — why this herb right now
  added_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, herb_id)
);

CREATE INDEX IF NOT EXISTS member_herbs_added_idx
  ON public.member_herbs (added_at DESC);

ALTER TABLE public.member_herbs ENABLE ROW LEVEL SECURITY;

-- Read: anyone (member herb lists are public to encourage cross-pollination).
DROP POLICY IF EXISTS "member_herbs_select_public" ON public.member_herbs;
CREATE POLICY "member_herbs_select_public"
  ON public.member_herbs FOR SELECT USING (true);

-- Write: only the profile owner (matched via auth.uid via profiles.auth_user_id).
-- Admins can also write to seed entries for anyone.
DROP POLICY IF EXISTS "member_herbs_insert_own_or_admin" ON public.member_herbs;
CREATE POLICY "member_herbs_insert_own_or_admin"
  ON public.member_herbs FOR INSERT TO authenticated WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "member_herbs_update_own_or_admin" ON public.member_herbs;
CREATE POLICY "member_herbs_update_own_or_admin"
  ON public.member_herbs FOR UPDATE TO authenticated USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "member_herbs_delete_own_or_admin" ON public.member_herbs;
CREATE POLICY "member_herbs_delete_own_or_admin"
  ON public.member_herbs FOR DELETE TO authenticated USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

GRANT SELECT ON public.member_herbs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.member_herbs TO authenticated;
