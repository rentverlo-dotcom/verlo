-- Atomic PowerMarket decisions: status and audit either both commit or neither.
-- Execute only via authenticated server service_role, never from browser clients.
create or replace function public.caucion_record_partner_decision(
 p_application_id uuid,
 p_expected_status text,
 p_new_status text,
 p_actor_user_id uuid,
 p_approved_max_total_ars numeric default null,
 p_approved_max_rent_ars numeric default null,
 p_note text default null
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
 v_current public.caucion_applications%rowtype;
 v_changed public.caucion_applications%rowtype;
 v_now timestamptz := now();
 v_approval boolean;
begin
 if p_new_status not in ('under_review','more_info_required','prequalified','not_eligible','alternative_offered') then
  raise exception 'invalid_decision_status' using errcode='22023';
 end if;
 if p_approved_max_total_ars < 0 or p_approved_max_rent_ars < 0 then
  raise exception 'invalid_approved_amount' using errcode='22023';
 end if;
 v_approval := p_new_status in ('prequalified','alternative_offered');
 if v_approval and p_approved_max_total_ars is null and p_approved_max_rent_ars is null then
  raise exception 'approved_amount_required' using errcode='22023';
 end if;
 if not exists(select 1 from public.caucion_partner_users where user_id=p_actor_user_id and partner='powermarket' and active=true) then
  raise exception 'partner_not_authorized' using errcode='42501';
 end if;
 select * into v_current from public.caucion_applications where id=p_application_id for update;
 if not found then raise exception 'application_not_found' using errcode='P0002'; end if;
 if v_current.status is distinct from p_expected_status or v_current.status not in ('submitted','under_review','more_info_required','prequalified','alternative_offered','not_eligible') then
  raise exception 'application_status_conflict' using errcode='40001';
 end if;
 update public.caucion_applications set
  status=p_new_status,
  partner_note=nullif(trim(left(coalesce(p_note,''),1500)),''),
  approved_max_total_ars=case when v_approval then p_approved_max_total_ars else null end,
  approved_max_rent_ars=case when v_approval then p_approved_max_rent_ars else null end,
  decided_at=case when p_new_status in ('prequalified','alternative_offered','not_eligible') then v_now else null end,
  updated_at=v_now
 where id=p_application_id
 returning * into v_changed;
 insert into public.caucion_events (application_id,event_key,event_type,actor_user_id,payload)
 values (
  p_application_id,
  'caucion:'||p_application_id||':'||p_new_status||':'||gen_random_uuid(),
  'partner_decision',
  p_actor_user_id,
  jsonb_build_object(
   'from',v_current.status,'to',p_new_status,
   'approved_max_total_ars',case when v_approval then p_approved_max_total_ars else null end,
   'approved_max_rent_ars',case when v_approval then p_approved_max_rent_ars else null end
  )
 );
 return jsonb_build_object('id',v_changed.id,'status',v_changed.status,'approved_max_total_ars',v_changed.approved_max_total_ars,'approved_max_rent_ars',v_changed.approved_max_rent_ars);
end;
$$;
revoke all on function public.caucion_record_partner_decision(uuid,text,text,uuid,numeric,numeric,text) from public, anon, authenticated;
grant execute on function public.caucion_record_partner_decision(uuid,text,text,uuid,numeric,numeric,text) to service_role;
