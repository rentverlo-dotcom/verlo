import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { enqueueVerloEmail } from "@/lib/notifications/verlo-email-outbox"

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
    ["feature/temporarios", "qa/verlo-e2e", "feature/signatura-qa-integration"].includes(process.env.VERCEL_GIT_COMMIT_REF || "")
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
if (!dispatchAllowed() && !(request.method === "GET" &&
    process.env.VERCEL_ENV === "production" &&
    process.env.TEMPORARY_PUBLIC_ENABLED === "true"))
    return reply(404, { ok: false })
  
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

  const results: Array<{ id: string; queued: boolean }> = []

  for (const event of data ?? []) {
    let delivered = false
    let reason = "Unknown delivery failure"

    try {
      const eventType = String(event.event_type)

      if (!requiredEvents.includes(eventType)) {
        throw new Error("Unsupported event type")
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

      const { data: record, error: contactError } = await db
        .from(table)
        .select(nameField)
        .eq("id", rowId)
        .single()

      if (contactError || !record) {
        throw new Error("Recipient contact unavailable")
      }

      // Confirm the queued recipient actually owns the demand/property linked to this match.
      const identityColumn = owner ? "owner_user_id" : "tenant_user_id"
      const { data: linkedRecord, error: linkedError } = await db
        .from(table).select(identityColumn).eq("id", rowId).maybeSingle()
      if (linkedError || !linkedRecord ||
          (linkedRecord as Record<string, unknown>)[identityColumn] !== event.recipient_user_id) {
        throw new Error("Recipient does not belong to this temporary match")
      }

      const fields = record as Record<string, unknown>

      const fullName = String(fields[nameField] || "").trim()
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

      // VERLO native email queue only. A successful insert is queued,
      // NOT evidence of external provider delivery.
      const queuedStatus = await enqueueVerloEmail({
        area: "temporarios",
        eventType,
        eventKey: String(event.event_key),
        recipientEmail: user.data.user.email,
        recipientRole: event.recipient_role,
        url: "https://verlo.lat/temporarios/mi-verlo",
        title: eventType === "reservation_confirmed"
          ? "Reserva temporaria confirmada" : "Tenés una acción pendiente",
        body: eventType === "reservation_confirmed"
          ? `La reserva fue confirmada. Estadía del ${formatDate(checkIn)} al ${formatDate(checkOut)}. Revisá los detalles en VERLO Temporarios.`
          : `Hay una acción pendiente en tu alquiler temporario: ${actionText}`,
      })
      if (queuedStatus !== "queued" && queuedStatus !== "duplicate") {
        throw new Error("Native VERLO email queue not available")
      }
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
      queued: delivered,
    })
  }

  return reply(200, {
    ok: true,
    processed: results.length,
    queued_for_zeptomail: results.filter(x => x.queued).length,
    failed: results.filter(x => !x.queued).length,
  })
}

export async function GET(request: NextRequest) {
  return handler(request, false)
}

export async function POST(request: NextRequest) {
  return handler(request, true)
}
