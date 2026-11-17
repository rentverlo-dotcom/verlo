-- QA-only: a private, immutable archive for Identik signed contracts.
-- No public object access is granted. All reads/writes require the server
-- service role after verifying the two parties' contract authorization.
insert into storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
values
  ('identik-contracts', 'identik-contracts', false, 52428800, null)
on conflict (id) do nothing;