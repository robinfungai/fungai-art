-- ════════════════════════════════════════════════════════════════
-- Fungai Art · Supabase profiles dedupe
-- ════════════════════════════════════════════════════════════════
-- Run these queries one by one in:
--   Supabase dashboard → SQL Editor → New query
-- Read what each one says before running. They are non-destructive
-- until the final DELETE block.
-- ════════════════════════════════════════════════════════════════

-- ── 0. (One-time) Inspect what columns the profiles table actually has ──
-- Run this first so you know whether `created_at` / `updated_at` exist.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ── 1. See the duplicates ──────────────────────────────────────
-- Lists every name with more than one profile row.
SELECT
  LOWER(TRIM(character_name)) AS name_key,
  COUNT(*) AS copies,
  ARRAY_AGG(id) AS profile_ids,
  ARRAY_AGG(auth_user_id) AS linked_users
FROM profiles
WHERE character_name IS NOT NULL AND TRIM(character_name) <> ''
GROUP BY LOWER(TRIM(character_name))
HAVING COUNT(*) > 1
ORDER BY copies DESC;

-- ── 2. Inspect a specific name (e.g. Wissam) ───────────────────
-- Replace 'wissam' with whichever name you want to inspect.
-- Add `, created_at, updated_at` if those columns exist in your schema.
SELECT id, character_name, auth_user_id, email, role, node
FROM profiles
WHERE LOWER(TRIM(character_name)) = 'wissam';

-- ── 3. Preview what will be kept vs deleted ────────────────────
-- For each duplicated name, this picks ONE winner: prefer rows
-- linked to an auth user (real claimers), then most-recently updated.
-- The others are flagged for deletion.
WITH ranked AS (
  SELECT
    id,
    character_name,
    auth_user_id,
    updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(character_name))
      ORDER BY
        CASE WHEN auth_user_id IS NOT NULL THEN 0 ELSE 1 END,  -- claimed first
        updated_at DESC NULLS LAST,
        created_at DESC NULLS LAST
    ) AS rk
  FROM profiles
  WHERE character_name IS NOT NULL AND TRIM(character_name) <> ''
)
SELECT
  rk,
  CASE WHEN rk = 1 THEN '✓ KEEP' ELSE '✗ DELETE' END AS action,
  id,
  character_name,
  auth_user_id,
  updated_at
FROM ranked
WHERE character_name IN (
  -- only show names that actually have duplicates
  SELECT character_name FROM ranked GROUP BY character_name HAVING COUNT(*) > 1
)
ORDER BY LOWER(TRIM(character_name)), rk;

-- ── 4. THE DESTRUCTIVE STEP — DELETE duplicates ────────────────
-- Run only AFTER step 3 looks right.
-- This deletes every row that wasn't ranked #1 by step 3.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(character_name))
      ORDER BY
        CASE WHEN auth_user_id IS NOT NULL THEN 0 ELSE 1 END,
        updated_at DESC NULLS LAST,
        created_at DESC NULLS LAST
    ) AS rk
  FROM profiles
  WHERE character_name IS NOT NULL AND TRIM(character_name) <> ''
)
DELETE FROM profiles
WHERE id IN (SELECT id FROM ranked WHERE rk > 1);

-- ── 5. Verify ──────────────────────────────────────────────────
-- Step 1 again — should now return zero rows.
SELECT
  LOWER(TRIM(character_name)) AS name_key,
  COUNT(*) AS copies
FROM profiles
WHERE character_name IS NOT NULL AND TRIM(character_name) <> ''
GROUP BY LOWER(TRIM(character_name))
HAVING COUNT(*) > 1;

-- ── Optional: prevent future dupes at the database level ───────
-- This enforces "no two profiles can share the same character_name".
-- Only add this AFTER you've cleaned up — otherwise it will fail.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_character_name_unique
  ON profiles (LOWER(TRIM(character_name)))
  WHERE character_name IS NOT NULL AND TRIM(character_name) <> '';
