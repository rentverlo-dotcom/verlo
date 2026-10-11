-- VERLO Temporarios: reservation draft from a bilaterally accepted match.
-- Security: service_role only; no payment, notification, date block or status advancement.
-- Runs under one PostgreSQL transaction and locks the selected match row.
BEGIN;
CREATE OR REPLACE FUNCTION public.temporary_start_reservation(
  p_match_id uuid,
  p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  m public.temporary_matches%ROWTYPE;
  p public.temporary_properties%ROWTYPE;
  d public.temporary_demands%ROWTYPE;
  r public.temporary_reservations%ROWTYPE;
BEGIN
  IF p_match_id IS NULL OR p_actor_id IS NULL THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;
  SELECT * INTO m FROM public.temporary_matches WHERE id=p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'match_not_found'; END IF;
  SELECT * INTO p FROM public.temporary_properties WHERE id=m.property_id;
  SELECT * INTO d FROM public.temporary_demands WHERE id=m.demand_id;
  IF NOT FOUND OR p.id IS NULL OR d.id IS NULL THEN
    RAISE EXCEPTION 'participants_missing';
  END IF;
  IF p.owner_user_id IS DISTINCT FROM p_actor_id AND d.tenant_user_id IS DISTINCT FROM p_actor_id THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF m.status <> 'accepted' OR m.owner_decision <> 'accepted' OR m.tenant_decision <> 'accepted' THEN
    RAISE EXCEPTION 'match_not_accepted';
  END IF;
  IF p.status <> 'published' OR d.status <> 'active' THEN
    RAISE EXCEPTION 'listing_not_active';
  END IF;
  IF m.check_in <> d.check_in OR m.check_out <> d.check_out OR
     m.check_in < p.availability_start OR m.check_out > p.availability_end OR
     m.check_out <= m.check_in OR m.check_out > m.check_in + 90 THEN
    RAISE EXCEPTION 'invalid_dates';
  END IF;
  IF m.agreed_total_ars IS NULL OR m.agreed_total_ars <= 0 THEN
    RAISE EXCEPTION 'invalid_price';
  END IF;
  SELECT * INTO r FROM public.temporary_reservations WHERE match_id=p_match_id;
  IF FOUND THEN
    RETURN jsonb_build_object('id',r.id,'status',r.status,'reused',true);
  END IF;
  -- A required deposit needs a separately agreed amount and terms.
  -- Do not silently insert an empty or zero deposit as a confirmed obligation.
  IF p.deposit_required THEN
    RAISE EXCEPTION 'deposit_terms_required';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.temporary_availability_blocks b
    WHERE b.property_id=p.id AND
      daterange(b.check_in,b.check_out,'[)') && daterange(m.check_in,m.check_out,'[)')
  ) THEN
    RAISE EXCEPTION 'dates_unavailable';
  END IF;
  INSERT INTO public.temporary_reservations (
    match_id,check_in,check_out,total_price_ars,deposit_required,status
  ) VALUES (
    m.id,m.check_in,m.check_out,m.agreed_total_ars,false,'draft'
  ) RETURNING * INTO r;
  RETURN jsonb_build_object('id',r.id,'status',r.status,'reused',false);
END;
$$;
REVOKE ALL ON FUNCTION public.temporary_start_reservation(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.temporary_start_reservation(uuid,uuid) TO service_role;
COMMIT;
