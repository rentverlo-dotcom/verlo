-- VERLO Temporarios. Registrar aceptación independiente de las condiciones, sin cobrar ni bloquear fechas.
BEGIN;
CREATE OR REPLACE FUNCTION public.temporary_accept_reservation_terms(p_match_id uuid,p_actor_id uuid,p_role text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 r public.temporary_reservations%ROWTYPE;
 m public.temporary_matches%ROWTYPE;
 owner_id uuid;
 tenant_id uuid;
BEGIN
 IF p_match_id IS NULL OR p_actor_id IS NULL OR p_role NOT IN ('owner','tenant') THEN
  RAISE EXCEPTION 'invalid_input';
 END IF;
 SELECT * INTO m FROM public.temporary_matches WHERE id=p_match_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'match_not_found'; END IF;
 SELECT * INTO r FROM public.temporary_reservations WHERE match_id=p_match_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'reservation_not_found'; END IF;
 SELECT owner_user_id INTO owner_id FROM public.temporary_properties WHERE id=m.property_id;
 SELECT tenant_user_id INTO tenant_id FROM public.temporary_demands WHERE id=m.demand_id;
 IF (p_role='owner' AND owner_id IS DISTINCT FROM p_actor_id) OR
    (p_role='tenant' AND tenant_id IS DISTINCT FROM p_actor_id) THEN
  RAISE EXCEPTION 'not_authorized';
 END IF;
 IF m.status <> 'accepted' OR m.owner_decision <> 'accepted' OR m.tenant_decision <> 'accepted'
    OR r.status NOT IN ('draft','terms_accepted') THEN
  RAISE EXCEPTION 'not_eligible';
 END IF;
 IF r.check_in <> m.check_in OR r.check_out <> m.check_out OR
    r.total_price_ars IS DISTINCT FROM m.agreed_total_ars THEN
  RAISE EXCEPTION 'terms_changed';
 END IF;
 IF p_role='owner' THEN
  UPDATE public.temporary_reservations
  SET agreed_terms_owner_at=COALESCE(agreed_terms_owner_at,now()),updated_at=now()
  WHERE id=r.id;
 ELSE
  UPDATE public.temporary_reservations
  SET agreed_terms_tenant_at=COALESCE(agreed_terms_tenant_at,now()),updated_at=now()
  WHERE id=r.id;
 END IF;
 UPDATE public.temporary_reservations
 SET status=CASE WHEN agreed_terms_owner_at IS NOT NULL AND agreed_terms_tenant_at IS NOT NULL
                  THEN 'terms_accepted' ELSE 'draft' END,
     updated_at=now()
 WHERE id=r.id RETURNING * INTO r;
 RETURN jsonb_build_object('id',r.id,'status',r.status,
  'ownerAccepted',r.agreed_terms_owner_at IS NOT NULL,
  'tenantAccepted',r.agreed_terms_tenant_at IS NOT NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.temporary_accept_reservation_terms(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.temporary_accept_reservation_terms(uuid,uuid,text) TO service_role;
COMMIT;
