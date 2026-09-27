-- ════════════════════════════════════════════════════════════════
-- supabase-lab-notes-signed-in.sql  ·  Only signed-in members write
--
-- Robin, 2026-09-27: "remove so that anyone can write lab notes (only
-- logged in)". Audit 2026-09-27, red item C6.
--
-- Until now lab_notes and snippets accepted INSERTs from `anon` — the
-- public key every page carries — because the portal's identity lived
-- in localStorage and members' sign-in sessions expired. That was fine
-- while a lab note was only a note. It is not fine now: MYCO retrieves
-- lab notes as "our own practice", and the monthly MYCO email proposes
-- herb-record edits from them. A stranger could plant a note MYCO then
-- repeats as Fungai Art's bench.
--
-- After this runs:
--   · INSERT needs a live sign-in (`authenticated`) AND a claimed
--     profile (profiles.auth_user_id = auth.uid()).
--   · The database stamps the author itself — author_id and the display
--     name come from the caller's own profile, so nobody can post under
--     another member's name.
--   · Reading is untouched (whatever SELECT policy is installed stays).
--   · The pages already cope: signed out, a note stays on the device,
--     marked "sign in to share", and syncs once the member signs in.
--
-- Idempotent. Safe to run more than once.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

-- ── 1 · Stamp the author from the caller's own profile ──────────
CREATE OR REPLACE FUNCTION public.fa_stamp_note_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me record;
BEGIN
  -- No auth.uid() means the service role (server code). anon cannot
  -- reach this at all after section 3, so leave server writes alone.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT id, character_name INTO me
    FROM public.profiles
   WHERE auth_user_id = auth.uid()
   LIMIT 1;
  IF me.id IS NULL THEN
    RAISE EXCEPTION 'Only a member with a claimed profile can write here.'
      USING ERRCODE = '42501';
  END IF;
  NEW.author_id := me.id;
  IF TG_TABLE_NAME = 'lab_notes' THEN
    NEW.author_name  := left(coalesce(me.character_name, NEW.author_name), 60);
  ELSE
    NEW.author_label := left(coalesce(me.character_name, NEW.author_label), 60);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lab_notes_stamp_author ON public.lab_notes;
CREATE TRIGGER lab_notes_stamp_author
  BEFORE INSERT ON public.lab_notes
  FOR EACH ROW EXECUTE FUNCTION public.fa_stamp_note_author();

DROP TRIGGER IF EXISTS snippets_stamp_author ON public.snippets;
CREATE TRIGGER snippets_stamp_author
  BEFORE INSERT ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION public.fa_stamp_note_author();

-- ── 2 · INSERT policies: signed in, own profile, same size limits ─
-- (Postgres checks WITH CHECK after BEFORE triggers, so author_id here
-- is the stamped one.)
DROP POLICY IF EXISTS "lab_notes_insert_open"   ON public.lab_notes;
DROP POLICY IF EXISTS "lab_notes_insert_authed" ON public.lab_notes;
DROP POLICY IF EXISTS "lab_notes_insert_member" ON public.lab_notes;
CREATE POLICY "lab_notes_insert_member"
  ON public.lab_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    char_length(chapter_id)  BETWEEN 1 AND 100
    AND char_length(text)    BETWEEN 1 AND 8000
    AND (author_name IS NULL OR char_length(author_name) <= 60)
    AND author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "snippets_insert_open"   ON public.snippets;
DROP POLICY IF EXISTS "snippets_insert_authed" ON public.snippets;
DROP POLICY IF EXISTS "snippets_insert_member" ON public.snippets;
CREATE POLICY "snippets_insert_member"
  ON public.snippets FOR INSERT
  TO authenticated
  WITH CHECK (
    (title IS NULL OR char_length(title) <= 200)
    AND char_length(body)  BETWEEN 1 AND 4000
    AND (kind IS NULL OR char_length(kind) <= 40)
    AND (author_label IS NULL OR char_length(author_label) <= 60)
    AND (reactions IS NULL OR reactions = 0)
    AND author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

-- ── 3 · Take the table permission away from anon too ────────────
-- Belt and braces: with no INSERT grant, an anon request is refused
-- before any policy is even consulted.
REVOKE INSERT ON public.lab_notes FROM anon;
REVOKE INSERT ON public.snippets  FROM anon;
GRANT  INSERT ON public.lab_notes TO authenticated;
GRANT  INSERT ON public.snippets  TO authenticated;

-- ── 4 · Confirm ─────────────────────────────────────────────────
-- Expect one INSERT row per table, roles {authenticated}.
SELECT tablename, policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename IN ('lab_notes', 'snippets')
 ORDER BY tablename, cmd, policyname;

-- ── 5 · Review what the open door let in ────────────────────────
-- Notes written without a linked profile. Most will be real members
-- whose session had expired (the reason the door was open); read them
-- and delete any you do not recognise:
--   DELETE FROM public.lab_notes WHERE id = '…';
SELECT id, chapter_id, author_name, created_at, left(text, 140) AS starts
  FROM public.lab_notes
 WHERE author_id IS NULL
 ORDER BY created_at DESC;

SELECT id, author_label, created_at, left(body, 140) AS starts
  FROM public.snippets
 WHERE author_id IS NULL
 ORDER BY created_at DESC;
