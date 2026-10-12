-- VERLO Temporarios: reparar tabla contractual preexistente sin borrar datos.
-- Ejecutar una sola vez en Supabase SQL Editor; compatible con reejecución.
BEGIN;
ALTER TABLE public.temporary_contracts
 ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS document_text text,
 ADD COLUMN IF NOT EXISTS document_sha256 text,
 ADD COLUMN IF NOT EXISTS legal_data jsonb NOT NULL DEFAULT '{}'::jsonb,
 ADD COLUMN IF NOT EXISTS ready_at timestamptz,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- Preservar contenido preexistente de contratos anteriores. Ningún documento viejo se considera firmado por esta migración.
UPDATE public.temporary_contracts
 SET document_text=contract_content
 WHERE document_text IS NULL AND contract_content IS NOT NULL;
-- No atribuir hashes a documentos históricos sin haberlos generado/verificado en el backend.
ALTER TABLE public.temporary_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_contract_acceptances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.temporary_contracts FROM anon,authenticated;
REVOKE ALL ON public.temporary_contract_acceptances FROM anon,authenticated;
GRANT ALL ON public.temporary_contracts TO service_role;
GRANT ALL ON public.temporary_contract_acceptances TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
