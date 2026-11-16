import { NextRequest, NextResponse } from "next/server"
import { createHash, randomUUID } from "node:crypto"
import { createCaucionContractPdf } from "@/lib/powermarket/contract-pdf"
import { identikSignatureField } from "@/lib/identik/signature-geometry"
import { enqueueVerloEmailSafely } from "@/lib/notifications/verlo-email-outbox"
import { sendPushToLead } from "@/lib/push"
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
  const combined = [...(ownerDocs.data || []), ...(tenantDocs.data || [])]
  const docs = combined.filter((doc, index) =>
    combined.findIndex(item => item.id === doc.id) === index)

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
  // Discover agreed contracts owned by the verified email. The readiness
  // check enforces bilateral agreement, payment and PowerMarket approval.
  const { data: ownLeads, error: ownError } = await db.from("lead_intake")
    .select("id").ilike("email", email).limit(100)
  if (ownError) return response({ error: "No pudimos verificar tus contratos" }, 503)
  const leadIds = (ownLeads || []).map(lead => lead.id)
  const ready: Array<{ contractId: string }> = []
  if (leadIds.length > 0) {
    const [ownerContracts, tenantContracts] = await Promise.all([
      db.from("lead_contracts").select("id").in("owner_lead_id", leadIds).eq("status", "agreed").limit(30),
      db.from("lead_contracts").select("id").in("tenant_lead_id", leadIds).eq("status", "agreed").limit(30),
    ])
    if (ownerContracts.error || tenantContracts.error)
      return response({ error: "No pudimos verificar tus contratos" }, 503)
    const contracts = [...(ownerContracts.data || []), ...(tenantContracts.data || [])]
    for (const contract of contracts.filter((v,i,a)=>a.findIndex(other=>other.id===v.id)===i)) {
      const { data: existing } = await db.from("identik_electronic_documents")
        .select("id").eq("lead_contract_id", contract.id).maybeSingle()
      if (existing) continue
      const gate = await checkTraditionalSigningReadiness(db, contract.id)
      if (gate.allowed) ready.push({ contractId: contract.id })
    }
  }
  return response({ ok: true, items, ready })
}


// Explicit user action. Safely reserve BEFORE calling Identik: provider
// requests are never silently retried after ambiguous responses.
export async function POST(request: NextRequest) {
  const isQA = process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "qa/verlo-e2e" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === "https://anptswspguyotnasoacq.supabase.co" &&
    (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || "https://sandbox-electronica.identik.me/api/v2") === "https://sandbox-electronica.identik.me/api/v2"
  const isProd = process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_GIT_COMMIT_REF === "main" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === "https://bmgrpcqrdvwculrisasi.supabase.co" &&
    process.env.IDENTIK_ELECTRONIC_API_BASE_URL === "https://electronica.identik.me/api/v2" &&
    process.env.IDENTIK_BIOMETRIC_SIGNING_CONFIRMED === "true"
  if (!isQA && !isProd) return response({ error: "Firma no habilitada en este entorno" }, 503)
  const bearer = request.headers.get("authorization") || ""
  if (!bearer.startsWith("Bearer ")) return response({ error: "No autorizado" }, 401)
  const { contractId } = await request.json().catch(() => ({}))
  if (typeof contractId !== "string" ||
      !/^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(contractId))
    return response({ error: "Contrato inválido" }, 400)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!anon || !service) return response({ error: "Configuración ausente" }, 503)
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: identity, error: userError } = await auth.auth.getUser(bearer.slice(7).trim())
  const email = identity.user?.email?.trim().toLowerCase()
  if (userError || !email || !identity.user?.email_confirmed_at)
    return response({ error: "Email verificado requerido" }, 403)

  const { data: contract, error: contractError } = await db.from("lead_contracts")
    .select("id,content,owner_lead_id,tenant_lead_id")
    .eq("id", contractId).maybeSingle()
  if (contractError || !contract || typeof contract.content !== "string")
    return response({ error: "Contrato no disponible" }, 404)
  const { data: participants, error: leadError } = await db.from("lead_intake")
    .select("id,email,full_name")
    .in("id", [contract.owner_lead_id, contract.tenant_lead_id])
  if (leadError || participants?.length !== 2)
    return response({ error: "Partes no disponibles" }, 409)
  const owner = participants.find(p => p.id === contract.owner_lead_id)
  const tenant = participants.find(p => p.id === contract.tenant_lead_id)
  if (!owner?.email || !tenant?.email || ![owner.email, tenant.email].some(e => e.trim().toLowerCase() === email))
    return response({ error: "No pertenecés al contrato" }, 403)
  const gate = await checkTraditionalSigningReadiness(db, contractId)
  if (!gate.allowed) return response({ error: "El contrato todavía no está habilitado para firmar", reason: gate.reason }, 409)

  const { data: prior, error: priorError } = await db.from("identik_electronic_documents")
    .select("id,status").eq("lead_contract_id", contractId).maybeSingle()
  if (priorError) return response({ error: "No pudimos verificar el estado de firma" }, 503)
  if (prior) return response({ ok: true, alreadyPrepared: true })

  const pdfHash = createHash("sha256").update(contract.content, "utf8").digest("hex")
  const pdf = createCaucionContractPdf({
    documentText: contract.content, version: 1, sha256: pdfHash, contractId,
  })
  const pages = (pdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length
  if (pdf.length < 100 || pdf.length > 50 * 1024 * 1024 ||
      !pdf.subarray(0, 8).toString("ascii").startsWith("%PDF-1.") ||
      pages < 1 || pages > 80)
    return response({ error: "PDF incompatible con firma" }, 409)

  const externalId = "verlo-" + (isQA ? "qa-" : "prod-") + contractId + "-" + randomUUID()
  const { data: reservation, error: reserveError } = await db.from("identik_electronic_documents")
    .insert({
      lead_contract_id: contractId, external_id: externalId,
      owner_email: owner.email.trim().toLowerCase(), tenant_email: tenant.email.trim().toLowerCase(),
      status: "creating",
    }).select("id").single()
  if (reserveError || !reservation)
    return response({ error: "Otra sesión ya está siendo preparada. Actualizá Mi VERLO." }, 409)

  try {
    const client = makeIdentikElectronicClient()
    const recipients = [
      { email: owner.email.trim().toLowerCase(), name: (owner.full_name || "Propietario").slice(0,200),
        role: "SIGNER", signingOrder: 1, fields: [identikSignatureField("owner", pages)],
        requireBiometricId: isProd },
      { email: tenant.email.trim().toLowerCase(), name: (tenant.full_name || "Inquilino").slice(0,200),
        role: "SIGNER", signingOrder: 2, fields: [identikSignatureField("tenant", pages)],
        requireBiometricId: isProd },
    ]
    const created = await client.createDocument(
      new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
      {
        title: isQA ? "VERLO QA - Contrato sin validez comercial" : "VERLO - Contrato de alquiler",
        externalId, includeSigningUrls: true, recipients,
        meta: {
          distributionMethod: "NONE", signingOrder: "SEQUENTIAL", language: "es",
          requireBiometricId: isProd, sendViaWhatsapp: false, sendViaSms: false,
          redirectUrl: isQA ? "https://verlopunto0-git-qa-verlo-e2e-verlos-projects-b9e9c595.vercel.app/mi-verlo" : "https://verlo.lat/mi-verlo",
        },
      },
      "contrato-verlo.pdf",
    )
    const { error: savedError } = await db.from("identik_electronic_documents")
      .update({ identik_document_id: created.id, status: "created", updated_at: new Date().toISOString() })
      .eq("id", reservation.id).eq("status", "creating")
    if (savedError) return response({ error: "Identik recibió el contrato; se requiere conciliación", manualRecoveryRequired: true }, 503)

    await client.distributeDocument({
      documentId: created.id, includeSigningUrls: true,
      meta: {
        distributionMethod: "NONE", language: "es",
        emailSettings: {
          recipientSigningRequest: false, recipientRemoved: false, recipientSigned: false,
          documentPending: false, documentCompleted: false, documentDeleted: false,
          ownerDocumentCompleted: false, ownerRecipientExpired: false, ownerDocumentCreated: false,
        },
        reminderSettings: { sendAfter: { disabled: true }, repeatEvery: { disabled: true } },
      },
    })
    const { error: distributedError } = await db.from("identik_electronic_documents")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", reservation.id).eq("status", "created")
    if (distributedError) return response({ error: "Identik recibió el contrato; se requiere conciliación", manualRecoveryRequired: true }, 503)
    // Communications are owned by VERLO, never Identik. QA captures only
    // synthetic intents and suppresses external Push/email delivery.
    const portal = "https://verlo.lat/mi-verlo"
    const notices = [
      { leadId: contract.owner_lead_id, email: owner.email, role: "owner" as const },
      { leadId: contract.tenant_lead_id, email: tenant.email, role: "tenant" as const },
    ]
    await Promise.allSettled(notices.map(async (notice) => {
      const eventKey = "signature_ready:" + notice.role + ":" + contractId
      await enqueueVerloEmailSafely({
        area: "tradicionales", eventType: "signature_ready",
        eventKey, recipientEmail: notice.email,
        recipientRole: notice.role, url: portal,
        title: "Tu contrato está listo para firmar",
        body: "Ingresá a Mi VERLO y pulsá Firmar contrato para completar tu firma electrónica.",
      })
      // Push is best-effort, and a missing device must never block signing.
      try {
        await sendPushToLead(notice.leadId, {
          title: "Tu contrato está listo para firmar",
          body: "Ingresá a Mi VERLO para completar tu firma electrónica.",
          url: "/mi-verlo",
        })
      } catch { /* notification delivery is separate from contract creation */ }
    }))
    return response({ ok: true, prepared: true })
  } catch {
    // Never retry a provider call automatically after ambiguous failure.
    return response({ error: "No se pudo confirmar la preparación de la firma. Se requiere revisión antes de reintentar.", manualRecoveryRequired: true }, 502)
  }
}
