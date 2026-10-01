-- ════════════════════════════════════════════════════════════════
-- supabase-board-tasks-2026-10-01.sql
--
-- Two cards for the admin planning board (Root → Admin → board), from
-- the audit of 29 Sep (docs/AUDIT-2026-09-29-RESPONSE.md). Robin,
-- 1 Oct: "code that task into my dashboard as task — same as §12".
--
-- Run in the Supabase SQL editor (it runs as the owner, so the board's
-- admin-only RLS does not stop it). Safe to re-run: a card is added only
-- when no card on the board has the same title.
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.board_cards (column_id, title, position)
SELECT 'todo', t.title,
       COALESCE((SELECT max(position) FROM public.board_cards WHERE column_id = 'todo'), 0) + t.n
FROM (VALUES
  (1, 'Audit #3 — practitioner validation: 20 practitioners review engine formulas blind (the audit''s Q8 design). Claude can build the review page when you have the names.'),
  (2, 'Audit §12 — talk to an EU/DE herbal-medicine lawyer before scaling the consumer funnel. The claims wording (D9) is the biggest lever on "medicinal product by presentation".')
) AS t(n, title)
WHERE NOT EXISTS (SELECT 1 FROM public.board_cards b WHERE b.title = t.title);

-- Check: select column_id, title from public.board_cards order by column_id, position;
