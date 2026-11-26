-- Versioned, private guarantor dossier; reports do not auto-attach to contracts.
alter table public.contract_guarantors
  add column if not exists collateral_address text,
  add column if not exists collateral_jurisdiction text,
  add column if not exists collateral_registration text,
  add column if not exists collateral_owner text,
  add column if not exists review_status text not null default 'awaiting_documents',
  add column if not exists reviewed_by_user_id uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_reason text,
  add column if not exists document_revision integer not null default 0,
  add column if not exists approved_revision integer;
alter table public.contract_guarantors add constraint guarantor_review_status_valid check
  (review_status in ('awaiting_documents','submitted','under_review','changes_requested','rejected','approved'));
create table if not exists public.guarantor_documents (
  id uuid primary key default gen_random_uuid(),
  guarantor_id uuid not null references public.contract_guarantors(id) on delete cascade,
  kind text not null check (kind in ('deed','identity','income','ownership_report','inhibition_report','other')),
  storage_key text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  bytes integer not null check (bytes between 1 and 10485760),
  document_revision integer not null,
  uploaded_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists guarantor_documents_parent_idx on public.guarantor_documents(guarantor_id);
alter table public.guarantor_documents enable row level security;
revoke all on public.guarantor_documents from anon, authenticated;
grant all on public.guarantor_documents to service_role;
create table if not exists public.guarantor_review_events (
  id uuid primary key default gen_random_uuid(),
  guarantor_id uuid not null references public.contract_guarantors(id) on delete cascade,
  review_status text not null,
  reason text,
  actor_user_id uuid not null references auth.users(id),
  document_revision integer not null,
  created_at timestamptz not null default now()
);
alter table public.guarantor_review_events enable row level security;
revoke all on public.guarantor_review_events from anon, authenticated;
grant all on public.guarantor_review_events to service_role;
