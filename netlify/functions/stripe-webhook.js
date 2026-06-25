// ════════════════════════════════════════════════════════════════
// Fungai Art · Stripe Webhook
// ════════════════════════════════════════════════════════════════
//
// Stripe POSTs here when something happens to a payment. We listen for
// `payment_intent.succeeded` and flip the matching row in public.orders
// from `pending` to `paid`, attach the Stripe charge id + receipt URL,
// and return 200 fast so Stripe doesn't retry.
//
// The PaymentIntent's metadata.order_id (set by create-payment-intent)
// is how we link the Stripe event to our row.
//
// ─── Setup checklist ────────────────────────────────────────────
//   1. Run supabase-orders.sql in Supabase SQL Editor — done.
//   2. Set Netlify env vars (Site → Settings → Environment variables):
//        STRIPE_SECRET_KEY         (already set)
//        STRIPE_WEBHOOK_SECRET     (new — see step 3)
//        SUPABASE_URL              (= VITE_SUPABASE_URL value)
//        SUPABASE_SERVICE_ROLE_KEY (new — Supabase Dashboard
//                                    → Project Settings → API → service_role)
//   3. Register the webhook in Stripe Dashboard → Developers → Webhooks:
//        URL:    https://www.fungai.art/api/stripe-webhook
//        Events: payment_intent.succeeded
//        After save, Stripe shows a "Signing secret" (whsec_...) —
//        that's STRIPE_WEBHOOK_SECRET.
//   4. Stripe lets you "Send test webhook" from the dashboard — do that
//      once after deploy to confirm the function is wired.
//
// SECURITY: every event Stripe sends carries a stripe-signature header.
// We verify it against STRIPE_WEBHOOK_SECRET so an attacker can't POST
// a forged "order succeeded" event to mark unpaid orders as paid.
// ════════════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const stripeSecret  = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl   = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseSrvKey= process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !webhookSecret) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET missing');
    // Return 500 so Stripe retries — gives Robin a chance to set the env vars.
    return { statusCode: 500, body: 'Webhook not configured' };
  }
  if (!supabaseUrl || !supabaseSrvKey) {
    console.error('[stripe-webhook] Supabase env vars missing — cannot record orders');
    return { statusCode: 500, body: 'Order store not configured' };
  }

  // Stripe needs the RAW request body for signature verification.
  // Netlify Functions deliver the body as a string in event.body, but
  // it may be base64-encoded depending on content type. Decode if so.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');

  const sig = event.headers['stripe-signature']
           || event.headers['Stripe-Signature']
           || '';

  const stripe = new Stripe(stripeSecret);
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // We only care about payment_intent.succeeded for now. Other event
  // types (payment_intent.payment_failed, charge.refunded) can be
  // added later — return 200 so Stripe doesn't mark this endpoint as
  // failing them.
  if (stripeEvent.type !== 'payment_intent.succeeded') {
    return { statusCode: 200, body: JSON.stringify({ received: true, ignored: stripeEvent.type }) };
  }

  const pi = stripeEvent.data.object;
  const orderId = pi.metadata?.order_id || null;

  if (!orderId) {
    // The PaymentIntent was created without our order_id metadata —
    // shouldn't happen now, but it could if someone hand-fires a test
    // event or if a very old PaymentIntent finally settles. Log loudly
    // and return 200 (Stripe shouldn't retry forever).
    console.warn('[stripe-webhook] payment_intent.succeeded with no order_id, pi:', pi.id, 'amount:', pi.amount);
    return { statusCode: 200, body: JSON.stringify({ received: true, note: 'no order_id in metadata' }) };
  }

  // Try to enrich with the actual charge (receipt URL is on the charge,
  // not the PaymentIntent). Non-fatal if it fails.
  let chargeId = pi.latest_charge || null;
  let receiptUrl = null;
  try {
    if (chargeId) {
      const charge = await stripe.charges.retrieve(chargeId);
      receiptUrl = charge.receipt_url || null;
    }
  } catch (e) {
    console.warn('[stripe-webhook] Could not fetch charge for receipt URL:', e.message);
  }

  // Service-role client bypasses RLS — necessary because the orders
  // table has no INSERT/UPDATE policy for anon or authenticated.
  const supabase = createClient(supabaseUrl, supabaseSrvKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: lookupErr } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (lookupErr) {
    console.error('[stripe-webhook] Order lookup failed:', lookupErr.message);
    return { statusCode: 500, body: 'Order lookup failed' };
  }

  if (!existing) {
    // The draft order row was never written (Supabase was down when
    // create-payment-intent ran). Recreate it now from the
    // PaymentIntent metadata so no successful charge ever goes
    // unrecorded.
    console.warn('[stripe-webhook] Order row missing — recreating from PI metadata. order_id:', orderId, 'pi:', pi.id);
    const { error: insertErr } = await supabase
      .from('orders')
      .insert({
        id:               orderId,
        status:           'paid',
        payment_intent_id: pi.id,
        charge_id:        chargeId,
        receipt_url:      receiptUrl,
        customer_name:    pi.metadata?.customer_name || null,
        customer_email:   pi.metadata?.customer_email || pi.receipt_email || '',
        items:            [],  // we don't have the full item list here, only the summary
        item_count:       parseInt(pi.metadata?.item_count || '0', 10) || 0,
        subtotal_eur:     parseFloat(pi.metadata?.subtotal_eur || '0') || 0,
        shipping_eur:     parseFloat(pi.metadata?.shipping_eur || '0') || 0,
        total_eur:        (pi.amount || 0) / 100,
        currency:         pi.currency || 'eur',
        admin_notes:      'Recovered from PaymentIntent metadata — original draft row was missing. Item summary: ' + (pi.metadata?.item_summary || '(unknown)'),
      });
    if (insertErr) {
      console.error('[stripe-webhook] Recovery insert failed:', insertErr.message);
      return { statusCode: 500, body: 'Recovery insert failed' };
    }
    return { statusCode: 200, body: JSON.stringify({ received: true, recovered: true }) };
  }

  // Idempotency: if the order is already marked paid, this is a re-send
  // of the same event. Acknowledge and bail.
  if (existing.status === 'paid' || existing.status === 'shipped' || existing.status === 'delivered') {
    return { statusCode: 200, body: JSON.stringify({ received: true, alreadyPaid: true }) };
  }

  // Normal path: flip pending → paid + attach Stripe identifiers.
  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      status:            'paid',
      payment_intent_id: pi.id,
      charge_id:         chargeId,
      receipt_url:       receiptUrl,
    })
    .eq('id', orderId);

  if (updateErr) {
    console.error('[stripe-webhook] Order update failed:', updateErr.message);
    return { statusCode: 500, body: 'DB update failed' };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true, orderId, status: 'paid' }) };
};
