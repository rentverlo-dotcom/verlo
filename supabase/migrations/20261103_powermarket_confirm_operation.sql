-- VERLO x PowerMarket: confirmacion manual de pago por operador autorizado.
-- ADITIVA. No integra cobros, no emite polizas y no modifica checkout VERLO.
-- Ejecutar en Supabase SQL Editor antes de usar el boton.
begin;

alter table public.caucion_policies
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_by uuid references auth.users(id);

alter table public.caucion_policies
  drop constraint if exists caucion_policies_status_check;

alter table public.caucion_policies
  add constraint caucion_policies_status_check
    check (status in (
      'pending', 'final_review', 'payment_pending',
      'payment_confirmed', 'issued', 'cancelled', 'rejected'
    ));

create or replace function public.caucion_confirm_partner_operation(
  p_policy_id uuid,
  p_actor_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $confirm$
declare
  v_policy public.caucion_policies%rowtype;
  v_application public.caucion_applications%rowtype;
  v_quote public.caucion_quotes%rowtype;
  v_contract public.lead_contracts%rowtype;
  v_review public.caucion_contract_reviews%rowtype;
  v_review_count integer;
  v_now timestamptz := now();
begin
  if not exists (
    select 1 from public.caucion_partner_users
    where user_id = p_actor_user_id and partner = 'powermarket' and active = true
  ) then
    raise exception 'partner_not_authorized' using errcode = '42501';
  end if;

  select * into v_policy from public.caucion_policies
  where id = p_policy_id for update;
  if not found then
    raise exception 'policy_not_found' using errcode = 'P0002';
  end if;

  if v_policy.status = 'payment_confirmed' then
    return jsonb_build_object('id', v_policy.id, 'status', v_policy.status,
      'payment_confirmed_at', v_policy.payment_confirmed_at, 'already_confirmed', true);
  end if;

  if v_policy.status <> 'payment_pending' then
    raise exception 'policy_not_awaiting_payment' using errcode = '40001';
  end if;

  select * into v_application from public.caucion_applications
  where id = v_policy.application_id;
  select * into v_quote from public.caucion_quotes
  where id = v_policy.quote_id and application_id = v_policy.application_id;
  select * into v_contract from public.lead_contracts
  where id = v_policy.lead_contract_id;

  if v_application.id is null or
     v_application.status not in ('prequalified', 'alternative_offered') or
     (v_application.decision_expires_at is not null and v_application.decision_expires_at <= v_now) or
     v_quote.id is null or v_quote.status <> 'accepted' or
     v_quote.valid_until is null or v_quote.valid_until <= v_now or
     v_contract.id is null or v_contract.tenant_lead_id <> v_application.tenant_lead_id or
     v_contract.content is null then
    raise exception 'approval_quote_or_contract_invalid' using errcode = '23514';
  end if;

  select count(*) into v_review_count
  from public.caucion_contract_reviews
  where application_id = v_application.id
    and lead_contract_id = v_contract.id and status <> 'superseded';

  if v_review_count <> 1 then
    raise exception 'current_review_missing_or_ambiguous' using errcode = '23514';
  end if;

  select * into v_review from public.caucion_contract_reviews
  where application_id = v_application.id
    and lead_contract_id = v_contract.id and status <> 'superseded';

  if v_review.status <> 'approved' or
    v_review.contract_content_sha256 <>
      encode(digest(convert_to(v_contract.content, 'UTF8'), 'sha256'), 'hex') then
    raise exception 'current_contract_not_approved' using errcode = '23514';
  end if;

  update public.caucion_policies
  set status = 'payment_confirmed',
      payment_confirmed_at = v_now,
      payment_confirmed_by = p_actor_user_id,
      updated_at = v_now
  where id = v_policy.id and status = 'payment_pending';

  -- Auditable event in same transaction. If audit fails, status rolls back.
  insert into public.caucion_events (
    application_id, event_key, event_type, actor_user_id, payload
  ) values (
    v_application.id,
    'powermarket:operation_confirmed:' || v_policy.id::text,
    'policy_payment_confirmed',
    p_actor_user_id,
    jsonb_build_object(
      'source_table','caucion_policies',
      'source_id', v_policy.id,
      'contract_id',v_contract.id,
      'quote_id',v_quote.id,
      'confirmation_method','partner_operator',
      'paid_to','powermarket'
    )
  );

  return jsonb_build_object(
    'id',v_policy.id,'status','payment_confirmed',
    'payment_confirmed_at',v_now,'already_confirmed',false
  );
end;
$confirm$;

revoke all on function public.caucion_confirm_partner_operation(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.caucion_confirm_partner_operation(uuid,uuid)
  to service_role;

commit;
