-- ════════════════════════════════════════════════════════════════
-- supabase-medium-fixes.sql  ·  audit 2026-09-27, items M3 and M4
--
-- Idempotent. Safe to run more than once.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

-- ── M3 · Afghan Saffron: one stock row per size ─────────────────
-- The basket sells 'Afghan Saffron (3g)', '(5g)' and '(10g)', but stock
-- was one row called 'Afghan Saffron (' shared by all three sizes. Each
-- new row starts with the old shared count — open Admin → Product
-- inventory afterwards and set the real number for each size.
INSERT INTO public.product_inventory (product_id, stock_count)
SELECT v.pid,
       coalesce((SELECT stock_count FROM public.product_inventory
                  WHERE product_id = 'Afghan Saffron ('), 0)
  FROM (VALUES ('Afghan Saffron (3g)'),
               ('Afghan Saffron (5g)'),
               ('Afghan Saffron (10g)')) AS v(pid)
ON CONFLICT (product_id) DO NOTHING;

DELETE FROM public.product_inventory WHERE product_id = 'Afghan Saffron (';

-- ── M4 · Pin search_path on the two SECURITY DEFINER functions ──
-- A SECURITY DEFINER function runs with its owner's rights. Without a
-- fixed search_path, whoever calls it can put their own table or
-- function earlier on the path and have it run with those rights.
-- Supabase's linter flags both.
ALTER FUNCTION public.is_user_banned(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.prune_page_views()         SET search_path = public, pg_temp;

-- ── Confirm ─────────────────────────────────────────────────────
SELECT product_id, stock_count FROM public.product_inventory
 WHERE product_id LIKE 'Afghan Saffron%' ORDER BY product_id;

SELECT proname, proconfig FROM pg_proc
 WHERE proname IN ('is_user_banned', 'prune_page_views');
