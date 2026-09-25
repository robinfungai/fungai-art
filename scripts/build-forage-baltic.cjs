// scripts/build-forage-baltic.cjs — the landing page's foraging sneak peek.
// Not part of the build: run by hand when the map or a pin should move.
//   npm i --no-save d3-geo@3 topojson-client@3 world-atlas@2
//   node scripts/build-forage-baltic.cjs
// then copy the printed pin percentages into public/home/index.html (#forage).
// Generates public/home/forage-baltic.svg from Natural Earth 1:10m
// (public domain, via world-atlas) and prints the pin positions as
// percentages of the 1200×900 frame for the HTML overlay.
const fs = require('fs');
const path = require('path');
const topo = require('topojson-client');

(async () => {
  const d3 = await import('d3-geo');
  const world = require('world-atlas/countries-10m.json');
  const countries = topo.feature(world, world.objects.countries);
  const borders = topo.mesh(world, world.objects.countries, (a, b) => a !== b);

  const W = 1200, H = 900;
  const box = { w: 7.6, e: 28.4, s: 53.35, n: 60.15 };
  const edge = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    edge.push([box.w + (box.e - box.w) * t, box.s], [box.w + (box.e - box.w) * t, box.n]);
    edge.push([box.w, box.s + (box.n - box.s) * t], [box.e, box.s + (box.n - box.s) * t]);
  }
  const proj = d3.geoConicConformal().parallels([54.5, 59.5]).rotate([-18, 0])
    .fitExtent([[0, 0], [W, H]], { type: 'MultiPoint', coordinates: edge });
  proj.clipExtent([[-20, -20], [W + 20, H + 20]]);

  // Integer pixels are plenty at this size and cut the file to a fraction.
  function pathOf(geo) {
    const raw = d3.geoPath(proj)(geo) || '';
    // Per subpath: round to whole pixels, keep a point only when it is
    // 1.5px or more from the last one kept, drop rings that collapse.
    return raw.split(/(?=M)/).map((sub) => {
      const closed = /Z\s*$/.test(sub);
      const pts = (sub.match(/-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/g) || [])
        .map((s) => s.split(',').map((v) => Math.round(parseFloat(v))));
      const kept = [];
      for (const q of pts) {
        const last = kept[kept.length - 1];
        if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) >= 1.5) kept.push(q);
      }
      if (kept.length < (closed ? 3 : 2)) return '';
      return 'M' + kept.map((q) => q[0] + ',' + q[1]).join('L') + (closed ? 'Z' : '');
    }).join('');
  }
  // A named list, not a bounds test: some far-away polygons (the
  // Maldives, here) project inside-out under this conic and would
  // "intersect" the frame by covering all of it.
  const IN_VIEW = ['Sweden', 'Denmark', 'Germany', 'Poland', 'Lithuania', 'Latvia', 'Estonia',
    'Finland', 'Norway', 'Russia', 'Belarus', 'Netherlands', 'Czechia', 'Åland'];
  const near = countries.features.filter((f) => IN_VIEW.indexOf(f.properties.name) !== -1);
  const land = pathOf({ type: 'FeatureCollection', features: near });
  const lines = pathOf(borders);

  const grat = pathOf(d3.geoGraticule().step([2, 1]).extent([[4, 52], [32, 62]])());

  const px = ([lon, lat]) => proj([lon, lat]).map((v) => Math.round(v));
  const place = (label, lonlat, anchor = 'middle', cls = 'c') => {
    const [x, y] = px(lonlat);
    return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${label}</text>`;
  };
  const city = (name, lonlat, dx = 9, anchor = 'start') => {
    const [x, y] = px(lonlat);
    return `<circle class="city" cx="${x}" cy="${y}" r="3"/><text class="t" x="${x + dx}" y="${y + 4}" text-anchor="${anchor}">${name}</text>`;
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<!-- The Baltic arc: Natural Earth 1:10m (public domain), via world-atlas.
     Generated 2026-09-25. Pins are HTML over this, in public/home/index.html. -->
<defs>
<radialGradient id="sea" cx="45%" cy="55%" r="75%"><stop offset="0" stop-color="#0d1d19"/><stop offset="1" stop-color="#050a09"/></radialGradient>
<linearGradient id="land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a1f"/><stop offset="1" stop-color="#131d16"/></linearGradient>
<path id="L" d="${land}"/>
</defs>
<style>
.g{fill:none;stroke:#9ed4a0;stroke-opacity:.05;stroke-width:1}
.coast{fill:none;stroke:#6bd66f;stroke-opacity:.10;stroke-width:6;stroke-linejoin:round}
.land{fill:url(#land);stroke:#b6f0ae;stroke-opacity:.34;stroke-width:1.1;stroke-linejoin:round}
.b{fill:none;stroke:#ede5d8;stroke-opacity:.16;stroke-width:1;stroke-dasharray:3 4}
.c{font:600 15px 'Courier New',monospace;letter-spacing:.42em;fill:#ede5d8;fill-opacity:.26}
.sea{font:italic 26px Georgia,serif;letter-spacing:.2em;fill:#88bac8;fill-opacity:.32}
.city{fill:#ede5d8;fill-opacity:.45}
.t{font:13px 'Courier New',monospace;letter-spacing:.08em;fill:#ede5d8;fill-opacity:.42}
</style>
<rect width="${W}" height="${H}" fill="url(#sea)"/>
<path class="g" d="${grat}"/>
<use href="#L" class="coast"/>
<use href="#L" class="land"/>
<path class="b" d="${lines}"/>
${place('SWEDEN', [14.6, 59.35])}
${place('DENMARK', [9.25, 56.35])}
${place('GERMANY', [12.7, 53.6])}
${place('POLAND', [18.4, 53.75])}
${place('LITHUANIA', [25.0, 54.85])}
${place('LATVIA', [25.8, 56.6])}
${place('ESTONIA', [26.0, 58.85])}
${place('BALTIC SEA', [18.9, 56.0], 'middle', 'sea')}
${city('Copenhagen', [12.57, 55.68])}
${city('Stockholm', [18.07, 59.33])}
${city('Hamburg', [9.99, 53.55])}
${city('Riga', [24.11, 56.95], -9, 'end')}
${city('Tallinn', [24.75, 59.44])}
</svg>
`;
  const out = path.resolve(__dirname, '../public/home/forage-baltic.svg');
  fs.writeFileSync(out, svg);
  console.log('svg bytes', Buffer.byteLength(svg));

  const pins = {
    elderberry:   [9.95, 54.3],
    hawthorn:     [11.75, 55.5],
    chaga:        [14.9, 57.15],
    bilberry:     [17.3, 59.15],
    chanterelle:  [25.25, 56.95],
    seabuckthorn: [21.1, 55.35],
  };
  for (const [k, v] of Object.entries(pins)) {
    const [x, y] = proj(v);
    console.log(k.padEnd(13), (x / W * 100).toFixed(1) + '%', (y / H * 100).toFixed(1) + '%');
  }
})();
