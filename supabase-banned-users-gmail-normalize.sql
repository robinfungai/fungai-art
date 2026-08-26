-- ═══════════════════════════════════════════════════════════════
-- Fungai Art · Banned users · Gmail-normalization migration
-- ═══════════════════════════════════════════════════════════════
-- Adds Gmail-normalization to the ban lookup so that any variation
-- of a banned Gmail address (dots, +alias, googlemail.com) still
-- matches. Also introduces a SECURITY DEFINER RPC so the client
-- can look up bans without needing RLS visibility on the row.
--
-- Run this ONCE in the Supabase SQL Editor AFTER
-- supabase-banned-users.sql.
-- ═══════════════════════════════════════════════════════════════

-- ─── Normalize an email for Gmail-fuzzy matching ────────────────
-- Rules (Gmail-only):
--   · lowercase everything
--   · strip dots from the local part (before @)
--   · strip "+anything" tail from the local part
--   · normalize googlemail.com → gmail.com
-- Non-Gmail addresses come back lowercased but otherwise untouched.
CREATE OR REPLACE FUNCTION public.normalize_email(raw text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  s text;
  local_part text;
  domain_part text;
  at_pos int;
BEGIN
  IF raw IS NULL THEN RETURN NULL; END IF;
  s := lower(trim(raw));
  at_pos := position('@' IN s);
  IF at_pos < 2 OR at_pos = length(s) THEN RETURN s; END IF;
  local_part := substring(s FROM 1 FOR at_pos - 1);
  domain_part := substring(s FROM at_pos + 1);
  IF domain_part IN ('gmail.com', 'googlemail.com') THEN
    -- Strip everything from the first '+' onward, then remove dots.
    local_part := split_part(local_part, '+', 1);
    local_part := replace(local_part, '.', '');
    RETURN local_part || '@gmail.com';
  END IF;
  RETURN local_part || '@' || domain_part;
END;
$$;

-- Backfill: normalize existing ban rows so string equality on the
-- stored value now matches the incoming normalized email.
UPDATE public.banned_users
SET email = public.normalize_email(email)
WHERE email IS NOT NULL
  AND email <> public.normalize_email(email);

-- Enforce future rows also stored normalized.
CREATE OR REPLACE FUNCTION public.banned_users_normalize_trg()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.email := public.normalize_email(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS banned_users_normalize_email ON public.banned_users;
CREATE TRIGGER banned_users_normalize_email
  BEFORE INSERT OR UPDATE ON public.banned_users
  FOR EACH ROW EXECUTE FUNCTION public.banned_users_normalize_trg();

-- ─── RPC: is_user_banned(uid, email) ────────────────────────────
-- Client-facing. SECURITY DEFINER means it bypasses RLS on the
-- table (safe: it only ever returns a boolean; the ban list itself
-- is not leaked). Any authenticated user can call it against their
-- OWN identifiers.
CREATE OR REPLACE FUNCTION public.is_user_banned(check_uid uuid, check_email text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_users
    WHERE (check_uid IS NOT NULL AND auth_user_id = check_uid)
       OR (check_email IS NOT NULL AND email = public.normalize_email(check_email))
  );
$$;

-- Grant executability. Anon can also call (in case of pre-signup
-- checks); the function only returns a boolean, no data leak.
GRANT EXECUTE ON FUNCTION public.is_user_banned(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_email(text)      TO anon, authenticated;

-- ─── Sanity checks (run individually to verify) ────────────────
-- SELECT public.normalize_email('De.Becker.Code+spam@GoogleMail.com');
--   → 'debeckercode@gmail.com'
-- SELECT public.is_user_banned(NULL, 'debeckercode+attempt@gmail.com');
--   → true (should match your existing ban row)
-- SELECT public.is_user_banned(NULL, 'someone_else@example.com');
--   → false
-- ═══════════════════════════════════════════════════════════════
