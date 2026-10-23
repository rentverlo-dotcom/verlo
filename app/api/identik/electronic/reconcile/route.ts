import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { makeIdentikElectronicClient, IdentikApiError } from "@/lib/identik/electronic-v2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SyncStatus = "created" | "sent" | "pending" | "completed" | "rejected" | "cancelled" | "expired"

function mapStatus(input: unknown): SyncStatus | null {
  const status = String(input ?? "").toUpperCase()
  if (status === "COMPLETED") return "completed"
  if (status === "REJECTED" || status === "DECLINED") return "rejected"
  if (status === "CANCELED" || status === "CANCELLED") return "cancelled"
  if (status === "EXPIRED") return "expired"
  if (status === "SENT") return "sent"
  if (status === "PENDING" || status === "IN_PROGRESS") return "pending"
  if (status === "CREATED" || status === "DRAFT") return "created"
  return null
}

/**
 * Read provider state and reconcile local non-terminal Identik documents.
 * Requires existing Vercel CRON_SECRET. No new schedules on Hobby.
 * Can be manually invoked by an operator with Authorization Bearer CRON_SECRET.
 * Does not create, distribute or spend document credits.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Missing database configuration" }, { status: 503 })
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: rows, error } = await db
    .from("identik_electronic_documents")
    .select("id, identik_document_id, status")
    .not("identik_document_id", "is", null)
    .in("status", ["created", "sent", "pending", "creating", "failed"])
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(10)

  if (error) {
    return NextResponse.json({ ok: false, error: "Database lookup failed" }, { status: 503 })
  }

  const client = makeIdentikElectronicClient()
  const result = { checked: 0, updated: 0, failed: 0, rateLimited: false }
  for (const row of rows ?? []) {
    const documentId = Number(row.identik_document_id)
    if (!Number.isSafeInteger(documentId) || documentId <= 0) {
      result.failed++
      continue
    }

    try {
      const remote = await client.getDocument(documentId)
      result.checked++
      const status = mapStatus(remote.status)
      if (!status) {
        result.failed++
        continue
      }
      const now = new Date().toISOString()
      const { error: updateError } = await db
        .from("identik_electronic_documents")
        .update({
          status,
          updated_at: now,
          last_checked_at: now,
          ...(status === "completed" ? { completed_at: now } : {}),
        })
        .eq("id", row.id)
        .in("status", ["created", "sent", "pending", "creating", "failed"])
      if (updateError) {
        result.failed++
      } else {
        result.updated++
      }
    } catch (err) {
      result.failed++
      if (err instanceof IdentikApiError && err.status === 429) {
        result.rateLimited = true
        break
      }
    }
  }

  return NextResponse.json({ ok: true, ...result }, {
    headers: { "Cache-Control": "no-store" },
  })
}
