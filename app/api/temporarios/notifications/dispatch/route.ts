
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const reply = (status: number, body: object) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })

// Se mantiene restringido a Preview hasta completar el pase a main.
const dispatchAllowed = () =>
  (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/temporarios"
  ) ||
  (
    process.env.VERCEL_ENV === "production" &&
    process.env.TEMPORARY_PUBLIC_ENABLED === "true" &&
    process.env.TEMPORARY_DB_WRITES_ENABLED === "true" &&
    process.env.TEMPORARY_NOTIFICATION_DELIVERY_ENABLED === "true"
  )

const formatDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.split("-").reverse().join("/")
    : value

async function handler(request: NextRequest, delivery: boolean) {
if (!dispatchAllowed()) return reply(404, { ok: false })
  
  const secret = process.env.TEMPORARY_NOTIFICATIONS_CRON_SECRET

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return reply(401, { ok: false, error: "Unauthorized" })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return reply(503, {
      ok: false,
      error: "Database unavailable",
    })
  }

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Seguridad: no enviar nada hasta habilitar explicitamente.
  if (
    !delivery ||
    process.env.TEMPORARY_NOTIFICATION_DELIVERY_ENABLED !== "true"
  ) {
    const { data, error } = await db
      .from("temporary_notification_outbox")
      .select("id,event_type,recipient_role,status,attempts,available_at")
      .in("status", ["pending", "failed"])
      .lte("available_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(20)

    if (error) {
      return reply(503, {
        ok: false,
        error: "Unable to inspect queue",
      })
    }

    return reply(200, {
      ok: true,
      mode: "dry_run",
      deliveryEnabled: false,
      count: data?.length ?? 0,
      events: (data ?? []).map(
        ({ id, event_type, recipient_role, status, attempts }) => ({
          id,
          eventType: event_type,
          recipientRole: recipient_role,
          status,
          attempts,
        })
      ),
    })
  }

  // Cada evento tiene su propio workflow de GHL.
  // Nunca se utilizan los webhooks de Tradicionales.
  const endpoints: Record<string, string> = {
    reservation_confirmed:
      process.env.TEMPORARY_RESERVATION_CONFIRMED_WEBHOOK_URL || "",
    temporary_action_required:
      process.env.TEMPORARY_ACTION_REQUIRED_WEBHOOK_URL || "",
  }

  // Validar configuracion antes de reclamar eventos de la cola.
  const requiredEvents = ["reservation_confirmed", "temporary_action_required"]

  const { data: queued, error: queueError } = await db
    .from("temporary_notification_outbox")
    .select("event_type")
    .in("status", ["pending", "failed"])
    .lte("available_at", new Date().toISOString())
    .limit(20)

  if (queueError) {
    return reply(503, {
      ok: false,
      error: "Unable to inspect notification types",
    })
  }

  for (const item of queued ?? []) {
    const eventType = String(item.event_type)

    if (!requiredEvents.includes(eventType)) {
      return reply(409, {
        ok: false,
        error: "Unsupported queued notification type",
      })
    }

    if (
      !endpoints[eventType].startsWith(
        "https://services.leadconnectorhq.com/hooks/"
      )
    ) {
      return reply(503, {
        ok: false,
        error: `Webhook not configured for ${eventType}`,
      })
    }
  }

  const { data, error } = await db.rpc(
    "temporary_claim_notifications",
    { p_limit: 10 }
  )

  if (error) {
    return reply(503, {
      ok: false,
      error: "Notification claim RPC unavailable",
    })
  }

  const results: Array<{ id: string; delivered: boolean }> = []

  for (const event of data ?? []) {
    let delivered = false
    let reason = "Unknown delivery failure"

    try {
      const eventType = String(event.event_type)

      if (!requiredEvents.includes(eventType)) {
        throw new Error("Unsupported event type")
      }

      const endpoint = endpoints[eventType]

      if (
        !endpoint.startsWith(
          "https://services.leadconnectorhq.com/hooks/"
        )
      ) {
        throw new Error("Event webhook not configured")
      }

      const user = await db.auth.admin.getUserById(
        event.recipient_user_id
      )

      if (user.error || !user.data.user?.email) {
        throw new Error("Recipient email unavailable")
      }

      const matchId = event.payload?.match_id

      if (!matchId) {
        throw new Error("Reservation match missing")
      }

      const { data: match, error: matchError } = await db
        .from("temporary_matches")
        .select("property_id,demand_id")
        .eq("id", matchId)
        .single()

      if (matchError || !match) {
        throw new Error("Reservation match unavailable")
      }

      const owner = event.recipient_role === "owner"

      if (!owner && event.recipient_role !== "tenant") {
        throw new Error("Invalid recipient role")
      }

      const table = owner
        ? "temporary_properties"
        : "temporary_demands"

      const rowId = owner
        ? match.property_id
        : match.demand_id

      const nameField = owner
        ? "owner_full_name"
        : "tenant_full_name"

      const phoneField = owner
        ? "owner_phone"
        : "tenant_phone"

      const { data: record, error: contactError } = await db
        .from(table)
        .select(`${nameField},${phoneField}`)
        .eq("id", rowId)
        .single()

      if (contactError || !record) {
        throw new Error("Recipient contact unavailable")
      }

      const fields = record as Record<string, unknown>

      const fullName = String(fields[nameField] || "").trim()
      const phone = String(fields[phoneField] || "").replace(/\D/g, "")

      const checkIn = String(event.payload?.check_in || "")
      const checkOut = String(event.payload?.check_out || "")

      const actionText = String(
        event.payload?.action_text || ""
      ).trim()

      if (!fullName) {
        throw new Error("Recipient fields unavailable")
      }

      if (
        eventType === "reservation_confirmed" &&
        (!checkIn || !checkOut)
      ) {
        throw new Error("Reservation dates unavailable")
      }

      if (
        eventType === "temporary_action_required" &&
        (!actionText || actionText.length > 500)
      ) {
        throw new Error("Action text unavailable")
      }

      const destination =
        "https://verlo.lat/temporarios/mi-verlo"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": event.event_key,
        },
        body: JSON.stringify({
          source: "verlo_temporarios",
          product: "temporarios",
          channel: "email",

          event_type: eventType,
          event_key: event.event_key,

          user_id: event.recipient_user_id,
          full_name: fullName,
          first_name: fullName.split(/\s+/)[0],
          email: user.data.user.email,
          phone,

          role: event.recipient_role,
          verlo_temp_role: event.recipient_role,

          verlo_temp_check_in: formatDate(checkIn),
          verlo_temp_check_out: formatDate(checkOut),

          verlo_temp_action_text:
            eventType === "temporary_action_required"
              ? actionText
              : null,

          verlo_temp_reservation_id: event.reservation_id,
          verlo_temp_url: destination,
          url: destination,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(
          `Notification provider HTTP ${response.status}`
        )
      }

      // HTTP 2xx confirms GHL accepted the event; not inbox delivery.
      delivered = true
    } catch (error) {
      reason =
        error instanceof Error
          ? error.message
          : "Delivery failed"
    }

    const done = await db.rpc(
      "temporary_finish_notification",
      {
        p_id: event.id,
        p_success: delivered,
        p_error: delivered ? null : reason,
      }
    )

    if (done.error) {
      return reply(503, {
        ok: false,
        error: "Queue state update failed",
      })
    }

    results.push({
      id: event.id,
      delivered,
    })
  }

  return reply(200, {
    ok: true,
    processed: results.length,
    accepted_by_ghl: results.filter(x => x.delivered).length,
    failed: results.filter(x => !x.delivered).length,
  })
}

export async function GET(request: NextRequest) {
  return handler(request, false)
}

export async function POST(request: NextRequest) {
  return handler(request, true)
}
