-- ═══════════════════════════════════════════════════════════════════════
-- Fungai Art · fyf_formulas — server-authoritative formula storage
-- ═══════════════════════════════════════════════════════════════════════
--
-- Backs the /api/fyf/compose endpoint (Step 2 of the P0 migration).
-- Each row is one formula the server generated from a user's quiz.
-- The reservation flow later reads by formulaId to email the exact
-- formula the user saw — the client never sends the formula body
-- to /api/fyf/reserve, only the id.
--
-- What is stored (minimum-necessary — audit constraint 10):
--
--   id                        opaque 'fyf_<32-hex>' — cryptographic
--                             UUID, NOT sequential, NOT derived from
--                             anything about the request or user
--   engine_version            e.g. '2.0.0-server'
--   herb_db_version           e.g. '2026.09-198herbs'
--   safety_rules_version      e.g. '1.0.0'
--   profile                   the validated + normalised quiz answers.
--                             notes text is included (capped at 1KB by
--                             the endpoint validator). No IP, no lat/
--                             long, no user agent, no fingerprint.
--   formula                   the full engine output — herbs, scores,
--                             percentages, safety report. Kept in full
--                             so a reservation can email the exact
--                             formula the user saw without re-running.
--   created_at                UTC timestamp of composition.
--
-- What is NOT stored:
--
--   · IP addresses
--   · user agents
--   · geolocation
--   · session tokens
--   · anything that identifies a person BEFORE they choose to reserve
--     (at reservation, the reserve-formula endpoint stores email +
--     name + city as it does today — that stays in the reservations
--     table, not here)
--
-- Retention:
--
--   NOT enforced by this table. Enforcement is separate — either a
--   pg_cron scheduled DELETE or a Netlify scheduled function reading
--   the FYF_FORMULA_RETENTION_DAYS env var:
--
--     FYF_FORMULA_RETENTION_DAYS = 0   → retain indefinitely
--     FYF_FORMULA_RETENTION_DAYS = N   → prune rows older than N days
--
--   Retention behaviour is a policy call — leaving it configurable
--   per audit adjustment #1. Cleanup job to be added in a follow-up.
--
-- Access model:
--
--   RLS enabled with NO public policies. The service-role key (used
--   by netlify functions) bypasses RLS. The anon key cannot read or
--   write this table. There is no user-facing SELECT path — reading
--   goes through the reserve-formula function which uses the service
--   role.
--
--   The formulaId is opaque + high-entropy, so even if a URL leaks,
--   guessing another formula's id is computationally infeasible.
--   No enumeration endpoints exist.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.fyf_formulas (
  id                    text        primary key,
  engine_version        text        not null,
  herb_db_version       text        not null,
  safety_rules_version  text        not null,
  profile               jsonb       not null,
  formula               jsonb       not null,
  created_at            timestamptz not null default now()
);

-- Cheap index on created_at for the retention cleanup query.
create index if not exists fyf_formulas_created_at_idx
  on public.fyf_formulas (created_at);

-- RLS: service-role only. No public policies of any kind.
alter table public.fyf_formulas enable row level security;

-- Explicit revocations — belt-and-braces. The anon and authenticated
-- roles should have zero grants on this table. If future SQL migrations
-- add a role by mistake, these REVOKEs are the last line of defence.
revoke all on public.fyf_formulas from anon;
revoke all on public.fyf_formulas from authenticated;

-- Grant the service_role explicit access (it already bypasses RLS but
-- being explicit prevents accidental role changes from locking us out).
grant select, insert on public.fyf_formulas to service_role;
