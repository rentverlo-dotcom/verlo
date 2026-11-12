import "server-only"
import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { makeIdentikElectronicClient } from "@/lib/identik/electronic-v2"
import { assertIdentikPdfDownload } from "@/lib/identik/signed-pdf-integrity"

export const IDENTIK_ARTIFACT_BUCKET = "identik-contracts"
export const IDENTIK_ARTIFACT_LIMIT = 50 * 1024 * 1024

type ArtifactRow = {
  id: string
  lead_contract_id: string
  identik_document_id: number
  status: string
  signed_pdf_storage_key: string | null
  certificate_storage_key: string | null
}
type Kind = "signed_pdf" | "certificate"

export function identikArtifactKey(row: Pick<ArtifactRow, "lead_contract_id" | "identik_document_id">, kind: Kind) {
  if (!/^[0-9a-f-]{36}$/i.test(row.lead_contract_id) ||
    !Number.isSafeInteger(Number(row.identik_document_id)) ||
    Number(row.identik_document_id) <= 0) throw new Error("INVALID_DOCUMENT_ID")
  return `${row.lead_contract_id}/${row.identik_document_id}/${kind === "signed_pdf" ? "signed.pdf" : "certificate.bin"}`
}

function assertArtifact(bytes: Uint8Array, kind: Kind) {
  if (bytes.byteLength < 1 || bytes.byteLength > IDENTIK_ARTIFACT_LIMIT)
    throw new Error("ARTIFACT_INVALID_SIZE")
  if (kind === "signed_pdf") assertIdentikPdfDownload(bytes)
}

/**
 * Provider-confirmed archive for a completed contract. Every object has a
 * deterministic key; overwrite is forbidden. A database write only happens
 * after storage upload completes. Reentry repairs partial archival safely.
 *
 * This is invoked only by authenticated server-side jobs, never from clients.
 */
export async function archiveIdentikArtifacts(
  db: SupabaseClient,
  row: ArtifactRow,
  baseUrl: string,
  makeClient: typeof makeIdentikElectronicClient = makeIdentikElectronicClient,
): Promise<{ pdf: boolean; certificate: boolean }> {
  if (row.status !== "completed") throw new Error("DOCUMENT_NOT_COMPLETED")
  const client = makeClient({ baseUrl })
  const provider = await client.getDocument(Number(row.identik_document_id))
  if (provider.id !== undefined && Number(provider.id) !== Number(row.identik_document_id))
    throw new Error("PROVIDER_ID_MISMATCH")
  if (String(provider.status).toUpperCase() !== "COMPLETED")
    throw new Error("PROVIDER_NOT_COMPLETED")

  const states = { pdf: Boolean(row.signed_pdf_storage_key),
    certificate: Boolean(row.certificate_storage_key) }
  for (const kind of ["signed_pdf", "certificate"] as const) {
    const column = kind === "signed_pdf" ? "signed_pdf_storage_key" : "certificate_storage_key"
    if (row[column]) continue
    const bytes = kind === "signed_pdf"
      ? await client.downloadSignedPdf(Number(row.identik_document_id))
      : await client.downloadCertificate(Number(row.identik_document_id))
    assertArtifact(bytes, kind)
    const path = identikArtifactKey(row, kind)
    const contentType = kind === "signed_pdf" ? "application/pdf" : "application/octet-stream"
    const { error: uploadError } = await db.storage.from(IDENTIK_ARTIFACT_BUCKET)
      .upload(path, Buffer.from(bytes), { contentType, upsert: false })
    if (uploadError) {
      // A concurrent worker may have uploaded the immutable object.
      // Never trust a conflict blindly: compare the existing bytes.
      if (String(uploadError.message).toLowerCase().includes("already exists") ||
          String((uploadError as { statusCode?: string }).statusCode) === "409") {
        const { data: stored, error: readError } = await db.storage.from(IDENTIK_ARTIFACT_BUCKET).download(path)
        if (readError || !stored) throw new Error("ARTIFACT_CONFLICT_UNVERIFIED")
        const existing = new Uint8Array(await stored.arrayBuffer())
        const hash = (value: Uint8Array) => createHash("sha256").update(value).digest("hex")
        if (hash(existing) !== hash(bytes)) throw new Error("ARTIFACT_CONFLICT_DIFFERENT_BYTES")
      } else throw new Error("ARTIFACT_STORAGE_FAILED")
    }
    const { data: saved, error: saveError } = await db.from("identik_electronic_documents")
      .update({ [column]: path, updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("status", "completed").is(column, null)
      .select("id").maybeSingle()
    if (saveError) throw new Error("ARTIFACT_DB_UPDATE_FAILED")
    if (!saved) {
      const { data: latest, error: latestError } = await db.from("identik_electronic_documents")
        .select(column).eq("id", row.id).maybeSingle()
      if (latestError || !latest || latest[column] !== path) throw new Error("ARTIFACT_DB_CONFLICT")
    }
    if (kind === "signed_pdf") states.pdf = true
    else states.certificate = true
  }
  return states
}
