import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/signatura-qa-integration" ||
      url !== "https://anptswspguyotnasoacq.supabase.co") {
    return json({ ok: false }, 404)
  }

  const token = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1]
  if (!token) return json({ ok: false }, 401)

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!anon || !serviceKey) return json({ ok: false }, 503)

  const authClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: authError } = await authClient.auth.getUser(token)
  if (authError || !user) return json({ ok: false }, 401)

  const server = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await server
    .from("signatura_tenant_identity_bindings")
    .select("verification_status,verified_at")
    .eq("tenant_user_id", user.id)
    .maybeSingle()

  if (error) return json({ ok: false }, 503)

  // Do not expose provider document IDs or biometrics to the browser.
  return json({
    ok: true,
    status: data?.verification_status || "not_started",
    verified_at: data?.verification_status === "verified"
      ? data.verified_at : null,
  })
}
