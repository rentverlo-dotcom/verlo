-- Multimedia exclusiva de VERLO Temporarios. Ejecutar en Supabase manualmente.
BEGIN;
CREATE TABLE IF NOT EXISTS public.temporary_property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.temporary_properties(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','video/mp4')),
  bytes integer NOT NULL CHECK (bytes > 0 AND bytes <= 20971520),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS temporary_property_media_property_idx
  ON public.temporary_property_media(property_id,created_at);
ALTER TABLE public.temporary_property_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.temporary_property_media FROM PUBLIC,anon,authenticated;
COMMIT;
-- La API usa service_role, verifica la identidad del propietario y valida el archivo en R2.
