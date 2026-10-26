-- VERLO Temporarios: contrato y aceptaciones independientes. Ejecutar manualmente tras revisión.
BEGIN;
CREATE TABLE IF NOT EXISTS public.temporary_contracts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reservation_id uuid NOT NULL UNIQUE REFERENCES public.temporary_reservations(id) ON DELETE RESTRICT,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','agreed')),
 document_text text,
 document_sha256 text CHECK(document_sha256 IS NULL OR document_sha256 ~ '^[a-f0-9]{64}$'),
 legal_data jsonb NOT NULL DEFAULT '{}'::jsonb,
 ready_at timestamptz,
 owner_agreed_at timestamptz,
 tenant_agreed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT contract_ready_has_text CHECK(status='draft' OR (length(document_text)>0 AND document_sha256 IS NOT NULL AND ready_at IS NOT NULL)),
 CONSTRAINT contract_agreed_has_both CHECK(status<>'agreed' OR (owner_agreed_at IS NOT NULL AND tenant_agreed_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.temporary_contract_acceptances (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 contract_id uuid NOT NULL REFERENCES public.temporary_contracts(id) ON DELETE RESTRICT,
 document_sha256 text NOT NULL CHECK(document_sha256 ~ '^[a-f0-9]{64}$'),
 document_version integer NOT NULL,
 actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 role text NOT NULL CHECK(role IN ('owner','tenant')),
 accepted_at timestamptz NOT NULL DEFAULT now(),
 ip_address inet,
 user_agent text,
 consent_text text NOT NULL,
 UNIQUE(contract_id,role,document_version)
);
ALTER TABLE public.temporary_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_contract_acceptances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.temporary_contracts FROM anon,authenticated;
REVOKE ALL ON public.temporary_contract_acceptances FROM anon,authenticated;
GRANT ALL ON public.temporary_contracts TO service_role;
GRANT ALL ON public.temporary_contract_acceptances TO service_role;
COMMENT ON TABLE public.temporary_contract_acceptances IS 'Acceptance of a specific contract version, not an advanced cryptographic digital signature.';
COMMIT;