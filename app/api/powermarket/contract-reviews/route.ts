import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) throw new Error("Missing Supabase configuration")
  return {
    auth: createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } }),
    db: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }),
  }
}

async function authorize(req: NextRequest) {
  const bearer = req.headers.get("authorization") || ""
  if (!bearer.startsWith("Bearer ")) return null
  const { auth, db } = clients()
  const { data, error } = await auth.auth.getUser(bearer.slice(7).trim())
  if (error || !data.user) return null
  const { data: partner } = await db.from("caucion_partner_users").select("active")
    .eq("user_id", data.user.id).eq("partner", "powermarket").maybeSingle()
  if (!partner?.active) return null
  return { db, userId: data.user.id }
}

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export async function GET(req: NextRequest) {
  try {
    const ctx = await authorize(req)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const applicationId = req.nextUrl.searchParams.get("application_id") || ""
    if (!isUuid(applicationId)) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    const { data, error } = await ctx.db.from("caucion_contract_reviews")
      .select("id,application_id,lead_contract_id,pdf_sha256,version,status,partner_note,reviewed_at,created_at")
      .eq("application_id", applicationId).order("version", { ascending: false }).limit(50)
    if (error) throw error
    return NextResponse.json({ ok: true, reviews: data || [] }, { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    console.error("PowerMarket contract review GET failed", e)
    return NextResponse.json({ error: "No se pudieron consultar las revisiones" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await authorize(req)
    if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    const body = await req.json().catch(() => null)
    const id = String(body?.id || "")
    const expected = String(body?.expected_status || "")
    const decision = String(body?.decision || "")
    const note = String(body?.note || "").trim().slice(0, 1500)
    if (!isUuid(id) || !["pending","changes_requested"].includes(expected) ||
      !["approved","changes_requested"].includes(decision) ||
      (decision === "changes_requested" && !note)) {
      return NextResponse.json({ error: "Decisión inválida" }, { status: 400 })
    }
    const { data, error } = await ctx.db.rpc("caucion_decide_contract_review", {
      p_review_id: id, p_expected_status: expected, p_decision: decision,
      p_actor: ctx.userId, p_note: note
    })
    if (error) {
      if (error.code === "40001") return NextResponse.json({ error: "La revisión cambió. Actualizá la ficha." }, { status: 409 })
      if (error.code === "42883" || error.code === "PGRST202") return NextResponse.json({ error: "Falta instalar la migración de revisión contractual" }, { status: 503 })
      console.error("PowerMarket contract review PATCH failed", error)
      return NextResponse.json({ error: "No se pudo registrar la revisión" }, { status: 500 })
    }
    return NextResponse.json({ ok: true, review: data })
  } catch (e) {
    console.error("PowerMarket contract review PATCH failed", e)
    return NextResponse.json({ error: "No se pudo registrar la decisión" }, { status: 500 })
  }
}
