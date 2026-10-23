import { createHash, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { makeIdentikElectronicClient } from "@/lib/identik/electronic-v2"

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
function mappedStatus(value: unknown):
  "created" | "sent" | "pending" | "completed" | "rejected" | "cancelled" | "expired" | null {
  const s = String(value ?? "").toUpperCase()
  if (s === "COMPLETED") return "completed"
  if (s === "REJECTED" || s === "DECLINED") return "rejected"
  if (s === "CANCELLED" || s === "CANCELED") return "cancelled"
  if (s === "EXPIRED") return "expired"
  if (s === "SENT") return "sent"
  if (s === "PENDING" || s === "IN_PROGRESS") return "pending"
  if (s === "CREATED" || s === "DRAFT") return "created"
  return null
}

export async function POST(request: NextRequest) {
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
    .select("id, status")
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
  if (eventError) {
    if (eventError.code === "23505") return NextResponse.json({ ok: true, duplicate: true })
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  // Verify the CURRENT provider state rather than trusting a stale webhook.
  // An API outage returns a retryable error; persisted event remains auditable.
  try {
    const provider = await makeIdentikElectronicClient().getDocument(documentId)
    const status = mappedStatus(provider.status)
    if (!status) return NextResponse.json({ ok: true, recorded: true, synced: false })

    // Do not regress terminal states if an older event arrives late.
    const terminal = ["completed", "rejected", "cancelled", "expired"]
    if (terminal.includes(local.status) && local.status !== status) {
      return NextResponse.json({ ok: true, recorded: true, unchanged: true })
    }
    const now = new Date().toISOString()
    const { error: updateError } = await db
      .from("identik_electronic_documents")
      .update({
        status,
        last_checked_at: now,
        updated_at: now,
        ...(status === "completed" ? { completed_at: now } : {}),
      })
      .eq("id", local.id)
    if (updateError) return NextResponse.json({ ok: false }, { status: 503 })
    return NextResponse.json({ ok: true, recorded: true, status })
  } catch {
    // Keep the event for the reconciliation job. Never leak API error details.
    return NextResponse.json({ ok: true, recorded: true, synced: false })
  }
}
