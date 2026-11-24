import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSignaturaDocument } from "@/lib/signatura/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QA_URL = "https://anptswspguyotnasoacq.supabase.co"
function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/signatura-qa-integration" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL) {
    return reply({ ok: false }, 404)
  }
  const token = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1]
  if (!token) return reply({ ok: false }, 401)
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!anon || !key) return reply({ ok: false }, 503)
  const auth = createClient(QA_URL, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: { user }, error: authError } = await auth.auth.getUser(token)
  if (authError || !user) return reply({ ok: false }, 401)

  const db = createClient(QA_URL, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: binding, error } = await db.from("signatura_tenant_identity_bindings")
    .select("signatura_document_id,signatura_signature_id,verification_status")
    .eq("tenant_user_id", user.id).maybeSingle()
  if (error) return reply({ ok: false }, 503)
  if (!binding?.signatura_document_id || !binding?.signatura_signature_id) {
    return reply({ ok: true, status: "not_started" })
  }
  if (binding.verification_status === "verified") return reply({ ok: true, status: "verified" })

  // A provider webhook alone never proves identity. It must already have
  // arrived through the independently HMAC-verified and durable inbox.
  const { data: event, error: eventError } = await db
    .from("signatura_webhook_events").select("id")
    .eq("document_id", binding.signatura_document_id)
    .eq("signature_id", binding.signatura_signature_id)
    .eq("notification_action", "DS").limit(1).maybeSingle()
  if (eventError) return reply({ ok: false }, 503)
  if (!event) return reply({ ok: true, status: "pending" })

  try {
    const document = await getSignaturaDocument(binding.signatura_document_id)
    if (document.id !== binding.signatura_document_id || document.status !== "CO") {
      return reply({ ok: true, status: "pending" })
    }
    const signature = document.signatures?.find((s) => s.id === binding.signatura_signature_id)
    if (!signature || signature.status !== "CO") return reply({ ok: true, status: "pending" })

    // Provider status and the signed-event inbox match. However, this is NOT
    // sufficient to assert biometric approval. The provider's biometric
    // response schema and its explicit approval criteria must be verified.
    // Fail closed; do not expose a blue badge or mark anyone verified.
    return reply({ ok: true, status: "pending", document_signed: true,
      biometric_verification: "unconfirmed" })
  } catch {
    // Do not leak provider response bodies, photo URLs or ID numbers.
    return reply({ ok: false, error: "provider_unavailable" }, 502)
  }
}
