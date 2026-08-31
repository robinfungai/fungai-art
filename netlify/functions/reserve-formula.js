// ════════════════════════════════════════════════════════════════
// Fungai Art · Find-your-formula reservation intake
// ════════════════════════════════════════════════════════════════
// Receives a POST from /find-your-formula/ with the customer's
// contact + quiz answers + resolved formula. Sends TWO emails via
// Resend:
//   1. To Robin (or NEWSLETTER_REPLY_TO) — the full reservation so
//      he can start the extract and follow up with a Stripe link.
//   2. To the customer — a warm confirmation with the formula name,
//      the herbs, and the "next step" copy.
//
// Required Netlify env vars:
//   RESEND_API_KEY   — the Resend API key (re_...)
// Optional env vars:
//   FORMULA_FROM     — default 'Fungai Art <noreply@fungai.art>'
//   FORMULA_INBOX    — default 'robin@fungai.art' (Robin's inbox)
//
// The subscribe-newsletter function silently dropped everything
// except `email`, which is why reservations were vanishing before
// this endpoint existed.
// ════════════════════════════════════════════════════════════════

export default async function handler(req) {
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
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'Bad JSON body' }, 400); }

  const email   = String(body.email   || '').trim().toLowerCase();
  const name    = String(body.name    || '').trim().slice(0, 100);
  const city    = String(body.city    || '').trim().slice(0, 80);
  const country = String(body.country || '').trim().slice(0, 80);
  const notes   = String(body.notes   || '').trim().slice(0, 1000);
  const formulaName = String(body.formulaName || '').trim().slice(0, 80);
  const quiz    = (body.quiz    && typeof body.quiz    === 'object') ? body.quiz    : {};
  const formula = Array.isArray(body.formula) ? body.formula.slice(0, 10) : [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Invalid email address' }, 400);
  if (!name || !city || !country) return json({ error: 'Missing name / city / country' }, 400);

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('[reserve-formula] RESEND_API_KEY not set — payload:', { email, name, city, country, formulaName });
    // Return success so the customer sees a positive UI. Robin's
    // console log carries the reservation until Resend is wired.
    return json({ ok: true, sent: false, note: 'Reservation received. Confirmation email pending — Resend key missing on server.' });
  }

  const from  = process.env.FORMULA_FROM  || 'Fungai Art <noreply@fungai.art>';
  const inbox = process.env.FORMULA_INBOX || 'robin@fungai.art';

  const herbList = formula.map(f => (f.name || f.id || '')).filter(Boolean);

  // ── 1. Notify Robin ────────────────────────────────────────────
  const robinSubject = `✦ Formula reservation · ${formulaName || 'unnamed'} · ${name}`;
  const robinHtml = buildRobinHtml({ email, name, city, country, notes, formulaName, quiz, herbList });
  const robinText = buildRobinText({ email, name, city, country, notes, formulaName, quiz, herbList });

  // ── 2. Confirm to customer ─────────────────────────────────────
  const customerSubject = `Your formula is reserved · ${formulaName || 'Fungai Art'}`;
  const customerHtml = buildCustomerHtml({ name, formulaName, herbList });
  const customerText = buildCustomerText({ name, formulaName, herbList });

  const results = await Promise.allSettled([
    sendResend(RESEND_API_KEY, { from, to: [inbox], reply_to: email,  subject: robinSubject,    html: robinHtml,    text: robinText }),
    sendResend(RESEND_API_KEY, { from, to: [email], reply_to: inbox,  subject: customerSubject, html: customerHtml, text: customerText }),
  ]);
  const robinOk    = results[0].status === 'fulfilled' && results[0].value.ok;
  const customerOk = results[1].status === 'fulfilled' && results[1].value.ok;
  if (!robinOk || !customerOk) {
    console.error('[reserve-formula] partial Resend failure', {
      robinOk, customerOk,
      robinErr:    results[0].status === 'rejected' ? String(results[0].reason)                   : (results[0].value?.detail || null),
      customerErr: results[1].status === 'rejected' ? String(results[1].reason)                   : (results[1].value?.detail || null),
    });
  }
  return json({
    ok: true,
    sent: robinOk && customerOk,
    partial: !robinOk || !customerOk,
    robinOk, customerOk,
  });
}

async function sendResend(key, payload){
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

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

// ── Email bodies ─────────────────────────────────────────────────

function buildRobinHtml({ email, name, city, country, notes, formulaName, quiz, herbList }){
  const q = quiz || {};
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#060809;color:#C9B894;font-family:Georgia,serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <div style="background:#0F1014;border:0.5px solid rgba(232,177,75,.22);border-radius:12px;padding:32px 28px;">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#E8B14B;margin-bottom:14px;">✦ New formula reservation</div>
        <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:26px;color:#E6D9B5;margin:0 0 8px;line-height:1.15;">${esc(formulaName || 'Unnamed formula')}</h1>
        <p style="font-size:14px;color:#8B7E62;margin:0 0 22px;">for <strong style="color:#EDE5D8;">${esc(name)}</strong> · ${esc(city)}, ${esc(country)}</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;color:#C9B894;">
          <tr><td style="padding:6px 0;color:#8B7E62;width:110px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(email)}" style="color:#F5D689;text-decoration:none;">${esc(email)}</a></td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Intention</td><td style="padding:6px 0;">${esc(q.intention || '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Body</td><td style="padding:6px 0;">${esc(q.pattern || '—')}${q.patternSub ? ' &middot; ' + esc(q.patternSub) : ''}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Rhythm</td><td style="padding:6px 0;">${esc(q.time || '—')} hardest</td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Stress</td><td style="padding:6px 0;">${esc(q.stress || '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7E62;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Filters</td><td style="padding:6px 0;">${esc(Array.isArray(q.avoid) ? q.avoid.join(', ') : (q.avoid || '—'))}</td></tr>
        </table>
        <div style="margin:22px 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E8B14B;">The formula</div>
        <ol style="font-size:14px;line-height:1.85;color:#EDE5D8;padding-left:20px;margin:0;">
          ${herbList.map(h => '<li>' + esc(h) + '</li>').join('')}
        </ol>
        ${notes ? `<div style="margin-top:22px;padding:14px 16px;background:#1A1E24;border-left:2px solid #E8B14B;border-radius:4px;"><div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8B7E62;margin-bottom:6px;">Personal note</div><div style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#EDE5D8;line-height:1.7;">"${esc(notes)}"</div></div>` : ''}
        <p style="margin:24px 0 0;font-size:12px;color:#8B7E62;line-height:1.7;">Reply directly to this email to reach <strong style="color:#EDE5D8;">${esc(name)}</strong>. Ship-to address is above; confirm details + send a Stripe link when you're ready to pour.</p>
      </div>
    </div>
  </body></html>`;
}

function buildRobinText({ email, name, city, country, notes, formulaName, quiz, herbList }){
  const q = quiz || {};
  return `NEW FORMULA RESERVATION

Formula: ${formulaName || 'Unnamed'}
For:     ${name} · ${city}, ${country}
Email:   ${email}

Intention: ${q.intention || '—'}
Body:      ${q.pattern || '—'}${q.patternSub ? ' · ' + q.patternSub : ''}
Rhythm:    ${q.time || '—'} hardest
Stress:    ${q.stress || '—'}
Filters:   ${Array.isArray(q.avoid) ? q.avoid.join(', ') : (q.avoid || '—')}

The formula:
${herbList.map((h,i) => (i+1) + '. ' + h).join('\n')}

${notes ? 'Personal note:\n"' + notes + '"\n' : ''}
Reply to this email to reach the customer. Confirm details and send a Stripe link when you're ready to pour.
`;
}

function buildCustomerHtml({ name, formulaName, herbList }){
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#060809;color:#C9B894;font-family:Georgia,serif;">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
      <div style="background:#0F1014;border:0.5px solid rgba(232,177,75,.22);border-radius:14px;padding:40px 32px;">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#E8B14B;margin-bottom:16px;">✦ Your bottle is reserved</div>
        <h1 style="font-family:Georgia,serif;font-style:italic;font-weight:400;font-size:32px;color:#E6D9B5;margin:0 0 12px;line-height:1.1;letter-spacing:-.005em;">${esc(formulaName || 'Your formula')}</h1>
        <p style="font-size:15px;line-height:1.75;color:#C9B894;margin:0 0 20px;">${esc(name)}, thank you for taking the reading. Robin has been notified and will personally follow up within 24 hours with the payment link and your bottle's origin note.</p>
        <div style="margin:24px 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E8B14B;">Your allies</div>
        <ol style="font-size:14.5px;line-height:1.9;color:#EDE5D8;padding-left:20px;margin:0 0 22px;">
          ${herbList.map(h => '<li>' + esc(h) + '</li>').join('')}
        </ol>
        <div style="padding:18px 20px;background:#1A1E24;border:0.5px solid rgba(123,212,161,.22);border-radius:10px;margin:20px 0;">
          <div style="font-family:'Courier New',monospace;font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:#7bd4a1;margin-bottom:8px;">◈ How to take it (when it lands)</div>
          <p style="font-size:13.5px;color:#EDE5D8;line-height:1.7;margin:0;"><strong>2-3 full pipettes (about 1.5 ml) under the tongue</strong>, held for 60-90 seconds before swallowing. <strong>Twice daily</strong> - morning and evening - on a <strong>5 days on, 2 days off</strong> rhythm. Slow-pace plant medicine unfolds in cycles. Give it three weeks.</p>
        </div>
        <p style="font-size:13px;color:#8B7E62;line-height:1.7;margin:22px 0 0;font-style:italic;">Traditional herbal support only. Not a treatment or replacement for medical care.</p>
        <div style="margin-top:32px;padding-top:20px;border-top:0.5px solid rgba(232,177,75,.15);font-family:Georgia,serif;font-style:italic;color:#8B7E62;font-size:13px;">— Robin<br/>fungai.art</div>
      </div>
    </div>
  </body></html>`;
}

function buildCustomerText({ name, formulaName, herbList }){
  return `YOUR BOTTLE IS RESERVED

${name}, thank you for taking the reading.

Formula: ${formulaName || 'Your formula'}

Your allies:
${herbList.map((h,i) => (i+1) + '. ' + h).join('\n')}

How to take it (when it lands):
2-3 full pipettes (about 1.5 ml) under the tongue, held for 60-90 seconds before swallowing. Twice daily - morning and evening - on a 5 days on, 2 days off rhythm. Give it three weeks.

Robin has been notified and will personally follow up within 24 hours with the payment link and your bottle's origin note.

Traditional herbal support only. Not a treatment or replacement for medical care.

— Robin
fungai.art
`;
}
