import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase/admin'

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY

const vapidSubject =
  process.env.VAPID_SUBJECT

if (
  !vapidPublicKey ||
  !vapidPrivateKey ||
  !vapidSubject
) {
  throw new Error(
    'Missing VAPID environment variables'
  )
}

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
)

type PushPayload = {
  title: string
  body: string
  url: string
}

export async function sendPushToLead(
  leadId: string,
  payload: PushPayload
) {
  const {
    data: subscriptions,
    error,
  } =
    await supabaseAdmin
      .from('push_subscriptions')
      .select(
        'id, endpoint, p256dh, auth'
      )
      .eq(
        'lead_id',
        leadId
      )
      .is(
        'revoked_at',
        null
      )

  if (error) {
    throw error
  }

  if (
    !subscriptions ||
    subscriptions.length === 0
  ) {
    return {
      sent: 0,
      failed: 0,
    }
  }

  let sent = 0
  let failed = 0

  for (
    const subscription
    of subscriptions
  ) {
    try {
      await webpush.sendNotification(
        {
          endpoint:
            subscription.endpoint,
          keys: {
            p256dh:
              subscription.p256dh,
            auth:
              subscription.auth,
          },
        },
        JSON.stringify(
          payload
        )
      )

      sent += 1
    } catch (
      error: any
    ) {
      failed += 1

      const statusCode =
        Number(
          error?.statusCode || 0
        )

      if (
        statusCode === 404 ||
        statusCode === 410
      ) {
        await supabaseAdmin
          .from(
            'push_subscriptions'
          )
          .update({
            revoked_at:
              new Date()
                .toISOString(),
          })
          .eq(
            'id',
            subscription.id
          )
      }

      console.error(
        'Push delivery failed',
        error
      )
    }
  }

  return {
    sent,
    failed,
  }
}
