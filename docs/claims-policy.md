# Claims policy — Fungai Art

**This is the rulebook for everything a customer can read**: the shop,
the home page, product labels, the formula reading, MYCO, the academy,
the newsletter, Instagram captions, and anything Robin says in a DM.

Run `npm run check:claims` before shipping copy. It reads the site the
way a regulator would.

---

## The principle

> A product becomes a **medicinal product** because of what it is
> *presented* as doing — not because you used the word "medicine".

EU law (Directive 2001/83/EC, Art. 1(2)) treats something as a medicinal
product either **by presentation** (offered as treating or preventing
disease) or **by function** (it pharmacologically does so). Presentation
is judged on the whole picture: the product name, the label, the website,
the advertising, testimonials, the dosage instructions, the FAQ — and
what our AI says.

So "we never claim to cure anything" is not a compliance strategy. The
strategy is: **decide the legal category for each product first, then
speak only within what that category permits.**

Related: [product-categories.md](product-categories.md) — the per-product
category assessment. This file governs the *words*.

---

## Never, anywhere

These make a product medicinal by presentation. No exceptions, no
hedging, no "traditionally said to".

- cures · treats · heals · remedies · reverses · eliminates a named condition
- prevents / protects against / wards off a named disease
- kills cancer, viruses, bacteria, parasites, candida
- replaces, or is an alternative to, medication, antibiotics, HRT, the pill
- diagnoses ("you have adrenal fatigue", "this is your cortisol problem")
- detoxifies / cleanses / flushes the liver, kidneys, blood or colon
- boosts the immune system, boosts metabolism
- clinically proven · scientifically proven · guaranteed results
- a dose tied to a condition ("30 drops for anxiety")

**Hedging does not help.** "May help treat anxiety", "traditionally used
to cure insomnia" and "supports the treatment of depression" are all
treatment claims. The disease word next to the product is the problem.

---

## Never in a product name

A product named after a condition is offered for that condition, and
"Support" does not neutralise it — it is the clearest presentation signal
a regulator has. This applies to the name, the URL, the page title, the
cart entry and the label.

**Currently breaching: "ADHD Support".** See the migration note at the
bottom of this file.

Name products for the plants, the character, or the moment — never for
the diagnosis. `Lucid`, `Temple Nectar`, `Sleepy Sleepy`, `Nervous System
Tonic` are all fine: none names a disease.

---

## What we can say instead

Permitted language describes **the plants, the tradition, the craft, and
the experience** — not a disease outcome.

| Instead of | Say |
|---|---|
| "treats anxiety" | "a traditional calming blend" / "for moments that ask for steadiness" |
| "cures insomnia" | "an evening ritual" / "traditionally taken before sleep" |
| "boosts immunity" | "traditionally taken through the cold months" |
| "detoxifies the liver" | "bitter herbs, traditionally taken before a meal" |
| "treats ADHD" | "for focus and clarity" (no condition named) |
| "reduces inflammation" | "traditionally used where there is heat" |
| "clinically proven to…" | "studied for…" (editorial only, with the source) |

Two framings that stay safe on a product surface:

1. **Traditional-use framing** — "In Ayurvedic practice, ashwagandha root
   has been used as a rasayana for centuries." Reporting a tradition, not
   promising an outcome.
2. **Sensory and ritual framing** — what it tastes like, when you take
   it, what the evening feels like. This is not a health claim at all,
   and it is usually better writing.

**Nutrition and health claims** (Reg. 1924/2006): only claims on the EU
authorised list may be made, in the authorised wording, and only where
the product actually contains the qualifying amount of that nutrient.
Botanical health claims are still "on hold" — treat them as unavailable.
If we ever want one, the wording comes from the register verbatim.

---

## Rules per surface

### Shop, product pages, labels, home page, ads — strictest
Category language and traditional framing only. Every product page keeps
its contraindications section: **safety information is not a claim**, and
naming a condition in a warning ("not with blood thinners", "see a
clinician if insomnia persists beyond three weeks") is correct and stays.

### Find Your Formula
The reading describes the plants chosen and the pattern described — never
a diagnosis or an outcome. This is already enforced in code by
`src/server/formula-engine/narrative-sanitiser.js`, which replaces or
rewrites any medicinal claim before it reaches a customer.

### MYCO
MYCO speaks in the brand's voice, so everything above applies to it, with
three additions:
- It refuses diagnosis and dosing-for-conditions outright (server-side).
- It answers from the knowledge base and labels what kind of knowledge
  each claim is — established evidence, traditional knowledge, our own
  practice, or an inference.
- **It never recommends a product for a condition.** Talking about a
  plant's traditional use is editorial. "Take our X for your Y" is a
  medicinal claim plus a sale.

### Academy and monographs — editorial
Here we may report what the literature and the traditions say, including
disease words, because this is education, not an offer to sell:

> "Clinical trials of curcumin in knee osteoarthritis have reported pain
> scores comparable to ibuprofen (Daily et al., 2016)."

Three rules keep education from becoming a back door:
1. **Attribute everything.** A study, a tradition, or a named source.
2. **Never bridge to a product.** No "…which is why our X contains
   turmeric." No product links inside a condition discussion.
3. **Report, don't promise.** "Has been studied for" — not "will help
   your".

If an editorial page starts to read like a reason to buy something, it
has become advertising and the strict rules apply to it.

### Testimonials and reviews
A customer's claim becomes **our** claim once we publish it. Never publish
a testimonial that names a disease or an outcome ("my depression lifted").
Publish experience instead ("the evening ritual I look forward to").

### Social and the newsletter
Same rules. A caption is advertising.

---

## How this is enforced

| Layer | What it does |
|---|---|
| `npm run check:claims` | scans shop, home, formula, MYCO prompts and editorial pages; **BLOCKER** fails the check |
| `narrative-sanitiser.js` | rewrites or replaces claims in MYCO's formula reading before sending |
| MYCO system prompt | hard refusal list for diagnosis, prescribing, dosing with medication |
| This policy | the human rules for anything a scanner can't judge |

Run the scanner before publishing copy, and after any MYCO prompt change:

```bash
npm run check:claims          # full report
npm run check:claims -- --ci  # non-zero exit if a BLOCKER exists
```

The scanner is a floor, not a ceiling. It catches known phrasings; it
cannot judge whether a page *as a whole* reads as an offer to treat.

---

## Open item: "ADHD Support"

The product name states a medical condition. Options, best first:

1. **Rename.** A name from the plants or the character, with "focus and
   clarity" as the descriptor. Keeps the product, removes the claim.
   Redirect the old URL so links and search results survive.
2. **Withdraw** the product pending a category decision.
3. **Keep it and accept the risk** — not advisable: a condition-named
   product invites the regulator to treat the whole range as medicinal,
   which reaches every product, not just this one.

Not a decision code can make. Until it is made, `check:claims` reports a
BLOCKER, which is the correct state.
