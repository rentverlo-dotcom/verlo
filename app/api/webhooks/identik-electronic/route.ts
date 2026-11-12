import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { makeIdentikElectronicClient } from "@/lib/identik/electronic-v2"
import { identikCanAdvance, identikProviderStatus } from "@/lib/identik/reconciliation-status"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type JSONObject = Record<string, unknown>
function asObject(value: unknown): JSONObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JSONObject : null
}
function numericId(value: unknown): number | null {
  const n = typeof value === "number" ? value :
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN
  return Number.isSafeInteger(n) && n > 0 ? n : null
}
function secureEqual(actual: string | null, expected: string): boolean {
  if (!actual || !expected) return false
  const a = Buffer.from(actual)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_GIT_COMMIT_REF !== 'qa/verlo-e2e' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://anptswspguyotnasoacq.supabase.co' ||
      (process.env.IDENTIK_ELECTRONIC_API_BASE_URL &&
       process.env.IDENTIK_ELECTRONIC_API_BASE_URL !== 'https://sandbox-electronica.identik.me/api/v2')) {
    return NextResponse.json({ ok: false, error: 'QA_ONLY' }, { status: 503 })
  }
  const secret = process.env.IDENTIK_ELECTRONIC_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 })
  if (!secureEqual(request.headers.get("x-identik-secret"), secret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const raw = await request.text()
  if (raw.length > 128 * 1024) return NextResponse.json({ ok: false }, { status: 413 })
  let payload: JSONObject | null = null
  try { payload = asObject(JSON.parse(raw)) } catch { /* reject invalid JSON */ }
  if (!payload) return NextResponse.json({ ok: false }, { status: 400 })

  // Identik event schemas vary by version. Only process IDs explicitly within
  // a document object or top-level documentId. Never use envelopeId as document ID.
  const doc = asObject(payload.document)
  const documentId = numericId(doc?.id) ?? numericId(payload.documentId)
  if (!documentId) return NextResponse.json({ ok: false }, { status: 422 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ ok: false }, { status: 503 })
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: local, error: lookupError } = await db
    .from("identik_electronic_documents")
    .select("id, status, updated_at")
    .eq("identik_document_id", documentId)
    .maybeSingle()
  if (lookupError) return NextResponse.json({ ok: false }, { status: 503 })
  // Unknown documents must never mutate local contracts.
  if (!local) return NextResponse.json({ ok: true, ignored: true })

  const eventType = String(payload.type ?? payload.event ?? "unknown").slice(0, 100)
  const dedupeKey = createHash("sha256").update(raw).digest("hex")
  const { error: eventError } = await db
    .from("identik_electronic_events")
    .insert({ document_id: local.id, dedupe_key: dedupeKey, event_type: eventType,
      provider_status: String(doc?.status ?? "").slice(0, 100) || null })
  // A previous attempt may have recorded the event before Identik was
  // reachable. A duplicate MUST retry provider reconciliation, not exit early.
  const duplicate = eventError?.code === "23505"
  if (eventError && !duplicate) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  // Verify the CURRENT provider state rather than trusting a stale webhook.
  // An API outage returns a retryable error; persisted event remains auditable.
  try {
    const provider = await makeIdentikElectronicClient().getDocument(documentId)
    if (provider.id !== undefined && Number(provider.id) !== documentId) {
      return NextResponse.json({ ok: false, recorded: true, duplicate, retryable: true }, { status: 502 })
    }
    const status = identikProviderStatus(provider.status)
    if (!status) return NextResponse.json({ ok: false, recorded: true, duplicate, retryable: true }, { status: 503 })

    // Provider polling and webhook share one monotonic state machine.
    // Never rewrite an already completed/terminal document or move backward.
    if (!identikCanAdvance(local.status, status)) {
      return NextResponse.json({ ok: true, recorded: true, duplicate, unchanged: true })
    }
    const now = new Date().toISOString()
    const { data: updated, error: updateError } = await db
      .from("identik_electronic_documents")
      .update({
        status,
        last_checked_at: now,
        last_error_code: null,
        updated_at: now,
        ...(status === "completed" ? { completed_at: now } : {}),
      })
      .eq("id", local.id)
      .eq("status", local.status)
      .eq("updated_at", local.updated_at)
      .select("id")
      .maybeSingle()
    if (updateError) return NextResponse.json({ ok: false, recorded: true, duplicate, retryable: true }, { status: 503 })
    if (!updated) {
      // Another worker won the compare-and-swap: let the provider retry,
      // or polling perform a fresh read. Never overwrite its result.
      return NextResponse.json({ ok: false, recorded: true, duplicate, retryable: true }, { status: 503 })
    }
    return NextResponse.json({ ok: true, recorded: true, duplicate, status })
  } catch {
    // Keep the event and request a retry; duplicate retries resync against Identik.
    // Do not leak signing URLs or provider error details.
    return NextResponse.json(
      { ok: false, recorded: true, duplicate, synced: false, retryable: true },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
