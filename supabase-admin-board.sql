-- ════════════════════════════════════════════════════════════════
-- board_cards — the admin kanban board
--
-- A shared planning board on /community → Admin. Four columns
-- (backlog / todo / doing / done), drag to reorder or move, drag to
-- the barrel to delete.
--
-- Admin-only, at the DATA layer, not by hiding a button. Every policy
-- below calls public.fa_is_admin(), which reads
-- profiles.is_admin OR profiles.role = 'admin' — the same predicate
-- the Academy uses. NOT the hardcoded email allowlist in
-- global-nav.js; see docs/COMMUNITY-AUDIT.md §6 for why that list is
-- a stale duplicate of a fact this database already holds.
--
-- Depends on: supabase-academy-access.sql (defines fa_is_admin).
-- Run this ONCE. Idempotent.
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.board_cards (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Which column the card sits in. A CHECK rather than an enum so
  -- adding a fifth column later is an ALTER, not a type migration.
  column_id   text        NOT NULL DEFAULT 'backlog'
                          CHECK (column_id IN ('backlog','todo','doing','done')),
  title       text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  -- Sort key WITHIN a column. Fractional on purpose: dropping a card
  -- between two others averages its neighbours, so one card moving
  -- writes one row instead of renumbering the whole column.
  position    double precision NOT NULL DEFAULT 0,
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS board_cards_column_idx
  ON public.board_cards (column_id, position);

-- Keep updated_at honest. touch_updated_at() already exists in this
-- schema (see supabase-orders.sql / -inventory.sql), so reuse it
-- rather than defining a fourth copy.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_updated_at') THEN
    DROP TRIGGER IF EXISTS board_cards_touch ON public.board_cards;
    CREATE TRIGGER board_cards_touch
      BEFORE UPDATE ON public.board_cards
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

ALTER TABLE public.board_cards ENABLE ROW LEVEL SECURITY;

-- Admins only, for all four verbs. An ordinary member reading this
-- table over the REST API with the anon key gets nothing — the board
-- is not "hidden", it is denied.
DROP POLICY IF EXISTS "board_cards_admin_read"   ON public.board_cards;
CREATE POLICY "board_cards_admin_read"
  ON public.board_cards FOR SELECT
  TO authenticated
  USING (public.fa_is_admin());

DROP POLICY IF EXISTS "board_cards_admin_insert" ON public.board_cards;
CREATE POLICY "board_cards_admin_insert"
  ON public.board_cards FOR INSERT
  TO authenticated
  WITH CHECK (public.fa_is_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS "board_cards_admin_update" ON public.board_cards;
CREATE POLICY "board_cards_admin_update"
  ON public.board_cards FOR UPDATE
  TO authenticated
  USING (public.fa_is_admin())
  WITH CHECK (public.fa_is_admin());

DROP POLICY IF EXISTS "board_cards_admin_delete" ON public.board_cards;
CREATE POLICY "board_cards_admin_delete"
  ON public.board_cards FOR DELETE
  TO authenticated
  USING (public.fa_is_admin());

-- anon has no read path at all.
REVOKE ALL ON public.board_cards FROM anon;

-- ── Verify ──────────────────────────────────────────────────────
--   select column_id, count(*) from board_cards group by 1;
--
-- As a non-admin (or with the anon key) this must return 0 rows and
-- NOT an error — that is RLS working, rather than a missing table:
--   select * from board_cards;
--
-- If the board shows "admin only" while signed in as Robin, the cause
-- is almost always profiles.is_admin not being set on that row:
--   select character_name, is_admin, role from profiles
--    where auth_user_id = auth.uid();
