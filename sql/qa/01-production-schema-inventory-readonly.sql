-- VERLO QA - inventory READ ONLY.
-- Run only in PRODUCTION SQL Editor to export metadata; it never changes customer records.
-- Export the single JSON result and use it to compare QA after schema migration.
-- Do NOT include secrets, data rows, documents, auth users or service-role keys.
WITH objects AS (
 SELECT table_schema,table_name,table_type
 FROM information_schema.tables
 WHERE table_schema = 'public'
), columns_qa AS (
 SELECT table_schema,table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default
 FROM information_schema.columns WHERE table_schema='public'
), policies AS (
 SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
 FROM pg_policies WHERE schemaname IN ('public','storage')
), funcs AS (
 SELECT n.nspname AS schema_name,p.proname AS function_name,
        pg_get_function_identity_arguments(p.oid) AS arguments,
        p.prosecdef AS security_definer
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
), triggers_qa AS (
 SELECT event_object_schema,event_object_table,trigger_name,event_manipulation,
        action_timing,action_statement
 FROM information_schema.triggers
 WHERE event_object_schema='public'
), fk AS (
 SELECT conrelid::regclass::text AS on_table,conname AS name,
        pg_get_constraintdef(oid) AS definition
 FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace
)
SELECT jsonb_pretty(jsonb_build_object(
 'project_note','METADATA ONLY - NO USER DATA',
 'public_tables',(SELECT coalesce(jsonb_agg(to_jsonb(o) ORDER BY o.table_name), '[]'::jsonb) FROM objects o),
 'public_columns',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.table_name,c.ordinal_position),'[]'::jsonb) FROM columns_qa c),
 'policies',(SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.schemaname,p.tablename,p.policyname),'[]'::jsonb) FROM policies p),
 'public_functions',(SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY f.function_name),'[]'::jsonb) FROM funcs f),
 'triggers',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.event_object_table,t.trigger_name),'[]'::jsonb) FROM triggers_qa t),
 'foreign_keys',(SELECT coalesce(jsonb_agg(to_jsonb(k) ORDER BY k.on_table,k.name),'[]'::jsonb) FROM fk k),
 'extensions',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',extname,'schema',extnamespace::regnamespace::text) ORDER BY extname),'[]'::jsonb) FROM pg_extension),
 'storage_buckets',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'public',public) ORDER BY id),'[]'::jsonb) FROM storage.buckets)
)) AS qa_schema_inventory;
