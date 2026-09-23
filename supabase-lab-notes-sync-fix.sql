-- ════════════════════════════════════════════════════════════════
-- supabase-lab-notes-sync-fix.sql  ·  Academy lab notes — sync repair
--
-- Symptom: every lab_notes row in the live database was created on or
-- before 2026-06-10. Everything written since sat in localStorage on
-- whichever device wrote it, and nobody was ever told.
--
-- The main cause was in the browser, not here: /community/academy/
-- loaded <script src="/supabase-client.js"> at the BOTTOM of the page,
-- below the inline scripts that did `await window.SBready`. That
-- promise did not exist yet, so the await resolved immediately with
-- window.SBclient still unset and the cloud fetch, the pending-note
-- retry and the magic-link reconcile all gave up before doing
-- anything. That is fixed in the page (the tag now sits in <head>).
--
-- This script is the database half: it makes sure the INSERT policy
-- the page relies on is actually the one installed, and it prints what
-- is really there so a second cause can be ruled in or out.
--
-- Idempotent. Safe to run more than once.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

-- ── 1 · What is actually installed right now ────────────────────
-- Read this BEFORE the change. If the INSERT row says
-- "lab_notes_insert_authed", or the with_check mentions fa_is_member(),
-- then anonymous portal writes were being refused (SQLSTATE 42501) and
-- that was the second half of the problem.
SELECT policyname, cmd, roles, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'lab_notes'
 ORDER BY cmd, policyname;

-- How stale is the cloud copy, and who has been writing to it?
SELECT count(*)                       AS notes,
       min(created_at)::date          AS oldest,
       max(created_at)::date          AS newest,
       count(*) FILTER (WHERE author_id IS NULL)   AS unattributed,
       count(DISTINCT author_name)                 AS distinct_authors
  FROM public.lab_notes;

-- Notes per month, so a gap is obvious at a glance.
SELECT to_char(created_at, 'YYYY-MM') AS month, count(*)
  FROM public.lab_notes
 GROUP BY 1 ORDER BY 1;

-- ── 2 · Re-assert the open INSERT policy, with the round-2 caps ──
-- Identical to supabase-hardening-round-2.sql §2a, repeated here so
-- this one file is enough to unstick the notebook. The caps are the
-- flood guard: they stay. The page now checks them client-side and
-- offers to split an over-long note instead of failing silently.
--
-- Anon is allowed on purpose: the spore portal carries identity in
-- localStorage and the Supabase JWT expires long before that does.
-- author_name preserves attribution when author_id is absent.
DROP POLICY IF EXISTS "lab_notes_insert_authed" ON public.lab_notes;
DROP POLICY IF EXISTS "lab_notes_insert_member" ON public.lab_notes;
DROP POLICY IF EXISTS "lab_notes_insert_open"   ON public.lab_notes;
CREATE POLICY "lab_notes_insert_open"
  ON public.lab_notes FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(chapter_id)  BETWEEN 1 AND 100
    AND char_length(text)    BETWEEN 1 AND 8000
    AND (author_name IS NULL OR char_length(author_name) <= 60)
  );

-- Reads stay public (supabase-lab-notes.sql): signed-out visitors are
-- meant to see the notebook. Re-assert it only if it went missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'lab_notes' AND cmd = 'SELECT'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "lab_notes_select_public"
        ON public.lab_notes FOR SELECT USING (true)
    $p$;
  END IF;
END $$;

GRANT SELECT, INSERT ON public.lab_notes TO anon, authenticated;
GRANT UPDATE, DELETE ON public.lab_notes TO authenticated;

-- ── 3 · Confirm ─────────────────────────────────────────────────
SELECT policyname, cmd, roles, with_check
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'lab_notes'
 ORDER BY cmd, policyname;

-- Then, from the browser: open /community/academy/ on a device that
-- has stuck notes. The bar above the chapters says how many are on
-- that device only; press "Sync now". If anything still fails it now
-- prints the database's own reason instead of staying quiet.
--
-- ⚠ supabase-academy-access.sql (P0.5) REPLACES the policies above
--    with members-only versions — reads and writes both start
--    requiring a live Supabase session. Run the sync repair first,
--    let the stuck notes flush, and only then consider P0.5. Running
--    them in the other order strands the same notes again.
