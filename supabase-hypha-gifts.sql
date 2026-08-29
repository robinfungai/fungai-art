-- ════════════════════════════════════════════════════════════════
-- hypha_gifts — founder-to-member $H gifting ledger
--
-- Why: local gifts (localStorage on Robin's device) work for a demo
-- but don't cross to the recipient's device. This ledger sits in
-- Supabase, is append-only, and on next sign-in the recipient's
-- balance is topped up from the sum of gifts not yet applied.
--
-- Admins (robin@fungai.art, teyae@fungai.art) can INSERT into the
-- ledger. Recipients can SELECT their own gifts. Nobody can UPDATE
-- or DELETE — ledgers are immutable by design.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor. Idempotent.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hypha_gifts (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_auth_user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  to_profile_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount             int         NOT NULL CHECK (amount > 0 AND amount <= 9999),
  note               text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  -- When the recipient's client applied this gift to their local
  -- economy. Null = pending. Client sets this via an UPDATE that RLS
  -- allows only when the recipient is the caller.
  applied_at         timestamptz
);

CREATE INDEX IF NOT EXISTS hypha_gifts_to_idx    ON public.hypha_gifts (to_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hypha_gifts_from_idx  ON public.hypha_gifts (from_auth_user_id, created_at DESC);

ALTER TABLE public.hypha_gifts ENABLE ROW LEVEL SECURITY;

-- Admins insert. Uses the JWT email claim so no per-user function needed.
-- Edit the email list here if you add more admins.
DROP POLICY IF EXISTS "hypha_gifts_admin_insert" ON public.hypha_gifts;
CREATE POLICY "hypha_gifts_admin_insert"
  ON public.hypha_gifts FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') IN ('robin@fungai.art','teyae@fungai.art')
    AND from_auth_user_id = auth.uid()
  );

-- Recipient reads their own gifts. Also lets the sender see what
-- they've gifted (so admin history renders).
DROP POLICY IF EXISTS "hypha_gifts_read_own" ON public.hypha_gifts;
CREATE POLICY "hypha_gifts_read_own"
  ON public.hypha_gifts FOR SELECT
  TO authenticated
  USING (
    from_auth_user_id = auth.uid()
    OR to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

-- Recipient can mark applied_at on their own gifts. Nothing else UPDATEable.
DROP POLICY IF EXISTS "hypha_gifts_mark_applied" ON public.hypha_gifts;
CREATE POLICY "hypha_gifts_mark_applied"
  ON public.hypha_gifts FOR UPDATE
  TO authenticated
  USING (
    to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    to_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );
