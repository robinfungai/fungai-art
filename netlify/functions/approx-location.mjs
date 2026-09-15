// ════════════════════════════════════════════════════════════════
// Fungai Art · approximate visitor location (city-level)
// ════════════════════════════════════════════════════════════════
// Fallback for the homepage "In season · near you" box when the
// browser's precise location is declined or unavailable. Netlify
// already derives a coarse location from the connection at the edge
// (context.geo) — this just returns it, rounded to ~10 km, so the
// visitor still sees what's in season in their region.
//
// Reached at /api/approx-location. No storage, no logging of the result.
// ════════════════════════════════════════════════════════════════

const round1 = n => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 10) / 10 : null);

export default async function handler(req, context) {
  const geo = (context && context.geo) || {};
  const body = {
    lat: round1(geo.latitude),
    lng: round1(geo.longitude),
    city: geo.city || null,
    country: (geo.country && (geo.country.name || geo.country.code)) || null,
  };
  return new Response(JSON.stringify(body), {
    status: body.lat === null || body.lng === null ? 404 : 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
