import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"

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
      .select("id,application_id,lead_contract_id,pdf_sha256,contract_content_sha256,version,status,partner_note,reviewed_at,created_at")
      .eq("application_id", applicationId).order("version", { ascending: false }).limit(50)
    if (error) throw error
    const contracts = Array.from(new Set((data || []).map(row => row.lead_contract_id)))
    const { data: currentContracts, error: contractError } = contracts.length
      ? await ctx.db.from("lead_contracts").select("id,content").in("id", contracts)
      : { data: [], error: null }
    if (contractError) throw contractError
    const currentHashes = new Map((currentContracts || []).map(contract =>
      [contract.id, typeof contract.content === "string"
        ? createHash("sha256").update(contract.content, "utf8").digest("hex") : null]))
    const reviews = (data || []).map(({contract_content_sha256, ...review}) => ({
      ...review,
      current: review.status !== "superseded" &&
        currentHashes.get(review.lead_contract_id) === contract_content_sha256
    }))
    return NextResponse.json({ ok: true, reviews }, { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    console.error("PowerMarket contract review GET failed", e)
    return NextResponse.json({ error: "No se pudieron consultar las revisiones" }, { status: 500 })
  }
}

/** Contract PDFs are view-only for PowerMarket.  Contractual acceptance is
 * exclusively between tenant and owner; the partner only decides caucion.
 * Explicitly block direct API callers as well as hiding the old UI actions.
 */
export async function PATCH() {
  return NextResponse.json(
    { error: "CONTRACT_REVIEW_DECISIONS_DISABLED" },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  )
}
