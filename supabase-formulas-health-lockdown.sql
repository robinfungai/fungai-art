-- ════════════════════════════════════════════════════════════════
-- supabase-formulas-health-lockdown.sql
--
-- Found while writing the GDPR deletion procedure (17 Sep 2026).
--
-- TWO EXPOSURES on public.formulas, which /find-your-formula writes a
-- row into for every completed quiz:
--
--   1. HIGH — any SIGNED-IN member can read the whole base table,
--      including `quiz_snapshot`: the customer's quiz answers, which
--      contain health information (sleep, stress, medication flags,
--      pregnancy, age). supabase-formulas-lockdown.sql closed this for
--      anon but deliberately left `authenticated` with
--      "formulas_select_public USING (true)". Under GDPR this is Art. 9
--      special-category data readable by every community member.
--
--   2. HIGH — the `formulas_public` view, readable by ANYONE including
--      logged-out visitors, exposes `maker_label` (the customer's own
--      name, as typed on the reservation form) and `notes` (their
--      free-text answer to "the one thing that matters most", which is
--      frequently health narrative).
--
-- FIX, in three parts:
--   a) base-table SELECT is restricted to the row's author and admins;
--   b) the public view stops exposing name + free-text for rows that
--      came from the quiz (community-shared formulas are unaffected —
--      there the maker label and recipe notes are the point);
--   c) the quiz client stops sending the customer's name into this
--      table at all (see public/find-your-formula/index.html).
--
-- Community reads must use public.formulas_public, which is what the
-- academy page now does.
--
-- Idempotent. Run once in Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1) Base table: readable only by its author or an admin ───────────
DROP POLICY IF EXISTS "formulas_select_public" ON public.formulas;

CREATE POLICY "formulas_select_own_or_admin"
  ON public.formulas FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid() AND is_admin = true
    )
  );

-- anon lost base-table SELECT in supabase-formulas-lockdown.sql;
-- this re-asserts it in case that file was never applied.
REVOKE SELECT ON public.formulas FROM anon;

-- 2) Public view: no customer name, no free-text, for quiz rows ────
-- The view runs with the definer's rights, so it keeps working for
-- everyone while the base table stays locked.
CREATE OR REPLACE VIEW public.formulas_public AS
SELECT
  id, name, herb_ids, herb_names, percentages, bottle_ml,
  CASE WHEN source LIKE 'find-your-formula%' THEN NULL ELSE maker_label END AS maker_label,
  CASE WHEN source LIKE 'find-your-formula%' THEN NULL ELSE notes       END AS notes,
  author_id, source, created_at, updated_at
FROM public.formulas;

GRANT SELECT ON public.formulas_public TO anon, authenticated;

-- 3) Clean up what is already in there ─────────────────────────────
-- Names already written by past quiz-takers cannot be justified by any
-- purpose — the reservation email is where Robin gets the name. Clear
-- them. Comment this out if you want to inspect the rows first:
--   SELECT id, maker_label, created_at FROM public.formulas
--   WHERE source LIKE 'find-your-formula%' AND maker_label IS NOT NULL;
UPDATE public.formulas
   SET maker_label = NULL
 WHERE source LIKE 'find-your-formula%'
   AND maker_label IS NOT NULL;

-- Verify afterwards:
--   SET ROLE anon;
--   SELECT quiz_snapshot FROM public.formulas LIMIT 1;          -- must ERROR
--   SELECT maker_label, notes FROM public.formulas_public
--     WHERE source LIKE 'find-your-formula%' LIMIT 5;           -- must be NULL
--   RESET ROLE;
