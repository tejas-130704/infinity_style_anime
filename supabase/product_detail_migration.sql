-- ══════════════════════════════════════════════════════════════════════
-- Mugen Drip — Product Detail Page Schema Migration
-- Run this in Supabase SQL Editor AFTER the base schema.sql has been applied
-- ══════════════════════════════════════════════════════════════════════

-- 1. Extend products table with new fields for the Product Detail Page
-- ─────────────────────────────────────────────────────────────────────

-- Widen the category check to include new types
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
  CHECK (category IN (
    'posters',
    'action_figures',
    'limited_edition',
    'custom_action_figure',
    'personalized_posters'
  ));

-- Action figure / poster metadata
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS model_name       text,           -- e.g. "Tanjiro Kamado Ver.2"
  ADD COLUMN IF NOT EXISTS color            text,           -- CSV for single-color opts: "Pink,Black,White" | multi: NULL or "Red,Blue"
  ADD COLUMN IF NOT EXISTS is_multi_color   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS height_cm        numeric(6, 2),  -- figure height in cm
  ADD COLUMN IF NOT EXISTS weight_g         numeric(8, 2),  -- weight in grams
  ADD COLUMN IF NOT EXISTS original_price   integer,        -- MRP in cents (for discount display)
  ADD COLUMN IF NOT EXISTS extra_images     text,           -- JSON array: [{"url":"…","alt":"…"}, …]
  ADD COLUMN IF NOT EXISTS rating           numeric(3, 1),  -- e.g. 4.2
  ADD COLUMN IF NOT EXISTS rating_count     integer;        -- e.g. 15095

-- 2. Useful index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug)
  WHERE slug IS NOT NULL;

-- 3. Demo seed — update any existing products with placeholder metadata
--    (Safe to re-run; does nothing if products don't exist)
-- UPDATE public.products
--   SET model_name  = 'Demo Figure v1',
--       color       = 'Black,White,Gold',
--       height_cm   = 22.5,
--       weight_g    = 380,
--       original_price = price * 2
--   WHERE category = 'action_figures'
--     AND model_name IS NULL;
