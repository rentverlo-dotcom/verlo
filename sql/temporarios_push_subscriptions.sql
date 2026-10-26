-- Separate device subscriptions for authenticated temporary-rental users.
-- Does not modify traditional push_subscriptions or create outbound events.
create table if not exists public.temporary_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists temporary_push_subscriptions_user_idx
  on public.temporary_push_subscriptions (user_id) where revoked_at is null;
alter table public.temporary_push_subscriptions enable row level security;
revoke all on public.temporary_push_subscriptions from anon, authenticated;
-- Only server-side service role may register, inspect and deliver push.
