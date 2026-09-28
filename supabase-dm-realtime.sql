-- ════════════════════════════════════════════════════════════════
-- messages_e2e · live delivery (Supabase Realtime)
--
-- Follows supabase-messages-e2e.sql and the sender-copy migration.
-- Idempotent — safe to re-run.
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Until now the DM inbox asked the server for up to 400 messages every
-- 10 seconds while open and every 60 seconds for the badge. With this,
-- the server pushes a tiny "something changed" signal the moment a
-- message arrives, and the inbox reloads only then — messages appear
-- instantly and a member's phone moves far less data.
--
-- What Realtime sends is still ciphertext, and only to the two people
-- in the conversation: Realtime checks each change against the same
-- RLS policy ("messages_e2e_read") before passing it on.
--
-- Nothing breaks if this is never run: dm.jsx notices the channel
-- never connects and keeps polling as before.
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public' AND tablename = 'messages_e2e'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages_e2e;
  END IF;
END $$;

-- ── Confirm ─────────────────────────────────────────────────────
-- One row: public | messages_e2e
SELECT schemaname, tablename FROM pg_publication_tables
 WHERE pubname = 'supabase_realtime' AND tablename = 'messages_e2e';
