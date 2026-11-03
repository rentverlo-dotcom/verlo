import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { sendZohoEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SUPPORT_ADDRESS = "soporte@verlo.lat"
const MAX_REQUEST_BYTES = 8000
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 3
const attempts = new Map<string, { count: number; until: number }>()

const reply = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, {
    status, headers: { "Cache-Control": "no-store" },
  })

const cleaned = (input: unknown, max: number) =>
  typeof input === "string" ? input.trim().slice(0, max) : ""

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin")
  const host = req.headers.get("host")
  if (!origin || !host) return reply(403, { error: "Origen no autorizado." })
  try {
    if (new URL(origin).host !== host) return reply(403, { error: "Origen no autorizado." })
  } catch {
    return reply(403, { error: "Origen no autorizado." })
  }

  const raw = await req.text().catch(() => "")
  if (!raw || Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES) {
    return reply(400, { error: "Consulta demasiado extensa." })
  }

  let input: Record<string, unknown>
  try { input = JSON.parse(raw) as Record<string, unknown> }
  catch { return reply(400, { error: "Datos inválidos." }) }

  // Invisible spam trap: bots get a benign response; never send mail.
  if (cleaned(input.website, 200)) return reply(200, { ok: true })

  const name = cleaned(input.name, 100).replace(/[\r\n]/g, " ")
  const email = cleaned(input.email, 254)
  const message = cleaned(input.message, 2000)
  if (name.length < 2 || name.length > 100 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      message.length < 10 || message.length > 2000) {
    return reply(400, { error: "Completá nombre, email válido y consulta (mínimo 10 caracteres)." })
  }

  // Lightweight per-process abuse guard; not a distributed or durable rate limiter.
  const ip = (req.headers.get("x-forwarded-for") || "anonymous").split(",")[0].trim()
  const key = ip.replace(/[^\w.: -]/g, "").slice(0, 100)
  const now = Date.now()
  if (attempts.size > 2000) {
    attempts.forEach((value, item) => { if (value.until <= now) attempts.delete(item) })
  }
  const prior = attempts.get(key)
  const state = prior && prior.until > now ? prior : { count: 0, until: now + WINDOW_MS }
  if (state.count >= MAX_ATTEMPTS) return reply(429, { error: "Demasiados intentos. Probá más tarde." })
  state.count += 1
  attempts.set(key, state)

  const result = await sendZohoEmail(
    SUPPORT_ADDRESS,
    "Consulta recibida desde VERLO",
    `Nombre: ${name}\nEmail de contacto: ${email}\n\nConsulta:\n${message}`,
    "https://verlo.lat",
    `support-contact-${randomUUID()}`
  )

  if (!result.ok) {
    console.error("Support contact delivery failed", { configured: result.configured })
    return reply(503, { error: "No pudimos enviar tu consulta. Probá nuevamente más tarde." })
  }
  return reply(200, { ok: true })
}
