/* collect-visit · the only thing on fungai.art that counts a page view
 * ────────────────────────────────────────────────────────────────
 * A page sends one beacon per view. This turns it into a row in
 * public.page_views and returns 204. Nothing is returned to the caller,
 * so the endpoint cannot be used to read anything back.
 *
 * ── WHAT IT REFUSES TO COLLECT ───────────────────────────────────
 * No IP. No city. No lat/lng. No cookie or generated visitor id. The
 * User-Agent is read, reduced to three coarse buckets, and dropped.
 *
 * The country comes from Netlify's `x-nf-geo` header, and ONLY the
 * country field of it. reserve-formula.mjs was cut back to exactly this
 * under GDPR minimisation and tests/geo-minimisation-verify.cjs keeps it
 * there; analytics collecting more than the checkout does would make that
 * policy meaningless.
 *
 * The consequence, stated plainly because it shapes the report: these are
 * PAGE VIEWS, not unique visitors. Counting people requires identifying
 * them, and we are choosing not to.
 *
 * ── THE PATH IS SANITISED TWICE ──────────────────────────────────
 * Query string and fragment are stripped here, and the database CHECK
 * rejects a path containing '?' or '#' anyway. Magic-link tokens and
 * emails travel in query strings, and an analytics table is the last
 * place they should come to rest.
 *
 * Environment:
 *   SUPABASE_URL / VITE_SUPABASE_URL            (falls back to the project URL)
 *   SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY  (public by design)
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://cyhpvsyvxzfadtyvcuwp.supabase.co';
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aHB2c3l2eHpmYWR0eXZjdXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDU5NTYsImV4cCI6MjA4NTMyMTk1Nn0.BFgP50enaZLWEzhvdfHoAYniLyJiFoo6rct7PYKx1k4';

// Bots are recorded but flagged, not dropped. Knowing what share of
// traffic is crawlers is part of reading the numbers honestly.
const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|phantom|curl|wget|python-requests|axios|lighthouse|pingdom|uptime|semrush|ahrefs|petal|bytespider|gptbot|claudebot|ccbot|perplexity/i;

function classifyUA(ua) {
  const s = String(ua || '');
  const is_bot = BOT_RE.test(s);

  let device = 'desktop';
  if (/\b(ipad|tablet)\b/i.test(s) || (/android/i.test(s) && !/mobile/i.test(s))) device = 'tablet';
  else if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(s)) device = 'mobile';

  let os = 'other';
  if (/windows nt/i.test(s))            os = 'windows';
  else if (/iphone|ipad|ipod|ios /i.test(s)) os = 'ios';
  else if (/mac os x|macintosh/i.test(s))    os = 'macos';
  else if (/android/i.test(s))          os = 'android';
  else if (/linux|x11|ubuntu/i.test(s)) os = 'linux';

  // Order matters: Edge and Opera both claim Chrome, Chrome claims Safari.
  let browser = 'other';
  if (/edg[ae]?\//i.test(s))       browser = 'edge';
  else if (/opr\/|opera/i.test(s)) browser = 'opera';
  else if (/firefox|fxios/i.test(s)) browser = 'firefox';
  else if (/chrome|crios/i.test(s))  browser = 'chrome';
  else if (/safari/i.test(s))        browser = 'safari';

  return { is_bot, device, os, browser };
}

/** Country, and nothing else, out of Netlify's geo header. */
function countryOnly(headers) {
  const direct = headers.get('x-country') || headers.get('x-nf-country');
  if (direct && /^[A-Za-z]{2}$/.test(direct)) return direct.toUpperCase();
  const raw = headers.get('x-nf-geo');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    const code = parsed && parsed.country && parsed.country.code;
    return /^[A-Za-z]{2}$/.test(String(code || '')) ? String(code).toUpperCase() : null;
  } catch (_) {
    return null;
  }
}

/** The referring HOST, never the full URL — a referrer can carry search terms. */
function referrerHost(ref) {
  const s = String(ref || '').trim();
  if (!s) return 'direct';
  try {
    const h = new URL(s).hostname.replace(/^www\./, '').toLowerCase();
    if (!h || h.endsWith('fungai.art') || h === 'localhost') return 'internal';
    return h.slice(0, 64);
  } catch (_) {
    return 'other';
  }
}

function cleanPath(p) {
  let s = String(p || '/').split('?')[0].split('#')[0].trim();
  if (!s.startsWith('/')) s = '/' + s;
  s = s.replace(/\/{2,}/g, '/');
  if (s.length > 1) s = s.replace(/\/+$/, '') || '/';
  return s.slice(0, 160);
}

function primaryLang(header, given) {
  const s = String(given || header || '').split(',')[0].trim().toLowerCase();
  const m = s.match(/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i);
  return m ? s.slice(0, 8) : null;
}

export default async (request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: cors });

  let body = {};
  try { body = await request.json(); } catch (_) { body = {}; }

  const ua = classifyUA(request.headers.get('user-agent'));
  const row = {
    path:     cleanPath(body.p),
    country:  countryOnly(request.headers),
    device:   ua.device,
    os:       ua.os,
    browser:  ua.browser,
    referrer: referrerHost(body.r),
    lang:     primaryLang(request.headers.get('accept-language'), body.l),
    is_bot:   ua.is_bot,
  };

  // A failed write must never surface to the visitor, and must never
  // delay the page. Fire, log, return 204 regardless.
  try {
    const res = await fetch(SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/page_views', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: 'Bearer ' + SUPABASE_ANON,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.warn('[collect-visit] supabase ' + res.status + ' ' + (await res.text()).slice(0, 160));
  } catch (err) {
    console.warn('[collect-visit] ' + (err && err.message));
  }

  return new Response(null, { status: 204, headers: cors });
};

export const config = { path: '/api/visit' };
