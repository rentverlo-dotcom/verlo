import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

type Mode = "production" | "e2e" | "all"
type ConfirmedRow = {
  id: string; application_id: string; lead_contract_id: string | null
  status: string; payment_confirmed_at: string; payment_confirmed_by: string
}
export type CaucionSettlementRow = {
  policy_id: string
  application_id: string
  contract_id: string | null
  tenant_name: string
  confirmation_at: string
  status: string
}
export type CaucionSettlement = {
  month: string
  confirmed_month_count: number | null
  confirmed_total_count: number | null
  recent: CaucionSettlementRow[]
  source: "caucion_policies.payment_confirmed_at"
  truncated: boolean
  unavailable: string | null
  note: string
}

const BASE_NOTE = "Control operativo de ventas de caución confirmadas por PowerMarket. No acredita transferencia de comisiones a VERLO ni calcula importes sin una liquidación acordada."
const EMPTY = (month: string, reason: string): CaucionSettlement => ({
  month, confirmed_month_count: null, confirmed_total_count: null,
  recent: [], source: "caucion_policies.payment_confirmed_at",
  truncated: false, unavailable: reason, note: BASE_NOTE,
})

/**
 * Read-only CEO accounting: payment confirmation is an immutable business
 * milestone; never count mere prequalifications, quotes, or pending policies.
 * Each policy is uniquely identified; repeated confirmation is not a new sale.
 * QA demo leads are excluded from the "production" mode even on QA.
 */
export async function getPowerMarketSettlement(
  db: SupabaseClient,
  mode: Mode,
  now = new Date(),
): Promise<CaucionSettlement> {
  // Buenos Aires observes UTC-03:00; explicitly derive month in AR timezone.
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit",
  }).format(now).replace("/", "-")
  const [year, number] = month.split("-").map(Number)
  if (!year || !number) return EMPTY(month, "invalid_month")
  const start = new Date(Date.UTC(year, number - 1, 1, 3, 0, 0)).toISOString()
  const end = new Date(Date.UTC(year, number, 1, 3, 0, 0)).toISOString()

  const { data: policies, error } = await db.from("caucion_policies")
    .select("id,application_id,lead_contract_id,status,payment_confirmed_at,payment_confirmed_by")
    .in("status", ["payment_confirmed", "issued"])
    .not("payment_confirmed_at", "is", null)
    .not("payment_confirmed_by", "is", null)
    .order("payment_confirmed_at", { ascending: false })
    .limit(1000)
  if (error) return EMPTY(month, "policies_unavailable")
  const confirmed = (policies || []) as ConfirmedRow[]
  // If reaching this limit, do not claim totals. Detailed reconciliation
  // needs pagination rather than silently undercounting.
  if (confirmed.length === 1000) return EMPTY(month, "requires_pagination")

  const applicationIds = [...new Set(confirmed.map(row => row.application_id))]
  if (!applicationIds.length) return {
    ...EMPTY(month, ""), confirmed_month_count: 0,
    confirmed_total_count: 0, unavailable: null,
  }

  const { data: applications, error: appError } = await db.from("caucion_applications")
    .select("id,tenant_lead_id").in("id", applicationIds)
  if (appError || applications?.length !== applicationIds.length)
    return EMPTY(month, "application_lookup_failed")

  const leadIds = [...new Set((applications || []).map(row => row.tenant_lead_id))]
  const { data: leads, error: leadError } = await db.from("lead_intake")
    .select("id,full_name,email,source").in("id", leadIds)
  if (leadError || leads?.length !== leadIds.length)
    return EMPTY(month, "lead_lookup_failed")

  const leadById = new Map((leads || []).map(lead => [lead.id, lead]))
  const tenantByApplication = new Map((applications || []).map(a =>
    [a.id, leadById.get(a.tenant_lead_id)]))
  const filtered = confirmed.filter(row => {
    const lead = tenantByApplication.get(row.application_id)
    if (!lead) return false
    const isTest = lead.source === "qa_demo_powermarket" ||
      String(lead.email || "").toLowerCase().startsWith("qa-")
    return mode === "all" || (mode === "production" ? !isTest : isTest)
  })
  const recent = filtered.slice(0, 100).map(row => ({
    policy_id: row.id, application_id: row.application_id,
    contract_id: row.lead_contract_id,
    tenant_name: String(tenantByApplication.get(row.application_id)?.full_name || "Sin nombre"),
    confirmation_at: row.payment_confirmed_at, status: row.status,
  }))
  return {
    month,
    confirmed_month_count: filtered.filter(row =>
      row.payment_confirmed_at >= start && row.payment_confirmed_at < end).length,
    confirmed_total_count: filtered.length,
    recent,
    truncated: filtered.length > recent.length,
    source: "caucion_policies.payment_confirmed_at",
    unavailable: null,
    note: BASE_NOTE,
  }
}
