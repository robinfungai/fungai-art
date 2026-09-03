// ════════════════════════════════════════════════════════════════
// Fungai Art · Newsletter one-click unsubscribe
// ════════════════════════════════════════════════════════════════
//
// Reached from the "unsubscribe" link at the bottom of every
// outbound newsletter email (also from the RFC 8058 List-Unsubscribe
// header, which surfaces as a native "Unsubscribe" button in Gmail /
// Apple Mail / Outlook next to the sender name).
//
// URL shape:
//   https://www.fungai.art/api/unsubscribe?t=<unsubscribe_token>
//
// Behavior:
//   1. Look up the row by unsubscribe_token
//   2. Set unsubscribed_at = now() (row stays in the table for
//      audit + resubscribe detection — we don't delete)
//   3. Best-effort remove from the Resend Audience so broadcasts
//      skip them (if RESEND_AUDIENCE_ID is set)
//   4. Render a small confirmation HTML page in the site's palette
//
// GDPR: the unsubscribe request is legally binding; we honor it
// atomically. We don't require any further confirmation click.
// One-click, done.
//
// Rate-limited by IP because someone could theoretically try to
// brute-force unsubscribe_tokens; 128 bits of entropy makes this
// astronomically hard, but rate-limit is cheap defense in depth.
//
// Required env vars:
//   SUPABASE_URL (or VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY
// Optional env vars:
//   RESEND_API_KEY + RESEND_AUDIENCE_ID  — mirror the removal in
//                                          Resend Audience
// ════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// ── Per-IP rate limit ────────────────────────────────────────────
const RATE_WINDOW_MS      = 60_000;
const RATE_MAX_PER_WINDOW = 20; // generous — legit users click once
const rateState = new Map();
function rateLimit(ip) {
  const now  = Date.now();
  const slot = rateState.get(ip);
  if (!slot || now - slot.windowStart > RATE_WINDOW_MS) {
    rateState.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (slot.count >= RATE_MAX_PER_WINDOW) return { ok: false };
  slot.count++;
  return { ok: true };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, slot] of rateState.entries()) {
    if (now - slot.windowStart > RATE_WINDOW_MS * 2) rateState.delete(ip);
  }
}, RATE_WINDOW_MS).unref?.();

export default async function handler(req) {
  const ip = (req.headers.get('x-nf-client-connection-ip')
           || (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim()
           || 'unknown').slice(0, 64);
  if (!rateLimit(ip).ok) {
    return htmlResponse(pageHTML('Too many requests', 'Please try again in a minute.'), 429);
  }

  const url = new URL(req.url);
  const token = (url.searchParams.get('t') || '').trim();

  // RFC 8058 one-click unsubscribe uses POST with a form body.
  // Web-standard fetch: POST + application/x-www-form-urlencoded
  // OR POST + query-string. Either way, we already have the token.
  if (req.method !== 'GET' && req.method !== 'POST') {
    return htmlResponse(pageHTML('Method not allowed', 'This link only supports GET and POST.'), 405);
  }
  if (!token || token.length < 32) {
    return htmlResponse(pageHTML('Invalid link', 'This unsubscribe link is missing or malformed.'), 400);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SRV) {
    console.error('[unsubscribe] Supabase env vars missing');
    return htmlResponse(pageHTML('Server error', "We couldn't process your unsubscribe right now. Email robin@fungai.art and we'll do it manually within a day."), 500);
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SRV, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // UPDATE + RETURNING the email so we can (a) show a friendly
  // confirmation and (b) mirror the removal in the Resend Audience.
  const { data, error } = await sb
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('email, unsubscribed_at')
    .maybeSingle();

  if (error) {
    console.error('[unsubscribe] Supabase UPDATE failed:', error.message);
    return htmlResponse(pageHTML('Server error', "Something went wrong. Email robin@fungai.art and we'll remove you manually within a day."), 500);
  }
  if (!data) {
    // No row matched. Either the token is fake OR the user already
    // unsubscribed with an old link. Either way, from the user's
    // POV we treat it as "you're not on the list", not an error.
    return htmlResponse(pageHTML("You're not on the list", "This unsubscribe link doesn't match any active subscriber. You may already be unsubscribed."), 200);
  }

  // ── Mirror to Resend Audience (best-effort) ─────────────────────
  const RESEND_API_KEY     = process.env.RESEND_API_KEY;
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      // Resend supports DELETE by email in the URL — no need to look up the contact id first.
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${encodeURIComponent(data.email)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
      });
    } catch (e) {
      console.warn('[unsubscribe] Resend audience removal failed:', e.message);
    }
  }

  return htmlResponse(
    pageHTML(
      "You're removed",
      "You won't receive any more newsletters from Fungai Art. If this was a mistake, sign up again from any page footer at fungai.art."
    ),
    200
  );
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

// ── Confirmation page ────────────────────────────────────────────
// Kept in the site's palette so users don't feel they've landed on
// a stranger's site after clicking the link.
function pageHTML(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${esc(title)} — Fungai Art</title>
<style>
  body { margin:0; padding:0; background:#060809; color:#C9B894; font-family:Georgia,'Times New Roman',serif; min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .wrap { max-width:520px; margin:0 auto; padding:32px; text-align:center; }
  .card { background:#0F1014; border:0.5px solid rgba(196,136,56,.18); border-radius:14px; padding:44px 36px; }
  .ey { font-family:'Courier New',monospace; font-size:10px; letter-spacing:0.34em; text-transform:uppercase; color:#E8B14B; margin-bottom:18px; }
  h1 { font-family:Georgia,serif; font-style:italic; font-weight:400; font-size:30px; color:#E6D9B5; line-height:1.15; margin:0 0 18px; }
  p { font-size:15px; line-height:1.75; color:#C9B894; margin:0 0 22px; }
  a { color:#6BD66F; text-decoration:none; font-family:'Courier New',monospace; font-size:11px; letter-spacing:0.24em; text-transform:uppercase; }
  a:hover { text-decoration:underline; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="ey">✦ Fungai Art</div>
      <h1>${esc(title)}</h1>
      <p>${esc(body)}</p>
      <a href="https://www.fungai.art">← Back to fungai.art</a>
    </div>
  </div>
</body>
</html>`;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
