import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const uuid = (value: string) => /^[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value)

async function resolveTenant(req: NextRequest) {
  const bearer = req.headers.get("authorization") || ""
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!bearer.startsWith("Bearer ") || !url || !anon || !service) return null
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await auth.auth.getUser(bearer.slice(7).trim())
  if (error || !data.user?.email_confirmed_at || !data.user.email) return null
  return { db, email: data.user.email.trim().toLowerCase() }
}

async function ownApplication(ctx: NonNullable<Awaited<ReturnType<typeof resolveTenant>>>, applicationId: string) {
  const { data: application, error } = await ctx.db.from("caucion_applications")
    .select("id,tenant_lead_id,status").eq("id", applicationId).maybeSingle()
  if (error || !application) return null
  const { data: lead, error: leadError } = await ctx.db.from("lead_intake")
    .select("email,role,intent").eq("id", application.tenant_lead_id).maybeSingle()
  if (leadError || !lead || lead.role !== "tenant" || lead.intent !== "tenant_search" ||
      lead.email?.trim().toLowerCase() !== ctx.email) return null
  return application
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenant(request)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const applicationId = request.nextUrl.searchParams.get("application_id") || ""
    if (!uuid(applicationId)) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    const application = await ownApplication(ctx, applicationId)
    if (!application) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const { data, error } = await ctx.db.from("caucion_quotes")
      .select("id,application_id,premium_ars,coverage_total_ars,status,valid_until,created_at")
      .eq("application_id", applicationId).in("status", ["offered","accepted"])
      .order("created_at", { ascending: false }).limit(1)
    if (error) throw error
    return NextResponse.json({ ok: true, quote: data?.[0] || null }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("PowerMarket tenant quote GET failed", error)
    return NextResponse.json({ error: "No se pudo consultar la oferta" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolveTenant(request)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const body = await request.json().catch(() => null)
    const applicationId = String(body?.application_id || "")
    const quoteId = String(body?.quote_id || "")
    if (!uuid(applicationId) || !uuid(quoteId) || body?.action !== "accept")
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    const application = await ownApplication(ctx, applicationId)
    if (!application) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    if (!["prequalified","alternative_offered"].includes(application.status))
      return NextResponse.json({ error: "La caución no está precalificada" }, { status: 409 })
    const { data: quote, error: quoteError } = await ctx.db.from("caucion_quotes")
      .select("id,status,valid_until").eq("id", quoteId)
      .eq("application_id", applicationId).maybeSingle()
    if (quoteError || !quote) return NextResponse.json({ error: "Oferta inexistente" }, { status: 404 })
    if (quote.status !== "offered" || !quote.valid_until ||
        Date.parse(quote.valid_until) <= Date.now())
      return NextResponse.json({ error: "La oferta ya no está disponible" }, { status: 409 })
    const { data: changed, error } = await ctx.db.from("caucion_quotes")
      .update({ status: "accepted" }).eq("id", quoteId).eq("application_id", applicationId)
      .eq("status", "offered").gt("valid_until", new Date().toISOString())
      .select("id,status").maybeSingle()
    if (error) throw error
    if (!changed) return NextResponse.json({ error: "La oferta cambió. Actualizá la página." }, { status: 409 })
    return NextResponse.json({ ok: true, quote: changed }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("PowerMarket tenant quote acceptance failed", error)
    return NextResponse.json({ error: "No se pudo aceptar la oferta" }, { status: 500 })
  }
}
