-- PowerMarket Push: additive, no changes to existing notification engines.
begin;
create table if not exists public.caucion_push_deliveries (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.caucion_events(id) on delete cascade,
 recipient_lead_id uuid not null references public.lead_intake(id),
 recipient_role text not null check(recipient_role in ('tenant','owner')),
 status text not null default 'pending' check(status in ('pending','processing','sent','unavailable','failed')),
 attempts integer not null default 0,
 sent_devices integer not null default 0,
 failed_devices integer not null default 0,
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(event_id,recipient_lead_id)
);
alter table public.caucion_push_deliveries enable row level security;
create index if not exists caucion_push_deliveries_queue_idx on public.caucion_push_deliveries(status,created_at);
create or replace function public.caucion_push_claim(p_limit integer default 10)
returns setof public.caucion_push_deliveries language plpgsql security definer
set search_path=public,pg_temp as $$
begin
 if auth.role() <> 'service_role' then raise exception 'forbidden' using errcode='42501'; end if;
 return query
 with grabbed as (
  select d.id from public.caucion_push_deliveries d
  where d.status in ('pending','failed') and d.attempts < 3
  order by d.created_at
  for update skip locked limit least(greatest(p_limit,1),20)
 )
 update public.caucion_push_deliveries d
 set status='processing', attempts=d.attempts+1, updated_at=now()
 from grabbed where d.id=grabbed.id returning d.*;
end $$;
revoke all on function public.caucion_push_claim(integer) from public,anon,authenticated;
grant execute on function public.caucion_push_claim(integer) to service_role;
-- Events from current state machines; exclude drafts and unchanged transitions.
create or replace function public.caucion_push_event() returns trigger language plpgsql security definer
set search_path=public,pg_temp as $$
declare aid uuid; etype text; refid uuid; ownerid uuid; tenantid uuid; eid uuid; cid uuid;
begin
 if tg_table_name='caucion_applications' then
  if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
  if new.status='draft' then return new; end if;
  aid:=new.id; refid:=new.id; etype:='application_'||new.status;
 elsif tg_table_name='caucion_quotes' then
  if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
  if new.status='draft' then return new; end if;
  aid:=new.application_id; refid:=new.id; etype:='quote_'||new.status;
 elsif tg_table_name='caucion_contract_reviews' then
  if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
  if new.status='superseded' then return new; end if;
  aid:=new.application_id; refid:=new.id; etype:='review_'||new.status; cid:=new.lead_contract_id;
 elsif tg_table_name='caucion_policies' then
  if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
  aid:=new.application_id; refid:=new.id; etype:='policy_'||new.status; cid:=new.lead_contract_id;
 else return new; end if;
 select tenant_lead_id into tenantid from public.caucion_applications where id=aid;
 if tenantid is null then return new; end if;
 insert into public.caucion_events(application_id,event_key,event_type,payload)
 values(aid,'push:'||tg_table_name||':'||refid||':'||etype||':'||new.status,etype,
 jsonb_build_object('source_table',tg_table_name,'source_id',refid))
 on conflict(event_key) do update set event_key=excluded.event_key returning id into eid;
 insert into public.caucion_push_deliveries(event_id,recipient_lead_id,recipient_role)
 values(eid,tenantid,'tenant') on conflict do nothing;
 -- Owner receives only contract-bound events; never application financial updates.
 if cid is not null and etype in ('review_pending','review_changes_requested','review_approved','policy_issued','policy_cancelled','policy_rejected','policy_payment_pending') then
  select owner_lead_id into ownerid from public.lead_contracts where id=cid and tenant_lead_id=tenantid;
  if ownerid is not null then
   insert into public.caucion_push_deliveries(event_id,recipient_lead_id,recipient_role)
   values(eid,ownerid,'owner') on conflict do nothing;
  end if;
 end if;
 return new;
end $$;
drop trigger if exists caucion_push_application_trigger on public.caucion_applications;
create trigger caucion_push_application_trigger after insert or update of status on public.caucion_applications for each row execute function public.caucion_push_event();
drop trigger if exists caucion_push_quote_trigger on public.caucion_quotes;
create trigger caucion_push_quote_trigger after insert or update of status on public.caucion_quotes for each row execute function public.caucion_push_event();
drop trigger if exists caucion_push_review_trigger on public.caucion_contract_reviews;
create trigger caucion_push_review_trigger after insert or update of status on public.caucion_contract_reviews for each row execute function public.caucion_push_event();
drop trigger if exists caucion_push_policy_trigger on public.caucion_policies;
create trigger caucion_push_policy_trigger after insert or update of status on public.caucion_policies for each row execute function public.caucion_push_event();
commit;
