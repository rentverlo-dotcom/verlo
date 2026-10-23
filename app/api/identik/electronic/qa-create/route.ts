import { NextRequest, NextResponse } from "next/server"
import { makeIdentikElectronicClient, IdentikApiError, type IdentikCreatePayload } from "@/lib/identik/electronic-v2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * QA ONLY. This route intentionally does NOT touch lead_contracts or Supabase
 * and NEVER distributes invitations. It is for verifying the v2 payload format
 * with one disposable PDF and two tester recipients in sandbox.
 *
 * A separate, authorized production workflow must reserve, persist, and
 * distribute a final contract; do not use this route for real signings.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  // Do not enable merely to check the request. Only enable for a deliberate
  // single sandbox credit-consuming test.
  if (process.env.IDENTIK_ENABLE_CREATE !== "true") {
    return NextResponse.json({
      ok: false,
      enabled: false,
      error: "QA document creation disabled",
    }, { status: 409 })
  }
  const apiBase = process.env.IDENTIK_ELECTRONIC_API_BASE_URL ||
    "https://sandbox-electronica.identik.me/api/v2"
  if (apiBase !== "https://sandbox-electronica.identik.me/api/v2") {
    return NextResponse.json({ ok: false, error: "Sandbox only" }, { status: 403 })
  }

  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return NextResponse.json({ ok: false, error: "Expected multipart/form-data" }, { status: 415 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 })
  }

  const pdf = form.get("file")
  const payloadRaw = form.get("payload")
  if (!(pdf instanceof File) || pdf.type !== "application/pdf" ||
      pdf.size < 100 || pdf.size > 2 * 1024 * 1024 ||
      typeof payloadRaw !== "string" || payloadRaw.length > 25000) {
    return NextResponse.json({ ok: false, error: "Expected small PDF and JSON payload" }, { status: 400 })
  }

  let payload: IdentikCreatePayload
  try {
    payload = JSON.parse(payloadRaw) as IdentikCreatePayload
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload JSON" }, { status: 400 })
  }
  if (!payload || !Array.isArray(payload.recipients) || payload.recipients.length !== 2) {
    return NextResponse.json({ ok: false, error: "Exactly two recipients required" }, { status: 400 })
  }
  if (form.get("confirm") !== "CREATE_ONE_SANDBOX_DOCUMENT") {
    return NextResponse.json({ ok: false, error: "Explicit QA confirmation required" }, { status: 400 })
  }

  try {
    const client = makeIdentikElectronicClient()
    const result = await client.createDocument(pdf, payload, "verlo-qa.pdf")
    // No distribution, no signing URLs, no sensitive payload.
    return NextResponse.json({
      ok: true,
      sandbox: true,
      documentId: result.id,
      distributed: false,
      warning: "QA document is not persisted in VERLO; record documentId privately.",
    }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof IdentikApiError) {
      return NextResponse.json({
        ok: false,
        error: "Identik rejected the request",
        providerStatus: error.status,
        ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
      }, { status: 502 })
    }
    return NextResponse.json({
      ok: false,
      error: "Unknown provider outcome. Check Identik dashboard before retrying to avoid duplicates.",
    }, { status: 502 })
  }
}
