-- VERLO Tradicionales - historical recovery staging (SAFE / NO SENDS)
-- Apply manually only after review. Does not affect current cron or GHL.
BEGIN;

CREATE TABLE IF NOT EXISTS public.traditional_historical_backfill_matches (
  match_id uuid PRIMARY KEY REFERENCES public.lead_matches(id) ON DELETE RESTRICT,
  campaign text NOT NULL DEFAULT 'oct2026_recovery',
  state text NOT NULL DEFAULT 'staged' CHECK (state IN ('staged','excluded','completed')),
  staged_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
CREATE INDEX IF NOT EXISTS traditional_historical_backfill_matches_state_idx
  ON public.traditional_historical_backfill_matches(state, staged_at);

-- Only seed real pre-launch active matches; do not silently stage invalid rows.
INSERT INTO public.traditional_historical_backfill_matches (match_id)
SELECT m.id
FROM public.lead_matches m
JOIN (VALUES
  ('df01403f-89cc-42b8-82c7-73f5b90e7e1a'),
  ('ea39a46d-a540-4dd0-9e5b-80e4ad7cb09c'),
  ('99ee91cc-01c2-43b6-91a1-2a9062aaa41c'),
  ('768fb940-d92f-4da1-a207-e4066f0e43c1'),
  ('78ba96ac-7b53-4a0e-9639-6e4153710e9f'),
  ('dc38fea8-df2d-47d1-8899-cc14b271171a'),
  ('c2c85013-9bcc-43c2-9e01-f6c659befb34'),
  ('a9eb5688-786c-4c04-bed6-f90e51443cd2'),
  ('2f7f3062-4343-45ef-9ecf-c5df6baad999'),
  ('ab4795ee-4e1c-4420-9639-f32dd8bb9d35'),
  ('7ac3618c-2fa3-4dfd-af3c-9dd64db779cd'),
  ('f51a4dcc-63fc-46ba-b80b-8f5b716084b7'),
  ('176af263-c7f7-4de1-8876-da804dd6b1fd'),
  ('6164bdae-708b-4af5-9253-9aa764bf2147'),
  ('0510cbbb-2106-43be-81a2-1ffbfbcebdc9')
) AS selected(id) ON m.id = selected.id::uuid
WHERE m.created_at < timestamptz '2026-10-09 13:45:00+00'
  AND m.score >= 80
  AND m.status IN ('new','reviewed','contacted','converted')
ON CONFLICT (match_id) DO NOTHING;

COMMIT;

-- Optional read-only preview: dedup identity within role, contacts / existing access.
WITH participants AS (
  SELECT m.id AS match_id, 'tenant' AS role, m.tenant_lead_id AS lead_id
  FROM public.traditional_historical_backfill_matches b
  JOIN public.lead_matches m ON m.id = b.match_id
  WHERE b.state = 'staged'
  UNION ALL
  SELECT m.id, 'owner', m.owner_lead_id
  FROM public.traditional_historical_backfill_matches b
  JOIN public.lead_matches m ON m.id = b.match_id
  WHERE b.state = 'staged'
), eligible AS (
  SELECT p.*, l.full_name,
    COALESCE(NULLIF(trim(l.phone_normalized),''), NULLIF(lower(trim(l.email)),''), p.lead_id::text) AS identity,
    (NULLIF(trim(l.email),'') IS NOT NULL AND lower(l.email) NOT LIKE '%@example.com') AS valid_email,
    (NULLIF(trim(l.phone_normalized),'') IS NOT NULL) AS has_phone,
    CASE WHEN p.role = 'tenant' THEN EXISTS (
      SELECT 1 FROM public.tenant_matches_access_tokens a
      WHERE a.tenant_lead_id = p.lead_id AND a.revoked_at IS NULL
        AND (a.expires_at IS NULL OR a.expires_at > now())
    ) ELSE EXISTS (
      SELECT 1 FROM public.owner_candidates_access_tokens a
      WHERE a.owner_lead_id = p.lead_id AND a.revoked_at IS NULL
        AND (a.expires_at IS NULL OR a.expires_at > now())
    ) END AS has_live_access
  FROM participants p JOIN public.lead_intake l ON l.id = p.lead_id
)
SELECT role, identity, min(full_name) AS sample_name,
  count(DISTINCT match_id) AS selected_matches,
  bool_or(valid_email) AS valid_email, bool_or(has_phone) AS has_phone,
  bool_or(has_live_access) AS has_live_access
FROM eligible
GROUP BY role, identity
ORDER BY role, selected_matches DESC;
