-- VERLO Temporarios: atomic bilateral confirmation + date block.
-- Already applied to isolated Supabase QA on 2026-11-13; production migration pending release review.
-- No checkout or payment updates. Only service_role can call.
CREATE OR REPLACE FUNCTION public.temporary_confirm_reservation(p_match_id uuid, p_actor_id uuid, p_role text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  m public.temporary_matches%ROWTYPE;
  r public.temporary_reservations%ROWTYPE;
  p public.temporary_properties%ROWTYPE;
  tenant_id uuid;
BEGIN
  IF p_role NOT IN ('owner','tenant') OR p_actor_id IS NULL THEN
    RAISE EXCEPTION 'invalid_confirmation';
  END IF;

  SELECT * INTO m FROM public.temporary_matches WHERE id=p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation_not_found'; END IF;

  -- Lock one property for the full availability check + final booking.
  SELECT * INTO p FROM public.temporary_properties WHERE id=m.property_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'property_not_found'; END IF;
  SELECT tenant_user_id INTO tenant_id FROM public.temporary_demands WHERE id=m.demand_id;

  IF (p_role='owner' AND p_actor_id IS DISTINCT FROM p.owner_user_id) OR
     (p_role='tenant' AND p_actor_id IS DISTINCT FROM tenant_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF m.status <> 'accepted' OR m.owner_decision <> 'accepted'
    OR m.tenant_decision <> 'accepted' THEN
    RAISE EXCEPTION 'match_not_accepted';
  END IF;
  IF m.check_in IS NULL OR m.check_out IS NULL OR m.check_in >= m.check_out
    OR m.check_in < (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date THEN
    RAISE EXCEPTION 'invalid_dates';
  END IF;

  SELECT * INTO r FROM public.temporary_reservations WHERE match_id=p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation_not_found'; END IF;

  IF r.check_in IS DISTINCT FROM m.check_in OR r.check_out IS DISTINCT FROM m.check_out OR
     r.total_price_ars IS DISTINCT FROM m.agreed_total_ars OR
     p.status <> 'published' OR r.check_in < p.availability_start OR
     r.check_out > p.availability_end THEN
    RAISE EXCEPTION 'reservation_changed';
  END IF;

  IF r.agreed_terms_owner_at IS NULL OR r.agreed_terms_tenant_at IS NULL THEN
    RAISE EXCEPTION 'terms_required';
  END IF;
  IF r.status NOT IN ('fee_paid','deposit_pending','ready_to_block','confirmed') THEN
    RAISE EXCEPTION 'payment_required';
  END IF;
  IF r.deposit_required AND r.deposit_received_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'deposit_not_confirmed';
  END IF;

  -- Covers both VERLO reservations and manual/external owner blocks.
  IF EXISTS (
    SELECT 1 FROM public.temporary_availability_blocks b
    WHERE b.property_id=m.property_id AND b.reservation_id IS DISTINCT FROM r.id
      AND b.check_in < r.check_out AND r.check_in < b.check_out
  ) OR EXISTS (
    SELECT 1 FROM public.temporary_reservations other_r
    JOIN public.temporary_matches other_m ON other_m.id=other_r.match_id
    WHERE other_m.property_id=m.property_id AND other_r.id<>r.id
      AND other_r.status='confirmed'
      AND other_r.check_in<r.check_out AND r.check_in<other_r.check_out
  ) THEN
    RAISE EXCEPTION 'dates_unavailable';
  END IF;

  IF p_role='owner' THEN
    UPDATE public.temporary_reservations
      SET confirmed_by_owner_at=coalesce(confirmed_by_owner_at,now()),updated_at=now()
      WHERE id=r.id;
  ELSE
    UPDATE public.temporary_reservations
      SET confirmed_by_tenant_at=coalesce(confirmed_by_tenant_at,now()),updated_at=now()
      WHERE id=r.id;
  END IF;

  SELECT * INTO r FROM public.temporary_reservations WHERE id=r.id;
  IF r.confirmed_by_owner_at IS NOT NULL AND r.confirmed_by_tenant_at IS NOT NULL THEN
    -- Insert before confirming: either both succeed or both roll back.
    BEGIN
      INSERT INTO public.temporary_availability_blocks(
        property_id,reservation_id,check_in,check_out,source
      ) VALUES (m.property_id,r.id,r.check_in,r.check_out,'verlo')
      ON CONFLICT (reservation_id) DO NOTHING;
    EXCEPTION WHEN exclusion_violation THEN
      RAISE EXCEPTION 'dates_unavailable';
    END;
    UPDATE public.temporary_reservations
      SET status='confirmed',confirmed_at=coalesce(confirmed_at,now()),updated_at=now()
      WHERE id=r.id RETURNING * INTO r;
  ELSIF r.status<>'ready_to_block' THEN
    UPDATE public.temporary_reservations
      SET status='ready_to_block',updated_at=now()
      WHERE id=r.id RETURNING * INTO r;
  END IF;

  RETURN jsonb_build_object(
    'id',r.id,'status',r.status,
    'ownerConfirmed',r.confirmed_by_owner_at IS NOT NULL,
    'tenantConfirmed',r.confirmed_by_tenant_at IS NOT NULL
  );
END;
$function$
;
REVOKE ALL ON FUNCTION public.temporary_confirm_reservation(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.temporary_confirm_reservation(uuid,uuid,text) TO service_role;
