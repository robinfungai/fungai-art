// Foraging conditions — Open-Meteo API (free, no key required)
// Returns weather data + a 1-10 foraging score for given coordinates
// Mushroom conditions model: rainfall 3-7 days ago + temperature + humidity

export default async function handler(req) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get('lat') || '60');
  const lng = parseFloat(url.searchParams.get('lng') || '15');

  const meteoUrl = new URL('https://api.open-meteo.com/v1/forecast');
  meteoUrl.searchParams.set('latitude', lat.toString());
  meteoUrl.searchParams.set('longitude', lng.toString());
  meteoUrl.searchParams.set('daily', [
    'precipitation_sum',
    'temperature_2m_max',
    'temperature_2m_min',
    'windspeed_10m_max',
  ].join(','));
  meteoUrl.searchParams.set('hourly', 'relativehumidity_2m');
  meteoUrl.searchParams.set('past_days', '10');
  meteoUrl.searchParams.set('forecast_days', '3');
  meteoUrl.searchParams.set('timezone', 'Europe/Stockholm');
  meteoUrl.searchParams.set('windspeed_unit', 'ms');

  try {
    const res = await fetch(meteoUrl.toString());
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const data = await res.json();

    const daily = data.daily;
    const times = daily.time; // array of date strings
    const precip = daily.precipitation_sum;
    const tMax = daily.temperature_2m_max;
    const tMin = daily.temperature_2m_min;

    const today = new Date().toISOString().slice(0, 10);
    const todayIdx = times.findIndex(t => t === today);
    if (todayIdx === -1) throw new Error('Today not found in forecast data');

    // Last 10 days of rain
    const past10 = precip.slice(Math.max(0, todayIdx - 10), todayIdx);
    const past3to7 = precip.slice(Math.max(0, todayIdx - 7), Math.max(0, todayIdx - 2));
    const totalRain10d = past10.reduce((a, b) => a + (b || 0), 0);
    const totalRain3to7 = past3to7.reduce((a, b) => a + (b || 0), 0); // sweet-spot rain
    const todayRain = precip[todayIdx] || 0;
    const yesterdayRain = precip[todayIdx - 1] || 0;

    // Temperature today
    const tMaxToday = tMax[todayIdx] ?? 0;
    const tMinToday = tMin[todayIdx] ?? 0;
    const tAvg = (tMaxToday + tMinToday) / 2;

    // Next 3 days forecast
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const idx = todayIdx + i;
      if (idx < times.length) {
        forecast.push({
          date: times[idx],
          rain: precip[idx] ?? 0,
          tMax: tMax[idx] ?? 0,
          tMin: tMin[idx] ?? 0,
        });
      }
    }

    // ── Foraging score model ───────────────────────────────────────────────
    // Mushrooms need: rain 3-7 days ago (best), warm but not hot, not currently soaking wet
    let score = 5; // baseline

    // Rain 3-7 days ago (optimal mushroom trigger window)
    if (totalRain3to7 > 25) score += 3;
    else if (totalRain3to7 > 12) score += 2;
    else if (totalRain3to7 > 5) score += 1;
    else if (totalRain3to7 < 1) score -= 2;

    // Temperature (fungi love 10–22°C)
    if (tAvg >= 12 && tAvg <= 20) score += 2;
    else if (tAvg >= 8 && tAvg <= 24) score += 1;
    else if (tAvg < 5 || tAvg > 28) score -= 2;

    // Too wet today — mushrooms may be waterlogged
    if (todayRain > 15) score -= 1;

    // Recent heavy rain without warm follow-through
    if (totalRain10d > 60 && tAvg < 10) score -= 1;

    // Dry spell
    if (totalRain10d < 3) score -= 2;

    score = Math.max(1, Math.min(10, score));

    // ── Conditions label ───────────────────────────────────────────────────
    let label, detail, color;
    if (score >= 8) {
      label = 'Excellent';
      color = '#6BD66F';
      detail = `${totalRain3to7.toFixed(0)}mm rain 3–7 days ago, ${tAvg.toFixed(0)}°C — prime fruiting window`;
    } else if (score >= 6) {
      label = 'Good';
      color = '#B6F0AE';
      detail = `Conditions developing — ${totalRain10d.toFixed(0)}mm last 10 days, ${tAvg.toFixed(0)}°C`;
    } else if (score >= 4) {
      label = 'Moderate';
      color = '#E8B14B';
      detail = totalRain10d < 5
        ? `Too dry — only ${totalRain10d.toFixed(0)}mm last 10 days`
        : `${tAvg.toFixed(0)}°C — check again after next rain`;
    } else {
      label = 'Poor';
      color = '#8B7E62';
      detail = tAvg < 5
        ? 'Too cold for most fungi — wait for warmer nights'
        : `Low rainfall and/or unfavourable temperatures`;
    }

    return new Response(JSON.stringify({
      lat, lng,
      score,
      label,
      color,
      detail,
      tAvg: Math.round(tAvg),
      tMax: Math.round(tMaxToday),
      tMin: Math.round(tMinToday),
      totalRain10d: Math.round(totalRain10d),
      totalRain3to7: Math.round(totalRain3to7),
      todayRain: Math.round(todayRain),
      yesterdayRain: Math.round(yesterdayRain),
      forecast,
      source: 'Open-Meteo (CC BY 4.0)',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800', // 30-min cache
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
