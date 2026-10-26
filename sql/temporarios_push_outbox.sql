-- VERLO Temporarios: independent push queue, no changes to existing email outbox.
-- Apply after sql/temporarios_push_subscriptions.sql and sql/temporarios_notification_outbox.sql.
create table if not exists public.temporary_push_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.temporary_notification_outbox(id) on delete cascade,
  recipient_user_id uuid not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','no_subscription')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_error text
);
create index if not exists temporary_push_outbox_ready_idx on public.temporary_push_outbox(status,available_at,created_at);
alter table public.temporary_push_outbox enable row level security;
revoke all on public.temporary_push_outbox from anon,authenticated;
create or replace function public.temporary_enqueue_push_from_notification()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.temporary_push_outbox(notification_id,recipient_user_id,event_type,payload)
  values(new.id,new.recipient_user_id,new.event_type,new.payload)
  on conflict(notification_id) do nothing;
  return new;
end;
$$;
drop trigger if exists temporary_notification_push_enqueue on public.temporary_notification_outbox;
create trigger temporary_notification_push_enqueue after insert on public.temporary_notification_outbox
for each row execute function public.temporary_enqueue_push_from_notification();
revoke all on function public.temporary_enqueue_push_from_notification() from public,anon,authenticated;
-- Deliberately no backfill of existing notification events.

create or replace function public.temporary_claim_push(p_limit integer default 10)
returns setof public.temporary_push_outbox
language plpgsql security definer set search_path=public as $$
begin
  return query with selected as (
    select id from public.temporary_push_outbox
    where ((status in ('pending','failed') and available_at<=now() and attempts<5)
        or (status='processing' and updated_at<now()-interval '10 minutes' and attempts<5))
    order by created_at for update skip locked
    limit least(greatest(coalesce(p_limit,10),1),20)
  ) update public.temporary_push_outbox p
  set status='processing',attempts=p.attempts+1,updated_at=now()
  from selected where p.id=selected.id returning p.*;
end;
$$;
create or replace function public.temporary_finish_push(p_id uuid,p_status text,p_error text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_status not in ('sent','failed','no_subscription') then raise exception 'invalid push status'; end if;
  update public.temporary_push_outbox
  set status=p_status,last_error=case when p_status='sent' then null else left(coalesce(p_error,'Push unavailable'),300) end,
  available_at=case when p_status='failed' then now()+make_interval(mins=>least(60,(2 ^ least(attempts,5))::integer)) else available_at end,
  updated_at=now()
  where id=p_id and status='processing';
end;
$$;
revoke all on function public.temporary_claim_push(integer) from public,anon,authenticated;
revoke all on function public.temporary_finish_push(uuid,text,text) from public,anon,authenticated;
grant execute on function public.temporary_claim_push(integer) to service_role;
grant execute on function public.temporary_finish_push(uuid,text,text) to service_role;
