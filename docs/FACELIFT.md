# Portal facelift · The Fairy Ring

**Brief received 2026-09-25.** Saved verbatim as the source of truth for this
work. Branch: `facelift`. Phases and the hard stop are in §6.

> **Note on completeness:** the brief refers to a pasted 21st.dev
> "Radial Orbital Timeline" block and two screenshots. Neither arrived with the
> brief. §3 below describes the reference's behaviour and its six bugs in
> enough detail to work from, so this is not blocking — but the actual source
> and the screenshots should be attached here when available.

---

## The framing

That orbital is already a fairy ring: one center, things fruiting around the
edge, threads running between them. So that became the whole concept. The
portal home turns into a fairy ring with the mycelium sphere breathing in the
middle as The Organism, the sections sitting on the ring, and hyphal threads
streaming between related sections when you tap one. In old folklore, fairy
rings are doorways. For a portal, that felt too perfect to skip.

Two calls made up front, both arguable:

**No shadcn, no Tailwind for one component.** The vite config is a multi-page
setup with its own plugins, and the `globals.css` block the reference ships
starts with a Tailwind import whose reset would quietly restyle every page that
loads it. So the 21st.dev code is a *spec for how the ring behaves*, rebuilt in
this repo's own CSS and type system.

**The snippet has real bugs.** It rerenders the whole ring 20 times a second,
and focusing a node sends the others straight across the circle. The fixes are
spelled out in §3 so they don't get copied along with everything else.

**On names:** only the generic SaaS words are replaced; what is already ours
stays, so Alchemy Academy keeps its name. Admin becomes Root — roots live
underground, and root is the superuser, which every developer will enjoy.
Status chips use grower words. The SPORE framing carries over: mythic skin,
rigorous data. Nothing shows a number that isn't real.

---

## SCOPE GUARD

This is a visual and naming pass. **Do not touch**: auth or session handling,
the Supabase client, the Vite config and pinned port, the key vault and RBAC
migrations, RLS policies, Netlify config, or the MYCO assistant. If something
there seems to need changing, **stop and ask**.

---

## 1 · The idea

A fairy ring is mycelium growing outward from one point and fruiting in a
circle at its living edge. The portal home becomes one.

- **Center — The Organism**, drawn as the brand anchor: the mycelium sphere.
  If the main site's sphere lives in this repo, reuse it *only* if it is light
  enough; otherwise make a lighter SVG or canvas version that reads as the same
  object. Its glow follows HEALTH, its breathing speed follows ACTIVITY.
  Tapping it opens what the NETWORK tab shows today.
- **Ring** — sections sit on it like fruiting bodies. Tilted into a gentle
  ellipse, as if looking down at a real ring in the grass. Nodes at the back
  sit smaller and dimmer.
- **Threads** — focusing a section draws curved hyphal threads to its related
  sections, with cytoplasmic streaming along them at a speed set by FLOW. At
  rest the whole web shows faintly.
- **Decay** — quiet sections lose some glow, busy ones brighten.
- **Motion** — a slow drift, roughly one lap every two minutes. Breathing, not
  spinning.
- **Mythic skin, rigorous data** — every number is real, anything simulated is
  labelled, and if the data does not exist yet the element hides. No
  placeholder numbers that look real.

## 2 · New names (display labels only)

Keep every internal id, route, query and database value exactly as it is. All
labels live in **one config** that the ring, the section nav and the page
headings read from, so renaming happens in one place.

| today | becomes | note |
|---|---|---|
| NETWORK | **The Organism** | the center of the ring |
| MEMBERS | **Hyphae** | who's tending |
| EXPERIENCES | **Fruiting** | ceremonies, dinners, activations |
| CALENDAR | **Almanac** | seasons, harvests, gatherings |
| MEMBERS SHOP | **Larder** | the members shop (alt: Apothecary) |
| ALCHEMY ACADEMY | *unchanged* | ring label: Alchemy |
| ADMIN | **Root** | keepers only |

**Root does not sit on the ring.** For keepers it appears beneath the organism,
underground, joined by one thread.

Status chips instead of complete / in progress / pending:
**Pinning** (coming up) · **In flush** (open or happening now) · **Spored** (past)

In the detail card: "Connected nodes" → **Threads**, "Energy level" → **Pulse**,
action button reads **Step in**.

Each section gets a one-line description in Robin's voice. Two to set the tone:

- **Hyphae** — "Each hypha brings a different thread to the mycelium."
- **Alchemy** — "The devotional practice of meeting the plants and yourself is
  the alchemy."

Draft the rest and list them for Robin to edit.

**On the Hyphae page:**

- Merge "Your identity on this device", "Your thread · linked" and "Signed in ·
  profile syncs everywhere" into one card: **Your spore print** (name, role,
  city, email, sync state). Change email, sign out and delete cloud profile move
  into a small menu on it; delete gets a real confirm step.
- "Your work mode" → **How you tend**
- "My weekly contribution level" → **Tending rhythm**
- "Herbs I work with now" → **On my bench**

## 3 · The reference

The Radial Orbital Timeline from 21st.dev. It arrives with its own integration
instructions (`components/ui` folder, npm installs, a `globals.css` block,
Unsplash images). **Ignore all of that; this brief wins.** Treat the component
as a behaviour spec and a mood board, not a dependency.

**Take:** the orbit math, click-to-focus that rotates the chosen node to the
front, drift pausing while something is focused, related nodes pulsing, the
detail card (status, date, pulse bar, thread links), clicking empty space to
reset.

**Leave:** the shadcn Badge/Button/Card, the Tailwind utility styling, the
`"use client"` line, the black/white/purple look, the fixed 200px radius, the
full-screen height, and above all the `globals.css` block — it opens with a
Tailwind import whose base reset would restyle every page that loads it, then
redefines generic classes like `opacity`, `z-index` and `scale` globally.

**Fix while porting:**

- **a)** It sets React state every 50ms, so the whole ring rerenders 20× a
  second while each node's 700ms transition fights the updates. Run one
  `requestAnimationFrame` loop, keep the angle in a ref, write transforms
  straight to the node elements, and rerender only when focus or pause changes.
- **b)** On focus, nodes glide in straight lines across the circle. Tween the
  angle instead so they travel *around* the ring, the short way.
- **c)** `toggleItem` runs side effects inside a state updater, which React can
  call twice in strict mode. Work out the next state first, then set things.
- **d)** The node ref callback implicitly returns the element. React 19 treats a
  ref callback's return value as its cleanup, and its types reject anything
  else. Use a block body.
- **e)** `isRelatedToActive` uses a truthiness check that breaks for an id of 0.
  Compare to `null`.
- **f)** Nodes are clickable divs. Use real buttons and links.

## 4 · Stack and look

Check how the community page renders and styles today (Vite multi-page app, the
React plugin plus the `compileJsx` and `serveStaticPages` plugins) and build the
ring the same way. **If the page runs on plain modules, port the behaviour to
plain JS rather than mounting React just for this. If Tailwind and shadcn aren't
already in the repo, don't add them. No new animation libraries.**

Colours and spacing come from the existing portal CSS variables. Type stays in
our system (IM Fell English, Spectral, Josefin Sans) mapped the way the site
already maps them, with mono only for live numbers and data.

Less box soup: fewer outlined boxes, more air, let glow and type do the work.
Keep the drifting particles.

Icons: whatever set the repo already uses, plus small custom SVGs for anything
fungal.

Suggested pieces, following the repo's naming conventions: `FairyRing` (stage,
ring, center, threads), `useOrbit` (loop, pause, focus tween, reduced motion),
`DetailCard`, and `portalSections` — the single config (id, label, subtitle, one
liner, icon, link, related ids, required role, live metric).

## 5 · Interaction, access, layout

- First tap on a node focuses it and opens its card. A second tap, or **Step
  in**, goes into the section.
- The ring is a nav landmark with a sensible reading order. Arrow keys move
  around it and bring the focused node to the front, Enter opens, Escape
  closes. Visible focus rings.
- A small pause control for the drift, since anything moving longer than five
  seconds needs one. With reduced motion on: no drift, no tweens, static
  threads. Pause the loop when the tab is hidden or the ring is off screen.
- Radius comes from the stage size via `ResizeObserver`, clamped. **Desktop:**
  the card docks beside the ring instead of floating over other nodes.
  **Mobile:** a smaller ring and the card becomes a bottom sheet. Check at
  **360, 768 and 1440** wide.
- Relations between sections should be true ones (an experience shows up in the
  Almanac, its tickets live in the Larder, and so on). Propose them.
- **Root** renders only for keepers or admins per the new RBAC tiers. Hiding it
  is courtesy; RLS stays the real gate.
- Right now navigation exists three times over (site nav, icon tab row, right
  rail), the member's name shows three times and sign out twice. After this:
  one site bar with one profile menu, the ring on the portal home, and a slim
  rail inside sections that becomes a bottom dock on mobile. **The icon tab row
  goes.**

## 6 · How to work

Branch: `facelift`. At least one commit per phase.

| phase | what |
|---|---|
| **0** | Audit and plan. Where the section labels live, how the page renders and styles, each section's data source, the final naming map, the component plan. **Then stop and wait for go.** |
| **1** | The ring on the portal home with static config, every reference behaviour, all the fixes. |
| **2** | Live data, threads, decay, role awareness. |
| **3** | Names everywhere from the one config, nav consolidation, the spore print card. |
| **4** | Motion polish, mobile, keyboard and screen reader pass, reduced motion, production build check. |

After each phase: say exactly which URL and screen width to look at, update the
handoff docs, and **add nothing to the typecheck backlog**.

Later, only if the engine comes out clean: reuse it inside Almanac as the year
drawn as a circle with gatherings placed by date. Pinning / In flush / Spored
map straight onto the reference's status field.

---

# Phase 0 · Audit

Run 2026-09-25 on branch `facelift`. No code changed. Four things came back
different from what the brief assumes — marked ⚠ — and need a decision before
Phase 1.

## 0.1 · Where the section labels live

**Two hand-synced arrays, plus a heading inside every page component.**

| place | what |
|---|---|
| `spore/app-living.jsx` ~1051 · `TopBar` | `{ id, label, icon }` ×7 — the desktop tab row |
| `spore/app-living.jsx` ~4767 · `QuickNav` | a **second** array — the mobile sidebar |
| each `*Page` component | its own `<h2 className="section-title">` |

`QuickNav` carries a comment saying it is "kept 1:1 in sync with TopBar tabs …
If you add/remove/rename a tab in TopBar, do the same here." That is exactly
the duplication `portalSections` removes.

Ids in use, which must not change: `network · calendar · shop · exp · members ·
academy · admin`.

## 0.2 · How the page renders and styles

Confirms the call to skip shadcn and Tailwind — and sharpens it.

- `public/community/index.html` is **static HTML**, not a Vite entry.
- React 18 is a **UMD global**, vendored locally as of `c992390`. No bundler
  and no module graph on this page.
- Each `.jsx` compiles to a classic script sharing **one global scope**
  (`scripts/build-community.cjs`, esbuild transform only). A build-time guard
  rejects top-level name collisions across the loaded set.
- In dev, the `compileJsx` plugin in `vite.config.ts` compiles `.jsx` on request.
- Styling is `spore/styles-living.css`, 73.8 KB, on CSS custom properties.
- **No Tailwind and no shadcn reach this page.** The reference's `globals.css`
  would have restyled it and eight other static pages.

**So: React, but in the portal's own idiom** — an IIFE declaring nothing
globally, handing back one component on `window`, the pattern `myco/agent.jsx`
and `admin/kanban.jsx` already use. Not an island: islands bundle their own
React and would add a second copy.

## 0.3 · ⚠ The type system is not what the brief says

None of IM Fell English, Spectral or Josefin Sans is in the portal, and the
three together are not one system anywhere in the repo.

| where | fonts |
|---|---|
| **the portal** (`/community`) | Satoshi · Zodiak · Geist Mono — *fontshare* |
| the main site (`/home`) | Cormorant Garamond · DM Sans · Pinyon Script · IM Fell English · Josefin Sans — *Google* |
| `Spectral` | only `/covenant`, `/find-your-formula`, `/herbal-engine-2` |

Portal tokens are `--font-display: Zodiak`, `--font-sans: Satoshi`,
`--font-mono: Geist Mono`. Following the brief literally means **retyping the
portal to the main site**, a bigger change than a facelift, touching all
73.8 KB of portal CSS. **Needs a decision.**

## 0.4 · ⚠ There is no mycelium sphere in this repo

Searched `/home`, `/mycelium`, `/members` and the islands. What exists:

- `public/mycelium-field.js` (191 lines) — the drifting **particle field**
  behind the portal. This is the "keep the drifting particles" of §4, not a
  sphere.
- `spore/network-globe.jsx` + vendored `cobe` — a **WebGL globe of the Earth**,
  used by NetworkPage. A globe, not the brand object.

The Organism has to be **built**, not reused. Probably better — a
purpose-built SVG/canvas will be lighter than anything lifted — but the brief's
"reuse it only if it's light enough" has no subject.

## 0.5 · ⚠ Data source per section — most of it is hardcoded

| section | today's source | real? |
|---|---|---|
| NETWORK | `SporeData.NETWORK_NODES` + cobe globe | ✗ hardcoded |
| MEMBERS | `SporeData.MEMBERS` (12 hardcoded) merged with `profiles` | ◐ hybrid |
| EXPERIENCES | `SporeData.EXPERIENCES` + `economy.state` | ✗ hardcoded + localStorage |
| CALENDAR | `SporeData.EVENTS` + `event_rsvps` | ◐ hybrid |
| MEMBERS SHOP | `EXCLUSIVE` + `product_inventory` | ◐ hybrid |
| ALCHEMY | `lab_notes` | ✓ live |
| ADMIN | `profiles`, `inventory`, `product_inventory`, `board_cards` | ✓ live |

### What this does to "mythic skin, rigorous data"

HEALTH (centre glow), ACTIVITY (breathing speed), FLOW (streaming speed),
decay-glow and Pulse — **none has a data source today.** The economy that would
most naturally drive them is `localStorage` only and forgeable from the console
(`docs/COMMUNITY-AUDIT.md` §5).

By the brief's own rule — *if the data doesn't exist yet the element hides* —
most live metrics hide on day one. One honest number per section is available:

| ring node | honest metric available today |
|---|---|
| Hyphae | claimed `profiles` |
| Almanac | upcoming `event_rsvps` |
| Larder | in-stock lines from `product_inventory` |
| Alchemy | `lab_notes` count |
| Root | open cards in `board_cards` |
| Fruiting | ✗ nothing real — a constant plus localStorage unlocks |
| The Organism | ✗ nothing real — no health or activity signal exists |

## 0.6 · Proposed thread relations

True ones, per §5, based on what actually links in the data:

```
The Organism -- everything (it is the centre)
Hyphae       -- Alchemy    members write the lab notes
             -- Fruiting   members attend
Fruiting     -- Almanac    an experience is dated, so it appears there
             -- Larder     its tickets and goods sell there
Almanac      -- Larder     seasonal stock follows the calendar
Alchemy      -- Larder     what is studied is what is made
Root         -- The Organism only (one thread, underground)
```

## 0.7 · Component plan

Following repo naming, with `admin/kanban.jsx` as precedent:

```
public/community/portal/sections.jsx    portalSections -- THE config
public/community/portal/fairy-ring.jsx  FairyRing + useOrbit + DetailCard
public/community/portal/organism.jsx    The Organism (SVG/canvas)
public/community/portal/fairy-ring.css  own stylesheet, portal tokens only
tests/fairy-ring-verify.cjs             config/label/id agreement + a11y
```

`index.html` loads them before `app-living.js`; `app-living.jsx` picks them up
with the same defensive shim it uses for `MycoAgent` and `AdminKanban`.

One rAF loop, angle in a ref, transforms written straight to nodes — fix (a).
Angle tweened the short way round — (b). Real `<button>` / `<a>` — (f).
`id === null` comparisons — (e). Block-bodied ref callbacks — (d). Next state
computed before side effects — (c).

## 0.8 · Four questions before Phase 1

1. **Type system** (0.3) — retype the portal to the main site's fonts, or keep
   Satoshi/Zodiak/Geist?
2. **The Organism** (0.4) — build a new SVG/canvas object from scratch; confirm.
3. **Live metrics** (0.5) — hide HEALTH/ACTIVITY/FLOW/Pulse until they have
   real sources, or derive something honest from the five counts that exist?
4. **Fruiting** — the only ring node with nothing real behind it. Show it with
   no metric, or leave `SporeData.EXPERIENCES` as static content?
