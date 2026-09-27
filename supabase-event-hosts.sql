-- ════════════════════════════════════════════════════════════════
-- Event hosts — Facilitators and Alchemists run events (2026-09-27)
--
-- Robin: Facilitators and Alchemists open Root, but they get no admin
-- benefits (no inventory, no restrictions, no ranks) — only the Event
-- manager: create, edit, cancel events, and read the guest lists.
--
-- The portal shows them a Root with only the Event manager on it.
-- This file is what lets the database accept their writes: until it
-- runs, their saves are refused by RLS (the events policies in
-- supabase-events.sql say fa_is_admin() only).
--
-- Rank is keeper-set and guarded (profiles_guard_privileges in
-- supabase-rbac-tiers.sql), so a member cannot make themselves a host.
--
-- Needs: supabase-events.sql, supabase-rbac-tiers.sql (profiles.rank).
-- Run once in Supabase → SQL Editor. Idempotent.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fa_can_host_events()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.fa_is_admin() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid()
      AND rank IN ('facilitator', 'alchemist', 'founder')
  );
$$;

GRANT EXECUTE ON FUNCTION public.fa_can_host_events() TO authenticated;

DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
DROP POLICY IF EXISTS "events_host_insert"  ON public.events;
CREATE POLICY "events_host_insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (public.fa_can_host_events());

DROP POLICY IF EXISTS "events_admin_update" ON public.events;
DROP POLICY IF EXISTS "events_host_update"  ON public.events;
CREATE POLICY "events_host_update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.fa_can_host_events())
  WITH CHECK (public.fa_can_host_events());

-- Deleting stays with keepers. A host calls an event off by marking it
-- cancelled, which members keep seeing (and why) — the Event manager
-- already steers everyone that way.
DROP POLICY IF EXISTS "events_admin_delete" ON public.events;
CREATE POLICY "events_admin_delete"
  ON public.events FOR DELETE
  TO authenticated
  USING (public.fa_is_admin());

-- Guest lists: event_rsvps is already readable by every signed-in
-- member (supabase-event-rsvps.sql, "event_rsvps_authed_read"), so
-- hosts need nothing more for those.

-- ── Verify ──────────────────────────────────────────────────────
-- SELECT character_name, rank FROM public.profiles
--  WHERE rank IN ('facilitator','alchemist','founder');
