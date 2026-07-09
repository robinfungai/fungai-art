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
//
// ─── Admin notification email ──────────────────────────────────
// After the order row is flipped to `paid`, we send Robin an email
// via Resend containing customer + shipping address + items + total
// + Stripe references. Requires RESEND_API_KEY (already set for the
// newsletter function). Optional ADMIN_EMAIL env var overrides the
// default recipient (robin@fungai.art). If Resend fails the webhook
// still returns 200 — the order is already saved.
// ════════════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ─── HTML escaper ───────────────────────────────────────────────
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ─── Admin order notification via Resend ────────────────────────
async function sendAdminOrderEmail(order) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('[stripe-webhook] RESEND_API_KEY not set — admin notification skipped for order', order.id);
    return;
  }
  const adminEmail = process.env.ADMIN_EMAIL || 'robin@fungai.art';
  const from = process.env.NEWSLETTER_FROM || 'Fungai Art <noreply@fungai.art>';

  const total    = Number(order.total_eur || 0).toFixed(2);
  const subtotal = Number(order.subtotal_eur || 0).toFixed(2);
  const shipping = Number(order.shipping_eur || 0);
  const items    = Array.isArray(order.items) ? order.items : [];
  const itemCount = order.item_count || items.reduce((a, i) => a + Number(i.qty || 0), 0);

  const itemsHtml = items.length
    ? items.map(i =>
        `<tr><td style="padding:6px 0;">${esc(i.qty)}× ${esc(i.name)}</td>` +
        `<td style="text-align:right;padding:6px 0;">€${(Number(i.unit_eur || 0) * Number(i.qty || 0)).toFixed(2)}</td></tr>`
      ).join('')
    : `<tr><td colspan="2" style="padding:6px 0;opacity:0.6;font-style:italic;">Item list unavailable (order recovered from Stripe metadata). Summary: ${esc(order.admin_notes || '(none)')}</td></tr>`;

  const subject = `[Fungai order] €${total} · ${order.customer_name || '(no name)'} · ${itemCount} item${itemCount === 1 ? '' : 's'}`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#060809;color:#C9B894;font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="background:#0F1014;border:0.5px solid rgba(196,136,56,.18);border-radius:14px;padding:36px 30px;">
      <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#E8B14B;margin-bottom:14px;">✦ New Order</div>
      <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:34px;color:#E6D9B5;line-height:1.1;margin:0 0 6px;">€${esc(total)}</h1>
      <div style="font-family:'Courier New',monospace;font-size:11px;color:#8B7E62;letter-spacing:0.08em;">${itemCount} item${itemCount === 1 ? '' : 's'}</div>

      <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#8B7E62;margin:26px 0 8px;">Customer</div>
      <p style="font-size:14px;line-height:1.6;color:#C9B894;margin:0 0 16px;">
        <strong style="color:#E6D9B5;">${esc(order.customer_name || '(name missing)')}</strong><br>
        <a href="mailto:${esc(order.customer_email || '')}" style="color:#E8B14B;text-decoration:none;">${esc(order.customer_email || '')}</a>${order.customer_phone ? `<br><a href="tel:${esc(order.customer_phone)}" style="color:#C9B894;text-decoration:none;">${esc(order.customer_phone)}</a>` : ''}
      </p>

      <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#8B7E62;margin:20px 0 8px;">Ship to</div>
      <p style="font-size:14px;line-height:1.6;color:#C9B894;white-space:pre-wrap;margin:0 0 22px;">${esc(order.shipping_address || '(no address)')}</p>

      <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#8B7E62;margin:22px 0 8px;">Items</div>
      <table style="width:100%;font-size:13px;color:#C9B894;border-collapse:collapse;margin-bottom:6px;">
        ${itemsHtml}
        <tr style="border-top:0.5px solid rgba(196,136,56,.18);"><td style="padding:10px 0 6px;">Subtotal</td><td style="text-align:right;padding:10px 0 6px;">€${esc(subtotal)}</td></tr>
        <tr><td style="padding:2px 0;">Shipping</td><td style="text-align:right;padding:2px 0;">${shipping > 0 ? '€' + shipping.toFixed(2) : 'Free'}</td></tr>
        <tr style="border-top:0.5px solid rgba(196,136,56,.18);"><td style="color:#E6D9B5;font-weight:600;padding:10px 0;">Total</td><td style="text-align:right;color:#E6D9B5;font-weight:600;padding:10px 0;">€${esc(total)}</td></tr>
      </table>

      <div style="border-top:0.5px solid rgba(196,136,56,.15);margin-top:24px;padding-top:20px;font-family:'Courier New',monospace;font-size:10px;color:#8B7E62;line-height:1.85;">
        Order ID · <span style="color:#C9B894;">${esc(order.id)}</span><br>
        Stripe PI · <span style="color:#C9B894;">${esc(order.payment_intent_id || '(unknown)')}</span>
        ${order.receipt_url ? `<br><br><a href="${esc(order.receipt_url)}" style="color:#E8B14B;text-decoration:none;border-bottom:0.5px solid rgba(232,177,75,0.4);">View Stripe receipt →</a>` : ''}
      </div>

      <div style="margin-top:26px;padding-top:16px;border-top:0.5px solid rgba(196,136,56,.10);font-family:Georgia,serif;font-style:italic;color:#8B7E62;font-size:12px;">
        Mark this order shipped from Supabase → Table Editor → orders — set status, tracking_carrier, tracking_number.
      </div>
    </div>
  </div>
</body></html>`;

  const text = [
    `NEW ORDER · €${total}`,
    `${itemCount} item${itemCount === 1 ? '' : 's'}`,
    ``,
    `Customer: ${order.customer_name || '(no name)'}`,
    `Email:    ${order.customer_email || ''}`,
    order.customer_phone ? `Phone:    ${order.customer_phone}` : '',
    ``,
    `Ship to:`,
    order.shipping_address || '(no address)',
    ``,
    `Items:`,
    ...(items.length
      ? items.map(i => `  ${i.qty}× ${i.name} — €${(Number(i.unit_eur || 0) * Number(i.qty || 0)).toFixed(2)}`)
      : [`  (item list unavailable — recovered from Stripe metadata)`]),
    ``,
    `Subtotal: €${subtotal}`,
    `Shipping: ${shipping > 0 ? '€' + shipping.toFixed(2) : 'Free'}`,
    `Total:    €${total}`,
    ``,
    `Order ID:      ${order.id}`,
    `Stripe intent: ${order.payment_intent_id || '(unknown)'}`,
    order.receipt_url ? `Receipt:       ${order.receipt_url}` : '',
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
        to: [adminEmail],
        reply_to: order.customer_email || undefined,
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      console.error('[stripe-webhook] Admin email send failed:', res.status, detail);
    }
  } catch (e) {
    console.error('[stripe-webhook] Admin email threw:', e.message);
  }
}

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
    // Re-read the row we just inserted so the email helper gets the full,
    // typed shape from Postgres (numerics decoded, defaults populated).
    const { data: recovered } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (recovered) await sendAdminOrderEmail(recovered);
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

  // Fetch the full row so the email includes items + address (existing
  // only had id + status). Any email failure is logged but does NOT
  // fail the webhook — the order is already saved.
  const { data: full } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (full) await sendAdminOrderEmail(full);

  return { statusCode: 200, body: JSON.stringify({ received: true, orderId, status: 'paid' }) };
};
