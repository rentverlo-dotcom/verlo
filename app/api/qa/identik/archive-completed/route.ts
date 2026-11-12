import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validQaWorkflowToken } from "@/lib/qa/verify-workflow-token"
import { archiveIdentikArtifacts, IDENTIK_ARTIFACT_BUCKET } from "@/lib/identik/archive-artifacts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const QA_URL = "https://anptswspguyotnasoacq.supabase.co"
const SANDBOX = "https://sandbox-electronica.identik.me/api/v2"
const BATCH_LIMIT = 2

export async function POST(request: NextRequest) {
  const json = (status: number, value: Record<string, unknown>) =>
    NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } })
  if (process.env.VERCEL_GIT_COMMIT_REF !== "qa/verlo-e2e" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA_URL ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX) !== SANDBOX)
    return json(503, { ok: false, error: "QA_ONLY" })
  const auth = request.headers.get("authorization") || ""
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ""
  if (!sha || !auth.startsWith("Bearer ") ||
      !(await validQaWorkflowToken(auth.slice(7), sha)))
    return json(403, { ok: false, error: "QA_OIDC_REQUIRED" })
  if (request.headers.get("x-qa-intent") !== "archive-signed-documents")
    return json(400, { ok: false, error: "EXPLICIT_INTENT_REQUIRED" })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.IDENTIK_ELECTRONIC_API_TOKEN)
    return json(503, { ok: false, error: "QA_CONFIGURATION_MISSING" })

  const db = createClient(QA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: bucket, error: bucketError } = await db.storage.getBucket(IDENTIK_ARTIFACT_BUCKET)
  if (bucketError || !bucket || bucket.public)
    return json(503, { ok: false, error: "PRIVATE_ARCHIVE_BUCKET_UNAVAILABLE" })
  const { data: documents, error: queryError } = await db
    .from("identik_electronic_documents")
    .select("id,lead_contract_id,identik_document_id,status,signed_pdf_storage_key,certificate_storage_key")
    .eq("status", "completed")
    .not("identik_document_id", "is", null)
    .or("signed_pdf_storage_key.is.null,certificate_storage_key.is.null")
    .order("completed_at", { ascending: true })
    .limit(BATCH_LIMIT + 1)
  if (queryError) return json(503, { ok: false, error: "ARCHIVE_SELECTION_FAILED" })

  let completed = 0
  let failed = 0
  for (const document of (documents || []).slice(0, BATCH_LIMIT)) {
    try {
      const archived = await archiveIdentikArtifacts(db, document, SANDBOX)
      if (!archived.pdf || !archived.certificate) throw new Error("ARCHIVE_INCOMPLETE")
      completed++
    } catch {
      failed++
    }
  }
  return json(failed ? 503 : 200, { ok: failed === 0, qaOnly: true, noExternalDelivery: true,
    selected: Math.min(documents?.length || 0, BATCH_LIMIT),
    completed, failed, hasMore: (documents?.length || 0) > BATCH_LIMIT })
}
