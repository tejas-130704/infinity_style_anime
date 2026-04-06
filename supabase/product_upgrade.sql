-- =============================================================================
-- Mugen Drip — Product System Upgrade
-- Run once in Supabase SQL Editor.
-- Additive: adds columns, fixes category constraint, upgrades cart_items.
-- =============================================================================

-- ── 1. Fix product category constraint ───────────────────────────────────────
-- Drop old constraint (has '3d_models', 'custom_designs')
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;

-- Add new constraint with all current categories
ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
  CHECK (category IN (
    'posters',
    'action_figures',
    'limited_edition',
    'custom_action_figure',
    'personalized_posters',
    '3d_models',
    'custom_designs'
  ));

-- ── 2. New product columns (additive — safe to re-run) ──────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price  integer       CHECK (original_price >= 0),
  ADD COLUMN IF NOT EXISTS extra_images    text,          -- JSON array of image URL strings
  ADD COLUMN IF NOT EXISTS model_name      text,
  ADD COLUMN IF NOT EXISTS color           text,          -- comma-separated: "Red,Blue,Black"
  ADD COLUMN IF NOT EXISTS is_multi_color  boolean       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS height_cm       numeric(8,2),
  ADD COLUMN IF NOT EXISTS weight_g        numeric(10,2),
  ADD COLUMN IF NOT EXISTS sizes           text,          -- JSON array: ["A4","A3","A2"]
  ADD COLUMN IF NOT EXISTS rating          numeric(3,2)  CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS rating_count    integer       CHECK (rating_count >= 0);

-- ── 3. Cart items — variant support ─────────────────────────────────────────
-- Add selected_variant column
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS selected_variant jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Drop old simple unique constraint
ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Re-add as variant-aware unique constraint
-- Two rows with same product but different variants are distinct cart items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cart_items_user_product_variant_key'
  ) THEN
    ALTER TABLE public.cart_items
      ADD CONSTRAINT cart_items_user_product_variant_key
      UNIQUE (user_id, product_id, selected_variant);
  END IF;
END $$;

-- ── 4. Update GET cart query to return selected_variant ──────────────────────
-- (No SQL needed — the API code will select it)

-- ── 5. Verify ────────────────────────────────────────────────────────────────
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'products'
  AND column_name  IN (
    'original_price','extra_images','model_name',
    'color','is_multi_color','height_cm','weight_g',
    'sizes','rating','rating_count'
  )
ORDER BY column_name;
