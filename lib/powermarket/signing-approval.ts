import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export type SigningApproval = { allowed: boolean; reason: string; reviewId?: string; pdfSha256?: string }

/**
 * Server-only pre-signing check. No submitted caucion => no PowerMarket gate.
 * Must be called immediately before sending a document to the signature provider.
 * Never rely on the dashboard's client-side state.
 */
export async function checkPowerMarketSigningApproval(
  db: SupabaseClient,
  params: { contractId: string; tenantLeadId: string; contractContent: string }
): Promise<SigningApproval> {
  const { data: applications, error: applicationError } = await db.from("caucion_applications")
    .select("id,status,decision_expires_at")
    .eq("tenant_lead_id", params.tenantLeadId)
    .neq("status", "draft")
    .order("created_at", { ascending: false }).limit(2)

  if (applicationError) return { allowed: false, reason: "caucion_lookup_unavailable" }
  if (!applications?.length) return { allowed: true, reason: "no_caucion" }
  if (applications.length !== 1) return { allowed: false, reason: "ambiguous_caucion" }

  const application = applications[0]
  if (!["prequalified", "alternative_offered"].includes(application.status))
    return { allowed: false, reason: "caucion_not_approved" }
  if (application.decision_expires_at &&
      Date.parse(application.decision_expires_at) <= Date.now())
    return { allowed: false, reason: "caucion_expired" }

  const { data: rows, error: reviewError } = await db.from("caucion_contract_reviews")
    .select("id,status,contract_content_sha256,pdf_sha256,lead_contract_id")
    .eq("application_id", application.id).eq("lead_contract_id", params.contractId)
    .neq("status", "superseded").limit(2)

  if (reviewError) return { allowed: false, reason: "review_lookup_unavailable" }
  if (rows?.length !== 1 || rows[0].status !== "approved")
    return { allowed: false, reason: "contract_review_pending" }

  const actualHash = createHash("sha256").update(params.contractContent, "utf8").digest("hex")
  if (actualHash !== rows[0].contract_content_sha256)
    return { allowed: false, reason: "contract_changed" }

  return { allowed: true, reason: "approved", reviewId: rows[0].id, pdfSha256: rows[0].pdf_sha256 }
}
