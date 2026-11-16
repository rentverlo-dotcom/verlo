import { NextRequest, NextResponse } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { IDENTIK_ARTIFACT_BUCKET } from "@/lib/identik/archive-artifacts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Context = { db: SupabaseClient; email: string }
const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
const uuid = (value: string) => /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)

async function identity(request: NextRequest): Promise<Context | null> {
  const header = request.headers.get("authorization") || ""
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || !anon || !header.startsWith("Bearer ")) return null
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await auth.auth.getUser(header.slice(7).trim())
  if (error || !data.user?.email || !data.user.email_confirmed_at) return null
  return { db, email: data.user.email.trim().toLowerCase() }
}

async function authorizedSignedRows(ctx: Context) {
  const [ownerDocs, tenantDocs] = await Promise.all([
    ctx.db.from("identik_electronic_documents")
      .select("id,lead_contract_id,owner_email,tenant_email,status,signed_pdf_storage_key")
      .ilike("owner_email", ctx.email).eq("status", "completed").limit(50),
    ctx.db.from("identik_electronic_documents")
      .select("id,lead_contract_id,owner_email,tenant_email,status,signed_pdf_storage_key")
      .ilike("tenant_email", ctx.email).eq("status", "completed").limit(50),
  ])
  if (ownerDocs.error || tenantDocs.error) throw new Error("DOCUMENT_LOOKUP_FAILED")
  const rows = [...(ownerDocs.data || []), ...(tenantDocs.data || [])]
  const validated: Array<{ contractId: string; key: string }> = []
  for (const row of rows.filter((r,i,all)=>all.findIndex(other=>other.id===r.id)===i)) {
    if (!row.signed_pdf_storage_key || !uuid(row.lead_contract_id)) continue
    const { data: contract } = await ctx.db.from("lead_contracts")
      .select("owner_lead_id,tenant_lead_id").eq("id", row.lead_contract_id).maybeSingle()
    if (!contract) continue
    const ownLeadId = row.owner_email?.trim().toLowerCase() === ctx.email
      ? contract.owner_lead_id
      : row.tenant_email?.trim().toLowerCase() === ctx.email
        ? contract.tenant_lead_id : null
    if (!ownLeadId) continue
    const { data: lead } = await ctx.db.from("lead_intake")
      .select("email").eq("id", ownLeadId).maybeSingle()
    if (lead?.email?.trim().toLowerCase() !== ctx.email) continue
    validated.push({ contractId: row.lead_contract_id, key: row.signed_pdf_storage_key })
  }
  return validated
}

// Lists only contracts whose signed document was archived. No private URLs.
export async function GET(request: NextRequest) {
  const ctx = await identity(request)
  if (!ctx) return reply({ error: "No autorizado" }, 401)
  try {
    const rows = await authorizedSignedRows(ctx)
    return reply({ ok: true, contracts: rows.map(row => ({ contractId: row.contractId })) })
  } catch { return reply({ error: "No pudimos consultar tus contratos firmados" }, 503) }
}

// A short-lived signed URL is issued only on explicit participant click.
export async function POST(request: NextRequest) {
  const ctx = await identity(request)
  if (!ctx) return reply({ error: "No autorizado" }, 401)
  const body = await request.json().catch(() => null)
  const contractId = typeof body?.contractId === "string" ? body.contractId : ""
  if (!uuid(contractId)) return reply({ error: "Contrato inválido" }, 400)
  try {
    const rows = await authorizedSignedRows(ctx)
    const row = rows.find(item => item.contractId === contractId)
    if (!row) return reply({ error: "PDF no disponible para tu cuenta" }, 403)
    const { data: bucket, error: bucketError } = await ctx.db.storage.getBucket(IDENTIK_ARTIFACT_BUCKET)
    if (bucketError || !bucket || bucket.public) return reply({ error: "Archivo privado no disponible" }, 503)
    const { data, error } = await ctx.db.storage.from(IDENTIK_ARTIFACT_BUCKET)
      .createSignedUrl(row.key, 60)
    if (error || !data?.signedUrl) return reply({ error: "No se pudo abrir el PDF" }, 503)
    return reply({ ok: true, url: data.signedUrl, expiresSeconds: 60 })
  } catch { return reply({ error: "No se pudo abrir el contrato firmado" }, 503) }
}
