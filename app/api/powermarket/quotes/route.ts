import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const uuid = (s: string) => /^[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}$/i.test(s)

async function partner(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const authorization = request.headers.get("authorization") || ""
  if (!url || !anon || !key || !authorization.startsWith("Bearer ")) return null
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: identity, error } = await auth.auth.getUser(authorization.slice(7).trim())
  if (error || !identity.user) return null
  const { data: account } = await db.from("caucion_partner_users").select("active")
    .eq("user_id", identity.user.id).eq("partner", "powermarket").maybeSingle()
  return account?.active ? { db, userId: identity.user.id } : null
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await partner(request)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const applicationId = request.nextUrl.searchParams.get("application_id") || ""
    if (!uuid(applicationId)) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    const { data, error } = await ctx.db.from("caucion_quotes")
      .select("id,application_id,monthly_rent_ars,monthly_expenses_ars,coverage_total_ars,premium_ars,status,valid_until,created_at")
      .eq("application_id", applicationId).order("created_at", { ascending: false }).limit(30)
    if (error) throw error
    return NextResponse.json({ ok: true, quotes: data || [] }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("PowerMarket quote GET failed", error)
    return NextResponse.json({ error: "No se pudieron consultar las cotizaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await partner(request)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const body = await request.json().catch(() => null)
    const applicationId = String(body?.application_id || "")
    const premium = Number(body?.premium_ars)
    const coverage = Number(body?.coverage_total_ars)
    const expires = typeof body?.valid_until === "string" ? Date.parse(body.valid_until) : NaN
    if (!uuid(applicationId) || !Number.isFinite(premium) || premium <= 0 ||
        !Number.isFinite(coverage) || coverage <= 0 || !Number.isFinite(expires) ||
        expires <= Date.now()) {
      return NextResponse.json({ error: "Cotización inválida" }, { status: 400 })
    }
    const { data: app, error: appError } = await ctx.db.from("caucion_applications")
      .select("id,status,requested_rent_ars,estimated_expenses_ars")
      .eq("id", applicationId).single()
    if (appError || !app) return NextResponse.json({ error: "Solicitud inexistente" }, { status: 404 })
    if (!["prequalified", "alternative_offered"].includes(app.status))
      return NextResponse.json({ error: "La solicitud no está precalificada" }, { status: 409 })
    const { data: existing, error: existingError } = await ctx.db.from("caucion_quotes")
      .select("id").eq("application_id", applicationId).in("status", ["draft", "offered"]).limit(1)
    if (existingError) throw existingError
    if (existing?.length) return NextResponse.json({ error: "Ya existe una cotización abierta" }, { status: 409 })
    const { data: quote, error } = await ctx.db.from("caucion_quotes").insert({
      application_id: applicationId, partner_user_id: ctx.userId,
      monthly_rent_ars: app.requested_rent_ars, monthly_expenses_ars: app.estimated_expenses_ars,
      coverage_total_ars: coverage, premium_ars: premium, valid_until: new Date(expires).toISOString(),
      status: "draft"
    }).select("id,status").single()
    if (error) throw error
    return NextResponse.json({ ok: true, quote }, { status: 201 })
  } catch (error) {
    console.error("PowerMarket quote POST failed", error)
    return NextResponse.json({ error: "No se pudo guardar la cotización" }, { status: 500 })
  }
}
