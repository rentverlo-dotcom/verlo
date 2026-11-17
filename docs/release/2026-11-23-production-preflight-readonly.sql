-- VERLO 23/11/2026 -- SOLO LECTURA / PREFLIGHT DE PRODUCCION
-- Ejecutar en Supabase PRODUCCION antes de aplicar migraciones.
-- No altera, borra ni copia ningun dato.
SELECT current_database() AS database_name, current_user AS actor, now() AS observed_at,
       to_regclass('public.lead_contracts') AS lead_contracts,
       to_regclass('public.caucion_applications') AS caucion_applications,
       to_regclass('public.identik_electronic_documents') AS identik_documents,
       to_regclass('public.identik_electronic_events') AS identik_events;

-- Posibles duplicados que impiden el indice unico de caucion.
-- Si esta consulta devuelve filas, DETENER la migracion y revisar datos.
SELECT tenant_lead_id, count(*) AS applications
FROM public.caucion_applications GROUP BY tenant_lead_id HAVING count(*) > 1;

-- Validar columnas de Identik si las tablas ya existen (no asumir estructuras iguales).
SELECT table_name, column_name, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('identik_electronic_documents','identik_electronic_events')
ORDER BY table_name, ordinal_position;

-- Revisar constraints/indices existentes antes de aplicar CREATE TABLE IF NOT EXISTS.
SELECT t.relname AS table_name, c.conname, c.contype, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
WHERE t.relnamespace = 'public'::regnamespace
  AND t.relname IN ('identik_electronic_documents','identik_electronic_events')
ORDER BY t.relname, c.conname;

-- Lista de buckets sensibles; identik-contracts debe existir y ser privado al final.
SELECT id, public, file_size_limit FROM storage.buckets
WHERE id IN ('identik-contracts','tenant-documents');

-- Estado de las bases: NO modificar solicitudes/pagos reales durante el release.
SELECT status, count(*) AS applications FROM public.caucion_applications
GROUP BY status ORDER BY status;
