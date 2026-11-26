-- Contract guarantor participants. Applied to isolated QA on 26-Nov-2026.
-- Never insert guarantors into lead_intake: that table is restricted to rental leads.
create table if not exists public.contract_guarantors (
  id uuid primary key default gen_random_uuid(),
  lead_contract_id uuid not null references public.lead_contracts(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 3 and 200),
  dni text not null check (char_length(btrim(dni)) between 6 and 20),
  email text not null check (char_length(btrim(email)) between 5 and 254),
  phone text not null check (char_length(btrim(phone)) between 6 and 40),
  legal_address text not null default '',
  guarantee_kind text not null check (guarantee_kind in ('personal', 'property', 'salary')),
  status text not null default 'invited' check (status in ('invited','accepted','declined')),
  auth_user_id uuid references auth.users(id) on delete set null,
  invited_by_user_id uuid not null references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  signatura_document_id uuid,
  signatura_signature_id uuid,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_guarantors_single_email unique (lead_contract_id,email),
  constraint contract_guarantors_acceptance_consistent check (
    (status='accepted' and accepted_at is not null and auth_user_id is not null)
    or (status<>'accepted' and accepted_at is null)
  ),
  constraint contract_guarantors_signature_consistent check (
    signed_at is null or (status='accepted' and signatura_document_id is not null and signatura_signature_id is not null)
  )
);
create index if not exists contract_guarantors_auth_user_idx on public.contract_guarantors(auth_user_id);
create index if not exists contract_guarantors_contract_idx on public.contract_guarantors(lead_contract_id);
alter table public.contract_guarantors enable row level security;
revoke all on table public.contract_guarantors from anon, authenticated;
grant all on table public.contract_guarantors to service_role;
-- Access through server endpoints that verify Auth and relation to exact contract.
alter table public.verlo_email_outbox drop constraint if exists verlo_email_outbox_recipient_role_check;
alter table public.verlo_email_outbox add constraint verlo_email_outbox_recipient_role_check
  check (recipient_role in ('tenant','owner','guarantor'));