import "server-only"
import { createHash } from "node:crypto"
import { checkPowerMarketSigningApproval } from "@/lib/powermarket/signing-approval"
import { createClient } from "@supabase/supabase-js"
import { IdentikApiError, makeIdentikElectronicClient, type IdentikCreatePayload } from "./electronic-v2"

/**
 * Internal operation only. Caller must authorize the contract, check payment,
 * verify acceptance and render the definitive PDF before calling.
 * Never expose this function directly to untrusted request bodies.
 *
 * Local claim is INSERT with a unique lead_contract_id; an uncertain Identik
 * response is deliberately NOT retried automatically (no provider idempotency).
 */
export async function createIdentikElectronicDocument(params: {
  contractId: string
  pdf: Blob
  payload: IdentikCreatePayload
  ownerEmail: string
  tenantEmail: string
}) {
  // Prevent accidental billable creation during QA.
  if (process.env.IDENTIK_ENABLE_CREATE !== "true") {
    throw new Error("Identik document creation disabled")
  }
  const providerBase = process.env.IDENTIK_ELECTRONIC_API_BASE_URL ||
    "https://sandbox-electronica.identik.me/api/v2"
  if (providerBase !== "https://sandbox-electronica.identik.me/api/v2") {
    throw new Error("Identik QA creation must target sandbox")
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase backend not configured")
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.contractId)) {
    throw new Error("Invalid contractId")
  }
  if (params.pdf.type !== "application/pdf" || params.pdf.size === 0) {
    throw new Error("Expected non-empty PDF")
  }
  if (params.pdf.size > 10 * 1024 * 1024) {
    throw new Error("PDF exceeds 10 MiB QA safety limit")
  }
  if (!Array.isArray(params.payload.recipients) || params.payload.recipients.length !== 2) {
    throw new Error("Exactly two signers required")
  }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  // Re-check the current contract and PowerMarket approval immediately before
  // the first billable Identik creation. Never trust a previous UI readiness check.
  const { data: contract, error: contractError } = await db.from("lead_contracts")
    .select("id,tenant_lead_id,content").eq("id", params.contractId).single()
  if (contractError || !contract || typeof contract.content !== "string")
    throw new Error("Contract unavailable for signature")
  const approval = await checkPowerMarketSigningApproval(db, {
    contractId: params.contractId, tenantLeadId: contract.tenant_lead_id,
    contractContent: contract.content,
  })
  if (!approval.allowed)
    throw new Error(`PowerMarket signing blocked: ${approval.reason}`)
  if (approval.pdfSha256) {
    const providedSha256 = createHash("sha256").update(Buffer.from(await params.pdf.arrayBuffer())).digest("hex")
    if (providedSha256 !== approval.pdfSha256)
      throw new Error("PDF differs from PowerMarket-approved document")
  }

  const externalId = `verlo-electronic-${params.contractId}`

  // Exactly one worker should acquire the contract. A duplicate request is not
  // allowed to create a second billable document on Identik.
  const { data: claimed, error: claimError } = await db
    .from("identik_electronic_documents")
    .insert({
      lead_contract_id: params.contractId,
      external_id: externalId,
      status: "creating",
      owner_email: params.ownerEmail,
      tenant_email: params.tenantEmail,
    })
    .select("id")
    .single()

  if (claimError || !claimed) {
    const { data: existing } = await db
      .from("identik_electronic_documents")
      .select("id, status, identik_document_id")
      .eq("lead_contract_id", params.contractId)
      .maybeSingle()

    if (existing) return { created: false, recordId: existing.id, status: existing.status }
    throw new Error("Unable to reserve Identik contract")
  }

  try {
    const client = makeIdentikElectronicClient()
    // The caller must supply the exact v2 payload, including the
    // provider-defined externalId field if available.
    const result = await client.createDocument(params.pdf, params.payload)
    const { error: saveError } = await db
      .from("identik_electronic_documents")
      .update({
        identik_document_id: result.id,
        status: "created",
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimed.id)
      .eq("status", "creating")

    if (saveError) {
      // Provider creation may have succeeded: never retry blindly.
      throw new Error("Identik document created but local persistence failed; manual reconciliation required")
    }
    return { created: true, recordId: claimed.id, status: "created" }
  } catch (error) {
    // Unknown network or storage outcomes are ambiguous. Retain the claim so
    // no second document can be created for this contract.
    const code = error instanceof IdentikApiError ? `http_${error.status}` : "outcome_unknown"
    await db
      .from("identik_electronic_documents")
      .update({ last_error_code: code, updated_at: new Date().toISOString() })
      .eq("id", claimed.id)
    throw error
  }
}
