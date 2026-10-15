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
  if (!endpoint || !endpoint.startsWith("https://services.leadconnectorhq.com/hooks/"))
    return reply(503, { ok: false, error: "Temporarios delivery provider not configured" })
  const { data, error } = await db.rpc("temporary_claim_notifications", { p_limit: 10 })
  if (error) return reply(503, { ok: false, error: "Notification claim RPC unavailable" })
  const results: Array<{ id: string; delivered: boolean }> = []
  for (const event of (data ?? [])) {
    let delivered = false
    let reason = "Unknown delivery failure"
    try {
      if (event.event_type !== "reservation_confirmed") throw new Error("Unsupported event type")
      const user = await db.auth.admin.getUserById(event.recipient_user_id)
      if (user.error || !user.data.user?.email) throw new Error("Recipient email unavailable")
      const matchId = event.payload?.match_id
      if (!matchId) throw new Error("Reservation match missing")
      const { data: match, error: matchError } = await db.from("temporary_matches").select("property_id,demand_id").eq("id", matchId).single()
      if (matchError || !match) throw new Error("Reservation match unavailable")
      const owner = event.recipient_role === "owner"
      if (!owner && event.recipient_role !== "tenant") throw new Error("Invalid role")
      const table = owner ? "temporary_properties" : "temporary_demands"
      const rowId = owner ? match.property_id : match.demand_id
      const nameField = owner ? "owner_full_name" : "tenant_full_name"
      const phoneField = owner ? "owner_phone" : "tenant_phone"
      const { data: record, error: contactError } = await db.from(table).select(`${nameField},${phoneField}`).eq("id", rowId).single()
      if (contactError || !record) throw new Error("Recipient contact unavailable")
      const fields = record as Record<string, unknown>
      const fullName = String(fields[nameField] || "").trim()
      const phone = String(fields[phoneField] || "").replace(/\D/g, "")
      const checkIn = String(event.payload?.check_in || "")
      const checkOut = String(event.payload?.check_out || "")
      if (!fullName || !phone || !checkIn || !checkOut) throw new Error("Required notification fields unavailable")
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": event.event_key,
        },
        body: JSON.stringify({
          source: "verlo_temporarios", product: "temporarios", channel: "whatsapp",
          event_type: "reservation_confirmed", event_key: event.event_key,
          user_id: event.recipient_user_id, full_name: fullName,
          first_name: fullName.split(/\s+/)[0], email: user.data.user.email,
          phone, role: event.recipient_role, verlo_temp_role: event.recipient_role,
          verlo_temp_check_in: checkIn, verlo_temp_check_out: checkOut,
          verlo_temp_reservation_id: event.reservation_id,
          verlo_temp_url: "https://verlo.lat/temporarios/mi-verlo",
          url: "https://verlo.lat/temporarios/mi-verlo",
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
