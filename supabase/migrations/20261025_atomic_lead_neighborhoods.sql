-- Install only after verifying the table schema in the shared Supabase project.
-- Atomic: an exception in either insert rolls back the entire RPC invocation.
-- Not enabled by deployment: ATOMIC_LEAD_INTAKE_ENABLED remains opt-in.
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
  v_lead_id uuid := gen_random_uuid();
  v_count integer;
  v_intent text := p_lead->>'intent';
  v_cols text;
  v_bad_cols text;
BEGIN
  IF jsonb_typeof(p_lead) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_neighborhoods) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid lead payload';
  END IF;

  SELECT count(*) INTO v_count FROM jsonb_array_elements(p_neighborhoods);
  IF v_intent IN ('tenant_search', 'owner_new_listing') AND v_count = 0 THEN
    RAISE EXCEPTION 'Location required for lead intent %', v_intent;
  END IF;

  -- Validate every JSON field against actual table columns before dynamic SQL.
  -- Explicit columns preserve database defaults on fields absent from p_lead.
  SELECT string_agg(k.key, ', ')
    INTO v_bad_cols
  FROM jsonb_object_keys(p_lead || jsonb_build_object('id', v_lead_id)) AS k(key)
  LEFT JOIN pg_catalog.pg_attribute AS a
    ON a.attrelid = 'public.lead_intake'::pg_catalog.regclass
   AND a.attname = k.key
   AND a.attnum > 0
   AND NOT a.attisdropped
   AND a.attgenerated = ''
  WHERE a.attname IS NULL;

  IF v_bad_cols IS NOT NULL THEN
    RAISE EXCEPTION 'Unknown or generated lead fields: %', v_bad_cols;
  END IF;

  SELECT string_agg(format('%I', k.key), ', ' ORDER BY k.key)
    INTO v_cols
  FROM jsonb_object_keys(p_lead || jsonb_build_object('id', v_lead_id)) AS k(key);

  EXECUTE format(
    'INSERT INTO public.lead_intake (%s) SELECT %s FROM jsonb_populate_record(NULL::public.lead_intake, $1) RETURNING id',
    v_cols, v_cols
  )
  INTO v_lead_id
  USING p_lead || jsonb_build_object('id', v_lead_id);

  -- Explicit fields: keep defaults for id/timestamps/other future columns.
  IF v_count > 0 THEN
    INSERT INTO public.lead_neighborhoods (
      lead_id, context, neighborhood_label, neighborhood_slug, position,
      province_id, province_name, municipality_id, municipality_name,
      locality_id, locality_name, latitude, longitude, geo_key
    )
    SELECT
      v_lead_id, n.context, n.neighborhood_label, n.neighborhood_slug, n.position,
      n.province_id, n.province_name, n.municipality_id, n.municipality_name,
      n.locality_id, n.locality_name, n.latitude, n.longitude, n.geo_key
    FROM jsonb_populate_recordset(
      NULL::public.lead_neighborhoods, p_neighborhoods
    ) AS n;
  END IF;

  RETURN v_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_lead_with_neighborhoods(jsonb,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_lead_with_neighborhoods(jsonb,jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.create_lead_with_neighborhoods(jsonb,jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_with_neighborhoods(jsonb,jsonb) TO service_role;
