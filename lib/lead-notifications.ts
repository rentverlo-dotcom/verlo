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
  event_key: string
  event_type: string
  lead_id: string
  entity_type: string | null
  entity_id: string | null
  title: string
  body: string
  url: string
  status:
    | 'pending'
    | 'sent'
    | 'failed'
  updated_at: string
}

function clean(
  value: unknown
) {
  return String(
    value || ''
  ).trim()
}

async function markFailed(
  eventId: string,
  message: string
) {
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
      eventId
    )
}

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

    if (
      sentCount >
      0
    ) {
      const now =
        new Date()
          .toISOString()

      await supabaseAdmin
        .from(
          'lead_notification_events'
        )
        .update({
          status:
            'sent',

          sent_at:
            now,

          last_error:
            failedCount >
            0
              ? `${failedCount} device(s) failed`
              : null,

          updated_at:
            now,
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

    const message =
      failedCount >
      0
        ? 'Push delivery failed'
        : 'No active push subscriptions'

    await markFailed(
      event.id,
      message
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

    await markFailed(
      event.id,
      message
    )

    console.error(
      'notification delivery error:',
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
      duplicate: false,

      event_id:
        event.id,

      error:
        message,
    }
  }
}

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
      .select(`
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
      `)
      .maybeSingle()

  if (
    !insertError &&
    insertedEvent
  ) {
    return deliverEvent(
      insertedEvent as
        NotificationEventRow
    )
  }

  if (
    insertError?.code !==
    '23505'
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
      .select(`
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
      `)
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
      'Notification event not found'
    )
  }

  const event =
    existingEvent as
      NotificationEventRow

  if (
    event.status ===
    'sent'
  ) {
    return {
      ok: true,
      sent: false,
      duplicate: true,

      reason:
        'already_sent',

      event_id:
        event.id,
    }
  }

  if (
    event.status ===
    'pending'
  ) {
    const updatedAt =
      new Date(
        event.updated_at
      ).getTime()

    const stale =
      !Number.isFinite(
        updatedAt
      ) ||
      Date.now() -
        updatedAt >
        2 *
          60 *
          1000

    if (
      !stale
    ) {
      return {
        ok: true,
        sent: false,
        duplicate: true,

        reason:
          'already_processing',

        event_id:
          event.id,
      }
    }
  }

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
        event.id
      )
      .neq(
        'status',
        'sent'
      )
      .select(`
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
      `)
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
        'already_claimed',

      event_id:
        event.id,
    }
  }

  return deliverEvent(
    claimedEvent as
      NotificationEventRow
  )
}

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
      retried: 0,
      sent: 0,
    }
  }

  const {
    data:
      events,

    error,
  } =
    await supabaseAdmin
      .from(
        'lead_notification_events'
      )
      .select(`
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
      `)
      .eq(
        'lead_id',
        leadId
      )
      .eq(
        'status',
        'failed'
      )
      .order(
        'created_at',
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
          event.id
        )
        .eq(
          'status',
          'failed'
        )
        .select(`
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
        `)
        .maybeSingle()

    if (
      claimError ||
      !claimedEvent
    ) {
      continue
    }

    retried +=
      1

    const result =
      await deliverEvent(
        claimedEvent as
          NotificationEventRow
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
