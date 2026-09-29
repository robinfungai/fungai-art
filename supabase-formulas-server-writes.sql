-- ════════════════════════════════════════════════════════════════
-- supabase-formulas-server-writes.sql  ·  only the server writes Find
--                                         your formula entries into
--                                         the Formula Book
--
-- 2026-09-29 · external audit, finding #4.
--
-- Until now the formula pages inserted the Formula Book entry from the
-- browser after a reservation:
--   · anon could INSERT any row marked source = 'find-your-formula'
--     (policy formulas_anon_insert_from_quiz) — so anyone could put any
--     name, herbs and percentages into the public book as if the
--     formula maker had made them;
--   · signed-in members could INSERT anything at all (WITH CHECK true),
--     including rows credited to another member's profile;
--   · every entry carried quiz_snapshot — the customer's health answers
--     — into a second table that the 30-day purge never touches.
--
-- Now reserve-formula writes the entry itself, from the formula stored
-- in fyf_formulas, with the service role (which RLS does not apply to),
-- without notes, name or quiz answers. So:
--   1. anon may not insert into formulas at all;
--   2. members may insert their own Mixology / analysis saves — credited
--      to themselves or to no one, never marked as a Find your formula
--      entry, never with quiz answers.
--
-- Run AFTER the code that goes with it is live (reserve-formula writes
-- the entry; the formula pages no longer do). Before that, the live
-- pages would simply stop adding entries to the book.
--
-- Idempotent. Safe to run more than once.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

-- 1 · No anonymous inserts ---------------------------------------------
DROP POLICY IF EXISTS "formulas_anon_insert_from_quiz" ON public.formulas;
REVOKE INSERT ON public.formulas FROM anon;

-- 2 · Members: their own saves only ------------------------------------
DROP POLICY IF EXISTS "formulas_insert_authed" ON public.formulas;
CREATE POLICY "formulas_insert_authed"
  ON public.formulas FOR INSERT
  TO authenticated
  WITH CHECK (
    (source IS NULL OR source NOT LIKE 'find-your-formula%')
    AND quiz_snapshot IS NULL
    AND (author_id IS NULL
         OR author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()))
  );

-- 3 · Optional — the health answers already copied in ------------------
-- Every reserved formula's answers are also in fyf_formulas (kept,
-- because reserved) and in Robin's reservation email. Formula Book rows
-- older than fyf_formulas (before 2026-09-11) have them only here.
-- Look first, then clear them when you are ready — this cannot be undone:
--   SELECT count(*), min(created_at), max(created_at)
--     FROM public.formulas WHERE quiz_snapshot IS NOT NULL;
--   UPDATE public.formulas SET quiz_snapshot = NULL WHERE quiz_snapshot IS NOT NULL;

-- Check:
--   SELECT policyname, roles, with_check FROM pg_policies
--    WHERE tablename = 'formulas' AND cmd = 'INSERT';
--   -- one row: formulas_insert_authed, {authenticated}
