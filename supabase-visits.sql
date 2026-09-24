-- ════════════════════════════════════════════════════════════════
-- supabase-visits.sql
--
-- Visitor counting for fungai.art. Robin asked for traffic and
-- demographics by email; there was no analytics on the site at all, so
-- this is the store behind it.
--
-- ── WHAT IS DELIBERATELY NOT HERE ────────────────────────────────
-- No IP address. No city. No latitude or longitude. No cookie, no
-- localStorage id, no fingerprint, no cross-page visitor id. Nothing
-- that identifies a person or lets two page views be tied to the same
-- one.
--
-- That is not caution for its own sake: the reservation flow was already
-- cut back to COUNTRY ONLY under GDPR minimisation, and
-- tests/geo-minimisation-verify.cjs fails the build if city or lat/lng
-- creeps back in. Analytics collecting more than the checkout does would
-- make that policy a fiction. tests/visits-minimisation-verify.cjs holds
-- this file to the same line.
--
-- The practical consequence: these are PAGE VIEWS, not unique visitors.
-- A report that says "412 views from Germany" is honest; one that says
-- "180 unique visitors" would require identifying them.
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.page_views (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- Which page. Path only, query string stripped by the collector so a
  -- magic-link token or an email in a URL can never land here.
  path        text NOT NULL,

  -- Country from the Netlify edge header. Two letters, nothing finer.
  country     text,

  -- Coarse buckets, derived from the User-Agent and then thrown away.
  -- The UA string itself is never stored: it is close enough to a
  -- fingerprint when combined with anything else.
  device      text,            -- mobile | tablet | desktop
  os          text,            -- windows | macos | ios | android | linux | other
  browser     text,            -- chrome | safari | firefox | edge | other

  -- Where they came from. HOST only, never the full referring URL —
  -- a full referrer can carry someone's search terms.
  referrer    text,            -- e.g. instagram.com, google, direct

  -- Primary language tag, e.g. 'de', 'en', 'sv'. Useful, coarse.
  lang        text,

  is_bot      boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS page_views_created_idx ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_country_idx ON public.page_views (country, created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx    ON public.page_views (path, created_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- ── Writes ───────────────────────────────────────────────────────
-- Only the collector function writes, and it uses the anon key like the
-- rest of the site. The CHECK constraints are the real guard: they cap
-- every field's length so a hostile caller cannot use this table as free
-- storage, and they forbid a path containing '?' or '#' so a token in a
-- query string is rejected at the database rather than trusted to have
-- been stripped upstream.
DROP POLICY IF EXISTS "page_views_anon_insert" ON public.page_views;
CREATE POLICY "page_views_anon_insert"
  ON public.page_views FOR INSERT
  TO anon
  WITH CHECK (
    char_length(path) BETWEEN 1 AND 160
    AND path LIKE '/%'
    AND path NOT LIKE '%?%'
    AND path NOT LIKE '%#%'
    AND (country  IS NULL OR char_length(country)  <= 2)
    AND (device   IS NULL OR char_length(device)   <= 10)
    AND (os       IS NULL OR char_length(os)       <= 10)
    AND (browser  IS NULL OR char_length(browser)  <= 10)
    AND (referrer IS NULL OR char_length(referrer) <= 64)
    AND (lang     IS NULL OR char_length(lang)     <= 8)
  );

-- ── Reads ────────────────────────────────────────────────────────
-- Nobody reads with the anon key. Not even aggregate counts: the digest
-- runs with the service role, and leaving anon able to count would let
-- anyone on the internet measure Robin's traffic.
DROP POLICY IF EXISTS "page_views_anon_select" ON public.page_views;

-- ── Retention ────────────────────────────────────────────────────
-- Ninety days. The digest only ever looks back a fortnight, and keeping
-- rows longer than they are used is the opposite of minimisation.
-- Schedule with pg_cron if available:
--   select cron.schedule('prune-page-views', '0 4 * * *',
--     $$ delete from public.page_views where created_at < now() - interval '90 days' $$);
CREATE OR REPLACE FUNCTION public.prune_page_views()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.page_views WHERE created_at < now() - interval '90 days';
$$;
