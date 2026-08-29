-- ════════════════════════════════════════════════════════════════
-- myco_memory — MYCO's long-term memory (cross-device)
--
-- Why: right now MYCO forgets everything between panel closes.
-- Once we start doing formula/ceremony guidance, we want it to
-- remember: "you already asked about a chaga+reishi dual extract —
-- last week you settled on 60% ethanol / 4h decoct". Recall lives
-- here, per-member, private.
--
-- Members can read + write their OWN memories. Nobody else. Not
-- even Robin (except in the DB console, of course — no encryption
-- at rest here; use encrypted-DMs table for anything truly sensitive).
--
-- Run this ONCE. Idempotent.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.myco_memory (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Free-text topic key ("chaga-dual-extract", "sensorium-planning").
  topic              text        NOT NULL CHECK (char_length(topic)  <= 60),
  -- The distilled insight. Short. Client re-summarises to fit.
  insight            text        NOT NULL CHECK (char_length(insight) <= 800),
  -- Optional pointer at the message that produced this insight
  -- (so MYCO can quote the exchange back to the user).
  from_conversation  jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  last_used_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS myco_memory_by_user  ON public.myco_memory (auth_user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS myco_memory_by_topic ON public.myco_memory (auth_user_id, topic);

ALTER TABLE public.myco_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "myco_memory_own_all" ON public.myco_memory;
CREATE POLICY "myco_memory_own_all"
  ON public.myco_memory FOR ALL
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
