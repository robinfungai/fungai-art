-- ════════════════════════════════════════════════════════════════
-- supabase-myco-budget.sql  ·  daily MYCO budget + one formula per
--                              request
--
-- 2026-09-28 · audit decision D8 and audit P0 #11.
--
-- 1 · A daily cap on MYCO calls from /api/fyf/compose, counted here so
--     it holds across every Netlify instance (the old rate limit was per
--     instance, in memory). Past the cap the formula maker still works:
--     it composes with the deterministic engine, no AI call, no cost.
--     The cap itself is the Netlify env var FYF_MYCO_DAILY_LIMIT
--     (default 100). The day turns over at midnight Berlin time.
--
-- 2 · request_key: the page sends a request id with each reveal. The
--     same id with the same answers returns the formula already stored
--     instead of composing (and paying for MYCO) again — a double click,
--     a retry after a dropped connection, a refresh mid-reveal.
--
-- Run this BEFORE deploying the code that uses it. (If the code goes
-- out first nothing breaks: MYCO is skipped until this file is run, and
-- formulas are stored without the new column.)
--
-- Idempotent. Safe to run more than once.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

-- 1 · Daily MYCO budget ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.myco_daily_usage (
  day   date    PRIMARY KEY,
  calls integer NOT NULL DEFAULT 0 CHECK (calls >= 0)
);

ALTER TABLE public.myco_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.myco_daily_usage FROM anon, authenticated;
GRANT SELECT ON public.myco_daily_usage TO service_role;

-- Takes one call from today's budget. true = go ahead; false = the cap
-- is reached (the count is not raised). One statement, so two requests
-- at the same moment can never both take the last call.
CREATE OR REPLACE FUNCTION public.myco_budget_take(p_limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day   date := (now() AT TIME ZONE 'Europe/Berlin')::date;
  v_calls integer;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RETURN false;
  END IF;
  INSERT INTO public.myco_daily_usage AS u (day, calls)
  VALUES (v_day, 1)
  ON CONFLICT (day) DO UPDATE
    SET calls = u.calls + 1
    WHERE u.calls < p_limit
  RETURNING calls INTO v_calls;
  RETURN v_calls IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.myco_budget_take(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.myco_budget_take(integer) TO service_role;

-- How many MYCO calls, day by day:
--   SELECT day, calls FROM public.myco_daily_usage ORDER BY day DESC LIMIT 14;

-- 2 · One formula per request ------------------------------------------
ALTER TABLE public.fyf_formulas ADD COLUMN IF NOT EXISTS request_key text;

CREATE UNIQUE INDEX IF NOT EXISTS fyf_formulas_request_key_uniq
  ON public.fyf_formulas (request_key) WHERE request_key IS NOT NULL;
