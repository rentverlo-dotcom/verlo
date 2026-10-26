-- VERLO Temporarios: per-submission idempotency. Run manually in production Supabase.
-- Existing records remain untouched. NULL keys allow legacy rows.
BEGIN;
ALTER TABLE public.temporary_properties ADD COLUMN IF NOT EXISTS request_key uuid;
ALTER TABLE public.temporary_demands ADD COLUMN IF NOT EXISTS request_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS temporary_properties_request_key_uidx
  ON public.temporary_properties (owner_user_id, request_key)
  WHERE request_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS temporary_demands_request_key_uidx
  ON public.temporary_demands (tenant_user_id, request_key)
  WHERE request_key IS NOT NULL;
COMMIT;

-- Read-only verification:
-- SELECT tablename,indexname FROM pg_indexes WHERE schemaname='public'
-- AND indexname IN ('temporary_properties_request_key_uidx','temporary_demands_request_key_uidx');
