# Age architecture (FYF)

Round 2 · Item #0 · finalised 2026-09-12.

## The rule

**The age question inside the quiz is the canonical age input.** The
server derives every downstream age-dependent behaviour from
`profile.age` alone — never from a separate client-provided flag.

There is no second checkbox, no duplicate confirmation, no additional
UX friction. The entry gate is GDPR consent only; the age answer +
this server-side derivation is the single source of truth for minor
eligibility inside the Formula Engine.

## The trust boundary

The client is untrusted. A modified frontend could:
- omit `_minor` from the payload
- flip `_minor: false` while still answering `age: 'under_18'`
- send `age: 'under_18'` alongside `avoid: ['none']` (no other flags)

None of these lie their way past the server. The engine reads
`profile.age === 'under_18'` at the top of `compileFormula` and
`composeFormulaWithMyco` and stamps `profileForEngine._minor`
accordingly. The picker + validator + candidate-set builder all read
from that server-derived value.

The client's earlier "amend avoid[] with sedatives/psych_meds/
contraceptive when age = under_18" is now optional defence-in-depth,
not the primary gate. If the client did nothing at all, the server
still delivers a minor-safe formula.

## Downstream effects when `profile.age === 'under_18'`

Applied automatically by `src/server/formula-engine/safety.js`
`applyMinorGate()`:
- gated herbs (Amanita muscaria etc) — excluded
- herbs flagged `sedatives` in the derived axes — excluded
- herbs flagged `psych_meds` — excluded
- herbs flagged `contraceptive` — excluded
- strong GABAergic herbs (valerian, hops, magnolia, blue lotus, …) — excluded
- strong CNS stimulants (ginseng, cordyceps, rhodiola, guarana, …) — excluded

Also stamped on the reservation email so Robin sees the flag and can
personally confirm before shipping.

## Age answer values (canonical enum)

Defined once in `public/find-your-formula/index.html` QUESTIONS
`key: 'age'` options. Server treats these as an opaque enum:

| Value       | Semantic              | `_minor` derived |
|-------------|-----------------------|:----------------:|
| `under_18`  | Under 18              | `true`           |
| `under_25`  | 18–25                 | `false`          |
| `25_40`     | 25–40                 | `false`          |
| `41_60`     | 41–60                 | `false`          |
| `60_plus`   | 60+                   | `false`          |
| _(missing)_ | not answered          | `false`          |

Anything unknown → treated as adult (fail-open would be worse for the
non-minor path; a hostile client sending `age: 'skynet_1'` gets an
adult formula, which is safe — the risk is only for the minor path,
where the strict `=== 'under_18'` check ensures a hostile client that
DOES want a minor blend must own that choice explicitly).

## What is NOT enforced here

- **Actual age verification.** The engine has no way to prove the user
  is who they say they are. If a 14-year-old ticks `25_40` they will
  get an adult formula — that's a policy problem, not an engine
  problem. Robin's manual review at reservation is the human gate.
- **Legal age of purchase / consent.** Handled at the entry gate (GDPR
  consent) and jurisdictionally at fulfilment. Out of scope for the
  formula engine.
- **Age-related dosing.** Bottle size is validated separately (Item #5).
  Age-appropriate dosing is Robin's call at reservation review.

## Tests

- `tests/minor-gate-verify.cjs` — 14 cases covering the safety gate.
- `tests/age-canonical-verify.cjs` — proves the server IGNORES a
  client-supplied `_minor` and derives from `profile.age` instead.

## Related commits

- `2144cd4` — original minor gate (Round 1)
- (this commit) — canonical age model + server-derived `_minor`
