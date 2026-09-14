// ════════════════════════════════════════════════════════════════
// Fungai Art · Dinner Experience enquiry
// ════════════════════════════════════════════════════════════════
// Receives a POST from the outro form on /dinner-experience/ and
// emails it to Robin via Resend, with reply-to set to the guest so
// Robin can answer straight from the inbox. No customer auto-reply —
// the personal answer IS the confirmation, and not mailing arbitrary
// addresses keeps this endpoint useless for spam relaying.
//
// Reached at /api/dinner-contact via the /api/* redirect.
//
// Required Netlify env vars:
//   RESEND_API_KEY   — the Resend API key (re_...)
// Optional env vars:
//   FORMULA_FROM     — default 'Fungai Art <noreply@fungai.art>'
//   DINNER_INBOX     — default 'robin@fungai.art'
//
// Response contract (the page branches on `sent`):
//   200 { sent: true }              → email delivered to Resend
//   400 { sent: false, error }      → validation message, shown inline
//   403/405/429/5xx { sent: false } → page falls back to a prefilled
//                                     mailto so the enquiry isn't lost
// ════════════════════════════════════════════════════════════════

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

// 3 enquiries per IP per minute — a person sends one.
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

export const INTERESTS = [
  'A private dinner',
  'A seat at the next dinner',
  'A residency or collaboration',
  'Something else',
];

// Pure validation — exported so it can be exercised without a request.
export function parseEnquiry(body) {
  // Drop control chars except tab / newline / carriage return, so the
  // message keeps its line breaks but nothing invisible reaches the email.
  const clean = (v, max) => Array.from(String(v == null ? "" : v))
    .filter(ch => { const c = ch.charCodeAt(0); return c >= 32 ? c !== 127 : (c === 9 || c === 10 || c === 13); })
    .join("").trim().slice(0, max);
  const name     = clean(body?.name, 100).replace(/[\r\n]+/g, ' ');
  const email    = clean(body?.email, 200).toLowerCase();
  const message  = clean(body?.message, 2000);
  const interest = INTERESTS.includes(body?.interest) ? body.interest : 'Something else';
  const honeypot = clean(body?.company, 200);

  if (!name) return { ok: false, error: 'Add your name so Robin knows who is writing.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'That email address doesn’t look right.' };
  return { ok: true, enquiry: { name, email, message, interest }, isBot: honeypot.length > 0 };
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const cors   = corsFor(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ sent: false, error: 'POST only' }, 405, cors);
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ sent: false, error: 'Origin not allowed.' }, 403, cors);

  const ip = (req.headers.get('x-nf-client-connection-ip')
           || (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim()
           || 'unknown').slice(0, 64);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ sent: false, error: 'Too many messages — try again in a minute.' }), {
      status: 429,
      headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter || 60) },
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ sent: false, error: 'Bad JSON body' }, 400, cors); }

  const parsed = parseEnquiry(body);
  if (!parsed.ok) return json({ sent: false, error: parsed.error }, 400, cors);
  // Honeypot tripped — pretend success so the bot moves on.
  if (parsed.isBot) return json({ sent: true }, 200, cors);

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    // No PII in the log. `sent: false` makes the page fall back to mailto
    // rather than showing a thank-you for a message nobody will receive.
    console.error('[dinner-contact] RESEND_API_KEY not set — enquiry not sent');
    return json({ sent: false }, 503, cors);
  }

  const { name, email, message, interest } = parsed.enquiry;
  const from  = process.env.FORMULA_FROM || 'Fungai Art <noreply@fungai.art>';
  const inbox = process.env.DINNER_INBOX || 'robin@fungai.art';

  const result = await sendResend(RESEND_API_KEY, {
    from,
    to: [inbox],
    reply_to: email,
    subject: `✦ Dinner enquiry · ${interest} · ${name}`,
    html: buildHtml({ name, email, message, interest }),
    text: buildText({ name, email, message, interest }),
  });
  if (!result.ok) {
    console.error('[dinner-contact] Resend failure', result.detail);
    return json({ sent: false }, 502, cors);
  }
  return json({ sent: true }, 200, cors);
}

async function sendResend(key, payload) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, detail: data };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function json(body, status = 200, cors = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

export function buildHtml({ name, email, message, interest }) {
  const row = (k, v) => `<tr><td style="padding:7px 0;width:120px;vertical-align:top;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8B7E62;">${k}</td><td style="padding:7px 0;font-size:14px;color:#EDE5D8;">${v}</td></tr>`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#060809;color:#C9B894;font-family:Georgia,serif;">
    <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
      <div style="background:#0F1014;border:0.5px solid rgba(232,177,75,.22);border-radius:12px;padding:32px 28px;">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#E8B14B;margin-bottom:14px;">✦ Dinner Experience enquiry</div>
        <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;color:#E6D9B5;margin:0 0 20px;line-height:1.2;">${esc(name)} &middot; ${esc(interest)}</h1>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          ${row('Email', `<a href="mailto:${esc(email)}" style="color:#F5D689;text-decoration:none;">${esc(email)}</a>`)}
          ${row('Dreaming of', esc(interest))}
        </table>
        <div style="margin-top:20px;padding:16px 18px;background:#1A1E24;border-left:2px solid #E8B14B;border-radius:4px;font-size:14.5px;line-height:1.75;color:#EDE5D8;white-space:pre-wrap;">${message ? esc(message) : '<span style="color:#8B7E62;">(no message)</span>'}</div>
        <p style="margin:22px 0 0;font-size:12px;color:#8B7E62;line-height:1.7;">Reply to this email to reach ${esc(name)} directly — reply-to is set to their address. Sent from fungai.art/dinner-experience.</p>
      </div>
    </div>
  </body></html>`;
}

export function buildText({ name, email, message, interest }) {
  return `DINNER EXPERIENCE ENQUIRY

Name:        ${name}
Email:       ${email}
Dreaming of: ${interest}

${message || '(no message)'}

Reply to this email to reach ${name} directly.
Sent from fungai.art/dinner-experience
`;
}
