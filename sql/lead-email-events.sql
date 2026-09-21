create table if not exists public.lead_email_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  lead_id uuid not null references public.lead_intake(id) on delete cascade,
  email text not null,
  subject text not null,
  body text not null,
  url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  provider_id text,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_email_events_lead_id_idx
  on public.lead_email_events (lead_id);

create index if not exists lead_email_events_status_idx
  on public.lead_email_events (status);

alter table public.lead_email_events enable row level security;

comment on table public.lead_email_events is
  'Transactional email mirror of Verlo lead notification events. Written only by service-role backend code.';
