import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { IdentikApiError, makeIdentikElectronicClient } from "@/lib/identik/electronic-v2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// READ ONLY. An existing, unexpired closing token authorizes viewing the status
// of its own contract. Never return Identik's raw payload or signing URLs.
export async function GET(request: NextRequest) {
  const token = request.headers.get("x-verlo-closing-token")?.trim()
  if (!token || token.length > 512) {
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
    .select("contract_id, lead_id, role, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle()

  if (accessError || !access || access.revoked_at ||
      (access.expires_at && new Date(access.expires_at).getTime() <= Date.now()) ||
      !["tenant", "owner"].includes(access.role)) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 })
  }

  const { data: contract, error: contractError } = await db
    .from("lead_contracts")
    .select("id, tenant_lead_id, owner_lead_id")
    .eq("id", access.contract_id)
    .maybeSingle()

  if (contractError || !contract ||
      (access.role === "tenant" && contract.tenant_lead_id !== access.lead_id) ||
      (access.role === "owner" && contract.owner_lead_id !== access.lead_id)) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 })
  }

  const { data: record, error: dbError } = await db
    .from("identik_electronic_documents")
    .select("status, identik_document_id, owner_signed_at, tenant_signed_at, completed_at")
    .eq("lead_contract_id", contract.id)
    .maybeSingle()

  if (dbError) {
    return NextResponse.json({ ok: false, error: "Status lookup failed" }, { status: 503 })
  }
  if (!record) {
    return NextResponse.json(
      { ok: true, configured: false, status: "not_started" },
      { headers: { "Cache-Control": "no-store" } },
    )
  }

  const safe = {
    ok: true,
    configured: true,
    status: record.status,
    ownerSigned: Boolean(record.owner_signed_at),
    tenantSigned: Boolean(record.tenant_signed_at),
    completed: Boolean(record.completed_at),
  }

  // An optional read-only live refresh lets QA check the sandbox API.
  // It does not change the database or consume document credits.
  if (request.nextUrl.searchParams.get("live") !== "1" || !record.identik_document_id) {
    return NextResponse.json(safe, { headers: { "Cache-Control": "no-store" } })
  }
  if (!Number.isSafeInteger(Number(record.identik_document_id))) {
    return NextResponse.json({ ...safe, providerAvailable: false }, { headers: { "Cache-Control": "no-store" } })
  }
  try {
    const client = makeIdentikElectronicClient()
    const provider = await client.getDocument(Number(record.identik_document_id))
    return NextResponse.json(
      { ...safe, providerAvailable: true, providerStatus: String(provider.status || "unknown") },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    const retryAfter = err instanceof IdentikApiError ? err.retryAfter : null
    return NextResponse.json(
      { ...safe, providerAvailable: false, ...(retryAfter ? { retryAfter } : {}) },
      { headers: { "Cache-Control": "no-store" } },
    )
  }
}
