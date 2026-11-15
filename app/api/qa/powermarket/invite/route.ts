import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendZohoEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QA_URL = "https://anptswspguyotnasoacq.supabase.co"
const QA_ORIGIN = "https://verlopunto0-git-qa-verlo-e2e-verlos-projects-b9e9c595.vercel.app"
const OWNER = "juanoddone29@gmail.com"
const PARTNER = "mpagoto@pmb.com.ar"

const reply = (status: number, body: object) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })

// Only the two named participants may receive these QA invitations.
// Not a general-purpose SMTP bypass or an open user-registration endpoint.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "qa/verlo-e2e" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL)
    return reply(404, { ok: false })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return reply(503, { ok: false, error: "La verificación de VERLO no está disponible" })

  const data = await request.json().catch(() => null)
  const email = typeof data?.email === "string" ? data.email.trim().toLowerCase() : ""
  if (![OWNER, PARTNER].includes(email))
    return reply(403, { ok: false, error: "Este correo no está autorizado para PowerMarket QA" })

  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // The owner must activate first; sending the partner invitation is blocked
  // until the owner has passed real Supabase Auth and obtained an active role.
  if (email === PARTNER) {
    let ownerEnabled = false
    for (let page = 1; page <= 10; page++) {
      const { data: listed, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) return reply(503, { ok: false, error: "No pudimos verificar los permisos" })
      const owner = listed.users.find(u =>
        u.email?.trim().toLowerCase() === OWNER && !!u.email_confirmed_at)
      if (owner) {
        const { data: role } = await db.from("caucion_partner_users")
          .select("active,partner").eq("user_id", owner.id).maybeSingle()
        ownerEnabled = role?.active === true && role.partner === "powermarket"
        break
      }
      if (listed.users.length < 1000) break
    }
    if (!ownerEnabled)
      return reply(409, { ok: false, error: "Primero debe activarse el acceso de VERLO" })
  }

  // Durable atomic per-recipient throttle in the isolated QA database.
  const now = new Date().toISOString()
  const cutoff = new Date(Date.now() - 120000).toISOString()
  const { data: current, error: lookupError } = await db
    .from("qa_powermarket_email_requests").select("last_requested_at")
    .eq("email", email).maybeSingle()
  if (lookupError) return reply(503, { ok: false, error: "No pudimos verificar la solicitud" })
  if (current && current.last_requested_at >= cutoff)
    return reply(429, { ok: false, error: "Ya enviamos un enlace recientemente. Revisá tu correo." })

  if (current) {
    const { data: updated, error } = await db.from("qa_powermarket_email_requests")
      .update({ last_requested_at: now }).eq("email", email)
      .lt("last_requested_at", cutoff).select("email").maybeSingle()
    if (error || !updated)
      return reply(429, { ok: false, error: "Revisá tu correo antes de solicitar otro enlace." })
  } else {
    const { error } = await db.from("qa_powermarket_email_requests")
      .insert({ email, last_requested_at: now })
    if (error) return reply(429, { ok: false, error: "Revisá tu correo antes de solicitar otro enlace." })
  }

  // Admin.generateLink does not send an email: VERLO sends it using Zoho.
  // Only the hash goes into a first-party VERLO URL (never localhost).
  const { data: link, error: linkError } = await db.auth.admin.generateLink({
    type: "magiclink", email, options: { redirectTo: QA_ORIGIN + "/powermarket" },
  })
  const tokenHash = link?.properties?.hashed_token
  if (linkError || typeof tokenHash !== "string" || !/^[a-f0-9]+$/i.test(tokenHash)) {
    console.error("QA_POWERMARKET_LINK_GENERATION_FAILED", linkError?.code || "missing_hash")
    return reply(503, { ok: false, error: "VERLO no pudo preparar el acceso" })
  }
  const url = QA_ORIGIN + "/powermarket#token_hash=" + encodeURIComponent(tokenHash) + "&type=magiclink"
  const sent = await sendZohoEmail(email,
    "Tu acceso al panel PowerMarket de VERLO",
    "Te invitamos a ingresar al panel privado de PowerMarket en VERLO QA. Este enlace de acceso es personal y de un solo uso. Si no lo solicitaste, podés ignorar este correo.",
    url, "qa-powermarket-invite:" + randomUUID())
  if (!sent.ok) {
    console.error("QA_POWERMARKET_VERLO_EMAIL_FAILED", sent.error || "provider_error")
    return reply(503, { ok: false, error: "No pudimos enviar el correo desde VERLO. No se habilitó el acceso." })
  }
  return reply(200, { ok: true, sent: true, sender: "VERLO", qaOnly: true })
}
