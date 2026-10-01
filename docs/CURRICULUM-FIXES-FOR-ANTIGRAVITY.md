# Curriculum fixes — brief for Antigravity (1 Oct 2026)

Written by Claude Code after reviewing the 87-question Academy curriculum
(`public/community/academy/curriculum-questions.json` and
`curriculum-preview.html`). Robin wants the curriculum free for everyone, so
it goes live on the next push, once the items below are done.

## 0 · Working in this repo (two agents share the folder)

Claude Code also works in this folder and commits to `main`.

1. **Leave no clutter.** Delete the 0-byte files you created in `scripts/`
   (20 of them, for example `game_level2.py`, `questions_level4.py`,
   `fetch_living_apothecary.py`). Keep ONE generator script, and only if it
   is still needed. Add `__pycache__/` to `.gitignore`.
2. **One copy of the data.** `docs/curriculum-questions-audit.json` and
   `public/community/academy/curriculum-questions.json` are the same file.
   Keep the public one and delete the docs copy (keep the `.md` audit only
   if Robin wants it).
3. **Never commit third-party content.** `docs/living_apothecary_learn_data.json`
   and `.md` are a full copy of another school's curriculum
   (thelivingapothecary.life). The GitHub repo is public. Delete both files,
   or move them outside the repo.
4. **Don't edit files outside your task** without saying so. If you change
   a file Claude Code also edits (`public/community/academy/index.html`),
   list the exact lines in your summary to Robin.
5. **No `git add -A` / `git commit -a`.** Robin commits. Tell him which
   files are yours.
6. **End every task with a list:** files created, files changed, files
   deleted.

## 1 · Level names

The five level names (Seed, Root, Leaf, Flower, Apothecary) are the other
school's. Robin will choose new ones. Make them one constant at the top of
the generator, so renaming is a one-line change. Lesson and module titles are
mostly your own already; replace the 9 lesson titles and 4 module titles that
are still word-for-word theirs.

## 2 · The answers give themselves away

- **The right answer is the longest option in 61 of 87 questions.** Make
  every option in a question about the same length. Make the right answer
  the longest in no more than about a quarter of the questions.
- **Wrong answers are jokes in 42 questions.** A wrong option should be a
  real misconception a beginner might hold, not an absurdity. Don't use
  absolute words in wrong options: zero, completely, permanently,
  exclusively, universally, instantly, "within minutes".

Rewrite the wrong options in these questions (the joke is quoted):

| # | Joke option(s) |
|---|---|
| 2 | "supernatural energies", "universally rejected by the digestive tract" |
| 3 | "numbed the throat so they could chew evergreen needles" |
| 11 | "permanently shuts down stomach acid", "freezes gut bacteria", "natural carbonation" |
| 12 | "by over 300%", "fizzy gas bubbles" |
| 15 | "absorb harmful radiation from indoor lights" |
| 21 | "stinging hairs contain natural sugars", "pectin gels cold water into salves" |
| 22 | "regulators legally restrict students", "one botanical family per calendar year" |
| 24 | "daily morning sunlight to sterilize the liquid" |
| 25 | "intense stimulant like caffeine", "purely ornamental", "rapid blood clotting" |
| 26 | "dreams turn black-and-white", "cravings for pickled foods", "numbs taste buds" |
| 27 | "instant burst of caffeine", "numb brain pain receptors" |
| 29 | "like three espresso shots" |
| 32 | "turn it into inert water" |
| 33 | "ferment into vinegar within minutes", "only releases its constituents with ice cubes" |
| 34 | "turns the skin bright yellow", "prevents all protein from being digested" |
| 35 | "works only as a placebo", "absorbed exclusively through the mouth", "freezes stomach acid into a gel" |
| 37 | "three consecutive hours outdoors in cold air" |
| 38 | "complete absence of any thoughts or dreams", "hunger pangs" |
| 45 | "ninety consecutive days of accumulation in liver tissue", "until the uterine lining sheds three times" |
| 50 | "exclusively in the middle of summer" |
| 52 | "traps bacteria permanently", "turns off the respiratory centre", "a physical heat shield" |
| 55 | "permanently binds to all pharmaceutical drugs", "shuts off antibody production within 48 hours" |
| 58 | "turns into a different plant species depending on soil pH" |
| 60 | "dissolve calcified plaques within forty-eight hours", "no measurable influence" |
| 61 | "citrus turns berberine toxic", "displaces minerals from the thyroid" |
| 62 | "contract violently", "metabolizes alcohol into inert glucose" |
| 66 | "lose all binding capacity once age exceeds sixty-five" |
| 68 | "electromagnetic vibrational alignment", "rubbing tincture into an open scratch" |
| 70 | "zero measurable neurotransmitter activity", "within several days" |
| 71 | "strictly sealed within musculoskeletal joints" |
| 73 | "genetic blood groupings" |
| 75 | "enter circulating red blood cells" |
| 76 | "until all natural yellow pigment vanishes", "cold carbonated mineral water" |
| 78 | "safe plants will taste sweet" — dangerous even as a wrong answer; replace it |
| 79 | "reserves unmonitored by rangers", "double the water to dilute" |

## 3 · Facts to fix in the RIGHT answers and explanations

| # | Problem | Fix |
|---|---|---|
| 3 | Vikings and Nordic travellers taking Rhodiola on winter treks is popular lore, not documented history. "Caffeine crash" is anachronistic. | "In Nordic and Siberian folk medicine Rhodiola was taken against fatigue and cold…" |
| 6 | The "bitter reflex" (TAS2R → vagal cephalic response) is a working hypothesis, not settled fact. | Say "is thought to"; badge it `[TRADITIONAL]` + `[MECHANISTIC]`, not proven. |
| 21 | "Easily absorbed iron": nettle iron is non-heme and poorly absorbed. | "rich in minerals (iron, calcium, silica) and protein". |
| 26 | "About 10% of people" has no source. | Drop the number: "in some people". |
| 35 | Aspirin was not derived from meadowsweet. Salicylic acid was first isolated from it, and the name "aspirin" comes from *Spiraea*. | Reword the stem. |
| 42 | Typo: "Call emergency emergency medical services". | Remove the second "emergency". |
| 46 | The explanation says hot-flush relief is "supported by clinical trials". It rests on one small open-label trial. | "traditional use, with one small open trial". |
| 47 | The Rotterdam criteria need TWO of the three. The answer says "or". | "at least two of: …". |
| 50 | "Before viruses penetrate host respiratory cells" is an in-vitro mechanism stated as fact. | "Taken early, at the first symptoms (small trials)". |
| 54 | The tingle "proves" quality: it signals alkylamides, it is not proof. | "is a sign of alkylamide content". |
| 68 | **"Fungai Art's body-first drop test" is invented. No such house method exists.** | Ask Robin, or remove the question. Never invent Fungai Art practices. |
| 84 | By a Swedish stream, the deadly plant is water hemlock (*Cicuta virosa*, sprängört), more than poison hemlock (*Conium*). | Name *Cicuta virosa*, or move the scene away from water. |

## 4 · Evidence badges

`[HUMAN EVIDENCE]` means a human trial or an official monograph. Give each
such question one PubMed ID or monograph in its explanation (EMA/HMPC,
Cochrane). If you have none, change the badge to `[TRADITIONAL]` or
`[MECHANISTIC]`. Never invent a PMID. Robin's rule is that every PMID is
checked on PubMed before it is written.

## 5 · Herbs outside the catalogue

The curriculum teaches Marshmallow, Cramp Bark and Elecampane. They are not
in Fungai Art's herb database yet. Claude Code has queued them for MYCO's
monthly digest (`src/server/myco/catalogue-requests.cjs`) — **no action
needed from you.** "Berberine" (#61) is a compound, not a herb. Label the
question "Barberry / Goldenseal (berberine)".
