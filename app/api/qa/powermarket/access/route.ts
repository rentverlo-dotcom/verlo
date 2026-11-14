import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// The initial QA dashboard invitation belongs to the VERLO operator.
// A partner contact is onboarded separately after this access is verified.
const APPROVED_QA_EMAIL = "juanoddone29@gmail.com"
const QA_SUPABASE = "https://anptswspguyotnasoacq.supabase.co"
const respond = (status: number, body: object) =>
  NextResponse.json(body, {status, headers: {"Cache-Control": "no-store"}})

export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "qa/verlo-e2e" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_SUPABASE)
    return respond(404, {ok: false})

  const bearer = req.headers.get("authorization") || ""
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!bearer.startsWith("Bearer ") || !anon || !service)
    return respond(401, {ok: false, error: "Iniciá sesión desde el enlace enviado a tu correo"})

  const auth = createClient(QA_SUPABASE, anon, {
    auth: {persistSession: false, autoRefreshToken: false},
  })
  const {data: {user}, error} = await auth.auth.getUser(bearer.slice(7))
  if (error || !user || user.is_anonymous || !user.email_confirmed_at ||
      user.email?.trim().toLowerCase() !== APPROVED_QA_EMAIL)
    return respond(403, {ok: false, error: "Cuenta no habilitada para PowerMarket QA"})

  const db = createClient(QA_SUPABASE, service, {
    auth: {persistSession: false, autoRefreshToken: false},
  })
  const {data: existing, error: lookupError} = await db.from("caucion_partner_users")
    .select("active,partner").eq("user_id", user.id).maybeSingle()
  if (lookupError) return respond(503, {ok: false, error: "No pudimos verificar tu acceso"})
  if (existing) return existing.active && existing.partner === "powermarket"
    ? respond(200, {ok: true, qaOnly: true, authorized: true})
    : respond(403, {ok: false, error: "Acceso desactivado"})

  const {error: insertError} = await db.from("caucion_partner_users")
    .insert({user_id: user.id, partner: "powermarket", active: true})
  if (insertError) {
    // Parallel requests are safe: accept only an already active partner row.
    const {data: concurrent} = await db.from("caucion_partner_users")
      .select("active,partner").eq("user_id", user.id).maybeSingle()
    if (!concurrent?.active || concurrent.partner !== "powermarket")
      return respond(503, {ok: false, error: "No pudimos habilitar tu acceso"})
  }
  return respond(200, {ok: true, qaOnly: true, authorized: true})
}
