-- VERLO PowerMarket: preserve exactly one real caucion application per tenant lead.
-- The /api/powermarket/apply route already returns an existing application for
-- repeat submissions. Without a DB uniqueness guard simultaneous POSTs may race.
-- QA verified: no existing duplicates at the time of installation.
--
-- Preflight on production BEFORE running this reviewed migration:
-- SELECT tenant_lead_id, count(*) FROM public.caucion_applications
-- GROUP BY tenant_lead_id HAVING count(*) > 1;
-- If duplicates exist, stop and reconcile them; do not discard customer data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.caucion_applications
    GROUP BY tenant_lead_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'caucion_duplicate_leads_require_review';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS caucion_applications_tenant_one_per_lead_uidx
  ON public.caucion_applications (tenant_lead_id);
