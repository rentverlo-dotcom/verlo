-- Identik FIRMA ELECTRONICA v2: isolated persistence.
-- Review against live lead_contracts schema before applying. NOT run automatically.
-- The text reference deliberately avoids assuming lead_contracts.id's database type.
create table if not exists public.identik_electronic_documents (
  id uuid primary key default gen_random_uuid(),
  lead_contract_id text not null unique,
  external_id text not null unique,
  identik_document_id bigint unique,
  status text not null default 'local_pending'
    check (status in ('local_pending','creating','created','sent','pending','completed','rejected','cancelled','expired','failed')),
  owner_email text,
  tenant_email text,
  owner_signed_at timestamptz,
  tenant_signed_at timestamptz,
  completed_at timestamptz,
  signed_pdf_storage_key text,
  certificate_storage_key text,
  last_checked_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identik_completed_document_check check (
    status <> 'completed' or identik_document_id is not null
  )
);

create index if not exists identik_electronic_documents_pending_idx
on public.identik_electronic_documents (status, last_checked_at)
where status not in ('completed','rejected','cancelled','expired');

create table if not exists public.identik_electronic_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.identik_electronic_documents(id) on delete cascade,
  dedupe_key text not null unique,
  event_type text not null,
  provider_status text,
  received_at timestamptz not null default now()
);

-- These tables are accessed from authorized server routes only.
-- Prevent all direct access through Supabase's public API roles.
alter table public.identik_electronic_documents enable row level security;
alter table public.identik_electronic_events enable row level security;
revoke all on public.identik_electronic_documents from anon, authenticated;
revoke all on public.identik_electronic_events from anon, authenticated;

comment on table public.identik_electronic_documents is
'Firma electronica Identik v2: 1 document per VERLO lead contract. Store private file keys, never signing URLs.';
comment on table public.identik_electronic_events is
'Idempotent webhook audit metadata. No full DNI or webhook PII stored here.';
