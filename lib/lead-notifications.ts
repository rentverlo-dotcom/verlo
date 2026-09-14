import {
  supabaseAdmin,
} from '@/lib/supabase/admin'

import {
  sendPushToLead,
} from '@/lib/push'

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

type NotificationEventRow = {
  id: string
  status:
    | 'pending'
    | 'sent'
    | 'failed'
}

function clean(
  value: unknown
) {
  return String(
    value || ''
  ).trim()
}

export async function notifyLeadOnce(
  input: NotifyLeadOnceInput
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
    ) || null

  const entityId =
    clean(
      input.entityId
    ) || null

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
      'Invalid notification event'
    )
  }

  const now =
    new Date()
      .toISOString()

  // =========================================================
  // 1. INTENTAR RESERVAR EL EVENTO
  //
  // event_key es UNIQUE.
  // Si dos requests llegan juntas,
  // solamente una puede crear el evento.
  // =========================================================

  const {
    data:
      insertedEvent,
    error:
      insertError,
  } =
    await supabaseAdmin
      .from(
        'lead_notification_events'
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
          'pending',

        updated_at:
          now,
      })
      .select(
        'id, status'
      )
      .maybeSingle()

  let event:
    NotificationEventRow |
    null =
    insertedEvent as
      NotificationEventRow |
      null

  // =========================================================
  // 2. SI YA EXISTÍA
  //
  // sent    -> no volver a mandar
  // pending -> otro request lo está procesando
  // failed  -> permitir UN retry
  // =========================================================

  if (
    insertError
  ) {
    const isDuplicate =
      insertError.code ===
      '23505'

    if (
      !isDuplicate
    ) {
      throw insertError
    }

    const {
      data:
        existingEvent,
      error:
        existingError,
    } =
      await supabaseAdmin
        .from(
          'lead_notification_events'
        )
        .select(
          'id, status'
        )
        .eq(
          'event_key',
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
        'Notification event disappeared'
      )
    }

    if (
      existingEvent.status ===
      'sent'
    ) {
      return {
        ok: true,
        sent: false,
        duplicate: true,
        reason:
          'already_sent',
        event_id:
          existingEvent.id,
      }
    }

    if (
      existingEvent.status ===
      'pending'
    ) {
      return {
        ok: true,
        sent: false,
        duplicate: true,
        reason:
          'already_processing',
        event_id:
          existingEvent.id,
      }
    }

    if (
      existingEvent.status ===
      'failed'
    ) {
      const {
        data:
          claimedEvent,
        error:
          claimError,
      } =
        await supabaseAdmin
          .from(
            'lead_notification_events'
          )
          .update({
            status:
              'pending',

            last_error:
              null,

            updated_at:
              now,
          })
          .eq(
            'id',
            existingEvent.id
          )
          .eq(
            'status',
            'failed'
          )
          .select(
            'id, status'
          )
          .maybeSingle()

      if (
        claimError
      ) {
        throw claimError
      }

      if (
        !claimedEvent
      ) {
        return {
          ok: true,
          sent: false,
          duplicate: true,
          reason:
            'retry_already_claimed',
          event_id:
            existingEvent.id,
        }
      }

      event =
        claimedEvent as
          NotificationEventRow
    }
  }

  if (
    !event
  ) {
    throw new Error(
      'Could not reserve notification event'
    )
  }

  // =========================================================
  // 3. ENVIAR PUSH
  // =========================================================

  try {
    const result =
      await sendPushToLead(
        leadId,
        {
          title,
          body,
          url,
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

    // =======================================================
    // 4. AL MENOS UN DISPOSITIVO RECIBIÓ EL PUSH
    // =======================================================

    if (
      sentCount >
      0
    ) {
      await supabaseAdmin
        .from(
          'lead_notification_events'
        )
        .update({
          status:
            'sent',

          sent_at:
            new Date()
              .toISOString(),

          last_error:
            null,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          'id',
          event.id
        )

      return {
        ok: true,
        sent: true,
        duplicate: false,

        event_id:
          event.id,

        devices_sent:
          sentCount,

        devices_failed:
          failedCount,
      }
    }

    // =======================================================
    // 5. NO HABÍA NINGÚN DISPOSITIVO ACTIVO / ENVÍO FALLÓ
    //
    // Queda FAILED para permitir retry posterior.
    // =======================================================

    const message =
      failedCount >
      0
        ? 'Push delivery failed'
        : 'No active push subscriptions'

    await supabaseAdmin
      .from(
        'lead_notification_events'
      )
      .update({
        status:
          'failed',

        last_error:
          message,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        event.id
      )

    return {
      ok: false,
      sent: false,
      duplicate: false,

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

    await supabaseAdmin
      .from(
        'lead_notification_events'
      )
      .update({
        status:
          'failed',

        last_error:
          message,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        event.id
      )

    console.error(
      'notifyLeadOnce error:',
      {
        eventKey,
        leadId,
        error,
      }
    )

    return {
      ok: false,
      sent: false,
      duplicate: false,

      event_id:
        event.id,

      error:
        message,
    }
  }
}
