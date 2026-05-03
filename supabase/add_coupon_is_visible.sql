-- Migration script to add 'is_visible' column to the 'coupons' table

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Update existing coupons to be visible
UPDATE public.coupons SET is_visible = true WHERE is_visible IS NULL;

-- Make sure the column is not null moving forward, if desired (optional)
-- ALTER TABLE public.coupons ALTER COLUMN is_visible SET NOT NULL;
