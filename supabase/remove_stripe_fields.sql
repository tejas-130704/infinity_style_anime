-- Remove Stripe fields from orders table
-- Run this AFTER running the other migrations if you want to clean up Stripe fields

-- Make Stripe fields nullable first (in case there's existing data)
ALTER TABLE public.orders 
ALTER COLUMN stripe_checkout_session_id DROP NOT NULL;

ALTER TABLE public.orders 
ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

-- Optionally drop Stripe columns (uncomment if you want to remove them completely)
-- WARNING: This will delete any Stripe payment history data
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS stripe_checkout_session_id;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS stripe_payment_intent_id;

-- Add comment to indicate Razorpay-only system
COMMENT ON TABLE public.orders IS 'Orders table - Using Razorpay payment gateway only';
