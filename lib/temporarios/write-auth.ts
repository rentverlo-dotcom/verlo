import { createClient } from "@supabase/supabase-js"

type Role = "owner" | "tenant"
type AuthResult = { ok: true; userId: string; email: string } | { ok: false; status: number; error: string }

/**
 * Separate temporary-write authorization.
 * Preview deploy alone is not authorization: require an explicit backend flag,
 * a valid Supabase access token and verified email before any database write.
 */
export async function authorizeTemporaryWrite(request: Request, role: Role): Promise<AuthResult> {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/temporarios" ||
      process.env.TEMPORARY_DB_WRITES_ENABLED !== "true") {
    return { ok: false, status: 503, error: "Temporary writes are disabled" }
  }
  const bearer = request.headers.get("authorization") || ""
  if (!bearer.startsWith("Bearer ") || bearer.length > 4096)
    return { ok: false, status: 401, error: "Authentication required" }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return { ok: false, status: 503, error: "Authentication unavailable" }
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.getUser(bearer.slice(7))
  if (error || !data.user?.id || !data.user.email_confirmed_at || !data.user.email)
    return { ok: false, status: 401, error: "Verified login required" }
  // An explicit QA identity allowlist is mandatory for Preview writes.
  const allowed = (process.env.TEMPORARY_QA_USER_IDS || "")
    .split(",").map(value => value.trim().toLowerCase()).filter(Boolean)
  if (!allowed.includes(data.user.id.toLowerCase()))
    return { ok: false, status: 403, error: "Temporary QA access required" }
  return { ok: true, userId: data.user.id, email: data.user.email.toLowerCase() }
}
