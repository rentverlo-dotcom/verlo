-- Supabase SQL Editor: execute BEFORE LEAD_INTAKE_RATE_LIMIT_ENABLED=true
-- Additive, no changes to matching, lead_intake or existing customer records.
BEGIN;
CREATE TABLE IF NOT EXISTS public.lead_intake_rate_limits (
  client_key text NOT NULL CHECK (client_key ~ '^[a-f0-9]{64}$'),
  window_minutes integer NOT NULL CHECK (window_minutes IN (10, 1440)),
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts > 0),
  PRIMARY KEY (client_key, window_minutes, window_start)
);
ALTER TABLE public.lead_intake_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_intake_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_intake_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.lead_intake_take_rate_slot(p_client_key text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_result integer;
BEGIN
  IF p_client_key IS NULL OR p_client_key !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
  INSERT INTO public.lead_intake_rate_limits (client_key,window_minutes,window_start,attempts)
  VALUES (p_client_key,10,to_timestamp(floor(extract(epoch from now())/600)*600),1)
  ON CONFLICT (client_key,window_minutes,window_start) DO UPDATE
    SET attempts=public.lead_intake_rate_limits.attempts+1
    WHERE public.lead_intake_rate_limits.attempts < 10
  RETURNING attempts INTO v_result;
  IF v_result IS NULL THEN RETURN false; END IF;
  v_result := NULL;
  INSERT INTO public.lead_intake_rate_limits (client_key,window_minutes,window_start,attempts)
  VALUES (p_client_key,1440,to_timestamp(floor(extract(epoch from now())/86400)*86400),1)
  ON CONFLICT (client_key,window_minutes,window_start) DO UPDATE
    SET attempts=public.lead_intake_rate_limits.attempts+1
    WHERE public.lead_intake_rate_limits.attempts < 60
  RETURNING attempts INTO v_result;
  RETURN v_result IS NOT NULL;
END; $$;
REVOKE ALL ON FUNCTION public.lead_intake_take_rate_slot(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lead_intake_take_rate_slot(text) TO service_role;
COMMIT;
-- Periodic optional cleanup: DELETE FROM public.lead_intake_rate_limits WHERE window_start < now() - interval '3 days';
