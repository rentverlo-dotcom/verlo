-- VERLO unified email outbox: additive only, no triggers, no backfill, no sends.
-- Run manually in Supabase SQL Editor AFTER code review.
begin;

create table if not exists public.verlo_email_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  area text not null check (area in ('tradicionales','temporarios','powermarket')),
  event_type text not null,
  recipient_email text not null,
  recipient_role text not null check (recipient_role in ('tenant','owner')),
  status text not null default 'pending'
    check (status in ('pending','processing','accepted','failed','unknown','cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  accepted_at timestamptz,
  provider text,
  provider_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verlo_email_outbox_once unique (event_key,recipient_email)
);

create index if not exists verlo_email_outbox_ready
  on public.verlo_email_outbox (available_at,created_at)
  where status in ('pending','failed');

create index if not exists verlo_email_outbox_events
  on public.verlo_email_outbox (area,event_type,created_at desc);

alter table public.verlo_email_outbox enable row level security;
revoke all on public.verlo_email_outbox from anon, authenticated;
grant select,insert,update on public.verlo_email_outbox to service_role;

comment on table public.verlo_email_outbox is
  'Future native email delivery. No triggers, no backfill, no live dispatcher. Accepted means provider accepted, not inbox delivered. Unknown outcome is quarantined to prevent accidental duplicates.';

-- No RPC / no scheduler until Zoho activates sending and an explicit cutover is approved.
commit;
