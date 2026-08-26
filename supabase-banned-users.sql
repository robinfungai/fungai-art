-- ═══════════════════════════════════════════════════════════════
-- Fungai Art · Banned users table
-- ═══════════════════════════════════════════════════════════════
-- Purpose: hard-block specific users across the whole site.
--   · The spore portal + global-nav check this table on every
--     session load. A banned user is force-signed-out and shown
--     an "access revoked" screen.
--   · The Stripe payment-intent function refuses orders from
--     banned auth_user_ids.
--   · An IP address can also be stored, and the Netlify Edge
--     function reads it to block browsing (see
--     netlify/edge-functions/ip-block.js).
--
-- RLS design: a user can see their own row (only), so the client
-- check works with anon-key permissions. The full list is only
-- readable via service_role, and only Robin/Teyae can write.
--
-- Run this once in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.banned_users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id   uuid,          -- Supabase auth.users.id (primary match key)
  email          text,          -- lowercase; optional secondary match
  profile_name   text,          -- friendly label so we remember who this is
  ip_address     text,          -- comma-separated list of known IPs; picked up by Edge function
  reason         text,          -- internal note (not shown to the banned user)
  banned_by      text,          -- who did the ban
  banned_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS banned_users_auth_user_id_idx
  ON public.banned_users (auth_user_id);
CREATE INDEX IF NOT EXISTS banned_users_email_idx
  ON public.banned_users (lower(email));

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Anyone signed-in can look up whether THEY are banned. They can only
-- see their own row, never anyone else's — no ban list leak.
DROP POLICY IF EXISTS "users can see only their own ban row" ON public.banned_users;
CREATE POLICY "users can see only their own ban row"
  ON public.banned_users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Only Robin + Teyae can write. Everything else is denied by default
-- once RLS is on.
DROP POLICY IF EXISTS "admins can write banned_users" ON public.banned_users;
CREATE POLICY "admins can write banned_users"
  ON public.banned_users
  FOR ALL
  TO authenticated
  USING (auth.email() IN ('robin@fungai.art', 'teyae@fungai.art'))
  WITH CHECK (auth.email() IN ('robin@fungai.art', 'teyae@fungai.art'));

-- Seed the target user.
INSERT INTO public.banned_users (auth_user_id, reason, banned_by)
VALUES (
  '9c6cb41c-9cf8-447c-a95f-ae950e0c6bb8',
  'Blocked by Robin',
  'robin@fungai.art'
)
ON CONFLICT DO NOTHING;

-- ─── SANITY QUERIES ──────────────────────────────────────────────
-- List current bans (run as service_role in SQL editor):
--   SELECT * FROM public.banned_users ORDER BY banned_at DESC;
--
-- Un-ban someone:
--   DELETE FROM public.banned_users WHERE auth_user_id = '<uuid>';
--
-- Find their known IPs from the auth audit log (for the Edge block):
--   SELECT ip_address, created_at, payload
--   FROM auth.audit_log_entries
--   WHERE payload::text ILIKE '%9c6cb41c-9cf8-447c-a95f-ae950e0c6bb8%'
--   ORDER BY created_at DESC LIMIT 50;
-- ═══════════════════════════════════════════════════════════════
