import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase configuration")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function authorize(request: NextRequest) {
  const auth = request.headers.get("authorization") || ""
  if (!auth.startsWith("Bearer ")) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  const session = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await session.auth.getUser(auth.slice(7))
  if (error || !data.user) return null
  const db = admin()
  const { data: partner, error: partnerError } = await db.from("caucion_partner_users")
    .select("user_id,active,partner").eq("user_id", data.user.id).eq("partner", "powermarket").maybeSingle()
  if (partnerError || !partner?.active) return null
  return { db, userId: data.user.id }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await authorize(request)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const { data, error } = await ctx.db.from("caucion_applications")
      .select("id,tenant_lead_id,status,requested_rent_ars,estimated_expenses_ars,duration_months,monthly_income_ars,employment_type,has_co_tenant,co_tenant_income_ars,approved_max_total_ars,approved_max_rent_ars,decision_expires_at,created_at,submitted_at,decided_at")
      .neq("status", "draft").order("created_at", { ascending: false }).limit(100)
    if (error) throw error
    return NextResponse.json({ ok: true, applications: data || [] }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("PowerMarket GET failed", err)
    return NextResponse.json({ error: "No se pudieron consultar solicitudes" }, { status: 500 })
  }
}

const ALLOWED = ["under_review", "more_info_required", "prequalified", "not_eligible", "alternative_offered"] as const

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await authorize(request)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const body = await request.json().catch(() => null)
    const id = typeof body?.id === "string" ? body.id : ""
    const status = typeof body?.status === "string" ? body.status : ""
    if (!/^[0-9a-f-]{36}$/i.test(id) || !ALLOWED.includes(status as typeof ALLOWED[number])) {
      return NextResponse.json({ error: "Solicitud o estado inválido" }, { status: 400 })
    }
    const { data: current, error: readError } = await ctx.db.from("caucion_applications")
      .select("id,status,approved_max_total_ars,approved_max_rent_ars").eq("id", id).single()
    if (readError || !current) return NextResponse.json({ error: "Solicitud inexistente" }, { status: 404 })
    if (!["submitted", "under_review", "more_info_required", "prequalified", "alternative_offered", "not_eligible"].includes(current.status)) {
      return NextResponse.json({ error: "La solicitud no admite cambios" }, { status: 409 })
    }
    const amount = body?.approved_max_total_ars === "" || body?.approved_max_total_ars == null ? null : Number(body.approved_max_total_ars)
    const rent = body?.approved_max_rent_ars === "" || body?.approved_max_rent_ars == null ? null : Number(body.approved_max_rent_ars)
    if ([amount,rent].some(x => x !== null && (!Number.isFinite(x) || x < 0))) {
      return NextResponse.json({ error: "Montos inválidos" }, { status: 400 })
    }
    if ((status === "prequalified" || status === "alternative_offered") && amount === null && rent === null) {
      return NextResponse.json({ error: "Indicá un límite aprobado" }, { status: 400 })
    }
    const note = String(body?.note || "").slice(0, 1500).trim()
    const update = {
      status, partner_note: note || null,
      approved_max_total_ars: status === "prequalified" || status === "alternative_offered" ? amount : null,
      approved_max_rent_ars: status === "prequalified" || status === "alternative_offered" ? rent : null,
      decided_at: ["prequalified", "alternative_offered", "not_eligible"].includes(status) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }
    // Concurrency guard: changes only if status has not changed since read.
    const { data: changed, error } = await ctx.db.from("caucion_applications")
      .update(update).eq("id", id).eq("status", current.status).select("id,status,approved_max_total_ars,approved_max_rent_ars").maybeSingle()
    if (error) throw error
    if (!changed) return NextResponse.json({ error: "La solicitud fue actualizada por otro operador" }, { status: 409 })
    const eventKey = `caucion:${id}:${status}:${crypto.randomUUID()}`
    const { error: eventError } = await ctx.db.from("caucion_events").insert({
      application_id: id, event_key: eventKey, event_type: "partner_decision",
      actor_user_id: ctx.userId,
      payload: { from: current.status, to: status, approved_max_total_ars: amount, approved_max_rent_ars: rent }
    })
    if (eventError) {
      console.error("PowerMarket audit insert failed", eventError)
      return NextResponse.json({ error: "Estado guardado, pero falló el registro de auditoría; avisar a VERLO", application: changed }, { status: 500 })
    }
    return NextResponse.json({ ok: true, application: changed })
  } catch (err) {
    console.error("PowerMarket PATCH failed", err)
    return NextResponse.json({ error: "No se pudo guardar la decisión" }, { status: 500 })
  }
}
