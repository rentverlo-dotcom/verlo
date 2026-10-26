import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const respond = (status: number, value: object) =>
  NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } })

export async function POST(request: Request) {
  const auth = await authorizeTemporaryWrite(request, "tenant")
  if ("status" in auth) return respond(auth.status, { ok: false, error: auth.error })
  let body: { matchId?: unknown; role?: unknown }
  try { body = await request.json() } catch { return respond(400, { ok: false, error: "Solicitud inválida" }) }
  if (!body || typeof body.matchId !== "string" || !uuid.test(body.matchId) ||
      (body.role !== "owner" && body.role !== "tenant"))
    return respond(400, { ok: false, error: "Solicitud inválida" })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return respond(503, { ok: false, error: "Servicio no disponible" })
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await db.rpc("temporary_confirm_reservation", {
    p_match_id: body.matchId, p_actor_id: auth.userId, p_role: body.role,
  })
  if (error) {
    const detail = error.message || ""
    if (detail.includes("not_authorized")) return respond(403, { ok: false, error: "No podés confirmar por esta parte" })
    if (detail.includes("dates_unavailable")) return respond(409, { ok: false, error: "Las fechas ya están reservadas" })
    if (detail.includes("payment_required") || detail.includes("terms_required") ||
        detail.includes("match_not_accepted") || detail.includes("reservation_not_found") ||
        detail.includes("invalid_dates")) return respond(409, { ok: false, error: "Esta reserva todavía no puede confirmarse" })
    return respond(503, { ok: false, error: "No pudimos confirmar la reserva" })
  }
  return respond(200, { ok: true, reservation: data })
}
