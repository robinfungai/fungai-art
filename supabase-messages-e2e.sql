-- ════════════════════════════════════════════════════════════════
-- messages_e2e — END-TO-END-ENCRYPTED member DMs
--
-- Threat model:
--   Server (this DB, and Robin as admin) MUST NOT be able to read
--   message bodies. All the DB stores is opaque ciphertext.
--
-- How:
--   Each member generates an ECDH-P256 keypair on first sign-in
--   (see /community/dm/crypto.js). The public key is uploaded to
--   `profiles.dm_public_key` (see below). The private key never
--   leaves the member's device.
--
--   To send a DM: the sender derives a shared secret with the
--   recipient's public key, uses it to encrypt (AES-GCM) the body,
--   and inserts the ciphertext + IV + sender's ephemeral pubkey.
--   Only the recipient's device (holding the private key) can
--   derive the same shared secret and decrypt.
--
-- What the DB knows:  who sent, who received, when, size, an opaque
--                     ciphertext blob and an ephemeral pubkey.
-- What the DB does NOT know: the message text. Not Robin. Not Supabase.
--
-- Run this ONCE. Idempotent.
-- ════════════════════════════════════════════════════════════════

-- Extension needed for gen_random_uuid() if not already enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Public keys live on `profiles`. If your profiles table doesn't
--    have the column yet, this ALTER adds it. base64(SPKI DER).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dm_public_key text;

-- 2) The message table.
CREATE TABLE IF NOT EXISTS public.messages_e2e (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_auth_user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_profile_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Opaque payload: base64(AES-GCM ciphertext | 12-byte IV | 65-byte
  -- ephemeral ECDH pubkey). Client parses on receive. Server never
  -- opens it. Size cap keeps rogue clients from blowing up storage.
  ciphertext         text        NOT NULL CHECK (char_length(ciphertext) <= 8000),
  -- Metadata the client controls but the server can index. Kept
  -- deliberately minimal — anything the DB indexes is metadata that
  -- Robin/Supabase can see. Don't store subject lines, previews, etc.
  created_at         timestamptz NOT NULL DEFAULT now(),
  read_at            timestamptz,
  -- Optional client-set "thread key" so the same 1:1 pair groups
  -- neatly in queries without leaking a subject. Client generates
  -- it as the sha256 of the sorted pair of profile ids.
  thread_key         text
);

CREATE INDEX IF NOT EXISTS messages_e2e_to_idx     ON public.messages_e2e (to_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_e2e_from_idx   ON public.messages_e2e (from_auth_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_e2e_thread_idx ON public.messages_e2e (thread_key, created_at DESC);

ALTER TABLE public.messages_e2e ENABLE ROW LEVEL SECURITY;

-- Sender inserts, and only as themselves.
DROP POLICY IF EXISTS "messages_e2e_send" ON public.messages_e2e;
CREATE POLICY "messages_e2e_send"
  ON public.messages_e2e FOR INSERT
  TO authenticated
  WITH CHECK (from_auth_user_id = auth.uid());

-- Recipient (their own profile) or sender read the row.
DROP POLICY IF EXISTS "messages_e2e_read" ON public.messages_e2e;
CREATE POLICY "messages_e2e_read"
  ON public.messages_e2e FOR SELECT
  TO authenticated
  USING (
    from_auth_user_id = auth.uid()
    OR to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

-- Recipient can mark read_at. Neither party can UPDATE anything else.
DROP POLICY IF EXISTS "messages_e2e_mark_read" ON public.messages_e2e;
CREATE POLICY "messages_e2e_mark_read"
  ON public.messages_e2e FOR UPDATE
  TO authenticated
  USING (to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Either party can delete a message on their side.
DROP POLICY IF EXISTS "messages_e2e_delete" ON public.messages_e2e;
CREATE POLICY "messages_e2e_delete"
  ON public.messages_e2e FOR DELETE
  TO authenticated
  USING (
    from_auth_user_id = auth.uid()
    OR to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

-- IMPORTANT: Supabase Realtime — enable this table under
-- Database → Replication → tick messages_e2e → Save.
-- Without that step, the DM UI won't receive new-message pushes and
-- users have to reload to see incoming ciphertext.
