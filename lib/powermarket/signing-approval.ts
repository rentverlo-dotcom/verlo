import type { SupabaseClient } from "@supabase/supabase-js"

export type SigningApproval = { allowed: boolean; reason: string }

type CaucionStatus = SigningApproval & { applicationId?: string }

/**
 * Stage 1 - caucion eligibility only. PowerMarket assesses the applicant
 * BEFORE any rental contract exists. No contract-text decision is required.
 */
export async function checkPowerMarketCaucionEligibility(
  db: SupabaseClient,
  tenantLeadId: string,
): Promise<CaucionStatus> {
  const { data: applications, error } = await db.from("caucion_applications")
    .select("id,status,decision_expires_at")
    .eq("tenant_lead_id", tenantLeadId)
    .neq("status", "draft")
    .order("created_at", { ascending: false }).limit(2)

  if (error) return { allowed: false, reason: "caucion_lookup_unavailable" }
  if (!applications?.length) return { allowed: true, reason: "no_caucion" }
  if (applications.length !== 1) return { allowed: false, reason: "ambiguous_caucion" }

  const application = applications[0]
  if (!["prequalified", "alternative_offered"].includes(application.status))
    return { allowed: false, reason: "caucion_not_approved" }

  if (application.decision_expires_at &&
      (!Number.isFinite(Date.parse(application.decision_expires_at)) ||
        Date.parse(application.decision_expires_at) <= Date.now()))
    return { allowed: false, reason: "caucion_expired" }

  return { allowed: true, reason: "caucion_approved", applicationId: application.id }
}

/**
 * Stage 2 - BEFORE creating or exposing a signature, require PowerMarket's
 * actual, recorded payment confirmation for THIS tenant's THIS contract.
 * Prequalification alone must NEVER unlock a signature.
 * A contract without any caucion keeps its ordinary signing requirements.
 */
export async function checkPowerMarketSigningApproval(
  db: SupabaseClient,
  params: { contractId: string; tenantLeadId: string; contractContent: string },
): Promise<SigningApproval> {
  if (!params.contractId || !params.tenantLeadId || !params.contractContent)
    return { allowed: false, reason: "contract_not_available" }

  const eligibility = await checkPowerMarketCaucionEligibility(db, params.tenantLeadId)
  if (!eligibility.allowed || eligibility.reason === "no_caucion") return eligibility
  if (!eligibility.applicationId) return { allowed: false, reason: "caucion_lookup_unavailable" }

  const { data: policies, error } = await db.from("caucion_policies")
    .select("id,status,payment_confirmed_at,payment_confirmed_by,application_id,lead_contract_id")
    .eq("application_id", eligibility.applicationId)
    .eq("lead_contract_id", params.contractId)
    .in("status", ["payment_confirmed", "issued"])
    .limit(2)

  if (error) return { allowed: false, reason: "caucion_payment_lookup_unavailable" }
  // Exactly one recorded operation, with a timestamp set by the partner-only
  // atomic payment-confirmation RPC. Do not mistake a quote for paid coverage.
  if (policies?.length !== 1 || !policies[0].payment_confirmed_at ||
      !policies[0].payment_confirmed_by ||
      !Number.isFinite(Date.parse(policies[0].payment_confirmed_at)))
    return { allowed: false, reason: "caucion_payment_not_confirmed" }

  return { allowed: true, reason: "caucion_payment_confirmed" }
}
