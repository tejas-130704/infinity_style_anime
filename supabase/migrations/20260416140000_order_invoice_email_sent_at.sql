-- Tracks successful post-payment invoice email (idempotent sends / support).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS invoice_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.invoice_email_sent_at IS 'Set when order invoice email was sent after payment.';
