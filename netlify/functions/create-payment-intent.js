// ════════════════════════════════════════════════════════════════
// Fungai Art · Stripe Payment Intent (server-side priced)
// ════════════════════════════════════════════════════════════════
// SECURITY: never trust a client-supplied total. The previous version
// took `amount` from the request body and charged it directly — a user
// with DevTools could pay €0.01 for a €50 order. This version takes
// `items` (id + qty), looks each price up from the server-side CATALOG
// below, and creates the PaymentIntent from the figure IT computed.
//
// The client may still show the user a total — but the server's number
// is the only one Stripe sees.
//
// REQUEST SHAPE:
//   POST /api/create-payment-intent
//   { items: [{ name, qty }, ...],
//     customer: { name, email, address },
//     idempotencyKey: 'uuid' }   // one per checkout attempt, lets a
//                                 // double-tap on "Pay" collapse to one intent
//
// RESPONSE SHAPE:
//   { clientSecret, total, currency: 'eur', shipping }
// ════════════════════════════════════════════════════════════════

import Stripe from 'stripe';

// ── Server-side price catalog ─────────────────────────────────────
// Keys match exactly what the shop sends in `item.name` (the same
// string used in addToCart calls). Adding a new product requires a
// matching entry here OR the order fails — by design.
// Prices are euros; the server converts to cents for Stripe.
const CATALOG = {
  // Mushroom apothecary
  'Amanita Muscaria':                  50,
  'Chaga Tincture':                    38,
  'Chaga Syrup':                       11,
  'Wild Cordyceps':                    33,
  'Reishi Tincture':                   33,

  // Tonics & elixirs
  'Temple Nectar':                     38,
  'Ruby No.7':                         33,
  'Lucid':                             44,
  'Moon Support':                      33,
  'ADHD Support':                      38,
  'Mineral Tonic':                     38,
  'Healthy Aging':                     44,

  // Botanicals (dried)
  'Blue Lotus (dried 100g)':           44,
  'Horny Goat Weed (dried 100g)':      28,
  'Butterfly Pea (dried 100g)':        28,
  'Sacred Lavendula (foraged 50g)':    22,

  // Sacred goods / specialty
  'Kumbaya Herbal Smoke Blend':         7,
  'Pine Cones':                        33,
  'Shilajit + Gold':                   33,

  // Saffron variants — name embeds size, server treats each as its own SKU
  'Afghan Saffron (3g)':               44,
  'Afghan Saffron (5g)':               66,
  'Afghan Saffron (10g)':             100,
};

// Free EU shipping at this subtotal, else flat fee.
const SHIPPING_FLAT_EUR     = 4.90;
const SHIPPING_FREE_OVER    = 60;

const MAX_QTY_PER_LINE      = 20;   // hard ceiling, defangs a request for 999999 of something
const MAX_LINES_PER_ORDER   = 40;   // defangs giant payloads

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('[create-payment-intent] STRIPE_SECRET_KEY env var is not set');
    return json(500, { error: 'Payment server not configured (stripe_secret_key missing). Contact site admin.' });
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

  // ── Price the order from the catalog. Any unknown SKU rejects the
  // whole request — better to error than to silently miss revenue.
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
    priced.push({ name, qty, unitEur });
  }

  const shipping = subtotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_FLAT_EUR;
  const total    = subtotal + shipping;
  const amountCents = Math.round(total * 100);
  if (amountCents <= 0) {
    return json(400, { error: 'Computed total is zero. Refusing to charge.' });
  }

  // Stripe metadata has a 500-char limit per value. The old version
  // stuffed the whole item list in there — a long cart broke checkout.
  // We keep only a short audit summary; the real order lives in our
  // own database (orders table — see Stripe webhook function).
  const itemSummary = priced
    .map(p => `${p.qty}x ${p.name}`)
    .join('; ')
    .slice(0, 480);

  try {
    const stripe = new Stripe(secret);
    const opts = idempotencyKey ? { idempotencyKey: String(idempotencyKey).slice(0, 200) } : {};
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      receipt_email: customer.email || undefined,
      metadata: {
        customer_name:    String(customer.name    || '').slice(0, 200),
        customer_email:   String(customer.email   || '').slice(0, 200),
        shipping_address: String(customer.address || '').slice(0, 480),
        item_summary:     itemSummary,
        item_count:       String(priced.reduce((a, p) => a + p.qty, 0)),
        subtotal_eur:     String(subtotal),
        shipping_eur:     String(shipping),
      },
    }, opts);

    return json(200, {
      clientSecret: paymentIntent.client_secret,
      total,
      subtotal,
      shipping,
      currency: 'eur',
    });
  } catch (err) {
    console.error('[create-payment-intent] Stripe error:', err.message);
    return json(500, { error: err.message || 'Stripe request failed.' });
  }
};
