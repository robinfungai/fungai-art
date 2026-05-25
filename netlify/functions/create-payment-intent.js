import Stripe from 'stripe';

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
    // Surface a clear, actionable error instead of crashing the function
    console.error('[create-payment-intent] STRIPE_SECRET_KEY env var is not set');
    return json(500, { error: 'Payment server not configured (stripe_secret_key missing). Contact site admin.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON in request body.' });
  }

  const { amount, metadata = {} } = payload;
  if (typeof amount !== 'number' || amount <= 0) {
    return json(400, { error: 'Amount must be a positive number.' });
  }

  try {
    const stripe = new Stripe(secret);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      receipt_email: metadata.email || undefined,
      metadata: {
        customer_name:    metadata.name    || '',
        customer_email:   metadata.email   || '',
        shipping_address: metadata.address || '',
        order_items:      metadata.items   || '',
      },
    });
    return json(200, { clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[create-payment-intent] Stripe error:', err.message);
    return json(500, { error: err.message || 'Stripe request failed.' });
  }
};
