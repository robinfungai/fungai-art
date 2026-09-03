-- ════════════════════════════════════════════════════════════════
-- supabase-formulas-lockdown.sql
--
-- Audit finding (2026-09-03): the base `public.formulas` table lets
-- anon SELECT everything, including the geo columns added by
-- supabase-formulas-geo-and-anon.sql (origin_ip, origin_city,
-- origin_country, origin_lat, origin_lng, origin_timezone,
-- quiz_snapshot). The `formulas_public` view was created to expose
-- only safe columns, but nothing forced anon through the view.
--
-- Fix: revoke anon SELECT on the base table + grant SELECT on the
-- view. Authenticated reads (admin Formula Book, member reads)
-- keep working — they run with the authenticated role, which is
-- unaffected by this migration. Anon INSERT for /find-your-formula
-- reservations is unaffected.
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1) Revoke anon direct-table SELECT — closes the door on
--    SELECT origin_ip, quiz_snapshot FROM public.formulas.
REVOKE SELECT ON public.formulas FROM anon;

-- 2) Route anon reads through the safe view instead. The view
--    (defined in supabase-formulas-geo-and-anon.sql) only exposes:
--    id, name, herb_ids, herb_names, percentages, bottle_ml,
--    maker_label, notes, author_id, source, created_at, updated_at.
GRANT SELECT ON public.formulas_public TO anon, authenticated;

-- 3) Sanity: authenticated retains full base-table SELECT (via the
--    supabase-formulas.sql grant); only anon is affected. If a
--    signed-in member currently reads .from('formulas') for their
--    own reasons, they continue to succeed because the SELECT
--    policy USING (true) is still in effect for authenticated.
--    Only anon is downgraded.

-- To verify after applying:
--   SET ROLE anon;
--   SELECT origin_ip FROM public.formulas LIMIT 1;   -- must ERROR (permission denied)
--   SELECT id, name FROM public.formulas_public LIMIT 1;  -- must work
--   RESET ROLE;
