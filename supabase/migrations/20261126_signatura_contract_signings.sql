-- QA-only Signatura contract envelopes. Every provider create must have a unique reservation.
create table if not exists public.signatura_contract_signings (
  id uuid primary key default gen_random_uuid(),
  lead_contract_id uuid not null unique references public.lead_contracts(id) on delete restrict,
  status text not null default 'reserved'
    check (status in ('reserved','pending','completed','reconciliation_required')),
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  document_id uuid unique,
  owner_signature_id uuid,
  tenant_signature_id uuid,
  guarantor_signature_id uuid,
  owner_email text not null,
  tenant_email text not null,
  guarantor_email text,
  started_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_pdf_key text,
  constraint signatura_three_party_consistency check (
    (guarantor_email is null and guarantor_signature_id is null)
    or guarantor_email is not null
  )
);
alter table public.signatura_contract_signings enable row level security;
revoke all on table public.signatura_contract_signings from anon, authenticated;
grant all on table public.signatura_contract_signings to service_role;
create index if not exists signatura_contract_signings_document_idx
  on public.signatura_contract_signings(document_id) where document_id is not null;