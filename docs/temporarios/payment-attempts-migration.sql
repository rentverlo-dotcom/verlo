-- VERLO Temporarios only. Run manually in Supabase SQL Editor.
-- Payment attempts are isolated from VERLO's production lead_payments.
BEGIN;
CREATE TABLE IF NOT EXISTS public.temporary_payment_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reservation_id uuid NOT NULL REFERENCES public.temporary_reservations(id),
 tenant_user_id uuid NOT NULL REFERENCES auth.users(id),
 provider text NOT NULL DEFAULT 'mercadopago' CHECK (provider='mercadopago'),
 amount_ars numeric NOT NULL DEFAULT 29900 CHECK (amount_ars=29900),
 currency text NOT NULL DEFAULT 'ARS' CHECK (currency='ARS'),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
 mp_preference_id text UNIQUE,
 mp_payment_id text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS temporary_payment_one_pending
 ON public.temporary_payment_attempts(reservation_id) WHERE status='pending';
ALTER TABLE public.temporary_payment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.temporary_payment_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.temporary_payment_attempts TO service_role;
COMMIT;
