-- ════════════════════════════════════════════════════════════════
-- myco_threads — each member's MYCO conversation, ENCRYPTED
--
-- Robin, 2026-09-27: whoever is signed in, whatever their rank, their
-- conversation with MYCO is kept — and only ever kept encrypted.
--
-- The portal (community/myco/agent.jsx) seals the whole conversation
-- in the browser to the member's own device key — the same ECDH key
-- their DMs use (dm/crypto.js) — and stores only the ciphertext, here
-- and in the browser. The database, keepers, and the SQL console see
-- base64 noise. Only a browser holding that member's private key can
-- open it.
--
-- One row per member PER DEVICE KEY (key_fp). Another device has
-- another key and cannot read this one; it keeps its own row instead
-- of overwriting this one. When the Security Key vault ships
-- (supabase-e2e-key-vault.sql, on hold) a restored device holds the
-- same key, and its conversations follow it.
--
-- What encryption does NOT cover, said plainly: to answer, MYCO must
-- read the question. Each message still travels over HTTPS to our
-- server and to the model provider. What is encrypted is what is KEPT.
--
-- ⚠ Replaces the first version of this file (same day), which stored
-- messages as plain JSON. If that version was run, this DROPs the
-- table: the only rows it can hold are plaintext conversations from
-- 2026-09-27, which is exactly what should not be kept.
--
-- Run once in Supabase → SQL Editor. Idempotent.
-- ════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'myco_threads'
               AND column_name = 'messages') THEN
    DROP TABLE public.myco_threads;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.myco_threads (
  user_id     uuid        NOT NULL DEFAULT auth.uid()
                          REFERENCES auth.users(id) ON DELETE CASCADE,
  key_fp      text        NOT NULL CHECK (char_length(key_fp) BETWEEN 8 AND 64),
  ciphertext  text        NOT NULL CHECK (char_length(ciphertext) < 2000000),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key_fp)
);

ALTER TABLE public.myco_threads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.myco_threads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.myco_threads TO authenticated;

DROP POLICY IF EXISTS "myco_threads_own" ON public.myco_threads;
CREATE POLICY "myco_threads_own"
  ON public.myco_threads FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
