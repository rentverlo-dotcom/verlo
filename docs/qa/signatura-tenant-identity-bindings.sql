-- QA ONLY. Execute manually in Supabase project anptswspguyotnasoacq.
-- Do not execute in production. No existing tables are altered.
-- One declaration per authenticated tenant; evidence remains private.
BEGIN;

CREATE TABLE IF NOT EXISTS public.signatura_tenant_identity_bindings (
  tenant_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  signatura_document_id uuid UNIQUE,
  signatura_signature_id uuid UNIQUE,
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','failed')),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verified_requires_document
    CHECK (verification_status <> 'verified' OR
           (signatura_document_id IS NOT NULL AND
            signatura_signature_id IS NOT NULL AND
            verified_at IS NOT NULL))
);

ALTER TABLE public.signatura_tenant_identity_bindings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.signatura_tenant_identity_bindings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.signatura_tenant_identity_bindings TO service_role;

-- No user-facing RLS policies. Only verified server-side service role
-- can correlate Signatura IDs to a VERLO tenant.
-- Never store DNI photographs, selfie, provider payload or audit certificate here.

COMMIT;

-- Read-only postflight (run separately):
-- SELECT relrowsecurity FROM pg_class
-- WHERE oid = 'public.signatura_tenant_identity_bindings'::regclass;
