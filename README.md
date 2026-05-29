# Fungai Art

> Living mycelial art &mdash; fusion of plants, alchemy, and frequency.
> Wild-foraged botanical preparations, adaptogenic blends, and embodied
> experiences rooted in ecological care and ancient intelligence.

**Live site:** [fungai.art](https://www.fungai.art)
**Network portal:** [fungai.art/community](https://www.fungai.art/community)
**Foraging map:** [fungai.art/foraging](https://www.fungai.art/foraging)
**Sub-line:** [fungai.art/tymetonics](https://www.fungai.art/tymetonics) &mdash; New Tyme Tonics

---

## What this repo is

A multi-surface site that doubles as an apothecary, a foraging knowledge
engine, a member network, and a content layer:

| Surface | What it does |
| --- | --- |
| `/home` | Static home page &mdash; brand, hero, foraging arc preview, tailored formula CTA, about, journal |
| `/shop` | Static apothecary shop with Stripe-backed checkout |
| `/mixology` | Materia medica browse &mdash; 168 botanicals, filter by element / category / tradition |
| `/herbal-engine-2/` | Tailored formula composer &mdash; takes intent, constitution, delivery, returns a recipe |
| `/extraction` | Five-method extraction protocols &mdash; spagyric, cold tincture, decoction, dual, oil infusion |
| `/health` | Health-intelligence symptom matcher with safety filters |
| `/foraging` | Predictive foraging map (React + MapLibre) over Sweden / Berlin / France / Med / Levant |
| `/community` | Spore portal &mdash; living member network, $MH economy, calendar, admin |
| `/community/academy/` | Alchemy Academy &mdash; extraction school + formula book + admin lab notebook |
| `/tymetonics` | New Tyme Tonics &mdash; kegged living-drinks sub-line |

## Stack

- **Vite + React + TypeScript** for the foraging app and the Vite home shell.
- **Static HTML** for everything else (home, shop, mixology, extraction, health, etc.) &mdash; keeps the cognitive surface lean and works without a build step for editing.
- **Babel-standalone JSX** for the community/spore portal (loaded in-browser; soon to be ported to the build).
- **Supabase** for auth (magic-link / PKCE), profiles, and member-state persistence.
- **Netlify Functions** for the GBIF observation proxy, forage-conditions, formula-origin lookup, and newsletter subscribe.
- **Stripe** for shop checkout.

## Local development

```bash
npm install
npm run dev          # vite dev server (foraging + home shell)
npm run build        # production build
```

The static pages under `public/` are served directly by Netlify; edit them in place. Changes to `src/data/herbs.ts` need a rebuild of the derived files:

```bash
npm run build:herb-pool    # writes public/herb-engine-pool.json
node scripts/export-herbs.cjs   # writes public/herbs-data.js
node scripts/sync-engine2.cjs   # injects the herb list into the engine-2 HTML
```

`npm run build` runs all three before the Vite build.

## Brand assets

- **Logo:** `/fungi.png` (amber-ring round token used everywhere)
- **Favicon:** `/favicon.svg` (matches the fungi.png aesthetic at small sizes)
- **Apple touch icon:** `/fungai-art-logo.png`

If you're editing emails or sharing previews, use `/fungi.png` &mdash; that's the canonical mark.

---

&copy; Fungai Art. Berlin &middot; Sweden &middot; France &middot; Lebanon.
