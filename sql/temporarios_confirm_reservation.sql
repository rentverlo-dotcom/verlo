-- VERLO Temporarios. Ejecutar manualmente en Supabase tras revisar.
-- No modifica tablas de alquileres tradicionales.
alter table public.temporary_reservations
  add column if not exists confirmed_by_owner_at timestamptz,
  add column if not exists confirmed_by_tenant_at timestamptz,
  add column if not exists confirmed_at timestamptz;

create or replace function public.temporary_confirm_reservation(
 p_match_id uuid, p_actor_id uuid, p_role text
) returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  m record;
  r public.temporary_reservations%rowtype;
  v_owner uuid;
  v_tenant uuid;
begin
  if p_role not in ('owner','tenant') or p_actor_id is null then
    raise exception 'invalid_confirmation';
  end if;
  select id, property_id, demand_id, check_in, check_out, status,
         owner_decision, tenant_decision
  into m from public.temporary_matches where id = p_match_id;
  if not found then raise exception 'reservation_not_found'; end if;

  -- Property lock serializes all confirmations and availability checks.
  select owner_user_id into v_owner
    from public.temporary_properties where id = m.property_id for update;
  select tenant_user_id into v_tenant
    from public.temporary_demands where id = m.demand_id;
  if (p_role='owner' and p_actor_id is distinct from v_owner)
     or (p_role='tenant' and p_actor_id is distinct from v_tenant)
  then raise exception 'not_authorized'; end if;
  if m.status <> 'accepted' or m.owner_decision <> 'accepted'
     or m.tenant_decision <> 'accepted' then
    raise exception 'match_not_accepted';
  end if;
  if m.check_in is null or m.check_out is null
     or m.check_in >= m.check_out then raise exception 'invalid_dates'; end if;

  select * into r from public.temporary_reservations
   where match_id=p_match_id for update;
  if not found then raise exception 'reservation_not_found'; end if;
  if r.agreed_terms_owner_at is null or r.agreed_terms_tenant_at is null
    then raise exception 'terms_required'; end if;
  if r.status not in ('fee_paid','ready_to_block','confirmed')
    then raise exception 'payment_required'; end if;

  if exists (
    select 1 from public.temporary_reservations r2
    join public.temporary_matches m2 on m2.id=r2.match_id
    where m2.property_id=m.property_id and r2.id<>r.id
      and r2.status='confirmed'
      and m2.check_in<m.check_out and m.check_in<m2.check_out
  ) then raise exception 'dates_unavailable'; end if;

  if p_role='owner' then
    update public.temporary_reservations
     set confirmed_by_owner_at=coalesce(confirmed_by_owner_at,now())
    where id=r.id;
  else
    update public.temporary_reservations
     set confirmed_by_tenant_at=coalesce(confirmed_by_tenant_at,now())
    where id=r.id;
  end if;

  select * into r from public.temporary_reservations where id=r.id;
  if r.confirmed_by_owner_at is not null and r.confirmed_by_tenant_at is not null then
    update public.temporary_reservations
      set status='confirmed', confirmed_at=coalesce(confirmed_at,now())
    where id=r.id;
    r.status:='confirmed';
  elsif r.status<>'ready_to_block' then
    update public.temporary_reservations set status='ready_to_block' where id=r.id;
    r.status:='ready_to_block';
  end if;
  return jsonb_build_object('id',r.id,'status',r.status,
    'ownerConfirmed',r.confirmed_by_owner_at is not null,
    'tenantConfirmed',r.confirmed_by_tenant_at is not null);
end;
$$;
revoke all on function public.temporary_confirm_reservation(uuid,uuid,text)
 from public, anon, authenticated;
grant execute on function public.temporary_confirm_reservation(uuid,uuid,text)
 to service_role;
