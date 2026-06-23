-- ════════════════════════════════════════════════════════════════
-- supabase-indexes.sql — hot-path indexes for RLS policy lookups
--
-- Why: every RLS policy on lab_notes, member_herbs, formulas,
-- snippets, etc. joins through profiles.auth_user_id = auth.uid().
-- Without an index on that column every write does a sequential scan
-- of profiles. At 100 members it's instant; at 500 it stalls; at
-- 1000+ concurrent write storms (bulk imports, mass logins) lock the
-- table and time out.
--
-- These are read-only optimizations. Adding an index can't break
-- correctness; the worst it does is occupy a few MB of disk and
-- slow writes by single-digit microseconds. Use CONCURRENTLY so the
-- index build does not lock the table during creation.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query →
-- paste this file → Run. Safe to re-run (IF NOT EXISTS).
--
-- IMPORTANT: CREATE INDEX CONCURRENTLY cannot run inside an explicit
-- transaction block. Supabase's SQL Editor wraps each statement
-- separately, so this works there — but if you ever migrate to a
-- proper migration tool, split these into separate transactions.
-- ════════════════════════════════════════════════════════════════

-- profiles.auth_user_id — the single hottest RLS lookup column.
-- Every policy of the form
--   author_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
-- hits this index.
CREATE INDEX CONCURRENTLY IF NOT EXISTS profiles_auth_user_id_idx
  ON public.profiles (auth_user_id);

-- lab_notes.author_id — for "show me my notes" queries and admin
-- moderation listings. The existing (chapter_id, created_at DESC)
-- index covers per-chapter reads; this covers per-author reads.
CREATE INDEX CONCURRENTLY IF NOT EXISTS lab_notes_author_id_idx
  ON public.lab_notes (author_id);

-- member_herbs.profile_id — "show me my herbs" is the entire UX
-- around member herb collections. Current index is (added_at DESC)
-- which only helps "newest first across everyone" — backwards.
CREATE INDEX CONCURRENTLY IF NOT EXISTS member_herbs_profile_id_idx
  ON public.member_herbs (profile_id);

-- formulas.author_id — for the "my saved formulas" tab in the
-- academy + portal. Existing index is (created_at DESC) only.
CREATE INDEX CONCURRENTLY IF NOT EXISTS formulas_author_id_idx
  ON public.formulas (author_id);

-- snippets.author_id — same logic. Academy "my snippets" view.
CREATE INDEX CONCURRENTLY IF NOT EXISTS snippets_author_id_idx
  ON public.snippets (author_id);

-- profiles.is_admin — admin RLS policies do
--   EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = uid AND is_admin = true)
-- A partial index where is_admin = true is tiny (just the 2-3 admin
-- rows) and lets the planner skip the rest of the table entirely on
-- every admin-action check.
CREATE INDEX CONCURRENTLY IF NOT EXISTS profiles_is_admin_partial_idx
  ON public.profiles (auth_user_id)
  WHERE is_admin = true;

-- Optional but cheap: profiles.contact — used by the global-nav
-- hydration path (claim unclaimed profile by email when fetchMine
-- returns null on a fresh device). Without this, the email-based
-- profile lookup scans the full profiles table.
CREATE INDEX CONCURRENTLY IF NOT EXISTS profiles_contact_idx
  ON public.profiles (lower(contact));
