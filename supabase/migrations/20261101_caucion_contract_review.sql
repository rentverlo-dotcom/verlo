-- Revisión contractual de PowerMarket: módulo aditivo, no modifica contratos existentes.
-- Ejecutar una única vez después de la migración base de cauciones.
begin;
create table if not exists public.caucion_contract_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.caucion_applications(id),
  lead_contract_id uuid not null references public.lead_contracts(id),
  -- SHA-256 del PDF exacto mostrado al operador; no del texto ni de la URL.
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
