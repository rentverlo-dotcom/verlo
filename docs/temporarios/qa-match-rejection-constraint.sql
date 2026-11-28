-- VERLO Temporarios: QA-discovered rejection-state schema mismatch.
-- The existing temporary_decide_match RPC writes status='rejected', but the
-- previous temporary_matches_status_check omitted this valid state.
-- Apply as a reviewed migration BEFORE releasing the Temporarios flow to main.
-- Additive to the accepted status values; does not update customer rows.
BEGIN;
ALTER TABLE public.temporary_matches
  DROP CONSTRAINT IF EXISTS temporary_matches_status_check;
ALTER TABLE public.temporary_matches
  ADD CONSTRAINT temporary_matches_status_check
  CHECK (status IN ('new','interested','accepted','rejected','discarded','expired'));
COMMIT;
