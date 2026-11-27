-- VERLO / Signatura: QA ONLY. Execute manually in Supabase QA SQL Editor.
-- Project: anptswspguyotnasoacq. NEVER run on production.
-- Creates an internal delivery inbox, not a verified-identity credential.
-- This script DOES NOT enable any provider, write personal data, or mark signatures completed.

begin;

create table if not exists public.signatura_webhook_events (
  id bigint generated always as identity primary key,
  fingerprint text not null unique
    check (fingerprint ~ '^[a-f0-9]{64}$'),
  document_id uuid not null,
  signature_id uuid null,
  notification_action text not null
    check (length(notification_action) between 1 and 80),
  new_status text null
    check (new_status is null or length(new_status) <= 80),
  received_at timestamptz not null default now(),
  reconciled_at timestamptz null
);

create index if not exists signatura_webhook_events_unreconciled_idx
  on public.signatura_webhook_events (received_at)
  where reconciled_at is null;

alter table public.signatura_webhook_events enable row level security;

-- No client (anonymous or authenticated) can read or write internal webhook receipts.
revoke all on table public.signatura_webhook_events from public, anon, authenticated;
revoke all on sequence public.signatura_webhook_events_id_seq from public, anon, authenticated;

commit;

-- Verify in QA:
select to_regclass('public.signatura_webhook_events') as signatura_inbox,
       relrowsecurity as rls_enabled
from pg_class
where oid = 'public.signatura_webhook_events'::regclass;

-- Expected: signatura_webhook_events and rls_enabled=true.
