-- VERLO Temporarios: atomic rate limit for authenticated form writes.
-- Manual migration, isolated to temporary_* objects in the existing Supabase project.
BEGIN;
CREATE TABLE IF NOT EXISTS public.temporary_write_rate_limits (
  user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('owner','tenant')),
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  PRIMARY KEY (user_id, action, window_start)
);
ALTER TABLE public.temporary_write_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.temporary_write_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.temporary_take_write_slot(
  p_user_id uuid,
  p_action text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_window timestamptz;
  v_count integer;
BEGIN
  IF p_user_id IS NULL OR p_action NOT IN ('owner','tenant') THEN
    RETURN false;
  END IF;
  v_window := to_timestamp(floor(extract(epoch from now()) / 600) * 600);
  INSERT INTO public.temporary_write_rate_limits (user_id, action, window_start, attempts)
  VALUES (p_user_id, p_action, v_window, 1)
  ON CONFLICT (user_id, action, window_start) DO UPDATE
    SET attempts = public.temporary_write_rate_limits.attempts + 1
    WHERE public.temporary_write_rate_limits.attempts < 5
  RETURNING attempts INTO v_count;
  RETURN v_count IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.temporary_take_write_slot(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.temporary_take_write_slot(uuid,text) TO service_role;
COMMIT;
-- Manual verification: SELECT to_regclass('public.temporary_write_rate_limits') AS rate_table;
