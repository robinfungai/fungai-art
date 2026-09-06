-- ════════════════════════════════════════════════════════════════
-- product_inventory — live stock count per /shop product
--
-- One row per product. stock_count is 0–20 (Robin's chosen ceiling
-- for hand-made small-batch inventory). 0 = sold out; the /shop
-- public page hides or "Sold out"s these. >0 displays "N in stock".
--
-- Why a separate table from `inventory` (the apothecary herb shelf):
--   • Different semantics — herbs are a boolean "stocked or not",
--     products carry an actual count.
--   • Different write authority is fine the same (admins only) but
--     different read consumers (/shop vs /herbal-engine-2).
--   • Different write cadence — herbs flip many times a week, product
--     counts move on every order/restock.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_inventory (
  product_id   text PRIMARY KEY,           -- matches the addToCart('Name', …) string in /shop
  stock_count  int  NOT NULL DEFAULT 0 CHECK (stock_count >= 0 AND stock_count <= 20),
  note         text,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- updated_at trigger (mirrors inventory)
CREATE OR REPLACE FUNCTION public.product_inventory_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_inventory_updated_at ON public.product_inventory;
CREATE TRIGGER product_inventory_updated_at
  BEFORE UPDATE ON public.product_inventory
  FOR EACH ROW EXECUTE FUNCTION public.product_inventory_touch_updated_at();

ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

-- ── Policies ─────────────────────────────────────────────────────
-- Anyone reads: /shop is public and needs counts to render badges.
DROP POLICY IF EXISTS "product_inventory_select_public" ON public.product_inventory;
CREATE POLICY "product_inventory_select_public"
  ON public.product_inventory FOR SELECT
  USING (true);

-- Only admins write. Identical gate to inventory + get_member_emails.
DROP POLICY IF EXISTS "product_inventory_insert_admin" ON public.product_inventory;
CREATE POLICY "product_inventory_insert_admin"
  ON public.product_inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "product_inventory_update_admin" ON public.product_inventory;
CREATE POLICY "product_inventory_update_admin"
  ON public.product_inventory FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "product_inventory_delete_admin" ON public.product_inventory;
CREATE POLICY "product_inventory_delete_admin"
  ON public.product_inventory FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

GRANT SELECT ON public.product_inventory TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_inventory TO authenticated;

-- ── Seed: every product currently shown on /shop, starting at 5.
--    Names MUST match the first argument of addToCart('Name', price)
--    in public/shop/index.html. If a name changes there, also bump
--    the seed here or insert a new row from the admin panel.
INSERT INTO public.product_inventory (product_id, stock_count) VALUES
  ('ADHD Support',                       5),
  ('Afghan Saffron (',                   5),
  ('Amanita Muscaria',                   5),
  ('Blue Lotus (dried 100g)',            5),
  ('Butterfly Pea (dried 100g)',         5),
  ('Chaga Syrup',                        5),
  ('Chaga Extract',                     5),
  ('Healthy Aging',                      5),
  ('Horny Goat Weed (dried 100g)',       5),
  ('Kumbaya Herbal Smoke Blend',         5),
  ('Lucid',                              5),
  ('Mineral Tonic',                      5),
  ('Moon Support',                       5),
  ('Pine Cones',                         5),
  ('Reishi Extract',                    5),
  ('Ruby No.7',                          5),
  ('Sacred Lavendula (foraged 50g)',     5),
  ('Shilajit + Gold',                    5),
  ('Temple Nectar',                      5),
  ('Wild Cordyceps',                     5)
ON CONFLICT (product_id) DO NOTHING;
