import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Read-only readiness gate for Identik electronic signing.
// It never sends a PDF, emails signers, or consumes Identik credits.
export async function GET(request: NextRequest) {
  const closingToken = request.headers.get("x-verlo-closing-token")?.trim()
  if (!closingToken || closingToken.length > 512) {
    return NextResponse.json({ ok: false, error: "Missing closing token" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Server configuration missing" }, { status: 503 })
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: access, error: accessError } = await db
    .from("lead_contract_access_tokens")
    .select("contract_id, lead_id, role, revoked_at, expires_at")
    .eq("token", closingToken)
    .maybeSingle()

  if (accessError || !access || access.revoked_at ||
    (access.expires_at && Date.parse(access.expires_at) <= Date.now()) ||
    !["owner", "tenant"].includes(access.role)) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 })
  }

  const { data: contract, error: contractError } = await db
    .from("lead_contracts")
    .select("id, lead_match_id, tenant_lead_id, owner_lead_id, content, tenant_agreed_at, owner_agreed_at")
    .eq("id", access.contract_id)
    .maybeSingle()

  if (contractError || !contract ||
    (access.role === "tenant" && contract.tenant_lead_id !== access.lead_id) ||
    (access.role === "owner" && contract.owner_lead_id !== access.lead_id)) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 })
  }

  const { data: match, error: matchError } = await db
    .from("lead_matches")
    .select("id, tenant_lead_id, owner_lead_id, tenant_paid_at")
    .eq("id", contract.lead_match_id)
    .maybeSingle()

  if (matchError || !match ||
    match.tenant_lead_id !== contract.tenant_lead_id ||
    match.owner_lead_id !== contract.owner_lead_id) {
    return NextResponse.json({ ok: false, error: "Contract mismatch" }, { status: 409 })
  }

  const { data: doc, error: docError } = await db
    .from("identik_electronic_documents")
    .select("status, identik_document_id")
    .eq("lead_contract_id", contract.id)
    .maybeSingle()

  if (docError) {
    return NextResponse.json({ ok: false, error: "Identik record lookup failed" }, { status: 503 })
  }

  const { data: payments, error: paymentError } = await db
    .from("lead_payments")
    .select("id, amount, currency, approved_at")
    .eq("lead_contract_id", contract.id)
    .eq("lead_match_id", match.id)
    .eq("tenant_lead_id", contract.tenant_lead_id)
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(1)

  if (paymentError) {
    return NextResponse.json({ ok: false, error: "Payment verification unavailable" }, { status: 503 })
  }
  const verifiedPayment = (payments ?? []).some(
    payment => Number(payment.amount) === 119000 &&
      payment.currency === "ARS" && Boolean(payment.approved_at),
  )

  const reasons: string[] = []
  if (!contract.content?.trim()) reasons.push("contract_missing")
  if (!contract.tenant_agreed_at || !contract.owner_agreed_at) reasons.push("acceptance_pending")
  if (!match.tenant_paid_at || !verifiedPayment) reasons.push("payment_pending")
  if (doc) reasons.push("identik_document_already_recorded")

  return NextResponse.json(
    {
      ok: true,
      ready: reasons.length === 0,
      reasons,
      existingDocumentStatus: doc?.status ?? null,
      // Deliberately don't expose the document ID or signing links.
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
