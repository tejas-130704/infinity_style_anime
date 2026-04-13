-- Products: optional metadata used by admin + PDP (matches app/api/products and product_upgrade.sql).
-- Run via Supabase migrations or paste in SQL Editor. Safe to re-run (IF NOT EXISTS).
-- Fixes: "Could not find the 'color' column of 'products' in the schema cache"

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price INTEGER,
  ADD COLUMN IF NOT EXISTS extra_images TEXT,
  ADD COLUMN IF NOT EXISTS model_name TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS is_multi_color BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS weight_g NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS sizes TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(4, 2),
  ADD COLUMN IF NOT EXISTS rating_count INTEGER;

UPDATE public.products SET is_multi_color = COALESCE(is_multi_color, false);

ALTER TABLE public.products
  ALTER COLUMN is_multi_color SET DEFAULT false;

COMMENT ON COLUMN public.products.color IS 'Optional comma-separated colour names for variants';
COMMENT ON COLUMN public.products.sizes IS 'Optional JSON array of poster sizes, e.g. ["A4","A3"]';
