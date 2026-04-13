-- =============================================================================
-- RAZORPAY E-COMMERCE UPGRADE - Complete Database Migration
-- Run this in Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. UPDATE PRODUCT CATEGORIES
-- -----------------------------------------------------------------------------

-- Update category constraint to include new categories
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('posters', 'action_figures', 'limited_edition', 'custom_action_figure', 'personalized_posters'));

-- Migrate existing data
UPDATE public.products SET category = 'action_figures' WHERE category = '3d_models';
UPDATE public.products SET category = 'limited_edition' WHERE category = 'custom_designs';

-- Add new product fields for multi-image support and additional details
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dimensions_cm TEXT;

-- -----------------------------------------------------------------------------
-- 2. CREATE PRODUCT IMAGES TABLE (Multi-image support)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_images_product_idx ON public.product_images (product_id);
CREATE INDEX IF NOT EXISTS product_images_order_idx ON public.product_images (product_id, display_order);

-- RLS for product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select_all" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "product_images_insert_admin" ON public.product_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
CREATE POLICY "product_images_update_admin" ON public.product_images FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
CREATE POLICY "product_images_delete_admin" ON public.product_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- -----------------------------------------------------------------------------
-- 3. CREATE COUPONS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value INTEGER NOT NULL CHECK (discount_value >= 0),
  min_order_amount INTEGER DEFAULT 0,
  max_discount_amount INTEGER,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  first_order_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons (code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON public.coupons (is_active);

-- RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_select_all" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "coupons_insert_admin" ON public.coupons FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
CREATE POLICY "coupons_update_admin" ON public.coupons FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
CREATE POLICY "coupons_delete_admin" ON public.coupons FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Insert initial coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, is_active, first_order_only)
VALUES 
  ('HALF50', '50% off on orders above ₹500', 'percentage', 50, 500, true, false),
  ('FREEDEL', 'Free delivery on first order', 'free_delivery', 89, 0, true, true)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  first_order_only = EXCLUDED.first_order_only;

-- -----------------------------------------------------------------------------
-- 4. CREATE COUPON USAGE TABLE (Track user coupon usage)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id, order_id)
);

CREATE INDEX IF NOT EXISTS coupon_usage_user_idx ON public.coupon_usage (user_id);
CREATE INDEX IF NOT EXISTS coupon_usage_coupon_idx ON public.coupon_usage (coupon_id);

-- RLS for coupon_usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_usage_select_own" ON public.coupon_usage FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "coupon_usage_insert_own" ON public.coupon_usage FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coupon_usage_select_admin" ON public.coupon_usage FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- -----------------------------------------------------------------------------
-- 5. UPDATE ORDERS TABLE FOR RAZORPAY
-- -----------------------------------------------------------------------------

-- Add Razorpay fields and pricing breakdown
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_charge INTEGER DEFAULT 89;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gst_amount INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_notes TEXT;

-- Remove Stripe fields (keep for now to preserve data, can drop later)
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS stripe_checkout_session_id;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS stripe_payment_intent_id;

CREATE INDEX IF NOT EXISTS orders_razorpay_order_idx ON public.orders (razorpay_order_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders (payment_status);

-- -----------------------------------------------------------------------------
-- 6. CREATE CUSTOM ACTION FIGURES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.custom_action_figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders ON DELETE SET NULL,
  stl_file_url TEXT NOT NULL,
  stl_file_name TEXT NOT NULL,
  stl_file_size_mb NUMERIC(10, 2),
  
  -- Model specifications
  material_volume_cm3 NUMERIC(10, 2),
  model_weight_grams NUMERIC(10, 2),
  model_dimensions_cm TEXT,
  surface_area_cm2 NUMERIC(10, 2),
  print_time_hours NUMERIC(10, 2),
  
  -- User selections
  material_type TEXT NOT NULL DEFAULT 'PLA',
  printer_quality TEXT NOT NULL DEFAULT '0.2mm Standard Quality',
  infill_percentage INTEGER NOT NULL DEFAULT 20 CHECK (infill_percentage >= 10 AND infill_percentage <= 95),
  color TEXT DEFAULT 'Black',
  
  -- Pricing
  base_price INTEGER NOT NULL DEFAULT 0,
  material_cost INTEGER NOT NULL DEFAULT 0,
  print_time_cost INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  
  -- Flags
  is_standard_config BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'printing', 'completed', 'cancelled')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_action_figures_user_idx ON public.custom_action_figures (user_id);
CREATE INDEX IF NOT EXISTS custom_action_figures_order_idx ON public.custom_action_figures (order_id);
CREATE INDEX IF NOT EXISTS custom_action_figures_status_idx ON public.custom_action_figures (status);

-- RLS for custom_action_figures
ALTER TABLE public.custom_action_figures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_action_figures_select_own" ON public.custom_action_figures FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "custom_action_figures_insert_own" ON public.custom_action_figures FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom_action_figures_update_own" ON public.custom_action_figures FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "custom_action_figures_select_admin" ON public.custom_action_figures FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
CREATE POLICY "custom_action_figures_update_admin" ON public.custom_action_figures FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- -----------------------------------------------------------------------------
-- 7. CREATE PERSONALIZED POSTERS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.personalized_posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders ON DELETE SET NULL,
  image_file_url TEXT NOT NULL,
  image_file_name TEXT NOT NULL,
  image_file_size_mb NUMERIC(10, 2),
  
  -- Poster specifications
  size_option TEXT NOT NULL CHECK (size_option IN ('A4', 'A3', 'A2', 'Custom')),
  custom_width_cm INTEGER,
  custom_height_cm INTEGER,
  material_type TEXT NOT NULL DEFAULT 'Matte' CHECK (material_type IN ('Matte', 'Glossy')),
  
  -- Pricing
  base_price INTEGER NOT NULL DEFAULT 0,
  size_price INTEGER NOT NULL DEFAULT 0,
  material_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'printing', 'completed', 'cancelled')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personalized_posters_user_idx ON public.personalized_posters (user_id);
CREATE INDEX IF NOT EXISTS personalized_posters_order_idx ON public.personalized_posters (order_id);
CREATE INDEX IF NOT EXISTS personalized_posters_status_idx ON public.personalized_posters (status);

-- RLS for personalized_posters
ALTER TABLE public.personalized_posters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personalized_posters_select_own" ON public.personalized_posters FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "personalized_posters_insert_own" ON public.personalized_posters FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personalized_posters_update_own" ON public.personalized_posters FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "personalized_posters_select_admin" ON public.personalized_posters FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
CREATE POLICY "personalized_posters_update_admin" ON public.personalized_posters FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- -----------------------------------------------------------------------------
-- 8. CREATE STORAGE BUCKETS (Run separately in Supabase Storage UI)
-- -----------------------------------------------------------------------------

-- Note: These need to be created via Supabase Dashboard > Storage
-- Bucket names:
-- 1. 'product-images' - For product gallery images
-- 2. 'custom-action-figures' - For .stl file uploads
-- 3. 'personalized-posters' - For poster image uploads

-- Storage policies will be added after bucket creation

-- -----------------------------------------------------------------------------
-- 9. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to check if user has used a coupon
CREATE OR REPLACE FUNCTION public.has_user_used_coupon(p_user_id UUID, p_coupon_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_coupon_id UUID;
  v_usage_count INTEGER;
BEGIN
  -- Get coupon ID
  SELECT id INTO v_coupon_id FROM public.coupons WHERE code = p_coupon_code;
  
  IF v_coupon_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check usage
  SELECT COUNT(*) INTO v_usage_count 
  FROM public.coupon_usage 
  WHERE coupon_id = v_coupon_id AND user_id = p_user_id;
  
  RETURN v_usage_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is first time buyer
CREATE OR REPLACE FUNCTION public.is_first_time_buyer(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_order_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_order_count 
  FROM public.orders 
  WHERE user_id = p_user_id AND payment_status = 'completed';
  
  RETURN v_order_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_coupon_code TEXT,
  p_user_id UUID,
  p_subtotal INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_discount_amount INTEGER := 0;
  v_error TEXT := NULL;
BEGIN
  -- Get coupon
  SELECT * INTO v_coupon 
  FROM public.coupons 
  WHERE code = p_coupon_code AND is_active = true;
  
  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or inactive coupon code');
  END IF;
  
  -- Check validity dates
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon has expired');
  END IF;
  
  IF v_coupon.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon is not yet valid');
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.times_used >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit reached');
  END IF;
  
  -- Check first order only
  IF v_coupon.first_order_only AND NOT public.is_first_time_buyer(p_user_id) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is only valid for first-time buyers');
  END IF;
  
  -- Check if user already used this coupon
  IF public.has_user_used_coupon(p_user_id, p_coupon_code) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this coupon');
  END IF;
  
  -- Check minimum order amount
  IF p_subtotal < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', format('Minimum order amount is ₹%s', v_coupon.min_order_amount)
    );
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := FLOOR((p_subtotal * v_coupon.discount_value) / 100.0);
    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_coupon.max_discount_amount);
    END IF;
  ELSIF v_coupon.discount_type = 'fixed' THEN
    v_discount_amount := v_coupon.discount_value;
  ELSIF v_coupon.discount_type = 'free_delivery' THEN
    v_discount_amount := 89; -- Fixed delivery charge
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

-- -----------------------------------------------------------------------------
-- 10. UPDATE TRIGGERS
-- -----------------------------------------------------------------------------

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_action_figures_updated_at ON public.custom_action_figures;
CREATE TRIGGER update_custom_action_figures_updated_at BEFORE UPDATE ON public.custom_action_figures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_personalized_posters_updated_at ON public.personalized_posters;
CREATE TRIGGER update_personalized_posters_updated_at BEFORE UPDATE ON public.personalized_posters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- -----------------------------------------------------------------------------

-- Check tables
SELECT 
  'Tables Created' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'products', 'product_images', 'coupons', 'coupon_usage', 
    'orders', 'custom_action_figures', 'personalized_posters'
  );

-- Check coupons
SELECT code, discount_type, discount_value, is_active, first_order_only 
FROM public.coupons;

-- Check product categories
SELECT DISTINCT category FROM public.products;
