import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { makeIdentikElectronicClient } from "@/lib/identik/electronic-v2"
import { IDENTIK_ARTIFACT_BUCKET } from "@/lib/identik/archive-artifacts"
import { assertIdentikPdfDownload } from "@/lib/identik/signed-pdf-integrity"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QA_URL = "https://anptswspguyotnasoacq.supabase.co"
const SANDBOX = "https://sandbox-electronica.identik.me/api/v2"

function fail(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, {
    status, headers: { "Cache-Control": "no-store" },
  })
}

// QA-only authenticated proof of retrieval. Never exposes provider signing URLs,
// accepts a document ID from callers, or accesses any production database.
export async function POST(request: Request) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== "qa/verlo-e2e" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX) !== SANDBOX) {
    return fail(503, "QA_ONLY")
  }
  if (Number(request.headers.get("content-length") || 0) > 4096)
    return fail(413, "Solicitud demasiado grande")

  let body: { token?: unknown; kind?: unknown }
  try { body = await request.json() } catch { return fail(400, "Solicitud inválida") }
  const token = typeof body?.token === "string" ? body.token.trim() : ""
  const kind = body?.kind
  if (!token || token.length > 512 || (kind !== "signed_pdf" && kind !== "certificate"))
    return fail(400, "Solicitud inválida")

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return fail(503, "Servicio no disponible")
  const db = createClient(QA_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: access, error: accessError } = await db
    .from("lead_contract_access_tokens")
    .select("contract_id,lead_id,role,revoked_at,expires_at")
    .eq("token", token).maybeSingle()
  if (accessError) return fail(503, "No se pudo validar acceso")
  if (!access || !["owner", "tenant"].includes(access.role))
    return fail(404, "Documento no disponible")
  if (access.revoked_at ||
      (access.expires_at && new Date(access.expires_at).getTime() <= Date.now()))
    return fail(403, "Acceso vencido")

  const { data: contract, error: contractError } = await db
    .from("lead_contracts")
    .select("id,tenant_lead_id,owner_lead_id,status")
    .eq("id", access.contract_id).maybeSingle()
  if (contractError) return fail(503, "No se pudo verificar contrato")
  if (!contract || contract.status !== "agreed" ||
      (access.role === "owner" ? contract.owner_lead_id : contract.tenant_lead_id) !== access.lead_id)
    return fail(403, "Sin acceso al documento")

  const { data: rows, error: documentError } = await db
    .from("identik_electronic_documents")
    .select("identik_document_id,status,signed_pdf_storage_key,certificate_storage_key")
    .eq("lead_contract_id", contract.id).eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
  if (documentError) return fail(503, "No se pudo verificar firma")
  const id = Number(rows?.[0]?.identik_document_id)
  if (!Number.isSafeInteger(id) || id <= 0)
    return fail(409, "El documento todavía no está firmado")

  try {
    const storedKey = kind === "signed_pdf"
      ? rows?.[0]?.signed_pdf_storage_key : rows?.[0]?.certificate_storage_key
    let bytes: Uint8Array
    if (storedKey) {
      // Private first: signed artifacts remain accessible if Identik is down.
      // Keys originate only from the completed document DB record, not user input.
      const { data: archived, error: archivedError } = await db.storage
        .from(IDENTIK_ARTIFACT_BUCKET).download(storedKey)
      if (archivedError || !archived) return fail(503, "Documento archivado temporalmente no disponible")
      bytes = new Uint8Array(await archived.arrayBuffer())
      if (kind === "signed_pdf") assertIdentikPdfDownload(bytes)
    } else {
      const client = makeIdentikElectronicClient({ baseUrl: SANDBOX })
      bytes = kind === "signed_pdf"
        ? await client.downloadSignedPdf(id)
        : await client.downloadCertificate(id)
    }
    if (!bytes.byteLength || bytes.byteLength > 50 * 1024 * 1024)
      return fail(502, "Documento incompleto")
    const suffix = kind === "signed_pdf" ? "firmado.pdf" : "constancia.bin"
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": kind === "signed_pdf" ? "application/pdf" : "application/octet-stream",
        "Content-Disposition": `attachment; filename="verlo-${contract.id}-${suffix}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return fail(502, "No se pudo descargar el documento desde Identik")
  }
}
