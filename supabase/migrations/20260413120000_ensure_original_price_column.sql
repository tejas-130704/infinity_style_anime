-- App stores MRP in `original_price` (integer, paisa). Safe to re-run.
-- If this column was missing, inserts from the admin API would omit MRP.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price INTEGER;

COMMENT ON COLUMN public.products.original_price IS 'MRP in paisa (minor units). Example: ₹300 = 30000.';
