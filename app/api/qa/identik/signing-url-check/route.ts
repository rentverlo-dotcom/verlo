import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validQaWorkflowToken } from "@/lib/qa/verify-workflow-token"
import { makeIdentikElectronicClient } from "@/lib/identik/electronic-v2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const QA = "https://anptswspguyotnasoacq.supabase.co"
const SANDBOX = "https://sandbox-electronica.identik.me/api/v2"

function result(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

// Diagnostic only. No document generation, distribution, email, signing URLs,
// emails or personal data ever leave this endpoint. Only GitHub's exact QA
// workflow+SHA is authenticated to run this provider-read probe.
export async function GET(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== "qa/verlo-e2e" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== QA ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL || SANDBOX) !== SANDBOX)
    return result({ ok: false, error: "QA_ONLY" }, 503)
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ""
  const authorization = request.headers.get("authorization") || ""
  if (!sha || !authorization.startsWith("Bearer ") ||
      !await validQaWorkflowToken(authorization.slice(7), sha))
    return result({ ok: false, error: "QA_OIDC_REQUIRED" }, 403)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.IDENTIK_ELECTRONIC_API_TOKEN)
    return result({ ok: false, error: "QA_CONFIGURATION_MISSING" }, 503)

  const db = createClient(QA, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: docs, error } = await db.from("identik_electronic_documents")
    .select("identik_document_id,owner_email,tenant_email")
    .in("status", ["sent", "pending"])
    .not("identik_document_id", "is", null)
    .order("created_at", { ascending: false }).limit(1)
  if (error) return result({ ok: false, error: "QA_DOCUMENT_QUERY_FAILED" }, 503)
  const doc = docs?.[0]
  if (!doc?.identik_document_id) return result({
    ok: true, qaOnly: true, readOnly: true, noPendingSandboxDocument: true,
  })
  try {
    const provider = await makeIdentikElectronicClient({ baseUrl: SANDBOX })
      .getDocument(Number(doc.identik_document_id), true)
    const recipients = Array.isArray(provider.recipients) ? provider.recipients : []
    const emails = [doc.owner_email, doc.tenant_email].map(s => String(s || "").trim().toLowerCase())
    const signers = recipients.filter(item =>
      !!item && typeof item === "object" &&
      emails.includes(String((item as Record<string, unknown>).email || "").trim().toLowerCase()))
    const ownUrls = signers.filter(item => {
      const url = (item as Record<string, unknown>).signingUrl
      if (typeof url !== "string") return false
      try {
        const parsed = new URL(url)
        return parsed.protocol === "https:" && !parsed.username && !parsed.password &&
          (parsed.hostname === "identik.me" || parsed.hostname.endsWith(".identik.me"))
      } catch { return false }
    })
    return result({
      ok: true, qaOnly: true, readOnly: true, providerRead: true,
      recipientsMatched: signers.length, validSigningUrls: ownUrls.length,
      personalSigningUrlPresent: ownUrls.length > 0,
      // No identifiers or signing URLs in responses or logs.
    })
  } catch {
    return result({ ok: false, qaOnly: true, error: "PROVIDER_READ_FAILED" }, 503)
  }
}
