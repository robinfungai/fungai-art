-- ════════════════════════════════════════════════════════════════
-- supabase-fyf-retention.sql  ·  delete unreserved formula readings
--                               after 30 days
--
-- 2026-09-28 · audit decision D6 (Robin: 30 days).
--
-- Every Find Your Formula reveal stores the quiz answers (health
-- information) and the formula in public.fyf_formulas. Until now they
-- were kept forever, and nothing in the database said which ones were
-- reserved — a reservation only sent two emails.
--
-- After this file:
--   · reserved_at        set by /api/reserve-formula when Robin's
--                        reservation email goes out;
--   · retention_tracked  set true by the new /api/fyf/compose only.
--                        Rows written by the OLD code (the live site
--                        until the next deploy) stay false, because a
--                        reservation of one of them would not have been
--                        marked — the nightly purge never touches them.
--   · every night, rows that are tracked, unreserved and older than
--     30 days are deleted.
--
-- Rows from before the deploy are handled once, by hand — step 4.
--
-- Idempotent. Safe to run more than once.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- If the first line fails ("extension pg_cron is not available"),
-- switch it on under Database → Extensions → pg_cron, then run the
-- whole file again.
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1 · Mark reservations ------------------------------------------------
ALTER TABLE public.fyf_formulas ADD COLUMN IF NOT EXISTS reserved_at       timestamptz;
ALTER TABLE public.fyf_formulas ADD COLUMN IF NOT EXISTS retention_tracked boolean NOT NULL DEFAULT false;

-- reserve-formula writes reserved_at and nothing else.
GRANT UPDATE (reserved_at) ON public.fyf_formulas TO service_role;

CREATE INDEX IF NOT EXISTS fyf_formulas_unreserved_idx
  ON public.fyf_formulas (created_at) WHERE reserved_at IS NULL;

-- 2 · The purge --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fyf_purge_unreserved(p_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF p_days IS NULL OR p_days < 1 THEN
    RAISE EXCEPTION 'p_days must be at least 1';
  END IF;
  DELETE FROM public.fyf_formulas
   WHERE retention_tracked
     AND reserved_at IS NULL
     AND created_at < now() - make_interval(days => p_days);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.fyf_purge_unreserved(integer) FROM PUBLIC, anon, authenticated;

-- 3 · Every night at 03:17 UTC ----------------------------------------
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'fyf-purge-unreserved';
SELECT cron.schedule('fyf-purge-unreserved', '17 3 * * *', $cron$SELECT public.fyf_purge_unreserved(30)$cron$);

-- Check it is there:
--   SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'fyf-purge-unreserved';
-- See what it did:
--   SELECT start_time, status, return_message FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fyf-purge-unreserved')
--    ORDER BY start_time DESC LIMIT 10;

-- 4 · Rows from before the deploy — ONCE, BY HAND, AFTER THE DEPLOY ----
-- These are the rows with retention_tracked = false. Do not run 4c
-- until you have done 4b, or reserved formulas older than 30 days go.
--
-- 4a · How many, and how old:
--   SELECT count(*), min(created_at), max(created_at)
--     FROM public.fyf_formulas WHERE NOT retention_tracked;
--
-- 4b · Protect the ones that were reserved. Their ids are in your
--      reservation emails, on the line "server-authoritative · id fyf_…":
--   UPDATE public.fyf_formulas SET reserved_at = created_at
--    WHERE id IN ('fyf_…', 'fyf_…');
--
-- 4c · Then delete the other old ones:
--   DELETE FROM public.fyf_formulas
--    WHERE NOT retention_tracked AND reserved_at IS NULL
--      AND created_at < now() - interval '30 days';
