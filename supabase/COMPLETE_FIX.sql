-- ============================================================================
-- FINAL CORRECTED: Complete Database Fix
-- ============================================================================
-- Run this in Supabase SQL Editor
-- ============================================================================

DO $$ 
BEGIN
  -- ===========================================================================
  -- STEP 1: Drop old check constraint on products table
  -- ===========================================================================
  
  ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
  
  -- ===========================================================================
  -- STEP 2: Fix orders table
  -- ===========================================================================
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'coupon_id') THEN
    ALTER TABLE public.orders ADD COLUMN coupon_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE public.orders ADD COLUMN subtotal INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'delivery_charge') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_charge INTEGER NOT NULL DEFAULT 8900;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE public.orders ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'gst_amount') THEN
    ALTER TABLE public.orders ADD COLUMN gst_amount INTEGER NOT NULL DEFAULT 0;
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

  -- ===========================================================================
  -- STEP 3: Fix cart_items table
  -- ===========================================================================
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'cart_items' AND column_name = 'selected_variant') THEN
    ALTER TABLE public.cart_items ADD COLUMN selected_variant JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- ===========================================================================
  -- STEP 4: Fix products table
  -- ===========================================================================
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'original_price') THEN
    ALTER TABLE public.products ADD COLUMN original_price INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'is_featured') THEN
    ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'weight_grams') THEN
    ALTER TABLE public.products ADD COLUMN weight_grams INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'products' AND column_name = 'dimensions_cm') THEN
    ALTER TABLE public.products ADD COLUMN dimensions_cm TEXT;
  END IF;

  -- ===========================================================================
  -- STEP 5: Fix coupons table - Add ALL missing columns
  -- ===========================================================================
  
  -- Ensure coupons table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_name = 'coupons' AND table_schema = 'public') THEN
    CREATE TABLE public.coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER DEFAULT 0,
      max_discount_amount INTEGER,
      valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      valid_until TIMESTAMPTZ,
      max_uses INTEGER,
      max_uses_per_user INTEGER DEFAULT 1,
      times_used INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      first_order_only BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  -- Add missing columns to existing coupons table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'valid_from') THEN
    ALTER TABLE public.coupons ADD COLUMN valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'valid_until') THEN
    ALTER TABLE public.coupons ADD COLUMN valid_until TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'max_uses') THEN
    ALTER TABLE public.coupons ADD COLUMN max_uses INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'max_uses_per_user') THEN
    ALTER TABLE public.coupons ADD COLUMN max_uses_per_user INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'times_used') THEN
    ALTER TABLE public.coupons ADD COLUMN times_used INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'max_discount_amount') THEN
    ALTER TABLE public.coupons ADD COLUMN max_discount_amount INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'created_at') THEN
    ALTER TABLE public.coupons ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'coupons' AND column_name = 'updated_at') THEN
    ALTER TABLE public.coupons ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

END $$;

-- ===========================================================================
-- STEP 6: Update product categories (before adding constraint)
-- ===========================================================================

UPDATE public.products SET category = 'action_figures' WHERE category = '3d_models';
UPDATE public.products SET category = 'limited_edition' WHERE category = 'custom_designs';

-- ===========================================================================
-- STEP 7: Add new check constraint with correct categories
-- ===========================================================================

ALTER TABLE public.products 
ADD CONSTRAINT products_category_check 
CHECK (category IN (
  'posters', 
  'action_figures', 
  'limited_edition', 
  'custom_action_figure', 
  'personalized_posters'
));

-- ===========================================================================
-- STEP 8: Add foreign key to orders if not exists
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_coupon_id_fkey'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_coupon_id_fkey 
    FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===========================================================================
-- STEP 9: Create indexes
-- ===========================================================================

CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons(code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON public.coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS orders_razorpay_order_idx ON public.orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cart_items_variant_idx ON public.cart_items USING GIN(selected_variant);

-- ===========================================================================
-- STEP 10: Enable RLS and create policies
-- ===========================================================================

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select_active" ON public.coupons;
DROP POLICY IF EXISTS "coupons_insert_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons_delete_admin" ON public.coupons;

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

-- ===========================================================================
-- STEP 11: Insert/Update default coupons
-- ===========================================================================

INSERT INTO public.coupons (
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_order_amount, 
  is_active, 
  first_order_only, 
  max_uses_per_user,
  valid_from,
  valid_until
)
VALUES 
  ('HALF50', '50% off on orders above ₹500', 'percentage', 50, 50000, true, false, 1, NOW(), NULL),
  ('FREEDEL', 'Free delivery on first order', 'free_delivery', 8900, 0, true, true, 1, NOW(), NULL),
  ('WELCOME10', '₹100 off on first order above ₹300', 'fixed', 10000, 30000, true, true, 1, NOW(), NULL)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  first_order_only = EXCLUDED.first_order_only,
  max_uses_per_user = EXCLUDED.max_uses_per_user,
  valid_from = EXCLUDED.valid_from,
  updated_at = NOW();

-- ===========================================================================
-- STEP 12: Create validation function
-- ===========================================================================

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
  
  -- Check validity dates (only if columns exist)
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon has expired');
  END IF;
  
  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > NOW() THEN
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
    v_discount_amount := 8900;
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

-- ===========================================================================
-- STEP 13: Verification
-- ===========================================================================

SELECT '✅ Database Fix Complete!' as status;

SELECT '📦 Coupons:' as info, 
       code, 
       discount_type, 
       discount_value,
       is_active,
       first_order_only
FROM public.coupons 
ORDER BY code;

SELECT '📊 Product Categories:' as info, 
       category, 
       COUNT(*) as count
FROM public.products
GROUP BY category
ORDER BY category;

SELECT '🔧 Coupon Columns:' as info,
       column_name
FROM information_schema.columns
WHERE table_name = 'coupons'
ORDER BY ordinal_position;

-- ===========================================================================
-- DONE! Refresh your website and test checkout with coupons
-- ===========================================================================
