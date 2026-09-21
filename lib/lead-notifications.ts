import {
  supabaseAdmin,
} from "@/lib/supabase/admin"

import {
  sendPushToLead,
} from "@/lib/push"

import {
  sendEmailToLeadOnce,
} from "@/lib/email"

type NotifyLeadOnceInput = {
  eventKey: string
  eventType: string

  leadId: string

  entityType?: string | null
  entityId?: string | null

  title: string
  body: string
  url: string
}

type NotificationEventStatus =
  | "pending"
  | "sent"
  | "failed"

type NotificationEventRow = {
  id: string

  event_key: string
  event_type: string

  lead_id: string

  entity_type:
    | string
    | null

  entity_id:
    | string
    | null

  title: string
  body: string
  url: string

  status:
    NotificationEventStatus

  updated_at: string
}

const EVENT_SELECT = `
  id,
  event_key,
  event_type,
  lead_id,
  entity_type,
  entity_id,
  title,
  body,
  url,
  status,
  updated_at
`

const PROCESSING_TIMEOUT_MS =
  2 *
  60 *
  1000

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

// ============================================================
// MARCAR FAILED
// ============================================================

async function markFailed(
  eventId: string,
  message: string
) {
  const now =
    new Date()
      .toISOString()

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .update({
        status:
          "failed",

        last_error:
          message,

        updated_at:
          now,
      })
      .eq(
        "id",
        eventId
      )
      .eq(
        "status",
        "pending"
      )

  if (
    error
  ) {
    console.error(
      "notification mark failed error:",
      {
        eventId,
        error,
      }
    )
  }
}

// ============================================================
// MARCAR SENT
// ============================================================

async function markSent(
  eventId: string,
  failedCount: number
) {
  const now =
    new Date()
      .toISOString()

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .update({
        status:
          "sent",

        sent_at:
          now,

        last_error:
          failedCount > 0
            ? `${failedCount} device(s) failed`
            : null,

        updated_at:
          now,
      })
      .eq(
        "id",
        eventId
      )
      .eq(
        "status",
        "pending"
      )

  if (
    error
  ) {
    throw error
  }
}

// ============================================================
// ENTREGAR EVENTO
//
// IMPORTANTE:
// sendPushToLead puede enviar a más de un dispositivo físico
// del MISMO lead.
//
// Eso sigue siendo UN evento lógico.
// ============================================================

async function deliverEvent(
  event:
    NotificationEventRow
) {
  try {
    const result =
      await sendPushToLead(
        event.lead_id,
        {
          title:
            event.title,

          body:
            event.body,

          url:
            event.url,
        }
      )

    const sentCount =
      Number(
        result?.sent ||
        0
      )

    const failedCount =
      Number(
        result?.failed ||
        0
      )

    // ========================================================
    // AL MENOS UN DISPOSITIVO RECIBIÓ
    // ========================================================

    if (
      sentCount >
      0
    ) {
      await markSent(
        event.id,
        failedCount
      )

      return {
        ok: true,

        sent: true,

        duplicate:
          false,

        event_id:
          event.id,

        devices_sent:
          sentCount,

        devices_failed:
          failedCount,
      }
    }

    // ========================================================
    // NINGÚN DISPOSITIVO RECIBIÓ
    //
    // Lo dejamos FAILED para que pueda reintentarse cuando
    // vuelva a registrarse una suscripción Push.
    // ========================================================

    const message =
      failedCount > 0
        ? "Push delivery failed"
        : "No active push subscriptions"

    await markFailed(
      event.id,
      message
    )

    return {
      ok: false,

      sent: false,

      duplicate:
        false,

      event_id:
        event.id,

      devices_sent:
        sentCount,

      devices_failed:
        failedCount,

      error:
        message,
    }
  } catch (
    error
  ) {
    const message =
      error instanceof
      Error
        ? error.message
        : String(
            error
          )

    await markFailed(
      event.id,
      message
    )

    console.error(
      "notification delivery error:",
      {
        eventKey:
          event.event_key,

        leadId:
          event.lead_id,

        error,
      }
    )

    return {
      ok: false,

      sent: false,

      duplicate:
        false,

      event_id:
        event.id,

      error:
        message,
    }
  }
}

// ============================================================
// CLAIM SEGURO
//
// Hace compare-and-set usando:
// - id
// - status anterior
// - updated_at anterior
//
// Así dos requests simultáneos NO pueden reclamar
// el mismo evento.
// ============================================================

async function claimEvent(
  event:
    NotificationEventRow
) {
  const now =
    new Date()
      .toISOString()

  const {
    data:
      claimedEvent,

    error:
      claimError,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .update({
        status:
          "pending",

        last_error:
          null,

        updated_at:
          now,
      })
      .eq(
        "id",
        event.id
      )
      .eq(
        "status",
        event.status
      )
      .eq(
        "updated_at",
        event.updated_at
      )
      .select(
        EVENT_SELECT
      )
      .maybeSingle()

  if (
    claimError
  ) {
    throw claimError
  }

  return claimedEvent
    ? (
        claimedEvent as
          NotificationEventRow
      )
    : null
}

// ============================================================
// NOTIFICACIÓN LÓGICA EXACTAMENTE UNA VEZ
// ============================================================

export async function notifyLeadOnce(
  input:
    NotifyLeadOnceInput
) {
  const eventKey =
    clean(
      input.eventKey
    )

  const eventType =
    clean(
      input.eventType
    )

  const leadId =
    clean(
      input.leadId
    )

  const entityType =
    clean(
      input.entityType
    ) ||
    null

  const entityId =
    clean(
      input.entityId
    ) ||
    null

  const title =
    clean(
      input.title
    )

  const body =
    clean(
      input.body
    )

  const url =
    clean(
      input.url
    )

  if (
    !eventKey ||
    !eventType ||
    !leadId ||
    !title ||
    !body ||
    !url
  ) {
    throw new Error(
      "Invalid notification event"
    )
  }

  try {
    const emailResult =
      await sendEmailToLeadOnce({
        eventKey,
        leadId,
        title,
        body,
        url,
      })

    const emailSkipped =
      "skipped" in emailResult &&
      emailResult.skipped ===
        true

    if (
      !emailResult?.ok &&
      !emailSkipped
    ) {
      console.error(
        "email notification delivery error:",
        {
          eventKey,
          leadId,
          result:
            emailResult,
        }
      )
    }
  } catch (
    emailError
  ) {
    console.error(
      "email notification unexpected error:",
      {
        eventKey,
        leadId,
        error:
          emailError,
      }
    )
  }

  const now =
    new Date()
      .toISOString()

  // =========================================================
  // 1. INTENTAR CREAR EVENTO
  //
  // event_key UNIQUE es la primera barrera anti-duplicados.
  // =========================================================

  const {
    data:
      insertedEvent,

    error:
      insertError,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .insert({
        event_key:
          eventKey,

        event_type:
          eventType,

        lead_id:
          leadId,

        entity_type:
          entityType,

        entity_id:
          entityId,

        title,

        body,

        url,

        status:
          "pending",

        updated_at:
          now,
      })
      .select(
        EVENT_SELECT
      )
      .maybeSingle()

  // =========================================================
  // 2. EVENTO NUEVO
  // =========================================================

  if (
    !insertError &&
    insertedEvent
  ) {
    return deliverEvent(
      insertedEvent as
        NotificationEventRow
    )
  }

  // =========================================================
  // 3. ERROR QUE NO ES DUPLICADO
  // =========================================================

  if (
    insertError?.code !==
    "23505"
  ) {
    throw (
      insertError ||
      new Error(
        "Could not create notification event"
      )
    )
  }

  // =========================================================
  // 4. YA EXISTE EVENT_KEY
  // =========================================================

  const {
    data:
      existingEvent,

    error:
      existingError,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .select(
        EVENT_SELECT
      )
      .eq(
        "event_key",
        eventKey
      )
      .maybeSingle()

  if (
    existingError
  ) {
    throw existingError
  }

  if (
    !existingEvent
  ) {
    throw new Error(
      "Notification event not found"
    )
  }

  const event =
    existingEvent as
      NotificationEventRow

  // =========================================================
  // 5. YA FUE ENVIADO
  //
  // Nunca reenviar.
  // =========================================================

  if (
    event.status ===
    "sent"
  ) {
    return {
      ok: true,

      sent: false,

      duplicate:
        true,

      reason:
        "already_sent",

      event_id:
        event.id,
    }
  }

  // =========================================================
  // 6. PENDING RECIENTE
  //
  // Otro request probablemente lo está procesando.
  // =========================================================

  if (
    event.status ===
    "pending"
  ) {
    const updatedAtMs =
      new Date(
        event.updated_at
      ).getTime()

    const stale =
      !Number.isFinite(
        updatedAtMs
      ) ||
      (
        Date.now() -
          updatedAtMs >
        PROCESSING_TIMEOUT_MS
      )

    if (
      !stale
    ) {
      return {
        ok: true,

        sent: false,

        duplicate:
          true,

        reason:
          "already_processing",

        event_id:
          event.id,
      }
    }
  }

  // =========================================================
  // 7. FAILED O PENDING VIEJO
  //
  // Intentamos reclamarlo con compare-and-set.
  // =========================================================

  const claimedEvent =
    await claimEvent(
      event
    )

  if (
    !claimedEvent
  ) {
    return {
      ok: true,

      sent: false,

      duplicate:
        true,

      reason:
        "already_claimed",

      event_id:
        event.id,
    }
  }

  // =========================================================
  // 8. SOLO EL REQUEST QUE GANÓ EL CLAIM ENVÍA
  // =========================================================

  return deliverEvent(
    claimedEvent
  )
}

// ============================================================
// REINTENTAR EVENTOS FALLIDOS DE UN LEAD
//
// Se usa después de registrar / recuperar una suscripción Push.
//
// IMPORTANTE:
// registrar un dispositivo NO crea eventos de negocio.
// Solamente intenta entregar eventos YA EXISTENTES y FAILED.
// ============================================================

export async function retryFailedLeadNotifications(
  leadIdInput: string
) {
  const leadId =
    clean(
      leadIdInput
    )

  if (
    !leadId
  ) {
    return {
      ok: false,

      retried:
        0,

      sent:
        0,
    }
  }

  const {
    data:
      events,

    error,
  } =
    await supabaseAdmin
      .from(
        "lead_notification_events"
      )
      .select(
        EVENT_SELECT
      )
      .eq(
        "lead_id",
        leadId
      )
      .eq(
        "status",
        "failed"
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      )
      .limit(
        20
      )

  if (
    error
  ) {
    throw error
  }

  let retried =
    0

  let sent =
    0

  for (
    const row
    of events || []
  ) {
    const event =
      row as
        NotificationEventRow

    // ========================================================
    // CLAIM ATÓMICO DEL FAILED
    //
    // Si otro request ya lo tomó, devuelve null.
    // ========================================================

    let claimedEvent:
      NotificationEventRow |
      null =
      null

    try {
      claimedEvent =
        await claimEvent(
          event
        )
    } catch (
      claimError
    ) {
      console.error(
        "notification retry claim error:",
        {
          eventKey:
            event.event_key,

          leadId:
            event.lead_id,

          error:
            claimError,
        }
      )

      continue
    }

    if (
      !claimedEvent
    ) {
      continue
    }

    retried +=
      1

    const result =
      await deliverEvent(
        claimedEvent
      )

    if (
      result.sent
    ) {
      sent +=
        1
    }
  }

  return {
    ok: true,

    retried,

    sent,
  }
}
