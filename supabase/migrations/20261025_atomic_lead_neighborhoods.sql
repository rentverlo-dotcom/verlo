-- Apply in Supabase SQL Editor before deploying the RPC-based intake.
-- Both inserts execute in ONE PostgreSQL transaction. Any exception rolls back both.
CREATE OR REPLACE FUNCTION public.create_lead_with_neighborhoods(
  p_lead jsonb,
  p_neighborhoods jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lead_id uuid;
  v_count integer;
BEGIN
  IF jsonb_typeof(p_lead) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_neighborhoods) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid lead payload';
  END IF;

  INSERT INTO public.lead_intake
  SELECT (jsonb_populate_record(NULL::public.lead_intake, p_lead)).*
  RETURNING id INTO v_lead_id;

  SELECT count(*) INTO v_count FROM jsonb_array_elements(p_neighborhoods);

  IF v_count > 0 THEN
    INSERT INTO public.lead_neighborhoods
    SELECT (jsonb_populate_record(
      NULL::public.lead_neighborhoods,
      value || jsonb_build_object('lead_id', v_lead_id)
    )).*
    FROM jsonb_array_elements(p_neighborhoods);
  END IF;

  RETURN v_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_lead_with_neighborhoods(jsonb,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_lead_with_neighborhoods(jsonb,jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.create_lead_with_neighborhoods(jsonb,jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_with_neighborhoods(jsonb,jsonb) TO service_role;
