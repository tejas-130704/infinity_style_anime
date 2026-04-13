-- Coupon enhancements: product targeting + order snapshot
-- Safe to re-run (IF NOT EXISTS).

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS apply_to_all BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.coupons.apply_to_all IS 'If true, coupon applies to any cart; else use coupon_products / applicable_products';

CREATE TABLE IF NOT EXISTS public.coupon_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, product_id)
);

CREATE INDEX IF NOT EXISTS coupon_products_coupon_idx ON public.coupon_products(coupon_id);
CREATE INDEX IF NOT EXISTS coupon_products_product_idx ON public.coupon_products(product_id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_snapshot JSONB;

COMMENT ON COLUMN public.orders.coupon_snapshot IS 'Immutable snapshot: code, discount_type, discount_value, discount_amount at checkout';
