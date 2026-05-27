-- ════════════════════════════════════════════════════════════════
-- Fungai Art · Invite codes table + validation RPC
-- ════════════════════════════════════════════════════════════════
-- Replaces the hardcoded `INVITE_CODE = '5858'` in
-- public/community/spore/app-living.jsx. Lets admins create / disable
-- / rotate codes from the admin panel without a code deploy.
--
-- Self-contained — runs in any order vs the other supabase-*.sql
-- files. All statements are idempotent (safe to re-run).
-- ════════════════════════════════════════════════════════════════


-- ── 0. Prerequisites (defensive — usually already present) ────────
-- The RLS policies below reference public.is_admin_user(uuid) and
-- the profiles.is_admin column. Both are also created by
-- supabase-add-detail-fields.sql; duplicating them here just means
-- this file works standalone, in any order.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = uid AND is_admin = true
  );
$$;


-- ── 1. Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invite_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,            -- normalised to lowercase by trigger below
  label       text,                             -- admin note ("Garbicz batch", "Berlin walk-in")
  max_uses    int,                              -- NULL = unlimited
  uses        int NOT NULL DEFAULT 0,
  expires_at  timestamptz,                      -- NULL = never expires
  disabled    boolean NOT NULL DEFAULT false,   -- kill switch without deleting (preserves audit)
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE  invite_codes IS 'Invite codes gating the + Create profile flow on /community. Validated server-side via validate_invite_code().';
COMMENT ON COLUMN invite_codes.max_uses IS 'NULL = unlimited. uses >= max_uses returns "exhausted".';
COMMENT ON COLUMN invite_codes.disabled IS 'Soft delete — disabled codes return "disabled" reason, but stay in the table for audit.';


-- ── 2. Normalise code on write (lowercase, trim) ─────────────────
-- So "GARBICZ" and "garbicz" can't both exist. The UNIQUE constraint
-- + trigger together enforce case-insensitive uniqueness.
CREATE OR REPLACE FUNCTION normalise_invite_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.code := LOWER(TRIM(NEW.code));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invite_codes_normalise ON invite_codes;
CREATE TRIGGER invite_codes_normalise
  BEFORE INSERT OR UPDATE ON invite_codes
  FOR EACH ROW EXECUTE FUNCTION normalise_invite_code();


-- ── 3. Enable RLS ────────────────────────────────────────────────
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;


-- ── 4. RLS — only admins touch the table directly ────────────────
-- Anonymous users hit the RPC instead (which bypasses RLS via
-- SECURITY DEFINER). This way the table contents (including unused
-- codes) are never visible to the public, only the validation result.

DROP POLICY IF EXISTS "Admins can view invite codes"   ON invite_codes;
DROP POLICY IF EXISTS "Admins can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admins can update invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Admins can delete invite codes" ON invite_codes;

CREATE POLICY "Admins can view invite codes"
  ON invite_codes FOR SELECT
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can create invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update invite codes"
  ON invite_codes FOR UPDATE
  USING      (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete invite codes"
  ON invite_codes FOR DELETE
  USING (public.is_admin_user(auth.uid()));


-- ── 5. Validation RPC ────────────────────────────────────────────
-- Atomically validates AND consumes a code.
--
-- Returns one row: (valid boolean, reason text)
--   reason ∈ { 'ok' | 'not_found' | 'expired' | 'exhausted' | 'disabled' }
--
-- SECURITY DEFINER → runs as the function owner, bypasses RLS, so
-- anonymous callers can invoke it without seeing the table itself.
--
-- The atomic UPDATE re-checks all conditions in the WHERE clause —
-- this prevents two simultaneous callers from both succeeding on the
-- last slot of a max_uses=1 code.

CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS TABLE (valid boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := LOWER(TRIM(p_code));
  v_row  invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM invite_codes WHERE code = v_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_found'::text;
    RETURN;
  END IF;

  IF v_row.disabled THEN
    RETURN QUERY SELECT false, 'disabled'::text;
    RETURN;
  END IF;

  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN QUERY SELECT false, 'expired'::text;
    RETURN;
  END IF;

  IF v_row.max_uses IS NOT NULL AND v_row.uses >= v_row.max_uses THEN
    RETURN QUERY SELECT false, 'exhausted'::text;
    RETURN;
  END IF;

  -- All checks passed — atomically consume one use.
  -- The WHERE clause re-checks every condition so a concurrent call
  -- can't push uses past max_uses.
  UPDATE invite_codes
     SET uses = uses + 1
   WHERE id = v_row.id
     AND NOT disabled
     AND (expires_at IS NULL OR expires_at > now())
     AND (max_uses   IS NULL OR uses < max_uses);

  IF NOT FOUND THEN
    -- Lost the race — somebody else took the last slot
    RETURN QUERY SELECT false, 'exhausted'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'ok'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon, authenticated;


-- ── 6. Seed the existing hardcoded code ──────────────────────────
-- So the migration is non-breaking — '5858' keeps working until
-- you decide to disable / rotate it.
INSERT INTO invite_codes (code, label, max_uses)
VALUES ('5858', 'Legacy hardcoded code — safe to disable once new codes are issued', NULL)
ON CONFLICT (code) DO NOTHING;


-- ── 7. Verify ────────────────────────────────────────────────────
-- Should show one row: the seeded 5858.
SELECT id, code, label, uses, max_uses, expires_at, disabled, created_at
  FROM invite_codes
 ORDER BY created_at DESC;

-- Quick smoke test of the RPC. Run as anon — Supabase SQL Editor
-- runs as service_role by default; to test as anon, hit it from the
-- frontend or from the API tester in the dashboard.
SELECT * FROM public.validate_invite_code('5858');  -- expect (true,  'ok'),        uses = 1
SELECT * FROM public.validate_invite_code('xxxx');  -- expect (false, 'not_found')

-- If the first call worked, you'll see uses = 1 — that's the test
-- consuming a use. Reset before deploy if you want a fresh counter:
--   UPDATE invite_codes SET uses = 0 WHERE code = '5858';
