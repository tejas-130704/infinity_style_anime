-- ============================================================================
-- 3DKALAKAAR E-COMMERCE - COMPLETE PRODUCTION DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Database: PostgreSQL (Supabase)
-- Description: Complete production-ready schema for Razorpay e-commerce system
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- SECTION 1: DROP EXISTING POLICIES (Safe re-run)
-- ============================================================================

DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Table: profiles (User profiles extending auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_admin_idx ON public.profiles(is_admin) WHERE is_admin = true;
COMMENT ON TABLE public.profiles IS 'User profiles with admin flag';

-- -----------------------------------------------------------------------------
-- Table: products (Product catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0), -- in paisa (₹1 = 100 paisa)
  original_price INTEGER CHECK (original_price >= 0), -- for showing discounts
  category TEXT NOT NULL CHECK (
    category IN (
      'posters', 
      'action_figures', 
      'limited_edition', 
      'custom_action_figure', 
      'personalized_posters'
    )
  ),
  image_url TEXT,
  model_url TEXT, -- for 3D models
  slug TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  weight_grams INTEGER DEFAULT 0 CHECK (weight_grams >= 0),
  dimensions_cm TEXT, -- e.g., "30x40x2"
  sku TEXT UNIQUE, -- Stock Keeping Unit
  tags TEXT[], -- Array of tags for search
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional product data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products(slug);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS products_active_idx ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS products_tags_idx ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS products_search_idx ON public.products USING GIN(
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);
COMMENT ON TABLE public.products IS 'Main product catalog with pricing in paisa';

-- -----------------------------------------------------------------------------
-- Table: product_images (Multi-image support for products)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_images_product_idx ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS product_images_order_idx ON public.product_images(product_id, display_order);
CREATE UNIQUE INDEX IF NOT EXISTS product_images_primary_idx 
  ON public.product_images(product_id) WHERE is_primary = true;
COMMENT ON TABLE public.product_images IS 'Multiple images per product with ordering';

-- -----------------------------------------------------------------------------
-- Table: addresses (Delivery addresses)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone1 TEXT NOT NULL CHECK (length(phone1) >= 10),
  phone2 TEXT CHECK (phone2 IS NULL OR length(phone2) >= 10),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT CHECK (length(pincode) = 6),
  landmark TEXT,
  address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS addresses_user_idx ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS addresses_default_idx ON public.addresses(user_id, is_default) 
  WHERE is_default = true;
COMMENT ON TABLE public.addresses IS 'User delivery addresses with validation';

-- -----------------------------------------------------------------------------
-- Table: coupons (Discount coupons)
-- -----------------------------------------------------------------------------
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
  applicable_categories TEXT[], -- NULL = all categories
  applicable_products UUID[], -- NULL = all products
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons(code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON public.coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS coupons_valid_idx ON public.coupons(valid_from, valid_until) 
  WHERE is_active = true;
COMMENT ON TABLE public.coupons IS 'Discount coupons with advanced rules';

-- -----------------------------------------------------------------------------
-- Table: coupon_usage (Track coupon usage)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_amount INTEGER NOT NULL CHECK (discount_amount >= 0),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coupon_usage_coupon_idx ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS coupon_usage_user_idx ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS coupon_usage_order_idx ON public.coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS coupon_usage_user_coupon_idx ON public.coupon_usage(user_id, coupon_id);
COMMENT ON TABLE public.coupon_usage IS 'Track when and by whom coupons were used';

-- -----------------------------------------------------------------------------
-- Table: cart_items (Shopping cart)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_variant JSONB DEFAULT '{}'::jsonb, -- e.g., {"color": "Red", "size": "Large"}
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, selected_variant)
);

CREATE INDEX IF NOT EXISTS cart_items_user_idx ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS cart_items_product_idx ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS cart_items_variant_idx ON public.cart_items USING GIN(selected_variant);
COMMENT ON TABLE public.cart_items IS 'User shopping cart with variant support';

-- -----------------------------------------------------------------------------
-- Table: orders (Order header)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  
  -- Pricing breakdown (all in paisa)
  subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  delivery_charge INTEGER NOT NULL DEFAULT 8900 CHECK (delivery_charge >= 0), -- ₹89
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  gst_amount INTEGER NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  
  -- Coupon
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN (
      'pending_payment', 
      'pending', 
      'processing', 
      'shipped', 
      'delivered', 
      'cancelled',
      'refunded'
    )
  ),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  
  -- Payment details (Razorpay)
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  payment_method TEXT DEFAULT 'razorpay',
  
  -- Legacy Stripe fields (nullable for backward compatibility)
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Additional info
  order_notes TEXT,
  admin_notes TEXT,
  tracking_number TEXT,
  estimated_delivery DATE,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_razorpay_order_idx ON public.orders(razorpay_order_id) 
  WHERE razorpay_order_id IS NOT NULL;
COMMENT ON TABLE public.orders IS 'Order header with Razorpay payment integration';

-- -----------------------------------------------------------------------------
-- Table: order_items (Order line items)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL, -- Snapshot at order time
  product_image_url TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price >= 0), -- Price per unit at order time
  variant JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON public.order_items(product_id);
COMMENT ON TABLE public.order_items IS 'Order line items with price snapshot';

-- -----------------------------------------------------------------------------
-- Table: custom_action_figures (Custom 3D print orders)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_action_figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- File details
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
  material_type TEXT NOT NULL DEFAULT 'PLA' CHECK (
    material_type IN ('PLA', 'ABS', 'PETG', 'ASA', 'TPU', 'Engineering')
  ),
  printer_quality TEXT NOT NULL DEFAULT '0.2mm Standard Quality' CHECK (
    printer_quality IN (
      '0.2mm Standard Quality',
      '0.15mm Medium Quality',
      '0.1mm High Quality'
    )
  ),
  infill_percentage INTEGER NOT NULL DEFAULT 20 CHECK (
    infill_percentage >= 10 AND infill_percentage <= 95
  ),
  color TEXT DEFAULT 'Black',
  
  -- Pricing (in paisa)
  base_price INTEGER NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  material_cost INTEGER NOT NULL DEFAULT 0 CHECK (material_cost >= 0),
  print_time_cost INTEGER NOT NULL DEFAULT 0 CHECK (print_time_cost >= 0),
  total_price INTEGER NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  
  -- Flags
  is_standard_config BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'printing', 'completed', 'cancelled')
  ),
  
  -- Notes
  user_notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS custom_action_figures_user_idx ON public.custom_action_figures(user_id);
CREATE INDEX IF NOT EXISTS custom_action_figures_order_idx ON public.custom_action_figures(order_id);
CREATE INDEX IF NOT EXISTS custom_action_figures_status_idx ON public.custom_action_figures(status);
COMMENT ON TABLE public.custom_action_figures IS 'Custom 3D print orders with STL files';

-- -----------------------------------------------------------------------------
-- Table: personalized_posters (Custom poster orders)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personalized_posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- File details
  image_file_url TEXT NOT NULL,
  image_file_name TEXT NOT NULL,
  image_file_size_mb NUMERIC(10, 2),
  image_resolution TEXT, -- e.g., "1920x1080"
  
  -- Poster specifications
  size_option TEXT NOT NULL CHECK (size_option IN ('A4', 'A3', 'A2', 'Custom')),
  custom_width_cm INTEGER CHECK (size_option != 'Custom' OR custom_width_cm > 0),
  custom_height_cm INTEGER CHECK (size_option != 'Custom' OR custom_height_cm > 0),
  material_type TEXT NOT NULL DEFAULT 'Matte' CHECK (material_type IN ('Matte', 'Glossy')),
  
  -- Pricing (in paisa)
  base_price INTEGER NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  size_price INTEGER NOT NULL DEFAULT 0 CHECK (size_price >= 0),
  material_price INTEGER NOT NULL DEFAULT 0 CHECK (material_price >= 0),
  total_price INTEGER NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'printing', 'completed', 'cancelled')
  ),
  
  -- Notes
  user_notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT custom_size_check CHECK (
    (size_option = 'Custom' AND custom_width_cm IS NOT NULL AND custom_height_cm IS NOT NULL) OR
    (size_option != 'Custom')
  )
);

CREATE INDEX IF NOT EXISTS personalized_posters_user_idx ON public.personalized_posters(user_id);
CREATE INDEX IF NOT EXISTS personalized_posters_order_idx ON public.personalized_posters(order_id);
CREATE INDEX IF NOT EXISTS personalized_posters_status_idx ON public.personalized_posters(status);
COMMENT ON TABLE public.personalized_posters IS 'Custom poster orders with image upload';

-- ============================================================================
-- SECTION 3: FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Function: Handle new user registration
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-create profile on user registration';

-- -----------------------------------------------------------------------------
-- Function: Update updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at IS 'Auto-update updated_at timestamp';

-- -----------------------------------------------------------------------------
-- Function: Check if user has used a coupon
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_user_used_coupon(p_user_id UUID, p_coupon_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_coupon_id UUID;
  v_usage_count INTEGER;
  v_max_uses_per_user INTEGER;
BEGIN
  -- Get coupon details
  SELECT id, max_uses_per_user 
  INTO v_coupon_id, v_max_uses_per_user
  FROM public.coupons 
  WHERE code = UPPER(p_coupon_code);
  
  IF v_coupon_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check usage count
  SELECT COUNT(*) 
  INTO v_usage_count 
  FROM public.coupon_usage 
  WHERE coupon_id = v_coupon_id AND user_id = p_user_id;
  
  RETURN v_usage_count >= v_max_uses_per_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.has_user_used_coupon IS 'Check if user exceeded coupon usage limit';

-- -----------------------------------------------------------------------------
-- Function: Check if user is first time buyer
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_first_time_buyer(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_order_count INTEGER;
BEGIN
  SELECT COUNT(*) 
  INTO v_order_count 
  FROM public.orders 
  WHERE user_id = p_user_id 
    AND payment_status = 'completed'
    AND status NOT IN ('cancelled', 'refunded');
  
  RETURN v_order_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_first_time_buyer IS 'Check if user has no completed orders';

-- -----------------------------------------------------------------------------
-- Function: Validate and apply coupon
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_coupon_code TEXT,
  p_user_id UUID,
  p_subtotal INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_discount_amount INTEGER := 0;
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
  IF v_coupon.first_order_only AND NOT public.is_first_time_buyer(p_user_id) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is only valid for first-time buyers');
  END IF;
  
  -- Check user usage limit
  IF public.has_user_used_coupon(p_user_id, p_coupon_code) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this coupon');
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

COMMENT ON FUNCTION public.validate_coupon IS 'Validate coupon and calculate discount';

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- Trigger: Auto-create profile on user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Update updated_at on products
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Update updated_at on addresses
DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Update updated_at on coupons
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Update updated_at on cart_items
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Update updated_at on orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Update updated_at on custom_action_figures
DROP TRIGGER IF EXISTS update_custom_action_figures_updated_at ON public.custom_action_figures;
CREATE TRIGGER update_custom_action_figures_updated_at
  BEFORE UPDATE ON public.custom_action_figures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: Update updated_at on personalized_posters
DROP TRIGGER IF EXISTS update_personalized_posters_updated_at ON public.personalized_posters;
CREATE TRIGGER update_personalized_posters_updated_at
  BEFORE UPDATE ON public.personalized_posters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_action_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_posters ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Products policies (public read, admin write)
CREATE POLICY "products_select_active" ON public.products
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "products_insert_admin" ON public.products
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Product images policies
CREATE POLICY "product_images_select_all" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "product_images_insert_admin" ON public.product_images
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "product_images_update_admin" ON public.product_images
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "product_images_delete_admin" ON public.product_images
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Addresses policies
CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_own" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Coupons policies (public read active, admin manage)
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

-- Coupon usage policies
CREATE POLICY "coupon_usage_select_own" ON public.coupon_usage
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "coupon_usage_insert_own" ON public.coupon_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cart policies
CREATE POLICY "cart_items_select_own" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cart_items_insert_own" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items_update_own" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cart_items_delete_own" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Orders policies (users see own, admins see all)
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Order items policies
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ))
  ));

CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()
  ));

-- Custom action figures policies
CREATE POLICY "custom_action_figures_select_own" ON public.custom_action_figures
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "custom_action_figures_insert_own" ON public.custom_action_figures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_action_figures_update_own" ON public.custom_action_figures
  FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Personalized posters policies
CREATE POLICY "personalized_posters_select_own" ON public.personalized_posters
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "personalized_posters_insert_own" ON public.personalized_posters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "personalized_posters_update_own" ON public.personalized_posters
  FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- ============================================================================
-- SECTION 6: SEED DATA
-- ============================================================================

-- Insert default coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, is_active, first_order_only, max_uses_per_user)
VALUES 
  ('HALF50', '50% off on orders above ₹500', 'percentage', 50, 50000, true, false, 1),
  ('FREEDEL', 'Free delivery on first order', 'free_delivery', 8900, 0, true, true, 1),
  ('WELCOME10', '₹100 off on first order', 'fixed', 10000, 30000, true, true, 1)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  first_order_only = EXCLUDED.first_order_only,
  updated_at = NOW();

-- Update existing products to have proper categories
UPDATE public.products SET category = 'action_figures' WHERE category = '3d_models';
UPDATE public.products SET category = 'limited_edition' WHERE category = 'custom_designs';

-- ============================================================================
-- SECTION 7: VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT 
  'Tables Created' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'products', 'product_images', 'addresses',
    'coupons', 'coupon_usage', 'cart_items', 'orders', 'order_items',
    'custom_action_figures', 'personalized_posters'
  );

-- Verify coupons
SELECT 
  'Coupons' as check_type,
  code, 
  discount_type, 
  discount_value,
  min_order_amount / 100 as min_order_rupees,
  is_active,
  first_order_only 
FROM public.coupons
ORDER BY code;

-- Verify product categories
SELECT 
  'Product Categories' as check_type,
  category,
  COUNT(*) as product_count
FROM public.products
GROUP BY category
ORDER BY category;

-- Verify indexes
SELECT 
  'Indexes Created' as check_type,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'products', 'product_images', 'addresses',
    'coupons', 'coupon_usage', 'cart_items', 'orders', 'order_items',
    'custom_action_figures', 'personalized_posters'
  );

-- Verify functions
SELECT 
  'Functions Created' as check_type,
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'update_updated_at',
    'has_user_used_coupon',
    'is_first_time_buyer',
    'validate_coupon'
  )
ORDER BY routine_name;

-- ============================================================================
-- SCHEMA SETUP COMPLETE! 
-- ============================================================================
-- Next steps:
-- 1. Create storage buckets (product-images, custom-action-figures, personalized-posters)
-- 2. Test cart functionality
-- 3. Test checkout with Razorpay
-- 4. Test coupon validation
-- ============================================================================
