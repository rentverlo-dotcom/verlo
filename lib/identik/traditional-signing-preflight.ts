import type { SupabaseClient } from "@supabase/supabase-js"
import { checkPowerMarketSigningApproval } from "@/lib/powermarket/signing-approval"

type Outcome = { allowed: boolean; reason: string; reviewId?: string }

/** Read-only gate before beginning an Identik electronic signing session.
 * Approval/acceptance is not itself a signature. The caller must re-run this
 * gate immediately BEFORE creating a provider document.
 */
export async function checkTraditionalSigningReadiness(
  db: SupabaseClient,
  contractId: string,
): Promise<Outcome> {
  const contractResult = await db.from("lead_contracts")
    .select("id,lead_match_id,tenant_lead_id,owner_lead_id,status,content,tenant_agreed_at,owner_agreed_at")
    .eq("id", contractId).maybeSingle()
  if (contractResult.error) return { allowed: false, reason: "contract_lookup_failed" }
  const contract = contractResult.data
  if (!contract || contract.status !== "agreed" || !contract.content ||
      !contract.tenant_agreed_at || !contract.owner_agreed_at)
    return { allowed: false, reason: "both_parties_not_agreed" }

  const matchResult = await db.from("lead_matches")
    .select("id,tenant_lead_id,owner_lead_id,ready_to_connect_at,tenant_paid_at,tenant_post_visit_decision,owner_post_visit_decision")
    .eq("id", contract.lead_match_id).maybeSingle()
  if (matchResult.error) return { allowed: false, reason: "match_lookup_failed" }
  const match = matchResult.data
  if (!match || match.tenant_lead_id !== contract.tenant_lead_id ||
      match.owner_lead_id !== contract.owner_lead_id ||
      !match.ready_to_connect_at || !match.tenant_paid_at ||
      match.tenant_post_visit_decision !== "yes" ||
      match.owner_post_visit_decision !== "yes")
    return { allowed: false, reason: "match_not_eligible" }

  const approval = await checkPowerMarketSigningApproval(db, {
    contractId: contract.id,
    tenantLeadId: contract.tenant_lead_id,
    contractContent: contract.content,
  })
  if (!approval.allowed) return { allowed: false, reason: approval.reason }
  return { allowed: true, reason: approval.reason, reviewId: approval.reviewId }
}
