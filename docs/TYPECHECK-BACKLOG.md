# Typecheck backlog

**Captured 2026-09-24.** Written for whoever picks this up cold — probably
Robin in a few days, having forgotten all of it.

Start here:

```bash
npx tsc --noEmit -p tsconfig.app.json
```

**Not `tsconfig.json`.** That one is solution-style (`"files": []` plus
project references) and typechecks *nothing* — it exits 0 no matter how
broken the code is. A stray `{` in `herbs.ts` once passed it as clean.
Always use `tsconfig.app.json`.

Current count: **47 errors.** Down from 55; the 8 that went were fixed in
commit `e37793a`.

**None of the 47 are bugs.** They split into exactly two piles, and each
pile needs one decision rather than 47 fixes.

---

## Pile 1 — four dead page files · 33 errors

| file | errors |
|---|---|
| `src/pages/myceliumtranx.tsx` | 16 |
| `src/pages/Index.tsx` | 7 |
| `src/pages/Offering.tsx` | 5 |
| `src/pages/MyceliumTrance.tsx` | 5 |

All four are **unreferenced anywhere in `src/`**. Only three pages are
imported by `src/main.tsx`: `Home`, `Products`, `CommunityPortal`.

Verify before deleting:

```bash
for f in Index myceliumtranx MyceliumTrance Offering; do
  printf "%-16s " "$f"
  grep -rlE "pages/$f\b" src/ --include=*.tsx --include=*.ts | grep -v "pages/$f.tsx"
  echo
done
```

Empty output for all four = still dead = safe to delete.

Deleting them takes 47 → 14 in one command. **One thing to look at first:**
`myceliumtranx.tsx` and `MyceliumTrance.tsx` look like an old lowercase
duplicate pair. Check whether either holds work worth keeping before both
go — one of them may be the newer draft.

## Pile 2 — the `@/*` paths mapping · 14 errors

`src/pages/Home.tsx` (6) and `src/pages/Products.tsx` (8), all variations of:

```
error TS2307: Cannot find module '@/components/Navigation'
```

**These are not code faults.** `src/components/` exists, the `@` alias is
configured in `vite.config.ts` (line ~103), and the site builds and runs.
The gap is that `tsconfig.app.json` sets `baseUrl` but never sets `paths`,
so vite resolves `@/...` and tsc does not.

### Do not just add the mapping

Tested it. Adding

```json
"paths": { "@/*": ["./src/*"] }
```

moves the count 55 → 54. It trades the 28 module errors for ~26
*previously hidden* errors inside these components:

- `SacredOfferingsSection.tsx` (5)
- `FeaturedProducts.tsx` (5)
- `OrganicContactSection.tsx` (3)
- `Navigation.tsx` (2)
- `StripeCheckoutModal.tsx` (2)
- `FlowingAboutSection.tsx` (2)
- `hooks/use-toast.ts` (1)

They were hidden because `tsconfig.app.json` also **excludes** them:

```json
"exclude": ["src/components", "src/hooks", "src/stores",
            "src/HerbalEngine.tsx", "src/lib/shopify.ts", "src/islands"]
```

That exclude list is suppressing real problems in components that are
currently shipping on the live site. Opening it up is a proper piece of
work, not a config tweak — worth its own session. The site works today;
this is cleanup, not a fire.

The 2 `TS7006` implicit-any errors in `Products.tsx` are downstream of the
same thing — `state` and `e` can't be inferred while `@/stores/cartStore`
is unresolvable. They fix themselves once the mapping lands.

---

## Recommended order

1. **Delete the four dead files** → 47 → 14. Cheap, low risk, do it first.
2. **Then decide on `src/components`.** Add `paths`, drop the excludes, fix
   the ~26 that surface. Own session.

## One loose thread worth chasing separately

Not a typecheck error — found while fixing one.

`src/pages/CommunityPortal.tsx`, member view: a `totalSec` value was being
computed and read nowhere, which means **the readout that displayed it is
gone from the JSX.** That looks like a UI regression rather than
intentional dead code. There is a comment at the old site carrying the
expression:

```js
accSec(activeBranch) + (isRunning && activeBranch === branch ? sessionSec : 0)
```

Worth opening the member timer view and checking whether a total-time
display should be there.

(Reminder from project notes: `CommunityPortal.tsx` is the **old Hyphaes
localStorage portal**, not Spore. Spore membership lives in
`public/community/`. Still routed in `main.tsx`, so still live.)
