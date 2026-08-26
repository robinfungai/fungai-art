// ═══════════════════════════════════════════════════════════════
// Fungai Art · IP block (edge)
// ═══════════════════════════════════════════════════════════════
// Runs at Netlify's CDN edge on every request. Reads the banned
// IP list from Supabase (banned_users.ip_address column) and
// returns a 403 for any matching request BEFORE the site loads.
//
// Cached in memory per edge instance for 60 seconds so we don't
// hammer Supabase — a fresh ban propagates within 60 seconds of
// being added to the table.
//
// Configuration (netlify.toml):
//   [[edge_functions]]
//     function = "ip-block"
//     path = "/*"
//
// Env vars needed at build time (Netlify → Site → Environment):
//   SUPABASE_URL              (already set)
//   SUPABASE_SERVICE_ROLE_KEY (already set — for orders + this)
// ═══════════════════════════════════════════════════════════════

// Cache the banned IP list at module scope so it survives across
// requests on the same edge instance.
let cachedIps = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadBannedIps(env) {
  const now = Date.now();
  if (cachedIps && (now - cachedAt) < CACHE_TTL_MS) return cachedIps;
  const url = env.get('SUPABASE_URL');
  const key = env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    // Fail open — no ban list, no block. Log and continue so a mis-
    // configured env doesn't take the whole site down.
    console.error('[ip-block] SUPABASE_URL or service key missing — cannot fetch ban list');
    cachedIps = new Set();
    cachedAt = now;
    return cachedIps;
  }
  try {
    const res = await fetch(`${url}/rest/v1/banned_users?select=ip_address&ip_address=not.is.null`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });
    if (!res.ok) {
      console.error('[ip-block] Supabase fetch failed', res.status);
      cachedIps = cachedIps || new Set();
      cachedAt = now;
      return cachedIps;
    }
    const rows = await res.json();
    const set = new Set();
    for (const r of rows) {
      const raw = (r.ip_address || '').trim();
      if (!raw) continue;
      // Support comma-separated lists in the column so one banned
      // person can have multiple known IPs.
      raw.split(',').forEach(ip => {
        const clean = ip.trim();
        if (clean) set.add(clean);
      });
    }
    cachedIps = set;
    cachedAt = now;
    return cachedIps;
  } catch (e) {
    console.error('[ip-block] Ban list fetch threw', e.message);
    cachedIps = cachedIps || new Set();
    cachedAt = now;
    return cachedIps;
  }
}

export default async (request, context) => {
  // Skip static assets — no point checking on every image request.
  // Only care about HTML page loads and API calls.
  const url = new URL(request.url);
  const path = url.pathname;
  const isAsset = /\.(png|jpe?g|webp|svg|gif|ico|css|js|woff2?|ttf|otf|map)$/i.test(path);
  if (isAsset) return;

  const banned = await loadBannedIps(Netlify.env);
  if (banned.size === 0) return;

  const clientIp = context.ip
    || request.headers.get('x-nf-client-connection-ip')
    || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  if (!clientIp) return;

  if (banned.has(clientIp)) {
    console.warn('[ip-block] Refused', clientIp, path);
    return new Response(
      '<!doctype html><html><head><meta charset="utf-8"><title>Access notice</title>'
      + '<style>body{background:#05090C;color:#EDE5D8;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:40px;text-align:center;}</style>'
      + '</head><body><div style="max-width:520px;">'
      + '<p style="font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#8B7E62;margin-bottom:24px;">Access notice</p>'
      + '<p style="font-family:Georgia,serif;font-style:italic;font-size:32px;line-height:1.35;margin-bottom:20px;">Access to Fungai Art has been revoked.</p>'
      + '<p style="font-size:14px;color:#C0B49A;opacity:0.75;line-height:1.7;">If you believe this is an error, write to <a href="mailto:robin@fungai.art" style="color:#E8B14B;">robin@fungai.art</a>.</p>'
      + '</div></body></html>',
      { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
};

export const config = { path: '/*' };
