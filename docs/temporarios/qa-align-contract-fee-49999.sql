-- VERLO Temporarios: keep the database fee in sync with the
-- existing Mercado Pago prepare / webhook / reconcile code (ARS 49,999).
-- Tested in ISOLATED QA on 2026-11-09. Review before any production migration.
-- Does not charge customers or modify existing payment attempts.
-- Apply ONLY after reviewing current production rows and agreed commercial price.
BEGIN;
ALTER TABLE public.temporary_payment_attempts
  DROP CONSTRAINT IF EXISTS temporary_payment_attempts_amount_ars_check;
ALTER TABLE public.temporary_payment_attempts
  ADD CONSTRAINT temporary_payment_attempts_amount_ars_check
  CHECK (amount_ars = 49999);
ALTER TABLE public.temporary_payment_attempts
  ALTER COLUMN amount_ars SET DEFAULT 49999;
COMMIT;
