-- VERLO Temporarios: decisiones independientes y transición atómica.
-- Ejecutar manualmente en Supabase. No afecta tablas legacy.
BEGIN;
ALTER TABLE public.temporary_matches
  ADD COLUMN IF NOT EXISTS owner_decision text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tenant_decision text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS owner_decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS tenant_decided_at timestamptz;

CREATE OR REPLACE FUNCTION public.temporary_decide_match(
  p_match_id uuid, p_actor_id uuid, p_role text, p_decision text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  m public.temporary_matches%ROWTYPE;
  owner_id uuid;
  tenant_id uuid;
BEGIN
  IF p_match_id IS NULL OR p_actor_id IS NULL
     OR p_role NOT IN ('owner','tenant')
     OR p_decision NOT IN ('accepted','rejected') THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  SELECT * INTO m FROM public.temporary_matches
  WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'match_not_found'; END IF;
  IF m.status NOT IN ('new','accepted','rejected') THEN
    RAISE EXCEPTION 'invalid_match_status';
  END IF;

  SELECT owner_user_id INTO owner_id
  FROM public.temporary_properties WHERE id = m.property_id;
  SELECT tenant_user_id INTO tenant_id
  FROM public.temporary_demands WHERE id = m.demand_id;
  IF (p_role = 'owner' AND owner_id IS DISTINCT FROM p_actor_id)
    OR (p_role = 'tenant' AND tenant_id IS DISTINCT FROM p_actor_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF m.owner_decision = 'rejected' OR m.tenant_decision = 'rejected' THEN
    IF (p_role='owner' AND m.owner_decision=p_decision)
      OR (p_role='tenant' AND m.tenant_decision=p_decision) THEN
      RETURN jsonb_build_object('id',m.id,'status',m.status,
        'ownerDecision',m.owner_decision,'tenantDecision',m.tenant_decision);
    END IF;
    RAISE EXCEPTION 'match_closed';
  END IF;

  IF p_role = 'owner' THEN
    IF m.owner_decision <> 'pending' AND m.owner_decision <> p_decision THEN
      RAISE EXCEPTION 'decision_locked';
    END IF;
    UPDATE public.temporary_matches
    SET owner_decision=p_decision,
        owner_decided_at=COALESCE(owner_decided_at,now())
    WHERE id=m.id;
  ELSE
    IF m.tenant_decision <> 'pending' AND m.tenant_decision <> p_decision THEN
      RAISE EXCEPTION 'decision_locked';
    END IF;
    UPDATE public.temporary_matches
    SET tenant_decision=p_decision,
        tenant_decided_at=COALESCE(tenant_decided_at,now())
    WHERE id=m.id;
  END IF;

  UPDATE public.temporary_matches
  SET status = CASE
    WHEN owner_decision='rejected' OR tenant_decision='rejected' THEN 'rejected'
    WHEN owner_decision='accepted' AND tenant_decision='accepted' THEN 'accepted'
    ELSE 'new' END
  WHERE id=m.id
  RETURNING * INTO m;

  RETURN jsonb_build_object('id',m.id,'status',m.status,
    'ownerDecision',m.owner_decision,'tenantDecision',m.tenant_decision);
END;
$$;
REVOKE ALL ON FUNCTION public.temporary_decide_match(uuid,uuid,text,text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.temporary_decide_match(uuid,uuid,text,text)
TO service_role;
COMMIT;