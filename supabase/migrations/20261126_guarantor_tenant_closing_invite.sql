-- Tenant closing token permits invitation without requiring an existing Auth account.
alter table public.contract_guarantors alter column invited_by_user_id drop not null;
alter table public.contract_guarantors
  add column if not exists invited_by_lead_id uuid references public.lead_intake(id),
  add column if not exists invitation_token_hash text,
  add column if not exists invitation_expires_at timestamptz,
  add constraint contract_guarantors_invitation_source
    check (invited_by_user_id is not null or invited_by_lead_id is not null);
