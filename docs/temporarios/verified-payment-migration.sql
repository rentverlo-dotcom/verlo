-- VERLO Temporarios: confirmación atómica exclusiva de pagos verificados en Mercado Pago.
-- Nunca llamar desde el navegador. Sólo service_role y después de verificar firma + GET payment.
BEGIN;
CREATE OR REPLACE FUNCTION public.temporary_register_verified_payment(
 p_attempt_id uuid,p_mp_payment_id text,p_amount numeric,p_currency text,p_mp_status text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 a public.temporary_payment_attempts%ROWTYPE;
 r public.temporary_reservations%ROWTYPE;
BEGIN
 IF p_attempt_id IS NULL OR p_mp_payment_id IS NULL OR length(p_mp_payment_id)<1
 OR p_amount IS DISTINCT FROM 29900 OR p_currency<>'ARS'
 OR p_mp_status NOT IN ('approved','rejected','cancelled','pending','in_process') THEN
   RAISE EXCEPTION 'invalid_payment';
 END IF;
 SELECT * INTO a FROM public.temporary_payment_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'attempt_not_found'; END IF;
 SELECT * INTO r FROM public.temporary_reservations WHERE id=a.reservation_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'reservation_not_found'; END IF;
 IF a.amount_ars<>p_amount OR a.currency<>p_currency THEN RAISE EXCEPTION 'amount_mismatch'; END IF;
 IF a.mp_payment_id IS NOT NULL AND a.mp_payment_id<>p_mp_payment_id THEN RAISE EXCEPTION 'payment_id_conflict'; END IF;
 IF a.status='approved' THEN
  RETURN jsonb_build_object('status','approved','reservationStatus',r.status,'reused',true);
 END IF;
 IF a.status<>'pending' THEN RAISE EXCEPTION 'attempt_closed'; END IF;
 IF p_mp_status='approved' THEN
  IF r.status<>'terms_accepted' OR r.agreed_terms_owner_at IS NULL OR r.agreed_terms_tenant_at IS NULL
  THEN RAISE EXCEPTION 'terms_not_accepted'; END IF;
  UPDATE public.temporary_payment_attempts SET status='approved',mp_payment_id=p_mp_payment_id,updated_at=now() WHERE id=a.id;
  UPDATE public.temporary_reservations SET status=CASE WHEN deposit_required THEN 'deposit_pending' ELSE 'fee_paid' END,updated_at=now()
   WHERE id=r.id RETURNING * INTO r;
 ELSIF p_mp_status IN ('rejected','cancelled') THEN
  UPDATE public.temporary_payment_attempts SET status=p_mp_status,mp_payment_id=p_mp_payment_id,updated_at=now() WHERE id=a.id;
 END IF;
 RETURN jsonb_build_object('status',p_mp_status,'reservationStatus',r.status,'reused',false);
END;
$$;
REVOKE ALL ON FUNCTION public.temporary_register_verified_payment(uuid,text,numeric,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.temporary_register_verified_payment(uuid,text,numeric,text,text) TO service_role;
COMMIT;
