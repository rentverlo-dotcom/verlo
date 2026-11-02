import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createCaucionContractPdf } from "./contract-pdf"

type Outcome = { status: "not_applicable" | "disabled" | "already_published" | "published" | "failed"; detail?: string }

export async function autoPublishPowerMarketReview(
 db: SupabaseClient,
 params: { tenantLeadId: string; contractId: string; contractContent: string }
): Promise<Outcome> {
  // Do not touch contracts or notifications for users without a submitted caucion.
  const { data: applications, error: lookupError } = await db.from("caucion_applications")
    .select("id,status").eq("tenant_lead_id", params.tenantLeadId)
    .in("status", ["under_review", "prequalified", "alternative_offered"])
    .order("created_at", { ascending: false }).limit(2)
  if (lookupError) return { status: "failed", detail: "application_lookup_failed" }
  if (!applications?.length) return { status: "not_applicable" }
  // Avoid choosing an unrelated or ambiguous application.
  if (applications.length !== 1) return { status: "failed", detail: "ambiguous_applications" }
  if (process.env.POWERMARKET_CONTRACT_REVIEW_AUTO_PUBLISH_ENABLED !== "true")
    return { status: "disabled" }

  const applicationId = applications[0].id as string
  const { data: last, error: lastError } = await db.from("caucion_contract_reviews")
    .select("version,contract_content_sha256")
    .eq("application_id", applicationId).eq("lead_contract_id", params.contractId)
    .order("version", { ascending: false }).limit(1)
  if (lastError) return { status: "failed", detail: "review_lookup_failed" }
  const contentHash = createHash("sha256").update(params.contractContent, "utf8").digest("hex")
  if (last?.[0]?.contract_content_sha256 === contentHash) return { status: "already_published" }

  const version = (last?.[0]?.version ?? 0) + 1
  const pdf = createCaucionContractPdf({
    documentText: params.contractContent, version, sha256: contentHash, contractId: params.contractId
  })
  if (pdf.length > 50 * 1024 * 1024) return { status: "failed", detail: "pdf_too_large" }
  const pdfHash = createHash("sha256").update(pdf).digest("hex")
  const key = `powermarket/contracts/${applicationId}/${params.contractId}/v${version}.pdf`
  const { data: bucket, error: bucketError } = await db.storage.getBucket("tenant-documents")
  if (bucketError || !bucket || bucket.public) return { status: "failed", detail: "private_bucket_unavailable" }
  const { error: uploadError } = await db.storage.from("tenant-documents")
    .upload(key, pdf, { upsert: false, contentType: "application/pdf" })
  if (uploadError) return { status: "failed", detail: "upload_failed" }

  const { error: publicationError } = await db.rpc("caucion_publish_contract_review", {
    p_application_id: applicationId,
    p_contract_id: params.contractId,
    p_content_sha256: contentHash,
    p_pdf_sha256: pdfHash,
    p_private_key: key,
    p_version: version
  })
  if (publicationError) return { status: "failed", detail: "publication_failed" }
  return { status: "published" }
}
