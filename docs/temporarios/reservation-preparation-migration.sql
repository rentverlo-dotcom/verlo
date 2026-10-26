-- VERLO Temporarios: crear una propuesta de reserva tras un match aceptado.
-- No bloquea fechas, no confirma pagos, no toca tablas del alquiler tradicional.
-- Ejecutar manualmente en Supabase SQL Editor.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS temporary_reservations_match_uidx
ON public.temporary_reservations (match_id);

CREATE OR REPLACE FUNCTION public.temporary_prepare_reservation(
  p_match_id uuid,
  p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  m public.temporary_matches%ROWTYPE;
  p public.temporary_properties%ROWTYPE;
  d public.temporary_demands%ROWTYPE;
  r public.temporary_reservations%ROWTYPE;
  v_nights integer;
  v_total numeric;
BEGIN
  IF p_match_id IS NULL OR p_actor_id IS NULL THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  SELECT * INTO m FROM public.temporary_matches
    WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'match_not_found'; END IF;

  SELECT * INTO p FROM public.temporary_properties
    WHERE id = m.property_id;
  SELECT * INTO d FROM public.temporary_demands
    WHERE id = m.demand_id;

  IF p.owner_user_id IS DISTINCT FROM p_actor_id
     AND d.tenant_user_id IS DISTINCT FROM p_actor_id THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF m.status <> 'accepted' OR m.owner_decision <> 'accepted'
     OR m.tenant_decision <> 'accepted' THEN
    RAISE EXCEPTION 'match_not_accepted';
  END IF;

  v_nights := m.check_out - m.check_in;
  IF v_nights < 1 OR v_nights > 90 OR m.check_in < CURRENT_DATE THEN
    RAISE EXCEPTION 'invalid_stay';
  END IF;
  IF m.check_in < p.availability_start OR m.check_out > p.availability_end
     OR p.status <> 'published' THEN
    RAISE EXCEPTION 'property_unavailable';
  END IF;

  v_total := round((p.nightly_price_ars * v_nights)::numeric,2);
  IF v_total <= 0 OR v_total > d.max_total_budget_ars
     OR m.agreed_total_ars IS DISTINCT FROM v_total THEN
    RAISE EXCEPTION 'price_changed';
  END IF;

  -- Revalidation only. A later, explicit bilateral step performs the block.
  IF EXISTS (
    SELECT 1 FROM public.temporary_availability_blocks b
    WHERE b.property_id = p.id
      AND b.check_in < m.check_out
      AND m.check_in < b.check_out
  ) THEN
    RAISE EXCEPTION 'dates_unavailable';
  END IF;

  INSERT INTO public.temporary_reservations (
    match_id,check_in,check_out,total_price_ars,
    deposit_required,deposit_terms,status
  ) VALUES (
    m.id,m.check_in,m.check_out,v_total,
    p.deposit_required,p.deposit_terms,'draft'
  )
  ON CONFLICT (match_id) DO NOTHING;

  SELECT * INTO r FROM public.temporary_reservations
  WHERE match_id=m.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation_not_found'; END IF;

  RETURN jsonb_build_object(
    'id',r.id,'matchId',r.match_id,'status',r.status,
    'checkIn',r.check_in,'checkOut',r.check_out,
    'totalPriceArs',r.total_price_ars,
    'depositRequired',r.deposit_required
  );
END;
$$;

REVOKE ALL ON FUNCTION public.temporary_prepare_reservation(uuid,uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.temporary_prepare_reservation(uuid,uuid)
TO service_role;

COMMIT;
