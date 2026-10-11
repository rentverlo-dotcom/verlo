import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { stayNights } from "@/lib/temporarios/matching"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const deny = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } })
const allowed = new Set(["casa", "departamento", "cabana", "habitacion"])
const geo = (v: unknown): v is string => typeof v === "string" && /^ar:[a-z0-9:-]{3,120}$/i.test(v)
const str = (v: unknown, max = 255) => typeof v === "string" ? v.trim().slice(0, max) : ""

export async function POST(request: Request) {
  const auth = await authorizeTemporaryWrite(request, "tenant")
  if ("status" in auth) return deny(auth.status, auth.error)
  if (Number(request.headers.get("content-length") || 0) > 8192) return deny(413, "Payload demasiado grande")
  let body: Record<string, unknown>
  try {
    const value: unknown = await request.json()
    if (!value || typeof value !== "object" || Array.isArray(value)) return deny(400, "Datos inválidos")
    body = value as Record<string, unknown>
  } catch { return deny(400, "JSON inválido") }
  if (typeof body.website === "string" && body.website.trim())
    return deny(400, "Solicitud invalida")
  const requestKey = body.requestKey
  if (typeof requestKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey))
    return deny(400, "Identificador de solicitud inválido")
  const localityKeys = body.localityKeys
  const propertyType = body.propertyType
  const checkIn = body.checkIn
  const checkOut = body.checkOut
  const budget = body.maxTotalBudgetArs
  const fullName = str(body.fullName, 120)
  const phone = str(body.phone, 30)

  if (!Array.isArray(localityKeys) || localityKeys.length < 1 || localityKeys.length > 30 ||
      !localityKeys.every(geo) || !allowed.has(String(propertyType)) ||
      typeof checkIn !== "string" || typeof checkOut !== "string" ||
      stayNights({checkIn, checkOut}) === null ||
      typeof budget !== "number" || !Number.isFinite(budget) || budget <= 0 ||
      !fullName || !/^\+?[0-9 ()-]{8,30}$/.test(phone))
    return deny(400, "Faltan datos válidos de búsqueda, contacto, fechas o presupuesto")

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return deny(503, "Servicio no configurado")
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  // Repeat requests must return their original ID without consuming another rate slot.
  const existing = await db.from("temporary_demands").select("id").eq("tenant_user_id", auth.userId).eq("request_key",requestKey).maybeSingle()
  if (existing.error) return deny(500, "No se pudo verificar la solicitud")
  if (existing.data) return NextResponse.json({ok:true,id:existing.data.id,reused:true},{status:200,headers:{"Cache-Control":"no-store"}})
  const slot = await db.rpc("temporary_take_write_slot", { p_user_id: auth.userId, p_action: "tenant" })
  if (slot.error || typeof slot.data !== "boolean") return deny(503, "No se pudo verificar el límite de solicitudes")
  if (!slot.data) return deny(429, "Demasiados intentos. Esperá unos minutos y volvé a probar")
  const { data, error } = await db.from("temporary_demands").insert({
    request_key: requestKey, tenant_user_id: auth.userId, tenant_full_name: fullName,
    tenant_email: auth.email, tenant_phone: phone,
    locality_keys: Array.from(new Set(localityKeys as string[])),
    property_type: propertyType, check_in: checkIn, check_out: checkOut,
    max_total_budget_ars: budget, status: "active",
  }).select("id").single()
  if (error?.code === "23505") {
    const previous = await db.from("temporary_demands").select("id").eq("tenant_user_id",auth.userId).eq("request_key",requestKey).maybeSingle()
    if (previous.data?.id) return NextResponse.json({ok:true,id:previous.data.id,reused:true},{status:200,headers:{"Cache-Control":"no-store"}})
  }
  if (error || !data) return deny(500, "No se pudo guardar la búsqueda")
  return NextResponse.json({ok:true,id:data.id}, {status:201,headers:{"Cache-Control":"no-store"}})
}
