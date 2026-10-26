-- Store the Checkout Pro URL when Mercado Pago creates a preference.
-- Old pending attempts are kept; no payments, reservations or legacy tables changed.
BEGIN;
ALTER TABLE public.temporary_payment_attempts
 ADD COLUMN IF NOT EXISTS mp_checkout_url text;
COMMIT;
