/**
 * VERLO Temporarios — independent storage configuration.
 *
 * Deliberately separate from lib/r2.ts: that module defaults to bucket "verlo"
 * and uses the existing production R2_* environment variables.
 * No temporary media route may import it.
 *
 * A dedicated testing bucket and credentials must be provisioned before any
 * upload is allowed. Never fall back to R2_BUCKET or production credentials.
 */
export type TemporaryStorageConfig = {
  bucket: string
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl: string | null
}

export function getTemporaryStorageConfig(
  env: Record<string, string | undefined>,
): TemporaryStorageConfig | null {
  const isPreview = env.VERCEL_ENV === "preview" &&
    ["feature/temporarios", "qa/verlo-e2e"].includes(env.VERCEL_GIT_COMMIT_REF || "")
  const isProduction = env.VERCEL_ENV === "production" &&
    env.TEMPORARY_PUBLIC_ENABLED === "true" &&
    env.TEMPORARY_DB_WRITES_ENABLED === "true"
  if (!isPreview && !isProduction) return null
  if (env.TEMPORARY_R2_UPLOADS_ENABLED !== "true") return null
  // The QA branch must be connected to its independent Supabase QA database.
  if (env.VERCEL_GIT_COMMIT_REF === "qa/verlo-e2e" &&
      env.NEXT_PUBLIC_SUPABASE_URL !== "https://anptswspguyotnasoacq.supabase.co")
    return null
  const bucket = env.TEMPORARY_R2_BUCKET?.trim()
  const accountId = env.TEMPORARY_R2_ACCOUNT_ID?.trim()
  const accessKeyId = env.TEMPORARY_R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.TEMPORARY_R2_SECRET_ACCESS_KEY?.trim()
  if (!bucket || !accountId || !accessKeyId || !secretAccessKey) return null
  if (bucket === "verlo" || bucket === env.R2_BUCKET) return null
  if (accessKeyId === env.R2_ACCESS_KEY_ID || secretAccessKey === env.R2_SECRET_ACCESS_KEY) return null
  return {
    bucket,
    accountId,
    accessKeyId,
    secretAccessKey,
    publicUrl: env.TEMPORARY_R2_PUBLIC_URL?.trim() || null,
  }
}
