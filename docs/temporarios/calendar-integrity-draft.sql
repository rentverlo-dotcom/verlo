-- VERLO TEMPORARIOS - SEGURIDAD DE CALENDARIO (BORRADOR)
-- SOLO PARA PROYECTO SUPABASE DE PRUEBAS.
-- NO EJECUTAR EN PRODUCCION.
-- Prerequisito: docs/temporarios/schema-draft.sql.
-- Ninguna tabla o funcion tradicional se modifica.

-- PostgreSQL garantiza que no haya reservas/bloqueos simultaneos
-- con dias superpuestos para la misma propiedad.
-- Intervalos [inicio, fin): checkout no ocupa la noche de salida.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.temporary_availability_blocks
  ADD CONSTRAINT temporary_availability_no_overlap
  EXCLUDE USING gist (
    property_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  );

-- Evita doble bloqueo de una misma reserva incluso si dos solicitudes
-- llegan en paralelo. reservation_id ya es UNIQUE en el schema base.
-- El constraint EXCLUDE hace fallar el segundo INSERT concurrente.

-- Indices para buscar propiedades por Georef y tipo.
CREATE INDEX IF NOT EXISTS temporary_properties_geo_type_status_idx
  ON public.temporary_properties (locality_key, property_type, status);

CREATE INDEX IF NOT EXISTS temporary_demands_georef_gin_idx
  ON public.temporary_demands USING gin (locality_keys);

-- REGLAS DE NEGOCIO PENDIENTES DE IMPLEMENTACION:
-- 1. Solo el propietario autoriza bloqueos manuales de calendario.
-- 2. Para reservas VERLO, ambas partes aceptan BLOQUEAR expresamente.
-- 3. Si se pacta sena, el propietario confirma su recepcion.
-- 4. Se valida el pago de VERLO desde Mercado Pago, no desde cliente.
-- 5. La disponibilidad se comprueba de nuevo dentro de transaccion.
-- 6. El bloqueo y el estado de reserva se confirman atomicamente.
-- 7. La API nunca acepta un UUID como prueba de identidad.
-- 8. No habilitar escrituras desde anon ni authenticated en RLS
--    sin un diseno de autorizacion validado.
--
-- No crear funcion de confirmacion ni exponer endpoints publicos
-- hasta definir ownership, Auth y la transicion de estados.
