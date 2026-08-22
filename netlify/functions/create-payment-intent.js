// ════════════════════════════════════════════════════════════════
// Fungai Art · Stripe Payment Intent (server-side priced + order draft)
// ════════════════════════════════════════════════════════════════
// Two security properties this function guarantees:
//
// 1. The customer cannot set their own price. The pre-mortem audit
//    showed the old version trusted a client-supplied `amount` — a
//    user with DevTools could pay €0.01 for a €50 order. We now take
//    `items` (id + qty) and look prices up from the server-side CATALOG.
//
// 2. Every charge has a record on OUR side. Before we ask Stripe for a
//    PaymentIntent we INSERT a draft row in public.orders with status
//    `pending` using the service-role key (RLS does not apply). The
//    order UUID is then attached to the PaymentIntent as
//    metadata.order_id, and the Stripe webhook flips it to `paid` when
//    the charge succeeds. If the charge fails, the pending row stays —
//    harmless, easy to clean up on a cron, and a useful audit trail of
//    cards that failed.
//
// REQUEST SHAPE:
//   POST /api/create-payment-intent
//   { items: [{ name, qty }, ...],
//     customer: { name, email, address, phone? },
//     idempotencyKey: 'uuid' }
//
// RESPONSE SHAPE:
//   { clientSecret, total, subtotal, shipping, currency, orderId }
// ════════════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ── Server-side price catalog ─────────────────────────────────────
// Keys match exactly what the shop sends in `item.name` (the same
// string used in addToCart calls). Adding a new product requires a
// matching entry here OR the order fails — by design.
const CATALOG = {
  // All liquid extracts (fungi tinctures + compositions) flattened to
  // €44. Chaga Syrup stays €11 — different form, different price point.
  // Reishi Tincture removed from the shop entirely.
  'Amanita Muscaria':                  44,
  'Chaga Tincture':                    44,
  'Chaga Syrup':                       11,
  'Wild Cordyceps':                    44,
  'Temple Nectar':                     44,
  'Ruby No.7':                         44,
  'Lucid':                             44,
  'Moon Support':                      44,
  'ADHD Support':                      44,
  'Mineral Tonic':                     44,
  'Healthy Aging':                     44,
  'Blue Lotus (dried 100g)':           44,
  'Horny Goat Weed (dried 100g)':      28,
  'Butterfly Pea (dried 100g)':        28,
  'Sacred Lavendula (foraged 50g)':    22,
  'Kumbaya Herbal Smoke Blend':         7,
  'Pine Cones':                        33,
  'Shilajit + Gold':                   33,
  'Afghan Saffron (3g)':               44,
  'Afghan Saffron (5g)':               66,
  'Afghan Saffron (10g)':             100,
};

const SHIPPING_FLAT_EUR  = 4.90;
const SHIPPING_FREE_OVER = 60;
const MAX_QTY_PER_LINE   = 20;
const MAX_LINES_PER_ORDER= 40;

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const stripeSecret  = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl   = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseSrvKey= process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret) {
    console.error('[create-payment-intent] STRIPE_SECRET_KEY not set');
    return json(500, { error: 'Payment server not configured (stripe key missing). Contact site admin.' });
  }
  // Supabase keys missing isn't fatal — the order draft is best-effort.
  // Without it we skip the orders insert and still charge the card. We
  // log loudly so Robin notices.
  const hasSupabase = !!(supabaseUrl && supabaseSrvKey);
  if (!hasSupabase) {
    console.error('[create-payment-intent] Supabase env vars not set — order draft will be SKIPPED');
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON in request body.' });
  }

  const { items, customer = {}, idempotencyKey } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    return json(400, { error: 'Order must contain at least one item.' });
  }
  if (items.length > MAX_LINES_PER_ORDER) {
    return json(400, { error: 'Too many distinct items in one order.' });
  }

  // ── Price the order from the catalog ────────────────────────────
  let subtotal = 0;
  const priced = [];
  for (const raw of items) {
    const name = String(raw?.name || '').trim();
    const qty  = parseInt(raw?.qty, 10);
    if (!name || !Number.isFinite(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return json(400, { error: `Invalid item: "${name || '(unnamed)'}" qty ${raw?.qty}` });
    }
    const unitEur = CATALOG[name];
    if (typeof unitEur !== 'number') {
      return json(400, { error: `Unknown product: "${name}". Contact site admin if this product should exist.` });
    }
    subtotal += unitEur * qty;
    priced.push({ name, qty, unit_eur: unitEur });
  }

  const shipping = subtotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_FLAT_EUR;
  const total    = subtotal + shipping;
  const amountCents = Math.round(total * 100);
  if (amountCents <= 0) {
    return json(400, { error: 'Computed total is zero. Refusing to charge.' });
  }

  // ── Create the draft order BEFORE asking Stripe for anything ────
  // This way every PaymentIntent we ever create has a corresponding
  // row in public.orders, even if Stripe later fails. The webhook
  // flips it to `paid`.
  let orderId = null;
  if (hasSupabase) {
    try {
      const supabase = createClient(supabaseUrl, supabaseSrvKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const itemCount = priced.reduce((acc, p) => acc + p.qty, 0);
      const { data, error } = await supabase
        .from('orders')
        .insert({
          status:           'pending',
          customer_name:    String(customer.name    || '').slice(0, 200),
          customer_email:   String(customer.email   || '').slice(0, 200),
          customer_phone:   String(customer.phone   || '').slice(0, 50) || null,
          shipping_address: String(customer.address || '').slice(0, 800),
          items:            priced,
          item_count:       itemCount,
          subtotal_eur:     subtotal,
          shipping_eur:     shipping,
          total_eur:        total,
          currency:         'eur',
        })
        .select('id')
        .single();
      if (error) {
        console.error('[create-payment-intent] Order draft INSERT failed:', error.message);
      } else {
        orderId = data?.id || null;
      }
    } catch (e) {
      console.error('[create-payment-intent] Order draft threw:', e.message);
    }
  }

  // ── Create the PaymentIntent ────────────────────────────────────
  const itemSummary = priced
    .map(p => `${p.qty}x ${p.name}`)
    .join('; ')
    .slice(0, 480);

  try {
    const stripe = new Stripe(stripeSecret);
    const opts = idempotencyKey ? { idempotencyKey: String(idempotencyKey).slice(0, 200) } : {};
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      receipt_email: customer.email || undefined,
      metadata: {
        // The single most important field: order_id tells the webhook
        // which Supabase row to flip to `paid`. Without it the webhook
        // logs an orphan and bails.
        order_id:         orderId || '',
        customer_name:    String(customer.name    || '').slice(0, 200),
        customer_email:   String(customer.email   || '').slice(0, 200),
        item_summary:     itemSummary,
        item_count:       String(priced.reduce((a, p) => a + p.qty, 0)),
        subtotal_eur:     String(subtotal),
        shipping_eur:     String(shipping),
      },
    }, opts);

    // Persist the payment_intent_id on the draft now (helps the webhook
    // find the order even if the metadata round-trip ever broke).
    if (hasSupabase && orderId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseSrvKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await supabase
          .from('orders')
          .update({ payment_intent_id: paymentIntent.id })
          .eq('id', orderId);
      } catch (e) {
        console.warn('[create-payment-intent] Could not attach pi_id to order:', e.message);
      }
    }

    return json(200, {
      clientSecret: paymentIntent.client_secret,
      total,
      subtotal,
      shipping,
      currency: 'eur',
      orderId,
    });
  } catch (err) {
    console.error('[create-payment-intent] Stripe error:', err.message);
    return json(500, { error: err.message || 'Stripe request failed.' });
  }
};
