-- VERLO Temporarios - reviewed PRODUCTION migration candidate, NOT executed.
-- Price contracted: ARS 49,999. Two ARS 29,900 APPROVED entries from
-- 2026-10-12 are historical manual tests, NOT real customer sales.
-- Preserve rows unchanged; reject new old-price payments after cutoff.
-- Never run as a QA test. Review and back up production before applying.
--
-- Preflight (read-only) before execution:
-- SELECT amount_ars,status,created_at, count(*)
-- FROM public.temporary_payment_attempts
-- GROUP BY amount_ars,status,created_at;
--
-- This migration only adjusts constraints/defaults. No payment is charged,
-- deleted, reclassified or repriced. It is safe to roll back as a transaction
-- if a precondition/validation fails.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.temporary_payment_attempts
    WHERE NOT (
      amount_ars = 49999
      OR (amount_ars = 29900
          AND created_at < TIMESTAMPTZ '2026-11-12 00:00:00+00')
    )
  ) THEN
    RAISE EXCEPTION 'TEMPORARY_UNEXPECTED_HISTORIC_PAYMENT_AMOUNT';
  END IF;
END $$;

ALTER TABLE public.temporary_payment_attempts
  DROP CONSTRAINT IF EXISTS temporary_payment_attempts_amount_ars_check;
ALTER TABLE public.temporary_payment_attempts
  ADD CONSTRAINT temporary_payment_attempts_amount_ars_check
  CHECK (
    amount_ars = 49999
    OR (
      amount_ars = 29900
      AND created_at < TIMESTAMPTZ '2026-11-12 00:00:00+00'
    )
  );
ALTER TABLE public.temporary_payment_attempts
  ALTER COLUMN amount_ars SET DEFAULT 49999;

ALTER TABLE public.temporary_matches
  DROP CONSTRAINT IF EXISTS temporary_matches_status_check;
ALTER TABLE public.temporary_matches
  ADD CONSTRAINT temporary_matches_status_check
  CHECK (status IN ('new','interested','accepted','rejected','discarded','expired'));
COMMIT;

-- Mandatory post-deploy verification:
-- SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c
-- JOIN pg_class t ON t.oid=c.conrelid
-- WHERE t.relname IN ('temporary_payment_attempts','temporary_matches')
-- AND c.conname IN ('temporary_payment_attempts_amount_ars_check',
--                   'temporary_matches_status_check');
-- SELECT amount_ars,status,count(*) FROM public.temporary_payment_attempts
-- GROUP BY amount_ars,status;
