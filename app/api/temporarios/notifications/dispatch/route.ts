import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const reply = (status: number, body: object) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })

/**
 * Inspect VERLO Temporarios notification outbox safely.
 * Dry run: no external sends, no row changes, no messages marked delivered.
 */
export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/temporarios")
    return reply(404, { ok: false })

  const secret = process.env.TEMPORARY_NOTIFICATIONS_CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return reply(401, { ok: false, error: "Unauthorized" })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return reply(503, { ok: false, error: "Database unavailable" })

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await db
    .from("temporary_notification_outbox")
    .select("id,event_type,recipient_role,status,attempts,available_at")
    .in("status", ["pending", "failed"])
    .lte("available_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(25)

  if (error) return reply(503, { ok: false, error: "Unable to inspect notification queue" })

  return reply(200, {
    ok: true,
    mode: "dry_run",
    providerSendingEnabled: false,
    batchSize: data?.length ?? 0,
    events: (data ?? []).map(({ id, event_type, recipient_role, status, attempts }) => ({
      id, eventType: event_type, recipientRole: recipient_role, status, attempts,
    })),
  })
}
