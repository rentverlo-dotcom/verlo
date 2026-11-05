import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * The price is determined only on the server, using a partner-confirmed policy
 * tied to this exact contract AND tenant. A quotation or application alone
 * never qualifies. An unavailable DB must block checkout, not charge full price.
 */
export const CONTRACT_FEE_ARS = 119000
export const CAUCION_BONIFIED_FEE_ARS = 59500

export type ContractPricing = {
  amount: number
  original_amount: number
  discount_ars: number
  discount_percent: number
  caucion_policy_id: string | null
}

export async function getVerloContractPricing(
  db: SupabaseClient,
  contractId: string,
  tenantLeadId: string
): Promise<ContractPricing> {
  const regular: ContractPricing = {
    amount: CONTRACT_FEE_ARS,
    original_amount: CONTRACT_FEE_ARS,
    discount_ars: 0,
    discount_percent: 0,
    caucion_policy_id: null,
  }

  const { data: policies, error: policyError } = await db
    .from("caucion_policies")
    .select("id,application_id")
    .eq("lead_contract_id", contractId)
    .in("status", ["payment_confirmed", "issued"])
    .not("payment_confirmed_at", "is", null)
    .limit(100)

  if (policyError) throw policyError
  if (!policies?.length) return regular

  const { data: applications, error: applicationError } = await db
    .from("caucion_applications")
    .select("id")
    .in("id", policies.map((p) => p.application_id))
    .eq("tenant_lead_id", tenantLeadId)
    .limit(100)

  if (applicationError) throw applicationError
  const verifiedIds = new Set((applications || []).map((a) => a.id))
  const qualifyingPolicy = policies.find((p) => verifiedIds.has(p.application_id))
  if (!qualifyingPolicy) return regular

  return {
    amount: CAUCION_BONIFIED_FEE_ARS,
    original_amount: CONTRACT_FEE_ARS,
    discount_ars: CONTRACT_FEE_ARS - CAUCION_BONIFIED_FEE_ARS,
    discount_percent: 50,
    caucion_policy_id: qualifyingPolicy.id,
  }
}
