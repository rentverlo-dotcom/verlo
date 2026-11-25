import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"

// The existing Mi VERLO application is lead-based, not profiles.role-based.
// Never accept a tenant email or lead ID supplied by the browser.
export async function requireSignaturaTenant(token: string): Promise<{
  user: User
  db: SupabaseClient
  leadId: string
} | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/signatura-qa-integration" ||
      url !== "https://anptswspguyotnasoacq.supabase.co" ||
      !anon || !secret || !token) return null

  const auth = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error } = await auth.auth.getUser(token)
  if (error || !user || !user.email || !user.email_confirmed_at) return null

  const db = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: leads, error: leadError } = await db.from("lead_intake")
    .select("id").eq("role", "tenant")
    .ilike("email", user.email.trim())
    .order("created_at", { ascending: false }).limit(1)
  if (leadError || !leads?.length) return null

  // A tenant can have multiple search leads; the verified Auth email is
  // the shared identity, and the document is bound to auth.users.id.
  return { user, db, leadId: leads[0].id }
}

export function getSignaturaBearer(request: Request): string | null {
  return request.headers.get("authorization")?.match(/^Bearer ([^\\s]+)$/i)?.[1] || null
}
