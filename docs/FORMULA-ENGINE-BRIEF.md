# Fungai Art — how the formula maker decides

*Audit brief · engine 2.4.0 · safety rules 1.2.0 · 245 herbs · 2026-09-28*

This document describes, as exactly as the code allows, how fungai.art turns
a person's quiz answers into a herbal extract formula. It is written for an
independent reviewer (human or AI) who has **not** seen the code. Every rule
below names the file it lives in, so each claim can be checked.

**Which code this describes.** Engine **2.4.0** in the repository's `main`
branch as developed locally. The live site at fungai.art only changes when
that branch is deployed. **If you read the code on GitHub, first check
`src/server/formula-engine/version.js`:** the first external audit
(2026-09-28) compared this brief against an older deployed engine (2.2
era) and reported its differences as defects. Many were real defects of
that older code; they are listed, with their status, in
`docs/AUDIT-2026-09-28-RESPONSE.md`.

**A note for AI reviewers:** two earlier audits of this system described
files and functions that do not exist. Please tie every finding to a rule
stated here (or a file path given here), say which rule it concerns, and say
plainly when you are inferring rather than reading. "The engine should…" is
useful; "the engine does X" without a source here is not.

---

## 1 · The site in one page (context)

Fungai Art is a one-person herbal practice in Berlin: a webshop of
hand-made extracts, and a set of tools around a catalogue of **245 plants
and fungi** (`src/data/herbs.ts`, the single source of truth). The parts:

| Area | What it does |
|---|---|
| **Find Your Formula** (`/find-your-formula`) | Consumer quiz, about 10 questions. The server composes a personal 30 ml extract, which the person can reserve. |
| **Pro composer** (`/find-your-formula-pro`) | The same engine with 17 questions. Since 2026-09-28 it is for verified practitioners only and adds practitioner tools (§9). |
| **Formula analysis** (`/api/formula-analysis`) | Checks *any* formula (from Mixology, the pro editor or the formula book) against the engine's own rules. Optionally asks MYCO for a reading. |
| **Mixology** (`/mixology`) | Visitors build their own formulas by hand. |
| **The Atlas** (`/atlas`) | An encyclopedia of all 245 organisms: chemistry, tradition, safety, relationships. |
| **Extraction** (`/extraction`) | The lab bench table of ethanol strengths per herb, at the house ratio of 1:3 (plant : solvent). |
| **MYCO** | The site's AI guide: Claude plus retrieval (BM25) over the catalogue. In the formula maker it may *propose* a formula, but only inside limits the deterministic engine sets (§7). |
| Shop, Moder Jord, community portal, foraging map, academy | Not part of the decision maker; not covered here. |

The decision maker is **server-side only** (`src/server/formula-engine/`).
The browser sends answers and receives a finished formula; it cannot choose
herbs or percentages.

---

## 2 · The pipeline at a glance

```
quiz answers ──► /api/fyf/compose  (netlify/functions/fyf-compose.mjs)
                   │ validate every field against closed lists
                   │ pro request? → verify the caller is a practitioner (§9)
                   ▼
            compileFormula  (index.js)
                   │ 1. safety question must be answered   (safety.js)
                   │ 2. age < 18 is derived server-side     (index.js)
                   │ 3. build the eligible pool             (§4)
                   │ 4. score every eligible herb           (§5)
                   │ 5. walk the ranking under caps         (§6)
                   │ 6. assign percentages                  (§6.3)
                   ▼
            baseline formula ──► MYCO may propose a different one (§7)
                   │              └─ a deterministic validator accepts or rejects it
                   ▼
            final formula ──► stored (fyf_formulas) ──► display strings only on the wire
```

Identical answers always give an identical **baseline** formula: no
randomness, no clock. Ties are broken by evidence grade and then by a hash
of the answers (§6.1). The **final** formula is only guaranteed identical
when MYCO is off or falls back. When MYCO composes (§7), the same answers
can give a different bottle — always one that keeps every rule, but not
always the same one.

---

## 3 · The inputs

### 3.1 Consumer quiz fields
| Field | Values |
|---|---|
| `intention` (goal #1, required) | stress · anxiety · sleep · energy · mood · cognitive (focus) · hormones · digestion · immunity · pain · detox · beauty |
| `intentions` | the ranked goals, up to 3; #1 = `intention` |
| `pattern` (body, required) | hot · cold · mixed · depleted, plus an optional `patternSub` (e.g. anger, cold_hands, overworked) |
| `time` | the hardest time of day: morning · midday · evening · night · any |
| `stress` | how they meet stress: push · collapse · numb · ride · off |
| `duration` | weeks · months · year_plus · lifelong |
| `age` | under_18 · under_25 · 25_40 · 41_60 · 60_plus |
| `sleep` | 4 quality values or 7 pattern values (e.g. hard_onset, wakes_middle) |
| `nervous`, `energy_curve` | nervous-system type; how energy moves through the day |
| `avoid` (required) | the safety question: `["none"]` or any of pregnancy · cardio_meds · psych_meds · autoimmune · liver_kidney · thyroid · hypertension · contraceptive · sedatives · allergy |
| `notes` | free text, up to 1000 characters |

### 3.2 Extra pro-quiz fields
`support` (gentle_daily, noticeable, deep_restore, acute, constitutional,
performance, seasonal, exploring) · `digestion` (strong, bloated, burning,
cold_sluggish, anxious_gut, irregular, constipated) · `emotional` (spacious,
grief_chest, worry_loops, flat, overwhelmed, angry, lonely) · `somatic`
(body areas, several allowed) · `cycle` (not_applicable, regular, pms_heavy,
painful, irregular, absent, perimenopause, post_menopause, trying_conceive)
· `prior_herbs` (several allowed; includes never, bad_reaction,
stimulants_sensitive).

Until engine 2.4 these six were collected and **ignored**. They now count
(§5.3, §4.2).

---

## 4 · Who is allowed in the bottle (filters, in order)

A herb must pass **every** filter below before it can be scored. Filters
exclude outright; nothing downstream can bring a herb back.

### 4.1 Catalogue-level exclusions (`axes.js`, `safety.js`)
1. **Restricted plants** (`RESTRICTED_NAMES`, whole-word match on name +
   botanical name): psilocybe, ayahuasca / banisteriopsis, peyote / San
   Pedro, Salvia divinorum, iboga, kratom, morning glory / LSA, toad venom,
   DMT, coca, Acorus calamus, thunder god vine (*Tripterygium*), comfrey
   (external use only). These are in the encyclopedia, never in a bottle.
2. **Pro-only herbs** (`formula_access: 'pro'`): Ephedra, Yohimbe (both
   prohibited in food in the EU), Fadogia, Lobelia, Pau d'Arco, Wormwood,
   Rhubarb Root, Bakuchi, Nishoth, Karanja. Allowed only in the pro
   composer, and only for a verified practitioner (§9).
3. **Gated herbs** (`GATED_NAMES`): the list is currently **empty** by the
   owner's decision; the Amanitas compete like any other herb for adults.

### 4.2 Person-level exclusions
4. **The safety question** (`safety.js`). A missing or empty `avoid` is
   **rejected** (the formula is never composed). `"none"` combined with any
   other entry is also rejected, and so — since 2026-09-28 — is any value
   that is not one of the ten flags: a misspelt `"pregnacy"` refuses the
   request instead of quietly disappearing. The pages never fill in the
   answer themselves. Each herb carries flags **derived** from its
   contraindication and drug-interaction text (regex, `axes.js`), plus flags
   implied by its recorded nervous-system class (a sedative is flagged
   `sedatives`; a stimulant is flagged hypertension, cardio_meds and
   psych_meds; a psychoactive is flagged psych_meds). A herb is removed if it
   carries any flag the person ticked.
5. **Pregnancy**: only a herb recorded `safe_pregnancy: true` reaches a
   pregnant person; *unknown counts as unsafe*.
6. **Pro answers as safety** (`passesProfileSafety`, since 2026-09-28):
   - cycle `trying_conceive` → the pregnancy rule above;
   - prior_herbs `stimulants_sensitive` → no stimulant or activating herb;
   - prior_herbs `bad_reaction` → nothing at caution HIGH or VERY HIGH.
7. **Time of use** (`pharmacology.js fitsTimeOfUse`): if the hardest time is
   evening or night, or sleep is the first goal, nothing stimulating or
   activating. If sleep is any goal, no true stimulant.
8. **Laxatives** (`fitsGoal`): only when digestion or detox is a goal **and**
   the person reports constipation (the pro digestion answer, or the word in
   their note).
9. **Under-18 gate** (`passesMinorGate`). Minor status is derived by the
   server from `age === 'under_18'`; a client-sent flag is ignored. A minor
   gets:
   - no Amanitas, meadowsweet or willow bark;
   - no sedative, stimulant, activating or psychoactive herb;
   - calming herbs only at caution LOW;
   - nothing at caution HIGH or VERY HIGH;
   - no herb flagged sedatives, psych_meds or contraceptive;
   - no pro-only herb.

**Adults can receive HIGH-caution herbs.** This is a deliberate owner
decision (2026-09-27), not an oversight. Reviewers may still comment on it.

---

## 5 · How each herb is scored (`scoring.js scoreBreakdown`)

Every eligible herb gets a score, a sum of named parts. Only herbs scoring
above 0 are ranked.

### 5.1 The goals — the largest term
Each herb records **which of the 12 goals it serves, main use first**
(`herbs.ts` field `goals`, 1–4 entries, or an empty list when its main use,
such as heart, veins or lipids, is not one of the 12).

| Client's goal | Points if it is the herb's… | main use | 2nd | 3rd | 4th |
|---|---|---|---|---|---|
| goal #1 | | 12 | 9 | 7.5 | 6.48 |
| goal #2 | | 6 | 4.5 | 3.75 | 3.24 |
| goal #3 | | 3 | 2.25 | 1.88 | 1.62 |

The hierarchy is strict: the weakest goal-#1 match (6.48) beats the
strongest goal-#2 match (6), and the weakest #2 (3.24) beats the strongest
#3 (3). This is enforced by `tests/goals-verify.cjs`.

**A herb that serves none of the client's goals keeps only half of its total
score** (all parts × 0.5).

*History:* until 2026-09-28, goals were guessed from words in each herb's
text and only the first three found were kept, in a fixed order that put
digestion, immunity, pain, detox and beauty last. Peppermint had lost
"digestion"; Lion's Mane had lost "focus". The goal was also worth at most 5
points. Measured over 48 synthetic profiles:

| Measure | Before | Now |
|---|---|---|
| Herbs shared between bottles for different goals (same body) | 56% | 3% |
| Herbs in a bottle that serve the chosen goal | 44% | 100% |
| Herbs shared between bottles for the same goal, different bodies | 2% | 18% |

**The 245 goal lists were drafted by Claude from each record's primary
functions and have not yet been reviewed by the owner.** They are the
highest-leverage data in the engine.

### 5.2 Body, rhythm and history (all answers)
| Part | Points | How the match is decided |
|---|---|---|
| Body pattern | +4 (or +2 if the herb's only pattern is "mixed", read as neutral) | patterns inferred from the herb's text and energetics (cooling words → suits "hot", etc.) |
| Time of day | +2 | inferred from the herb's goals (sleep → evening/night, energy → morning…) |
| Stress style | +3 | inferred from text (adaptogen → push/collapse, nervine → off/ride…) |
| Note keywords | +2 per keyword, +4 per phrase, **at most +6 in total** | the word appears in both the note and the herb's text; a curated misspelling table corrects common typos. The note is **not** read by the safety filter — medicines and pregnancy must be answered in the safety question, and both pages say so |
| Sub-pattern | +6 | name matches a hint list (e.g. cold_hands → cinnamon, ginger…) |
| Duration | −2 to +4 | weeks favour fast-acting herbs; a year or more favours tonics |
| Age | −2 to +2 | 60+ favours gentle tonics and penalises stimulants |
| Sleep | −4 to +4 | by sleep pattern (e.g. vivid_restless penalises dream herbs −4) |
| Nervous system | −4 to +3 | e.g. "wired" penalises stimulants −3 and rewards calming +3 |
| Energy curve | −3 to +3 | e.g. "high but unstable" rewards blood-sugar/balancing herbs |

**Note for review:** body pattern, time and stress style are still
**inferred from prose by regular expressions** (`axes.js inferAxes`), the
same class of method that got the goals wrong.

### 5.3 The six pro answers (since engine 2.4)
| Part | Points | Read from |
|---|---|---|
| Digestion | +2 / −2 | the herb's `digestion_fit` tags (bloated → carminative/moving; burning → cooling/demulcent, and warming −2; constipated → moving/demulcent, and astringent −2…) |
| Body area | +2 per matching area, max +4 | the herb's `regional_affinity` |
| Emotional weather | −2 to +2 | goals and regions (e.g. worry_loops → anxiety herbs +2, stimulants −2) |
| Support wanted | −3 to +2 | caution level and onset time (gentle_daily → caution LOW +2, HIGH −3; acute → fast onset +2) |
| Cycle | +2 (+1 more for pain if painful) | hormone-goal herbs |
| Herb history | −3 to +1 | "never taken herbs" → caution LOW +1, HIGH −3 |

---

## 6 · Building the bottle (`picker.js`, `percentages.js`)

### 6.1 Order
Herbs are sorted by score. Ties are broken by (1) evidence grade (A+ best;
ungraded sits mid-table), then (2) a hash of the answers plus the herb's id
(unordered answers such as the safety flags are sorted first, so their
order never matters).
This is deterministic, but it rotates between equally good herbs across
people. Near-duplicates are removed first: two herbs whose first primary
function starts with the same 40 characters count as one.

### 6.2 Size and caps
**Target size:** start at 4. Add 1 each for:
- a note over 80 characters;
- a sub-pattern;
- a duration of a year or more;
- very broken sleep, or under 6 hours;
- two or more safety flags.

A plain, short-term profile gets 3. The result is clamped to 3–7.

Walking down the ranking, a herb is skipped if seating it would break a cap:

| Cap | Limit |
|---|---|
| Same category (adaptogen, nervine, tonic, mover, mushroom, bitter, aromatic, nutritive) | ≤ 2 |
| Trace herbs (potent aromatics: lavender, ginger, cinnamon, peppermint…) | ≤ 1 |
| Sedatives (recorded class `sedative`) | ≤ 2 |
| Stimulating (`stimulant` + `activating`) | ≤ 2 |
| A sedative beside a true stimulant | never |
| Serotonergic (St John's Wort, Kanna, Saffron, Rhodiola) | ≤ 1 |
| Laxatives | ≤ 1 |

If the first walk seats fewer than the target, a **second walk ignores the
category cap only** and keeps every other cap.

### 6.3 Percentages
- Each herb's share is proportional to its score (minimum 1).
- Trace herbs are capped at **5%**; the excess is spread over the others in
  proportion.
- Values are rounded, and any rounding drift is added to the largest herb.
- The bottle is 30 ml at the house strength of 1:3.

### 6.4 Pairings
Each pair of seated herbs is checked against the herbs' own
`herb_to_herb_synergy` and `herb_to_herb_caution` lists (name matching).
Matches are **shown** to the person. **A caution never removes a herb.**

---

## 7 · MYCO's role (`myco.js`, `myco-validator.js`)

1. The deterministic baseline (§4–6) is **always** computed first.
2. The **top 20 eligible herbs** (same filters, same scores) become MYCO's
   shortlist. Each is tagged TRACE, GABA, STIM, STRONG, SERO or LAX, and the
   person's answers are included, pro answers too.
3. MYCO (Claude Opus) returns 5–7 herbs with integer percentages summing to
   100, a one-line reason each, and an overall paragraph.
4. A **deterministic validator** re-checks the proposal and rejects it for
   any of:
   - wrong herb count;
   - a herb outside the shortlist, or a duplicate;
   - percentages outside 1–100, or a rounded sum more than 3 away from
     100 (a drift of up to 3 is **corrected** by adjusting the largest
     herb — so MYCO's percentages can be nudged, not only vetoed);
   - a gated or pro-only herb without entitlement;
   - trace count or trace % over the limit;
   - sedative, stimulant, serotonergic or laxative caps exceeded;
   - a sedative beside a true stimulant;
   - the category cap exceeded.
5. If rejected, or if MYCO is unavailable, the **baseline** is used and the
   reason is logged. The result is never a mix of the two.
6. MYCO's paragraph passes a claims sanitiser before any customer sees it.
   A treatment, cure or diagnosis claim replaces the whole paragraph with a
   safe template; softer phrases are rewritten.

**Note for review:**
- The baseline targets 3–7 herbs, while MYCO is asked for 5–7, so
  MYCO-composed bottles tend to be larger.
- MYCO can only reorder and re-weight within the engine's shortlist; it
  cannot add a herb.

---

## 8 · What leaves the server

The public response carries display strings only: herb name, botanical
name, percentage, a 140-character note, the trace flag, pairings, story and
"why" text, and the version stamps. **Scores, ids and raw herb data are
withheld** to protect the catalogue. The full formula is stored server-side
(`fyf_formulas`), and a reservation reads the stored copy by an opaque id,
so the client cannot alter the formula it reserves.

Abuse limits:
- 8 compose requests per minute per IP (per server instance);
- an allow-list of origins (a request with no origin header still passes);
- a 32 KB body cap.

---

## 9 · The pro composer (since 2026-09-28)

- **Access:** the server honours `_pro` only for a verified practitioner: a
  signed-in member whose rank is Facilitator, Alchemist or Founder, or an
  admin (`src/server/practitioner.mjs`). Other `_pro` requests get **403**.
  Ranks are set only by keepers.
- **Why each herb:** a verified practitioner additionally receives every
  seated herb's named score parts, its goals, evidence grade, caution level,
  nervous-system class and flags. They also get the 12 best eligible herbs
  that were not seated.
- **Adjust:** the practitioner can change percentages, lock, remove, swap
  or add herbs. Every change is re-checked by `/api/formula-analysis`
  against the same caps, and MYCO can be asked to read the adjusted
  formula. **The practitioner's edit is not blocked by a failed check; it is
  shown as failed.**
- **Dose sheet:** ml per herb for a 30, 50 or 100 ml bottle, and each herb's
  extraction arm. Each herb's ethanol strength is shown where its record
  states one. The formula dose is entered by the practitioner; there is no
  house formula dose.
- **Client file:** formulas are saved under a client code with notes, in a
  table readable only by the practitioner who wrote them (row-level
  security). They can be printed or saved as PDF.

---

## 10 · Known weak spots (stated by the owner's side)

1. **Goal lists unreviewed** (§5.1): the most influential data, drafted by
   an AI.
2. **Body pattern, time and stress style are still regex-inferred** (§5.2).
3. **All weights are hand-set** (12/6/3, 4, 3, 2, ×0.5, the position
   weights). They were checked on 48 synthetic profiles, not on outcomes.
4. **One trace herb per bottle** limits aromatic digestive formulas: ginger,
   peppermint, fennel and cinnamon compete for a single slot.
5. **Pair cautions never veto** (§6.4).
6. **The second fill walk ignores the category cap** (§6.2).
7. **Two Amanitas can share a bottle** on rare profiles: both are recorded
   "sedative", and the sedative cap is 2.
8. **Minor status rests on the age answer**, which the person gives.
9. **Rate limits are per server instance and in memory.**
10. **The serotonergic list is short** (4 herbs). Others with weaker
    serotonergic activity (e.g. Lemon Balm, Bobinsana) are not capped.
11. **No cap on one herb's share of the bottle.** Measured over 24,000
    profiles: one herb reaches up to 80% (a 3-herb bottle), and 15% of
    bottles have a herb above 40%.
12. **The number of herbs grows with the number of safety flags** (two or
    more flags add one herb), although flags shrink the pool.
13. **Stored quiz answers are kept indefinitely.** The code comments refer
    to a scheduled cleanup that does not exist.

---

## 11 · Questions for the reviewer

1. Is the goal hierarchy (§5.1) the right shape? Should a herb serving
   goal #2 and #3 together ever outrank one serving only goal #1?
2. Is halving the score of non-goal herbs too harsh or too soft?
3. Which exclusions in §4 are missing? Consider especially drug
   interactions that are not captured by the ten safety flags.
4. Should any pair caution (§6.4) veto rather than warn?
5. Are the caps (§6.2) the right numbers? Should HIGH-caution herbs have a
   cap for adults?
6. Given the regex inference in §5.2, which of those axes most needs
   recorded data?
7. In the MYCO path (§7), is there any way the final formula can break a
   rule the baseline respects?
8. What would you test first with real people, and what outcome would you
   measure?

*Test suite: 39 files, about 240 checks, including 20 fixed profiles whose
formulas are pinned (`tests/fixtures/methodology-pins.cjs`) so any change in
output is visible, and `tests/invariants-verify.cjs`, which turns the rules
in §4 and §6 into checks on 600 random profiles (fixed seed) plus the real
HTTP handler: every sum is 100, every cap holds, every minor, pregnancy and
history rule holds, the same answers give the same bottle, and the order of
the safety flags does not matter.*
