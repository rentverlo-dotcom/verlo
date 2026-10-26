import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const json = (status: number, body: object) => NextResponse.json(body, {
    status, headers: { "Cache-Control": "no-store" },
  })
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/temporarios")
    return json(404, { ok: false, error: "Not available" })

  const url = new URL(request.url)
  const role = url.searchParams.get("role")
  const id = url.searchParams.get("id")
  if (!id || !/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id) ||
      (role !== "owner" && role !== "tenant"))
    return json(400, { ok: false, error: "Invalid record" })
  const bearer = request.headers.get("authorization") || ""
  if (!bearer.startsWith("Bearer ") || bearer.length > 4096)
    return json(401, { ok: false, error: "Authentication required" })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !anon || !service)
    return json(503, { ok: false, error: "Service unavailable" })

  const authClient = createClient(supabaseUrl, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: authError } = await authClient.auth.getUser(bearer.slice(7))
  if (authError || !user?.id || !user.email_confirmed_at)
    return json(401, { ok: false, error: "Verified session required" })

  const db = createClient(supabaseUrl, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const owner = role === "owner"
  const { data, error } = await db
    .from(owner ? "temporary_properties" : "temporary_demands")
    .select("id")
    .eq("id", id)
    .eq(owner ? "owner_user_id" : "tenant_user_id", user.id)
    .maybeSingle()

  if (error) return json(503, { ok: false, error: "Unable to verify registration" })
  if (!data) return json(404, { ok: false, error: "Registration not found" })
  return json(200, { ok: true, verified: true })
}
