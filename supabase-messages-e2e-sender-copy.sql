-- ════════════════════════════════════════════════════════════════
-- messages_e2e · sender copy, key fingerprints, column-level UPDATE
--
-- Follows supabase-messages-e2e.sql. Run that first, then this.
-- Idempotent — safe to re-run.
--
-- Three changes, all from docs/COMMUNITY-AUDIT.md §9.
--
-- D1 · ciphertext_self
--   encryptTo() discards the ephemeral private key, so only the
--   recipient can open `ciphertext`. The sender could SELECT their
--   own row and not decrypt a word of it — a conversation with no
--   "sent" side. Every message is now sealed twice, and the sender's
--   copy lives here. See encryptForBoth() in dm/crypto.js.
--
-- D2 · to_key_fp / self_key_fp
--   DM history is deliberately device-bound (decision, 2026-09-24):
--   the private key lives in one browser's IndexedDB, with no backup
--   and no sync. A member on a new device cannot read old messages
--   and nobody can recover them.
--
--   What these columns buy is a LEGIBLE failure. Each blob records
--   the fingerprint of the public key it was sealed to, so a device
--   holding a different key says "sent to a previous device" instead
--   of throwing, or worse, rendering nothing and looking broken.
--   Non-secret: a truncated SHA-256 of a public key.
--
-- D-extra · column-level UPDATE
--   The "messages_e2e_mark_read" policy's comment says the recipient
--   can only set read_at. That was not true: an RLS UPDATE policy
--   constrains WHICH ROWS you may touch, never WHICH COLUMNS. The
--   recipient could rewrite `ciphertext`, `created_at` or
--   `thread_key` on any message sent to them. Column privileges are
--   the mechanism that actually enforces it, so they are applied
--   here and the policy comment is now honest.
-- ════════════════════════════════════════════════════════════════

-- 1) The sender's own copy of the message. Nullable: rows written
--    before this migration have none, and readMessage() reports
--    those as unreadable-on-this-device rather than guessing.
ALTER TABLE public.messages_e2e
  ADD COLUMN IF NOT EXISTS ciphertext_self text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.messages_e2e'::regclass
      AND conname  = 'messages_e2e_ciphertext_self_len'
  ) THEN
    ALTER TABLE public.messages_e2e
      ADD CONSTRAINT messages_e2e_ciphertext_self_len
      CHECK (ciphertext_self IS NULL OR char_length(ciphertext_self) <= 8000);
  END IF;
END $$;

-- 2) Which public key each blob was sealed to. Truncated SHA-256 of
--    a public key — not a secret, and not a subject: it identifies a
--    device's key, not a person.
ALTER TABLE public.messages_e2e
  ADD COLUMN IF NOT EXISTS to_key_fp   text;
ALTER TABLE public.messages_e2e
  ADD COLUMN IF NOT EXISTS self_key_fp text;

-- 3) Make "recipient may only mark it read" true.
--
--    Supabase grants table-wide UPDATE to `authenticated` by
--    default, and RLS cannot narrow that to a column. So: take UPDATE
--    away entirely, then hand back exactly one column. The RLS policy
--    still decides WHICH rows; this decides WHICH columns.
REVOKE UPDATE ON public.messages_e2e FROM authenticated;
GRANT  UPDATE (read_at) ON public.messages_e2e TO authenticated;

-- anon has no business here at all.
REVOKE ALL ON public.messages_e2e FROM anon;

-- 4) The read policy is unchanged in shape but restated so the
--    sender's copy is explicitly in scope. Both parties may read the
--    row; only one of them can open each blob.
DROP POLICY IF EXISTS "messages_e2e_read" ON public.messages_e2e;
CREATE POLICY "messages_e2e_read"
  ON public.messages_e2e FOR SELECT
  TO authenticated
  USING (
    from_auth_user_id = auth.uid()
    OR to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

-- ── Verify ──────────────────────────────────────────────────────
-- Columns present:
--   select column_name from information_schema.columns
--    where table_name = 'messages_e2e' order by ordinal_position;
--
-- UPDATE is column-scoped (expect exactly one row, read_at):
--   select column_name from information_schema.column_privileges
--    where table_name = 'messages_e2e' and privilege_type = 'UPDATE'
--      and grantee = 'authenticated';
--
-- REMINDER: Realtime still has to be ticked by hand —
-- Database → Replication → messages_e2e → Save. Without it the DM
-- UI never receives incoming ciphertext until a reload.
