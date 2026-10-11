import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const deny = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } })
const validDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v
const types = new Set(["casa","departamento","cabana","habitacion"])
const geo = (v: unknown): v is string => typeof v === "string" && /^ar:[a-z0-9:-]{3,120}$/i.test(v)
const str = (v: unknown, max = 255) => typeof v === "string" ? v.trim().slice(0, max) : ""

export async function POST(request: Request) {
  const auth = await authorizeTemporaryWrite(request, "owner")
  if ("status" in auth) return deny(auth.status, auth.error)
  if (Number(request.headers.get("content-length") || 0) > 8192) return deny(413, "Payload demasiado grande")

  let body: Record<string, unknown>
  try {
    const raw: unknown = await request.json()
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return deny(400, "Datos inválidos")
    body = raw as Record<string, unknown>
  } catch { return deny(400, "JSON inválido") }

  // Hidden bot trap: never persist submissions filling this field.
  if (typeof body.website === "string" && body.website.trim())
    return deny(400, "Solicitud inválida")

  const localityKey = body.localityKey
  const localityLabel = str(body.localityLabel)
  const propertyType = body.propertyType
  const price = body.nightlyPriceArs
  const start = body.availabilityStart
  const end = body.availabilityEnd
  const fullName = str(body.fullName, 120)
  const phone = str(body.phone, 30)
  const reference = str(body.publicLocationReference, 300)
  const depositRequired = body.depositRequired === true

  if (!geo(localityKey) || !localityLabel || !types.has(String(propertyType)) ||
      typeof price !== "number" || !Number.isFinite(price) || price <= 0 ||
      !validDate(start) || !validDate(end) || start >= end || !fullName ||
      !/^\+?[0-9 ()-]{8,30}$/.test(phone)) return deny(400, "Faltan datos válidos de propietario, ubicación, precio o disponibilidad")

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return deny(503, "Servicio no configurado")
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await db.from("temporary_properties").insert({
    owner_user_id: auth.userId, owner_full_name: fullName, owner_email: auth.email,
    owner_phone: phone, locality_key: localityKey, locality_label: localityLabel,
    public_location_reference: reference || null, property_type: propertyType,
    nightly_price_ars: price, availability_start: start, availability_end: end,
    deposit_required: depositRequired, status: "draft",
  }).select("id").single()
  if (error || !data) return deny(500, "No se pudo crear el borrador")
  return NextResponse.json({ ok: true, id: data.id, status: "draft" }, { status: 201, headers: { "Cache-Control": "no-store" } })
}
