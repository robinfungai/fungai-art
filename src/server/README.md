# `src/server/` — private server-side code

Everything in this directory is **SERVER-ONLY**. It must never be
imported by any React component, static HTML page, or client bundle.
The Vite client bundle does not touch this subtree by construction —
verified after every build by grepping the built `dist/` for
sensitive tokens (`GABAERGIC_IDS`, `RESTRICTED_NAMES`, proprietary
herb records, etc).

## Directory purpose

```
src/server/
├── herb-data/                 the private Herb Knowledge Base
│   ├── herbs.generated.cjs    auto-generated Node-safe copy of
│   │                          src/data/herbs.ts (via
│   │                          scripts/export-herbs.cjs). Committed
│   │                          so netlify functions and tests can
│   │                          require it without running the build.
│   └── index.js               access layer: getAllHerbs,
│                              getHerbById, getEligibleHerbs, etc.
│
└── formula-engine/            the private Formula Engine + Safety Engine
    ├── version.js             engineVersion / herbDbVersion /
    │                          safetyRulesVersion (embedded in every
    │                          compileFormula response)
    ├── axes.js                inferAxes, isRestricted, isGated, ensurePool
    ├── traces.js              isTrace, TRACE_IDS
    ├── pharmacology.js        isGABAergic, isCNSStimulant, categoryOf,
    │                          GABAERGIC_IDS, STIMULANT_IDS
    ├── scoring.js             scoreHerb, notesBoost, subPatternBoost,
    │                          durationBoost, ageBoost, sleepBoost
    ├── safety.js              safetyFilter, countFilteredOut,
    │                          validateAndNormalizeAvoid ⚠SECURITY_FIX⚠
    ├── picker.js              pickFormula, targetHerbCount
    ├── percentages.js         assignPercentages
    ├── interactions.js        checkFormulaPairs
    └── index.js               public API: compileFormula(profile)
                               → { status: 'ok'|'rejected', ... }
```

## Import rules

- `netlify/functions/*` may import from `src/server/**` (server context).
- `tests/*` may import from `src/server/**` (Node context).
- **No React component may import from `src/server/**`.**
- **No file in `public/*.js` may reference `src/server/**`.**

If a React component ever accidentally imports from `src/server/**`,
Vite will happily bundle it into the client output. The build
verification pass in the P0 migration catches this by grepping the
built dist for known server-only tokens.

## Migration status (Step 1 of P0)

- ✅ Data + engine live server-side.
- ✅ Compare-fixtures runs the server engine and matches baseline.
- ⚠️ Client `/find-your-formula/` STILL runs its own copy of the
     engine and downloads `/herbs-data.js`. That client-side path
     goes away in Steps 6–8 once the server endpoint is wired and
     shadow-tested.
- ⚠️ `src/data/herbs.ts` is still imported by React components
     (`App.tsx`, `HerbalEngine.tsx`, etc), so the herb data still
     ships in the client SPA bundle for those pages. Migrating
     `/herbal-engine-2/` and `/tailored/` off the local copy is
     tracked as a P1 follow-up (audit section 14).
