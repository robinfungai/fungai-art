-- ════════════════════════════════════════════════════════════════
-- myco_threads — each member's MYCO conversation, on their account
--
-- Robin, 2026-09-27: whoever is signed in, whatever their rank, their
-- conversation with MYCO is kept. The portal (community/myco/agent.jsx)
-- already keeps it in the browser; this table is what lets it follow
-- the member to another device.
--
-- One row per auth user: the current thread, last 60 messages.
-- Owner-only: a member reads and writes their own row and nobody
-- else's — not keepers, not the anon key. (The DB console can still
-- read it; this is not encrypted. The DMs are the encrypted channel.)
--
-- Separate from myco_memory (supabase-myco-memory.sql), which is for
-- distilled long-term insights and is not used yet.
--
-- Run once in Supabase → SQL Editor. Idempotent. Until it has run the
-- portal keeps the conversation in the browser only, and says nothing.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.myco_threads (
  user_id     uuid        PRIMARY KEY DEFAULT auth.uid()
                          REFERENCES auth.users(id) ON DELETE CASCADE,
  messages    jsonb       NOT NULL DEFAULT '[]'::jsonb
                          CHECK (jsonb_typeof(messages) = 'array'),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 60 messages of up to 12,000 characters is ~720 KB at the very worst;
-- cap the row well above real use and well below abuse.
ALTER TABLE public.myco_threads DROP CONSTRAINT IF EXISTS myco_threads_size;
ALTER TABLE public.myco_threads
  ADD CONSTRAINT myco_threads_size CHECK (pg_column_size(messages) < 1000000);

ALTER TABLE public.myco_threads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.myco_threads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.myco_threads TO authenticated;

DROP POLICY IF EXISTS "myco_threads_own" ON public.myco_threads;
CREATE POLICY "myco_threads_own"
  ON public.myco_threads FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
