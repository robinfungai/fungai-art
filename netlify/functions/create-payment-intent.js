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

// ─── HTML escaper (mirrors stripe-webhook.js) ───────────────────
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ─── Draft-order notification ("double security") ──────────────
// Fires as soon as the customer submits their checkout form and we
// create the draft order + PaymentIntent — BEFORE Stripe confirms
// payment. This is the first of two admin emails per order (the
// second is the "paid" email from stripe-webhook.js). Purpose:
// Robin sees who's about to pay + their shipping address in
// real time, so fraudulent or wrong addresses can be caught before
// the card actually charges. Fails silently if Resend is down —
// checkout must not depend on email delivery.
async function sendDraftOrderEmail({ orderId, paymentIntentId, customer, priced, subtotal, shipping, total }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('[create-payment-intent] RESEND_API_KEY not set — draft notification skipped');
    return;
  }
  const rawAdmin = process.env.ADMIN_EMAIL || 'robin@fungai.art';
  const adminRecipients = rawAdmin.split(',').map(s => s.trim()).filter(Boolean);
  if (adminRecipients.length === 0) return;
  const from = process.env.NEWSLETTER_FROM || 'Fungai Art <noreply@fungai.art>';

  const itemCount = priced.reduce((a, p) => a + p.qty, 0);
  const totalStr    = Number(total).toFixed(2);
  const subtotalStr = Number(subtotal).toFixed(2);
  const shippingStr = Number(shipping) > 0 ? '€' + Number(shipping).toFixed(2) : 'Free';

  const itemsHtml = priced.map(p =>
    `<tr><td style="padding:6px 0;">${esc(p.qty)}× ${esc(p.name)}</td>` +
    `<td style="text-align:right;padding:6px 0;">€${(p.unit_eur * p.qty).toFixed(2)}</td></tr>`
  ).join('');

  // Subject prefix "[Fungai · CHECKOUT]" so it sorts / filters separately
  // from the "[Fungai order]" paid emails in Robin's inbox.
  const subject = `[Fungai · CHECKOUT] €${totalStr} · ${customer.name || '(no name)'} · ${itemCount} item${itemCount === 1 ? '' : 's'}`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#060809;color:#C9B894;font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="background:#0F1014;border:0.5px solid rgba(232,177,75,.35);border-radius:14px;padding:36px 30px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#E8B14B;margin-bottom:14px;">⚠ Checkout Started · payment not yet confirmed</div>
      <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:34px;color:#E6D9B5;line-height:1.1;margin:0 0 6px;">€${esc(totalStr)}</h1>
      <div style="font-family:'Courier New',monospace;font-size:11px;color:#8B7E62;letter-spacing:0.08em;">${itemCount} item${itemCount === 1 ? '' : 's'} · draft order</div>

      <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#8B7E62;margin:26px 0 8px;">Customer</div>
      <p style="font-size:14px;line-height:1.6;color:#C9B894;margin:0 0 16px;">
        <strong style="color:#E6D9B5;">${esc(customer.name || '(name missing)')}</strong><br>
        <a href="mailto:${esc(customer.email || '')}" style="color:#E8B14B;text-decoration:none;">${esc(customer.email || '')}</a>${customer.phone ? `<br><a href="tel:${esc(customer.phone)}" style="color:#C9B894;text-decoration:none;">${esc(customer.phone)}</a>` : ''}
      </p>

      <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#8B7E62;margin:20px 0 8px;">Ship to</div>
      <p style="font-size:14px;line-height:1.6;color:#C9B894;white-space:pre-wrap;margin:0 0 22px;">${esc(customer.address || '(no address)')}</p>

      <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#8B7E62;margin:22px 0 8px;">Items</div>
      <table style="width:100%;font-size:13px;color:#C9B894;border-collapse:collapse;margin-bottom:6px;">
        ${itemsHtml}
        <tr style="border-top:0.5px solid rgba(232,177,75,.22);"><td style="padding:10px 0 6px;">Subtotal</td><td style="text-align:right;padding:10px 0 6px;">€${esc(subtotalStr)}</td></tr>
        <tr><td style="padding:2px 0;">Shipping</td><td style="text-align:right;padding:2px 0;">${shippingStr}</td></tr>
        <tr style="border-top:0.5px solid rgba(232,177,75,.22);"><td style="color:#E6D9B5;font-weight:600;padding:10px 0;">Total</td><td style="text-align:right;color:#E6D9B5;font-weight:600;padding:10px 0;">€${esc(totalStr)}</td></tr>
      </table>

      <div style="border-top:0.5px solid rgba(232,177,75,.20);margin-top:24px;padding-top:20px;font-family:'Courier New',monospace;font-size:10px;color:#8B7E62;line-height:1.85;">
        Order ID · <span style="color:#C9B894;">${esc(orderId || '(pending)')}</span><br>
        Stripe PI · <span style="color:#C9B894;">${esc(paymentIntentId || '(pending)')}</span>
      </div>

      <div style="margin-top:22px;padding:14px 16px;background:rgba(232,177,75,0.08);border-radius:8px;font-family:Georgia,serif;font-style:italic;color:#E8B14B;font-size:13px;line-height:1.55;">
        Do not ship yet. This email fires when the customer submits their address. You'll receive a second email marked <strong>New Order · paid</strong> when Stripe confirms payment. Ship only after that arrives.
      </div>
    </div>
  </div>
</body></html>`;

  const text = [
    `CHECKOUT STARTED · payment not yet confirmed`,
    `€${totalStr} · ${itemCount} item${itemCount === 1 ? '' : 's'}`,
    ``,
    `Customer: ${customer.name || '(no name)'}`,
    `Email:    ${customer.email || ''}`,
    customer.phone ? `Phone:    ${customer.phone}` : '',
    ``,
    `Ship to:`,
    customer.address || '(no address)',
    ``,
    `Items:`,
    ...priced.map(p => `  ${p.qty}× ${p.name} — €${(p.unit_eur * p.qty).toFixed(2)}`),
    ``,
    `Subtotal: €${subtotalStr}`,
    `Shipping: ${shippingStr}`,
    `Total:    €${totalStr}`,
    ``,
    `Order ID:      ${orderId || '(pending)'}`,
    `Stripe intent: ${paymentIntentId || '(pending)'}`,
    ``,
    `⚠ Do NOT ship yet. This is the first of two notifications per order.`,
    `  Wait for the "New Order · paid" email before shipping.`,
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: adminRecipients,
        reply_to: customer.email || undefined,
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      console.error('[create-payment-intent] Draft email send failed:', res.status, detail);
    }
  } catch (e) {
    console.error('[create-payment-intent] Draft email threw:', e.message);
  }
}

// ── Server-side price catalog ─────────────────────────────────────
// Keys match exactly what the shop sends in `item.name` (the same
// string used in addToCart calls). Adding a new product requires a
// matching entry here OR the order fails — by design.
const CATALOG = {
  // Liquid extracts (fungi tinctures + compositions) mostly at €44.
  // Amanita is the exception — spagyric preparation, foraged, €48.
  // Nettle Tincture is a single-herb tonic at €33.
  // Chaga Syrup stays €11 — different form, different price point.
  'Amanita Muscaria':                  48,
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
  'Nervous System Tonic':              44,
  'Sleepy Sleepy':                     44,
  'Nettle Tincture':                   33,
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

// Ships from Sweden. Robin's floor: €6 minimum on every order,
// no free-shipping threshold. If you later want country tiers or
// a legitimate free-over incentive, edit here + mirror in shop's
// renderSummary + expectedTotal (grep "shipping" in shop/index.html).
const SHIPPING_FLAT_EUR  = 6.00;
const SHIPPING_FREE_OVER = Infinity;
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

    // "Double security" — fire the draft-order admin email so Robin sees
    // who's checking out (name + shipping address) BEFORE Stripe confirms
    // payment. The second email arrives from stripe-webhook.js once the
    // card actually charges. Awaited so we don't lose the send if the
    // Lambda freezes, but any error is swallowed inside — checkout must
    // not fail because email failed.
    await sendDraftOrderEmail({
      orderId,
      paymentIntentId: paymentIntent.id,
      customer,
      priced,
      subtotal,
      shipping,
      total,
    });

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
