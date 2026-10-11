-- VERLO TEMPORARIOS - BORRADOR DE DISEÑO v1
-- NO EJECUTAR EN PRODUCCION. Solo documentacion de arquitectura.
-- Ninguna tabla tradicional se altera, migra o elimina.
-- ANTES DE EJECUTAR: revisar RLS, indices, acceso al storage, operaciones
-- atomicas, mecanismo anti-solapamiento y entorno Supabase de PRUEBAS.
-- Las relaciones entre usuarios se verificaran al disenar Auth y la API.
--
-- Regla de negocio:
-- * 1-90 NOCHES (salida exclusiva del alojamiento)
-- * La publicacion persiste; los periodos pueden bloquearse.
-- * Seña opcional DIRECTA entre partes; VERLO nunca la recibe.
-- * Ni el match, ni el pago de VERLO, ni un comprobante bloquean fechas.
-- * El bloqueo de fechas requiere conformidad EXPRESA de ambas partes,
--   despues de la seña y su confirmacion, si corresponde.
-- * Las reservas de fechas deben bloquearse ATOMICAMENTE y evitar
--   solapamientos incluso si se confirman simultaneamente.
-- * VERLO cobra $29.900 al inquilino por contrato temporario.

CREATE TABLE IF NOT EXISTS public.temporary_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  owner_full_name text NOT NULL,
  owner_email text NOT NULL,
  owner_phone text NOT NULL,
  locality text NOT NULL,
  public_location_reference text,
  private_address text,
  title text,
  description text,
  property_type text NOT NULL,
  max_guests integer CHECK (max_guests IS NULL OR max_guests > 0),
  nightly_price_ars numeric(14,2) NOT NULL CHECK (nightly_price_ars > 0),
  availability_start date NOT NULL,
  availability_end date NOT NULL,
  deposit_required boolean NOT NULL DEFAULT false,
  deposit_terms text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT temporary_properties_availability_dates
    CHECK (availability_end > availability_start)
);

CREATE TABLE IF NOT EXISTS public.temporary_demands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id uuid,
  tenant_full_name text NOT NULL,
  tenant_email text NOT NULL,
  tenant_phone text NOT NULL,
  locality text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  max_total_budget_ars numeric(14,2) NOT NULL
    CHECK (max_total_budget_ars > 0),
  guests integer CHECK (guests IS NULL OR guests > 0),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT temporary_demands_dates
    CHECK (check_out > check_in AND check_out <= check_in + 90)
);

CREATE TABLE IF NOT EXISTS public.temporary_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.temporary_properties(id),
  demand_id uuid NOT NULL REFERENCES public.temporary_demands(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  agreed_total_ars numeric(14,2) CHECK (agreed_total_ars IS NULL OR agreed_total_ars > 0),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','interested','accepted','discarded','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, demand_id),
  CONSTRAINT temporary_matches_dates
    CHECK (check_out > check_in AND check_out <= check_in + 90)
);

CREATE TABLE IF NOT EXISTS public.temporary_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE REFERENCES public.temporary_matches(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  total_price_ars numeric(14,2) NOT NULL CHECK (total_price_ars > 0),
  deposit_required boolean NOT NULL DEFAULT false,
  deposit_amount_ars numeric(14,2) CHECK (deposit_amount_ars IS NULL OR deposit_amount_ars >= 0),
  deposit_terms text,
  deposit_receipt_storage_key text,
  deposit_receipt_submitted_at timestamptz,
  deposit_received_confirmed_at timestamptz,
  agreed_terms_tenant_at timestamptz,
  agreed_terms_owner_at timestamptz,
  block_accepted_tenant_at timestamptz,
  block_accepted_owner_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','terms_accepted','fee_paid','deposit_pending',
                      'ready_to_block','confirmed','cancelled','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT temporary_reservations_dates
    CHECK (check_out > check_in AND check_out <= check_in + 90),
  CONSTRAINT temporary_reservations_deposit_amount
    CHECK (NOT deposit_required OR deposit_amount_ars IS NOT NULL)
);

-- Cada bloqueo pertenece a UNA propiedad, con fin de estadia exclusivo.
-- 'external' es una reserva externa manual; 'verlo' requiere acuerdo bilateral.
-- REQUISITO PREVIO A PRODUCCION: constraint/funcion transaccional anti-solapamiento.
CREATE TABLE IF NOT EXISTS public.temporary_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.temporary_properties(id),
  reservation_id uuid UNIQUE REFERENCES public.temporary_reservations(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  source text NOT NULL CHECK (source IN ('external','verlo','owner_block')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT temporary_blocks_dates CHECK (check_out > check_in),
  CONSTRAINT temporary_blocks_reservation_source
    CHECK ((source = 'verlo' AND reservation_id IS NOT NULL)
        OR (source <> 'verlo' AND reservation_id IS NULL))
);

CREATE TABLE IF NOT EXISTS public.temporary_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL UNIQUE REFERENCES public.temporary_reservations(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  total_price_ars numeric(14,2) NOT NULL CHECK (total_price_ars > 0),
  contract_content text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generated','agreed')),
  tenant_agreed_at timestamptz,
  owner_agreed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT temporary_contract_dates CHECK (check_out > check_in AND check_out <= check_in + 90)
);

CREATE TABLE IF NOT EXISTS public.temporary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.temporary_reservations(id),
  provider text NOT NULL DEFAULT 'mercadopago',
  provider_preference_id text,
  provider_payment_id text UNIQUE,
  fee_ars numeric(14,2) NOT NULL DEFAULT 29900 CHECK (fee_ars > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS temporary_properties_location_idx
  ON public.temporary_properties (locality, status);
CREATE INDEX IF NOT EXISTS temporary_demands_location_dates_idx
  ON public.temporary_demands (locality, check_in, check_out);
CREATE INDEX IF NOT EXISTS temporary_blocks_property_dates_idx
  ON public.temporary_availability_blocks (property_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS temporary_matches_property_idx
  ON public.temporary_matches (property_id);
CREATE INDEX IF NOT EXISTS temporary_matches_demand_idx
  ON public.temporary_matches (demand_id);

-- BLOQUEO DE SEGURIDAD: tablas inaccesibles desde clientes Supabase.
-- No se incluyen policies de lectura/escritura hasta auditar Auth/API.
ALTER TABLE public.temporary_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_payments ENABLE ROW LEVEL SECURITY;

-- PENDIENTES BLOQUEANTES ANTES DE MIGRAR:
-- 1. Supabase de pruebas separado de produccion.
-- 2. Definir ownership autenticado/tokens (campos owner_user_id/tenant_user_id).
-- 3. Anti-solapamiento transaccional para bloqueos; una consulta previa no basta.
-- 4. Modelo de multiples ventanas de disponibilidad por propiedad y cambios de precio.
-- 5. Flujo de aceptacion, version de terminos y reglas de devolucion.
-- 6. Storage privado de comprobantes; validacion de pagos en webhook.
-- 7. Cumplimiento contractual/legal para temporarios.
