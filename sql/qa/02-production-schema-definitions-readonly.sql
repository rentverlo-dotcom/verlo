-- VERLO QA / PHASE 2: Read-only DDL inventory from PRODUCTION.
-- IMPORTANT: Execute in the production SQL Editor; this ONLY reads pg_catalog metadata.
-- This complements 01-production-schema-inventory-readonly.sql.
-- It does not copy table rows, auth.users, documents or private storage objects.
-- Inspect results before sharing: function definitions may contain hardcoded credentials
-- if they were ever written into a SQL function. Redact any such literals.
WITH function_defs AS (
  SELECT n.nspname AS schema_name,
         p.oid::regprocedure::text AS function_signature,
         pg_get_functiondef(p.oid) AS definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
), view_defs AS (
  SELECT n.nspname AS schema_name,
         c.relname AS view_name,
         c.relkind AS kind,
         pg_get_viewdef(c.oid,true) AS definition,
         c.reloptions AS options
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('v','m')
), table_constraints AS (
  SELECT con.conrelid::regclass::text AS table_name,
         con.conname AS name,
         con.contype AS constraint_type,
         pg_get_constraintdef(con.oid,true) AS definition
  FROM pg_constraint con
  JOIN pg_namespace n ON n.oid=con.connamespace
  WHERE n.nspname='public'
), index_defs AS (
  SELECT schemaname,tablename,indexname,indexdef
  FROM pg_indexes WHERE schemaname='public'
), enum_defs AS (
  SELECT n.nspname AS schema_name,t.typname AS enum_name,
         array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
  FROM pg_type t
  JOIN pg_namespace n ON n.oid=t.typnamespace
  JOIN pg_enum e ON e.enumtypid=t.oid
  WHERE n.nspname='public'
  GROUP BY n.nspname,t.typname
), rel_security AS (
  SELECT n.nspname AS schema_name,c.relname AS table_name,
         c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS rls_forced,
         c.relreplident AS replication_identity
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
)
SELECT jsonb_pretty(jsonb_build_object(
  'functions',(SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY function_signature),'[]'::jsonb) FROM function_defs f),
  'views',(SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY view_name),'[]'::jsonb) FROM view_defs v),
  'constraints',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY table_name,name),'[]'::jsonb) FROM table_constraints c),
  'indexes',(SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY tablename,indexname),'[]'::jsonb) FROM index_defs i),
  'enums',(SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY enum_name),'[]'::jsonb) FROM enum_defs e),
  'table_rls',(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY table_name),'[]'::jsonb) FROM rel_security s)
)) AS qa_schema_definitions;
