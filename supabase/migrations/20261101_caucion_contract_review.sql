-- Revisión contractual de PowerMarket: módulo aditivo, no modifica contratos existentes.
-- Ejecutar una única vez después de la migración base de cauciones.
begin;
create extension if not exists pgcrypto;
create table if not exists public.caucion_contract_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.caucion_applications(id),
  lead_contract_id uuid not null references public.lead_contracts(id),
  -- SHA-256 del PDF exacto mostrado al operador; no del texto ni de la URL.
  contract_content_sha256 text not null check (contract_content_sha256 ~ '^[a-f0-9]{64} (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  private_pdf_key text not null,
  storage_provider text not null default 'supabase' check (storage_provider = 'supabase'),
  version integer not null check (version > 0),
  status text not null default 'pending' check (status in ('pending','changes_requested','approved','superseded')),
  partner_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (application_id,lead_contract_id,version),
  unique (application_id,lead_contract_id,pdf_sha256)
);
create index if not exists caucion_contract_reviews_contract_idx
  on public.caucion_contract_reviews(lead_contract_id,created_at desc);
create unique index if not exists caucion_one_current_contract_review
  on public.caucion_contract_reviews(application_id,lead_contract_id)
  where status <> 'superseded';
alter table public.caucion_contract_reviews enable row level security;

-- Publicación atómica de una nueva versión. Bloquea la solicitud para serializar concurrentes.
create or replace function public.caucion_publish_contract_review(
 p_application_id uuid,p_contract_id uuid,p_content_sha256 text,
 p_pdf_sha256 text,p_private_key text,p_version integer
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $
declare a public.caucion_applications%rowtype; c public.lead_contracts%rowtype; rid uuid;
begin
 select * into a from public.caucion_applications where id=p_application_id for update;
 if not found or a.status not in ('prequalified','alternative_offered','under_review') then
  raise exception 'application_not_reviewable' using errcode='23514';
 end if;
 select * into c from public.lead_contracts where id=p_contract_id;
 if not found or c.tenant_lead_id<>a.tenant_lead_id or c.status not in ('generated','agreed') then
  raise exception 'contract_not_eligible' using errcode='23514';
 end if;
 if encode(digest(convert_to(c.content,'UTF8'),'sha256'),'hex') <> p_content_sha256 then
  raise exception 'contract_changed' using errcode='40001';
 end if;
 if p_pdf_sha256 !~ '^[a-f0-9]{64}, en la misma transacción. Solo service_role del servidor.
create or replace function public.caucion_decide_contract_review(
 p_review_id uuid, p_expected_status text, p_decision text,
 p_actor uuid, p_note text default null
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp
as $$
declare r public.caucion_contract_reviews%rowtype;
begin
 if p_decision not in ('approved','changes_requested') then
  raise exception 'invalid_decision' using errcode='22023';
 end if;
 if p_decision='changes_requested' and nullif(trim(coalesce(p_note,'')),'') is null then
  raise exception 'note_required' using errcode='22023';
 end if;
 if not exists(select 1 from public.caucion_partner_users
  where user_id=p_actor and partner='powermarket' and active=true) then
  raise exception 'not_authorized' using errcode='42501';
 end if;
 select * into r from public.caucion_contract_reviews where id=p_review_id for update;
 if not found then raise exception 'not_found' using errcode='P0002'; end if;
 if r.status is distinct from p_expected_status or r.status not in ('pending','changes_requested') then
  raise exception 'status_conflict' using errcode='40001';
 end if;
 -- Una aprobación solo tiene sentido si la caución sigue siendo evaluable.
 if not exists(select 1 from public.caucion_applications where id=r.application_id
  and status in ('prequalified','alternative_offered','under_review')) then
  raise exception 'application_not_reviewable' using errcode='23514';
 end if;
 update public.caucion_contract_reviews
 set status=p_decision, partner_note=nullif(left(trim(coalesce(p_note,'')),1500),''),
     reviewed_by=p_actor,reviewed_at=now()
 where id=p_review_id;
 insert into public.caucion_events(application_id,event_key,event_type,actor_user_id,payload)
 values(r.application_id,'caucion:contract:'||p_review_id||':'||gen_random_uuid(),
 'contract_review_decision',p_actor,jsonb_build_object(
 'review_id',p_review_id,'lead_contract_id',r.lead_contract_id,
 'version',r.version,'pdf_sha256',r.pdf_sha256,'from',r.status,'to',p_decision));
 return jsonb_build_object('id',p_review_id,'status',p_decision,'version',r.version,'pdf_sha256',r.pdf_sha256);
end;
$$;
revoke all on function public.caucion_decide_contract_review(uuid,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.caucion_decide_contract_review(uuid,text,text,uuid,text) to service_role;
commit;
),
  pdf_sha256 text not null check (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  private_pdf_key text not null,
  storage_provider text not null default 'supabase' check (storage_provider = 'supabase'),
  version integer not null check (version > 0),
  status text not null default 'pending' check (status in ('pending','changes_requested','approved','superseded')),
  partner_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (application_id,lead_contract_id,version),
  unique (application_id,lead_contract_id,pdf_sha256)
);
create index if not exists caucion_contract_reviews_contract_idx
  on public.caucion_contract_reviews(lead_contract_id,created_at desc);
create unique index if not exists caucion_one_current_contract_review
  on public.caucion_contract_reviews(application_id,lead_contract_id)
  where status <> 'superseded';
alter table public.caucion_contract_reviews enable row level security;

-- Decisión y auditoría, en la misma transacción. Solo service_role del servidor.
create or replace function public.caucion_decide_contract_review(
 p_review_id uuid, p_expected_status text, p_decision text,
 p_actor uuid, p_note text default null
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp
as $$
declare r public.caucion_contract_reviews%rowtype;
begin
 if p_decision not in ('approved','changes_requested') then
  raise exception 'invalid_decision' using errcode='22023';
 end if;
 if p_decision='changes_requested' and nullif(trim(coalesce(p_note,'')),'') is null then
  raise exception 'note_required' using errcode='22023';
 end if;
 if not exists(select 1 from public.caucion_partner_users
  where user_id=p_actor and partner='powermarket' and active=true) then
  raise exception 'not_authorized' using errcode='42501';
 end if;
 select * into r from public.caucion_contract_reviews where id=p_review_id for update;
 if not found then raise exception 'not_found' using errcode='P0002'; end if;
 if r.status is distinct from p_expected_status or r.status not in ('pending','changes_requested') then
  raise exception 'status_conflict' using errcode='40001';
 end if;
 -- Una aprobación solo tiene sentido si la caución sigue siendo evaluable.
 if not exists(select 1 from public.caucion_applications where id=r.application_id
  and status in ('prequalified','alternative_offered','under_review')) then
  raise exception 'application_not_reviewable' using errcode='23514';
 end if;
 update public.caucion_contract_reviews
 set status=p_decision, partner_note=nullif(left(trim(coalesce(p_note,'')),1500),''),
     reviewed_by=p_actor,reviewed_at=now()
 where id=p_review_id;
 insert into public.caucion_events(application_id,event_key,event_type,actor_user_id,payload)
 values(r.application_id,'caucion:contract:'||p_review_id||':'||gen_random_uuid(),
 'contract_review_decision',p_actor,jsonb_build_object(
 'review_id',p_review_id,'lead_contract_id',r.lead_contract_id,
 'version',r.version,'pdf_sha256',r.pdf_sha256,'from',r.status,'to',p_decision));
 return jsonb_build_object('id',p_review_id,'status',p_decision,'version',r.version,'pdf_sha256',r.pdf_sha256);
end;
$$;
revoke all on function public.caucion_decide_contract_review(uuid,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.caucion_decide_contract_review(uuid,text,text,uuid,text) to service_role;
commit;
 or
    p_private_key <> 'powermarket/contracts/'||p_application_id||'/'||p_contract_id||'/v'||p_version||'.pdf' then
  raise exception 'invalid_document' using errcode='22023';
 end if;
 if p_version <> coalesce((select max(version)+1 from public.caucion_contract_reviews where application_id=p_application_id and lead_contract_id=p_contract_id),1) then
  raise exception 'version_conflict' using errcode='40001';
 end if;
 update public.caucion_contract_reviews set status='superseded'
 where application_id=p_application_id and lead_contract_id=p_contract_id and status<>'superseded';
 insert into public.caucion_contract_reviews
 (application_id,lead_contract_id,contract_content_sha256,pdf_sha256,private_pdf_key,version)
 values (p_application_id,p_contract_id,p_content_sha256,p_pdf_sha256,p_private_key,p_version)
 returning id into rid;
 insert into public.caucion_events(application_id,event_key,event_type,payload)
 values(p_application_id,'caucion:contract:published:'||rid,'contract_review_published',
 jsonb_build_object('review_id',rid,'contract_id',p_contract_id,'version',p_version,'pdf_sha256',p_pdf_sha256));
 return rid;
end; $;
revoke all on function public.caucion_publish_contract_review(uuid,uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.caucion_publish_contract_review(uuid,uuid,text,text,text,integer) to service_role;

-- Decisión y auditoría, en la misma transacción. Solo service_role del servidor.
create or replace function public.caucion_decide_contract_review(
 p_review_id uuid, p_expected_status text, p_decision text,
 p_actor uuid, p_note text default null
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp
as $$
declare r public.caucion_contract_reviews%rowtype;
begin
 if p_decision not in ('approved','changes_requested') then
  raise exception 'invalid_decision' using errcode='22023';
 end if;
 if p_decision='changes_requested' and nullif(trim(coalesce(p_note,'')),'') is null then
  raise exception 'note_required' using errcode='22023';
 end if;
 if not exists(select 1 from public.caucion_partner_users
  where user_id=p_actor and partner='powermarket' and active=true) then
  raise exception 'not_authorized' using errcode='42501';
 end if;
 select * into r from public.caucion_contract_reviews where id=p_review_id for update;
 if not found then raise exception 'not_found' using errcode='P0002'; end if;
 if r.status is distinct from p_expected_status or r.status not in ('pending','changes_requested') then
  raise exception 'status_conflict' using errcode='40001';
 end if;
 -- Una aprobación solo tiene sentido si la caución sigue siendo evaluable.
 if not exists(select 1 from public.caucion_applications where id=r.application_id
  and status in ('prequalified','alternative_offered','under_review')) then
  raise exception 'application_not_reviewable' using errcode='23514';
 end if;
 update public.caucion_contract_reviews
 set status=p_decision, partner_note=nullif(left(trim(coalesce(p_note,'')),1500),''),
     reviewed_by=p_actor,reviewed_at=now()
 where id=p_review_id;
 insert into public.caucion_events(application_id,event_key,event_type,actor_user_id,payload)
 values(r.application_id,'caucion:contract:'||p_review_id||':'||gen_random_uuid(),
 'contract_review_decision',p_actor,jsonb_build_object(
 'review_id',p_review_id,'lead_contract_id',r.lead_contract_id,
 'version',r.version,'pdf_sha256',r.pdf_sha256,'from',r.status,'to',p_decision));
 return jsonb_build_object('id',p_review_id,'status',p_decision,'version',r.version,'pdf_sha256',r.pdf_sha256);
end;
$$;
revoke all on function public.caucion_decide_contract_review(uuid,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.caucion_decide_contract_review(uuid,text,text,uuid,text) to service_role;
commit;
),
  pdf_sha256 text not null check (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  private_pdf_key text not null,
  storage_provider text not null default 'supabase' check (storage_provider = 'supabase'),
  version integer not null check (version > 0),
  status text not null default 'pending' check (status in ('pending','changes_requested','approved','superseded')),
  partner_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (application_id,lead_contract_id,version),
  unique (application_id,lead_contract_id,pdf_sha256)
);
create index if not exists caucion_contract_reviews_contract_idx
  on public.caucion_contract_reviews(lead_contract_id,created_at desc);
create unique index if not exists caucion_one_current_contract_review
  on public.caucion_contract_reviews(application_id,lead_contract_id)
  where status <> 'superseded';
alter table public.caucion_contract_reviews enable row level security;

-- Decisión y auditoría, en la misma transacción. Solo service_role del servidor.
create or replace function public.caucion_decide_contract_review(
 p_review_id uuid, p_expected_status text, p_decision text,
 p_actor uuid, p_note text default null
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp
as $$
declare r public.caucion_contract_reviews%rowtype;
begin
 if p_decision not in ('approved','changes_requested') then
  raise exception 'invalid_decision' using errcode='22023';
 end if;
 if p_decision='changes_requested' and nullif(trim(coalesce(p_note,'')),'') is null then
  raise exception 'note_required' using errcode='22023';
 end if;
 if not exists(select 1 from public.caucion_partner_users
  where user_id=p_actor and partner='powermarket' and active=true) then
  raise exception 'not_authorized' using errcode='42501';
 end if;
 select * into r from public.caucion_contract_reviews where id=p_review_id for update;
 if not found then raise exception 'not_found' using errcode='P0002'; end if;
 if r.status is distinct from p_expected_status or r.status not in ('pending','changes_requested') then
  raise exception 'status_conflict' using errcode='40001';
 end if;
 -- Una aprobación solo tiene sentido si la caución sigue siendo evaluable.
 if not exists(select 1 from public.caucion_applications where id=r.application_id
  and status in ('prequalified','alternative_offered','under_review')) then
  raise exception 'application_not_reviewable' using errcode='23514';
 end if;
 update public.caucion_contract_reviews
 set status=p_decision, partner_note=nullif(left(trim(coalesce(p_note,'')),1500),''),
     reviewed_by=p_actor,reviewed_at=now()
 where id=p_review_id;
 insert into public.caucion_events(application_id,event_key,event_type,actor_user_id,payload)
 values(r.application_id,'caucion:contract:'||p_review_id||':'||gen_random_uuid(),
 'contract_review_decision',p_actor,jsonb_build_object(
 'review_id',p_review_id,'lead_contract_id',r.lead_contract_id,
 'version',r.version,'pdf_sha256',r.pdf_sha256,'from',r.status,'to',p_decision));
 return jsonb_build_object('id',p_review_id,'status',p_decision,'version',r.version,'pdf_sha256',r.pdf_sha256);
end;
$$;
revoke all on function public.caucion_decide_contract_review(uuid,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.caucion_decide_contract_review(uuid,text,text,uuid,text) to service_role;
commit;
