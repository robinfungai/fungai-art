-- ════════════════════════════════════════════════════════════════
-- newsletter_subscribers — proper double-opt-in list
-- ════════════════════════════════════════════════════════════════
--
-- WHY THIS EXISTS:
-- The current /api/subscribe-newsletter endpoint sends a welcome email
-- via Resend but stores nothing. The welcome promises "one email a
-- month, written by hand" — but you have no list to send the second
-- email to. And the endpoint is open: any address can be submitted
-- from anywhere, and we'd send a Fungai-branded welcome to it, which
-- means we're a free mailer for any abuser until Resend suspends us.
--
-- This table is the list. Double-opt-in flow:
--   1. /api/subscribe-newsletter writes a row with confirmed_at NULL
--      and a random confirm_token; sends a confirm-link email instead
--      of the welcome.
--   2. Recipient clicks the link → /api/confirm-subscription sets
--      confirmed_at = now() and THEN sends the welcome.
--   3. To unsubscribe, every email's footer carries a separate
--      unsubscribe_token link → /api/unsubscribe sets unsubscribed_at.
--
-- This pattern (confirm-before-send-welcome) defeats the mailer-abuse
-- problem because abusers don't have access to the target's inbox to
-- click the confirm link. It also gives you GDPR-compliant consent
-- (timestamped + IP-stamped) without extra plumbing.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query →
-- paste this file → Run. Idempotent.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     text NOT NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),

  -- Double-opt-in state. confirmed_at NULL = pending. Set by the
  -- confirm-link endpoint when the recipient clicks the link in the
  -- confirmation email. Until this is set, NO content emails are sent
  -- to this address — only the one-time confirmation message.
  confirmed_at              timestamptz,
  confirm_token             text NOT NULL,
  confirm_token_expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),

  -- Unsubscribe state. Every outbound email carries an unsubscribe
  -- link with this token. Setting unsubscribed_at excludes the row
  -- from sends without deleting the record (so you can detect a
  -- resubscribe and not double-send).
  unsubscribed_at           timestamptz,
  unsubscribe_token         text NOT NULL,

  -- Audit. source tells you whether they came from the home page,
  -- mycelium, an event landing page, etc. ip + user_agent are GDPR-
  -- friendly consent proof if anyone ever complains.
  source                    text NOT NULL DEFAULT 'home',
  signup_ip                 inet,
  signup_user_agent         text,

  -- Keep emails unique. Case-insensitive: 'Robin@Fungai.art' and
  -- 'robin@fungai.art' are the same person.
  CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email)
);

-- Index for the confirm + unsubscribe lookups. These run on every
-- confirm-link click, so they want to be O(1).
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx
  ON public.newsletter_subscribers (confirm_token);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_idx
  ON public.newsletter_subscribers (unsubscribe_token);

-- Index for "show me everyone confirmed and not unsubscribed" — the
-- query you'd run to build the actual newsletter send list.
CREATE INDEX IF NOT EXISTS newsletter_subscribers_active_idx
  ON public.newsletter_subscribers (created_at DESC)
  WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ── Policies ────────────────────────────────────────────────────

-- SELECT: admins only. The subscriber list is private.
DROP POLICY IF EXISTS "newsletter_select_admin" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_select_admin"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- INSERT / UPDATE / DELETE: nobody via RLS. All writes go through the
-- three Netlify functions (subscribe, confirm, unsubscribe) which use
-- the service-role key. This keeps token-validation logic server-side
-- where it can't be bypassed by a crafted request.
--
-- (If you wanted anon to write directly, you'd have to expose
-- confirm_token generation to the client, which defeats double-opt-in.)

GRANT SELECT ON public.newsletter_subscribers TO authenticated;

-- ── Notes ───────────────────────────────────────────────────────
-- Three Netlify functions go with this table (not in this file):
--
--   /api/subscribe-newsletter   (rewrite of existing function)
--      - Validates email shape
--      - Rate-limits per IP (defangs the "mailer for abusers" gap)
--      - INSERT row with confirmed_at NULL + random confirm_token
--      - Send CONFIRMATION email (not welcome) with a link
--        https://www.fungai.art/api/confirm-subscription?t=<token>
--
--   /api/confirm-subscription   (new)
--      - Read token from query
--      - UPDATE row SET confirmed_at = now() WHERE confirm_token = ?
--        AND confirmed_at IS NULL AND confirm_token_expires_at > now()
--      - Send the WELCOME email (the current one)
--      - Redirect to a /newsletter-confirmed page
--
--   /api/unsubscribe   (new)
--      - Read token from query
--      - UPDATE row SET unsubscribed_at = now() WHERE unsubscribe_token = ?
--      - Show a "you've been removed" page
--
-- Every monthly newsletter send queries:
--   SELECT email FROM newsletter_subscribers
--     WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;
