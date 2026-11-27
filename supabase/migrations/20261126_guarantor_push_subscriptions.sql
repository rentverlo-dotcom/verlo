-- Guarantor Web Push is associated with a verified auth user, never a rental lead.
create table if not exists public.guarantor_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guarantor_push_subscriptions_user_idx
  on public.guarantor_push_subscriptions(auth_user_id) where revoked_at is null;
alter table public.guarantor_push_subscriptions enable row level security;
revoke all on table public.guarantor_push_subscriptions from anon, authenticated;
grant all on table public.guarantor_push_subscriptions to service_role;