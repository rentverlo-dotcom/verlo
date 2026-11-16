-- VERLO release: apply BEFORE enabling Identik in production.
-- Schema only. NEVER migrate QA rows, signed documents, test users or provider IDs.
-- Production preflight must confirm that lead_contracts exists and review
-- any existing identik_electronic_* structures before applying.
BEGIN;

CREATE TABLE IF NOT EXISTS public.identik_electronic_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_contract_id uuid NOT NULL UNIQUE
    REFERENCES public.lead_contracts(id) ON DELETE RESTRICT,
  external_id text NOT NULL UNIQUE,
  identik_document_id bigint UNIQUE,
  status text NOT NULL DEFAULT 'local_pending'
    CHECK (status IN ('local_pending','creating','created','sent','pending',
                      'completed','rejected','cancelled','expired','failed')),
  owner_email text,
  tenant_email text,
  owner_signed_at timestamptz,
  tenant_signed_at timestamptz,
  completed_at timestamptz,
  signed_pdf_storage_key text,
  certificate_storage_key text,
  last_checked_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identik_completed_document_check
    CHECK (status <> 'completed' OR identik_document_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.identik_electronic_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL
    REFERENCES public.identik_electronic_documents(id) ON DELETE CASCADE,
  dedupe_key text NOT NULL UNIQUE,
  event_type text NOT NULL,
  provider_status text,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS identik_electronic_documents_pending_idx
  ON public.identik_electronic_documents(status, last_checked_at)
  WHERE status NOT IN ('completed','rejected','cancelled','expired');

ALTER TABLE public.identik_electronic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identik_electronic_events ENABLE ROW LEVEL SECURITY;

-- No client-facing table grants: all access goes through separately
-- authorized server routes using the Supabase service role.
REVOKE ALL ON public.identik_electronic_documents FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.identik_electronic_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.identik_electronic_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.identik_electronic_events TO service_role;

-- If either table pre-existed, ensure its core columns and uniqueness guards
-- are compatible, rather than silently accepting an incomplete structure.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid = 'public.identik_electronic_documents'::regclass
      AND c.contype = 'u' AND pg_get_constraintdef(c.oid) = 'UNIQUE (lead_contract_id)'
  ) THEN
    RAISE EXCEPTION 'IDENTIK_SCHEMA_MISMATCH: missing contract uniqueness';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid = 'public.identik_electronic_events'::regclass
      AND c.contype = 'u' AND pg_get_constraintdef(c.oid) = 'UNIQUE (dedupe_key)'
  ) THEN
    RAISE EXCEPTION 'IDENTIK_SCHEMA_MISMATCH: missing event deduplication';
  END IF;
END $$;
COMMIT;
