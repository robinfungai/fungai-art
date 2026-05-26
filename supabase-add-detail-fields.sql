-- ════════════════════════════════════════════════════════════════
-- Add missing fields for the public-facing profile detail view +
-- per-member feature restrictions controlled by admins.
--
-- Run once in Supabase SQL Editor. All three statements are additive
-- and IF NOT EXISTS-guarded, safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1. When the row was created (for "Member since · month + year")
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 2. Free-text "favourite plant or mushroom" the member writes themselves
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS favorite_plant text;

-- 3. Per-member feature restrictions — admin can block someone from
--    specific pages (e.g. 'foraging', 'extraction', 'mixology'). Empty
--    array = no restrictions = full access.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS restrictions text[] NOT NULL DEFAULT '{}';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
