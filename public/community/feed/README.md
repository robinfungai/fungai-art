# /community/feed — The activity river

Shared "recent-activity" river for signed-in members. Not a social
network — just a low-stakes surface for "who's tending, right now".

## Files

| File          | Purpose                                              |
|---------------|------------------------------------------------------|
| `feed.jsx`    | (to build) — vertical river of activity cards        |
| `README.md`   | this                                                 |

## v1 wiring

1. Run `supabase-feed.sql`.
2. Enable Realtime on `feed_events` so new activity pushes live.
3. Client emits feed items on:
   - `earn()` — `kind='contribution', amount=+N, label='Chaga extraction'`
   - `buy()`  — `kind='purchase',    label='Reishi Rose gummies'`
   - `unlock()` — `kind='unlock',    label='Dinner Experience'`
   - RSVP `yes` — `kind='rsvp',      label='RSVP'd to Fungi Fever Fest'`
   - New profile — `kind='joined',   label='Joined the network'`
   - Rep tier crossing — `kind='tier_up', label='Reached Forager'`
4. UI queries `feed_events` order by created_at desc limit 20.
   Realtime channel appends new rows to the top with a soft glow.

## What NOT to push into the feed

- Anything from `messages_e2e` — those are E2E-encrypted for a reason.
- Anything from `hypha_gifts` — gift amounts are private between
  founder + recipient.
- Anything with a `contact` field or email address.
- Private lab notes / member notes.

Feed is a *front-facing* signal. Every write goes through the actor's
own RLS-scoped INSERT — nobody can post activity as someone else.

## Design suggestion (for when you build the UI)

Match the new Apothecary aesthetic: deep-void background, per-item
accent color derived from the actor's tier, gradient-border card with
the actor's tiny avatar orb, "just now" → "3h" → date fade as the row
ages down the river. Live-in soft glow when a new row lands.
