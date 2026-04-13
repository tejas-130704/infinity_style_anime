-- Fix missing columns in existing tables
-- Run this BEFORE running the main razorpay_ecommerce_upgrade.sql

-- Add selected_variant column to cart_items
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS selected_variant JSONB DEFAULT '{}'::jsonb;

-- Add original_price to products (for discount display)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_price INTEGER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS cart_items_variant_idx ON public.cart_items USING GIN (selected_variant);

-- Update existing cart_items to have empty variant object
UPDATE public.cart_items SET selected_variant = '{}'::jsonb WHERE selected_variant IS NULL;
