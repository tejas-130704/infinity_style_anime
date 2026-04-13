-- Flipkart-style fulfillment timeline: separate from payment lifecycle.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.fulfillment_status IS 'ordered | packed | shipped | out_for_delivery | delivered — set after payment; delivery requires admin';

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

-- Backfill from legacy status (best-effort)
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
