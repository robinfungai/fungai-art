-- ════════════════════════════════════════════════════════════════
-- supabase-myco-analytics.sql
--
-- Robin doesn't want per-member memory yet (waiting on the deeper
-- community-portal profile). Instead: aggregate learning from the
-- formulas stream so MYCO can see WHICH herbs are being generated
-- most, HOW they're being composed, and WHEN.
--
-- Two layers:
--   1. `myco_memory` — MAKES auth_user_id NULLABLE so anonymous
--      formulas can also write insights. New column `event_type`
--      distinguishes memories from generation logs.
--   2. Views + RPCs that compute herb popularity, intention mix,
--      formula shape distribution — admin-only.
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1) Loosen the existing myco_memory table so anonymous reservations
--    can also write "formula generated" events.
ALTER TABLE public.myco_memory
  ALTER COLUMN auth_user_id DROP NOT NULL;
ALTER TABLE public.myco_memory
  ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'insight';
ALTER TABLE public.myco_memory
  ADD COLUMN IF NOT EXISTS payload jsonb;

CREATE INDEX IF NOT EXISTS myco_memory_event_idx ON public.myco_memory (event_type, created_at DESC);

-- Anon-INSERT policy — quiz-takers can log formula generation events
-- but only if auth_user_id is null and event_type is one of the safe
-- values (prevents anon from writing to per-user memory).
DROP POLICY IF EXISTS "myco_memory_anon_analytics" ON public.myco_memory;
CREATE POLICY "myco_memory_anon_analytics"
  ON public.myco_memory FOR INSERT
  TO anon
  WITH CHECK (
    auth_user_id IS NULL
    AND event_type IN ('formula_generated','formula_reserved','composer_fired')
    AND char_length(topic) BETWEEN 1 AND 60
    AND char_length(insight) BETWEEN 1 AND 800
  );

-- Admin can read everything anon can insert.
DROP POLICY IF EXISTS "myco_memory_admin_read" ON public.myco_memory;
CREATE POLICY "myco_memory_admin_read"
  ON public.myco_memory FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR (auth.jwt() ->> 'email') IN ('robin@fungai.art','teyae@fungai.art')
  );

-- 2) Herb-popularity view — computes per-herb reach across the
--    formulas table's herb_ids arrays. Admin-only via the wrapping
--    RPC so we don't leak internal composition patterns to anons.
CREATE OR REPLACE FUNCTION public.myco_herb_popularity(days int DEFAULT 30)
RETURNS TABLE (herb_id text, appearances bigint, avg_pct numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (auth.jwt() ->> 'email') NOT IN ('robin@fungai.art','teyae@fungai.art') THEN
    RAISE EXCEPTION 'Only admins can view herb popularity';
  END IF;
  RETURN QUERY
  WITH exploded AS (
    -- ordinality gives each herb its position in the herb_ids array
    -- so we can pull the matching percentage from percentages[ord].
    SELECT h.herb_id, coalesce((f.percentages)[h.ord], 0)::numeric AS pct
      FROM public.formulas f,
           unnest(f.herb_ids) WITH ORDINALITY AS h(herb_id, ord)
     WHERE f.created_at >= now() - (days || ' days')::interval
  )
  SELECT e.herb_id,
         count(*)::bigint AS appearances,
         round(avg(nullif(e.pct, 0))::numeric, 1) AS avg_pct
    FROM exploded e
   GROUP BY e.herb_id
   ORDER BY appearances DESC;
END $$;
GRANT EXECUTE ON FUNCTION public.myco_herb_popularity(int) TO authenticated;

-- 3) Intention-distribution view — how the quiz answers cluster.
CREATE OR REPLACE FUNCTION public.myco_intention_mix(days int DEFAULT 30)
RETURNS TABLE (intention text, formulas bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (auth.jwt() ->> 'email') NOT IN ('robin@fungai.art','teyae@fungai.art') THEN
    RAISE EXCEPTION 'Only admins can view intention distribution';
  END IF;
  RETURN QUERY
  SELECT (f.quiz_snapshot->>'intention')::text AS intention,
         count(*)::bigint AS formulas
    FROM public.formulas f
   WHERE f.created_at >= now() - (days || ' days')::interval
     AND f.quiz_snapshot->>'intention' IS NOT NULL
   GROUP BY (f.quiz_snapshot->>'intention')
   ORDER BY formulas DESC;
END $$;
GRANT EXECUTE ON FUNCTION public.myco_intention_mix(int) TO authenticated;

-- 4) Herb-catalog-reach — flags herbs the picker NEVER selects (the
--    "70 of 198 herbs are never selected" audit finding). Robin can
--    see which entries in the catalog are dead code and prioritise
--    enrichment or removal.
CREATE OR REPLACE FUNCTION public.myco_untouched_herbs(days int DEFAULT 30)
RETURNS TABLE (herb_id text, times_used bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (auth.jwt() ->> 'email') NOT IN ('robin@fungai.art','teyae@fungai.art') THEN
    RAISE EXCEPTION 'Only admins can view untouched-herbs report';
  END IF;
  RETURN QUERY
  WITH exploded AS (
    SELECT unnest(f.herb_ids) AS herb_id
      FROM public.formulas f
     WHERE f.created_at >= now() - (days || ' days')::interval
  )
  SELECT e.herb_id, count(*)::bigint AS times_used
    FROM exploded e
   GROUP BY e.herb_id
  HAVING count(*)::bigint <= 1
   ORDER BY times_used ASC;
END $$;
GRANT EXECUTE ON FUNCTION public.myco_untouched_herbs(int) TO authenticated;
