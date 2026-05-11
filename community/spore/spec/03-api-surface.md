# 03 · API Surface

Most reads happen via `supabase-js` directly (with RLS). Writes go through **Next.js Server Actions** so balance logic is enforced server-side.

## Server Actions (writes)

All return `{ ok: true, data } | { ok: false, error }`. All require an authenticated session (`auth.uid()`).

### Economy

```ts
// Submit a contribution for review. Does NOT credit yet.
submitContribution({
  contributionTypeId: string,
  nodeId: string,
  evidenceUrl?: string,
  notes?: string,
}) → { contributionId }

// Steward/admin approves a contribution.
// Writes wallet_entry (delta = +earn_h), bumps wallets.balance_h,
// bumps profiles.reputation_points, recomputes reputation_tier.
approveContribution({ contributionId }) → { newBalance, newRep }

rejectContribution({ contributionId, reason }) → { ok }

// Self-service quick earn (for low-trust contributions auto-approved).
// Only callable for contribution_types with requires_approval=false.
quickEarn({ contributionTypeId, nodeId }) → { newBalance }
```

### Apothecary

```ts
// Pay for a product in $H. Validates balance, writes ledger, creates order.
buyProductWithH({ productId, shippingAddress }) → { orderId }

// Start a Stripe Checkout session for € payment.
createProductCheckout({ productId, shippingAddress }) → { checkoutUrl }

// Stripe webhook → marks order paid.
// (Not a server action — Route Handler at /api/webhooks/stripe)
```

### Experiences

```ts
// Spend $H to unlock token-gated access to an experience.
// Validates balance + reputation, writes ledger, creates experience_unlock row.
unlockExperience({ experienceId }) → { unlockId }

// Reserve a seat. Requires unlock if experience is gated.
bookExperience({
  experienceId,
  paymentMethod: 'eur' | 'hyphae' | 'unlock',
}) → { bookingId, checkoutUrl? }
```

### Profile

```ts
updateProfile({ handle?, bio?, avatarUrl?, homeNodeId? }) → { ok }
uploadAvatar(file: File) → { url }   // wraps Supabase Storage
```

### Admin / Steward (role-gated)

```ts
createNode({ ... }) → { id }
updateNode({ id, ... }) → { ok }
createProduct({ ... }) → { id }
createExperience({ ... }) → { id }
createBatch({ productId, specimenId, yieldUnits }) → { serial }
adjustWallet({ profileId, deltaH, reason }) → { newBalance }  // audit-logged
```

## Public reads (supabase-js, RLS-gated)

```ts
// Network page
supabase.from('nodes').select('*, contribution_types(*)').order('region')

// Apothecary
supabase.from('products').select('*').eq('active', true)

// Experiences
supabase.from('experiences')
  .select('*, node:nodes(name), unlocks:experience_unlocks(profile_id)')
  .gte('starts_at', new Date().toISOString())

// Economy / wallet (self)
supabase.from('wallets').select('*').eq('profile_id', user.id).single()
supabase.from('wallet_entries')
  .select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(30)

// Specimen catalog
supabase.from('specimens').select('*, node:nodes(name), forager:profiles(handle, avatar_url)')

// Provenance for a product
supabase.from('batches').select('*, specimen:specimens(*)').eq('product_id', id)
```

## Realtime (optional, v1.1)

Subscribe to `wallet_entries` for the logged-in user → live "+40 $H · Kitchen help" toast when a steward approves their contribution from elsewhere.

```ts
supabase.channel('wallet')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'wallet_entries',
    filter: `profile_id=eq.${user.id}`,
  }, payload => toast(`+${payload.new.delta_h} $H · ${payload.new.label}`))
  .subscribe()
```

## Webhooks

| route | source | purpose |
|---|---|---|
| `POST /api/webhooks/stripe` | Stripe | Mark orders/bookings paid, send confirmation email |
| `POST /api/cron/seat-release` | Vercel Cron | Release no-show seats 24h after experience ends |
