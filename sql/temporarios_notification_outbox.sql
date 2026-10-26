-- VERLO Temporarios: outbox transaccional de notificaciones.
-- Ejecutar manualmente en Supabase. No realiza envíos externos.
create table if not exists public.temporary_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null,
  reservation_id uuid not null references public.temporary_reservations(id),
  recipient_user_id uuid not null,
  recipient_role text not null check (recipient_role in ('owner','tenant')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz,
  last_error text
);
create index if not exists temporary_notification_outbox_ready_idx
  on public.temporary_notification_outbox(status, available_at, created_at);
create index if not exists temporary_notification_outbox_reservation_idx
  on public.temporary_notification_outbox(reservation_id);
alter table public.temporary_notification_outbox enable row level security;
revoke all on public.temporary_notification_outbox from anon, authenticated;

create or replace function public.temporary_enqueue_reservation_confirmed()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_match record;
  v_owner uuid;
  v_tenant uuid;
begin
  if new.status <> 'confirmed' or (tg_op='UPDATE' and old.status='confirmed') then
    return new;
  end if;
  select property_id,demand_id,check_in,check_out into v_match
    from public.temporary_matches where id=new.match_id;
  select owner_user_id into v_owner from public.temporary_properties where id=v_match.property_id;
  select tenant_user_id into v_tenant from public.temporary_demands where id=v_match.demand_id;

  if v_owner is null or v_tenant is null then
    raise exception 'temporary_notification_recipient_missing';
  end if;
  insert into public.temporary_notification_outbox
    (event_key,event_type,reservation_id,recipient_user_id,recipient_role,payload)
  values
    ('temporary:reservation_confirmed:'||new.id::text||':owner',
      'reservation_confirmed',new.id,v_owner,'owner',
      jsonb_build_object('match_id',new.match_id,'check_in',v_match.check_in,'check_out',v_match.check_out)),
    ('temporary:reservation_confirmed:'||new.id::text||':tenant',
      'reservation_confirmed',new.id,v_tenant,'tenant',
      jsonb_build_object('match_id',new.match_id,'check_in',v_match.check_in,'check_out',v_match.check_out))
  on conflict(event_key) do nothing;
  return new;
end;
$$;

drop trigger if exists temporary_reservation_confirmed_notify on public.temporary_reservations;
create trigger temporary_reservation_confirmed_notify
after insert or update of status on public.temporary_reservations
for each row execute function public.temporary_enqueue_reservation_confirmed();
revoke all on function public.temporary_enqueue_reservation_confirmed() from public,anon,authenticated;
-- No backfill: existing QA reservations do not create outgoing events.
