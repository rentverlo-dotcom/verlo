-- PowerMarket / VERLO: additive schema only. Apply after review to shared Supabase.
-- No changes to matching, payments, contracts or existing rows.
begin;

alter table public.lead_intake
  add column if not exists expenses_amount numeric(14,2);
alter table public.lead_intake
  add constraint lead_intake_expenses_nonnegative
  check (expenses_amount is null or expenses_amount >= 0) not valid;

create table if not exists public.caucion_partner_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  partner text not null default 'powermarket' check (partner = 'powermarket'),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.caucion_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_lead_id uuid not null references public.lead_intake(id),
  tenant_user_id uuid references auth.users(id),
  requested_rent_ars numeric(14,2) not null check (requested_rent_ars > 0),
  estimated_expenses_ars numeric(14,2) not null check (estimated_expenses_ars >= 0),
  duration_months integer not null check (duration_months > 0 and duration_months <= 120),
  monthly_income_ars numeric(14,2) not null check (monthly_income_ars >= 0),
  employment_type text not null check (employment_type in ('salary_receipt','monotributo','self_employed','other_formal','none')),
  has_co_tenant boolean not null default false,
  co_tenant_income_ars numeric(14,2) check (co_tenant_income_ars is null or co_tenant_income_ars >= 0),
  status text not null default 'draft' check (status in
    ('draft','submitted','under_review','more_info_required','prequalified','not_eligible','alternative_offered','expired','withdrawn')),
  approved_max_total_ars numeric(14,2) check (approved_max_total_ars is null or approved_max_total_ars >= 0),
  approved_max_rent_ars numeric(14,2) check (approved_max_rent_ars is null or approved_max_rent_ars >= 0),
  decision_expires_at timestamptz,
  partner_note text,
  submitted_at timestamptz,
  decided_at timestamptz,
  consent_at timestamptz,
  consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not has_co_tenant or co_tenant_income_ars is not null)
);

create index if not exists caucion_applications_tenant_idx on public.caucion_applications(tenant_lead_id,created_at desc);
create index if not exists caucion_applications_queue_idx on public.caucion_applications(status,created_at desc);

create table if not exists public.caucion_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.caucion_applications(id) on delete cascade,
  kind text not null check (kind in ('dni_front','dni_back','salary_receipt','billing_proof','co_tenant_dni_front','co_tenant_dni_back','co_tenant_income_proof','other')),
  private_storage_key text not null,
  storage_provider text not null default 'r2' check (storage_provider in ('r2','supabase')),
  original_filename text,
  created_at timestamptz not null default now()
);
create index if not exists caucion_documents_application_idx on public.caucion_documents(application_id);

create table if not exists public.caucion_quotes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.caucion_applications(id),
  partner_user_id uuid references auth.users(id),
  monthly_rent_ars numeric(14,2) not null check (monthly_rent_ars >= 0),
  monthly_expenses_ars numeric(14,2) not null check (monthly_expenses_ars >= 0),
  coverage_total_ars numeric(14,2) check (coverage_total_ars is null or coverage_total_ars >= 0),
  premium_ars numeric(14,2) check (premium_ars is null or premium_ars >= 0),
  status text not null default 'draft' check (status in ('draft','offered','accepted','declined','expired')),
  valid_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.caucion_policies (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.caucion_applications(id),
  lead_contract_id uuid references public.lead_contracts(id),
  quote_id uuid references public.caucion_quotes(id),
  status text not null default 'pending' check (status in ('pending','final_review','payment_pending','issued','cancelled','rejected')),
  insurer_name text,
  policy_number text,
  private_pdf_key text,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists caucion_policies_contract_idx on public.caucion_policies(lead_contract_id);

create table if not exists public.caucion_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.caucion_applications(id),
  event_key text not null unique,
  event_type text not null,
  actor_user_id uuid references auth.users(id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists caucion_events_application_idx on public.caucion_events(application_id,created_at desc);

create table if not exists public.caucion_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.caucion_events(id),
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Sensitive data are server-only. Service-role backend validates identity and role
-- before accessing; do not expose partner access through a generic client RLS policy.
alter table public.caucion_partner_users enable row level security;
alter table public.caucion_applications enable row level security;
alter table public.caucion_documents enable row level security;
alter table public.caucion_quotes enable row level security;
alter table public.caucion_policies enable row level security;
alter table public.caucion_events enable row level security;
alter table public.caucion_notification_outbox enable row level security;

commit;
