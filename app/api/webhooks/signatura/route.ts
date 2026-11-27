import { NextRequest, NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import {
  parseSignaturaNotification,
  verifySignaturaWebhook,
} from "@/lib/signatura/client"

/**
 * Signatura QA webhook receiver.
 *
 * This endpoint is NOT the completion/signing state machine.
 * It only authenticates and durably stores a minimal notification. A future
 * reconciler must query Signatura and bind document IDs to existing VERLO
 * records before it can mark identity verified or contracts signed.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_WEBHOOK_BYTES = 64 * 1024

function response(ok: boolean, status: number, code: string) {
  return NextResponse.json({ ok, code }, { status, headers: { "Cache-Control": "no-store" } })
}

function qaOnly() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  let qaDatabase = false
  try {
    qaDatabase = new URL(url).hostname === "anptswspguyotnasoacq.supabase.co"
  } catch {
    qaDatabase = false
  }
  return process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/signatura-qa-integration" &&
    process.env.SIGNATURA_WEBHOOK_QA_ENABLED === "true" && qaDatabase
}

export async function POST(request: NextRequest) {
  if (!qaOnly()) return response(false, 404, "not_found")

  // Content-Length is only a hint; verify the actual byte count as well.
  const declaredLength = Number(request.headers.get("content-length") || "0")
  if (declaredLength > MAX_WEBHOOK_BYTES) return response(false, 413, "payload_too_large")

  let bytes: Buffer
  try {
    bytes = Buffer.from(await request.arrayBuffer())
  } catch {
    return response(false, 400, "invalid_body")
  }
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_WEBHOOK_BYTES) {
    return response(false, 413, "invalid_payload_size")
  }

  if (!verifySignaturaWebhook(
    bytes,
    request.headers.get("x-signature-sha256"),
  )) return response(false, 401, "invalid_signature")

  let event: ReturnType<typeof parseSignaturaNotification>
  try {
    event = parseSignaturaNotification(JSON.parse(bytes.toString("utf8")))
  } catch {
    return response(false, 400, "invalid_notification")
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return response(false, 503, "storage_unavailable")

  // Payload is intentionally not stored: it may contain biometric/PII.
  // SHA-256 of authenticated bytes gives retry idempotency without raw data.
  const fingerprint = createHash("sha256").update(bytes).digest("hex")
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await supabase
    .from("signatura_webhook_events")
    .upsert({
      fingerprint,
      document_id: event.document_id,
      signature_id: event.signature_id || null,
      notification_action: event.notification_action,
      new_status: event.new_status || null,
    }, { onConflict: "fingerprint", ignoreDuplicates: true })

  if (error) {
    // Return retriable 503. Do not acknowledge messages lost before durable storage.
    console.error("Signatura QA webhook persistence failed", { code: error.code || "unknown" })
    return response(false, 503, "storage_unavailable")
  }

  return response(true, 200, "accepted")
}

export async function GET() {
  // Never disclose verification/persistence configuration.
  return response(false, 405, "method_not_allowed")
}
