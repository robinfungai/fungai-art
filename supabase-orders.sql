-- ════════════════════════════════════════════════════════════════
-- orders — the table you own where every Stripe order lands
-- ════════════════════════════════════════════════════════════════
--
-- WHY THIS EXISTS:
-- Right now when a customer buys something, Stripe charges the card,
-- the customer sees "thank you", the cart clears, and NOTHING is
-- written anywhere you control. The only record is in Stripe's
-- dashboard. That's fine until the first "where's my order?" email
-- or chargeback — then you're reconstructing a transaction from
-- memory and metadata fields.
--
-- This table is your source of truth. A Stripe webhook function
-- (separate from this SQL — to be wired next) writes one row per
-- successful payment with everything you need to fulfill, ship,
-- and reconcile. Status moves: pending → paid → shipped → delivered.
--
-- READ ACCESS: admins only (you + Stephanie). Customers don't get to
-- list orders — that needs its own customer-facing endpoint later.
-- WRITE ACCESS: the webhook uses the SUPABASE_SERVICE_ROLE_KEY which
-- bypasses RLS entirely, so writes happen server-side only. Admins
-- can also update (to mark shipped, add tracking, etc.) from a
-- future admin orders page.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query →
-- paste this file → Run. Idempotent.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Stripe references. payment_intent_id is unique so the webhook can
  -- be safely retried — a second delivery of the same event won't
  -- create a duplicate row.
  payment_intent_id   text UNIQUE,
  charge_id           text,
  receipt_url         text,

  -- Order status. Workflow:
  --   pending   — created before payment confirmed (rare; the webhook
  --               only writes paid orders, but kept for manual entry)
  --   paid      — Stripe confirmed payment
  --   shipped   — you've sent it, add tracking_number
  --   delivered — courier marked delivered (or you marked it manually)
  --   cancelled — order voided before ship
  --   refunded  — money returned through Stripe
  status              text NOT NULL DEFAULT 'paid'
                          CHECK (status IN ('pending','paid','shipped','delivered','cancelled','refunded')),

  -- Customer details captured at checkout. shipping_address is kept
  -- as one text blob because the front-end currently submits it that
  -- way (street + city in one field). If you split it later, add
  -- separate columns; don't try to parse this.
  customer_name       text,
  customer_email      text NOT NULL,
  customer_phone      text,
  shipping_address    text,

  -- The order itself. items is a JSON array of
  --   [{ name: "Amanita Muscaria", qty: 1, unit_eur: 50 }, ...]
  -- exactly as the server-side catalog priced them. Kept as JSON so
  -- you don't need a separate line_items table for what is mostly a
  -- read-only audit trail. The same data exists in Stripe metadata
  -- as a short summary; this is the full version.
  items               jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_count          int NOT NULL DEFAULT 0,

  -- Money. Stored as euros (the same units the catalog uses) — the
  -- function passes cents to Stripe and euros to this table. Keeping
  -- both denominations means no rounding surprises in admin queries.
  subtotal_eur        numeric(10,2) NOT NULL DEFAULT 0,
  shipping_eur        numeric(10,2) NOT NULL DEFAULT 0,
  total_eur           numeric(10,2) NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'eur',

  -- Fulfillment tracking. tracking_carrier is free-form ("DHL", "DPD",
  -- "Posti", "PostNord") because Robin ships from Berlin/Sweden and
  -- the carriers vary. tracking_number is the courier reference.
  tracking_carrier    text,
  tracking_number     text,
  shipped_at          timestamptz,
  delivered_at        timestamptz,

  -- Internal admin notes (substitutions, special instructions, refund
  -- reasons). Never shown to the customer.
  admin_notes         text
);

-- Trigger keeps updated_at honest on every change.
CREATE OR REPLACE FUNCTION public.orders_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_touch_updated_at();

-- Indexes for the queries the admin panel will run.
CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx
  ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx
  ON public.orders (lower(customer_email));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ── Policies ────────────────────────────────────────────────────

-- SELECT: admin only. Drops `customers can see orders` until we build
-- a customer order-lookup page (which needs its own auth flow).
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
CREATE POLICY "orders_select_admin"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- INSERT: nobody via RLS. Writes come from the Stripe webhook
-- function using SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
-- Without an INSERT policy, anon and authenticated writes return a
-- permission error — which is what we want.

-- UPDATE: admin only (mark shipped, add tracking, refund).
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- DELETE: nobody. Orders are immutable history; cancellations move
-- through the status field instead. If something truly catastrophic
-- happens, delete from the Supabase Dashboard with full audit.

GRANT SELECT, UPDATE ON public.orders TO authenticated;

-- ── Notes ───────────────────────────────────────────────────────
-- Next step (not in this file): create a Netlify function
-- `netlify/functions/stripe-webhook.js` that:
--   1. Verifies the Stripe-Signature header against
--      process.env.STRIPE_WEBHOOK_SECRET
--   2. On `payment_intent.succeeded`, reads the PaymentIntent's
--      metadata + the line items (passed through from
--      create-payment-intent) and INSERTs a row here using a
--      Supabase client built from SUPABASE_SERVICE_ROLE_KEY.
--   3. Returns 200 fast so Stripe doesn't retry.
-- Webhook URL to register in the Stripe Dashboard:
--   https://www.fungai.art/api/stripe-webhook
