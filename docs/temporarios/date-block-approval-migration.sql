-- VERLO Temporarios: autorización bilateral y bloqueo atómico.
-- NO habilita pagos ni permite marcar fee_paid desde el cliente.
-- Sólo service_role puede ejecutar. Requiere verificación previa del pago en backend.
BEGIN;
CREATE OR REPLACE FUNCTION public.temporary_accept_date_block(
 p_match_id uuid,p_actor_id uuid,p_role text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 m public.temporary_matches%ROWTYPE;
 r public.temporary_reservations%ROWTYPE;
 p public.temporary_properties%ROWTYPE;
 tenant_id uuid;
BEGIN
 IF p_match_id IS NULL OR p_actor_id IS NULL OR p_role NOT IN ('owner','tenant') THEN RAISE EXCEPTION 'invalid_input'; END IF;
 SELECT * INTO m FROM public.temporary_matches WHERE id=p_match_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'match_not_found'; END IF;
 SELECT * INTO r FROM public.temporary_reservations WHERE match_id=p_match_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'reservation_not_found'; END IF;
 SELECT * INTO p FROM public.temporary_properties WHERE id=m.property_id FOR UPDATE;
 SELECT tenant_user_id INTO tenant_id FROM public.temporary_demands WHERE id=m.demand_id;
 IF (p_role='owner' AND p.owner_user_id IS DISTINCT FROM p_actor_id)
 OR (p_role='tenant' AND tenant_id IS DISTINCT FROM p_actor_id) THEN
   RAISE EXCEPTION 'not_authorized';
 END IF;
 IF r.status='confirmed' THEN
  RETURN jsonb_build_object('id',r.id,'status',r.status,'confirmed',true);
 END IF;
 IF m.status<>'accepted' OR m.owner_decision<>'accepted' OR m.tenant_decision<>'accepted'
 OR r.agreed_terms_owner_at IS NULL OR r.agreed_terms_tenant_at IS NULL
 OR r.status NOT IN ('fee_paid','deposit_pending','ready_to_block') THEN
  RAISE EXCEPTION 'fee_or_terms_pending';
 END IF;
 IF r.deposit_required AND r.deposit_received_confirmed_at IS NULL THEN
  RAISE EXCEPTION 'deposit_not_confirmed';
 END IF;
 IF r.check_in<>m.check_in OR r.check_out<>m.check_out OR r.total_price_ars IS DISTINCT FROM m.agreed_total_ars
 OR p.status<>'published' OR r.check_in<p.availability_start OR r.check_out>p.availability_end THEN
  RAISE EXCEPTION 'reservation_changed';
 END IF;
 IF p_role='owner' THEN
  UPDATE public.temporary_reservations SET block_accepted_owner_at=COALESCE(block_accepted_owner_at,now()),updated_at=now()
  WHERE id=r.id;
 ELSE
  UPDATE public.temporary_reservations SET block_accepted_tenant_at=COALESCE(block_accepted_tenant_at,now()),updated_at=now()
  WHERE id=r.id;
 END IF;
 SELECT * INTO r FROM public.temporary_reservations WHERE id=r.id;
 IF r.block_accepted_owner_at IS NOT NULL AND r.block_accepted_tenant_at IS NOT NULL THEN
  -- EXCLUDE gist en temporary_availability_blocks rechaza la superposición incluso ante concurrencia.
  INSERT INTO public.temporary_availability_blocks(property_id,reservation_id,check_in,check_out,source)
  VALUES(m.property_id,r.id,r.check_in,r.check_out,'verlo')
  ON CONFLICT (reservation_id) DO NOTHING;
  UPDATE public.temporary_reservations SET status='confirmed',updated_at=now() WHERE id=r.id RETURNING * INTO r;
 ELSIF r.status<>'ready_to_block' THEN
  UPDATE public.temporary_reservations SET status='ready_to_block',updated_at=now() WHERE id=r.id RETURNING * INTO r;
 END IF;
 RETURN jsonb_build_object('id',r.id,'status',r.status,
  'ownerApproved',r.block_accepted_owner_at IS NOT NULL,
  'tenantApproved',r.block_accepted_tenant_at IS NOT NULL,
  'confirmed',r.status='confirmed');
END;
$$;
REVOKE ALL ON FUNCTION public.temporary_accept_date_block(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.temporary_accept_date_block(uuid,uuid,text) TO service_role;
COMMIT;
