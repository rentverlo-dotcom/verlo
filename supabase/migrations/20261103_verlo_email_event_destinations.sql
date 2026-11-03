-- Optional native email event details, preserving existing destination.
-- No historical writes, no sends, no triggers, no cutover.
begin;
alter table public.verlo_email_outbox
  add column if not exists destination_url text;
alter table public.verlo_email_outbox
  add column if not exists notification_title text;
alter table public.verlo_email_outbox
  add column if not exists notification_body text;
comment on column public.verlo_email_outbox.destination_url is
  'Absolute HTTPS verlo.lat URL; application renderer must validate origin before rendering.';
commit;
