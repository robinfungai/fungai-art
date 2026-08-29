-- ════════════════════════════════════════════════════════════════
-- feed_events — the shared activity river
--
-- Why: a lightweight "recent-activity river" across the network —
--   "Robin logged 40 $H · Chaga extraction · 3h ago"
--   "Emil claimed Reishi Rose gummies · 12h ago"
--   "Leni RSVP'd to Fungi Fever Fest · 1d ago"
--
-- Feed items are append-only, member-scoped, and PUBLIC to signed-in
-- members only. Sensitive events (private notes, DMs, gifts) MUST
-- NOT be written here.
--
-- Run this ONCE. Idempotent.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feed_events (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_profile uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Bounded enum-ish list; expand as needed. Keep short so the
  -- client can render a matching icon/copy without a lookup.
  kind          text        NOT NULL CHECK (kind IN (
    'contribution',   -- earned $H for a labelled task
    'purchase',       -- claimed a product / apothecary item
    'unlock',         -- unlocked an experience
    'rsvp',           -- said "I'm coming" to an event
    'joined',         -- new member joined
    'tier_up',        -- reputation tier increased
    'ceremony',       -- completed a ceremony arc (future)
    'note'            -- free-form founder note pushed to the feed
  )),
  -- Free-text label the item renders as. Client is free to format.
  label         text        NOT NULL CHECK (char_length(label) <= 200),
  -- Optional deep link (calendar event id, product id, member id).
  ref           text,
  -- Optional numeric delta ($H, seats, etc). Nullable.
  amount        int,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_events_recent ON public.feed_events (created_at DESC);
CREATE INDEX IF NOT EXISTS feed_events_actor  ON public.feed_events (actor_profile, created_at DESC);

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

-- Any signed-in member can read the last N events.
DROP POLICY IF EXISTS "feed_events_authed_read" ON public.feed_events;
CREATE POLICY "feed_events_authed_read"
  ON public.feed_events FOR SELECT
  TO authenticated
  USING (true);

-- Members can only INSERT rows where they're the actor.
DROP POLICY IF EXISTS "feed_events_actor_insert" ON public.feed_events;
CREATE POLICY "feed_events_actor_insert"
  ON public.feed_events FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_profile IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

-- Nobody UPDATEs feed items. Actor OR admin can DELETE (moderation).
DROP POLICY IF EXISTS "feed_events_delete" ON public.feed_events;
CREATE POLICY "feed_events_delete"
  ON public.feed_events FOR DELETE
  TO authenticated
  USING (
    actor_profile IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR (auth.jwt() ->> 'email') IN ('robin@fungai.art','teyae@fungai.art')
  );

-- Enable Realtime for live "new activity" pushes:
-- Database → Replication → tick feed_events → Save.
