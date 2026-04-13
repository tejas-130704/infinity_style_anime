-- RLS for coupon_products (admin-only); idempotent coupon usage per order

-- Keep a single usage row per order when duplicates exist (migration safety).
DELETE FROM public.coupon_usage cu1
WHERE cu1.order_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.coupon_usage cu2
    WHERE cu2.order_id = cu1.order_id
      AND cu2.id < cu1.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS coupon_usage_order_id_unique
  ON public.coupon_usage (order_id)
  WHERE order_id IS NOT NULL;

ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupon_products_admin_all" ON public.coupon_products;

CREATE POLICY "coupon_products_admin_select" ON public.coupon_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "coupon_products_admin_insert" ON public.coupon_products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "coupon_products_admin_update" ON public.coupon_products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "coupon_products_admin_delete" ON public.coupon_products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
