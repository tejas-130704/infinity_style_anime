-- ============================================================================
-- QUICK FIX: Add Missing Columns to Existing Database
-- ============================================================================
-- Run this in Supabase SQL Editor if you already have data and don't want
-- to run the full schema (which is safe but creates everything from scratch)
-- ============================================================================

-- Add missing columns to existing tables
DO $$ 
BEGIN
  -- Add columns to orders table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'coupon_id') THEN
    ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE public.orders ADD COLUMN subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'delivery_charge') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_charge INTEGER NOT NULL DEFAULT 8900 CHECK (delivery_charge >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE public.orders ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'gst_amount') THEN
    ALTER TABLE public.orders ADD COLUMN gst_amount INTEGER NOT NULL DEFAULT 0 CHECK (gst_amount >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'coupon_code') THEN
    ALTER TABLE public.orders ADD COLUMN coupon_code TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'razorpay_order_id') THEN
    ALTER TABLE public.orders ADD COLUMN razorpay_order_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'razorpay_payment_id') THEN
    ALTER TABLE public.orders ADD COLUMN razorpay_payment_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'razorpay_signature') THEN
    ALTER TABLE public.orders ADD COLUMN razorpay_signature TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'order_notes') THEN
    ALTER TABLE public.orders ADD COLUMN order_notes TEXT;
  END IF;

  -- Fulfillment timeline (admin orders + tracking; see migrations/20260416120000_order_fulfillment_tracking.sql)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'fulfillment_status') THEN
    ALTER TABLE public.orders ADD COLUMN fulfillment_status TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'packed_at') THEN
    ALTER TABLE public.orders ADD COLUMN packed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipped_at') THEN
    ALTER TABLE public.orders ADD COLUMN shipped_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'out_for_delivery_at') THEN
    ALTER TABLE public.orders ADD COLUMN out_for_delivery_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivered_at') THEN
    ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'invoice_email_sent_at') THEN
    ALTER TABLE public.orders ADD COLUMN invoice_email_sent_at TIMESTAMPTZ;
  END IF;

  -- Add columns to cart_items
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cart_items' AND column_name = 'selected_variant') THEN
    ALTER TABLE public.cart_items ADD COLUMN selected_variant JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add columns to products
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'original_price') THEN
    ALTER TABLE public.products ADD COLUMN original_price INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'is_featured') THEN
    ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'weight_grams') THEN
    ALTER TABLE public.products ADD COLUMN weight_grams INTEGER DEFAULT 0 CHECK (weight_grams >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'dimensions_cm') THEN
    ALTER TABLE public.products ADD COLUMN dimensions_cm TEXT;
  END IF;

END $$;

-- Fulfillment constraint + backfill + index (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_fulfillment_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_fulfillment_status_check
      CHECK (
        fulfillment_status IS NULL
        OR fulfillment_status IN (
          'ordered',
          'packed',
          'shipped',
          'out_for_delivery',
          'delivered'
        )
      );
  END IF;
END $$;

UPDATE public.orders
SET fulfillment_status = CASE
  WHEN status = 'delivered' THEN 'delivered'
  WHEN status = 'shipped' THEN 'shipped'
  WHEN status = 'processing' AND payment_status = 'completed' THEN 'ordered'
  ELSE fulfillment_status
END
WHERE fulfillment_status IS NULL
  AND payment_status = 'completed';

CREATE INDEX IF NOT EXISTS orders_fulfillment_status_idx ON public.orders (fulfillment_status)
  WHERE fulfillment_status IS NOT NULL;

COMMENT ON COLUMN public.orders.fulfillment_status IS 'ordered | packed | shipped | out_for_delivery | delivered — set after payment; delivery requires admin';

-- Create coupons table if not exists
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code = UPPER(code)),
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value INTEGER NOT NULL CHECK (discount_value >= 0),
  min_order_amount INTEGER DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount INTEGER CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  max_uses_per_user INTEGER DEFAULT 1 CHECK (max_uses_per_user > 0),
  times_used INTEGER DEFAULT 0 CHECK (times_used >= 0),
  is_active BOOLEAN DEFAULT true,
  first_order_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons(code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON public.coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS orders_razorpay_order_idx ON public.orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "coupons_select_active" ON public.coupons;
DROP POLICY IF EXISTS "coupons_insert_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_delete_admin" ON public.coupons;

-- Create policies
CREATE POLICY "coupons_select_active" ON public.coupons
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "coupons_insert_admin" ON public.coupons
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "coupons_update_admin" ON public.coupons
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "coupons_delete_admin" ON public.coupons
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Insert default coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, is_active, first_order_only, max_uses_per_user)
VALUES 
  ('HALF50', '50% off on orders above ₹500', 'percentage', 50, 50000, true, false, 1),
  ('FREEDEL', 'Free delivery on first order', 'free_delivery', 8900, 0, true, true, 1),
  ('WELCOME10', '₹100 off on first order above ₹300', 'fixed', 10000, 30000, true, true, 1)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  first_order_only = EXCLUDED.first_order_only,
  updated_at = NOW();

-- Create validation function
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_coupon_code TEXT,
  p_user_id UUID,
  p_subtotal INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_discount_amount INTEGER := 0;
  v_order_count INTEGER;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon 
  FROM public.coupons 
  WHERE code = UPPER(p_coupon_code) AND is_active = true;
  
  -- Validate coupon exists
  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or inactive coupon code');
  END IF;
  
  -- Check validity dates
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon has expired');
  END IF;
  
  IF v_coupon.valid_from > NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon is not yet valid');
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.times_used >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit reached');
  END IF;
  
  -- Check first order requirement
  IF v_coupon.first_order_only THEN
    SELECT COUNT(*) INTO v_order_count 
    FROM public.orders 
    WHERE user_id = p_user_id AND payment_status = 'completed';
    
    IF v_order_count > 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This coupon is only valid for first-time buyers');
    END IF;
  END IF;
  
  -- Check minimum order amount
  IF p_subtotal < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', FORMAT('Minimum order amount is ₹%s', v_coupon.min_order_amount / 100)
    );
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := FLOOR((p_subtotal * v_coupon.discount_value) / 100.0);
    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_coupon.max_discount_amount);
    END IF;
  ELSIF v_coupon.discount_type = 'fixed' THEN
    v_discount_amount := LEAST(v_coupon.discount_value, p_subtotal);
  ELSIF v_coupon.discount_type = 'free_delivery' THEN
    v_discount_amount := 8900; -- Fixed delivery charge in paisa
  END IF;
  
  -- Return success
  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount_amount', v_discount_amount,
    'discount_type', v_coupon.discount_type,
    'description', v_coupon.description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update product categories
UPDATE public.products SET category = 'action_figures' WHERE category = '3d_models';
UPDATE public.products SET category = 'limited_edition' WHERE category = 'custom_designs';

-- Verification
SELECT 'Quick Fix Complete!' as status;
SELECT 'Coupons:' as check_type, code, is_active FROM public.coupons;
SELECT 'New Columns in orders:' as check_type, column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('coupon_id', 'subtotal', 'delivery_charge', 'razorpay_order_id');
