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

-- No scheduler, triggers or automatic queue producers until explicit cutover.

-- V2: atomic claim/finish, service-role only. No automatic scheduler.
-- Only explicitly queued events are eligible; nothing historical is imported.
create or replace function public.verlo_email_claim(p_limit integer default 10)
returns setof public.verlo_email_outbox
language plpgsql security definer set search_path=public as $function$
begin
  return query
  with selected as (
    select id from public.verlo_email_outbox
    where status in ('pending','failed')
      and attempts < 4
      and available_at <= now()
    order by created_at, id
    for update skip locked
    limit least(greatest(coalesce(p_limit,10),1),10)
  )
  update public.verlo_email_outbox o
     set status='processing', attempts=o.attempts+1,
         locked_at=now(), updated_at=now(), last_error=null
    from selected s where o.id=s.id
  returning o.*;
end;
$function$;

create or replace function public.verlo_email_finish(
 p_id uuid, p_status text, p_provider_id text default null,
 p_error text default null
) returns boolean
language plpgsql security definer set search_path=public as $function$
declare v_count integer;
begin
  if p_status not in ('accepted','failed','unknown','cancelled') then
    raise exception 'invalid_email_finish_status';
  end if;
  update public.verlo_email_outbox
  set status=p_status,
      provider=case when p_status='accepted' then 'zeptomail' else provider end,
      provider_id=case when p_status='accepted' then p_provider_id else provider_id end,
      accepted_at=case when p_status='accepted' then now() else accepted_at end,
      available_at=case when p_status='failed'
         then now()+make_interval(mins=>least(60, (2 ^ least(attempts,5))::integer))
         else available_at end,
      last_error=case when p_status='accepted' then null else left(coalesce(p_error,'Email delivery not confirmed'),300) end,
      locked_at=null, updated_at=now()
  where id=p_id and status='processing';
  get diagnostics v_count=row_count;
  return v_count=1;
end;
$function$;

revoke all on function public.verlo_email_claim(integer) from public, anon, authenticated;
revoke all on function public.verlo_email_finish(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.verlo_email_claim(integer) to service_role;
grant execute on function public.verlo_email_finish(uuid,text,text,text) to service_role;

-- Deliberately do NOT re-claim stuck 'processing' or 'unknown':
-- a network timeout could occur after Zoho accepted the request.

commit;
