-- ════════════════════════════════════════════════════════════════
-- lab_notes — shared lab notebook backing for /community/academy
--
-- Why: previously lab notes were localStorage-only. That meant a
-- member's notes lived on whatever device they wrote them on, no one
-- else could see them, and a browser clear wiped them entirely. Robin
-- asked: "i need to see them as any member or non member" — so notes
-- need to be shared cross-device and publicly readable.
--
-- Shape: one row per lab entry. chapter_id is the LAB_CHAPTERS id
-- (microbes / spagyric / formulas / contra / tonics / foraging /
-- mycology / ceremony). Author tracked by profiles.id, with the
-- character name denormalised for fast display.
--
-- RLS:
--   • SELECT: anyone (public + authenticated). Robin wants visitors
--     to see notes too.
--   • INSERT: authenticated members only (auth.uid() not null).
--   • UPDATE / DELETE: only the author of the row (or admin).
--
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query →
-- paste this file → Run.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lab_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id    text NOT NULL,
  text          text NOT NULL,
  author_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-chapter fetch
CREATE INDEX IF NOT EXISTS lab_notes_chapter_idx
  ON public.lab_notes (chapter_id, created_at DESC);

-- Bookkeeping trigger to keep updated_at honest
CREATE OR REPLACE FUNCTION public.lab_notes_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lab_notes_updated_at ON public.lab_notes;
CREATE TRIGGER lab_notes_updated_at
  BEFORE UPDATE ON public.lab_notes
  FOR EACH ROW EXECUTE FUNCTION public.lab_notes_set_updated_at();

ALTER TABLE public.lab_notes ENABLE ROW LEVEL SECURITY;

-- ── Policies ────────────────────────────────────────────────────

-- Anyone can read. Visitors + members + anonymous all see the notes.
DROP POLICY IF EXISTS "lab_notes_select_public" ON public.lab_notes;
CREATE POLICY "lab_notes_select_public"
  ON public.lab_notes FOR SELECT
  USING (true);

-- Insert: anon + authenticated. The previous policy required a live
-- Supabase auth session, but the spore portal carries identity in
-- localStorage and the auth session frequently expires. Members like
-- Douglas were writing notes that landed locally but never reached
-- the cloud because pushLabNoteToCloud() silently returned when
-- getUser() came back null. Allowing anon writes lines the policy
-- up with the actual identity flow; author_name on the row preserves
-- attribution even without an FK link to profiles.
DROP POLICY IF EXISTS "lab_notes_insert_authed" ON public.lab_notes;
DROP POLICY IF EXISTS "lab_notes_insert_open"   ON public.lab_notes;
CREATE POLICY "lab_notes_insert_open"
  ON public.lab_notes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Authors can update their own notes. Admins can update any.
-- Fixed column reference: profiles.is_admin (not .admin) — the wrong
-- name made every admin update/delete fail silently with code 42703.
DROP POLICY IF EXISTS "lab_notes_update_own" ON public.lab_notes;
CREATE POLICY "lab_notes_update_own"
  ON public.lab_notes FOR UPDATE
  TO authenticated
  USING (
    author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- Authors can delete their own notes. Admins can delete any.
DROP POLICY IF EXISTS "lab_notes_delete_own" ON public.lab_notes;
CREATE POLICY "lab_notes_delete_own"
  ON public.lab_notes FOR DELETE
  TO authenticated
  USING (
    author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

GRANT SELECT ON public.lab_notes TO anon, authenticated;
GRANT INSERT ON public.lab_notes TO anon, authenticated;
GRANT UPDATE, DELETE ON public.lab_notes TO authenticated;
