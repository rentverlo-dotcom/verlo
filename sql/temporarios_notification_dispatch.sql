-- VERLO Temporarios only. Apply manually in Supabase SQL Editor.
create or replace function public.temporary_claim_notifications(p_limit integer default 10)
returns setof public.temporary_notification_outbox
language plpgsql security definer set search_path=public as $$
begin
  return query
  with selected as (
    select id from public.temporary_notification_outbox
    where ((status in ('pending','failed') and available_at <= now() and attempts < 5)
       or (status='processing' and updated_at < now() - interval '10 minutes' and attempts < 5))
    order by created_at for update skip locked
    limit least(greatest(coalesce(p_limit,10),1),20)
  )
  update public.temporary_notification_outbox o
  set status='processing', attempts=o.attempts+1, updated_at=now()
  from selected where o.id=selected.id
  returning o.*;
end;
$$;

create or replace function public.temporary_finish_notification(
 p_id uuid, p_success boolean, p_error text default null
) returns void language plpgsql security definer set search_path=public as $$
begin
  update public.temporary_notification_outbox
  set status=case when p_success then 'sent' else 'failed' end,
      delivered_at=case when p_success then now() else delivered_at end,
      last_error=case when p_success then null else left(coalesce(p_error,'Delivery failed'),300) end,
      available_at=case when p_success then available_at
        else now()+make_interval(mins=>least(60,(2 ^ least(attempts,5))::integer)) end,
      updated_at=now()
  where id=p_id and status='processing';
end;
$$;
revoke all on function public.temporary_claim_notifications(integer) from public,anon,authenticated;
revoke all on function public.temporary_finish_notification(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.temporary_claim_notifications(integer) to service_role;
grant execute on function public.temporary_finish_notification(uuid,boolean,text) to service_role;
