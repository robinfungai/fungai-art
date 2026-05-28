// Skogsskafferiet.se observation clusters — manually read from their interactive maps
// Source: skogsskafferiet.se (Swedish community foraging database)
// Method: visual coordinate extraction from map screenshots, Dalarna region focus
// These are approximate cluster centres, not exact GPS points

export interface SkogsObs {
  herb: string;          // Swedish name
  latin: string;         // Latin name
  count: number;         // approx observation count in region
  county: string;        // Swedish county
  points: [number, number][]; // [lng, lat] approximate clusters
}

export const SKOGSSKAFFERIET_OBS: SkogsObs[] = [

  // ── KVANNE (Angelica archangelica) — 122 obs in Dalarna ──────────────────
  // Screenshot: dense north (Mora/Orsa area) + scatter south toward Falun
  {
    herb: 'Kvanne', latin: 'Angelica archangelica', count: 122, county: 'Dalarna',
    points: [
      [14.28, 61.13], [14.42, 61.05], [14.55, 61.00], [14.18, 60.95],
      [14.35, 60.92], [14.72, 60.88], [14.60, 60.82], [14.85, 60.78],
      [15.02, 60.72], [14.90, 60.66], [15.18, 60.63], [15.10, 60.55],
      [15.32, 60.58], [13.88, 60.42], [13.65, 60.32], [14.05, 60.50],
    ],
  },

  // ── CIKORIA (Cichorium intybus) — 45 obs in Dalarna ─────────────────────
  // Screenshot: clustered around Siljan lake + south toward Borlänge
  {
    herb: 'Cikoria', latin: 'Cichorium intybus', count: 45, county: 'Dalarna',
    points: [
      [14.72, 60.90], [14.88, 60.83], [15.00, 60.80], [14.65, 60.75],
      [14.95, 60.72], [15.22, 60.68], [15.15, 60.58], [15.35, 60.52],
      [15.28, 60.45], [14.60, 60.92], [15.05, 60.88],
    ],
  },

  // ── KANTARELL (Cantharellus cibarius) — widespread across Sweden ─────────
  // Known density: Värmland, Dalarna, Uppland conifer forests
  {
    herb: 'Kantarell', latin: 'Cantharellus cibarius', count: 240, county: 'Dalarna & Värmland',
    points: [
      // Dalarna
      [15.12, 61.02], [14.80, 60.92], [15.25, 60.75], [14.95, 60.68],
      [15.40, 60.88], [15.62, 60.72], [15.55, 60.60],
      // Värmland
      [13.20, 59.55], [13.45, 59.70], [13.78, 59.48], [12.98, 59.62],
      [13.62, 59.85], [14.05, 59.52],
      // Bergslagen
      [15.22, 60.18], [15.45, 60.08], [15.85, 59.95],
    ],
  },

  // ── FLÄDERBÄR / FLÄDER (Sambucus nigra) ─────────────────────────────────
  // Common in southern/central Sweden hedges and forest edges
  {
    herb: 'Fläder', latin: 'Sambucus nigra', count: 180, county: 'Södermanland & Dalarna',
    points: [
      // Södermanland
      [16.90, 59.08], [16.75, 58.95], [17.12, 59.02], [16.55, 58.82],
      [17.30, 58.88], [16.98, 58.75],
      // Dalarna south
      [15.60, 60.48], [15.42, 60.35], [15.18, 60.28],
      // Uppland
      [17.65, 60.12], [17.45, 59.92], [17.80, 59.78],
    ],
  },

  // ── NÄSSLA (Urtica dioica) ────────────────────────────────────────────────
  // Ubiquitous across Sweden — forest edges, streams, disturbed ground
  {
    herb: 'Nässla', latin: 'Urtica dioica', count: 320, county: 'All regions',
    points: [
      // Uppland / Uppsala area
      [17.62, 59.98], [17.50, 60.08], [17.80, 59.85],
      // Dalarna
      [14.92, 60.82], [15.28, 60.58], [14.62, 61.00],
      // Södermanland
      [16.82, 58.90], [17.08, 59.05],
      // Bergslagen
      [15.82, 59.92], [15.45, 60.12],
      // Värmland
      [13.38, 59.52], [13.68, 59.72],
      // Östergötland
      [15.62, 58.42], [15.28, 58.58],
    ],
  },

  // ── BLÅBÄR (Vaccinium myrtillus) ──────────────────────────────────────────
  // Dominant forest floor plant across boreal Sweden
  {
    herb: 'Blåbär', latin: 'Vaccinium myrtillus', count: 280, county: 'Dalarna & Jämtland',
    points: [
      // Northern Dalarna (Siljan)
      [14.50, 61.10], [14.75, 60.95], [14.38, 60.88],
      // Central Dalarna
      [15.08, 60.75], [14.90, 60.62], [15.30, 60.68],
      // Jämtland
      [14.22, 63.35], [13.88, 63.18], [14.55, 63.05],
      // Värmland
      [13.28, 59.68], [13.55, 59.82],
      // Bergslagen
      [15.20, 60.15], [15.72, 59.88],
    ],
  },

  // ── LINGON (Vaccinium vitis-idaea) ────────────────────────────────────────
  // Pine heaths and boreal forests — especially rich in Dalarna and north
  {
    herb: 'Lingon', latin: 'Vaccinium vitis-idaea', count: 310, county: 'Dalarna & Norrland',
    points: [
      // Dalarna
      [15.45, 60.58], [14.88, 60.95], [15.22, 60.72], [14.62, 61.05],
      // Bergslagen (Robin's ground)
      [15.85, 59.92], [15.20, 60.18], [15.65, 60.62],
      // Norrland (Ångermanland/Västernorrland)
      [17.22, 63.28], [17.55, 63.08], [17.85, 62.85],
      // Jämtland
      [13.92, 63.22], [14.28, 63.05],
    ],
  },

  // ── HALLON (Rubus idaeus) ─────────────────────────────────────────────────
  // Raspberry: clearcuts, forest margins, all of Sweden
  {
    herb: 'Hallon', latin: 'Rubus idaeus', count: 200, county: 'All regions',
    points: [
      // Södermanland / clearcut zones
      [16.88, 58.92], [16.55, 58.72], [17.05, 58.85],
      // Dalarna
      [15.05, 60.70], [15.38, 60.55], [14.78, 60.88],
      // Uppland
      [17.55, 59.95], [17.28, 60.08],
      // Värmland
      [13.42, 59.65], [13.72, 59.52],
      // Bergslagen
      [15.78, 59.95], [15.25, 60.12],
    ],
  },

  // ── BJÖRKTICKA (Fomitopsis betulina — Birch Polypore) ─────────────────────
  // On dead/dying birch — all birch forest areas of Sweden
  {
    herb: 'Björkticka', latin: 'Fomitopsis betulina', count: 95, county: 'Dalarna & Jämtland',
    points: [
      // Dalarna birch forests
      [14.72, 60.90], [14.38, 61.08], [15.02, 60.78], [15.22, 60.60],
      // Jämtland mountain birch
      [13.78, 63.28], [14.12, 63.15], [13.45, 63.40],
      // Bergslagen (Robin's)
      [15.18, 60.15], [15.82, 59.90],
    ],
  },

  // ── RÖLLEKA (Achillea millefolium — Yarrow) ───────────────────────────────
  // Roadsides, meadows, all of Sweden — extremely common
  {
    herb: 'Rölleka', latin: 'Achillea millefolium', count: 250, county: 'All regions',
    points: [
      // Öland (dominant) — keep all points clearly on the island interior to avoid Kalmarsund water artefacts
      [16.68, 56.72], [16.72, 56.85], [16.55, 56.95],
      // Dalarna meadows
      [14.88, 60.75], [15.18, 60.55], [14.55, 60.92],
      // Skåne
      [13.52, 55.88], [13.28, 55.72], [13.80, 55.58],
      // Uppland
      [17.62, 59.98], [17.45, 59.82],
    ],
  },

  // ── ÄLGÖRT (Filipendula ulmaria — Meadowsweet) ────────────────────────────
  // Wetlands, stream edges — abundant in Dalarna and Mälardalen
  {
    herb: 'Älgört', latin: 'Filipendula ulmaria', count: 185, county: 'Dalarna & Mälardalen',
    points: [
      // Mälardalen / Mälaren shores
      [17.08, 59.38], [17.32, 59.22], [16.88, 59.45],
      // Dalarna wetlands
      [14.80, 60.88], [15.05, 60.72], [15.28, 60.62],
      // Uppland streams
      [17.58, 60.05], [17.42, 59.88],
      // Bergslagen
      [15.82, 59.95], [15.42, 60.08],
    ],
  },

  // ── SLÅNBÄR (Prunus spinosa — Sloe) ──────────────────────────────────────
  // Coastal hedges, southern Sweden only
  {
    herb: 'Slånbär', latin: 'Prunus spinosa', count: 88, county: 'Halland & Skåne',
    points: [
      // Halland coast
      [12.85, 56.92], [12.72, 56.78], [12.95, 56.68],
      // Skåne
      [13.55, 55.72], [13.28, 55.85], [13.82, 55.62], [13.15, 56.05],
      // Gotland — keep points clearly inland to avoid west-coast water artefacts
      [18.32, 57.48], [18.40, 57.62],
    ],
  },

  // ── TALL (Pinus sylvestris — Scots Pine) — FULL SWEDEN COVERAGE ──────────
  // Source: skogsskafferiet.se/tall/ — grows on dry soil throughout all Sweden
  // Year-round harvest: needles (vit C), pollen (May), shoots (May–Jun), bark (spring), resin
  {
    herb: 'Tall', latin: 'Pinus sylvestris', count: 680, county: 'All of Sweden',
    points: [
      // Norrland (Norrbotten/Västerbotten) — dense boreal pine
      [21.50, 65.80], [20.20, 65.50], [18.80, 65.20], [17.50, 65.00], [19.80, 66.20],
      [22.10, 65.40], [23.50, 65.10], [17.20, 64.80], [15.80, 64.50],
      // Jämtland/Ångermanland
      [14.38, 63.38], [15.10, 63.15], [16.20, 63.00], [17.60, 63.30], [18.40, 63.50],
      [13.70, 63.00], [16.80, 62.80], [15.40, 62.50], [17.20, 62.30],
      // Medelpad/Hälsingland
      [17.30, 62.10], [16.50, 61.80], [15.80, 61.60], [17.90, 61.50], [16.10, 62.30],
      // Dalarna — Robin's region
      [14.28, 61.10], [14.65, 60.95], [14.90, 60.78], [15.22, 60.65], [15.45, 60.55],
      [15.62, 60.62], [15.85, 60.48], [14.45, 60.88], [13.88, 60.72],
      // Bergslagen — Robin's home ground
      [15.20, 60.18], [15.55, 60.08], [15.82, 59.92], [15.45, 59.75], [16.05, 59.82],
      [15.28, 59.55], [15.70, 59.45], [16.20, 59.62],
      // Värmland
      [13.22, 59.88], [13.48, 59.62], [12.98, 59.45], [13.75, 59.30], [13.10, 60.10],
      // Uppland/Västmanland
      [17.62, 59.98], [17.35, 59.78], [16.98, 59.62], [17.80, 59.55], [16.75, 60.12],
      // Södermanland/Östergötland
      [16.85, 58.88], [17.12, 58.62], [15.62, 58.48], [16.28, 58.35], [15.98, 58.72],
      // Småland (extensive pine heath)
      [15.22, 57.82], [14.88, 57.58], [15.55, 57.42], [14.42, 57.22], [15.85, 57.68],
      [14.12, 57.88], [16.18, 57.55], [13.85, 57.48],
      // Halland/Blekinge coast
      [12.88, 56.88], [12.65, 56.72], [13.12, 56.55], [15.52, 56.22], [14.82, 56.45],
      // Skåne (southernmost — less common but present)
      [13.55, 55.88], [13.28, 55.72], [13.85, 55.62],
      // Gotland — inland points only (west-coast points nudged east to stay on the limestone, not in the Baltic)
      [18.30, 57.52], [18.40, 57.68], [18.55, 57.35],
      // Öland — central spine, not the west-coast Kalmarsund waterline
      [16.68, 56.75], [16.82, 56.55],
    ],
  },

  // ── FLÄDERBÄR (Sambucus nigra berries) ───────────────────────────────────
  {
    herb: 'Fläderbär', latin: 'Sambucus nigra', count: 145, county: 'Southern Sweden',
    points: [
      // Skåne
      [13.65, 55.78], [13.42, 55.62], [13.88, 55.92],
      // Halland
      [12.88, 56.85], [12.72, 56.72],
      // Blekinge
      [15.52, 56.22], [15.28, 56.38],
      // Södermanland north
      [16.92, 59.12], [17.15, 58.95],
    ],
  },
];
