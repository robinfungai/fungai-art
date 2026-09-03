-- ════════════════════════════════════════════════════════════════
-- supabase-hardening-round-2.sql
--
-- Follow-up to the first audit sweep. New findings from Robin's full
-- pg_policies + pg_tables dump (2026-09-03):
--
--   1. HIGH — "Users can update their own profile" UPDATE policy has
--      WITH CHECK = NULL. Any signed-in user can flip is_admin = true
--      on themselves. This is a different vector than the claim-UPDATE
--      hole we already closed; this one hits every existing member.
--
--   2. HIGH — lab_notes and snippets have INSERT policies with
--      WITH CHECK (true). Open to anon + no size / format limits.
--      Flood / DoS / storage-cost vector. Preserve the open-write
--      design intent (Robin left them open on purpose so the spore
--      portal can post without a Supabase session) but bound the
--      per-row size so one POST can't drop 10MB of garbage.
--
--   3. HIGH — saved_formulas has "open_delete USING (true)" plus
--      "open_insert WITH CHECK (true)" plus "open_read USING (true)".
--      The table backs an anonymous device_id bookmark-sync system
--      (src/App.tsx) — no auth. Anyone can wipe every row of every
--      device with one DELETE. Fix: scope DELETE to require matching
--      device_id (still spoofable but blocks accidental / malicious
--      full wipes) and cap INSERT payload sizes. If Robin later
--      moves saved formulas to authenticated storage, we can drop
--      these policies entirely.
--
--   4. MEDIUM — contraindication_matrix, medication_interactions,
--      user_recommendations have RLS DISABLED (confirmed by Robin's
--      pg_tables screenshot). Even at 0 rows this is a landmine — any
--      future GRANT to anon or authenticated would immediately expose
--      full read/write. Enable RLS on all three and revoke role
--      grants so they default-deny.
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ─── 1) profiles UPDATE self-escalation ──────────────────────────
-- ALTER POLICY (not DROP+CREATE) so the policy is never briefly
-- absent — same pattern as the claim-UPDATE lockdown.
ALTER POLICY "Users can update their own profile"
  ON public.profiles
  USING (auth.uid() = auth_user_id)
  WITH CHECK (
    auth.uid() = auth_user_id
    AND (is_admin IS DISTINCT FROM true)
  );

-- ─── 2a) lab_notes — bound per-row size on anon INSERTs ──────────
DROP POLICY IF EXISTS "lab_notes_insert_open" ON public.lab_notes;
CREATE POLICY "lab_notes_insert_open"
  ON public.lab_notes FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(chapter_id)  BETWEEN 1 AND 100
    AND char_length(text)    BETWEEN 1 AND 8000
    AND (author_name IS NULL OR char_length(author_name) <= 60)
  );

-- ─── 2b) snippets — same shape ───────────────────────────────────
DROP POLICY IF EXISTS "snippets_insert_open" ON public.snippets;
CREATE POLICY "snippets_insert_open"
  ON public.snippets FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (title IS NULL OR char_length(title) <= 200)
    AND char_length(body)  BETWEEN 1 AND 4000
    AND (kind IS NULL OR char_length(kind) <= 40)
    AND (author_label IS NULL OR char_length(author_label) <= 60)
    -- reactions must start at 0 — the spore portal increments it
    -- via a separate UPDATE flow; nobody should ship a pre-boosted row.
    AND (reactions IS NULL OR reactions = 0)
  );

-- ─── 3) saved_formulas — scope destructive ops by device_id ──────
-- Table lives at src/App.tsx for anonymous localStorage-backed
-- bookmark sync. Device_id is client-provided and forgeable; the
-- best we can do without a real auth session is require the DELETE
-- to name a device_id explicitly, so nobody can wipe every row with
-- an unqualified DELETE. If saved_formulas moves to authenticated
-- storage later, replace these policies with own-row scoping.
DROP POLICY IF EXISTS "open_delete" ON public.saved_formulas;
DROP POLICY IF EXISTS "open_insert" ON public.saved_formulas;
DROP POLICY IF EXISTS "open_read"   ON public.saved_formulas;

-- Read stays open — bookmark lists are non-secret.
CREATE POLICY "saved_formulas_read_public"
  ON public.saved_formulas FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert bounded by array + string caps to stop payload flooding.
CREATE POLICY "saved_formulas_insert_bounded"
  ON public.saved_formulas FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(device_id) BETWEEN 4 AND 80
    AND (
      herb_ids IS NULL
      OR coalesce(array_length(herb_ids, 1), 0) BETWEEN 0 AND 50
    )
    AND (
      herb_names IS NULL
      OR coalesce(array_length(herb_names, 1), 0) BETWEEN 0 AND 50
    )
    AND (temp_label IS NULL OR char_length(temp_label) <= 60)
  );

-- Delete requires an explicit device_id match. Postgres RLS runs the
-- USING as a predicate — a WHERE clause on the DELETE that doesn't
-- include a device_id filter can't satisfy this, so unqualified
-- "DELETE FROM saved_formulas" returns 0 rows affected instead of
-- wiping the table.
CREATE POLICY "saved_formulas_delete_by_device"
  ON public.saved_formulas FOR DELETE
  TO anon, authenticated
  USING (
    device_id IS NOT NULL
    AND char_length(device_id) BETWEEN 4 AND 80
  );

-- ─── 4) Enable RLS on the three unprotected tables ───────────────
-- Robin's pg_tables dump showed rowsecurity=false for these three.
-- Enable RLS + revoke role grants; no policies means default-deny.
-- If these tables are later given real use, they need their own
-- policy set — do NOT ship policies here that guess at intent.
ALTER TABLE public.contraindication_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recommendations    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.contraindication_matrix FROM anon, authenticated;
REVOKE ALL ON public.medication_interactions FROM anon, authenticated;
REVOKE ALL ON public.user_recommendations    FROM anon, authenticated;

-- ── Verify — paste-and-check block ───────────────────────────────
--
-- 1. profiles UPDATE now blocks is_admin self-flip:
SELECT policyname, cmd, with_check
  FROM pg_policies
 WHERE tablename = 'profiles'
   AND policyname = 'Users can update their own profile';
--    Expected with_check:
--    ((auth.uid() = auth_user_id) AND (is_admin IS DISTINCT FROM true))
--
-- 2. lab_notes / snippets INSERT policies now have length caps:
SELECT tablename, policyname, cmd, with_check
  FROM pg_policies
 WHERE tablename IN ('lab_notes', 'snippets')
   AND cmd = 'INSERT';
--
-- 3. saved_formulas has three new bounded policies:
SELECT policyname, cmd, qual, with_check
  FROM pg_policies
 WHERE tablename = 'saved_formulas';
--
-- 4. The three previously-unprotected tables now have RLS on:
SELECT tablename, rowsecurity AS rls_enabled
  FROM pg_tables
 WHERE tablename IN ('contraindication_matrix',
                     'medication_interactions',
                     'user_recommendations');
--    All three should show rls_enabled = true.
