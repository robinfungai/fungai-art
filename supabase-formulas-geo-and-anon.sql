-- ════════════════════════════════════════════════════════════════
-- supabase-formulas-geo-and-anon.sql
--
-- Extends the `formulas` table (see supabase-formulas.sql) to:
--   1. Store edge-detected geo of the person who made the formula
--      (city, country, IP, timezone, coordinates). VPN bypasses this.
--   2. Store the resolved percentages array so the admin panel can
--      show the pour spec without recomputing.
--   3. Add an anon-INSERT RLS policy so unauthenticated find-your-
--      formula reservations land in the shared table (currently
--      401s because the previous policy required a signed-in author).
--   4. Add a per-formula `source` column so we can distinguish the
--      /find-your-formula reservations from the /mixology + /herbal-
--      engine-2 saves that already land here.
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ── 1. New columns ───────────────────────────────────────
ALTER TABLE public.formulas
  ADD COLUMN IF NOT EXISTS percentages   int[]         DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bottle_ml     int           DEFAULT 30,
  ADD COLUMN IF NOT EXISTS source        text          DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS origin_city   text,
  ADD COLUMN IF NOT EXISTS origin_country text,
  ADD COLUMN IF NOT EXISTS origin_subdivision text,
  ADD COLUMN IF NOT EXISTS origin_timezone text,
  ADD COLUMN IF NOT EXISTS origin_ip     inet,
  ADD COLUMN IF NOT EXISTS origin_lat    numeric(9,6),
  ADD COLUMN IF NOT EXISTS origin_lng    numeric(9,6),
  ADD COLUMN IF NOT EXISTS quiz_snapshot jsonb;

CREATE INDEX IF NOT EXISTS formulas_source_idx        ON public.formulas (source, created_at DESC);
CREATE INDEX IF NOT EXISTS formulas_origin_country_idx ON public.formulas (origin_country, created_at DESC);

-- ── 2. Anon-INSERT policy ────────────────────────────────
-- Un-authenticated find-your-formula reservations should be able to
-- write into this table. Constraints:
--   - author_id MUST be null (anons can't claim authorship of
--     someone else's formula)
--   - source MUST be 'find-your-formula' (so anon inserts can't
--     masquerade as mixology / herbal-engine saves)
--   - name capped at 120 chars
--   - herb_ids capped at 10 (prevents pool spam)
--
-- Rate limiting for spam happens at the Netlify /api layer, not the
-- DB, because the DB can't see per-IP.
DROP POLICY IF EXISTS "formulas_anon_insert_from_quiz" ON public.formulas;
CREATE POLICY "formulas_anon_insert_from_quiz"
  ON public.formulas FOR INSERT
  TO anon
  WITH CHECK (
    author_id IS NULL
    AND source = 'find-your-formula'
    AND char_length(name) BETWEEN 1 AND 120
    AND array_length(herb_ids, 1) <= 10
  );

-- ── 3. Admin-only visibility of the geo/IP columns ──────
-- The `formulas_select_public` policy from supabase-formulas.sql
-- already lets everyone SELECT formulas. That includes the new
-- origin_ip / origin_city / etc. To keep IP private, wrap those
-- reads in a security-definer view that returns them ONLY to
-- admins.
CREATE OR REPLACE VIEW public.formulas_public AS
SELECT
  id, name, herb_ids, herb_names, percentages, bottle_ml,
  maker_label, notes, author_id, source, created_at, updated_at
FROM public.formulas;

-- SECURITY DEFINER function for admin geo lookup — only Robin /
-- Stephanie can see the raw IP + city / country / etc.
CREATE OR REPLACE FUNCTION public.formula_origin(p_formula_id uuid)
RETURNS TABLE (
  city text, country text, subdivision text, timezone text,
  ip text, lat numeric, lng numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (auth.jwt() ->> 'email') NOT IN ('robin@fungai.art','teyae@fungai.art') THEN
    RAISE EXCEPTION 'Only admins can view formula origin data';
  END IF;
  RETURN QUERY
  SELECT f.origin_city, f.origin_country, f.origin_subdivision,
         f.origin_timezone, host(f.origin_ip)::text,
         f.origin_lat, f.origin_lng
    FROM public.formulas f WHERE f.id = p_formula_id;
END $$;

GRANT EXECUTE ON FUNCTION public.formula_origin(uuid) TO authenticated;

-- ── 4. Sanity check ─────────────────────────────────────
-- After running this in Supabase SQL editor, verify:
--   1. Anon reservations from /find-your-formula land in `formulas`
--      (check Netlify function log then Table Editor).
--   2. Admin panel's Formula Book on /community/academy/ shows them.
--   3. Admin-only formula_origin('<uuid>') returns geo; non-admin
--      call raises. Wire the "more information" button in the
--      Formula Book to call this RPC.
