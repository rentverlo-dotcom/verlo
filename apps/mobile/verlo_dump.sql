--
-- PostgreSQL database dump
--

\restrict DrRINQLndYF8so8P4CmzR7LIqd5mKbvkrM413YXMxfpG29ABO8nHapvLJ8Rk7MZ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: contract_duration; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contract_duration AS ENUM (
    'short_term',
    'monthly',
    '6_months',
    '12_months',
    '24_months'
);


ALTER TYPE public.contract_duration OWNER TO postgres;

--
-- Name: contract_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contract_status AS ENUM (
    'draft',
    'payment_pending',
    'active',
    'signed',
    'cancelled'
);


ALTER TYPE public.contract_status OWNER TO postgres;

--
-- Name: match_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.match_status AS ENUM (
    'interested',
    'contacted',
    'visited',
    'agreed',
    'closed',
    'cancelled'
);


ALTER TYPE public.match_status OWNER TO postgres;

--
-- Name: property_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.property_type AS ENUM (
    'apartment',
    'house',
    'room',
    'hotel_room'
);


ALTER TYPE public.property_type OWNER TO postgres;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: advance_match_on_terms_accept(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.advance_match_on_terms_accept() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_status text;
begin
  -- solo cuando se lockean por primera vez
  if new.locked = true and old.locked = false then

    select status into v_status
    from matches
    where id = new.match_id;

    -- avanzar SOLO al estado permitido por la FSM
    if v_status = 'approved' then
      perform transition_match_status(
        new.match_id,
        'visit_scheduled'
      );
    end if;

  end if;

  return new;
end;
$$;


ALTER FUNCTION public.advance_match_on_terms_accept() OWNER TO postgres;

--
-- Name: allow_final_pdf_only_if_paid(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.allow_final_pdf_only_if_paid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  pay_status text;
begin
  if new.is_final = true then
    select status into pay_status
    from payments
    where contract_id = new.contract_id
      and status = 'paid'
    limit 1;

    if pay_status is null then
      raise exception 'Final PDF not allowed: payment not completed';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.allow_final_pdf_only_if_paid() OWNER TO postgres;

--
-- Name: allow_payment_only_if_contract_signed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.allow_payment_only_if_contract_signed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  c_status text;
begin
  select status into c_status
  from contracts
  where id = new.contract_id;

  if c_status <> 'signed' then
    raise exception 'Payment not allowed: contract not signed';
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.allow_payment_only_if_contract_signed() OWNER TO postgres;

--
-- Name: allow_signature_only_if_payment_started(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.allow_signature_only_if_payment_started() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  pay_exists boolean;
begin
  select exists (
    select 1
    from payments
    where contract_id = new.contract_id
      and status in ('authorized', 'paid')
  )
  into pay_exists;

  if pay_exists = false then
    raise exception 'Signature not allowed: payment not initiated';
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.allow_signature_only_if_payment_started() OWNER TO postgres;

--
-- Name: approve_match(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.approve_match(match_uuid uuid, admin_user uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  update matches
  set
    status = 'approved',
    approved_by = admin_user,
    approved_at = now()
  where id = match_uuid;
end;
$$;


ALTER FUNCTION public.approve_match(match_uuid uuid, admin_user uuid) OWNER TO postgres;

--
-- Name: auto_approve_match(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_approve_match() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  perform transition_match_status(new.id, 'approved');
  return new;
end;
$$;


ALTER FUNCTION public.auto_approve_match() OWNER TO postgres;

--
-- Name: confirm_payment(uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.confirm_payment(payment_uuid uuid, new_status text, provider_payment_ref text) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  update payments
  set
    status = new_status,
    provider_payment_id = provider_payment_ref
  where id = payment_uuid;
end;
$$;


ALTER FUNCTION public.confirm_payment(payment_uuid uuid, new_status text, provider_payment_ref text) OWNER TO postgres;

--
-- Name: create_contract_on_match_started(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_contract_on_match_started() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
declare
  v_terms record;
  v_owner_id uuid;
  v_tenant_id uuid;
  v_owner record;
  v_tenant record;
  v_property record;
  v_html text;
begin
  if new.status <> 'contract_started' then
    return new;
  end if;

  -- términos aceptados
  select *
  into v_terms
  from match_terms
  where match_id = new.id
    and locked = true;

  if not found then
    raise exception 'match_terms not locked';
  end if;

  -- owner / tenant
  select p.owner_id, d.tenant_id
  into v_owner_id, v_tenant_id
  from matches m
  join properties p on p.id = m.property_id
  join demands d on d.id = m.demand_id
  where m.id = new.id;

  -- datos legales
  select * into v_owner
  from user_contract_data
  where user_id = v_owner_id;

  select * into v_tenant
  from user_contract_data
  where user_id = v_tenant_id;

  select * into v_property
  from properties
  where id = new.property_id;

  if v_owner is null or v_tenant is null then
    raise exception 'legal data missing';
  end if;

  v_html := format($f$

<h1 style="text-align:center; font-size:20px; letter-spacing:1px;">
CONTRATO DE LOCACIÓN
</h1>

<p>
En la República Argentina, a los %s, entre
<strong>%s %s</strong>, DNI %s, con domicilio en %s, %s, %s,
en adelante "EL LOCADOR", y
<strong>%s %s</strong>, DNI %s, con domicilio en %s, %s, %s,
en adelante "EL LOCATARIO", se celebra el presente contrato.
</p>

<p><strong>PRIMERA — OBJETO.</strong><br>
El LOCADOR da en locación el inmueble sito en %s,
destinado al uso acordado entre las partes.
</p>

<p><strong>SEGUNDA — PLAZO.</strong><br>
El plazo de la locación será de %s meses,
iniciando el %s y finalizando el %s.
</p>

<p><strong>TERCERA — PRECIO.</strong><br>
El canon locativo mensual será de %s %s.
</p>

<p><strong>CUARTA — DEPÓSITO.</strong><br>
Se entrega en garantía la suma de %s %s.
</p>

<p><strong>QUINTA — ACTUALIZACIÓN.</strong><br>
El precio podrá actualizarse conforme normativa vigente.
</p>

<p><strong>SEXTA — JURISDICCIÓN.</strong><br>
Las partes se someten a los tribunales ordinarios correspondientes al inmueble.
</p>

<p style="margin-top:40px;">
Firmado digitalmente mediante la plataforma VERLO.
</p>

$f$,
  to_char(now(), 'DD "de" Month YYYY'),
  v_owner.first_name,
  v_owner.last_name,
  v_owner.dni,
  v_owner.address,
  v_owner.city,
  v_owner.province,
  v_tenant.first_name,
  v_tenant.last_name,
  v_tenant.dni,
  v_tenant.address,
  v_tenant.city,
  v_tenant.province,
  v_property.address,
  v_terms.duration_months,
  v_terms.start_date,
  v_terms.end_date,
  v_property.currency,
  v_terms.price,
  v_property.currency,
  v_terms.deposit
);

  insert into contracts (
    match_id,
    status,
    content,
    tenant_id,
    owner_id,
    locked
  )
  values (
    new.id,
    'ready_to_sign',
    v_html,
    v_tenant_id,
    v_owner_id,
    true
  )
  on conflict (match_id) do nothing;

  return new;
end;
$_$;


ALTER FUNCTION public.create_contract_on_match_started() OWNER TO postgres;

--
-- Name: create_notification(uuid, text, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_entity text, p_entity_id uuid, p_payload jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  insert into public.notifications (
    user_id,
    type,
    entity,
    entity_id,
    payload
  ) values (
    p_user_id,
    p_type,
    p_entity,
    p_entity_id,
    p_payload
  );
end;
$$;


ALTER FUNCTION public.create_notification(p_user_id uuid, p_type text, p_entity text, p_entity_id uuid, p_payload jsonb) OWNER TO postgres;

--
-- Name: enforce_owner_only_match_terms(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_owner_only_match_terms() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_owner_id uuid;
begin
  select p.owner_id into v_owner_id
  from matches m
  join properties p on p.id = m.property_id
  where m.id = new.match_id;

  if new.proposed_by <> v_owner_id then
    raise exception 'only owner can propose match terms';
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.enforce_owner_only_match_terms() OWNER TO postgres;

--
-- Name: enforce_tenant_acceptance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_tenant_acceptance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_tenant_id uuid;
begin
  select d.tenant_id into v_tenant_id
  from matches m
  join demands d on d.id = m.demand_id
  where m.id = new.match_id;

  if new.accepted_by is not null and new.accepted_by <> v_tenant_id then
    raise exception 'only tenant can accept match terms';
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.enforce_tenant_acceptance() OWNER TO postgres;

--
-- Name: get_enums(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_enums() RETURNS json
    LANGUAGE sql
    AS $$
select json_build_object(
  'property_types',
  enum_range(null::property_type),
  'contract_durations',
  enum_range(null::contract_duration)
);
$$;


ALTER FUNCTION public.get_enums() OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, created_at)
  values (new.id, now())
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: increment_session(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_session() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  current_sessions bigint;
begin
  update public.site_stats
  set value = value + 1
  where key = 'session_count'
  returning value into current_sessions;

  if (current_sessions % 5 = 0) then
    update public.site_stats
    set value = value + floor(random() * 3 + 1)
    where key = 'properties_count';
  end if;
end;
$$;


ALTER FUNCTION public.increment_session() OWNER TO postgres;

--
-- Name: lock_contract_on_sign(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lock_contract_on_sign() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.status = 'signed' and old.status <> 'signed' then
    new.signed_at := now();
    new.locked := true;
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.lock_contract_on_sign() OWNER TO postgres;

--
-- Name: lock_contract_when_fully_signed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lock_contract_when_fully_signed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  sig_count integer;
begin
  select count(distinct role)
  into sig_count
  from signature_events
  where contract_id = new.contract_id;

  if sig_count >= 2 then
    update contracts
    set
      status = 'signed',
      locked = true,
      signed_at = now()
    where id = new.contract_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.lock_contract_when_fully_signed() OWNER TO postgres;

--
-- Name: lock_match_terms_on_accept(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lock_match_terms_on_accept() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.accepted_by is not null
     and old.accepted_by is null then
    new.locked := true;
    new.accepted_at := now();
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.lock_match_terms_on_accept() OWNER TO postgres;

--
-- Name: log_payment_event(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_payment_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  insert into audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    created_at
  )
  values (
    null,
    'payment_status_changed',
    'payment',
    new.id,
    now()
  );

  return new;
end;
$$;


ALTER FUNCTION public.log_payment_event() OWNER TO postgres;

--
-- Name: notify_contract_created(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_contract_created() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_tenant uuid;
  v_owner uuid;
begin
  select d.tenant_id
  into v_tenant
  from matches m
  join demands d on d.id = m.demand_id
  where m.id = new.match_id;

  select p.owner_id
  into v_owner
  from matches m
  join properties p on p.id = m.property_id
  where m.id = new.match_id;

  perform create_notification(
    v_tenant,
    'contract_created',
    'contract',
    new.id,
    null
  );

  perform create_notification(
    v_owner,
    'contract_created',
    'contract',
    new.id,
    null
  );

  return new;
end;
$$;


ALTER FUNCTION public.notify_contract_created() OWNER TO postgres;

--
-- Name: notify_contract_signed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_contract_signed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.status <> 'signed' and new.status = 'signed' then
    perform notify_contract_created();
  end if;
  return new;
end;
$$;


ALTER FUNCTION public.notify_contract_signed() OWNER TO postgres;

--
-- Name: notify_match_contact_enabled(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_match_contact_enabled() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  -- Solo cuando entra a visit_scheduled
  if new.status = 'visit_scheduled'
     and old.status is distinct from new.status then

    perform pg_notify(
      'match_contact_enabled',
      json_build_object(
        'match_id', new.id,
        'property_id', new.property_id,
        'demand_id', new.demand_id
      )::text
    );

  end if;

  return new;
end;
$$;


ALTER FUNCTION public.notify_match_contact_enabled() OWNER TO postgres;

--
-- Name: notify_match_created(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_match_created() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- notificar inquilino
  insert into notification_events (
    event_type,
    user_id,
    entity,
    entity_id,
    payload
  )
  values (
    'match_created',
    (select tenant_id from demands where id = new.demand_id),
    'match',
    new.id,
    jsonb_build_object(
      'property_id', new.property_id
    )
  );

  -- notificar propietario
  insert into notification_events (
    event_type,
    user_id,
    entity,
    entity_id,
    payload
  )
  values (
    'match_created',
    (select owner_id from properties where id = new.property_id),
    'match',
    new.id,
    jsonb_build_object(
      'demand_id', new.demand_id
    )
  );

  return new;
end;
$$;


ALTER FUNCTION public.notify_match_created() OWNER TO postgres;

--
-- Name: notify_payment_completed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_payment_completed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.status = 'paid' and old.status <> 'paid' then
    insert into notification_events (
      event_type,
      user_id,
      entity,
      entity_id,
      payload
    )
    values (
      'payment_completed',
      null,
      'payment',
      new.id,
      jsonb_build_object(
        'contract_id', new.contract_id
      )
    );
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.notify_payment_completed() OWNER TO postgres;

--
-- Name: notify_payment_created(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_payment_created() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_owner uuid;
begin
  select p.owner_id
  into v_owner
  from contracts c
  join matches m on m.id = c.match_id
  join properties p on p.id = m.property_id
  where c.id = new.contract_id;

  perform create_notification(
    v_owner,
    'payment_created',
    'payment',
    new.id,
    jsonb_build_object(
      'amount', new.amount,
      'currency', new.currency
    )
  );

  return new;
end;
$$;


ALTER FUNCTION public.notify_payment_created() OWNER TO postgres;

--
-- Name: notify_payment_paid(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_payment_paid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.status <> 'paid' and new.status = 'paid' then
    perform notify_payment_created();
  end if;
  return new;
end;
$$;


ALTER FUNCTION public.notify_payment_paid() OWNER TO postgres;

--
-- Name: prevent_contract_update_when_locked(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_contract_update_when_locked() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.locked = true then
    raise exception 'Contract is locked and cannot be modified';
  end if;
  return new;
end;
$$;


ALTER FUNCTION public.prevent_contract_update_when_locked() OWNER TO postgres;

--
-- Name: prevent_final_pdf_mutation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_final_pdf_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.is_final = true then
    raise exception 'Final PDF is immutable';
  end if;

  return old;
end;
$$;


ALTER FUNCTION public.prevent_final_pdf_mutation() OWNER TO postgres;

--
-- Name: prevent_update_locked_contract(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_update_locked_contract() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.locked = true then
    raise exception 'Contract is locked and cannot be modified';
  end if;
  return new;
end;
$$;


ALTER FUNCTION public.prevent_update_locked_contract() OWNER TO postgres;

--
-- Name: prevent_update_locked_match_terms(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_update_locked_match_terms() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.locked = true then
    raise exception 'match terms are locked and cannot be modified';
  end if;

  return new;
end;
$$;


ALTER FUNCTION public.prevent_update_locked_match_terms() OWNER TO postgres;

--
-- Name: run_auto_matching(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.run_auto_matching() RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  /*
    ⚠️ CRITERIOS DE MATCH VAN ACÁ (MÁS ADELANTE)
    Por ahora:
    - estructura
    - deduplicación
    - inserción segura
  */

  insert into matches (
    property_id,
    demand_id,
    status,
    created_by,
    created_at
  )
  select
    p.id as property_id,
    d.id as demand_id,
    'pending' as status,
    'system' as created_by,
    now()
  from properties p
  join demands d
    on true
  where
    p.available = true
    -- ⬇️ futuros criterios:
    -- and p.city = d.city
    -- and p.price between d.min_price and d.max_price

    -- evitar duplicados
    and not exists (
      select 1
      from matches m
      where m.property_id = p.id
        and m.demand_id = d.id
    );
end;
$$;


ALTER FUNCTION public.run_auto_matching() OWNER TO postgres;

--
-- Name: transition_match_status(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.transition_match_status(p_match_id uuid, p_new_status text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$declare
  v_current_status text;
  v_tenant_id uuid;
begin

  -- Estado actual
  select status into v_current_status
  from matches
  where id = p_match_id;

  if v_current_status is null then
    raise exception 'match not found';
  end if;

  -- Tenant del match
  select d.tenant_id into v_tenant_id
  from matches m
  join demands d on d.id = m.demand_id
  where m.id = p_match_id;

  -------------------------------------------------
  -- TRANSICIONES
  -------------------------------------------------

  -- PENDING → APPROVED
  if v_current_status = 'pending' and p_new_status = 'approved' then

    update matches
    set status = 'approved'
    where id = p_match_id;

  -- APPROVED → VISIT_SCHEDULED
  elsif v_current_status = 'approved' and p_new_status = 'visit_scheduled' then

    -- 🔐 GATE IDENTIDAD (TRUORA)
    if not exists (
      select 1
      from identity_verifications
      where subject_type = 'user'
        and subject_id = v_tenant_id
        and status = 'verified'
    ) then
      raise exception 'identity not verified';
    end if;

    -- 🔐 GATE DOCUMENTOS FINANCIEROS
    if not exists (
      select 1
      from tenant_financial_documents
      where tenant_id = v_tenant_id
    ) then
      raise exception 'financial documents missing';
    end if;

    update matches
    set status = 'visit_scheduled'
    where id = p_match_id;

  -- VISIT_SCHEDULED → CONTRACT_STARTED
  elsif v_current_status = 'visit_scheduled' and p_new_status = 'contract_started' then

    update matches
    set status = 'contract_started'
    where id = p_match_id;

  -- CONTRACT_STARTED → SIGNED
  elsif v_current_status = 'contract_started' and p_new_status = 'signed' then

    update matches
    set status = 'signed'
    where id = p_match_id;

  else
    raise exception 'invalid transition: % -> %', v_current_status, p_new_status;
  end if;

end;$$;


ALTER FUNCTION public.transition_match_status(p_match_id uuid, p_new_status text) OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity text,
    entity_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: contract_signatures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_signatures (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    contract_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    signed boolean DEFAULT false NOT NULL,
    signed_at timestamp with time zone,
    signature_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contract_signatures_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'tenant'::text])))
);


ALTER TABLE public.contract_signatures OWNER TO postgres;

--
-- Name: contract_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_versions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    contract_id uuid NOT NULL,
    version_number integer NOT NULL,
    content text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contract_versions OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    match_id uuid NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    content text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    locked boolean DEFAULT true NOT NULL,
    tenant_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    payment_id uuid,
    tenant_signature text,
    owner_signature text,
    tenant_signed_ip text,
    owner_signed_ip text,
    tenant_signed_user_agent text,
    owner_signed_user_agent text,
    contract_hash text,
    CONSTRAINT contracts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'ready_to_sign'::text, 'signed'::text])))
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: contracts_debug; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.contracts_debug AS
 SELECT id,
    match_id,
    status,
    content,
    signed_at,
    created_at,
    locked,
    tenant_id,
    owner_id,
    payment_id
   FROM public.contracts
  WHERE (match_id = '1ce51c12-225d-47f9-af73-3865b3feeae8'::uuid);


ALTER VIEW public.contracts_debug OWNER TO postgres;

--
-- Name: demands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.demands (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    city text,
    min_price numeric,
    max_price numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    zone text,
    preferred_property_types public.property_type[],
    preferred_durations public.contract_duration[],
    furnished_preference boolean,
    pets_preference boolean,
    notes text
);


ALTER TABLE public.demands OWNER TO postgres;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    property_id uuid NOT NULL,
    demand_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    CONSTRAINT matches_created_by_check CHECK ((created_by = ANY (ARRAY['system'::text, 'admin'::text]))),
    CONSTRAINT matches_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'visit_scheduled'::text, 'contract_started'::text, 'signed'::text])))
);


ALTER TABLE public.matches OWNER TO postgres;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    owner_id uuid NOT NULL,
    title text,
    description text,
    address text,
    city text,
    price numeric,
    available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    property_type public.property_type DEFAULT 'apartment'::public.property_type NOT NULL,
    zone text,
    currency text DEFAULT 'ARS'::text NOT NULL,
    expenses_included boolean DEFAULT false,
    deposit_required boolean DEFAULT false,
    available_from date,
    allowed_durations public.contract_duration[] DEFAULT '{}'::public.contract_duration[] NOT NULL,
    publish_status text DEFAULT 'draft'::text NOT NULL,
    furnished boolean DEFAULT false,
    pets_allowed boolean DEFAULT false,
    services text[],
    sqm integer,
    short_description text
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: demands_visible_to_owner; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.demands_visible_to_owner WITH (security_invoker='true') AS
 SELECT d.id,
    d.city,
    d.min_price,
    d.max_price,
    d.tenant_id
   FROM ((public.demands d
     JOIN public.matches m ON ((m.demand_id = d.id)))
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE (p.owner_id = auth.uid());


ALTER VIEW public.demands_visible_to_owner OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    contract_id uuid,
    file_path text NOT NULL,
    type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_final boolean DEFAULT false NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: identity_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.identity_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    doc_type text NOT NULL,
    file_path text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.identity_documents OWNER TO postgres;

--
-- Name: identity_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.identity_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_type text NOT NULL,
    subject_id uuid NOT NULL,
    provider text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    verified_at timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT identity_verifications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'verified'::text, 'failed'::text]))),
    CONSTRAINT identity_verifications_subject_type_check CHECK ((subject_type = ANY (ARRAY['anonymous'::text, 'user'::text])))
);


ALTER TABLE public.identity_verifications OWNER TO postgres;

--
-- Name: match_guarantee_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_guarantee_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    demand_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT match_guarantee_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.match_guarantee_reviews OWNER TO postgres;

--
-- Name: match_terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_terms (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    match_id uuid NOT NULL,
    price numeric NOT NULL,
    deposit numeric NOT NULL,
    expenses_included boolean DEFAULT false NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    duration_months integer NOT NULL,
    proposed_by uuid NOT NULL,
    accepted_by uuid,
    accepted_at timestamp with time zone,
    locked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT match_terms_dates_check CHECK ((end_date > start_date)),
    CONSTRAINT match_terms_duration_check CHECK ((duration_months > 0))
);


ALTER TABLE public.match_terms OWNER TO postgres;

--
-- Name: matching_candidates; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.matching_candidates AS
 SELECT d.id AS demand_id,
    p.id AS property_id,
    p.price,
    p.city,
    p.zone,
    p.property_type,
    p.allowed_durations
   FROM (public.demands d
     JOIN public.properties p ON (((p.city = d.city) AND ((p.price >= d.min_price) AND (p.price <= d.max_price)) AND ((d.preferred_property_types IS NULL) OR (p.property_type = ANY (d.preferred_property_types))) AND ((d.preferred_durations IS NULL) OR (p.allowed_durations && d.preferred_durations)))))
  WHERE ((p.available = true) AND (p.publish_status = 'published'::text));


ALTER VIEW public.matching_candidates OWNER TO postgres;

--
-- Name: metric_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metric_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    entity text,
    entity_id uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.metric_events OWNER TO postgres;

--
-- Name: municipalities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.municipalities (
    id text NOT NULL,
    province_id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.municipalities OWNER TO postgres;

--
-- Name: neighborhoods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.neighborhoods (
    id text NOT NULL,
    municipality_id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.neighborhoods OWNER TO postgres;

--
-- Name: notification_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    event_type text NOT NULL,
    user_id uuid,
    entity text,
    entity_id uuid,
    payload jsonb,
    processed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notification_events OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    entity text NOT NULL,
    entity_id uuid NOT NULL,
    payload jsonb,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: owner_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.owner_dashboard AS
 SELECT p.id AS property_id,
    p.title AS property_title,
    p.city,
    p.price,
    m.id AS match_id,
    m.status AS match_status,
    c.id AS contract_id,
    c.status AS contract_status,
    c.created_at AS contract_created_at
   FROM ((public.properties p
     LEFT JOIN public.matches m ON ((m.property_id = p.id)))
     LEFT JOIN public.contracts c ON ((c.match_id = m.id)));


ALTER VIEW public.owner_dashboard OWNER TO postgres;

--
-- Name: owner_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.owner_profiles (
    id uuid NOT NULL,
    display_name text,
    is_company boolean DEFAULT false,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.owner_profiles OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    contract_id uuid NOT NULL,
    provider text,
    provider_payment_id text,
    amount numeric NOT NULL,
    currency text DEFAULT 'ARS'::text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'authorized'::text, 'paid'::text, 'failed'::text])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    phone text,
    role text DEFAULT 'tenant'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['tenant'::text, 'owner'::text, 'both'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: property_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT property_media_type_check CHECK ((type = ANY (ARRAY['photo'::text, 'video'::text, 'pdf'::text])))
);


ALTER TABLE public.property_media OWNER TO postgres;

--
-- Name: properties_feed; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.properties_feed AS
 SELECT p.id,
    p.title,
    p.description,
    p.address,
    p.city,
    p.price,
    p.currency,
    pm.url AS image_url
   FROM (public.properties p
     LEFT JOIN public.property_media pm ON ((pm.property_id = p.id)))
  WHERE (p.available = true);


ALTER VIEW public.properties_feed OWNER TO postgres;

--
-- Name: properties_visible_to_tenant; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.properties_visible_to_tenant AS
 SELECT id,
    title,
    description,
    city,
    zone,
    price,
    currency,
    property_type,
    allowed_durations,
    furnished,
    pets_allowed,
    services,
    created_at
   FROM public.properties p
  WHERE ((available = true) AND (publish_status = 'published'::text));


ALTER VIEW public.properties_visible_to_tenant OWNER TO postgres;

--
-- Name: property_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_actions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    property_id uuid NOT NULL,
    action text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT property_actions_action_check CHECK ((action = ANY (ARRAY['like'::text, 'dislike'::text, 'save'::text])))
);


ALTER TABLE public.property_actions OWNER TO postgres;

--
-- Name: property_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    doc_type text NOT NULL,
    file_url text NOT NULL,
    is_private boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.property_documents OWNER TO postgres;

--
-- Name: property_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    property_id uuid NOT NULL,
    match_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    action text,
    CONSTRAINT property_likes_action_check CHECK ((action = ANY (ARRAY['like'::text, 'dislike'::text])))
);


ALTER TABLE public.property_likes OWNER TO postgres;

--
-- Name: property_private; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_private (
    property_id uuid NOT NULL,
    address text,
    phone text,
    first_name text,
    last_name text,
    email text
);


ALTER TABLE public.property_private OWNER TO postgres;

--
-- Name: provinces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provinces (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.provinces OWNER TO postgres;

--
-- Name: signature_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signature_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    contract_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    ip_address inet,
    user_agent text,
    signed_at timestamp with time zone DEFAULT now() NOT NULL,
    signature_hash text NOT NULL,
    CONSTRAINT signature_events_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'tenant'::text])))
);


ALTER TABLE public.signature_events OWNER TO postgres;

--
-- Name: site_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_stats (
    key text NOT NULL,
    value bigint NOT NULL
);


ALTER TABLE public.site_stats OWNER TO postgres;

--
-- Name: tenant_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.tenant_dashboard AS
 SELECT p.title AS property_title,
    p.city,
    p.price,
    c.id AS contract_id,
    c.status AS contract_status,
    c.created_at AS contract_created_at
   FROM (((public.demands d
     LEFT JOIN public.matches m ON ((m.demand_id = d.id)))
     LEFT JOIN public.properties p ON ((p.id = m.property_id)))
     LEFT JOIN public.contracts c ON ((c.match_id = m.id)));


ALTER VIEW public.tenant_dashboard OWNER TO postgres;

--
-- Name: tenant_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    demand_id uuid NOT NULL,
    doc_type text NOT NULL,
    file_url text NOT NULL,
    is_private boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_documents OWNER TO postgres;

--
-- Name: tenant_financial_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_financial_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    doc_type text NOT NULL,
    file_url text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tenant_financial_documents OWNER TO postgres;

--
-- Name: tenant_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_profiles (
    id uuid NOT NULL,
    min_budget numeric,
    max_budget numeric,
    preferred_city text,
    preferred_property_types text[],
    preferred_durations text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_profiles OWNER TO postgres;

--
-- Name: user_contract_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_contract_data (
    user_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dni text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    province text NOT NULL,
    country text DEFAULT 'Argentina'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_contract_data OWNER TO postgres;

--
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    property_id uuid NOT NULL,
    type text,
    status text DEFAULT 'requested'::text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT visits_type_check CHECK ((type = ANY (ARRAY['presencial'::text, 'video'::text])))
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
0184435c-b52f-42bf-a570-dd49213d6b74	0184435c-b52f-42bf-a570-dd49213d6b74	{"sub": "0184435c-b52f-42bf-a570-dd49213d6b74", "email": "juancho12oddone@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-02-10 22:02:44.599301+00	2026-02-10 22:02:44.599346+00	2026-02-10 22:02:44.599346+00	7583a607-9c6a-4b11-9c5d-b918e761aef4
d596883b-69db-4548-b617-d7c238a3893e	d596883b-69db-4548-b617-d7c238a3893e	{"sub": "d596883b-69db-4548-b617-d7c238a3893e", "email": "juanoddone29@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-02-10 22:06:10.209143+00	2026-02-10 22:06:10.2092+00	2026-02-10 22:06:10.2092+00	2738e17b-0c6c-4fdc-a203-628fc07f28bd
c017848b-1394-4816-9707-eb4bbb5ff17e	c017848b-1394-4816-9707-eb4bbb5ff17e	{"sub": "c017848b-1394-4816-9707-eb4bbb5ff17e", "email": "allaccessorios@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-01-07 16:06:50.3322+00	2026-01-07 16:06:50.332255+00	2026-01-07 16:06:50.332255+00	108402ab-4d91-488a-9d57-c2367b77d805
d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	{"sub": "d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe", "email": "aedevincenzi@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-01-07 16:07:38.327965+00	2026-01-07 16:07:38.32801+00	2026-01-07 16:07:38.32801+00	1612c705-7249-416c-9f5c-791e336ea4a2
8caed6b1-d571-4445-979b-21b70f02c73d	8caed6b1-d571-4445-979b-21b70f02c73d	{"sub": "8caed6b1-d571-4445-979b-21b70f02c73d", "email": "rentverlo@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-02-25 12:06:34.944542+00	2026-02-25 12:06:34.944594+00	2026-02-25 12:06:34.944594+00	52735f6d-f590-4b13-a92f-4033c842fbf5
7cdfe6a9-1ac6-4dcd-9565-444946243ebb	7cdfe6a9-1ac6-4dcd-9565-444946243ebb	{"sub": "7cdfe6a9-1ac6-4dcd-9565-444946243ebb", "email": "juanmanueloddone74@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-02-25 02:24:47.537069+00	2026-02-25 02:24:47.537123+00	2026-02-25 02:24:47.537123+00	f1627fae-5c43-471b-aff1-94f69ccb8f46
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
5d74243c-30a7-4199-8cdc-23c6fbfd4731	2026-02-25 14:23:41.768217+00	2026-02-25 14:23:41.768217+00	otp	45a6b5d6-cb76-4803-928a-28a27df7978b
188bcd44-9e57-4de6-b64a-9319972a2382	2026-02-26 21:50:41.874595+00	2026-02-26 21:50:41.874595+00	otp	8f3de17b-72f2-4fe4-b87a-6632f57abac7
de46d756-9fcf-4144-9a40-1657cea64bd3	2026-02-10 22:06:34.839251+00	2026-02-10 22:06:34.839251+00	otp	a6b15ff9-df96-452d-8ae9-be9321f54d5e
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	129	xsroievuqvs2	d596883b-69db-4548-b617-d7c238a3893e	t	2026-02-10 22:06:34.826112+00	2026-02-11 00:28:39.016222+00	\N	de46d756-9fcf-4144-9a40-1657cea64bd3
00000000-0000-0000-0000-000000000000	181	ti7c7zyhozxx	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-25 16:44:37.201977+00	2026-02-25 17:51:37.778079+00	vemikceinvgx	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	183	axh555mcygck	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-25 17:51:37.807153+00	2026-02-25 19:18:15.893628+00	ti7c7zyhozxx	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	130	ttbqgo2xxq76	d596883b-69db-4548-b617-d7c238a3893e	t	2026-02-11 00:28:39.046784+00	2026-02-11 13:26:02.235389+00	xsroievuqvs2	de46d756-9fcf-4144-9a40-1657cea64bd3
00000000-0000-0000-0000-000000000000	133	ilcvnczrjdqz	d596883b-69db-4548-b617-d7c238a3893e	t	2026-02-11 13:26:02.247882+00	2026-02-11 14:41:40.782239+00	ttbqgo2xxq76	de46d756-9fcf-4144-9a40-1657cea64bd3
00000000-0000-0000-0000-000000000000	184	3hzrhmu4xjub	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-25 19:18:15.921342+00	2026-02-25 20:19:06.493503+00	axh555mcygck	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	134	6lb4yxdvhgjb	d596883b-69db-4548-b617-d7c238a3893e	t	2026-02-11 14:41:40.817569+00	2026-02-11 15:49:50.608152+00	ilcvnczrjdqz	de46d756-9fcf-4144-9a40-1657cea64bd3
00000000-0000-0000-0000-000000000000	136	zj3to7gg3tiu	d596883b-69db-4548-b617-d7c238a3893e	t	2026-02-11 15:49:50.629075+00	2026-02-11 20:21:54.582914+00	6lb4yxdvhgjb	de46d756-9fcf-4144-9a40-1657cea64bd3
00000000-0000-0000-0000-000000000000	185	pnyxzuqrjqal	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-25 20:19:06.51897+00	2026-02-26 12:46:41.015618+00	3hzrhmu4xjub	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	137	yyjetqtqv3qs	d596883b-69db-4548-b617-d7c238a3893e	t	2026-02-11 20:21:54.602328+00	2026-02-12 00:22:45.273599+00	zj3to7gg3tiu	de46d756-9fcf-4144-9a40-1657cea64bd3
00000000-0000-0000-0000-000000000000	142	mpb222qkl2cp	d596883b-69db-4548-b617-d7c238a3893e	f	2026-02-12 00:22:45.310123+00	2026-02-12 00:22:45.310123+00	yyjetqtqv3qs	de46d756-9fcf-4144-9a40-1657cea64bd3
00000000-0000-0000-0000-000000000000	188	vkuyt6qak6hf	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-26 12:46:41.017137+00	2026-02-26 13:58:51.802596+00	pnyxzuqrjqal	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	189	7t6dexfuvc5d	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-26 13:58:51.814841+00	2026-02-26 15:03:08.800335+00	vkuyt6qak6hf	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	190	covn5tuzregf	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-26 15:03:08.821089+00	2026-02-26 17:26:46.364588+00	7t6dexfuvc5d	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	191	oi6k7aq4n3wp	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-26 17:26:46.370573+00	2026-02-26 19:48:01.46771+00	covn5tuzregf	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	194	mxmoyfj27w6m	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-26 19:48:01.481958+00	2026-02-26 21:27:00.59926+00	oi6k7aq4n3wp	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	197	2aw4jfa6sgko	0184435c-b52f-42bf-a570-dd49213d6b74	t	2026-02-26 21:50:41.868124+00	2026-02-27 04:50:31.671468+00	\N	188bcd44-9e57-4de6-b64a-9319972a2382
00000000-0000-0000-0000-000000000000	198	2po5ceedlfji	0184435c-b52f-42bf-a570-dd49213d6b74	t	2026-02-27 04:50:31.710606+00	2026-02-27 11:16:35.553768+00	2aw4jfa6sgko	188bcd44-9e57-4de6-b64a-9319972a2382
00000000-0000-0000-0000-000000000000	199	mhhkhrs73bv3	0184435c-b52f-42bf-a570-dd49213d6b74	t	2026-02-27 11:16:35.578906+00	2026-02-27 12:31:11.174066+00	2po5ceedlfji	188bcd44-9e57-4de6-b64a-9319972a2382
00000000-0000-0000-0000-000000000000	196	s7agjjlk4q23	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-26 21:27:00.605942+00	2026-02-27 13:53:02.549089+00	mxmoyfj27w6m	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	200	ht4zfk4qcemc	0184435c-b52f-42bf-a570-dd49213d6b74	t	2026-02-27 12:31:11.191088+00	2026-02-27 16:21:41.269338+00	mhhkhrs73bv3	188bcd44-9e57-4de6-b64a-9319972a2382
00000000-0000-0000-0000-000000000000	202	hs5qcjstn3b2	0184435c-b52f-42bf-a570-dd49213d6b74	t	2026-02-27 16:21:41.290213+00	2026-02-27 19:34:23.672441+00	ht4zfk4qcemc	188bcd44-9e57-4de6-b64a-9319972a2382
00000000-0000-0000-0000-000000000000	203	7sahj2fqrbiv	0184435c-b52f-42bf-a570-dd49213d6b74	f	2026-02-27 19:34:23.688164+00	2026-02-27 19:34:23.688164+00	hs5qcjstn3b2	188bcd44-9e57-4de6-b64a-9319972a2382
00000000-0000-0000-0000-000000000000	201	nqruozbsnlxd	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-27 13:53:02.580326+00	2026-02-27 20:18:38.447628+00	s7agjjlk4q23	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	204	x7ifxm4l6prq	8caed6b1-d571-4445-979b-21b70f02c73d	f	2026-02-27 20:18:38.474869+00	2026-02-27 20:18:38.474869+00	nqruozbsnlxd	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	178	syraimufsotj	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-25 14:23:41.76307+00	2026-02-25 15:43:44.738988+00	\N	5d74243c-30a7-4199-8cdc-23c6fbfd4731
00000000-0000-0000-0000-000000000000	179	vemikceinvgx	8caed6b1-d571-4445-979b-21b70f02c73d	t	2026-02-25 15:43:44.773908+00	2026-02-25 16:44:37.178036+00	syraimufsotj	5d74243c-30a7-4199-8cdc-23c6fbfd4731
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
de46d756-9fcf-4144-9a40-1657cea64bd3	d596883b-69db-4548-b617-d7c238a3893e	2026-02-10 22:06:34.810806+00	2026-02-12 00:22:45.342339+00	\N	aal1	\N	2026-02-12 00:22:45.342219	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	104.28.217.121	\N	\N	\N	\N	\N
188bcd44-9e57-4de6-b64a-9319972a2382	0184435c-b52f-42bf-a570-dd49213d6b74	2026-02-26 21:50:41.860963+00	2026-02-27 19:34:23.708824+00	\N	aal1	\N	2026-02-27 19:34:23.708701	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	104.28.152.12	\N	\N	\N	\N	\N
5d74243c-30a7-4199-8cdc-23c6fbfd4731	8caed6b1-d571-4445-979b-21b70f02c73d	2026-02-25 14:23:41.739608+00	2026-02-27 20:18:38.502094+00	\N	aal1	\N	2026-02-27 20:18:38.501341	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	104.28.152.12	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	0184435c-b52f-42bf-a570-dd49213d6b74	authenticated	authenticated	juancho12oddone@gmail.com	$2a$10$.pbaB5H.4rFBQ.embLL6sOB2qp1iHh0jaYLefGKEi..Qpq/P/EiD6	2026-02-10 22:02:54.76848+00	\N		\N		2026-02-26 21:50:27.224944+00			\N	2026-02-26 21:50:41.860831+00	{"provider": "email", "providers": ["email"]}	{"sub": "0184435c-b52f-42bf-a570-dd49213d6b74", "email": "juancho12oddone@gmail.com", "has_password": true, "email_verified": true, "phone_verified": false}	\N	2026-02-10 22:02:44.596475+00	2026-02-27 19:34:23.695368+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8caed6b1-d571-4445-979b-21b70f02c73d	authenticated	authenticated	rentverlo@gmail.com	$2a$10$6H2vtXubzPqbAUkRfhsOpOOMO.xOuwUglFRl3A0V9dsQ69cFGGT6i	2026-02-25 12:06:43.148382+00	\N		\N		2026-02-25 14:23:29.208031+00			\N	2026-02-25 14:23:41.736668+00	{"provider": "email", "providers": ["email"]}	{"sub": "8caed6b1-d571-4445-979b-21b70f02c73d", "email": "rentverlo@gmail.com", "has_password": true, "email_verified": true, "phone_verified": false}	\N	2026-02-25 12:06:34.89824+00	2026-02-27 20:18:38.488633+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	c017848b-1394-4816-9707-eb4bbb5ff17e	authenticated	authenticated	allaccessorios@gmail.com	$2a$10$sZw.A0hU6qbuCjnYe7ykd.1CptTt2HV0iCJsxJREBtqO7i6nRCir.	2026-01-07 16:07:07.986007+00	\N		2026-01-07 16:06:50.338928+00		\N			\N	2026-01-07 16:07:07.990501+00	{"provider": "email", "providers": ["email"]}	{"sub": "c017848b-1394-4816-9707-eb4bbb5ff17e", "email": "allaccessorios@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-01-07 16:06:50.319118+00	2026-01-07 16:07:07.998813+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	authenticated	authenticated	aedevincenzi@gmail.com	$2a$10$0q/.ZVoHaKiduOhLsI4zRO/QY1KSmQ5y.xwc98OamjSyhMfwu9/pm	2026-01-07 16:07:54.661738+00	\N		\N		\N			\N	2026-01-07 16:07:54.665426+00	{"provider": "email", "providers": ["email"]}	{"sub": "d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe", "email": "aedevincenzi@gmail.com", "has_password": true, "email_verified": true, "phone_verified": false}	\N	2026-01-07 16:07:38.325272+00	2026-01-08 14:31:24.237418+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7cdfe6a9-1ac6-4dcd-9565-444946243ebb	authenticated	authenticated	juanmanueloddone74@gmail.com	$2a$10$Kkt9.cCRcE4LALHf9SCa0e.dxxtYdB3aneDj9I.zcTvFtzeG6iM.K	2026-02-25 02:24:58.283642+00	\N		2026-02-25 02:24:47.545859+00		\N			\N	2026-02-25 02:24:58.287733+00	{"provider": "email", "providers": ["email"]}	{"sub": "7cdfe6a9-1ac6-4dcd-9565-444946243ebb", "email": "juanmanueloddone74@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-02-25 02:24:47.526321+00	2026-02-25 13:03:10.40769+00	\N	\N			\N		0	\N		\N	f	\N	f
\N	11111111-1111-1111-1111-111111111111	\N	\N	owner@test.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N			\N		0	\N		\N	f	\N	f
\N	22222222-2222-2222-2222-222222222222	\N	\N	tenant@test.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d596883b-69db-4548-b617-d7c238a3893e	authenticated	authenticated	juanoddone29@gmail.com	$2a$10$Set2vmQZgC1U5gaQfVgkLeC6IAJIH/8OZ2i0R4JdbfIXd1ikDWILi	2026-02-10 22:06:34.80476+00	\N		2026-02-10 22:06:10.215816+00		\N			\N	2026-02-10 22:06:34.810706+00	{"provider": "email", "providers": ["email"]}	{"sub": "d596883b-69db-4548-b617-d7c238a3893e", "email": "juanoddone29@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-02-10 22:06:10.150303+00	2026-02-12 00:22:45.325291+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity, entity_id, created_at) FROM stdin;
\.


--
-- Data for Name: contract_signatures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_signatures (id, contract_id, user_id, role, signed, signed_at, signature_hash, created_at) FROM stdin;
\.


--
-- Data for Name: contract_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_versions (id, contract_id, version_number, content, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (id, match_id, status, content, signed_at, created_at, locked, tenant_id, owner_id, payment_id, tenant_signature, owner_signature, tenant_signed_ip, owner_signed_ip, tenant_signed_user_agent, owner_signed_user_agent, contract_hash) FROM stdin;
8fbda15a-ae7b-4054-a6cf-76acb8af4fa9	bc44662b-be18-415c-96c5-1278fcbdeef2	ready_to_sign	<h1>Contrato generado manualmente</h1>	\N	2026-02-11 23:46:54.421456+00	t	d596883b-69db-4548-b617-d7c238a3893e	0184435c-b52f-42bf-a570-dd49213d6b74	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: demands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.demands (id, tenant_id, city, min_price, max_price, created_at, zone, preferred_property_types, preferred_durations, furnished_preference, pets_preference, notes) FROM stdin;
159b2db0-b1d7-43f7-b777-2215fbe36887	c017848b-1394-4816-9707-eb4bbb5ff17e	\N	\N	\N	2026-01-17 01:39:21.651138+00	\N	\N	\N	\N	\N	\N
bcbc3767-017f-4b31-a2c0-21013132c7e8	22222222-2222-2222-2222-222222222222	Buenos Aires	400	600	2026-02-07 22:10:26.060109+00	\N	\N	\N	\N	\N	\N
4667c5d1-202c-4374-890c-e86c418c996d	22222222-2222-2222-2222-222222222222	Buenos Aires	400	600	2026-02-09 01:14:32.409534+00	\N	\N	\N	\N	\N	\N
8bd673bc-f137-440e-bdcb-72b6a450a6f3	d596883b-69db-4548-b617-d7c238a3893e	Ciudad Autónoma de Buenos Aires	120000	200000	2026-02-11 00:36:35.736979+00	\N	{apartment}	{24_months}	t	t	222
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, contract_id, file_path, type, created_at, is_final) FROM stdin;
\.


--
-- Data for Name: identity_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.identity_documents (id, user_id, doc_type, file_path, status, reviewed_by, reviewed_at, rejection_reason, created_at) FROM stdin;
\.


--
-- Data for Name: identity_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.identity_verifications (id, subject_type, subject_id, provider, status, verified_at, metadata, created_at) FROM stdin;
1826843a-2622-4512-bd22-80dfbf174ef2	user	22222222-2222-2222-2222-222222222222	truora	verified	2026-02-08 13:52:17.341988+00	\N	2026-02-08 13:52:17.341988+00
8bbd72b0-b561-4c1c-ab2d-c3d8a2d5215b	user	d596883b-69db-4548-b617-d7c238a3893e	manual_test	verified	2026-02-11 01:02:35.484155+00	\N	2026-02-11 01:02:35.484155+00
\.


--
-- Data for Name: match_guarantee_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_guarantee_reviews (id, match_id, demand_id, status, reviewed_by, reviewed_at, rejection_reason, created_at) FROM stdin;
\.


--
-- Data for Name: match_terms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_terms (id, match_id, price, deposit, expenses_included, start_date, end_date, duration_months, proposed_by, accepted_by, accepted_at, locked, created_at, updated_at) FROM stdin;
5454ba9e-09b9-4a9a-a11a-6f2a69fdd7bf	bc44662b-be18-415c-96c5-1278fcbdeef2	150000	150000	f	2026-03-01	2028-03-01	24	0184435c-b52f-42bf-a570-dd49213d6b74	d596883b-69db-4548-b617-d7c238a3893e	2026-02-11 01:30:43.820047+00	t	2026-02-11 01:27:37.259414+00	2026-02-11 01:27:37.259414+00
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matches (id, property_id, demand_id, status, created_at, created_by, approved_by, approved_at) FROM stdin;
bc44662b-be18-415c-96c5-1278fcbdeef2	34f31e82-ebab-4d46-b376-3a8774726232	8bd673bc-f137-440e-bdcb-72b6a450a6f3	contract_started	2026-02-11 00:40:43.649141+00	system	\N	\N
\.


--
-- Data for Name: metric_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metric_events (id, user_id, event_type, entity, entity_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: municipalities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.municipalities (id, province_id, name) FROM stdin;
\.


--
-- Data for Name: neighborhoods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.neighborhoods (id, municipality_id, name) FROM stdin;
\.


--
-- Data for Name: notification_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_events (id, event_type, user_id, entity, entity_id, payload, processed, created_at) FROM stdin;
5b138e0f-66a5-488d-94f6-320619362368	match_created	c017848b-1394-4816-9707-eb4bbb5ff17e	match	f7cb78f3-7c70-4c70-ac8f-902d23f62192	{"property_id": "de83ce9b-4ba0-44d2-bc58-e6027016911a"}	f	2026-01-17 01:40:02.73672+00
5f8906c4-6b7f-43fb-8c66-e1afd671098b	match_created	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	match	f7cb78f3-7c70-4c70-ac8f-902d23f62192	{"demand_id": "159b2db0-b1d7-43f7-b777-2215fbe36887"}	f	2026-01-17 01:40:02.73672+00
ab595c7b-d0bb-494d-9d3c-ee3ea299b716	match_created	22222222-2222-2222-2222-222222222222	match	057f1a3d-b3f7-4497-8004-64a234c7882d	{"property_id": "7a919dd2-528b-455e-b7c1-6bf6c80d291f"}	f	2026-02-07 22:11:39.115717+00
2c61aeba-0709-4a22-bb8e-7faff2f25a67	match_created	11111111-1111-1111-1111-111111111111	match	057f1a3d-b3f7-4497-8004-64a234c7882d	{"demand_id": "bcbc3767-017f-4b31-a2c0-21013132c7e8"}	f	2026-02-07 22:11:39.115717+00
ca855698-7a61-49f8-9a0b-fe16fc1dc717	match_created	22222222-2222-2222-2222-222222222222	match	1ce51c12-225d-47f9-af73-3865b3feeae8	{"property_id": "7a919dd2-528b-455e-b7c1-6bf6c80d291f"}	f	2026-02-09 01:15:47.29849+00
69834cf7-85a8-456c-a2a8-ca5120b02ea4	match_created	11111111-1111-1111-1111-111111111111	match	1ce51c12-225d-47f9-af73-3865b3feeae8	{"demand_id": "4667c5d1-202c-4374-890c-e86c418c996d"}	f	2026-02-09 01:15:47.29849+00
4e3d74e2-3cfc-493b-b732-e031419b918b	match_created	d596883b-69db-4548-b617-d7c238a3893e	match	bc44662b-be18-415c-96c5-1278fcbdeef2	{"property_id": "34f31e82-ebab-4d46-b376-3a8774726232"}	f	2026-02-11 00:40:43.649141+00
fe3c77fa-3602-4ebb-8e16-020abdddf8ac	match_created	0184435c-b52f-42bf-a570-dd49213d6b74	match	bc44662b-be18-415c-96c5-1278fcbdeef2	{"demand_id": "8bd673bc-f137-440e-bdcb-72b6a450a6f3"}	f	2026-02-11 00:40:43.649141+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, entity, entity_id, payload, read, created_at) FROM stdin;
\.


--
-- Data for Name: owner_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.owner_profiles (id, display_name, is_company, verified, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, contract_id, provider, provider_payment_id, amount, currency, status, created_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, full_name, phone, role, created_at) FROM stdin;
0184435c-b52f-42bf-a570-dd49213d6b74	\N	\N	tenant	2026-02-10 22:02:44.596147+00
d596883b-69db-4548-b617-d7c238a3893e	\N	\N	tenant	2026-02-10 22:06:10.145934+00
7cdfe6a9-1ac6-4dcd-9565-444946243ebb	\N	\N	tenant	2026-02-25 02:24:47.52537+00
8caed6b1-d571-4445-979b-21b70f02c73d	\N	\N	tenant	2026-02-25 12:06:34.897899+00
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.properties (id, owner_id, title, description, address, city, price, available, created_at, property_type, zone, currency, expenses_included, deposit_required, available_from, allowed_durations, publish_status, furnished, pets_allowed, services, sqm, short_description) FROM stdin;
34f31e82-ebab-4d46-b376-3a8774726232	0184435c-b52f-42bf-a570-dd49213d6b74	\N	222	\N	Ciudad Autónoma de Buenos Aires	123456	t	2026-02-10 22:03:42.173502+00	apartment	Agronomía	ARS	f	f	\N	{}	draft	f	f	\N	222	222
13e32fdf-96c7-4fca-ab2b-9adffb890905	0184435c-b52f-42bf-a570-dd49213d6b74	\N	2323	\N	Salliqueló	23	t	2026-02-26 21:51:34.463284+00	house	Quenumá	ARS	f	f	\N	{}	draft	f	f	\N	2323	2323
f07f32a1-0cdd-468c-9f89-a194c4237371	0184435c-b52f-42bf-a570-dd49213d6b74	\N	todas	\N	Ciudad Autónoma de Buenos Aires	68000	t	2026-02-14 22:53:28.248583+00	house	La Boca	ARS	f	f	\N	{}	draft	f	f	\N	222	todas
20a706fa-6469-4075-b5f0-94e7752b8df1	8caed6b1-d571-4445-979b-21b70f02c73d	\N	JSDKSJDLKSAD	\N	General Alvarado	334443	t	2026-02-25 14:24:53.799472+00	apartment	Mar del Sur	ARS	f	f	\N	{}	draft	f	f	\N	222	JSDKSJDLKSAD
\.


--
-- Data for Name: property_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_actions (id, user_id, property_id, action, created_at) FROM stdin;
\.


--
-- Data for Name: property_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_documents (id, property_id, doc_type, file_url, is_private, created_at) FROM stdin;
\.


--
-- Data for Name: property_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_likes (id, tenant_id, property_id, match_id, created_at, action) FROM stdin;
0ca8c6b0-f324-488a-bba0-948f6235ae81	a9cd248c-d542-4fdc-86e3-2300558dc3e8	9654ed95-1797-4138-8dd0-8849669dd1d6	\N	2026-02-07 18:39:15.616663+00	like
\.


--
-- Data for Name: property_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_media (id, property_id, type, url, "position", created_at) FROM stdin;
a561373f-9c16-4550-acd2-b11aaa69531d	34f31e82-ebab-4d46-b376-3a8774726232	photo	34f31e82-ebab-4d46-b376-3a8774726232/d1d19769-31e4-4a4e-baae-deb78f15cabe.png	0	2026-02-10 22:03:45.032579+00
6bfbb63d-a431-4fd2-bdcd-26ffe58f51e1	34f31e82-ebab-4d46-b376-3a8774726232	photo	34f31e82-ebab-4d46-b376-3a8774726232/e89c5c09-9ae9-49d8-9e55-b1aa7bd00364.png	1	2026-02-10 22:03:46.73359+00
6a28e505-55eb-4652-b1e9-91d3d0977607	13e32fdf-96c7-4fca-ab2b-9adffb890905	photo	13e32fdf-96c7-4fca-ab2b-9adffb890905/750bbf2d-49b5-4b9c-8193-f798103333c9.png	0	2026-02-26 21:51:37.19304+00
1e1d55d9-8d89-477f-8e07-50b14d8e8377	f07f32a1-0cdd-468c-9f89-a194c4237371	photo	f07f32a1-0cdd-468c-9f89-a194c4237371/d43ae027-c105-4fcb-99eb-ebaa457df14c.png	0	2026-02-14 22:53:31.254865+00
34eb502c-0b29-428d-becd-e363f671b27c	20a706fa-6469-4075-b5f0-94e7752b8df1	photo	20a706fa-6469-4075-b5f0-94e7752b8df1/ca261941-42e4-4678-ab6b-028db5ed99d2.png	0	2026-02-25 14:24:56.418658+00
6b39fa7d-4fa7-47ca-80e2-c039c4636aea	20a706fa-6469-4075-b5f0-94e7752b8df1	photo	20a706fa-6469-4075-b5f0-94e7752b8df1/a9dc6a5e-7e65-48a8-ae7f-b3a475eedd44.png	1	2026-02-25 14:24:58.704998+00
7027d9f6-d819-4b28-a4a4-730e4e7e9e4a	20a706fa-6469-4075-b5f0-94e7752b8df1	photo	20a706fa-6469-4075-b5f0-94e7752b8df1/fdcab1b9-2a5b-43b5-b52c-830aa19b02bc.png	2	2026-02-25 14:25:01.007525+00
dc14cc84-0213-4d44-b0d0-ae2a0baa086f	20a706fa-6469-4075-b5f0-94e7752b8df1	photo	20a706fa-6469-4075-b5f0-94e7752b8df1/146daf89-5eab-4076-8b9d-0e809caee26d.png	3	2026-02-25 14:25:02.487346+00
1408e511-608b-40ae-bda8-119b294801cb	20a706fa-6469-4075-b5f0-94e7752b8df1	photo	20a706fa-6469-4075-b5f0-94e7752b8df1/a0097418-12ae-4963-b25f-766be6402150.png	4	2026-02-25 14:25:03.89931+00
2cfda967-6e42-4428-bc05-973586d4eb59	20a706fa-6469-4075-b5f0-94e7752b8df1	photo	20a706fa-6469-4075-b5f0-94e7752b8df1/9469d630-4bac-442e-a1c8-a14091c2d2a1.png	5	2026-02-25 14:25:05.37091+00
4aee3339-25fb-452f-8814-3b79e4c74aed	20a706fa-6469-4075-b5f0-94e7752b8df1	photo	20a706fa-6469-4075-b5f0-94e7752b8df1/0b0d5cb9-a435-4343-a1ef-6448f2f3e917.png	6	2026-02-25 14:25:06.555274+00
\.


--
-- Data for Name: property_private; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_private (property_id, address, phone, first_name, last_name, email) FROM stdin;
34f31e82-ebab-4d46-b376-3a8774726232	Av Lastra	01133614865	Juan Manuel	Oddone	juancho12oddone@gmail.com
f07f32a1-0cdd-468c-9f89-a194c4237371	juancho12oddone@gmail.com	01133614865	Juan Manuel	Oddone	juancho12oddone@gmail.com
20a706fa-6469-4075-b5f0-94e7752b8df1	LASTRA 4290	1133614865	JUAN	ODDONE	rentverlo@gmail.com
13e32fdf-96c7-4fca-ab2b-9adffb890905	juancho12oddone@gmail.com	01133614865	Juan Manuel	Oddone	juancho12oddone@gmail.com
\.


--
-- Data for Name: provinces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provinces (id, name) FROM stdin;
\.


--
-- Data for Name: signature_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signature_events (id, contract_id, user_id, role, ip_address, user_agent, signed_at, signature_hash) FROM stdin;
\.


--
-- Data for Name: site_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_stats (key, value) FROM stdin;
properties_count	350
session_count	59
\.


--
-- Data for Name: tenant_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_documents (id, demand_id, doc_type, file_url, is_private, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_financial_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_financial_documents (id, tenant_id, doc_type, file_url, status, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_profiles (id, min_budget, max_budget, preferred_city, preferred_property_types, preferred_durations, created_at) FROM stdin;
\.


--
-- Data for Name: user_contract_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_contract_data (user_id, first_name, last_name, dni, address, city, province, country, created_at, updated_at) FROM stdin;
0184435c-b52f-42bf-a570-dd49213d6b74	Juan Manuel	Oddone	29248745	Av Lastra	Devoto	Soltero	Argentina	2026-02-11 23:01:46.249301+00	2026-02-11 23:01:46.249301+00
d596883b-69db-4548-b617-d7c238a3893e	NombreTenant	ApellidoTenant	30111222	Calle 123	Buenos Aires	Buenos Aires	Argentina	2026-02-12 00:00:55.917069+00	2026-02-12 00:00:55.917069+00
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visits (id, user_id, property_id, type, status, created_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-12-23 22:37:16
20211116045059	2025-12-23 22:37:18
20211116050929	2025-12-23 22:37:20
20211116051442	2025-12-23 22:37:21
20211116212300	2025-12-23 22:37:23
20211116213355	2025-12-23 22:37:25
20211116213934	2025-12-23 22:37:26
20211116214523	2025-12-23 22:37:29
20211122062447	2025-12-23 22:37:30
20211124070109	2025-12-23 22:37:32
20211202204204	2025-12-23 22:37:33
20211202204605	2025-12-23 22:37:35
20211210212804	2025-12-23 22:37:40
20211228014915	2025-12-23 22:37:42
20220107221237	2025-12-23 22:37:43
20220228202821	2025-12-23 22:37:45
20220312004840	2025-12-23 22:37:47
20220603231003	2025-12-23 22:37:49
20220603232444	2025-12-23 22:37:51
20220615214548	2025-12-23 22:37:53
20220712093339	2025-12-23 22:37:54
20220908172859	2025-12-23 22:37:56
20220916233421	2025-12-23 22:37:58
20230119133233	2025-12-23 22:37:59
20230128025114	2025-12-23 22:38:02
20230128025212	2025-12-23 22:38:03
20230227211149	2025-12-23 22:38:05
20230228184745	2025-12-23 22:38:06
20230308225145	2025-12-23 22:38:08
20230328144023	2025-12-23 22:38:10
20231018144023	2025-12-23 22:38:12
20231204144023	2025-12-23 22:38:14
20231204144024	2025-12-23 22:38:16
20231204144025	2025-12-23 22:38:17
20240108234812	2025-12-23 22:38:19
20240109165339	2025-12-23 22:38:21
20240227174441	2025-12-23 22:38:23
20240311171622	2025-12-23 22:38:26
20240321100241	2025-12-23 22:38:29
20240401105812	2025-12-23 22:38:34
20240418121054	2025-12-23 22:38:36
20240523004032	2025-12-23 22:38:42
20240618124746	2025-12-23 22:38:44
20240801235015	2025-12-23 22:38:45
20240805133720	2025-12-23 22:38:47
20240827160934	2025-12-23 22:38:48
20240919163303	2025-12-23 22:38:51
20240919163305	2025-12-23 22:38:52
20241019105805	2025-12-23 22:38:54
20241030150047	2025-12-23 22:39:00
20241108114728	2025-12-23 22:39:02
20241121104152	2025-12-23 22:39:04
20241130184212	2025-12-23 22:39:06
20241220035512	2025-12-23 22:39:07
20241220123912	2025-12-23 22:39:09
20241224161212	2025-12-23 22:39:11
20250107150512	2025-12-23 22:39:12
20250110162412	2025-12-23 22:39:14
20250123174212	2025-12-23 22:39:15
20250128220012	2025-12-23 22:39:17
20250506224012	2025-12-23 22:39:18
20250523164012	2025-12-23 22:39:20
20250714121412	2025-12-23 22:39:22
20250905041441	2025-12-23 22:39:23
20251103001201	2025-12-23 22:39:25
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
media	media	\N	2025-12-23 23:21:46.843875+00	2025-12-23 23:21:46.843875+00	f	f	\N	\N	\N	STANDARD
private-documents	private-documents	\N	2026-02-12 23:07:43.092621+00	2026-02-12 23:07:43.092621+00	f	f	10485760	{application/pdf,image/jpeg,image/png}	\N	STANDARD
identity-documents	identity-documents	\N	2026-02-15 01:44:41.432147+00	2026-02-15 01:44:41.432147+00	f	f	10485760	{image/jpeg,image/png,application/pdf}	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-12-23 22:37:13.807567
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-12-23 22:37:13.8247
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-12-23 22:37:13.856268
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-12-23 22:37:13.88657
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-12-23 22:37:13.891036
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-12-23 22:37:13.902472
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-12-23 22:37:13.906481
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-12-23 22:37:13.927074
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-12-23 22:37:13.932227
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-12-23 22:37:13.936064
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-12-23 22:37:13.941298
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-12-23 22:37:13.96313
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-12-23 22:37:13.96715
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-12-23 22:37:13.971796
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-12-23 22:37:13.976247
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-12-23 22:37:13.981739
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-12-23 22:37:13.985938
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-12-23 22:37:13.993741
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-12-23 22:37:14.007347
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-12-23 22:37:14.018458
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-12-23 22:37:14.024812
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-12-23 22:37:14.029007
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-12-23 22:37:22.165882
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2025-12-23 22:37:22.207732
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2025-12-23 22:37:22.211973
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2025-12-23 22:37:22.22272
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2025-12-23 22:37:22.227883
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2025-12-23 22:37:22.245217
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2025-12-23 22:37:13.831306
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2025-12-23 22:37:13.897578
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2025-12-23 22:37:13.913723
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2025-12-23 22:37:13.922461
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2025-12-23 22:37:14.037082
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2025-12-23 22:37:14.049332
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2025-12-23 22:37:21.332452
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2025-12-23 22:37:21.336503
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2025-12-23 22:37:21.340813
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2025-12-23 22:37:22.135186
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2025-12-23 22:37:22.141248
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2025-12-23 22:37:22.147369
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2025-12-23 22:37:22.150129
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2025-12-23 22:37:22.154967
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2025-12-23 22:37:22.159613
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2025-12-23 22:37:22.171097
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2025-12-23 22:37:22.180352
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2025-12-23 22:37:22.185083
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2025-12-23 22:37:22.19248
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2025-12-23 22:37:22.197758
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2025-12-23 22:37:22.203434
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2025-12-23 22:37:22.231952
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-02-10 21:07:59.638813
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-02-10 21:07:59.708018
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-02-10 21:07:59.709058
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-02-10 21:07:59.808824
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-02-10 21:07:59.810384
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-02-10 21:07:59.811167
56	fix-optimized-search-function	cb58526ebc23048049fd5bf2fd148d18b04a2073	2026-02-10 21:07:59.818055
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
0837760b-a75a-4a08-907b-cdd4d1972477	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/3b5227a4-9072-4481-97b3-9fdca286e3d0.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:30.79948+00	2026-02-02 23:08:30.79948+00	2026-02-02 23:08:30.79948+00	{"eTag": "\\"cfbb27b2327bc6e639539acb0d847a4f\\"", "size": 1045561, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:31.000Z", "contentLength": 1045561, "httpStatusCode": 200}	6694aaa8-897a-451d-843c-acc259a4f7f0	7e579d19-c429-4683-8fd7-6c4351b52426	{}
3332c9bb-b93a-4b6b-bed7-d416fd3a1f39	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/28b7eabf-0f50-4921-91cc-1be3a3f7d37d.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:32.032247+00	2026-02-02 23:08:32.032247+00	2026-02-02 23:08:32.032247+00	{"eTag": "\\"475a1a4c09ea96c81aaf0349648a3944\\"", "size": 1073441, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:32.000Z", "contentLength": 1073441, "httpStatusCode": 200}	bda77664-3ae6-4374-8d28-40a279e8c423	7e579d19-c429-4683-8fd7-6c4351b52426	{}
3e9575f5-43e2-4c80-9a09-1908777d60f6	media	property_images/property_videos/contracts_drafts/contracts_signed/documents_private/.emptyFolderPlaceholder	\N	2025-12-23 23:23:10.488481+00	2025-12-23 23:23:10.488481+00	2025-12-23 23:23:10.488481+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2025-12-23T23:23:10.480Z", "contentLength": 0, "httpStatusCode": 200}	25cbeca0-778d-450b-9845-e94668deaf91	\N	{}
292fe269-9918-4d5c-85b4-6e0f2b793bc8	media	71143ce0-0d5d-46f3-816c-ff084eb22eda/77478be8-0aa5-400a-9388-011385902f37	96a504f9-56ef-4124-9fc6-ca1bbd4e5384	2026-01-01 18:27:35.94+00	2026-01-01 18:27:35.94+00	2026-01-01 18:27:35.94+00	{"eTag": "\\"5830164f78b76dc30644845954d5a024\\"", "size": 1135173, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-01T18:27:36.000Z", "contentLength": 1135173, "httpStatusCode": 200}	db735d64-8ae7-4c1b-91d5-c2d4230a718b	96a504f9-56ef-4124-9fc6-ca1bbd4e5384	{}
d8bf2dc4-9fd7-429f-be57-274d1f3f8ef7	media	0f80b33e-b469-46b5-8fbb-dc7fe91dfc53/2979ef86-6852-4299-9e16-02082661deda	f14da734-d423-42d8-9108-b37ef899ca25	2026-01-07 15:34:24.125578+00	2026-01-07 15:34:24.125578+00	2026-01-07 15:34:24.125578+00	{"eTag": "\\"cc37065ebd67d7ff70af1a1718f304b3\\"", "size": 1159280, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:34:24.000Z", "contentLength": 1159280, "httpStatusCode": 200}	80a6d87f-6fae-45ec-a430-277cbd2596c9	f14da734-d423-42d8-9108-b37ef899ca25	{}
76012135-33b0-4857-9bb3-d5e912967c14	media	014f8597-def2-475f-8767-f5309b278ac8/42434a42-b578-4f0d-8430-3529ba5d4e41	90c888a9-b10c-4e78-8958-e29eef1474a6	2026-01-07 15:50:23.104725+00	2026-01-07 15:50:23.104725+00	2026-01-07 15:50:23.104725+00	{"eTag": "\\"001b17c04f8f131d76fb2f1261d7c758\\"", "size": 129171, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:50:24.000Z", "contentLength": 129171, "httpStatusCode": 200}	4a4e89a9-d63a-4d77-abf0-913a1861505a	90c888a9-b10c-4e78-8958-e29eef1474a6	{}
8bd664b5-11ed-46c4-9071-4d1cc951287c	media	014f8597-def2-475f-8767-f5309b278ac8/57cf76fc-4090-41f0-b063-3c0575beb616	90c888a9-b10c-4e78-8958-e29eef1474a6	2026-01-07 15:50:24.37826+00	2026-01-07 15:50:24.37826+00	2026-01-07 15:50:24.37826+00	{"eTag": "\\"e29fa1a7fa9b0288df12a49b55756de9\\"", "size": 148871, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:50:25.000Z", "contentLength": 148871, "httpStatusCode": 200}	7231720e-6fe8-4de1-86d1-2ddab3830b02	90c888a9-b10c-4e78-8958-e29eef1474a6	{}
c6fd7fa5-9041-45c3-a7a8-4424feae8817	media	3425def5-8c63-4408-9d44-f58a4b85c566/d1e05e05-e6fa-410b-91d2-64fe5c8f2a60	90c888a9-b10c-4e78-8958-e29eef1474a6	2026-01-07 15:50:25.015375+00	2026-01-07 15:50:25.015375+00	2026-01-07 15:50:25.015375+00	{"eTag": "\\"001b17c04f8f131d76fb2f1261d7c758\\"", "size": 129171, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:50:25.000Z", "contentLength": 129171, "httpStatusCode": 200}	779032d5-879d-459d-a678-3cd759564185	90c888a9-b10c-4e78-8958-e29eef1474a6	{}
26de3d78-fa69-4693-a115-326920c4a450	media	014f8597-def2-475f-8767-f5309b278ac8/1b149053-8b8a-4df1-8777-1b952c08af90	90c888a9-b10c-4e78-8958-e29eef1474a6	2026-01-07 15:50:25.473538+00	2026-01-07 15:50:25.473538+00	2026-01-07 15:50:25.473538+00	{"eTag": "\\"cb8839a0fcded94effe2ce2d708083bf\\"", "size": 74518, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:50:26.000Z", "contentLength": 74518, "httpStatusCode": 200}	39664ea5-9729-4535-94e6-47bc961d5cbc	90c888a9-b10c-4e78-8958-e29eef1474a6	{}
10713d5b-c23b-4f35-9c37-c4e78dd84113	media	3425def5-8c63-4408-9d44-f58a4b85c566/8cc9ed2e-5378-4c37-bf1b-d8929e3977c7	90c888a9-b10c-4e78-8958-e29eef1474a6	2026-01-07 15:50:26.190897+00	2026-01-07 15:50:26.190897+00	2026-01-07 15:50:26.190897+00	{"eTag": "\\"e29fa1a7fa9b0288df12a49b55756de9\\"", "size": 148871, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:50:27.000Z", "contentLength": 148871, "httpStatusCode": 200}	e3104676-e409-4daa-8735-198e582d886b	90c888a9-b10c-4e78-8958-e29eef1474a6	{}
af269ebf-994f-4c49-b314-2a047f168830	media	014f8597-def2-475f-8767-f5309b278ac8/7827d24c-f81d-4b89-b556-0aa47ac3483f	90c888a9-b10c-4e78-8958-e29eef1474a6	2026-01-07 15:50:26.58137+00	2026-01-07 15:50:26.58137+00	2026-01-07 15:50:26.58137+00	{"eTag": "\\"fe0d7b086a3f2bcfbaa7205a58246061\\"", "size": 120303, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:50:27.000Z", "contentLength": 120303, "httpStatusCode": 200}	b3bfda9a-2f6d-4baf-ab68-75746c6ddee7	90c888a9-b10c-4e78-8958-e29eef1474a6	{}
056fba93-e3eb-47ae-af99-85042a289577	media	3425def5-8c63-4408-9d44-f58a4b85c566/440bffcb-476f-4837-bc16-6929b8d7a6a2	90c888a9-b10c-4e78-8958-e29eef1474a6	2026-01-07 15:50:27.341779+00	2026-01-07 15:50:27.341779+00	2026-01-07 15:50:27.341779+00	{"eTag": "\\"cb8839a0fcded94effe2ce2d708083bf\\"", "size": 74518, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:50:28.000Z", "contentLength": 74518, "httpStatusCode": 200}	0d86eff3-7507-4a89-be59-b2c639dab472	90c888a9-b10c-4e78-8958-e29eef1474a6	{}
0ce59a3b-c042-4a7e-b909-adb30491706f	media	3425def5-8c63-4408-9d44-f58a4b85c566/747fecbc-6589-4314-8f00-cc9e7999f97c	90c888a9-b10c-4e78-8958-e29eef1474a6	2026-01-07 15:50:28.378632+00	2026-01-07 15:50:28.378632+00	2026-01-07 15:50:28.378632+00	{"eTag": "\\"fe0d7b086a3f2bcfbaa7205a58246061\\"", "size": 120303, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T15:50:29.000Z", "contentLength": 120303, "httpStatusCode": 200}	fed5e878-cb5f-449e-8adc-a521b2f1c4f9	90c888a9-b10c-4e78-8958-e29eef1474a6	{}
128ced27-51c3-4b56-80d2-480002bc898b	media	de83ce9b-4ba0-44d2-bc58-e6027016911a/8bc52668-dc54-45a6-add6-494decd805b5	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	2026-01-07 16:09:51.258971+00	2026-01-07 16:09:51.258971+00	2026-01-07 16:09:51.258971+00	{"eTag": "\\"9202b7995f88f13ca0b47a699514dff0\\"", "size": 412518, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T16:09:52.000Z", "contentLength": 412518, "httpStatusCode": 200}	70f3ec58-d190-4669-b629-91586c77097b	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	{}
94858be4-1903-4bcb-956f-7949cd1e0836	media	15e914b1-b8c2-4d8c-bb50-dac1120d04c9/45406587-fa54-4522-a8dd-e22091ec6094.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:14:30.925219+00	2026-02-02 23:14:30.925219+00	2026-02-02 23:14:30.925219+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:14:31.000Z", "contentLength": 1419664, "httpStatusCode": 200}	922e8c70-8f44-4757-9957-757574232ffc	7e579d19-c429-4683-8fd7-6c4351b52426	{}
ebdc883a-bbd4-4cd0-b511-67818a7f634e	media	de83ce9b-4ba0-44d2-bc58-e6027016911a/2de16275-c135-4b94-bad2-3254f4139ad1	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	2026-01-07 16:09:52.386648+00	2026-01-07 16:09:52.386648+00	2026-01-07 16:09:52.386648+00	{"eTag": "\\"c78e18627f597bcdc74a2a150c17bf88\\"", "size": 479230, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T16:09:53.000Z", "contentLength": 479230, "httpStatusCode": 200}	6b2d773f-c525-4f3c-a8f2-37077454ab38	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	{}
444f28e9-8de4-4772-8249-cecc0ca8e097	media	de83ce9b-4ba0-44d2-bc58-e6027016911a/b65ce391-c1df-4a14-9a64-0f89cabcf698	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	2026-01-07 16:09:53.514633+00	2026-01-07 16:09:53.514633+00	2026-01-07 16:09:53.514633+00	{"eTag": "\\"ac2eb67bfab1d6d957aad18b00b0fef9\\"", "size": 450904, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T16:09:54.000Z", "contentLength": 450904, "httpStatusCode": 200}	0c55ec9a-5b7b-4066-af64-10f17af7454b	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	{}
f6f7c340-6d3d-4f31-82c5-e8752f5b8928	media	15e914b1-b8c2-4d8c-bb50-dac1120d04c9/62b81d66-52c5-403e-b40a-1b33de4dc99f.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:14:32.221665+00	2026-02-02 23:14:32.221665+00	2026-02-02 23:14:32.221665+00	{"eTag": "\\"04112ca58fa5a9fe08ca2439087b32e9\\"", "size": 1061104, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:14:33.000Z", "contentLength": 1061104, "httpStatusCode": 200}	1d265df4-ea2e-4b63-a873-b613f3be8fe2	7e579d19-c429-4683-8fd7-6c4351b52426	{}
51686926-f4fc-4982-b432-d3ddc9a7d8fa	media	de83ce9b-4ba0-44d2-bc58-e6027016911a/250711c8-8bf2-4f58-ba90-d347769a9649	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	2026-01-07 16:09:54.564351+00	2026-01-07 16:09:54.564351+00	2026-01-07 16:09:54.564351+00	{"eTag": "\\"949eb69a2e2a1cd7a6522d19ea196d32\\"", "size": 407275, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T16:09:55.000Z", "contentLength": 407275, "httpStatusCode": 200}	351642a7-0e62-4e6f-83d4-8bb8cbac112d	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	{}
dcc84581-7ecc-4850-8dd4-4840a00e890c	media	ee0b41b2-408c-44c4-93df-e4f42bfeef35/737222bf-a3b0-46ee-bebc-9f9c816255ec	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	2026-01-07 16:09:57.029824+00	2026-01-07 16:09:57.029824+00	2026-01-07 16:09:57.029824+00	{"eTag": "\\"9202b7995f88f13ca0b47a699514dff0\\"", "size": 412518, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-07T16:09:57.000Z", "contentLength": 412518, "httpStatusCode": 200}	d9d98de0-3f4b-4454-9d9e-6be367f89978	d9ec2db4-29f4-4a9f-bd5e-e242a8c964fe	{}
2bda1b1e-2475-42b7-986c-82115bd45c05	media	6fe93eec-114d-4872-b6d2-2d7992cfa629/515b4305-d526-4cd8-bae0-6548b3ff31d1	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-28 19:55:13.233187+00	2026-01-28 19:55:13.233187+00	2026-01-28 19:55:13.233187+00	{"eTag": "\\"9b76ed72b5a8ee18b0c25e62bce96688\\"", "size": 2575038, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-28T19:55:14.000Z", "contentLength": 2575038, "httpStatusCode": 200}	f76abfd9-0326-4de5-9a3c-85c629945bb5	7e579d19-c429-4683-8fd7-6c4351b52426	{}
01b61058-5546-452e-90e2-e08edb80140e	media	3f72ba43-6bba-4b1f-a88c-c53ced9c2db6/75fbaa53-856f-4199-abf4-72d364d90710	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-28 20:22:31.014087+00	2026-01-28 20:22:31.014087+00	2026-01-28 20:22:31.014087+00	{"eTag": "\\"908cf6b13afcd8dd0720c373ecc9839a\\"", "size": 1064295, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-28T20:22:31.000Z", "contentLength": 1064295, "httpStatusCode": 200}	f403825c-cb6b-4928-bcc8-25c4ebafd80d	7e579d19-c429-4683-8fd7-6c4351b52426	{}
8e37e901-e866-4afb-a705-6231432f0bb8	media	4fe82b1b-0386-4324-978c-1fcebc23d76b/062b24ab-0f01-4ba6-8fd0-b4e8ccfc470b	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 16:00:31.849389+00	2026-01-29 16:00:31.849389+00	2026-01-29 16:00:31.849389+00	{"eTag": "\\"258432309034476f9e7e9a37823dcf9d\\"", "size": 139983, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T16:00:32.000Z", "contentLength": 139983, "httpStatusCode": 200}	79bf6ec8-1042-4026-9219-0ef7b9411918	7e579d19-c429-4683-8fd7-6c4351b52426	{}
9019e37a-7e7b-4eb4-8f3f-6b32d0cfc306	media	15e914b1-b8c2-4d8c-bb50-dac1120d04c9/dad77799-dcfc-4e60-ac84-46ab0badfb26.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:14:33.662998+00	2026-02-02 23:14:33.662998+00	2026-02-02 23:14:33.662998+00	{"eTag": "\\"086a0f97e6e313615811503b78c0c256\\"", "size": 1062288, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:14:34.000Z", "contentLength": 1062288, "httpStatusCode": 200}	391e0533-a489-46a5-8f38-993caa46dd66	7e579d19-c429-4683-8fd7-6c4351b52426	{}
cd6406fa-65c5-4b5c-8434-eccd564bff01	media	b332de3e-8d2f-446c-9c17-fa8425d5fee9/ab967fe2-c619-47fa-92ba-09388f3abc42.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 21:36:39.705519+00	2026-01-29 21:36:39.705519+00	2026-01-29 21:36:39.705519+00	{"eTag": "\\"310f239c8f0e149d7417f9559e03a9fd\\"", "size": 1013561, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T21:36:40.000Z", "contentLength": 1013561, "httpStatusCode": 200}	fc895110-4222-490d-8fbe-5bfbf3d71f67	7e579d19-c429-4683-8fd7-6c4351b52426	{}
e38b9a3f-52bb-45ff-867e-65d7b98e528c	media	e6c339b4-f099-4e48-86e5-f3cdbdc25ddb/9bf8edb9-37a0-4e3d-ac28-800553c726de.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 21:36:42.133843+00	2026-01-29 21:36:42.133843+00	2026-01-29 21:36:42.133843+00	{"eTag": "\\"310f239c8f0e149d7417f9559e03a9fd\\"", "size": 1013561, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T21:36:42.000Z", "contentLength": 1013561, "httpStatusCode": 200}	a0b2050a-0583-4fb9-9f97-f738845fd49e	7e579d19-c429-4683-8fd7-6c4351b52426	{}
07d4edc4-338e-4b4d-a5a8-5259f32aa4f3	media	aa7fbee7-9dad-472f-a419-2c379f264c70/08f6f25b-9fb1-4a47-8a9f-9a64d262a1b8.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:18:25.965876+00	2026-02-02 23:18:25.965876+00	2026-02-02 23:18:25.965876+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:18:26.000Z", "contentLength": 1419664, "httpStatusCode": 200}	fef48f7c-8d28-4634-8464-23c048406ca1	7e579d19-c429-4683-8fd7-6c4351b52426	{}
0fe7dae3-c589-419b-889e-4b823464e0ee	media	1a83da1b-ba85-4a87-876c-dad9e718f113/2d5f9a9b-062b-4620-b3b5-5ad0c07dc023.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 21:54:37.951343+00	2026-01-29 21:54:37.951343+00	2026-01-29 21:54:37.951343+00	{"eTag": "\\"aa55e0f4fba1cc129a37f9532eacbc65\\"", "size": 1121205, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T21:54:38.000Z", "contentLength": 1121205, "httpStatusCode": 200}	aec55cb6-5078-4144-a729-631a44ed8d1a	7e579d19-c429-4683-8fd7-6c4351b52426	{}
a8cd0f3e-d7ff-4fed-a262-338d1697a597	media	72c6d003-de7a-4c54-9454-3f064354e152/6dbf23ac-0f10-4ff2-b35b-6c80a60c7d50.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 22:01:43.400148+00	2026-01-29 22:01:43.400148+00	2026-01-29 22:01:43.400148+00	{"eTag": "\\"7115ecbd217217b403b064a9f1b881f2\\"", "size": 1100607, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T22:01:44.000Z", "contentLength": 1100607, "httpStatusCode": 200}	7112e40e-5c36-4b35-8d16-a23454b25923	7e579d19-c429-4683-8fd7-6c4351b52426	{}
6c61f501-4397-451c-99d9-517dd0c8c023	media	aa7fbee7-9dad-472f-a419-2c379f264c70/60e9ec0d-4476-4d23-85a6-0850029579a0.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:18:27.390443+00	2026-02-02 23:18:27.390443+00	2026-02-02 23:18:27.390443+00	{"eTag": "\\"04112ca58fa5a9fe08ca2439087b32e9\\"", "size": 1061104, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:18:28.000Z", "contentLength": 1061104, "httpStatusCode": 200}	548c3130-d2e7-4ec4-88aa-ca47afde71a9	7e579d19-c429-4683-8fd7-6c4351b52426	{}
05a9ab57-002a-44da-9d1b-93ec0429c6b5	media	3fed460b-9c6b-40ed-968d-e64ba0c3f250/53341efd-038e-4cb2-8997-decf22632b17.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 22:04:58.632184+00	2026-01-29 22:04:58.632184+00	2026-01-29 22:04:58.632184+00	{"eTag": "\\"c470ce183af6eec5b0ee7da474a35013\\"", "size": 1065955, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T22:04:59.000Z", "contentLength": 1065955, "httpStatusCode": 200}	c18ed2b9-d63e-465e-be1f-6f0ac7cd9fb0	7e579d19-c429-4683-8fd7-6c4351b52426	{}
982c2c45-55ea-4380-96ad-5dbc4fc4b758	media	4ed4738c-f950-45fd-b9f1-cbbdd24afa1a/971dfa6f-7dfe-4808-a9ed-e9341d05839b.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 22:08:20.569999+00	2026-01-29 22:08:20.569999+00	2026-01-29 22:08:20.569999+00	{"eTag": "\\"c470ce183af6eec5b0ee7da474a35013\\"", "size": 1065955, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T22:08:21.000Z", "contentLength": 1065955, "httpStatusCode": 200}	e261c48f-217b-4561-b5de-07f193635ff2	7e579d19-c429-4683-8fd7-6c4351b52426	{}
754b0347-9ecf-4096-a21a-5e13c206c7e8	media	fbc7040b-9520-4edb-b284-cf341a0fbc6f/4f6271ee-4d9f-4238-bcd1-572f66e157ca.mp4	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 22:29:42.276514+00	2026-01-29 22:29:42.276514+00	2026-01-29 22:29:42.276514+00	{"eTag": "\\"d23c98061f8838cf496e72e0d700ae8a-9\\"", "size": 46152054, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T22:29:41.000Z", "contentLength": 46152054, "httpStatusCode": 200}	bb15ed95-f934-4d8f-951a-6b13eb3dc202	7e579d19-c429-4683-8fd7-6c4351b52426	{}
d714baad-f486-47af-93b0-0f39c3b0eaba	media	fbc7040b-9520-4edb-b284-cf341a0fbc6f/241b1533-12bd-492a-ac59-e3cf13fa1bd7.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 22:29:43.635181+00	2026-01-29 22:29:43.635181+00	2026-01-29 22:29:43.635181+00	{"eTag": "\\"97bc4c0a35d4db14f5bd9da2d98d122e\\"", "size": 978068, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T22:29:44.000Z", "contentLength": 978068, "httpStatusCode": 200}	bbd2a635-0d77-4dee-a738-558993028bdb	7e579d19-c429-4683-8fd7-6c4351b52426	{}
7b6189d1-a282-4941-9feb-2a6b26157463	media	3374ed7a-e0d9-4c03-8d49-082e53186c47/6886dba3-dace-43e0-8cb5-67fd217c44cf.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-01-29 23:18:53.845008+00	2026-01-29 23:18:53.845008+00	2026-01-29 23:18:53.845008+00	{"eTag": "\\"b8569397d466c758cbf49411e7d32a19\\"", "size": 1134090, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-29T23:18:54.000Z", "contentLength": 1134090, "httpStatusCode": 200}	fca2f73e-43ea-4a0c-986f-5a1016eaccc5	7e579d19-c429-4683-8fd7-6c4351b52426	{}
4eaa2fad-0919-4824-a80b-9c5d8df7ddb2	media	aa7fbee7-9dad-472f-a419-2c379f264c70/5ea92c01-211f-4417-9463-5a7efb4f1c60.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:18:28.702589+00	2026-02-02 23:18:28.702589+00	2026-02-02 23:18:28.702589+00	{"eTag": "\\"086a0f97e6e313615811503b78c0c256\\"", "size": 1062288, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:18:29.000Z", "contentLength": 1062288, "httpStatusCode": 200}	830e32e3-a238-4a8c-9939-f991521bd62a	7e579d19-c429-4683-8fd7-6c4351b52426	{}
cdd4ed39-7b96-44fc-8b52-28637e46fd52	media	5b8c42e0-287d-4e10-afb0-8bb6ebd2999c/c45138cc-67db-4f7d-99f2-2776c3d9a34c.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 19:51:39.163566+00	2026-02-02 19:51:39.163566+00	2026-02-02 19:51:39.163566+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T19:51:40.000Z", "contentLength": 1419664, "httpStatusCode": 200}	52687eb9-febb-4fe3-b362-79725f67c62e	7e579d19-c429-4683-8fd7-6c4351b52426	{}
f719514d-753d-49b0-bd87-2129abff4ac9	media	93fbe362-9771-4f94-be6b-354af34b67f7/318dfa61-d8cf-4c33-b119-b5d1e9a12d20.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 20:32:54.182566+00	2026-02-02 20:32:54.182566+00	2026-02-02 20:32:54.182566+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T20:32:55.000Z", "contentLength": 1419664, "httpStatusCode": 200}	0541ea12-3254-4fef-a854-9be1d61af01a	7e579d19-c429-4683-8fd7-6c4351b52426	{}
840215a0-5f95-4b46-84b8-55a251f84df7	media	254d6505-4521-4a91-8eb9-15a1bcb7bbb9/b52a442c-49a7-4dea-967c-60864cbc444c.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:25:00.393493+00	2026-02-02 23:25:00.393493+00	2026-02-02 23:25:00.393493+00	{"eTag": "\\"ba817d512779afedb3fa059afd61f1a0\\"", "size": 1187527, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:25:01.000Z", "contentLength": 1187527, "httpStatusCode": 200}	5d9034e6-996d-4df3-b047-f398eeedfe1f	7e579d19-c429-4683-8fd7-6c4351b52426	{}
cc500908-44e1-4e8e-8935-833635b9fdab	media	93f20c66-b29d-4caa-9398-25380f6c02ec/120001d9-e99b-4e60-92a1-6256ffc2460f.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 21:23:59.577672+00	2026-02-02 21:23:59.577672+00	2026-02-02 21:23:59.577672+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T21:24:00.000Z", "contentLength": 1419664, "httpStatusCode": 200}	18acf913-6c96-4797-b06e-247b84f29cc8	7e579d19-c429-4683-8fd7-6c4351b52426	{}
ddb874bf-cb26-4ede-a310-6985e977b237	media	254d6505-4521-4a91-8eb9-15a1bcb7bbb9/19e37dd4-5675-493f-b7b9-61525099b3e4.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:25:02.03745+00	2026-02-02 23:25:02.03745+00	2026-02-02 23:25:02.03745+00	{"eTag": "\\"d44671c76fb550fb1735418695467374\\"", "size": 1189588, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:25:02.000Z", "contentLength": 1189588, "httpStatusCode": 200}	d2a8819a-1588-4ac0-98e0-fb64a2d0ce5f	7e579d19-c429-4683-8fd7-6c4351b52426	{}
818425ce-cbf6-4dab-b42c-fe4d8aec3fab	media	7e6b2967-e188-4bed-a5e6-14d67a3b0ca3/ef47af85-db6e-4387-9578-89e38fe32e21.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 21:57:40.996898+00	2026-02-02 21:57:40.996898+00	2026-02-02 21:57:40.996898+00	{"eTag": "\\"5abf2abaf8ed2b9851440850b4474cd4\\"", "size": 843492, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T21:57:41.000Z", "contentLength": 843492, "httpStatusCode": 200}	6f83d4b9-59e0-4f14-a991-c970845255a5	7e579d19-c429-4683-8fd7-6c4351b52426	{}
ff4b9861-e2dd-4ae4-99cf-76b84c5e652b	media	515a3bd1-fbcd-4d35-ae78-3678880b9a12/782b93c5-0237-480e-8fe3-e1e445a6cb33.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 22:17:34.169217+00	2026-02-02 22:17:34.169217+00	2026-02-02 22:17:34.169217+00	{"eTag": "\\"cc37065ebd67d7ff70af1a1718f304b3\\"", "size": 1159280, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T22:17:35.000Z", "contentLength": 1159280, "httpStatusCode": 200}	ffdb822e-1d69-495b-b1dc-75873685161e	7e579d19-c429-4683-8fd7-6c4351b52426	{}
11ceaba5-a854-4e79-87f5-f10b4c038da5	media	8f3c0481-c9ff-427e-8594-e0feba3e7f7c/1b0ea127-db37-413c-93a3-4e5cd009b63a.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 22:28:27.104939+00	2026-02-02 22:28:27.104939+00	2026-02-02 22:28:27.104939+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T22:28:28.000Z", "contentLength": 1419664, "httpStatusCode": 200}	2b1b40b1-b64d-4a98-b167-71a93a9eab5f	7e579d19-c429-4683-8fd7-6c4351b52426	{}
2b51783a-97d2-4264-af03-497c1768c27f	media	b4818520-93bc-43cf-8d76-eeeb79651be3/8d5f627c-c515-44c1-9f79-98c4d080609c.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 22:32:52.620848+00	2026-02-02 22:32:52.620848+00	2026-02-02 22:32:52.620848+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T22:32:53.000Z", "contentLength": 1419664, "httpStatusCode": 200}	a6648b2c-0776-4e30-962a-0c96e5ee9fe4	7e579d19-c429-4683-8fd7-6c4351b52426	{}
7f00ef1b-37ee-482c-a104-f6ce251546f7	media	e200a132-b04f-447d-b15a-dc68f28a4519/ca227b68-de9e-4b84-9a64-2d631a547a83.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 22:47:48.198986+00	2026-02-02 22:47:48.198986+00	2026-02-02 22:47:48.198986+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T22:47:49.000Z", "contentLength": 1419664, "httpStatusCode": 200}	6d043112-7286-4eb7-85a8-9932f1e7e064	7e579d19-c429-4683-8fd7-6c4351b52426	{}
745f9b25-0626-401c-b820-91287af94fd6	media	254d6505-4521-4a91-8eb9-15a1bcb7bbb9/ecb1da3a-f280-4154-bcd7-a4df449c9aaa.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:25:03.38788+00	2026-02-02 23:25:03.38788+00	2026-02-02 23:25:03.38788+00	{"eTag": "\\"3067d5a8a3498f1ac4c6be5d0b5e1fc9\\"", "size": 1016253, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:25:04.000Z", "contentLength": 1016253, "httpStatusCode": 200}	331ae8ca-35dc-43f4-8316-e72541e1d020	7e579d19-c429-4683-8fd7-6c4351b52426	{}
ede45deb-1afa-4895-ac98-5095233f04d1	media	b4b13929-8199-41b6-b517-b55bbcf05d6c/86e0fcab-2338-447e-9946-910aa96043c5.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:07:23.395399+00	2026-02-02 23:07:23.395399+00	2026-02-02 23:07:23.395399+00	{"eTag": "\\"b47209cb11b7dfe52380a65b86c916d4\\"", "size": 1064498, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:07:24.000Z", "contentLength": 1064498, "httpStatusCode": 200}	30ed20ac-c962-42a0-b3ef-e8026e261caf	7e579d19-c429-4683-8fd7-6c4351b52426	{}
faea5502-939e-4562-8767-66439b0802e8	media	ab383f19-92fb-4722-8dd6-19238ff9302c/8946e4fd-1e48-4b44-a32e-8c5ebcab0640.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-03 00:17:59.2337+00	2026-02-03 00:17:59.2337+00	2026-02-03 00:17:59.2337+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-03T00:18:00.000Z", "contentLength": 1419664, "httpStatusCode": 200}	9818025a-6d19-47dc-82dc-216ed19bd2a8	7e579d19-c429-4683-8fd7-6c4351b52426	{}
dd9ed339-cbf0-4a29-b8f8-4ca9a6179656	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/7ae35958-6e75-4522-ad43-593549619871.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:19.041032+00	2026-02-02 23:08:19.041032+00	2026-02-02 23:08:19.041032+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:19.000Z", "contentLength": 1419664, "httpStatusCode": 200}	17fc0b30-c737-4e41-bf18-51003faddf87	7e579d19-c429-4683-8fd7-6c4351b52426	{}
e31bd7d2-be19-4c10-9422-9b5c0dbedcc8	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/2c0cec4e-e2b8-49a8-998f-bcedfa65b8dc.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:20.317882+00	2026-02-02 23:08:20.317882+00	2026-02-02 23:08:20.317882+00	{"eTag": "\\"04112ca58fa5a9fe08ca2439087b32e9\\"", "size": 1061104, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:21.000Z", "contentLength": 1061104, "httpStatusCode": 200}	380a8a74-d136-4124-a53b-55471a2bb80a	7e579d19-c429-4683-8fd7-6c4351b52426	{}
a685fed6-ccc9-402b-99ee-b6e281eda2d4	media	ab383f19-92fb-4722-8dd6-19238ff9302c/3eec5c73-8b70-4c97-a627-fe6222da11ee.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-03 00:18:00.619913+00	2026-02-03 00:18:00.619913+00	2026-02-03 00:18:00.619913+00	{"eTag": "\\"04112ca58fa5a9fe08ca2439087b32e9\\"", "size": 1061104, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-03T00:18:01.000Z", "contentLength": 1061104, "httpStatusCode": 200}	ba1dba9a-f047-4399-b20e-1a42cf1714d9	7e579d19-c429-4683-8fd7-6c4351b52426	{}
44f688fd-8f4b-4843-8f7c-75a14d4ae3af	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/dbd90e14-ac55-4ff3-afd9-93a6617b1e79.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:21.636682+00	2026-02-02 23:08:21.636682+00	2026-02-02 23:08:21.636682+00	{"eTag": "\\"086a0f97e6e313615811503b78c0c256\\"", "size": 1062288, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:22.000Z", "contentLength": 1062288, "httpStatusCode": 200}	c64c71ba-358c-4e23-843c-3f1da10da9b9	7e579d19-c429-4683-8fd7-6c4351b52426	{}
9f24c5ff-9976-4d70-878a-96cf64c24d0d	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/6c8a3b70-e807-425c-b87c-94435c030ee9.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:22.958765+00	2026-02-02 23:08:22.958765+00	2026-02-02 23:08:22.958765+00	{"eTag": "\\"a95db771e1d76b93d600b45813021880\\"", "size": 983265, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:23.000Z", "contentLength": 983265, "httpStatusCode": 200}	477302e2-6b9a-4fad-b582-2f3cb2cd75d0	7e579d19-c429-4683-8fd7-6c4351b52426	{}
640d33e2-bfe8-4477-a031-efa23bebf47e	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/6c6e6586-14ff-4ce7-9368-e632f84a3739.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:24.254597+00	2026-02-02 23:08:24.254597+00	2026-02-02 23:08:24.254597+00	{"eTag": "\\"c007311e4f5de76529e6153866056c00\\"", "size": 1113904, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:25.000Z", "contentLength": 1113904, "httpStatusCode": 200}	c9137fee-1f16-487c-83b1-a0e7f4bf663a	7e579d19-c429-4683-8fd7-6c4351b52426	{}
46b4f5c1-ac89-4544-835c-50f7b6e206ed	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/343b1cc5-80fb-4110-8069-1a9e15ef30cd.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:25.674391+00	2026-02-02 23:08:25.674391+00	2026-02-02 23:08:25.674391+00	{"eTag": "\\"fca2c22172929ed007d24cfe0190c4de\\"", "size": 1148109, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:26.000Z", "contentLength": 1148109, "httpStatusCode": 200}	01d8a9df-b88d-4436-97e6-21d3212a6217	7e579d19-c429-4683-8fd7-6c4351b52426	{}
26a67db3-66b4-40e7-aefb-8d8c28564100	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/c286a0d3-8db7-4f78-8caf-21b60b3254f6.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:27.088804+00	2026-02-02 23:08:27.088804+00	2026-02-02 23:08:27.088804+00	{"eTag": "\\"a5cee6fda6f24cd41c0a3adfd9095f67\\"", "size": 1182950, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:28.000Z", "contentLength": 1182950, "httpStatusCode": 200}	d8ead987-144c-40e6-b8de-d8b4d9957bee	7e579d19-c429-4683-8fd7-6c4351b52426	{}
37f28bef-8ba1-4669-8c49-16d6e937d1bf	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/5d6c92b3-907d-47a9-a7c8-86b5a91501f2.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:28.308686+00	2026-02-02 23:08:28.308686+00	2026-02-02 23:08:28.308686+00	{"eTag": "\\"5abf2abaf8ed2b9851440850b4474cd4\\"", "size": 843492, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:29.000Z", "contentLength": 843492, "httpStatusCode": 200}	7fa835c4-0f8f-463d-bdfd-78443299f9f7	7e579d19-c429-4683-8fd7-6c4351b52426	{}
9b99bd92-d2e2-43fb-9516-f2194146911d	media	6f8bc51d-424e-406f-bff2-5c6e24ad9ed7/b4b3e709-74a2-494c-87ca-a5484901ffdc.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:35:34.435799+00	2026-02-02 23:35:34.435799+00	2026-02-02 23:35:34.435799+00	{"eTag": "\\"a46881e4f0d7cb8ded32e84ff73c5319\\"", "size": 1419664, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:35:35.000Z", "contentLength": 1419664, "httpStatusCode": 200}	72833565-7a63-4539-b53a-71a3d338df23	7e579d19-c429-4683-8fd7-6c4351b52426	{}
612f07af-f71f-4945-815b-6198c1d87e4e	media	ce853ea0-0a44-4fc0-9ccc-6a5c51bc7407/0b8bfaf0-7109-4beb-af4f-34178375785d.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:08:29.481032+00	2026-02-02 23:08:29.481032+00	2026-02-02 23:08:29.481032+00	{"eTag": "\\"7e41e5599ccd34314511558412d29d97\\"", "size": 844665, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:08:30.000Z", "contentLength": 844665, "httpStatusCode": 200}	17356d2e-6a79-436d-83a1-2a58c1e8b9ca	7e579d19-c429-4683-8fd7-6c4351b52426	{}
82ec2754-c31a-45d9-8bc0-089c3275bdfc	media	6f8bc51d-424e-406f-bff2-5c6e24ad9ed7/996c240b-f4ee-4d7e-bf9d-53d048bce3be.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:35:35.811991+00	2026-02-02 23:35:35.811991+00	2026-02-02 23:35:35.811991+00	{"eTag": "\\"04112ca58fa5a9fe08ca2439087b32e9\\"", "size": 1061104, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:35:36.000Z", "contentLength": 1061104, "httpStatusCode": 200}	d1d585a4-14b6-4bde-89fd-160cc38636c6	7e579d19-c429-4683-8fd7-6c4351b52426	{}
5d2c319a-0dfc-4c4e-bc19-690870bc9a64	media	6f8bc51d-424e-406f-bff2-5c6e24ad9ed7/7fed81e9-6365-4a74-9612-5d7e23c7f448.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-02 23:35:37.060529+00	2026-02-02 23:35:37.060529+00	2026-02-02 23:35:37.060529+00	{"eTag": "\\"086a0f97e6e313615811503b78c0c256\\"", "size": 1062288, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-02T23:35:37.000Z", "contentLength": 1062288, "httpStatusCode": 200}	3653da25-3ef6-47c1-a1fd-a0cf155b042e	7e579d19-c429-4683-8fd7-6c4351b52426	{}
401e45f7-26f3-4fcf-a292-d16a2c4a2a14	media	ab383f19-92fb-4722-8dd6-19238ff9302c/af3caafa-6028-49dc-811b-4ca78a603c36.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-03 00:18:02.019094+00	2026-02-03 00:18:02.019094+00	2026-02-03 00:18:02.019094+00	{"eTag": "\\"086a0f97e6e313615811503b78c0c256\\"", "size": 1062288, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-03T00:18:02.000Z", "contentLength": 1062288, "httpStatusCode": 200}	ef6d15a2-9ee7-4acf-8249-c26b1dffe397	7e579d19-c429-4683-8fd7-6c4351b52426	{}
7a4174c4-fc3b-4880-afca-b9f3c9ed6f24	media	ab383f19-92fb-4722-8dd6-19238ff9302c/fb437ac3-be7b-455c-bfcd-ff3c946902c0.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-03 00:18:03.431399+00	2026-02-03 00:18:03.431399+00	2026-02-03 00:18:03.431399+00	{"eTag": "\\"a95db771e1d76b93d600b45813021880\\"", "size": 983265, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-03T00:18:04.000Z", "contentLength": 983265, "httpStatusCode": 200}	f96ab395-3c9a-4069-8fc8-23f4a01904df	7e579d19-c429-4683-8fd7-6c4351b52426	{}
11a11257-fb0d-4662-8ce8-6f7b0e1056ca	media	e7e9fa7b-6be2-4aaf-8977-da870c4a8e7f/9d86a172-cee0-4626-941a-bb24eb022fa9.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:27:17.042875+00	2026-02-04 17:27:17.042875+00	2026-02-04 17:27:17.042875+00	{"eTag": "\\"33cba15bed5a828b6617b0c134c0d9a1\\"", "size": 1362132, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:27:17.000Z", "contentLength": 1362132, "httpStatusCode": 200}	15a50b78-1a55-4c3a-929f-0cca2845fb40	7e579d19-c429-4683-8fd7-6c4351b52426	{}
0da4ce5f-de08-4bc4-9893-4ebaf97a2caa	media	ee2c7944-7193-463b-82a8-60afafdf5223/2c561a73-c504-41b7-8412-e44464e58949.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:32:42.75708+00	2026-02-04 17:32:42.75708+00	2026-02-04 17:32:42.75708+00	{"eTag": "\\"33cba15bed5a828b6617b0c134c0d9a1\\"", "size": 1362132, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:32:43.000Z", "contentLength": 1362132, "httpStatusCode": 200}	8b249c50-5a4b-4166-93c6-288490be852b	7e579d19-c429-4683-8fd7-6c4351b52426	{}
f4461b58-2081-4dac-b382-f6296fea223b	media	98a83c30-d843-4983-92d9-bf55dd2d6f5f/e89b7da4-08a6-4879-8dd1-2059badc5dc3.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:32:42.960724+00	2026-02-04 17:32:42.960724+00	2026-02-04 17:32:42.960724+00	{"eTag": "\\"33cba15bed5a828b6617b0c134c0d9a1\\"", "size": 1362132, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:32:43.000Z", "contentLength": 1362132, "httpStatusCode": 200}	a5d6030b-cb77-4dba-a9c2-75c63277fef7	7e579d19-c429-4683-8fd7-6c4351b52426	{}
624eb814-0a7b-4661-bb6f-6e77f99b08be	media	067aaa6a-c33c-4763-aec2-65bda0a92e2a/38e9df2a-068c-45b8-8a53-fb8a436cce23.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:37:47.060161+00	2026-02-04 17:37:47.060161+00	2026-02-04 17:37:47.060161+00	{"eTag": "\\"33cba15bed5a828b6617b0c134c0d9a1\\"", "size": 1362132, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:37:47.000Z", "contentLength": 1362132, "httpStatusCode": 200}	31d8905d-194e-45d5-a843-542f28817bb7	7e579d19-c429-4683-8fd7-6c4351b52426	{}
f3ce1f8e-62b6-4a3c-a8b5-ffc1d806f730	media	067aaa6a-c33c-4763-aec2-65bda0a92e2a/52d6d203-87cb-4e7c-ab8e-eb8474822c86.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:37:48.48851+00	2026-02-04 17:37:48.48851+00	2026-02-04 17:37:48.48851+00	{"eTag": "\\"e20296fb32fe54db3f2b79447fa17cbe\\"", "size": 1031077, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:37:49.000Z", "contentLength": 1031077, "httpStatusCode": 200}	bcd3832d-6989-4175-99c8-865c58a335c2	7e579d19-c429-4683-8fd7-6c4351b52426	{}
534e686c-34f0-4a9e-bce1-68aa9dc2eb21	media	067aaa6a-c33c-4763-aec2-65bda0a92e2a/ae7b36c2-1b76-44b9-8b57-762e31ec30a3.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:37:49.752645+00	2026-02-04 17:37:49.752645+00	2026-02-04 17:37:49.752645+00	{"eTag": "\\"1bdfd80be6846845fef1d55e3425373e\\"", "size": 1120335, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:37:50.000Z", "contentLength": 1120335, "httpStatusCode": 200}	c8e635d6-d15c-4090-b6d5-901a6be27b96	7e579d19-c429-4683-8fd7-6c4351b52426	{}
dc369a19-1064-4ff4-8fe6-8c6d1d855993	media	067aaa6a-c33c-4763-aec2-65bda0a92e2a/6fe2fab7-a0f6-46f4-bfbc-c615e760826a.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:37:51.082055+00	2026-02-04 17:37:51.082055+00	2026-02-04 17:37:51.082055+00	{"eTag": "\\"f1246b26ae1d72fbc2150ae89398cb06\\"", "size": 1139156, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:37:51.000Z", "contentLength": 1139156, "httpStatusCode": 200}	e001f0fe-47e6-4a2d-ad0c-ed3c1fcbbc94	7e579d19-c429-4683-8fd7-6c4351b52426	{}
08160026-28fb-438e-966c-ec11137364e6	media	067aaa6a-c33c-4763-aec2-65bda0a92e2a/0bebceb1-70e1-4fe1-8e7e-cf44a064a747.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:37:52.515099+00	2026-02-04 17:37:52.515099+00	2026-02-04 17:37:52.515099+00	{"eTag": "\\"21ec050f05fb67a6259140d3bf11a9d5\\"", "size": 1117352, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:37:53.000Z", "contentLength": 1117352, "httpStatusCode": 200}	0b2e042f-e3f3-4bde-adac-fb0d0fe612ea	7e579d19-c429-4683-8fd7-6c4351b52426	{}
bbccff8a-414c-4535-9ef9-498d84217f53	media	77078f4e-c743-4909-991e-b1cd6f541bb8/383ba4c3-2a96-495f-b782-6db5d2ae0b60.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:37:53.436457+00	2026-02-04 17:37:53.436457+00	2026-02-04 17:37:53.436457+00	{"eTag": "\\"33cba15bed5a828b6617b0c134c0d9a1\\"", "size": 1362132, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:37:54.000Z", "contentLength": 1362132, "httpStatusCode": 200}	8622c6c3-3073-48d8-91da-23d17d50b70b	7e579d19-c429-4683-8fd7-6c4351b52426	{}
377a4ba5-658a-4f11-8780-489d7e2b6e1f	media	f2739742-fd5a-4c4b-a547-8eee23f5ca12/9b0fb7b4-716d-488d-843b-7e256832fae4.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:50:53.93011+00	2026-02-04 17:50:53.93011+00	2026-02-04 17:50:53.93011+00	{"eTag": "\\"33cba15bed5a828b6617b0c134c0d9a1\\"", "size": 1362132, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:50:54.000Z", "contentLength": 1362132, "httpStatusCode": 200}	58515912-63ef-4014-a76f-055f949ae4cf	7e579d19-c429-4683-8fd7-6c4351b52426	{}
90e4b4de-ad1d-45f1-a3be-2b125fa2a8f3	media	f2739742-fd5a-4c4b-a547-8eee23f5ca12/0c938d7d-8023-464b-8cfc-b24bea02c7db.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:50:55.15544+00	2026-02-04 17:50:55.15544+00	2026-02-04 17:50:55.15544+00	{"eTag": "\\"e20296fb32fe54db3f2b79447fa17cbe\\"", "size": 1031077, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:50:56.000Z", "contentLength": 1031077, "httpStatusCode": 200}	622d81d7-603f-478a-906e-df507bc65cf8	7e579d19-c429-4683-8fd7-6c4351b52426	{}
678a9e29-027a-4e6c-b58d-beaaba9d90cf	media	f2739742-fd5a-4c4b-a547-8eee23f5ca12/221ad2b2-b8f1-4c54-ab3b-a6aeae55c5b4.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:50:56.483471+00	2026-02-04 17:50:56.483471+00	2026-02-04 17:50:56.483471+00	{"eTag": "\\"837309272e934e5be48b4e1c408663b7\\"", "size": 1196731, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:50:57.000Z", "contentLength": 1196731, "httpStatusCode": 200}	686dfd77-56b1-4436-ac7d-36453a30ee7f	7e579d19-c429-4683-8fd7-6c4351b52426	{}
b77af043-a8f6-473f-83c2-f3f273fbee0c	media	f2739742-fd5a-4c4b-a547-8eee23f5ca12/5e4d989c-66ed-4a8c-a773-913274d175ee.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:50:57.864606+00	2026-02-04 17:50:57.864606+00	2026-02-04 17:50:57.864606+00	{"eTag": "\\"1bdfd80be6846845fef1d55e3425373e\\"", "size": 1120335, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:50:58.000Z", "contentLength": 1120335, "httpStatusCode": 200}	0992610d-7baf-42e7-81fb-09aca368d3cd	7e579d19-c429-4683-8fd7-6c4351b52426	{}
1a2913ab-3c8a-4155-8a0a-7fff7987a5ad	media	3896b000-4403-44f7-856a-a7e2445519cb/1ecfa130-9d51-41fe-aaaa-2eecfa4a8418.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:53:21.326558+00	2026-02-04 17:53:21.326558+00	2026-02-04 17:53:21.326558+00	{"eTag": "\\"33cba15bed5a828b6617b0c134c0d9a1\\"", "size": 1362132, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:53:22.000Z", "contentLength": 1362132, "httpStatusCode": 200}	455cd128-e70c-479d-9ea1-2dd48d8a1d75	7e579d19-c429-4683-8fd7-6c4351b52426	{}
f0a38ac4-8cd8-4518-bf52-cb1c33535366	media	3896b000-4403-44f7-856a-a7e2445519cb/94ae8408-b11e-4844-8f71-e34c68631af1.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:53:22.557346+00	2026-02-04 17:53:22.557346+00	2026-02-04 17:53:22.557346+00	{"eTag": "\\"e20296fb32fe54db3f2b79447fa17cbe\\"", "size": 1031077, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:53:23.000Z", "contentLength": 1031077, "httpStatusCode": 200}	6ed09a1a-8e8d-4208-b763-030566473ef8	7e579d19-c429-4683-8fd7-6c4351b52426	{}
e032e610-8af9-46f8-8513-e586f8cc42ad	media	3896b000-4403-44f7-856a-a7e2445519cb/a8683640-8e11-42dd-8376-7930f71813f6.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:53:23.798997+00	2026-02-04 17:53:23.798997+00	2026-02-04 17:53:23.798997+00	{"eTag": "\\"837309272e934e5be48b4e1c408663b7\\"", "size": 1196731, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:53:24.000Z", "contentLength": 1196731, "httpStatusCode": 200}	12cd48f8-ba7e-40f9-821f-b8b10ed2fbf4	7e579d19-c429-4683-8fd7-6c4351b52426	{}
1b0fa9eb-8fb5-4673-acb7-000bf2889af3	media	3896b000-4403-44f7-856a-a7e2445519cb/f7114908-44cb-4f8d-85d6-26cf6478b366.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:53:24.959577+00	2026-02-04 17:53:24.959577+00	2026-02-04 17:53:24.959577+00	{"eTag": "\\"1bdfd80be6846845fef1d55e3425373e\\"", "size": 1120335, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:53:25.000Z", "contentLength": 1120335, "httpStatusCode": 200}	98335193-aa33-451f-8f4b-2855d1f9871d	7e579d19-c429-4683-8fd7-6c4351b52426	{}
a013be2a-871f-42aa-a626-a54f559d15c0	media	e3823497-32af-4cc6-b35e-7bd50e267e34/e2a6a388-ee81-4d14-9c16-dcbde4d6e515.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:55:55.212735+00	2026-02-04 17:55:55.212735+00	2026-02-04 17:55:55.212735+00	{"eTag": "\\"e20296fb32fe54db3f2b79447fa17cbe\\"", "size": 1031077, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:55:56.000Z", "contentLength": 1031077, "httpStatusCode": 200}	033ee34a-f97d-433a-8cef-332d83d45f46	7e579d19-c429-4683-8fd7-6c4351b52426	{}
be3875b1-be2a-4ea1-92f3-151a175db81c	media	e3823497-32af-4cc6-b35e-7bd50e267e34/a00ef644-9a4c-4aac-bcab-810f3d4d0f8e.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:55:56.47882+00	2026-02-04 17:55:56.47882+00	2026-02-04 17:55:56.47882+00	{"eTag": "\\"837309272e934e5be48b4e1c408663b7\\"", "size": 1196731, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:55:57.000Z", "contentLength": 1196731, "httpStatusCode": 200}	2aa86c64-b991-489a-9b6e-649261f7867f	7e579d19-c429-4683-8fd7-6c4351b52426	{}
3cf25d28-3e7c-4da7-9733-6e9ec05507d6	media	e3823497-32af-4cc6-b35e-7bd50e267e34/bc491377-ada0-4b5b-9862-a9f92b43f6c7.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-04 17:55:57.726562+00	2026-02-04 17:55:57.726562+00	2026-02-04 17:55:57.726562+00	{"eTag": "\\"1bdfd80be6846845fef1d55e3425373e\\"", "size": 1120335, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-04T17:55:58.000Z", "contentLength": 1120335, "httpStatusCode": 200}	042730de-3ce5-4d98-a851-9f802b0f42c3	7e579d19-c429-4683-8fd7-6c4351b52426	{}
39ce78a3-0b2d-4ebd-8a90-8c0da97f9359	media	a3a5fc17-2a48-4983-9161-887ef83f5fea/ddea1215-bb31-4a7d-a85e-038dcb705bc6.png	7e579d19-c429-4683-8fd7-6c4351b52426	2026-02-09 16:14:27.793871+00	2026-02-09 16:14:27.793871+00	2026-02-09 16:14:27.793871+00	{"eTag": "\\"e101b3cda99a7880e79e938b3a31017e\\"", "size": 1149054, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-09T16:14:28.000Z", "contentLength": 1149054, "httpStatusCode": 200}	e158e475-8dcf-4b03-abb5-3295c3044efe	7e579d19-c429-4683-8fd7-6c4351b52426	{}
79990d70-c11c-44f7-af7b-5163af509651	media	34f31e82-ebab-4d46-b376-3a8774726232/d1d19769-31e4-4a4e-baae-deb78f15cabe.png	0184435c-b52f-42bf-a570-dd49213d6b74	2026-02-10 22:03:44.646286+00	2026-02-10 22:03:44.646286+00	2026-02-10 22:03:44.646286+00	{"eTag": "\\"a2e7547b327ff8903334105a0c3d31ed\\"", "size": 864953, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T22:03:45.000Z", "contentLength": 864953, "httpStatusCode": 200}	271fb6e8-fc5d-4aea-8c20-29d1c3c104cb	0184435c-b52f-42bf-a570-dd49213d6b74	{}
6185aa86-d22a-42b0-afc3-cad253b71f0a	media	34f31e82-ebab-4d46-b376-3a8774726232/e89c5c09-9ae9-49d8-9e55-b1aa7bd00364.png	0184435c-b52f-42bf-a570-dd49213d6b74	2026-02-10 22:03:46.41562+00	2026-02-10 22:03:46.41562+00	2026-02-10 22:03:46.41562+00	{"eTag": "\\"e97e9708be4ab08f47b4f42acfc8f3e0\\"", "size": 1461405, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-10T22:03:47.000Z", "contentLength": 1461405, "httpStatusCode": 200}	4893aaab-850c-4247-a9a6-44dbda1d08d0	0184435c-b52f-42bf-a570-dd49213d6b74	{}
a27d6b8b-2319-4b1d-8657-a2f23c7cdd7e	media	f07f32a1-0cdd-468c-9f89-a194c4237371/d43ae027-c105-4fcb-99eb-ebaa457df14c.png	0184435c-b52f-42bf-a570-dd49213d6b74	2026-02-14 22:53:30.947441+00	2026-02-14 22:53:30.947441+00	2026-02-14 22:53:30.947441+00	{"eTag": "\\"862683e31be8cba17d7bf87df713ef9e\\"", "size": 1443802, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-14T22:53:31.000Z", "contentLength": 1443802, "httpStatusCode": 200}	a3419e4b-9aa1-48e8-8865-d74908b196cc	0184435c-b52f-42bf-a570-dd49213d6b74	{}
9964dee3-4eec-43c2-b67a-addde945ed6d	media	28f62628-48f3-49b3-b763-a565e0673b87/74192fa1-84ba-4f87-8474-6e115c173581.png	970186be-59d5-4d76-a044-ccc3f236897d	2026-02-19 21:49:37.396809+00	2026-02-19 21:49:37.396809+00	2026-02-19 21:49:37.396809+00	{"eTag": "\\"b471bde75eaabe60e5cc635107eee8d8\\"", "size": 2311001, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T21:49:38.000Z", "contentLength": 2311001, "httpStatusCode": 200}	219d3bbd-378e-4b0a-a129-0f97635ef86b	970186be-59d5-4d76-a044-ccc3f236897d	{}
91f2d2b5-12f2-4df6-9d34-565d24831519	media	971887f7-dc91-4c4c-88a2-35d73637d96e/da3d7a09-b37b-4dd2-b50a-e8752a084de7.png	970186be-59d5-4d76-a044-ccc3f236897d	2026-02-19 21:49:38.718627+00	2026-02-19 21:49:38.718627+00	2026-02-19 21:49:38.718627+00	{"eTag": "\\"b471bde75eaabe60e5cc635107eee8d8\\"", "size": 2311001, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-19T21:49:39.000Z", "contentLength": 2311001, "httpStatusCode": 200}	0550457a-28c6-4a6d-b5bd-f5c1c76f98ad	970186be-59d5-4d76-a044-ccc3f236897d	{}
263ace58-2aad-499e-b80c-cf2869e9c621	media	20a706fa-6469-4075-b5f0-94e7752b8df1/ca261941-42e4-4678-ab6b-028db5ed99d2.png	8caed6b1-d571-4445-979b-21b70f02c73d	2026-02-25 14:24:56.097226+00	2026-02-25 14:24:56.097226+00	2026-02-25 14:24:56.097226+00	{"eTag": "\\"a5a5b8a633eeed105e9a77f1e0e6ad8d\\"", "size": 1094826, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-25T14:24:56.000Z", "contentLength": 1094826, "httpStatusCode": 200}	2f743b9c-c88b-4149-8753-841e99f2f046	8caed6b1-d571-4445-979b-21b70f02c73d	{}
4f347df9-96b1-442e-85a8-a8c402d161b9	media	20a706fa-6469-4075-b5f0-94e7752b8df1/a9dc6a5e-7e65-48a8-ae7f-b3a475eedd44.png	8caed6b1-d571-4445-979b-21b70f02c73d	2026-02-25 14:24:58.422587+00	2026-02-25 14:24:58.422587+00	2026-02-25 14:24:58.422587+00	{"eTag": "\\"7337222ad066a93133b6a41ba4f777a9\\"", "size": 3017112, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-25T14:24:59.000Z", "contentLength": 3017112, "httpStatusCode": 200}	e652220c-a8f0-4aa7-9866-ff1e589b8352	8caed6b1-d571-4445-979b-21b70f02c73d	{}
8b47d1f9-9cff-49de-8b60-2d5de42fddca	media	20a706fa-6469-4075-b5f0-94e7752b8df1/fdcab1b9-2a5b-43b5-b52c-830aa19b02bc.png	8caed6b1-d571-4445-979b-21b70f02c73d	2026-02-25 14:25:00.735351+00	2026-02-25 14:25:00.735351+00	2026-02-25 14:25:00.735351+00	{"eTag": "\\"e1a197e58497b92e1aeef949569e40ed\\"", "size": 3077093, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-25T14:25:01.000Z", "contentLength": 3077093, "httpStatusCode": 200}	aff99fcc-eff0-4dcc-bda3-7d71c590578d	8caed6b1-d571-4445-979b-21b70f02c73d	{}
13879189-6acb-4b7e-9d0a-4d385c11c60e	media	20a706fa-6469-4075-b5f0-94e7752b8df1/146daf89-5eab-4076-8b9d-0e809caee26d.png	8caed6b1-d571-4445-979b-21b70f02c73d	2026-02-25 14:25:02.134786+00	2026-02-25 14:25:02.134786+00	2026-02-25 14:25:02.134786+00	{"eTag": "\\"c58d8f2d9eb6f3524322984e58c4d8aa\\"", "size": 1080806, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-25T14:25:03.000Z", "contentLength": 1080806, "httpStatusCode": 200}	fd1de17d-73db-4977-8ffc-6ddf312c8167	8caed6b1-d571-4445-979b-21b70f02c73d	{}
f66a6e5e-2242-4ac9-8e8b-f7b80ac76019	media	20a706fa-6469-4075-b5f0-94e7752b8df1/a0097418-12ae-4963-b25f-766be6402150.png	8caed6b1-d571-4445-979b-21b70f02c73d	2026-02-25 14:25:03.599125+00	2026-02-25 14:25:03.599125+00	2026-02-25 14:25:03.599125+00	{"eTag": "\\"8d088b59235195c2e65299b082ce775b\\"", "size": 984806, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-25T14:25:04.000Z", "contentLength": 984806, "httpStatusCode": 200}	2cc3e24a-4522-42a9-a161-e4d28ece45a0	8caed6b1-d571-4445-979b-21b70f02c73d	{}
cd43301e-92ef-4d8e-bf16-bbea968f72d0	media	20a706fa-6469-4075-b5f0-94e7752b8df1/9469d630-4bac-442e-a1c8-a14091c2d2a1.png	8caed6b1-d571-4445-979b-21b70f02c73d	2026-02-25 14:25:04.995055+00	2026-02-25 14:25:04.995055+00	2026-02-25 14:25:04.995055+00	{"eTag": "\\"580a2d266eae4e200db5ab80b273b0fc\\"", "size": 1175021, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-25T14:25:05.000Z", "contentLength": 1175021, "httpStatusCode": 200}	9b50c765-259c-4b2f-8d54-aadd0f8168c1	8caed6b1-d571-4445-979b-21b70f02c73d	{}
927313a6-7c9b-4f2e-bbe4-8df59579a9f2	media	20a706fa-6469-4075-b5f0-94e7752b8df1/0b0d5cb9-a435-4343-a1ef-6448f2f3e917.png	8caed6b1-d571-4445-979b-21b70f02c73d	2026-02-25 14:25:06.296412+00	2026-02-25 14:25:06.296412+00	2026-02-25 14:25:06.296412+00	{"eTag": "\\"6d087acc68b458c501e1663fad68ad0a\\"", "size": 1070807, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-25T14:25:07.000Z", "contentLength": 1070807, "httpStatusCode": 200}	8392b9fe-0f01-4803-b711-d1e158a5809f	8caed6b1-d571-4445-979b-21b70f02c73d	{}
590f5a00-91e7-43b4-9108-b9c00d98782b	media	13e32fdf-96c7-4fca-ab2b-9adffb890905/750bbf2d-49b5-4b9c-8193-f798103333c9.png	0184435c-b52f-42bf-a570-dd49213d6b74	2026-02-26 21:51:36.817629+00	2026-02-26 21:51:36.817629+00	2026-02-26 21:51:36.817629+00	{"eTag": "\\"bac80bf7bd6a4192952627529e33e86a\\"", "size": 1705750, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-26T21:51:37.000Z", "contentLength": 1705750, "httpStatusCode": 200}	9195fa21-c070-4ef1-abed-d67e083c8981	0184435c-b52f-42bf-a570-dd49213d6b74	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 204, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: contract_signatures contract_signatures_contract_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_signatures
    ADD CONSTRAINT contract_signatures_contract_id_user_id_key UNIQUE (contract_id, user_id);


--
-- Name: contract_signatures contract_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_signatures
    ADD CONSTRAINT contract_signatures_pkey PRIMARY KEY (id);


--
-- Name: contract_versions contract_versions_contract_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_contract_id_version_number_key UNIQUE (contract_id, version_number);


--
-- Name: contract_versions contract_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_match_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_match_id_key UNIQUE (match_id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: demands demands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: identity_documents identity_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.identity_documents
    ADD CONSTRAINT identity_documents_pkey PRIMARY KEY (id);


--
-- Name: identity_verifications identity_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.identity_verifications
    ADD CONSTRAINT identity_verifications_pkey PRIMARY KEY (id);


--
-- Name: match_guarantee_reviews match_guarantee_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_guarantee_reviews
    ADD CONSTRAINT match_guarantee_reviews_pkey PRIMARY KEY (id);


--
-- Name: match_terms match_terms_match_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_terms
    ADD CONSTRAINT match_terms_match_id_key UNIQUE (match_id);


--
-- Name: match_terms match_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_terms
    ADD CONSTRAINT match_terms_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: matches matches_property_id_demand_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_property_id_demand_id_key UNIQUE (property_id, demand_id);


--
-- Name: metric_events metric_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metric_events
    ADD CONSTRAINT metric_events_pkey PRIMARY KEY (id);


--
-- Name: municipalities municipalities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipalities
    ADD CONSTRAINT municipalities_pkey PRIMARY KEY (id);


--
-- Name: neighborhoods neighborhoods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT neighborhoods_pkey PRIMARY KEY (id);


--
-- Name: notification_events notification_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_events
    ADD CONSTRAINT notification_events_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: owner_profiles owner_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owner_profiles
    ADD CONSTRAINT owner_profiles_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: property_actions property_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_actions
    ADD CONSTRAINT property_actions_pkey PRIMARY KEY (id);


--
-- Name: property_actions property_actions_user_id_property_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_actions
    ADD CONSTRAINT property_actions_user_id_property_id_key UNIQUE (user_id, property_id);


--
-- Name: property_documents property_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_documents
    ADD CONSTRAINT property_documents_pkey PRIMARY KEY (id);


--
-- Name: property_likes property_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_likes
    ADD CONSTRAINT property_likes_pkey PRIMARY KEY (id);


--
-- Name: property_media property_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_media
    ADD CONSTRAINT property_media_pkey PRIMARY KEY (id);


--
-- Name: property_private property_private_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_private
    ADD CONSTRAINT property_private_pkey PRIMARY KEY (property_id);


--
-- Name: provinces provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pkey PRIMARY KEY (id);


--
-- Name: signature_events signature_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signature_events
    ADD CONSTRAINT signature_events_pkey PRIMARY KEY (id);


--
-- Name: site_stats site_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_stats
    ADD CONSTRAINT site_stats_pkey PRIMARY KEY (key);


--
-- Name: tenant_documents tenant_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_documents
    ADD CONSTRAINT tenant_documents_pkey PRIMARY KEY (id);


--
-- Name: tenant_financial_documents tenant_financial_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_financial_documents
    ADD CONSTRAINT tenant_financial_documents_pkey PRIMARY KEY (id);


--
-- Name: tenant_profiles tenant_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_profiles
    ADD CONSTRAINT tenant_profiles_pkey PRIMARY KEY (id);


--
-- Name: match_guarantee_reviews unique_match_review; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_guarantee_reviews
    ADD CONSTRAINT unique_match_review UNIQUE (match_id);


--
-- Name: user_contract_data user_contract_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_contract_data
    ADD CONSTRAINT user_contract_data_pkey PRIMARY KEY (user_id);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_entity ON public.audit_logs USING btree (entity, entity_id);


--
-- Name: idx_contracts_match; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_match ON public.contracts USING btree (match_id);


--
-- Name: idx_contracts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);


--
-- Name: idx_demands_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_demands_city ON public.demands USING btree (city);


--
-- Name: idx_demands_price_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_demands_price_range ON public.demands USING btree (min_price, max_price);


--
-- Name: idx_identity_documents_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_identity_documents_user ON public.identity_documents USING btree (user_id);


--
-- Name: idx_identity_subject_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_identity_subject_created ON public.identity_verifications USING btree (subject_type, subject_id, created_at DESC);


--
-- Name: idx_identity_verifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_identity_verifications_status ON public.identity_verifications USING btree (status);


--
-- Name: idx_identity_verifications_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_identity_verifications_subject ON public.identity_verifications USING btree (subject_type, subject_id);


--
-- Name: idx_identity_verifications_verified; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_identity_verifications_verified ON public.identity_verifications USING btree (verified_at);


--
-- Name: idx_match_terms_locked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_match_terms_locked ON public.match_terms USING btree (locked);


--
-- Name: idx_match_terms_match; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_match_terms_match ON public.match_terms USING btree (match_id);


--
-- Name: idx_matches_demand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matches_demand ON public.matches USING btree (demand_id);


--
-- Name: idx_matches_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matches_property ON public.matches USING btree (property_id);


--
-- Name: idx_matches_property_demand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matches_property_demand ON public.matches USING btree (property_id, demand_id);


--
-- Name: idx_metric_event_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metric_event_type ON public.metric_events USING btree (event_type);


--
-- Name: idx_metric_event_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metric_event_user ON public.metric_events USING btree (user_id);


--
-- Name: idx_notifications_processed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_processed ON public.notification_events USING btree (processed);


--
-- Name: idx_payments_contract; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_contract ON public.payments USING btree (contract_id);


--
-- Name: idx_payments_provider_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_provider_ref ON public.payments USING btree (provider, provider_payment_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_properties_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_city ON public.properties USING btree (city);


--
-- Name: idx_properties_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_price ON public.properties USING btree (price);


--
-- Name: idx_property_likes_tenant_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_likes_tenant_action ON public.property_likes USING btree (tenant_id, action);


--
-- Name: idx_property_media_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_media_property ON public.property_media USING btree (property_id);


--
-- Name: idx_signature_contract; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signature_contract ON public.signature_events USING btree (contract_id);


--
-- Name: idx_signature_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signature_user ON public.signature_events USING btree (user_id);


--
-- Name: uniq_contract_per_match; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_contract_per_match ON public.contracts USING btree (match_id);


--
-- Name: uniq_signature_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_signature_per_user ON public.signature_events USING btree (contract_id, user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: documents final_pdf_only_after_payment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER final_pdf_only_after_payment BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION public.allow_final_pdf_only_if_paid();


--
-- Name: contracts lock_contract_updates; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER lock_contract_updates BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.prevent_contract_update_when_locked();


--
-- Name: documents lock_final_pdf_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER lock_final_pdf_delete BEFORE DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.prevent_final_pdf_mutation();


--
-- Name: documents lock_final_pdf_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER lock_final_pdf_update BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.prevent_final_pdf_mutation();


--
-- Name: matches on_match_created_notify; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_match_created_notify AFTER INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.notify_match_created();


--
-- Name: payments on_payment_paid_notify; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_payment_paid_notify AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.notify_payment_completed();


--
-- Name: payments on_payment_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_payment_update AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_payment_event();


--
-- Name: signature_events on_signature_event; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_signature_event AFTER INSERT ON public.signature_events FOR EACH ROW EXECUTE FUNCTION public.lock_contract_when_fully_signed();


--
-- Name: payments payment_only_after_signature; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER payment_only_after_signature BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.allow_payment_only_if_contract_signed();


--
-- Name: signature_events signature_only_after_payment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER signature_only_after_payment BEFORE INSERT ON public.signature_events FOR EACH ROW EXECUTE FUNCTION public.allow_signature_only_if_payment_started();


--
-- Name: match_terms trg_advance_match_on_terms_accept; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_advance_match_on_terms_accept AFTER UPDATE ON public.match_terms FOR EACH ROW EXECUTE FUNCTION public.advance_match_on_terms_accept();


--
-- Name: matches trg_auto_approve_match; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_auto_approve_match AFTER INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.auto_approve_match();


--
-- Name: contracts trg_contract_signed; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_contract_signed AFTER UPDATE ON public.contracts FOR EACH ROW WHEN ((new.status = 'signed'::text)) EXECUTE FUNCTION public.notify_contract_signed();


--
-- Name: matches trg_create_contract_on_match_started; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_create_contract_on_match_started AFTER INSERT OR UPDATE OF status ON public.matches FOR EACH ROW EXECUTE FUNCTION public.create_contract_on_match_started();


--
-- Name: contracts trg_lock_contract_on_sign; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_lock_contract_on_sign BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.lock_contract_on_sign();


--
-- Name: match_terms trg_lock_match_terms; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_lock_match_terms BEFORE UPDATE ON public.match_terms FOR EACH ROW EXECUTE FUNCTION public.lock_match_terms_on_accept();


--
-- Name: matches trg_match_contact_enabled; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_match_contact_enabled AFTER UPDATE OF status ON public.matches FOR EACH ROW EXECUTE FUNCTION public.notify_match_contact_enabled();


--
-- Name: match_terms trg_owner_only_match_terms; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_owner_only_match_terms BEFORE INSERT OR UPDATE ON public.match_terms FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_only_match_terms();


--
-- Name: payments trg_payment_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payment_created AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.notify_payment_created();


--
-- Name: payments trg_payment_paid; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_payment_paid AFTER UPDATE ON public.payments FOR EACH ROW WHEN ((new.status = 'paid'::text)) EXECUTE FUNCTION public.notify_payment_paid();


--
-- Name: contracts trg_prevent_update_locked_contract; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_update_locked_contract BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.prevent_update_locked_contract();


--
-- Name: match_terms trg_prevent_update_locked_terms; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_update_locked_terms BEFORE UPDATE ON public.match_terms FOR EACH ROW EXECUTE FUNCTION public.prevent_update_locked_match_terms();


--
-- Name: match_terms trg_tenant_accept_match_terms; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_tenant_accept_match_terms BEFORE UPDATE ON public.match_terms FOR EACH ROW EXECUTE FUNCTION public.enforce_tenant_acceptance();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: contract_signatures contract_signatures_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_signatures
    ADD CONSTRAINT contract_signatures_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_signatures contract_signatures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_signatures
    ADD CONSTRAINT contract_signatures_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: contract_versions contract_versions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_versions contract_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_versions
    ADD CONSTRAINT contract_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: contracts contracts_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_owner_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);


--
-- Name: contracts contracts_payment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_payment_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: contracts contracts_tenant_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES auth.users(id);


--
-- Name: demands demands_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demands
    ADD CONSTRAINT demands_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: identity_documents identity_documents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.identity_documents
    ADD CONSTRAINT identity_documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: identity_documents identity_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.identity_documents
    ADD CONSTRAINT identity_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: match_guarantee_reviews match_guarantee_reviews_demand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_guarantee_reviews
    ADD CONSTRAINT match_guarantee_reviews_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES public.demands(id) ON DELETE CASCADE;


--
-- Name: match_guarantee_reviews match_guarantee_reviews_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_guarantee_reviews
    ADD CONSTRAINT match_guarantee_reviews_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_guarantee_reviews match_guarantee_reviews_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_guarantee_reviews
    ADD CONSTRAINT match_guarantee_reviews_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: match_terms match_terms_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_terms
    ADD CONSTRAINT match_terms_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES auth.users(id);


--
-- Name: match_terms match_terms_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_terms
    ADD CONSTRAINT match_terms_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_terms match_terms_proposed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_terms
    ADD CONSTRAINT match_terms_proposed_by_fkey FOREIGN KEY (proposed_by) REFERENCES auth.users(id);


--
-- Name: matches matches_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: matches matches_demand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES public.demands(id) ON DELETE CASCADE;


--
-- Name: matches matches_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: metric_events metric_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metric_events
    ADD CONSTRAINT metric_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: municipalities municipalities_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipalities
    ADD CONSTRAINT municipalities_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id);


--
-- Name: neighborhoods neighborhoods_municipality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT neighborhoods_municipality_id_fkey FOREIGN KEY (municipality_id) REFERENCES public.municipalities(id);


--
-- Name: notification_events notification_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_events
    ADD CONSTRAINT notification_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: owner_profiles owner_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owner_profiles
    ADD CONSTRAINT owner_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: properties properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: property_actions property_actions_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_actions
    ADD CONSTRAINT property_actions_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: property_actions property_actions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_actions
    ADD CONSTRAINT property_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: property_documents property_documents_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_documents
    ADD CONSTRAINT property_documents_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: property_media property_media_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_media
    ADD CONSTRAINT property_media_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: property_private property_private_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_private
    ADD CONSTRAINT property_private_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: signature_events signature_events_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signature_events
    ADD CONSTRAINT signature_events_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: signature_events signature_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signature_events
    ADD CONSTRAINT signature_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: tenant_documents tenant_documents_demand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_documents
    ADD CONSTRAINT tenant_documents_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES public.demands(id) ON DELETE CASCADE;


--
-- Name: tenant_financial_documents tenant_financial_documents_tenant_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_financial_documents
    ADD CONSTRAINT tenant_financial_documents_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tenant_profiles tenant_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_profiles
    ADD CONSTRAINT tenant_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_contract_data user_contract_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_contract_data
    ADD CONSTRAINT user_contract_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: visits visits_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: visits visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: identity_documents Owner can read identity docs if match approved; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Owner can read identity docs if match approved" ON public.identity_documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.matches m
     JOIN public.demands d ON ((d.id = m.demand_id)))
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE ((d.tenant_id = identity_documents.user_id) AND (p.owner_id = auth.uid()) AND (m.status = ANY (ARRAY['approved'::text, 'visit_scheduled'::text, 'contract_started'::text, 'signed'::text]))))));


--
-- Name: profiles Users can manage their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own profile" ON public.profiles USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_signatures; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_versions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: demands; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs deny client insert audit logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (false);


--
-- Name: contracts deny client insert contracts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client insert contracts" ON public.contracts FOR INSERT WITH CHECK (false);


--
-- Name: documents deny client insert documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client insert documents" ON public.documents FOR INSERT WITH CHECK (false);


--
-- Name: matches deny client insert matches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client insert matches" ON public.matches FOR INSERT WITH CHECK (false);


--
-- Name: metric_events deny client insert metric events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client insert metric events" ON public.metric_events FOR INSERT WITH CHECK (false);


--
-- Name: notification_events deny client insert notification events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client insert notification events" ON public.notification_events FOR INSERT WITH CHECK (false);


--
-- Name: payments deny client insert payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client insert payments" ON public.payments FOR INSERT WITH CHECK (false);


--
-- Name: matches deny client update matches; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client update matches" ON public.matches FOR UPDATE USING (false);


--
-- Name: payments deny client update payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "deny client update payments" ON public.payments FOR UPDATE USING (false);


--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: identity_verifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: matches; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

--
-- Name: metric_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.metric_events ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: property_private owner can delete private data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can delete private data" ON public.property_private FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_private.property_id) AND (p.owner_id = auth.uid())))));


--
-- Name: property_media owner can insert media; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can insert media" ON public.property_media FOR INSERT WITH CHECK ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));


--
-- Name: property_private owner can insert private data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can insert private data" ON public.property_private FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = property_private.property_id) AND (properties.owner_id = auth.uid())))));


--
-- Name: properties owner can insert property; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can insert property" ON public.properties FOR INSERT TO authenticated WITH CHECK ((owner_id = auth.uid()));


--
-- Name: property_media owner can insert property media; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can insert property media" ON public.property_media FOR INSERT TO authenticated WITH CHECK ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));


--
-- Name: owner_profiles owner can manage own owner_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can manage own owner_profile" ON public.owner_profiles USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: properties owner can manage own properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can manage own properties" ON public.properties TO authenticated USING ((owner_id = auth.uid())) WITH CHECK ((owner_id = auth.uid()));


--
-- Name: property_documents owner can manage own property documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can manage own property documents" ON public.property_documents USING ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_documents.property_id) AND (p.owner_id = auth.uid())))));


--
-- Name: property_private owner can manage private data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can manage private data" ON public.property_private FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_private.property_id) AND (p.owner_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_private.property_id) AND (p.owner_id = auth.uid())))));


--
-- Name: tenant_financial_documents owner can read matched tenant docs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can read matched tenant docs" ON public.tenant_financial_documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.matches m
     JOIN public.demands d ON ((d.id = m.demand_id)))
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE ((d.tenant_id = tenant_financial_documents.tenant_id) AND (p.owner_id = auth.uid())))));


--
-- Name: properties owner can read own properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can read own properties" ON public.properties FOR SELECT TO authenticated USING ((owner_id = auth.uid()));


--
-- Name: properties owner can read own properties (any status); Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can read own properties (any status)" ON public.properties FOR SELECT USING ((owner_id = auth.uid()));


--
-- Name: properties owner can read own property; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can read own property" ON public.properties FOR SELECT USING ((owner_id = auth.uid()));


--
-- Name: property_private owner can read private data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can read private data" ON public.property_private FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_private.property_id) AND (p.owner_id = auth.uid())))));


--
-- Name: properties owner can read property; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can read property" ON public.properties FOR SELECT USING ((owner_id = auth.uid()));


--
-- Name: property_media owner can read property media; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "owner can read property media" ON public.property_media FOR SELECT TO authenticated USING ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));


--
-- Name: owner_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts owner_select_own_contracts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY owner_select_own_contracts ON public.contracts FOR SELECT USING ((owner_id = auth.uid()));


--
-- Name: contracts participants can read contract; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants can read contract" ON public.contracts FOR SELECT USING (((auth.uid() = tenant_id) OR (auth.uid() = owner_id)));


--
-- Name: contracts participants can view contract; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants can view contract" ON public.contracts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.matches m
     JOIN public.properties p ON ((p.id = m.property_id)))
     JOIN public.demands d ON ((d.id = m.demand_id)))
  WHERE ((m.id = contracts.match_id) AND ((p.owner_id = auth.uid()) OR (d.tenant_id = auth.uid()))))));


--
-- Name: documents participants can view documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants can view documents" ON public.documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (((public.contracts c
     JOIN public.matches m ON ((m.id = c.match_id)))
     JOIN public.properties p ON ((p.id = m.property_id)))
     JOIN public.demands d ON ((d.id = m.demand_id)))
  WHERE ((c.id = documents.contract_id) AND ((p.owner_id = auth.uid()) OR (d.tenant_id = auth.uid()))))));


--
-- Name: matches participants can view match; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants can view match" ON public.matches FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.properties p
     JOIN public.demands d ON ((d.id = matches.demand_id)))
  WHERE ((p.id = matches.property_id) AND ((p.owner_id = auth.uid()) OR (d.tenant_id = auth.uid()))))));


--
-- Name: payments participants can view payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "participants can view payments" ON public.payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (((public.contracts c
     JOIN public.matches m ON ((m.id = c.match_id)))
     JOIN public.properties p ON ((p.id = m.property_id)))
     JOIN public.demands d ON ((d.id = m.demand_id)))
  WHERE ((c.id = payments.contract_id) AND (d.tenant_id = auth.uid())))));


--
-- Name: contracts parties can read contract; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties can read contract" ON public.contracts FOR SELECT USING (((auth.uid() IN ( SELECT tp.id
   FROM ((public.matches m
     JOIN public.demands d ON ((d.id = m.demand_id)))
     JOIN public.tenant_profiles tp ON ((tp.id = d.tenant_id)))
  WHERE (m.id = contracts.match_id))) OR (auth.uid() IN ( SELECT p.owner_id
   FROM (public.matches m
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE (m.id = contracts.match_id))) OR (auth.role() = 'service_role'::text)));


--
-- Name: contracts parties can sign contract; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties can sign contract" ON public.contracts FOR UPDATE USING (((auth.uid() IN ( SELECT d.tenant_id
   FROM (public.matches m
     JOIN public.demands d ON ((d.id = m.demand_id)))
  WHERE (m.id = contracts.match_id))) OR (auth.uid() IN ( SELECT p.owner_id
   FROM (public.matches m
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE (m.id = contracts.match_id))))) WITH CHECK ((status = 'signed'::text));


--
-- Name: contracts parties can update contract before lock; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties can update contract before lock" ON public.contracts FOR UPDATE USING ((((locked = false) AND ((auth.uid() IN ( SELECT tp.id
   FROM ((public.matches m
     JOIN public.demands d ON ((d.id = m.demand_id)))
     JOIN public.tenant_profiles tp ON ((tp.id = d.tenant_id)))
  WHERE (m.id = contracts.match_id))) OR (auth.uid() IN ( SELECT p.owner_id
   FROM (public.matches m
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE (m.id = contracts.match_id))))) OR (auth.role() = 'service_role'::text))) WITH CHECK ((((locked = false) AND ((auth.uid() IN ( SELECT tp.id
   FROM ((public.matches m
     JOIN public.demands d ON ((d.id = m.demand_id)))
     JOIN public.tenant_profiles tp ON ((tp.id = d.tenant_id)))
  WHERE (m.id = contracts.match_id))) OR (auth.uid() IN ( SELECT p.owner_id
   FROM (public.matches m
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE (m.id = contracts.match_id))))) OR (auth.role() = 'service_role'::text)));


--
-- Name: contracts parties can view contract; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties can view contract" ON public.contracts FOR SELECT USING (((auth.uid() IN ( SELECT d.tenant_id
   FROM (public.matches m
     JOIN public.demands d ON ((d.id = m.demand_id)))
  WHERE (m.id = contracts.match_id))) OR (auth.uid() IN ( SELECT p.owner_id
   FROM (public.matches m
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE (m.id = contracts.match_id))) OR (auth.role() = 'service_role'::text)));


--
-- Name: payments parties can view payment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "parties can view payment" ON public.payments FOR SELECT USING (((auth.uid() IN ( SELECT d.tenant_id
   FROM ((public.contracts c
     JOIN public.matches m ON ((m.id = c.match_id)))
     JOIN public.demands d ON ((d.id = m.demand_id)))
  WHERE (c.id = payments.contract_id))) OR (auth.uid() IN ( SELECT p.owner_id
   FROM ((public.contracts c
     JOIN public.matches m ON ((m.id = c.match_id)))
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE (c.id = payments.contract_id))) OR (auth.role() = 'service_role'::text)));


--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: properties; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

--
-- Name: property_documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: property_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: property_likes property_likes_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY property_likes_insert ON public.property_likes FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: property_media; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

--
-- Name: property_private; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.property_private ENABLE ROW LEVEL SECURITY;

--
-- Name: property_media public can read published media; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public can read published media" ON public.property_media FOR SELECT TO anon USING ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.publish_status = 'published'::text))));


--
-- Name: properties public can read published properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public can read published properties" ON public.properties FOR SELECT TO authenticated, anon USING (((available = true) AND (publish_status = 'published'::text)));


--
-- Name: property_media public can view media of published properties; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "public can view media of published properties" ON public.property_media FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_media.property_id) AND (p.available = true) AND (p.publish_status = 'published'::text)))));


--
-- Name: profiles read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: notifications service creates notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "service creates notifications" ON public.notifications FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: payments service updates payment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "service updates payment" ON public.payments FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: signature_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.signature_events ENABLE ROW LEVEL SECURITY;

--
-- Name: payments tenant can create payment; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tenant can create payment" ON public.payments FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT d.tenant_id
   FROM ((public.contracts c
     JOIN public.matches m ON ((m.id = c.match_id)))
     JOIN public.demands d ON ((d.id = m.demand_id)))
  WHERE (c.id = payments.contract_id))));


--
-- Name: property_likes tenant can insert own likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tenant can insert own likes" ON public.property_likes FOR INSERT WITH CHECK ((auth.uid() = tenant_id));


--
-- Name: demands tenant can manage own demands; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tenant can manage own demands" ON public.demands USING ((auth.uid() = tenant_id)) WITH CHECK ((auth.uid() = tenant_id));


--
-- Name: tenant_documents tenant can manage own documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tenant can manage own documents" ON public.tenant_documents USING ((EXISTS ( SELECT 1
   FROM public.demands d
  WHERE ((d.id = tenant_documents.demand_id) AND (d.tenant_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.demands d
  WHERE ((d.id = tenant_documents.demand_id) AND (d.tenant_id = auth.uid())))));


--
-- Name: tenant_profiles tenant can manage own tenant_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tenant can manage own tenant_profile" ON public.tenant_profiles USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: property_likes tenant can read own likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tenant can read own likes" ON public.property_likes FOR SELECT USING ((auth.uid() = tenant_id));


--
-- Name: tenant_financial_documents tenant manages own financial docs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "tenant manages own financial docs" ON public.tenant_financial_documents USING ((tenant_id = auth.uid())) WITH CHECK ((tenant_id = auth.uid()));


--
-- Name: property_likes tenant_can_like; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_can_like ON public.property_likes FOR INSERT TO authenticated WITH CHECK ((tenant_id = auth.uid()));


--
-- Name: tenant_documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_financial_documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenant_financial_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts tenant_select_own_contracts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_select_own_contracts ON public.contracts FOR SELECT USING ((tenant_id = auth.uid()));


--
-- Name: payments tenant_select_own_payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenant_select_own_payments ON public.payments FOR SELECT USING ((contract_id IN ( SELECT contracts.id
   FROM public.contracts
  WHERE (contracts.tenant_id = auth.uid()))));


--
-- Name: profiles update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: identity_verifications user_can_read_own_identity; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_can_read_own_identity ON public.identity_verifications FOR SELECT USING (((subject_type = 'user'::text) AND (subject_id = auth.uid())));


--
-- Name: identity_documents user_insert_own_identity_docs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_insert_own_identity_docs ON public.identity_documents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: identity_documents user_select_own_identity_docs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_select_own_identity_docs ON public.identity_documents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: property_likes users can like; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users can like" ON public.property_likes FOR INSERT WITH CHECK ((tenant_id = auth.uid()));


--
-- Name: contracts users can read their contract; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users can read their contract" ON public.contracts FOR SELECT USING (((auth.uid() = tenant_id) OR (auth.uid() = owner_id)));


--
-- Name: notifications users read own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users read own notifications" ON public.notifications FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: notifications users see own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "users see own notifications" ON public.notifications FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects authenticated upload media; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "authenticated upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'media'::text));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: objects only parties can read documents; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "only parties can read documents" ON storage.objects FOR SELECT USING (((bucket_id = 'property-documents'::text) AND (auth.uid() = owner)));


--
-- Name: objects owner can manage property media; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "owner can manage property media" ON storage.objects USING (((bucket_id = 'property-media'::text) AND (auth.uid() = owner)));


--
-- Name: objects owner can upload media; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "owner can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'media'::text));


--
-- Name: objects owner uploads documents; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "owner uploads documents" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'property-documents'::text) AND (auth.uid() = owner)));


--
-- Name: objects owners can upload media; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "owners can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'media'::text));


--
-- Name: objects public can read media; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "public can read media" ON storage.objects FOR SELECT USING ((bucket_id = 'media'::text));


--
-- Name: objects public can read property media; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "public can read property media" ON storage.objects FOR SELECT USING ((bucket_id = 'property-media'::text));


--
-- Name: objects public read media; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "public read media" ON storage.objects FOR SELECT USING ((bucket_id = 'media'::text));


--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: objects tenant read own financial docs; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "tenant read own financial docs" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'financial-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects tenant upload own financial docs; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "tenant upload own financial docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'financial-documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION advance_match_on_terms_accept(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.advance_match_on_terms_accept() TO anon;
GRANT ALL ON FUNCTION public.advance_match_on_terms_accept() TO authenticated;
GRANT ALL ON FUNCTION public.advance_match_on_terms_accept() TO service_role;


--
-- Name: FUNCTION allow_final_pdf_only_if_paid(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.allow_final_pdf_only_if_paid() TO anon;
GRANT ALL ON FUNCTION public.allow_final_pdf_only_if_paid() TO authenticated;
GRANT ALL ON FUNCTION public.allow_final_pdf_only_if_paid() TO service_role;


--
-- Name: FUNCTION allow_payment_only_if_contract_signed(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.allow_payment_only_if_contract_signed() TO anon;
GRANT ALL ON FUNCTION public.allow_payment_only_if_contract_signed() TO authenticated;
GRANT ALL ON FUNCTION public.allow_payment_only_if_contract_signed() TO service_role;


--
-- Name: FUNCTION allow_signature_only_if_payment_started(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.allow_signature_only_if_payment_started() TO anon;
GRANT ALL ON FUNCTION public.allow_signature_only_if_payment_started() TO authenticated;
GRANT ALL ON FUNCTION public.allow_signature_only_if_payment_started() TO service_role;


--
-- Name: FUNCTION approve_match(match_uuid uuid, admin_user uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.approve_match(match_uuid uuid, admin_user uuid) TO anon;
GRANT ALL ON FUNCTION public.approve_match(match_uuid uuid, admin_user uuid) TO authenticated;
GRANT ALL ON FUNCTION public.approve_match(match_uuid uuid, admin_user uuid) TO service_role;


--
-- Name: FUNCTION auto_approve_match(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.auto_approve_match() TO anon;
GRANT ALL ON FUNCTION public.auto_approve_match() TO authenticated;
GRANT ALL ON FUNCTION public.auto_approve_match() TO service_role;


--
-- Name: FUNCTION confirm_payment(payment_uuid uuid, new_status text, provider_payment_ref text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.confirm_payment(payment_uuid uuid, new_status text, provider_payment_ref text) TO anon;
GRANT ALL ON FUNCTION public.confirm_payment(payment_uuid uuid, new_status text, provider_payment_ref text) TO authenticated;
GRANT ALL ON FUNCTION public.confirm_payment(payment_uuid uuid, new_status text, provider_payment_ref text) TO service_role;


--
-- Name: FUNCTION create_contract_on_match_started(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_contract_on_match_started() TO anon;
GRANT ALL ON FUNCTION public.create_contract_on_match_started() TO authenticated;
GRANT ALL ON FUNCTION public.create_contract_on_match_started() TO service_role;


--
-- Name: FUNCTION create_notification(p_user_id uuid, p_type text, p_entity text, p_entity_id uuid, p_payload jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_notification(p_user_id uuid, p_type text, p_entity text, p_entity_id uuid, p_payload jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_notification(p_user_id uuid, p_type text, p_entity text, p_entity_id uuid, p_payload jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_notification(p_user_id uuid, p_type text, p_entity text, p_entity_id uuid, p_payload jsonb) TO service_role;


--
-- Name: FUNCTION enforce_owner_only_match_terms(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enforce_owner_only_match_terms() TO anon;
GRANT ALL ON FUNCTION public.enforce_owner_only_match_terms() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_owner_only_match_terms() TO service_role;


--
-- Name: FUNCTION enforce_tenant_acceptance(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enforce_tenant_acceptance() TO anon;
GRANT ALL ON FUNCTION public.enforce_tenant_acceptance() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_tenant_acceptance() TO service_role;


--
-- Name: FUNCTION get_enums(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_enums() TO anon;
GRANT ALL ON FUNCTION public.get_enums() TO authenticated;
GRANT ALL ON FUNCTION public.get_enums() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION increment_session(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_session() TO anon;
GRANT ALL ON FUNCTION public.increment_session() TO authenticated;
GRANT ALL ON FUNCTION public.increment_session() TO service_role;


--
-- Name: FUNCTION lock_contract_on_sign(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.lock_contract_on_sign() TO anon;
GRANT ALL ON FUNCTION public.lock_contract_on_sign() TO authenticated;
GRANT ALL ON FUNCTION public.lock_contract_on_sign() TO service_role;


--
-- Name: FUNCTION lock_contract_when_fully_signed(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.lock_contract_when_fully_signed() TO anon;
GRANT ALL ON FUNCTION public.lock_contract_when_fully_signed() TO authenticated;
GRANT ALL ON FUNCTION public.lock_contract_when_fully_signed() TO service_role;


--
-- Name: FUNCTION lock_match_terms_on_accept(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.lock_match_terms_on_accept() TO anon;
GRANT ALL ON FUNCTION public.lock_match_terms_on_accept() TO authenticated;
GRANT ALL ON FUNCTION public.lock_match_terms_on_accept() TO service_role;


--
-- Name: FUNCTION log_payment_event(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_payment_event() TO anon;
GRANT ALL ON FUNCTION public.log_payment_event() TO authenticated;
GRANT ALL ON FUNCTION public.log_payment_event() TO service_role;


--
-- Name: FUNCTION notify_contract_created(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_contract_created() TO anon;
GRANT ALL ON FUNCTION public.notify_contract_created() TO authenticated;
GRANT ALL ON FUNCTION public.notify_contract_created() TO service_role;


--
-- Name: FUNCTION notify_contract_signed(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_contract_signed() TO anon;
GRANT ALL ON FUNCTION public.notify_contract_signed() TO authenticated;
GRANT ALL ON FUNCTION public.notify_contract_signed() TO service_role;


--
-- Name: FUNCTION notify_match_contact_enabled(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_match_contact_enabled() TO anon;
GRANT ALL ON FUNCTION public.notify_match_contact_enabled() TO authenticated;
GRANT ALL ON FUNCTION public.notify_match_contact_enabled() TO service_role;


--
-- Name: FUNCTION notify_match_created(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_match_created() TO anon;
GRANT ALL ON FUNCTION public.notify_match_created() TO authenticated;
GRANT ALL ON FUNCTION public.notify_match_created() TO service_role;


--
-- Name: FUNCTION notify_payment_completed(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_payment_completed() TO anon;
GRANT ALL ON FUNCTION public.notify_payment_completed() TO authenticated;
GRANT ALL ON FUNCTION public.notify_payment_completed() TO service_role;


--
-- Name: FUNCTION notify_payment_created(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_payment_created() TO anon;
GRANT ALL ON FUNCTION public.notify_payment_created() TO authenticated;
GRANT ALL ON FUNCTION public.notify_payment_created() TO service_role;


--
-- Name: FUNCTION notify_payment_paid(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_payment_paid() TO anon;
GRANT ALL ON FUNCTION public.notify_payment_paid() TO authenticated;
GRANT ALL ON FUNCTION public.notify_payment_paid() TO service_role;


--
-- Name: FUNCTION prevent_contract_update_when_locked(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.prevent_contract_update_when_locked() TO anon;
GRANT ALL ON FUNCTION public.prevent_contract_update_when_locked() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_contract_update_when_locked() TO service_role;


--
-- Name: FUNCTION prevent_final_pdf_mutation(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.prevent_final_pdf_mutation() TO anon;
GRANT ALL ON FUNCTION public.prevent_final_pdf_mutation() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_final_pdf_mutation() TO service_role;


--
-- Name: FUNCTION prevent_update_locked_contract(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.prevent_update_locked_contract() TO anon;
GRANT ALL ON FUNCTION public.prevent_update_locked_contract() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_update_locked_contract() TO service_role;


--
-- Name: FUNCTION prevent_update_locked_match_terms(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.prevent_update_locked_match_terms() TO anon;
GRANT ALL ON FUNCTION public.prevent_update_locked_match_terms() TO authenticated;
GRANT ALL ON FUNCTION public.prevent_update_locked_match_terms() TO service_role;


--
-- Name: FUNCTION run_auto_matching(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.run_auto_matching() FROM PUBLIC;
GRANT ALL ON FUNCTION public.run_auto_matching() TO anon;
GRANT ALL ON FUNCTION public.run_auto_matching() TO service_role;


--
-- Name: FUNCTION transition_match_status(p_match_id uuid, p_new_status text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.transition_match_status(p_match_id uuid, p_new_status text) TO anon;
GRANT ALL ON FUNCTION public.transition_match_status(p_match_id uuid, p_new_status text) TO authenticated;
GRANT ALL ON FUNCTION public.transition_match_status(p_match_id uuid, p_new_status text) TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE contract_signatures; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contract_signatures TO anon;
GRANT ALL ON TABLE public.contract_signatures TO authenticated;
GRANT ALL ON TABLE public.contract_signatures TO service_role;


--
-- Name: TABLE contract_versions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contract_versions TO anon;
GRANT ALL ON TABLE public.contract_versions TO authenticated;
GRANT ALL ON TABLE public.contract_versions TO service_role;


--
-- Name: TABLE contracts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contracts TO anon;
GRANT ALL ON TABLE public.contracts TO authenticated;
GRANT ALL ON TABLE public.contracts TO service_role;


--
-- Name: TABLE contracts_debug; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contracts_debug TO anon;
GRANT ALL ON TABLE public.contracts_debug TO authenticated;
GRANT ALL ON TABLE public.contracts_debug TO service_role;


--
-- Name: TABLE demands; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.demands TO anon;
GRANT ALL ON TABLE public.demands TO authenticated;
GRANT ALL ON TABLE public.demands TO service_role;


--
-- Name: TABLE matches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.matches TO anon;
GRANT ALL ON TABLE public.matches TO authenticated;
GRANT ALL ON TABLE public.matches TO service_role;


--
-- Name: TABLE properties; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.properties TO anon;
GRANT ALL ON TABLE public.properties TO authenticated;
GRANT ALL ON TABLE public.properties TO service_role;


--
-- Name: TABLE demands_visible_to_owner; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.demands_visible_to_owner TO anon;
GRANT ALL ON TABLE public.demands_visible_to_owner TO authenticated;
GRANT ALL ON TABLE public.demands_visible_to_owner TO service_role;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;


--
-- Name: TABLE identity_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.identity_documents TO anon;
GRANT ALL ON TABLE public.identity_documents TO authenticated;
GRANT ALL ON TABLE public.identity_documents TO service_role;


--
-- Name: TABLE identity_verifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.identity_verifications TO anon;
GRANT ALL ON TABLE public.identity_verifications TO authenticated;
GRANT ALL ON TABLE public.identity_verifications TO service_role;


--
-- Name: TABLE match_guarantee_reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.match_guarantee_reviews TO anon;
GRANT ALL ON TABLE public.match_guarantee_reviews TO authenticated;
GRANT ALL ON TABLE public.match_guarantee_reviews TO service_role;


--
-- Name: TABLE match_terms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.match_terms TO anon;
GRANT ALL ON TABLE public.match_terms TO authenticated;
GRANT ALL ON TABLE public.match_terms TO service_role;


--
-- Name: TABLE matching_candidates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.matching_candidates TO anon;
GRANT ALL ON TABLE public.matching_candidates TO authenticated;
GRANT ALL ON TABLE public.matching_candidates TO service_role;


--
-- Name: TABLE metric_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.metric_events TO anon;
GRANT ALL ON TABLE public.metric_events TO authenticated;
GRANT ALL ON TABLE public.metric_events TO service_role;


--
-- Name: TABLE municipalities; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.municipalities TO anon;
GRANT ALL ON TABLE public.municipalities TO authenticated;
GRANT ALL ON TABLE public.municipalities TO service_role;


--
-- Name: TABLE neighborhoods; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.neighborhoods TO anon;
GRANT ALL ON TABLE public.neighborhoods TO authenticated;
GRANT ALL ON TABLE public.neighborhoods TO service_role;


--
-- Name: TABLE notification_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_events TO anon;
GRANT ALL ON TABLE public.notification_events TO authenticated;
GRANT ALL ON TABLE public.notification_events TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE owner_dashboard; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.owner_dashboard TO anon;
GRANT ALL ON TABLE public.owner_dashboard TO authenticated;
GRANT ALL ON TABLE public.owner_dashboard TO service_role;


--
-- Name: TABLE owner_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.owner_profiles TO anon;
GRANT ALL ON TABLE public.owner_profiles TO authenticated;
GRANT ALL ON TABLE public.owner_profiles TO service_role;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE property_media; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_media TO anon;
GRANT ALL ON TABLE public.property_media TO authenticated;
GRANT ALL ON TABLE public.property_media TO service_role;


--
-- Name: TABLE properties_feed; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.properties_feed TO anon;
GRANT ALL ON TABLE public.properties_feed TO authenticated;
GRANT ALL ON TABLE public.properties_feed TO service_role;


--
-- Name: TABLE properties_visible_to_tenant; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.properties_visible_to_tenant TO anon;
GRANT ALL ON TABLE public.properties_visible_to_tenant TO authenticated;
GRANT ALL ON TABLE public.properties_visible_to_tenant TO service_role;


--
-- Name: TABLE property_actions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_actions TO anon;
GRANT ALL ON TABLE public.property_actions TO authenticated;
GRANT ALL ON TABLE public.property_actions TO service_role;


--
-- Name: TABLE property_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_documents TO anon;
GRANT ALL ON TABLE public.property_documents TO authenticated;
GRANT ALL ON TABLE public.property_documents TO service_role;


--
-- Name: TABLE property_likes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_likes TO anon;
GRANT ALL ON TABLE public.property_likes TO authenticated;
GRANT ALL ON TABLE public.property_likes TO service_role;


--
-- Name: TABLE property_private; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.property_private TO anon;
GRANT ALL ON TABLE public.property_private TO authenticated;
GRANT ALL ON TABLE public.property_private TO service_role;


--
-- Name: TABLE provinces; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.provinces TO anon;
GRANT ALL ON TABLE public.provinces TO authenticated;
GRANT ALL ON TABLE public.provinces TO service_role;


--
-- Name: TABLE signature_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.signature_events TO anon;
GRANT ALL ON TABLE public.signature_events TO authenticated;
GRANT ALL ON TABLE public.signature_events TO service_role;


--
-- Name: TABLE site_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_stats TO anon;
GRANT ALL ON TABLE public.site_stats TO authenticated;
GRANT ALL ON TABLE public.site_stats TO service_role;


--
-- Name: TABLE tenant_dashboard; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tenant_dashboard TO anon;
GRANT ALL ON TABLE public.tenant_dashboard TO authenticated;
GRANT ALL ON TABLE public.tenant_dashboard TO service_role;


--
-- Name: TABLE tenant_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tenant_documents TO anon;
GRANT ALL ON TABLE public.tenant_documents TO authenticated;
GRANT ALL ON TABLE public.tenant_documents TO service_role;


--
-- Name: TABLE tenant_financial_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tenant_financial_documents TO anon;
GRANT ALL ON TABLE public.tenant_financial_documents TO authenticated;
GRANT ALL ON TABLE public.tenant_financial_documents TO service_role;


--
-- Name: TABLE tenant_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tenant_profiles TO anon;
GRANT ALL ON TABLE public.tenant_profiles TO authenticated;
GRANT ALL ON TABLE public.tenant_profiles TO service_role;


--
-- Name: TABLE user_contract_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_contract_data TO anon;
GRANT ALL ON TABLE public.user_contract_data TO authenticated;
GRANT ALL ON TABLE public.user_contract_data TO service_role;


--
-- Name: TABLE visits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.visits TO anon;
GRANT ALL ON TABLE public.visits TO authenticated;
GRANT ALL ON TABLE public.visits TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict DrRINQLndYF8so8P4CmzR7LIqd5mKbvkrM413YXMxfpG29ABO8nHapvLJ8Rk7MZ

