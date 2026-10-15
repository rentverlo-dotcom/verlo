import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const reply = (status: number, body: object) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
const preview = () => process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === "feature/temporarios"

async function handler(request: NextRequest, delivery: boolean) {
  if (!preview()) return reply(404, { ok: false })
  const secret = process.env.TEMPORARY_NOTIFICATIONS_CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return reply(401, { ok: false, error: "Unauthorized" })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return reply(503, { ok: false, error: "Database unavailable" })
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  if (!delivery || process.env.TEMPORARY_NOTIFICATION_DELIVERY_ENABLED !== "true") {
    const { data, error } = await db.from("temporary_notification_outbox")
      .select("id,event_type,recipient_role,status,attempts,available_at")
      .in("status", ["pending", "failed"]).lte("available_at", new Date().toISOString())
      .order("created_at", { ascending: true }).limit(20)
    if (error) return reply(503, { ok: false, error: "Unable to inspect queue" })
    return reply(200, {
      ok: true, mode: "dry_run", deliveryEnabled: false, count: data?.length ?? 0,
      events: (data ?? []).map(({ id, event_type, recipient_role, status, attempts }) =>
        ({ id, eventType: event_type, recipientRole: recipient_role, status, attempts })),
    })
  }

  // A dedicated Temporarios webhook must be configured; legacy VERLO workflows
  // are intentionally never called by this dispatcher.
  const endpoint = process.env.TEMPORARY_RESERVATION_CONFIRMED_WEBHOOK_URL
  const token = process.env.TEMPORARY_NOTIFICATION_WEBHOOK_TOKEN
  if (!endpoint || !token || !endpoint.startsWith("https://"))
    return reply(503, { ok: false, error: "Temporarios delivery provider not configured" })
  const { data, error } = await db.rpc("temporary_claim_notifications", { p_limit: 10 })
  if (error) return reply(503, { ok: false, error: "Notification claim RPC unavailable" })
  const results: Array<{ id: string; delivered: boolean }> = []
  for (const event of (data ?? [])) {
    let delivered = false
    let reason = "Unknown delivery failure"
    try {
      const user = await db.auth.admin.getUserById(event.recipient_user_id)
      if (user.error || !user.data.user?.email) throw new Error("Recipient email unavailable")
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": event.event_key,
        },
        body: JSON.stringify({
          source: "verlo_temporarios", eventKey: event.event_key,
          eventType: event.event_type, role: event.recipient_role,
          email: user.data.user.email, payload: event.payload,
          destination: "/temporarios/mi-verlo",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      })
      if (!response.ok) throw new Error(`Notification provider HTTP ${response.status}`)
      delivered = true
    } catch (error) {
      reason = error instanceof Error ? error.message : "Delivery failed"
    }
    const done = await db.rpc("temporary_finish_notification", {
      p_id: event.id, p_success: delivered, p_error: delivered ? null : reason,
    })
    if (done.error) return reply(503, { ok: false, error: "Queue state update failed" })
    results.push({ id: event.id, delivered })
  }
  return reply(200, { ok: true, processed: results.length, sent: results.filter(x => x.delivered).length,
    failed: results.filter(x => !x.delivered).length })
}

export async function GET(request: NextRequest) { return handler(request, false) }
export async function POST(request: NextRequest) { return handler(request, true) }
