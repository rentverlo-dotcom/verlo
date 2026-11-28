import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

type Metric = { value: number | null; source: string; note?: string }
type Query = { key: string; table: string; status?: string; column?: string; value?: string }

const COUNTS: Query[] = [
  { key: "temporary_listings_published", table: "temporary_properties", status: "published" },
  { key: "temporary_demands", table: "temporary_demands" },
  { key: "temporary_matches", table: "temporary_matches" },
  { key: "temporary_matches_accepted", table: "temporary_matches", status: "accepted" },
  { key: "temporary_reservations", table: "temporary_reservations" },
  { key: "temporary_reservations_confirmed", table: "temporary_reservations", status: "confirmed" },
  { key: "temporary_contracts", table: "temporary_contracts" },
  { key: "temporary_payments_approved", table: "temporary_payment_attempts", status: "approved" },
  { key: "caucion_applications", table: "caucion_applications" },
  { key: "caucion_policies", table: "caucion_policies" },
  { key: "identik_documents_completed", table: "identik_electronic_documents", status: "completed" },
  { key: "identik_documents_archived", table: "identik_electronic_documents", column: "signed_pdf_storage_key", value: "not_null" },
  { key: "email_outbox_pending", table: "verlo_email_outbox", status: "pending" },
  { key: "email_outbox_sent", table: "verlo_email_outbox", status: "sent" },
  { key: "email_outbox_failed", table: "verlo_email_outbox", status: "failed" },
  { key: "traditional_payment_records_approved", table: "payments", status: "approved" },
]

export type BusinessMetrics = {
  environment: "qa" | "production" | "other"
  mode: "production" | "e2e" | "all"
  metrics: Record<string, Metric>
  unavailable: string[]
  notes: string[]
}

// Read-only, service-role-only counters. No personal data, documents or payment
// identifiers leave this function. Failures are null, NEVER made-up zeros.
export async function getBusinessMetrics(db: SupabaseClient, mode: "production" | "e2e" | "all", env: NodeJS.ProcessEnv): Promise<BusinessMetrics> {
  const environment = env.NEXT_PUBLIC_SUPABASE_URL === "https://anptswspguyotnasoacq.supabase.co" ? "qa"
    : env.VERCEL_ENV === "production" ? "production" : "other"
  const rows = await Promise.all(COUNTS.map(async item => {
    try {
      let q = db.from(item.table).select("id", { count: "exact", head: true })
      if (item.status) q = q.eq("status", item.status)
      if (item.column && item.value === "not_null") q = q.not(item.column, "is", null)
      const { count, error } = await q
      if (error || count === null) return [item.key, null, item.table] as const
      return [item.key, count, item.table] as const
    } catch {
      return [item.key, null, item.table] as const
    }
  }))
  const metrics: Record<string, Metric> = {}
  const unavailable: string[] = []
  for (const [key, value, source] of rows) {
    metrics[key] = { value, source }
    if (value === null) unavailable.push(key)
  }
  return {
    environment, mode, metrics, unavailable,
    notes: [
      "Indicadores operativos, no conciliación contable ni facturación.",
      "Estos contadores incluyen los registros del entorno seleccionado, también pruebas si existen.",
      "La separación producción/E2E del funnel tradicional no se aplica automáticamente a Temporarios y Caución.",
      "Los pagos aprobados en el sistema no certifican por sí mismos acreditación bancaria.",
      "No se incluyen datos personales ni documentos contractuales en este resumen.",
    ],
  }
}

export type MetaMetrics = {
  connected: boolean
  spend_30d_ars: number | null
  impressions_30d: number | null
  clicks_30d: number | null
  campaign_count_30d: number | null
  source: string
  period: string
  error?: string
}

// Meta is queried server-side. Do not return the token, request URL or raw
// campaign responses to the browser. Use campaign totals only.
export async function getMetaMetrics(env: NodeJS.ProcessEnv): Promise<MetaMetrics> {
  const base = {
    connected: false, spend_30d_ars: null, impressions_30d: null,
    clicks_30d: null, campaign_count_30d: null,
    source: "Meta Ads Insights API", period: "last_30d",
  }
  if (!env.META_AD_ACCOUNT_ID || !env.META_MARKETING_ACCESS_TOKEN)
    return { ...base, error: "not_configured" }
  try {
    const account = env.META_AD_ACCOUNT_ID.trim()
    if (!/^(act_)?[0-9]+$/.test(account)) return { ...base, error: "invalid_account_configuration" }
    const accountId = account.startsWith("act_") ? account : "act_" + account
    const version = /^v[0-9]+\.[0-9]+$/.test(env.META_GRAPH_VERSION || "") ? env.META_GRAPH_VERSION : "v21.0"
    const url = new URL(`https://graph.facebook.com/${version}/${accountId}/insights`)
    url.searchParams.set("level", "account")
    url.searchParams.set("date_preset", "last_30d")
    url.searchParams.set("fields", "spend,impressions,clicks")
    url.searchParams.set("limit", "1")
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${env.META_MARKETING_ACCESS_TOKEN}` },
      cache: "no-store", signal: AbortSignal.timeout(8500),
    })
    if (!response.ok) return { ...base, error: "provider_unavailable" }
    const json = await response.json() as { data?: Array<Record<string, string>> }
    const first = json.data?.[0]
    if (!first) return { ...base, error: "no_period_data" }
    const spend = Number(first.spend)
    const impressions = Number(first.impressions)
    const clicks = Number(first.clicks)
    if (![spend, impressions, clicks].every(Number.isFinite)) return { ...base, error: "invalid_provider_data" }
    return { ...base, connected: true, spend_30d_ars: spend,
      impressions_30d: impressions, clicks_30d: clicks,
      campaign_count_30d: null,
    }
  } catch { return { ...base, error: "provider_unavailable" } }
}
