-- ════════════════════════════════════════════════════════════════
-- supabase-fyf-claims.sql  ·  one MYCO call per request, even at the
--                             same moment
--
-- 2026-09-29 · external audit, finding #2 (D8 follow-up).
--
-- supabase-myco-budget.sql made the same request return the stored
-- formula — but only once that formula was stored. Two copies of one
-- request arriving together (a phone drops its connection mid-reveal,
-- the person taps Retry while the first is still with MYCO) both
-- found nothing, both called MYCO, and only the second INSERT failed.
--
-- Now a request claims its key BEFORE MYCO. Only the one that claims it
-- composes; a copy that arrives meanwhile waits for that formula and
-- returns it. A claim older than two minutes is taken over (the request
-- that held it died). Claims older than a day are cleared as new ones
-- are made.
--
-- If the code goes out before this file is run nothing breaks: the
-- claim is skipped and requests compose as before.
--
-- Idempotent. Safe to run more than once.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.fyf_compose_claims (
  request_key text        PRIMARY KEY CHECK (char_length(request_key) = 64),
  claimed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fyf_compose_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fyf_compose_claims FROM anon, authenticated;

-- true = this request holds the key and may compose; false = another
-- request is composing it right now. One statement, so two requests at
-- the same moment can never both get true.
CREATE OR REPLACE FUNCTION public.fyf_claim_request(p_key text, p_stale_seconds integer DEFAULT 120)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  got boolean;
BEGIN
  INSERT INTO public.fyf_compose_claims (request_key) VALUES (p_key)
  ON CONFLICT (request_key) DO UPDATE SET claimed_at = now()
    WHERE public.fyf_compose_claims.claimed_at < now() - make_interval(secs => p_stale_seconds);
  got := FOUND;
  DELETE FROM public.fyf_compose_claims WHERE claimed_at < now() - interval '1 day';
  RETURN got;
END;
$$;

-- Lets a request that failed after claiming hand the key back, so a
-- retry does not wait for a formula that will never come.
CREATE OR REPLACE FUNCTION public.fyf_release_request(p_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ DELETE FROM public.fyf_compose_claims WHERE request_key = p_key; $$;

REVOKE ALL ON FUNCTION public.fyf_claim_request(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fyf_release_request(text)        FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fyf_claim_request(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.fyf_release_request(text)        TO service_role;

-- Check:
--   SELECT public.fyf_claim_request(repeat('a', 64));   -- true
--   SELECT public.fyf_claim_request(repeat('a', 64));   -- false
--   SELECT public.fyf_release_request(repeat('a', 64));
