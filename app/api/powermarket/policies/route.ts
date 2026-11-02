import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

async function authorize(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const header = req.headers.get("authorization") || ""
  if (!url || !anon || !key || !header.startsWith("Bearer ")) return null
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: user, error } = await auth.auth.getUser(header.slice(7).trim())
  if (error || !user.user) return null
  const { data: partner } = await db.from("caucion_partner_users")
    .select("active").eq("partner", "powermarket").eq("user_id", user.user.id).maybeSingle()
  return partner?.active ? { db, actorId: user.user.id } : null
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await authorize(req)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const applicationId = req.nextUrl.searchParams.get("application_id") || ""
    if (!isUuid(applicationId)) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    const { data, error } = await ctx.db.from("caucion_policies")
      .select("id,application_id,lead_contract_id,quote_id,status,insurer_name,policy_number,issued_at,created_at")
      .eq("application_id", applicationId).order("created_at", { ascending: false }).limit(30)
    if (error) throw error
    return NextResponse.json({ ok: true, policies: data || [] }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("PowerMarket policy lookup failed", error)
    return NextResponse.json({ error: "No se pudieron consultar las pólizas" }, { status: 500 })
  }
}

/** Starts an internal policy record, not an insurer emission or payment. */
export async function POST(req: NextRequest) {
  try {
    const ctx = await authorize(req)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const body = await req.json().catch(() => null)
    const quoteId = String(body?.quote_id || "")
    const contractId = String(body?.lead_contract_id || "")
    if (!isUuid(quoteId) || !isUuid(contractId))
      return NextResponse.json({ error: "Cotización o contrato inválido" }, { status: 400 })

    const { data: quote, error: quoteError } = await ctx.db.from("caucion_quotes")
      .select("id,application_id,status,valid_until").eq("id", quoteId).maybeSingle()
    if (quoteError || !quote) return NextResponse.json({ error: "Cotización inexistente" }, { status: 404 })
    if (quote.status !== "accepted" || !quote.valid_until || Date.parse(quote.valid_until) <= Date.now())
      return NextResponse.json({ error: "Se requiere una cotización aceptada y vigente" }, { status: 409 })

    const { data: application, error: appError } = await ctx.db.from("caucion_applications")
      .select("id,tenant_lead_id,status").eq("id", quote.application_id).maybeSingle()
    const { data: contract, error: contractError } = await ctx.db.from("lead_contracts")
      .select("id,tenant_lead_id").eq("id", contractId).maybeSingle()
    if (appError || contractError || !application || !contract ||
        application.tenant_lead_id !== contract.tenant_lead_id ||
        !["prequalified", "alternative_offered"].includes(application.status))
      return NextResponse.json({ error: "La operación no corresponde a la caución aprobada" }, { status: 409 })

    const { data: reviews, error: reviewError } = await ctx.db.from("caucion_contract_reviews")
      .select("status").eq("application_id", application.id)
      .eq("lead_contract_id", contractId).eq("status", "approved").limit(1)
    if (reviewError || !reviews?.length)
      return NextResponse.json({ error: "Falta la aprobación contractual de PowerMarket" }, { status: 409 })

    const { data: existing, error: existingError } = await ctx.db.from("caucion_policies")
      .select("id").eq("application_id", application.id).eq("lead_contract_id", contractId).limit(1)
    if (existingError) throw existingError
    if (existing?.length) return NextResponse.json({ ok: true, already_exists: true, policy_id: existing[0].id })

    const { data: policy, error: insertError } = await ctx.db.from("caucion_policies")
      .insert({ application_id: application.id, quote_id: quote.id, lead_contract_id: contractId, status: "pending" })
      .select("id,status").single()
    if (insertError) throw insertError
    return NextResponse.json({ ok: true, policy, emitted: false, paid: false }, { status: 201 })
  } catch (error) {
    console.error("PowerMarket policy initialization failed", error)
    return NextResponse.json({ error: "No se pudo iniciar el registro de póliza" }, { status: 500 })
  }
}
