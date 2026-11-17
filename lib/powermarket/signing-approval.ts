import type { SupabaseClient } from "@supabase/supabase-js"

export type SigningApproval = { allowed: boolean; reason: string }

/**
 * A caucion is an approval of financial eligibility, not approval of the
 * rental contract's text. PowerMarket may VIEW the PDF, but cannot approve,
 * reject or request changes to the contract.
 *
 * Fail closed on missing/ambiguous/expired/non-approved caucion applications;
 * the ordinary no-caucion contract flow remains unchanged.
 * This check is server-side only, before a policy operation or a signing step.
 */
export async function checkPowerMarketSigningApproval(
  db: SupabaseClient,
  params: { contractId: string; tenantLeadId: string; contractContent: string },
): Promise<SigningApproval> {
  // Keep the call signature stable for existing callers. The contract must
  // exist and be linked to this tenant; the caller validates this separately.
  // Do not base caucion approval on any contract-review row or PDF hash.
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
      (!Number.isFinite(Date.parse(application.decision_expires_at)) ||
        Date.parse(application.decision_expires_at) <= Date.now()))
    return { allowed: false, reason: "caucion_expired" }

  return { allowed: true, reason: "caucion_approved" }
}
