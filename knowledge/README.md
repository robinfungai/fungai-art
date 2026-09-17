# Fungai Art knowledge base — MYCO's knowledge layer

This folder is **ours**. Everything in `proprietary/` is Fungai Art's own
knowledge: house protocols, extraction methods as we run them, formula
reasoning, lab observations, SOPs, quality-control practice.

MYCO reads it, but always labels it as *our own practice* — never as
published science. That separation is the point:

| Source                                  | How MYCO labels it        |
|-----------------------------------------|---------------------------|
| `knowledge/proprietary/*.md`            | our own practice          |
| `public/home/markdowns all plants/*.md` | evidence / tradition / safety, per section |
| `src/data/herbs.ts` (the 198)           | same, per field           |

## Adding knowledge

1. Create or edit a `.md` file in `proprietary/`.
2. Start with `# Title`, then split the content into `## Section` headings —
   each section becomes one retrievable chunk, so give each a heading that
   says what it holds ("Chaga dual extraction", not "Notes").
3. Run `npm run build:myco-kb`.
4. Commit both the `.md` and the regenerated
   `src/server/myco/kb.generated.cjs`.

Write plainly and concretely. Ratios, temperatures, timings, what went
wrong, what you changed. MYCO quotes this back with the file as the
source, so anything vague here becomes a vague answer.

## What not to put here

- **Anything you would not want quoted to a member or customer.** MYCO can
  cite any of it in an answer. Genuinely private records belong in a
  separate, non-indexed place.
- **Medical claims or dosing for conditions.** The safety rails refuse
  those regardless of what the knowledge base says.
- **Someone else's copyrighted text.** Summarise it in your own words and
  name the source instead.

## Structure to grow into

The folder starts small on purpose. The fuller shape, as you write it:

- `extraction-methods.md` — how we extract, per method *(seeded)*
- `house-protocols.md` — our own working protocols *(seeded, needs you)*
- `formulations.md` — house formulas and why they are built that way
- `lab-observations.md` — what actually happened, batch by batch
- `quality-control.md` — what we check, what we reject
- `foraging-practice.md` — how we harvest, where, when, what we leave
- `glossary.md` — our terms, defined once
