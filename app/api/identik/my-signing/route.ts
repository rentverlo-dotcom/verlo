import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { makeIdentikElectronicClient } from "@/lib/identik/electronic-v2"
import { checkTraditionalSigningReadiness } from "@/lib/identik/traditional-signing-preflight"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const response = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })

function validProviderUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  try {
    const u = new URL(value)
    return u.protocol === "https:" &&
      (u.hostname === "identik.me" || u.hostname.endsWith(".identik.me")) &&
      !u.username && !u.password
  } catch { return false }
}

// Existing-session access only: this endpoint NEVER creates documents,
// distributes envelopes or sends emails. Provider URLs are returned only
// to the authenticated, email-verified participant of the agreed contract.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || ""
  if (!authHeader.startsWith("Bearer ")) return response({ error: "No autorizado" }, 401)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) return response({ error: "Configuración no disponible" }, 503)
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await auth.auth.getUser(authHeader.slice(7).trim())
  const email = data.user?.email?.trim().toLowerCase()
  if (error || !data.user || !data.user.email_confirmed_at || !email)
    return response({ error: "Email verificado requerido" }, 403)

  const [ownerDocs, tenantDocs] = await Promise.all([
    db.from("identik_electronic_documents")
      .select("id,lead_contract_id,identik_document_id,status,owner_email,tenant_email")
      .ilike("owner_email", email).in("status", ["created", "sent", "pending"]).limit(20),
    db.from("identik_electronic_documents")
      .select("id,lead_contract_id,identik_document_id,status,owner_email,tenant_email")
      .ilike("tenant_email", email).in("status", ["created", "sent", "pending"]).limit(20),
  ])
  if (ownerDocs.error || tenantDocs.error) return response({ error: "No pudimos consultar las firmas" }, 503)
  const docs = Array.from(new Map(
    [...ownerDocs.data || [], ...tenantDocs.data || []].map(d => [d.id, d])
  ).values())

  const items: Array<{ contractId: string; role: "owner" | "tenant"; signingUrl: string }> = []
  for (const doc of docs) {
    if (!doc.identik_document_id) continue
    const { data: contract } = await db.from("lead_contracts")
      .select("id,owner_lead_id,tenant_lead_id").eq("id", doc.lead_contract_id).maybeSingle()
    if (!contract) continue
    const isOwner = doc.owner_email?.trim().toLowerCase() === email
    const isTenant = doc.tenant_email?.trim().toLowerCase() === email
    const leadId = isOwner ? contract.owner_lead_id : isTenant ? contract.tenant_lead_id : null
    if (!leadId) continue
    // Email identity is verified independently from client-supplied IDs.
    const { data: lead } = await db.from("lead_intake").select("id,email")
      .eq("id", leadId).maybeSingle()
    if (!lead || lead.email?.trim().toLowerCase() !== email) continue
    const readiness = await checkTraditionalSigningReadiness(db, contract.id)
    if (!readiness.allowed) continue
    try {
      const provider = await makeIdentikElectronicClient().getDocument(Number(doc.identik_document_id))
      const recipients = Array.isArray(provider.recipients) ? provider.recipients : []
      const mine = recipients.find(item => {
        if (!item || typeof item !== "object") return false
        const r = item as Record<string, unknown>
        return typeof r.email === "string" && r.email.trim().toLowerCase() === email
      }) as Record<string, unknown> | undefined
      if (mine && validProviderUrl(mine.signingUrl) && mine.signingStatus !== "SIGNED")
        items.push({ contractId: contract.id, role: isOwner ? "owner" : "tenant", signingUrl: mine.signingUrl })
    } catch {
      // Fail closed: provider unavailable never exposes another person's URL.
    }
  }
  return response({ ok: true, items })
}
