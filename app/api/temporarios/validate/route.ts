import { NextResponse } from "next/server"
import { stayNights } from "@/lib/temporarios/matching"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const types = new Set(["casa", "departamento", "cabana", "habitacion"])
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const geoPattern = /^ar:[a-z0-9:-]{3,120}$/i

const response = (body: object, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  })

/**
 * Preview-only, read-only validation. Does not import Supabase, R2,
 * Mercado Pago, GHL or the existing traditional VERLO APIs.
 * The response is informational; future write APIs must revalidate.
 */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview")
    return response({ ok: false, error: "Validation available only in Preview" }, 404)

  const contentLength = Number(request.headers.get("content-length") || "0")
  if (contentLength > 8192) return response({ ok: false, error: "Request too large" }, 413)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return response({ ok: false, error: "Invalid JSON" }, 400)
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return response({ ok: false, error: "Invalid payload" }, 400)

  const data = body as Record<string, unknown>
  const kind = data.kind
  const type = data.propertyType
  if (typeof type !== "string" || !types.has(type))
    return response({ ok: false, error: "Invalid property type" }, 400)

  if (kind === "owner") {
    const key = data.localityKey
    const price = data.nightlyPriceArs
    const from = data.availabilityStart
    const until = data.availabilityEnd
    if (typeof key !== "string" || !geoPattern.test(key) ||
      typeof price !== "number" || !Number.isFinite(price) || price <= 0 ||
      typeof from !== "string" || typeof until !== "string" ||
      !datePattern.test(from) || !datePattern.test(until) ||
      from >= until) {
      return response({ ok: false, error: "Invalid owner data" }, 400)
    }
    // Check calendar validity without limiting listing windows to 90 nights.
    const validDay = (value: string) => {
      const d = new Date(value + "T00:00:00.000Z")
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
    }
    if (!validDay(from) || !validDay(until))
      return response({ ok: false, error: "Invalid dates" }, 400)
    return response({ ok: true, kind: "owner", validated: true, persisted: false })
  }

  if (kind === "tenant") {
    const keys = data.localityKeys
    const budget = data.maxTotalBudgetArs
    const checkIn = data.checkIn
    const checkOut = data.checkOut
    if (!Array.isArray(keys) || keys.length < 1 || keys.length > 30 ||
      !keys.every(key => typeof key === "string" && geoPattern.test(key)) ||
      typeof budget !== "number" || !Number.isFinite(budget) || budget <= 0 ||
      typeof checkIn !== "string" || typeof checkOut !== "string" ||
      stayNights({ checkIn, checkOut }) === null)
      return response({ ok: false, error: "Invalid tenant data or stay outside 1–90 nights" }, 400)
    return response({ ok: true, kind: "tenant", validated: true, persisted: false })
  }

  return response({ ok: false, error: "Unknown kind" }, 400)
}
