/* visitor-digest · traffic to Robin's inbox, twice a month
 * ────────────────────────────────────────────────────────────────
 * Runs 09:00 UTC on the 1st and the 15th and emails the previous 14
 * days: how much traffic, which pages, which countries, what devices,
 * where people came from. Reads public.page_views (see
 * supabase-visits.sql), writes nothing.
 *
 * "Bi-weekly" is the 1st and 15th rather than a true fortnight because
 * cron cannot express every-14-days without drifting through the month.
 *
 * ── IT COUNTS VIEWS, NOT VISITORS ────────────────────────────────
 * Nothing in the collector identifies a person — no cookie, no id, no
 * IP. So there is no honest way to say "180 unique visitors", and the
 * email does not pretend otherwise. Bots are counted separately rather
 * than quietly dropped, because "412 views" means something different
 * when 300 of them are crawlers.
 *
 * ── READS NEED THE SERVICE ROLE ──────────────────────────────────
 * The anon key can insert a view and cannot read one back, so anyone on
 * the internet cannot measure Robin's traffic. That means this function
 * needs SUPABASE_SERVICE_KEY. Without it the run is a no-op that says so.
 *
 * Environment:
 *   SUPABASE_URL           — falls back to the project URL
 *   SUPABASE_SERVICE_KEY   — REQUIRED to read. Never expose client-side.
 *   RESEND_API_KEY         — required to send
 *   DIGEST_INBOX           — defaults to robin@fungai.art
 *   FORMULA_FROM           — defaults to the site's noreply sender
 *   DIGEST_KEY             — optional, for manual runs
 *
 * Manual run: /.netlify/functions/visitor-digest?key=<DIGEST_KEY>&dry=1
 */

export const config = { schedule: '0 9 1,15 * *' };

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ||
  'https://cyhpvsyvxzfadtyvcuwp.supabase.co').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const INBOX = process.env.DIGEST_INBOX || 'robin@fungai.art';
const FROM  = process.env.FORMULA_FROM || 'Fungai Art <noreply@fungai.art>';
const DAYS  = 14;

const COUNTRY_NAMES = {
  DE: 'Germany', SE: 'Sweden', FR: 'France', GB: 'United Kingdom', US: 'United States',
  NL: 'Netherlands', DK: 'Denmark', NO: 'Norway', FI: 'Finland', ES: 'Spain',
  IT: 'Italy', PL: 'Poland', AT: 'Austria', CH: 'Switzerland', BE: 'Belgium',
  CA: 'Canada', AU: 'Australia', IE: 'Ireland', PT: 'Portugal', CZ: 'Czechia',
  LB: 'Lebanon', IN: 'India', BR: 'Brazil', JP: 'Japan', EE: 'Estonia',
};
const named = c => (c ? (COUNTRY_NAMES[c] ? COUNTRY_NAMES[c] + ' (' + c + ')' : c) : 'unknown');

const tally = (rows, key) => {
  const m = new Map();
  for (const r of rows) {
    const k = r[key] || 'unknown';
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m].sort((a, b) => b[1] - a[1]);
};

function bar(n, max, width = 18) {
  const filled = max > 0 ? Math.max(1, Math.round((n / max) * width)) : 0;
  return '█'.repeat(filled) + '·'.repeat(width - filled);
}

function section(title, rows, total, limit = 10, label = x => x) {
  if (!rows.length) return title + '\n  (nothing)\n';
  const max = rows[0][1];
  let out = title + '\n';
  for (const [k, n] of rows.slice(0, limit)) {
    const pct = total ? Math.round((n / total) * 100) : 0;
    out += '  ' + String(label(k)).slice(0, 30).padEnd(32) +
           String(n).padStart(5) + '  ' + String(pct + '%').padStart(4) + '  ' + bar(n, max) + '\n';
  }
  if (rows.length > limit) out += '  … and ' + (rows.length - limit) + ' more\n';
  return out;
}

async function fetchRows() {
  // Paged: a fortnight can exceed PostgREST's default ceiling.
  const since = new Date(Date.now() - DAYS * 864e5).toISOString();
  const out = [];
  for (let from = 0; from < 50000; from += 1000) {
    const url = SUPABASE_URL + '/rest/v1/page_views' +
      '?select=path,country,device,os,browser,referrer,lang,is_bot,created_at' +
      '&created_at=gte.' + encodeURIComponent(since) + '&order=created_at.asc';
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: 'Bearer ' + SERVICE_KEY,
        Range: from + '-' + (from + 999),
      },
    });
    if (!res.ok) throw new Error('page_views HTTP ' + res.status + ' ' + (await res.text()).slice(0, 120));
    const batch = await res.json();
    out.push(...batch);
    if (batch.length < 1000) break;
  }
  return out;
}

function buildReport(rows) {
  const human = rows.filter(r => !r.is_bot);
  const bots  = rows.length - human.length;
  const total = human.length;

  const days = new Map();
  for (const r of human) {
    const d = String(r.created_at || '').slice(0, 10);
    days.set(d, (days.get(d) || 0) + 1);
  }
  const daily = [...days].sort();
  const busiest = daily.slice().sort((a, b) => b[1] - a[1])[0];

  const countries = tally(human, 'country');
  let text = '';
  text += 'FUNGAI ART · traffic, last ' + DAYS + ' days\n';
  text += '─'.repeat(58) + '\n\n';
  text += '  ' + total + ' page views';
  if (total) text += '  ·  ' + (total / DAYS).toFixed(1) + ' a day';
  text += '\n  ' + countries.filter(c => c[0] !== 'unknown').length + ' countries';
  if (busiest) text += '  ·  busiest day ' + busiest[0] + ' (' + busiest[1] + ')';
  text += '\n  ' + bots + ' more views were crawlers, excluded from everything below\n\n';

  if (!total) {
    text += 'No human page views in this window.\n\n' +
            'If that is a surprise: check that /visit.js is loading and that\n' +
            '/api/visit returns 204 (Network tab, any page).\n';
    return { text, total, bots };
  }

  text += section('WHERE FROM', countries, total, 12, named) + '\n';
  text += section('MOST VISITED', tally(human, 'path'), total, 12) + '\n';
  text += section('HOW THEY GOT HERE', tally(human, 'referrer'), total, 8) + '\n';
  text += section('DEVICE', tally(human, 'device'), total, 4) + '\n';
  text += section('OS', tally(human, 'os'), total, 6) + '\n';
  text += section('BROWSER', tally(human, 'browser'), total, 6) + '\n';
  text += section('BROWSER LANGUAGE', tally(human, 'lang'), total, 8) + '\n';

  text += 'BY DAY\n';
  const dmax = Math.max(...daily.map(d => d[1]));
  for (const [d, n] of daily) text += '  ' + d + '  ' + String(n).padStart(5) + '  ' + bar(n, dmax, 24) + '\n';

  text += '\n' + '─'.repeat(58) + '\n';
  text += 'These are PAGE VIEWS, not unique visitors. Nothing is stored that\n';
  text += 'could tie two views to one person — no cookie, no id, no IP, and\n';
  text += 'country only, never city. Counting people would mean identifying\n';
  text += 'them. Do Not Track is honoured, so a few visits go uncounted.\n';
  return { text, total, bots };
}

export default async (request) => {
  const url = new URL(request.url);
  const dry = url.searchParams.get('dry') === '1';

  if (process.env.DIGEST_KEY && url.searchParams.get('key') &&
      url.searchParams.get('key') !== process.env.DIGEST_KEY) {
    return new Response('forbidden', { status: 403 });
  }

  if (!SERVICE_KEY) {
    const msg = 'SUPABASE_SERVICE_KEY not set — cannot read page_views (anon may insert but not select, by design).';
    console.error('[visitor-digest] ' + msg);
    return new Response(JSON.stringify({ ok: false, reason: msg }), { status: 503 });
  }

  let report;
  try {
    report = buildReport(await fetchRows());
  } catch (err) {
    console.error('[visitor-digest] ' + (err && err.message));
    return new Response(JSON.stringify({ ok: false, error: String(err && err.message) }), { status: 500 });
  }

  if (dry) {
    return new Response(report.text, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('[visitor-digest] RESEND_API_KEY not set — report built but not sent');
    return new Response(JSON.stringify({ ok: false, reason: 'no resend key' }), { status: 503 });
  }

  const period = new Date(Date.now() - DAYS * 864e5).toISOString().slice(0, 10) +
                 ' → ' + new Date().toISOString().slice(0, 10);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [INBOX],
      subject: '✦ Fungai Art · traffic · ' + period + ' · ' + report.total + ' views',
      text: report.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[visitor-digest] resend ' + res.status + ' ' + body.slice(0, 200));
    return new Response(JSON.stringify({ ok: false, reason: 'resend ' + res.status }), { status: 502 });
  }
  return new Response(JSON.stringify({ ok: true, views: report.total, bots: report.bots }), { status: 200 });
};
