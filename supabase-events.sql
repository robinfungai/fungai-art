-- ════════════════════════════════════════════════════════════════
-- events — the Mycelium Calendar, managed from the Admin page
--
-- Until 2026-09-25 every gathering was hardcoded in
-- public/community/spore/data.jsx (EVENTS), so a new date meant a code
-- change. This table replaces that list; the Event manager on the
-- Admin page (admin/keeper.jsx) writes it. data.jsx keeps its list
-- only as the fallback for when this table is missing.
--
-- `id` is the same id event_rsvps.event_id points at, so the seed
-- below keeps every existing RSVP attached to its event.
--
-- Needs public.fa_is_admin() (already run). Run once in Supabase →
-- SQL Editor. Idempotent: the seed never overwrites an edited event.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.events (
  id             text        PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{3,80}$'),
  title          text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  subtitle       text        CHECK (char_length(subtitle) <= 160),          -- the place
  date           date        NOT NULL,
  time           text        CHECK (time IS NULL OR time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  node           text,                                                       -- a network node id
  freq           text,                                                       -- '111 Hz' · '432 Hz' · '528 Hz'
  color          text,
  capacity       int         CHECK (capacity IS NULL OR capacity BETWEEN 0 AND 100000),
  description    text        CHECK (char_length(description) <= 4000),
  -- Site paths or https only: this lands in an <a href>, and a
  -- javascript: URL there would run in every member's session.
  url            text        CHECK (url IS NULL OR url ~ '^(/|https://)'),
  contributions  jsonb       NOT NULL DEFAULT '[]'::jsonb,                   -- "Volunteer & earn" roles
  cancelled      boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  updated_by     uuid        DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS events_date_idx ON public.events (date);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Every signed-in member reads the calendar, cancelled events included
-- (so anyone who RSVP'd sees that it is off).
DROP POLICY IF EXISTS "events_read" ON public.events;
CREATE POLICY "events_read"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
CREATE POLICY "events_admin_insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (public.fa_is_admin());

DROP POLICY IF EXISTS "events_admin_update" ON public.events;
CREATE POLICY "events_admin_update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.fa_is_admin())
  WITH CHECK (public.fa_is_admin());

DROP POLICY IF EXISTS "events_admin_delete" ON public.events;
CREATE POLICY "events_admin_delete"
  ON public.events FOR DELETE
  TO authenticated
  USING (public.fa_is_admin());

REVOKE ALL ON public.events FROM anon;

-- Bump updated_at on every edit. Same function event_rsvps uses.
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_touch ON public.events;
CREATE TRIGGER events_touch
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Seed: the ten events that were hardcoded in data.jsx ─────────
-- Generated from that list on 2026-09-25.
INSERT INTO public.events (id, title, subtitle, date, time, node, freq, color, capacity, description, url, contributions) VALUES
  ('sensorium-berlin-0703', 'SENSORIUM', 'Humboldthain · Berlin', '2026-07-03', '17:30', 'berlin', '528 Hz', '#C4A050', 20, 'A Community Botanical Tasting Journey hosted by Steph at Humboldthain park. Open-air sensorial walk through wild and cultivated allies — leaf, flower, root, smoke. Bring water and an open palate. €22–33 sliding contribution. Exact meeting spot sent on RSVP.', '/sensorium/', '[{"type":"events","earn":60,"rep":2,"label":"Co-host & facilitation"},{"type":"foraging","earn":50,"rep":1,"label":"Botanical sourcing & prep"},{"type":"kitchen","earn":40,"rep":1,"label":"Tasting boards & service"}]'::jsonb),
  ('garbicz-dinner-0731', 'Mycelium Dinner', 'Garbicz Music Festival · Poland', '2026-07-31', '20:00', 'festival', '111 Hz', '#C48838', 24, 'A slow, intentional ceremonial feast at the forest edge. Spagyric extracts, live plant allies on the table, gong bath at midnight under the Aquarius moon.', NULL, '[{"type":"kitchen","earn":80,"rep":2,"label":"Kitchen & ceremonial prep"},{"type":"events","earn":70,"rep":2,"label":"Event hosting & facilitation"},{"type":"laboratory","earn":60,"rep":1,"label":"Elixir & extract prep"}]'::jsonb),
  ('berlin-lab-night-0815', 'Extraction Lab Night', 'Berlin Studio / LAB', '2026-08-15', '18:00', 'berlin', '432 Hz', '#3B6D11', 8, 'A hands-on evening in the Berlin lab. Double-extraction of Chaga and Reishi. Participants learn spagyric calcination. Bring your own specimen if you have one.', NULL, '[{"type":"laboratory","earn":90,"rep":3,"label":"Lab lead & teaching"},{"type":"foraging","earn":60,"rep":1,"label":"Mushroom sourcing & ID"},{"type":"events","earn":40,"rep":1,"label":"Setup & documentation"}]'::jsonb),
  ('sweden-forage-0820', 'Nordic Foraging Circle', 'Sweden · Boreal Forest', '2026-08-20', '07:00', 'sweden', '528 Hz', '#639922', 12, 'Five days in the north. Wild harvest, species identification, Schizophyllum observation at 61°N. Sleep under birch canopy. Bring Zodiak time.', NULL, '[{"type":"foraging","earn":100,"rep":3,"label":"Expedition forager (5 days)"},{"type":"sales","earn":60,"rep":1,"label":"Daily wild harvest"},{"type":"events","earn":25,"rep":0,"label":"Species documentation"}]'::jsonb),
  ('bali-retreat-0901', 'Sacred Plant Retreat', 'Bali · Ubud Jungle', '2026-09-01', '06:00', 'bali', '111 Hz', '#4A7A3A', 16, 'A seven-day immersion in Balinese plant medicine. Morning ceremonial cacao, afternoon lab sessions with tropical adaptogens, evening gong and tuning fork ceremony.', NULL, '[{"type":"events","earn":120,"rep":3,"label":"Lead facilitator (7 days)"},{"type":"laboratory","earn":80,"rep":2,"label":"Cacao & elixir preparation"},{"type":"foraging","earn":70,"rep":1,"label":"Jungle herb harvest"}]'::jsonb),
  ('atitlan-equinox-0922', 'Equinox Ceremony', 'Lake Atitlán · Guatemala', '2026-09-22', '05:30', 'atitlan', '111 Hz', '#2E8B57', 20, 'Sunrise ceremony on the volcanic lake shore. Plant medicine circle, mycelium mapping of the local jungle floor. The calendar turns on 111 Hz — be here when it does.', NULL, '[{"type":"ceremony","earn":100,"rep":3,"label":"Ceremony lead & holding"},{"type":"foraging","earn":80,"rep":2,"label":"Sacred plant preparation"},{"type":"events","earn":50,"rep":1,"label":"Circle support"}]'::jsonb),
  ('hokkaido-fungi-1005', 'Fungi Harvest Festival', 'Hokkaido · Japan', '2026-10-05', '08:00', 'hokkaido', '432 Hz', '#3A6B8A', 18, 'Autumn peak harvest in Hokkaido''s ancient forests. Matsutake, Nameko, Maitake at altitude. Double-extraction lab sessions, culinary ceremony at base camp.', NULL, '[{"type":"foraging","earn":110,"rep":3,"label":"Expert fungi guide"},{"type":"laboratory","earn":75,"rep":2,"label":"Field extraction lab"},{"type":"events","earn":45,"rep":1,"label":"Camp setup & hosting"}]'::jsonb),
  ('fungi-fever-fest-1010', 'Fungi Fever Fest', 'Holzmarkt · Berlin · Two-day festival', '2026-10-10', '12:00', 'berlin', '432 Hz', '#E8B14B', 400, 'Two days at Holzmarkt Berlin dedicated to the fungal kingdom. Foraging walks, mycology talks, mushroom market, extract bar, lab demos, live music at dusk. Sat 10 & Sun 11 Oct. Full lineup + tickets on the FFF landing page.', '/fungi-fever-fest/', '[{"type":"events","earn":120,"rep":3,"label":"Festival crew (both days)"},{"type":"foraging","earn":80,"rep":2,"label":"Species table & ID desk"},{"type":"kitchen","earn":70,"rep":2,"label":"Mushroom market service"},{"type":"laboratory","earn":60,"rep":1,"label":"Extract-bar shifts"}]'::jsonb),
  ('fff-dinner-1011', 'FFF Dinner Experience', 'Holzmarkt · Berlin · Sun evening of Fungi Fever Fest', '2026-10-11', '19:00', 'berlin', '111 Hz', '#C4872A', 50, 'Seven-course fungal feast by forager-chef Robin Floræsta, hosted as the closing evening of Fungi Fever Fest. Foraged Nordic mushrooms, adaptogens, ceremonial amanita micro-drop. €77 early bird. Reserve at /dinner-experience/#reserve.', '/dinner-experience/', '[{"type":"kitchen","earn":120,"rep":3,"label":"Kitchen brigade for the dinner"},{"type":"events","earn":80,"rep":2,"label":"Front-of-house & service"},{"type":"laboratory","earn":60,"rep":1,"label":"Ally prep · amanita micro-dose"}]'::jsonb),
  ('zanzibar-solstice-1221', 'Solstice Ocean Ceremony', 'Zanzibar · Indian Ocean', '2026-12-21', '18:00', 'zanzibar', '111 Hz', '#C4872A', 30, 'The longest night. Spice harvest complete, the ocean holds the frequency. Ceremonial dinner with clove, cardamom, and marine plant medicine. Gong bath at dawn.', NULL, '[{"type":"events","earn":90,"rep":2,"label":"Ceremony hosting"},{"type":"kitchen","earn":70,"rep":1,"label":"Ceremonial feast preparation"},{"type":"foraging","earn":60,"rep":1,"label":"Spice & ocean harvest"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ── Verify ──────────────────────────────────────────────────────
--   select id, date, title, cancelled from public.events order by date;
