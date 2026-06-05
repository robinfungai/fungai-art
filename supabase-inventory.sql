-- ════════════════════════════════════════════════════════════════
-- inventory — live "in stock" list editable from the spore admin panel
--
-- One row per herb id that's currently stocked in the apothecary.
-- /herbal-engine-2 reads this on load and uses it as the "In stock"
-- pool (replaces the hardcoded european-folk + damiana + schizandra
-- list). Robin + Stephanie are the only ones who can write.
--
-- Why a row per herb (not a single JSONB blob): atomic toggles, no
-- last-write-wins races if Robin + Stephanie edit simultaneously,
-- and we get a free updated_at + updated_by audit trail per herb.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query →
-- paste this file → Run.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.inventory (
  herb_id      text PRIMARY KEY,
  in_stock     boolean NOT NULL DEFAULT true,
  note         text,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Trigger keeps updated_at honest on every change
CREATE OR REPLACE FUNCTION public.inventory_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_updated_at ON public.inventory;
CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.inventory_touch_updated_at();

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- ── Policies ────────────────────────────────────────────────────

-- Anyone can read the inventory. Herbal Engine uses this for the
-- "In stock" pool, members see what's available, visitors can browse.
DROP POLICY IF EXISTS "inventory_select_public" ON public.inventory;
CREATE POLICY "inventory_select_public"
  ON public.inventory FOR SELECT
  USING (true);

-- Only admins can insert / update / delete. The check looks at the
-- caller's own profiles row — same gate used by get_member_emails().
DROP POLICY IF EXISTS "inventory_insert_admin" ON public.inventory;
CREATE POLICY "inventory_insert_admin"
  ON public.inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND admin = true)
  );

DROP POLICY IF EXISTS "inventory_update_admin" ON public.inventory;
CREATE POLICY "inventory_update_admin"
  ON public.inventory FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND admin = true)
  );

DROP POLICY IF EXISTS "inventory_delete_admin" ON public.inventory;
CREATE POLICY "inventory_delete_admin"
  ON public.inventory FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND admin = true)
  );

GRANT SELECT ON public.inventory TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inventory TO authenticated;

-- ── Convenience: seed the table with the previous hardcoded default
-- (European folk + damiana + schizandra). Optional — admins can edit
-- via the UI from here. Remove this block if you'd rather start empty.
INSERT INTO public.inventory (herb_id, in_stock) VALUES
  ('bilberry', true), ('angelica_dong_quai', true), ('aronia_berry', true),
  ('ashwagandha', true), ('bacopa', true), ('barberry', true),
  ('barley', true), ('black_cumin', true), ('blueberry', true),
  ('burdock', true), ('butcher_s_broom', true), ('calamus', true),
  ('calendula', true), ('caraway', true), ('cardamom', true),
  ('chamomile', true), ('chickweed', true), ('cinnamon', true),
  ('cloves', true), ('cranberry', true), ('damiana', true),
  ('dandelion_root', true), ('devil_s_claw', true), ('echinacea', true),
  ('elderberry', true), ('elderflower', true), ('eyebright', true),
  ('fennel', true), ('garlic', true), ('ginger', true),
  ('ginkgo', true), ('ginseng', true), ('goldenrod', true),
  ('hawthorn', true), ('holy_basil_tulsi', true), ('hops', true),
  ('horsetail', true), ('jasmine', true), ('lady_s_mantle', true),
  ('lavender', true), ('lemon_balm', true), ('licorice_root', true),
  ('linden', true), ('lingonberry', true), ('lobelia', true),
  ('meadowsweet', true), ('milk_thistle', true), ('motherwort', true),
  ('mugwort', true), ('mullein', true), ('nettle_leaf', true),
  ('oatstraw', true), ('oregano', true), ('passionflower', true),
  ('peppermint', true), ('pine_pollen', true),
  ('raspberry_leaf', true), ('red_dates', true), ('rhodiola', true),
  ('rose_petals', true), ('rosehip', true), ('rosemary', true),
  ('saffron', true), ('sage', true), ('schisandra_five_flavour_fruit', true),
  ('skullcap', true), ('spirulina', true), ('star_anise', true),
  ('thyme', true), ('valerian', true), ('vanilla', true),
  ('vervain', true), ('vitex_chaste_tree', true), ('willow_bark', true),
  ('wormwood', true), ('yarrow', true), ('yellow_dock_root', true)
ON CONFLICT (herb_id) DO NOTHING;
