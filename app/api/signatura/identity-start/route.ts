import { NextRequest, NextResponse } from "next/server"
import { requireSignaturaTenant, getSignaturaBearer } from "@/lib/signatura/tenant-auth"
import { createQaIdentityDeclarationPdf } from "@/lib/signatura/qa-identity-pdf"
import { createSignaturaIdentityInvitation, getSignaturaSigningUrl } from "@/lib/signatura/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function reply(value: object, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest) {
  const token = getSignaturaBearer(request)
  const tenant = token ? await requireSignaturaTenant(token) : null
  if (!tenant) return reply({ ok: false, error: "not_authorized" }, 403)
  // Prevent accidental creation and provider charges from page rendering,
  // crawlers or background retries. The UI must ask explicitly.
  const body = await request.json().catch(() => null)
  if (body?.acknowledged !== true) return reply({ ok: false, error: "consent_required" }, 400)

  const { db, user } = tenant
  const { data: existing, error: lookupError } = await db
    .from("signatura_tenant_identity_bindings")
    .select("verification_status,signatura_document_id")
    .eq("tenant_user_id", user.id).maybeSingle()
  if (lookupError) return reply({ ok: false, error: "storage_unavailable" }, 503)
  if (existing) return reply({
    ok: true,
    status: existing.verification_status,
    created: false,
    ...(existing.signatura_document_id ? {} : { note: "creation_in_progress_or_needs_review" }),
  })

  // The primary key on tenant_user_id serializes concurrent user clicks:
  // only the winner may make a billable Signatura create call.
  const { error: reservationError } = await db
    .from("signatura_tenant_identity_bindings")
    .insert({ tenant_user_id: user.id, verification_status: "pending" })
  if (reservationError) {
    if (reservationError.code === "23505") {
      return reply({ ok: true, status: "pending", created: false })
    }
    return reply({ ok: false, error: "storage_unavailable" }, 503)
  }

  try {
    const created = await createSignaturaIdentityInvitation({
      pdf: createQaIdentityDeclarationPdf(),
      complete_url:
        "https://verlopunto0-git-feature-signatu-009bb9-verlos-projects-b9e9c595.vercel.app/mi-verlo",
    })
    const signer = created.signatures?.[0]
    if (!created.id || !signer?.id || created.signatures?.length !== 1) {
      // A provider document might exist: never blindly auto-retry.
      return reply({ ok: false, error: "provider_creation_needs_review" }, 502)
    }
    const { data: linked, error: saveError } = await db
      .from("signatura_tenant_identity_bindings")
      .update({
        signatura_document_id: created.id,
        signatura_signature_id: signer.id,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_user_id", user.id)
      .is("signatura_document_id", null)
      .select("tenant_user_id").maybeSingle()
    if (saveError || !linked) return reply({ ok: false, error: "save_needs_review" }, 503)

    // The private link can be fetched again from the authenticated GET.
    const url = await getSignaturaSigningUrl(created.id, signer.id).catch(() => null)
    return reply({ ok: true, status: "pending", created: true,
      ...(url ? { signing_url: url } : {}) })
  } catch {
    // Intentionally preserve the reservation for manual recovery; no retry
    // may create duplicates or unexpected charges.
    return reply({ ok: false, error: "provider_creation_needs_review" }, 502)
  }
}
