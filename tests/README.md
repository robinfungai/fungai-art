# FYF Regression Fixtures — Step 0

This directory is the **regression baseline** for the "Move Formula
Intelligence Server-Side" migration (P0). It exists so any refactor
of the formula engine can be proven byte-equivalent to the current
client-side implementation before shipping.

## Structure

```
tests/
├── README.md                        (this file)
├── engine-snapshot.cjs              frozen snapshot of the current
│                                    client-side engine, runnable
│                                    from Node — copied verbatim
│                                    from public/find-your-formula/
│                                    index.html at capture time
├── capture-fixtures.cjs             loads snapshot + herbs, runs
│                                    each profile through the engine,
│                                    writes expected/*.json
├── compare-fixtures.cjs             (Step 1+) runs the NEW server
│                                    engine against the same profiles
│                                    and diffs against expected/
└── fixtures/
    ├── profiles/                    input side (20 files)
    │   ├── 01-baseline.json
    │   ├── ...
    │   └── 20-adversarial-empty-avoid.json
    └── expected/                    output side (captured baseline)
        ├── 01-baseline.json
        └── ...
```

## Regeneration

**Do not regenerate the baseline casually.** The whole point is that
`expected/*.json` is FROZEN at Step 0 — the reference we validate the
server engine against later.

If the client engine changes intentionally (bug fix, deliberate
methodology change), regenerate with:

```bash
node tests/capture-fixtures.cjs --overwrite
```

Then commit the changed `expected/*.json` files with a message that
explains the deliberate change. A silent capture-baseline change is
a red flag in review.

## Fixture design

Each of the 20 profiles targets a specific behavioural surface of
the engine. Together they cover:

| # | Profile | Targets |
|---|---|---|
| 01 | Baseline stress reader | happy path, single intention |
| 02 | Ranked multi-intention | 1-2-3 ranked bubbles, weighting |
| 03 | Conflicting axes | energy + sleep + calm |
| 04 | Maximum safety restrictions | all avoid flags on |
| 05 | Psych meds only | SSRI-compatible filter path |
| 06 | Cardio meds + hypertension | vasoconstrictive filter |
| 07 | Pregnancy | uterine/emmenagogue filter |
| 08 | Thyroid | iodine + thyroid-active filter |
| 09 | Liver / kidney | hepatotoxic + oxalate filter |
| 10 | Lifelong chronic pattern | max complexity, long duration |
| 11 | Beauty + digestion | should trigger trace-herb cap |
| 12 | Anxiety + sleep + stress | GABAergic load cap |
| 13 | Energy + cognitive + performance | CNS stimulant load cap |
| 14 | Minimal profile | should compose at 3-4 herbs |
| 15 | Max complexity | should compose at 6-7 herbs |
| 16 | Gated (Amanita) opt-in | ceremonial herbs eligible |
| 17 | Same as 16 without opt-in | ceremonial herbs skipped |
| 18 | Pro-mode with Pro-only fields | carries nervous/energy_curve/etc through |
| 19 | Heavy free-text notes | notes-boost path |
| 20 | Adversarial: empty avoid + all opts on | force worst-case safety bypass — server MUST still safety-check |

## What each expected/*.json captures

```jsonc
{
  "profileId":        "01-baseline",
  "input":            { …the input profile echoed for provenance… },
  "output": {
    "engineVersion":     "1.0.0-clientside",   // frozen at Step 0
    "herbDbVersion":     "2026.09",
    "capturedAt":        "2026-09-11T…Z",
    "formulaSize":       5,
    "targetHerbCount":   5,
    "filteredOut":       { "removed": 0, "byFlag": {} },
    "herbs": [
      { "id": 210, "name": "Ashwagandha",
        "category": "adaptogen", "score": 42, "percentage": 26,
        "isTrace": false, "isGABAergic": false, "isCNSStimulant": false }
    ],
    "percentageTotal":   100,
    "synergies":         [ { "a": "…", "b": "…", "note": "…" } ],
    "cautions":          [],
    "formulaName":       "Held Hollow"
  }
}
```

The server engine (built in Step 1) is validated by:
1. Loading the same 20 input profiles.
2. Running them through the NEW `src/server/formula-engine/`.
3. Diffing NEW output against `expected/*.json`.
4. Any drift is a regression — either fix the server engine to
   match, OR (if the drift is intentional and documented) update the
   fixtures with `--overwrite` and reference the reason in the
   commit message.

## Not covered here

Fixtures 15–20 include some adversarial shapes but this suite is
NOT a security test. Adversarial coverage (bypass avoid flags,
forge herb ids, replay MYCO with attacker shortlist, etc) lives in
a separate `tests/security/` suite added in Step 2.
