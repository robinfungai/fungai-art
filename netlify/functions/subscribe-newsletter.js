// ════════════════════════════════════════════════════════════════
// Fungai Art · Newsletter subscribe + welcome email
// ════════════════════════════════════════════════════════════════
// Receives a POST { email } from the home-page newsletter form,
// records nothing centrally (yet), and sends a branded welcome
// email via Resend so the subscriber gets immediate feedback.
//
// Required Netlify env vars:
//   RESEND_API_KEY        — your Resend API key (re_...)
//                           Set in Netlify dashboard → Site
//                           configuration → Environment variables.
//
// Optional env vars:
//   NEWSLETTER_FROM       — default: 'Fungai Art <noreply@fungai.art>'
//   NEWSLETTER_REPLY_TO   — default: 'robin@fungai.art'
// ════════════════════════════════════════════════════════════════

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (req.method !== 'POST') {
    return json({ error: 'POST only' }, 405);
  }

  let email;
  try {
    const body = await req.json();
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return json({ error: 'Bad JSON body' }, 400);
  }

  // Basic email shape — Resend will reject malformed addresses too,
  // but this catches the obvious typos early.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email address' }, 400);
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    // Don't 500 — log it and return a friendly success. The user shouldn't
    // see scary errors when our key isn't configured yet. Robin sees the
    // log and knows to add the env var.
    console.error('[newsletter] RESEND_API_KEY not set — welcome email skipped for', email);
    return json({ ok: true, sent: false, note: 'subscribed locally, welcome email not sent (Resend key missing on server)' });
  }

  const from = process.env.NEWSLETTER_FROM || 'Fungai Art <noreply@fungai.art>';
  const replyTo = process.env.NEWSLETTER_REPLY_TO || 'robin@fungai.art';

  const subject = 'Welcome to the mycelium — Fungai Art Field Notes';
  const html = WELCOME_HTML;
  const text = WELCOME_TEXT;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: replyTo,
        subject,
        html,
        text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[newsletter] Resend error:', res.status, data);
      return json({ ok: false, error: 'Email send failed', detail: data }, 502);
    }
    return json({ ok: true, sent: true, id: data.id });
  } catch (err) {
    console.error('[newsletter] threw:', err);
    return json({ ok: false, error: 'Network error contacting Resend' }, 502);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ── Welcome email body (matches the spore/auth template language) ──

const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body { margin:0; padding:0; background:#060809; color:#C9B894; font-family:Georgia,'Times New Roman',serif; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:560px; margin:0 auto; padding:48px 24px; }
  .card { background:#0F1014; border:0.5px solid rgba(196,136,56,.18); border-radius:14px; padding:40px 36px; }
  .ey { font-family:'Courier New',monospace; font-size:10px; letter-spacing:0.34em; text-transform:uppercase; color:#E8B14B; margin-bottom:16px; }
  h1 { font-family:Georgia,serif; font-style:italic; font-weight:400; font-size:32px; color:#E6D9B5; line-height:1.1; margin:0 0 18px; letter-spacing:-0.005em; }
  h1 em { color:#6BD66F; font-style:italic; }
  p { font-size:15px; line-height:1.75; color:#C9B894; margin:0 0 18px; }
  ul { font-size:14px; line-height:1.85; color:#C9B894; padding-left:18px; margin:0 0 18px; }
  ul li { margin-bottom:6px; }
  a.cta { display:inline-block; font-family:'Courier New',monospace; font-size:11px; letter-spacing:0.24em; text-transform:uppercase; padding:14px 30px; border-radius:999px; background:linear-gradient(135deg,#6BD66F,#2E7A35); color:#060809 !important; text-decoration:none; font-weight:500; margin:18px 0; }
  .small { font-size:11px; color:#8B7E62; line-height:1.7; }
  .small a { color:#C9B894; }
  .sig { margin-top:32px; padding-top:20px; border-top:0.5px solid rgba(196,136,56,.15); font-family:Georgia,serif; font-style:italic; color:#8B7E62; font-size:13px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="ey">✦ Fungai Art · The Field Notes</div>
      <h1>Welcome to the <em>mycelium.</em></h1>
      <p>You've joined a slow newsletter — one email a month, written by hand. Field notes from the forests, season by season. New extracts as they're composed. Occasional invitations to ceremonies, foraging walks, or laboratory nights when there's room.</p>
      <p>What you'll receive:</p>
      <ul>
        <li>Seasonal harvest reports from Sweden, Berlin, Lisbon, Beirut</li>
        <li>New apothecary preparations as they're made — including private editions</li>
        <li>Mycelium Trance dates before they're public</li>
        <li>Foraging knowledge — names, properties, stories</li>
      </ul>
      <p>If you ever want to step out of the network, every email carries an unsubscribe at the bottom. No bots, no automated sequences.</p>
      <p style="text-align:center;"><a class="cta" href="https://www.fungai.art/community">✦ Enter the community →</a></p>
      <p class="small">If you didn't subscribe, you can safely ignore this — your address won't appear again.</p>
      <div class="sig">— Robin &amp; Steph<br/>fungai.art</div>
    </div>
  </div>
</body>
</html>`;

const WELCOME_TEXT = `Welcome to the mycelium — Fungai Art Field Notes.

You've joined a slow newsletter — one email a month, written by hand. Field notes from the forests, season by season. New extracts as they're composed. Occasional invitations to ceremonies, foraging walks, or laboratory nights.

What you'll receive:
• Seasonal harvest reports from Sweden, Berlin, Lisbon, Beirut
• New apothecary preparations as they're made — including private editions
• Mycelium Trance dates before they're public
• Foraging knowledge — names, properties, stories

If you ever want to step out, every email carries an unsubscribe.

Enter the community: https://www.fungai.art/community

— Robin & Steph
fungai.art

If you didn't subscribe, you can safely ignore this email.
`;
