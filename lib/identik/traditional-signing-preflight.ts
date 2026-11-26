import type { SupabaseClient } from "@supabase/supabase-js"
import { checkPowerMarketSigningApproval } from "@/lib/powermarket/signing-approval"

type Outcome = { allowed: boolean; reason: string }

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

  // The match timestamp alone is insufficient proof of a paid VERLO contract.
  // An approved payment must belong to this tenant and this rental/contract.
  // A prepaid credit may originate from another match, but must already have
  // been consumed by this rental before we prepare any signature.
  const { data: rentals, error: rentalError } = await db.from("rentals")
    .select("id").eq("lead_contract_id", contract.id)
    .eq("lead_match_id", match.id).eq("tenant_lead_id", contract.tenant_lead_id)
    .limit(2)
  if (rentalError || rentals?.length !== 1)
    return { allowed: false, reason: "rental_payment_link_unavailable" }

  const rentalId = rentals[0].id
  const { data: proofs, error: proofError } = await db.from("lead_payments")
    .select("id,lead_contract_id,lead_match_id,consumed_rental_id")
    .eq("tenant_lead_id", contract.tenant_lead_id)
    .eq("status", "approved")
    .or(`lead_contract_id.eq.${contract.id},lead_match_id.eq.${match.id},consumed_rental_id.eq.${rentalId}`)
    .limit(30)
  if (proofError) return { allowed: false, reason: "verlo_payment_lookup_failed" }
  const paidForThisRental = (proofs || []).some(payment =>
    payment.consumed_rental_id === rentalId ||
    (!payment.consumed_rental_id &&
      (payment.lead_contract_id === contract.id || payment.lead_match_id === match.id))
  )
  if (!paidForThisRental)
    return { allowed: false, reason: "verlo_payment_not_verified" }

  // A contractual guarantor cannot be silently excluded from a two-signer envelope.
  // Signatura's three-party flow must be certified before releasing this contract.
  const { data: guarantors, error: guarantorError } = await db
    .from("contract_guarantors").select("id").eq("lead_contract_id", contract.id).limit(1)
  if (guarantorError) return { allowed: false, reason: "guarantor_lookup_unavailable" }
  if (guarantors?.length) return { allowed: false, reason: "guarantor_signature_flow_pending" }

  const approval = await checkPowerMarketSigningApproval(db, {
    contractId: contract.id,
    tenantLeadId: contract.tenant_lead_id,
    contractContent: contract.content,
  })
  if (!approval.allowed) return { allowed: false, reason: approval.reason }
  return { allowed: true, reason: approval.reason }
}
