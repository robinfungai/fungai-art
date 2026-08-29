-- ════════════════════════════════════════════════════════════════
-- event_rsvps — "I'm coming" state per member per event
--
-- Why: the Mycelium Calendar now shows "I'm coming / Maybe" buttons
-- on each event card. Local state (localStorage) works instantly,
-- but for admins to see who's coming and for members to see their
-- RSVPs on any device, we need it in the cloud.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor. Idempotent.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id       text        NOT NULL,
  auth_user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         text        NOT NULL CHECK (status IN ('yes','maybe')),
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, auth_user_id)
);

CREATE INDEX IF NOT EXISTS event_rsvps_event_idx ON public.event_rsvps (event_id);
CREATE INDEX IF NOT EXISTS event_rsvps_user_idx  ON public.event_rsvps (auth_user_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Everyone signed in can read all RSVPs (so the count / "N members
-- coming" widget can render for everyone). Drop this policy and add
-- a stricter one if that's not what you want.
DROP POLICY IF EXISTS "event_rsvps_authed_read" ON public.event_rsvps;
CREATE POLICY "event_rsvps_authed_read"
  ON public.event_rsvps FOR SELECT
  TO authenticated
  USING (true);

-- Members can only INSERT / UPDATE / DELETE their own RSVPs.
DROP POLICY IF EXISTS "event_rsvps_own_insert" ON public.event_rsvps;
CREATE POLICY "event_rsvps_own_insert"
  ON public.event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "event_rsvps_own_update" ON public.event_rsvps;
CREATE POLICY "event_rsvps_own_update"
  ON public.event_rsvps FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "event_rsvps_own_delete" ON public.event_rsvps;
CREATE POLICY "event_rsvps_own_delete"
  ON public.event_rsvps FOR DELETE
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Bump updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_rsvps_touch ON public.event_rsvps;
CREATE TRIGGER event_rsvps_touch
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
