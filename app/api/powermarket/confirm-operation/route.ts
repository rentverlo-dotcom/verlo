import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const uuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

/** PowerMarket manually confirms it received the caucion payment.
 * This never charges the tenant, emits a policy, or pays commissions.
 * The atomic DB RPC validates the accepted quote and approved contract.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "").trim()

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })
  }
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const auth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: identity, error: authError } = await auth.auth.getUser(token)
  if (authError || !identity.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { data: partner, error: partnerError } = await db
    .from("caucion_partner_users").select("active")
    .eq("user_id", identity.user.id).eq("partner", "powermarket").maybeSingle()
  if (partnerError || !partner?.active) {
    return NextResponse.json({ error: "Operador PowerMarket no autorizado" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const policyId = String(body?.policy_id || "")
  if (!uuid(policyId) || body?.action !== "confirm_operation") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const { data, error } = await db.rpc("caucion_confirm_partner_operation", {
    p_policy_id: policyId,
    p_actor_user_id: identity.user.id,
  })
  if (error) {
    if (error.code === "42883" || error.code === "PGRST202") {
      return NextResponse.json({ error: "Falta instalar la migración de confirmación de operación" }, { status: 503 })
    }
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Registro de póliza inexistente" }, { status: 404 })
    }
    if (error.code === "40001" || error.code === "23514") {
      return NextResponse.json({
        error: "La operación no está pendiente de pago o sus aprobaciones ya no están vigentes",
      }, { status: 409 })
    }
    if (error.code === "42501") {
      return NextResponse.json({ error: "Operador no autorizado" }, { status: 403 })
    }
    console.error("PowerMarket confirm operation failed", { code: error.code })
    return NextResponse.json({ error: "No se pudo confirmar la operación" }, { status: 503 })
  }

  return NextResponse.json({
    ok: true, operation: data, paid_to: "powermarket",
    payment_confirmed_by_partner: true, policy_issued: false,
  }, { headers: { "Cache-Control": "no-store" } })
}
