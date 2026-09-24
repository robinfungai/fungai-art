-- ════════════════════════════════════════════════════════════════
-- user_key_vault — cross-device backup of the DM private key
--
-- Run AFTER supabase-messages-e2e.sql and
-- supabase-messages-e2e-sender-copy.sql. Idempotent.
--
-- ── What problem this solves ────────────────────────────────────
-- Until now the ECDH private key lived only in one browser's
-- IndexedDB. Safari evicts that after ~7 days without a visit, and a
-- new device generates a new keypair — either way every message ever
-- sent to that member became permanently unreadable, silently.
--
-- That was a deliberate choice on 2026-09-24 ("device-bound history",
-- audit finding D2). This supersedes it.
--
-- ── What the server can and cannot see ──────────────────────────
-- The private key is wrapped, in the browser, with a key derived from
-- the member's Security Key via PBKDF2-HMAC-SHA256 (600,000
-- iterations, OWASP 2023 floor) and sealed with AES-GCM.
--
-- The server stores: ciphertext, the KDF salt, the IV, the iteration
-- count, the public key, and a fingerprint. All of that is useless
-- without the Security Key.
--
-- The server NEVER sees: the Security Key, or the private key.
-- Neither is ever sent, and neither can be derived from these rows.
--
-- CONSEQUENCE, AND IT IS NOT RECOVERABLE: a member who forgets their
-- Security Key loses their chat history. Not "we can reset it" —
-- nobody on earth can. The UI has to say so before they set one, not
-- after. There is deliberately no escrow column here; adding one
-- would quietly end the end-to-end property.
--
-- ── Why a separate table rather than columns on profiles ────────
-- profiles is world-readable to authenticated members (the member
-- directory selects it). Putting `encrypted_private_key` there would
-- ship every member's wrapped key to every other member on page load.
-- Harmless in theory — it is ciphertext — but it hands an offline
-- brute-force target to anyone with an account, which is exactly the
-- thing a 600k-iteration KDF is rationing. So: own table, owner-only
-- RLS, and a narrow view for the one column others genuinely need.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_key_vault (
  user_id               uuid        NOT NULL PRIMARY KEY
                                    REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Public half, TWICE, and the duplication is deliberate.
  --
  -- public_key_jwk is the canonical record: the same JWK shape the
  -- wrapped private key uses, so a future client can rebuild the
  -- whole keypair from this table alone.
  --
  -- public_key_raw is base64 of the 65-byte uncompressed P-256 point,
  -- which is what dm/crypto.js has always spoken and what
  -- profiles.dm_public_key already holds. Storing the JWK alone and
  -- syncing THAT into dm_public_key would put a JSON blob in a column
  -- every existing caller parses as a raw point — silently breaking
  -- every DM. Postgres cannot convert between the two, so the client
  -- writes both and the trigger below mirrors the raw one.
  public_key_jwk        text        NOT NULL,
  public_key_raw        text        NOT NULL,

  -- SHA-256 of the public key, short form (e.g. "8F3A-99C1"). Shown
  -- in the UI so two members can compare out of band and know they
  -- are encrypting to the right person rather than to whatever key
  -- the server handed them.
  key_fingerprint       text        NOT NULL,

  -- The wrapped private key. base64( AES-GCM ciphertext ) of the
  -- private JWK. Opaque. Owner-only.
  encrypted_private_key text        NOT NULL
                                    CHECK (char_length(encrypted_private_key) <= 8000),

  -- PBKDF2 parameters. Stored rather than assumed so the iteration
  -- count can be raised later without stranding existing vaults:
  -- a row decrypts with the parameters it was written with.
  kdf_salt              text        NOT NULL CHECK (char_length(kdf_salt) <= 64),
  aes_iv                text        NOT NULL CHECK (char_length(aes_iv)   <= 32),
  kdf_iterations        int         NOT NULL DEFAULT 600000
                                    CHECK (kdf_iterations >= 100000),

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_key_vault_fp_idx
  ON public.user_key_vault (key_fingerprint);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_updated_at') THEN
    DROP TRIGGER IF EXISTS user_key_vault_touch ON public.user_key_vault;
    CREATE TRIGGER user_key_vault_touch
      BEFORE UPDATE ON public.user_key_vault
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

ALTER TABLE public.user_key_vault ENABLE ROW LEVEL SECURITY;

-- ── RLS · the row belongs to exactly one person ─────────────────
-- No admin exception anywhere in this file, on purpose. An admin who
-- could read these rows would be a single point of compromise for
-- every member's wrapped key, and the whole design exists to make
-- sure no such point exists. Admins get their own vault, nobody
-- else's.

DROP POLICY IF EXISTS "key_vault_select_own" ON public.user_key_vault;
CREATE POLICY "key_vault_select_own"
  ON public.user_key_vault FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "key_vault_insert_own" ON public.user_key_vault;
CREATE POLICY "key_vault_insert_own"
  ON public.user_key_vault FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "key_vault_update_own" ON public.user_key_vault;
CREATE POLICY "key_vault_update_own"
  ON public.user_key_vault FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Deleting your own vault is allowed: it is the "forget me" path, and
-- a member who wants their backup gone should not have to ask.
DROP POLICY IF EXISTS "key_vault_delete_own" ON public.user_key_vault;
CREATE POLICY "key_vault_delete_own"
  ON public.user_key_vault FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.user_key_vault FROM anon;

-- ── The public half, for everyone else ──────────────────────────
-- Members need each other's public keys to send a DM, but RLS above
-- is row-level: a policy letting others read the row would hand them
-- encrypted_private_key as well.
--
-- So expose exactly three columns through a view that does NOT
-- inherit the caller's RLS. This is the one place in the schema where
-- bypassing RLS is the point rather than a bug, and it is safe
-- because the view cannot project the private columns at all — not
-- "is not selected by default", cannot.
DROP VIEW IF EXISTS public.user_public_keys;
CREATE VIEW public.user_public_keys
  WITH (security_invoker = false)
  AS SELECT user_id, public_key_jwk, public_key_raw, key_fingerprint
     FROM public.user_key_vault;

GRANT SELECT ON public.user_public_keys TO authenticated;
REVOKE ALL  ON public.user_public_keys FROM anon;

COMMENT ON VIEW public.user_public_keys IS
  'Public halves only. Deliberately security_invoker=false so members can '
  'fetch each other''s ECDH public keys; the private columns are not '
  'projected and cannot be reached through this view.';

-- ── Keep profiles.dm_public_key in step ─────────────────────────
-- messages_e2e.sql put the public key on profiles. The vault is now
-- the source of truth, but the column stays so nothing that reads it
-- breaks mid-migration. This trigger mirrors writes one way only:
-- vault → profiles, never back.
CREATE OR REPLACE FUNCTION public.sync_dm_public_key()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET dm_public_key = NEW.public_key_raw   -- raw point, NOT the JWK
   WHERE auth_user_id = NEW.user_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_key_vault_sync_profile ON public.user_key_vault;
CREATE TRIGGER user_key_vault_sync_profile
  AFTER INSERT OR UPDATE OF public_key_raw ON public.user_key_vault
  FOR EACH ROW EXECUTE FUNCTION public.sync_dm_public_key();

-- ── Verify ──────────────────────────────────────────────────────
-- Four policies, all owner-scoped, no admin exception:
--   select policyname, cmd, qual from pg_policies
--    where tablename = 'user_key_vault';
--
-- The view must expose three columns and no more:
--   select column_name from information_schema.columns
--    where table_name = 'user_public_keys';
--
-- As another member, this must return 0 rows (not an error):
--   select * from public.user_key_vault;
-- …while this returns every member who has set up a vault:
--   select * from public.user_public_keys;
