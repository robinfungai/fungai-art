// ════════════════════════════════════════════════════════════════
// Fungai Art · Newsletter subscribe (simple opt-in + GDPR audit)
// ════════════════════════════════════════════════════════════════
//
// Simple opt-in per Robin's call (no confirm-link click required),
// but GDPR-clean:
//   - Consent is unambiguous — form submission is a clear
//     affirmative action.
//   - Consent is auditable — we record signup_ip, signup_user_agent,
//     source, and created_at as a timestamped, per-signup proof
//     trail. Legal grade evidence if anyone ever complains.
//   - Withdrawal is easy — every outbound email carries an
//     unsubscribe link (see unsubscribe.js).
//
// Two side-effects on success:
//   1. INSERT (or reactivate) a row in public.newsletter_subscribers
//      via the service-role key. This is your permanent list.
//   2. Push the address to a Resend Audience (if RESEND_AUDIENCE_ID
//      is set) so broadcasts can reach them without any code.
//
// Then we send the welcome email — reframed to focus on Fungai
// Art's medicinal path and the Spore community portal.
//
// Required env vars:
//   RESEND_API_KEY
//   SUPABASE_URL (or VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY
// Optional env vars:
//   RESEND_AUDIENCE_ID    — Resend Audience UUID for broadcasts
//   NEWSLETTER_FROM       — default 'Fungai Art <noreply@fungai.art>'
//   NEWSLETTER_REPLY_TO   — default 'robin@fungai.art'
//   PUBLIC_BASE_URL       — default 'https://www.fungai.art'
// ════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

// ── Origin gate ──────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.fungai.art',
  'https://fungai.art',
  'https://fungai-art.netlify.app',
  'http://localhost:5173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
];
function corsFor(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// ── Per-IP rate limit ────────────────────────────────────────────
const RATE_WINDOW_MS      = 60_000;
const RATE_MAX_PER_WINDOW = 3;
const rateState = new Map();
function rateLimit(ip) {
  const now  = Date.now();
  const slot = rateState.get(ip);
  if (!slot || now - slot.windowStart > RATE_WINDOW_MS) {
    rateState.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (slot.count >= RATE_MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((RATE_WINDOW_MS - (now - slot.windowStart)) / 1000) };
  }
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
  const origin = req.headers.get('origin') || '';
  const cors   = corsFor(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return json({ error: 'POST only' }, 405, cors);
  }
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: 'Origin not allowed.' }, 403, cors);
  }

  const ip = (req.headers.get('x-nf-client-connection-ip')
           || (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim()
           || 'unknown').slice(0, 64);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Too many subscribe attempts — try again in a minute.' }), {
      status: 429,
      headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter || 60) },
    });
  }

  // ── Parse + validate ────────────────────────────────────────────
  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'Bad JSON body' }, 400, cors); }

  const email  = (body.email  || '').trim().toLowerCase();
  const source = String(body.source || 'home').slice(0, 40);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email address' }, 400, cors);
  }

  // ── GDPR audit trail ────────────────────────────────────────────
  const userAgent = (req.headers.get('user-agent') || '').slice(0, 500);
  const ipForAudit = ip === 'unknown' ? null : ip;

  // ── Persist to Supabase (skip if not configured; still send email) ─
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSupabase  = !!(SUPABASE_URL && SUPABASE_SRV);

  let isNewSubscriber      = false;
  let unsubscribeToken     = null;
  let existingActiveRow    = false;

  if (hasSupabase) {
    const sb = createClient(SUPABASE_URL, SUPABASE_SRV, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    // Dedupe: check for existing row by email (unique constraint on
    // the table would 23505 error, but we look first so we can decide
    // whether to reactivate or refuse gracefully).
    const { data: existing } = await sb
      .from('newsletter_subscribers')
      .select('id, unsubscribed_at, unsubscribe_token')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      if (existing.unsubscribed_at) {
        // Was previously unsubscribed — reactivate. Regenerate the
        // unsubscribe token so the OLD unsubscribe email (if they
        // still have it) doesn't accidentally remove them again.
        unsubscribeToken = crypto.randomBytes(32).toString('hex');
        await sb.from('newsletter_subscribers')
          .update({
            unsubscribed_at:   null,
            confirmed_at:      new Date().toISOString(),
            unsubscribe_token: unsubscribeToken,
            signup_ip:         ipForAudit,
            signup_user_agent: userAgent || null,
            source,
          })
          .eq('id', existing.id);
        isNewSubscriber = true; // treat as new for welcome + audience
      } else {
        existingActiveRow = true;
        unsubscribeToken  = existing.unsubscribe_token;
      }
    } else {
      // Fresh signup.
      unsubscribeToken = crypto.randomBytes(32).toString('hex');
      const confirmToken = crypto.randomBytes(32).toString('hex'); // schema requires it; unused in simple opt-in
      const { error } = await sb.from('newsletter_subscribers').insert({
        email,
        confirmed_at:      new Date().toISOString(), // simple opt-in — submission IS consent
        confirm_token:     confirmToken,
        unsubscribe_token: unsubscribeToken,
        source,
        signup_ip:         ipForAudit,
        signup_user_agent: userAgent || null,
      });
      if (error) {
        console.error('[newsletter] Supabase INSERT failed:', error.message);
        // Fall through — still try to send the welcome so the user
        // sees a positive UI. They can retry to get on the list.
      } else {
        isNewSubscriber = true;
      }
    }
  } else {
    console.error('[newsletter] Supabase env vars missing — subscriber NOT stored');
  }

  // Already subscribed and active — return early, don't re-send welcome.
  if (existingActiveRow) {
    return json({ ok: true, alreadySubscribed: true, note: "You're already on the list." }, 200, cors);
  }

  // ── Push to Resend Audience (optional — only if configured) ─────
  // Resend Broadcasts send to Audiences. If Robin has an audience id,
  // add this contact so future broadcasts reach them without extra code.
  const RESEND_API_KEY     = process.env.RESEND_API_KEY;
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
  if (isNewSubscriber && RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      const audRes = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
      if (!audRes.ok) {
        // Resend returns 200 with { error } for dupes, and non-200
        // for real failures. Neither should block the welcome.
        const detail = await audRes.text().catch(() => '');
        console.warn('[newsletter] Resend audience push non-OK:', audRes.status, detail.slice(0, 200));
      }
    } catch (e) {
      console.error('[newsletter] Resend audience push threw:', e.message);
    }
  }

  // ── Send welcome email ──────────────────────────────────────────
  if (!RESEND_API_KEY) {
    console.error('[newsletter] RESEND_API_KEY not set — welcome email skipped');
    return json({ ok: true, sent: false, stored: isNewSubscriber, note: 'Signed up. Welcome email pending (server config).' }, 200, cors);
  }

  const from    = process.env.NEWSLETTER_FROM     || 'Fungai Art <noreply@fungai.art>';
  const replyTo = process.env.NEWSLETTER_REPLY_TO || 'robin@fungai.art';
  const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://www.fungai.art').replace(/\/+$/, '');

  const unsubscribeUrl = unsubscribeToken
    ? `${baseUrl}/api/unsubscribe?t=${unsubscribeToken}`
    : `${baseUrl}/privacy`; // graceful fallback if we couldn't store token

  const subject = 'A quiet welcome — Fungai Art';
  const html = welcomeHTML(unsubscribeUrl);
  const text = welcomeText(unsubscribeUrl);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from,
        to:        [email],
        reply_to:  replyTo,
        subject,
        html,
        text,
        // Resend supports List-Unsubscribe headers per RFC 8058 — one-
        // click unsubscribe surfaces in Gmail / Apple Mail / Outlook
        // as a native button next to the sender name. Big deliverability
        // win, GDPR-friendly.
        headers: {
          'List-Unsubscribe':      `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[newsletter] Resend error:', res.status, data);
      return json({ ok: false, error: 'Email send failed' }, 502, cors);
    }
    return json({ ok: true, sent: true, id: data.id, stored: isNewSubscriber }, 200, cors);
  } catch (err) {
    console.error('[newsletter] threw:', err);
    return json({ ok: false, error: 'Network error contacting Resend' }, 502, cors);
  }
}

function json(body, status = 200, cors = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// ── Welcome email — reframed for medicinal path + community portal ──

function welcomeHTML(unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body { margin:0; padding:0; background:#060809; color:#C9B894; font-family:Georgia,'Times New Roman',serif; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:560px; margin:0 auto; padding:48px 24px; }
  .card { background:#0F1014; border:0.5px solid rgba(196,136,56,.18); border-radius:14px; padding:40px 36px; }
  .ey { font-family:'Courier New',monospace; font-size:10px; letter-spacing:0.34em; text-transform:uppercase; color:#E8B14B; margin-bottom:16px; }
  h1 { font-family:Georgia,serif; font-style:italic; font-weight:400; font-size:32px; color:#E6D9B5; line-height:1.15; margin:0 0 22px; letter-spacing:-0.005em; }
  h1 em { color:#6BD66F; font-style:italic; }
  h2 { font-family:'Courier New',monospace; font-size:10px; letter-spacing:0.28em; text-transform:uppercase; color:#8B7E62; margin:32px 0 10px; font-weight:normal; }
  p { font-size:15px; line-height:1.75; color:#C9B894; margin:0 0 16px; }
  ul { font-size:14px; line-height:1.85; color:#C9B894; padding-left:18px; margin:6px 0 18px; }
  ul li { margin-bottom:6px; }
  a.cta { display:inline-block; font-family:'Courier New',monospace; font-size:11px; letter-spacing:0.24em; text-transform:uppercase; padding:14px 30px; border-radius:999px; background:linear-gradient(135deg,#6BD66F,#2E7A35); color:#060809 !important; text-decoration:none; font-weight:500; margin:14px 0; }
  .small { font-size:11px; color:#8B7E62; line-height:1.7; }
  .small a { color:#C9B894; }
  .footer { margin-top:32px; padding-top:22px; border-top:0.5px solid rgba(196,136,56,.15); font-size:10.5px; color:#5a5342; line-height:1.75; font-family:'Courier New',monospace; letter-spacing:0.05em; }
  .footer a { color:#8B7E62; text-decoration:underline; }
  .sig { margin-top:26px; font-family:Georgia,serif; font-style:italic; color:#8B7E62; font-size:13px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="ey">✦ Fungai Art · The Field Notes</div>
      <h1>A quiet <em>welcome.</em></h1>

      <p>You've joined a slow, hand-written newsletter. Two emails a month, from the Berlin studio and wherever the season has taken us — Sweden in autumn, Beirut in spring, Bali when the retreats gather.</p>

      <h2>What Fungai Art is</h2>
      <p>A medicinal path traced through mushrooms and wild plants. Spagyric extracts poured by hand in the lab. Foraged nettles, Nordic chaga, Amanita muscaria treated as the ceremonial ally she is. No wellness marketing, no shelf products — every batch is small and seasonal.</p>

      <h2>The community portal</h2>
      <p>The deeper work happens inside <a href="https://www.fungai.art/community" style="color:#6BD66F;text-decoration:none;"><strong>the Spore Living Network</strong></a> — a member portal that isn't listed publicly. It gathers everything that isn't a product:</p>
      <ul>
        <li><strong>Living nodes</strong> across Berlin, Sweden, Lisbon, Beirut, Bali, and more — physical spaces where the work happens</li>
        <li><strong>The Alchemy Academy</strong> — lab notes, extraction methods, herb intelligence, formula books</li>
        <li><strong>MYCO</strong> — a plant-medicine intelligence trained on our formulas and foraging data</li>
        <li><strong>Dinner experiences</strong>, seasonal ceremonies, extraction lab nights</li>
      </ul>
      <p style="text-align:center;"><a class="cta" href="https://www.fungai.art/community">✦ Enter the community →</a></p>

      <h2>What you'll receive from us</h2>
      <ul>
        <li>Seasonal field notes — what's fruiting, what we're harvesting</li>
        <li>Extraction stories and lab notes as batches are composed</li>
        <li>First-look event invitations before they go public</li>
      </ul>
      <p>You can leave anytime — every email carries the unsubscribe link at the bottom.</p>

      <div class="sig">— Robin &amp; Steph<br/>fungai.art</div>

      <div class="footer">
        You're receiving this because you signed up at fungai.art. If this was a mistake, one click removes you: <a href="${escapeHtml(unsubscribeUrl)}">unsubscribe</a>.<br/>
        Privacy policy: <a href="https://www.fungai.art/privacy">fungai.art/privacy</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function welcomeText(unsubscribeUrl) {
  return `A quiet welcome — Fungai Art

You've joined a slow, hand-written newsletter. Two emails a month, from the Berlin studio and wherever the season has taken us — Sweden in autumn, Beirut in spring, Bali when the retreats gather.

WHAT FUNGAI ART IS

A medicinal path traced through mushrooms and wild plants. Spagyric extracts poured by hand in the lab. Foraged nettles, Nordic chaga, Amanita muscaria treated as the ceremonial ally she is. No wellness marketing, no shelf products — every batch is small and seasonal.

THE COMMUNITY PORTAL

The deeper work happens inside the Spore Living Network — a member portal that isn't listed publicly. It gathers:

  · Living nodes across Berlin, Sweden, Lisbon, Beirut, Bali, and more
  · The Alchemy Academy — lab notes, extraction methods, herb intelligence
  · MYCO — a plant-medicine intelligence trained on our formulas and foraging data
  · Dinner experiences, seasonal ceremonies, extraction lab nights

Enter the community: https://www.fungai.art/community

WHAT YOU'LL RECEIVE FROM US

  · Seasonal field notes — what's fruiting, what we're harvesting
  · Extraction stories and lab notes as batches are composed
  · First-look event invitations before they go public

You can leave anytime — every email carries the unsubscribe link at the bottom.

— Robin & Steph
fungai.art

--
You're receiving this because you signed up at fungai.art. If this was a mistake, one click removes you: ${unsubscribeUrl}
Privacy: https://www.fungai.art/privacy
`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
