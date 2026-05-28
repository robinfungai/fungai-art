// Formula-origin lookup. Returns the city/country a request came from so we
// can geo-tag where a formula was built. Hard privacy rule: if the client
// looks like they're behind a VPN/proxy, we return { vpn_likely: true } and
// the front-end is expected to SKIP saving any origin data.
//
// We rely on Netlify's free `x-nf-geo` header for the geo lookup (no third-
// party API key required, no IP storage on our side). The VPN heuristic is
// intentionally light — we never claim certainty, just "looks suspicious."

export default async function handler(req, context) {
  const geoHeader = req.headers.get('x-nf-geo');
  const ip = req.headers.get('x-nf-client-connection-ip')
          || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || '';

  // Very light VPN/proxy heuristic — look at any obvious headers that paid
  // VPN services often leak. If you want stricter detection later, swap in
  // a paid VPN-detection API. We DO NOT do reverse DNS or rDNS scoring here
  // because that costs money and we're respecting the user's stance.
  const ua = (req.headers.get('user-agent') || '').toLowerCase();
  const via = (req.headers.get('via') || '').toLowerCase();
  const forwarded = (req.headers.get('forwarded') || '').toLowerCase();
  const proxyHeader = req.headers.get('x-proxy-id') || req.headers.get('x-vpn');
  const vpnLikely = Boolean(
    proxyHeader ||
    /vpn|proxy|anonymous/i.test(via) ||
    /vpn|proxy|anonymous/i.test(forwarded) ||
    /nordvpn|expressvpn|proton|surfshark|mullvad/i.test(ua)
  );

  if (vpnLikely) {
    return new Response(
      JSON.stringify({ vpn_likely: true, city: null, country: null, region: null }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }
    );
  }

  let geo = {};
  try { geo = geoHeader ? JSON.parse(geoHeader) : {}; } catch { geo = {}; }

  const city    = geo.city || null;
  const country = geo.country?.name || geo.country?.code || null;
  const region  = geo.subdivision?.name || geo.subdivision?.code || null;

  return new Response(
    JSON.stringify({
      vpn_likely: false,
      city,
      country,
      region,
      // IP is intentionally NOT returned — we only ever share city-level data.
      timezone: geo.timezone || null,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 min — same client likely stays in same city
      },
    }
  );
}

export const config = { path: '/api/formula-origin' };
