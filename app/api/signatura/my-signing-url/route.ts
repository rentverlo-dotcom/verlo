import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSignaturaSigningUrl } from "@/lib/signatura/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const QA_URL = "https://anptswspguyotnasoacq.supabase.co"

function reply(value: object, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } })
}

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/signatura-qa-integration" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL) {
    return reply({ ok: false }, 404)
  }

  const token = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1]
  if (!token) return reply({ ok: false }, 401)
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!anon || !serviceKey) return reply({ ok: false }, 503)

  const auth = createClient(QA_URL, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: { user }, error: authError } = await auth.auth.getUser(token)
  if (authError || !user) return reply({ ok: false }, 401)

  const db = createClient(QA_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: profile, error: profileError } = await db.from("profiles")
    .select("role").eq("id", user.id).maybeSingle()
  if (profileError) return reply({ ok: false }, 503)
  if (profile?.role !== "tenant") return reply({ ok: false }, 403)

  const { data: binding, error } = await db.from("signatura_tenant_identity_bindings")
    .select("signatura_document_id,signatura_signature_id,verification_status")
    .eq("tenant_user_id", user.id).maybeSingle()
  if (error) return reply({ ok: false }, 503)
  if (!binding?.signatura_document_id || !binding?.signatura_signature_id ||
      binding.verification_status !== "pending") {
    return reply({ ok: false, error: "no_pending_invitation" }, 404)
  }

  try {
    const signingUrl = await getSignaturaSigningUrl(
      binding.signatura_document_id, binding.signatura_signature_id,
    )
    if (!signingUrl) return reply({ ok: false, error: "invitation_not_available" }, 404)
    // Private single-signer link: never cache, log or expose to other accounts.
    return reply({ ok: true, signing_url: signingUrl })
  } catch {
    return reply({ ok: false, error: "provider_unavailable" }, 502)
  }
}
