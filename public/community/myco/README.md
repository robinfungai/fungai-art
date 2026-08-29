# MYCO — Fungai Art embedded intelligence

Own folder because the agent is about to grow: real tool calls, memory,
per-tier persona, formula guidance, ceremony guidance. Splitting it out
of `spore/app-living.jsx` early keeps changes to the agent from touching
the rest of the portal (and vice versa).

## Files

| File            | Purpose                                                 | Loaded as             |
|-----------------|---------------------------------------------------------|-----------------------|
| `agent.jsx`     | UI shell (chat panel, chips, toggle button)             | `<script type=text/babel>` |
| `prompts.js`    | System prompt, MYCO chips, tier personas                | plain `<script>` — exposes `window.MycoPrompts` |
| `context.js`    | Collect currentMember + tab + upcoming events → send with each request | plain `<script>` — exposes `window.MycoContext` |
| `styles-myco.css` | (currently lives in `spore/styles-living.css` under `.myco-*`; will be extracted once we redesign the panel) | via `<link>` in index.html |
| `README.md`     | This file                                               | —                     |

## Loading order

`/community/index.html` loads scripts in this exact order (matters because
Babel-standalone runs each `type="text/babel"` synchronously and later
files reference symbols set up by earlier ones):

1. `supabase-client.js`
2. `spore/data.jsx`
3. `spore/tweaks-panel.jsx`
4. `spore/network-living.jsx`
5. **`myco/prompts.js`** ← plain JS (no babel), sets `window.MycoPrompts`
6. **`myco/context.js`**  ← plain JS, sets `window.MycoContext`
7. **`myco/agent.jsx`**   ← babel, defines global `MycoAgent`
8. `spore/app-living.jsx` (references `MycoAgent`)

## Roadmap

- [x] **v1** — extract into own folder; keep behaviour identical
- [ ] **v1.1** — pass `currentMember`, `tab`, upcoming-events context to the
      Netlify function so MYCO can answer "when's my next event?" from real
      data instead of a static prompt list.
- [ ] **v1.2** — per-tier persona (Spore/Palawan = friendly guide, Root Node
      = deep mycelium-lore).
- [ ] **v2**   — streaming replies via SSE (Netlify function supports it).
- [ ] **v2.1** — client tools: read calendar, look up a member by name,
      check the caller's $H balance, list herbs from `member_herbs`.
      Model requests a tool → client executes → sends result back.
      Cheaper than sending the DB in every prompt.
- [ ] **v3**   — long-term memory in a Supabase `myco_memory` table (topic,
      insight, member_id). Recall past exchanges across devices.
      Schema: `supabase-myco-memory.sql`.
- [ ] **v3.1** — **formula guidance** (paid tier only). Given a target
      constituent + extraction method, MYCO proposes ratios + timing.
      Never medical advice — always frame as ceremony / research.
- [ ] **v3.2** — **ceremony guidance**. Pre-ritual arc, dosing frame,
      integration questions. Non-medical, non-clinical language enforced
      by the system prompt hard-refuse list.

## Guardrails already in force

- Origin-locked CORS to `fungai.art` + Netlify preview + localhost.
- Per-IP rate limit (12 msg / min, best-effort in-memory).
- No member roster in the system prompt (was leaking names/balances).
- Anthropic spend cap MUST be set in the Anthropic console — code
  rate-limit is defence in depth, not the ceiling.
- Hard refuse list: no diagnosis, no dosing for medical conditions, no
  substitute for a doctor.
