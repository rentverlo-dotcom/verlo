import webpush from 'web-push'
import { randomUUID } from 'crypto'
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
    const deliveryId =
      randomUUID()

    try {
      const now =
        new Date()
          .toISOString()

      const {
        error:
          receiptInsertError,
      } =
        await supabaseAdmin
          .from(
            'push_delivery_receipts'
          )
          .insert({
            delivery_id:
              deliveryId,

            lead_id:
              leadId,

            subscription_id:
              subscription.id,

            title:
              payload.title,

            url:
              payload.url,

            created_at:
              now,

            updated_at:
              now,
          })

      if (
        receiptInsertError
      ) {
        console.error(
          'Push receipt insert failed',
          {
            deliveryId,
            leadId,
            subscriptionId:
              subscription.id,
            error:
              receiptInsertError,
          }
        )
      }

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

        JSON.stringify({
          ...payload,

          delivery_id:
            deliveryId,

          lead_id:
            leadId,

          subscription_id:
            subscription.id,
        })
      )

      sent += 1

      const acceptedAt =
        new Date()
          .toISOString()

      const {
        error:
          receiptAcceptedError,
      } =
        await supabaseAdmin
          .from(
            'push_delivery_receipts'
          )
          .update({
            provider_accepted_at:
              acceptedAt,

            last_error:
              null,

            updated_at:
              acceptedAt,
          })
          .eq(
            'delivery_id',
            deliveryId
          )

      if (
        receiptAcceptedError
      ) {
        console.error(
          'Push receipt accepted update failed',
          {
            deliveryId,
            leadId,
            subscriptionId:
              subscription.id,
            error:
              receiptAcceptedError,
          }
        )
      }
    } catch (
      error: any
    ) {
      failed += 1

      const statusCode =
        Number(
          error?.statusCode || 0
        )

      const errorMessage =
        error instanceof Error
          ? error.message
          : String(
              error
            )

      const failedAt =
        new Date()
          .toISOString()

      try {
        const {
          error:
            receiptFailedError,
        } =
          await supabaseAdmin
            .from(
              'push_delivery_receipts'
            )
            .update({
              last_error:
                errorMessage,

              updated_at:
                failedAt,
            })
            .eq(
              'delivery_id',
              deliveryId
            )

        if (
          receiptFailedError
        ) {
          console.error(
            'Push receipt failed update error',
            {
              deliveryId,
              leadId,
              subscriptionId:
                subscription.id,
              error:
                receiptFailedError,
            }
          )
        }
      } catch (
        receiptError
      ) {
        console.error(
          'Push receipt failure logging error',
          {
            deliveryId,
            leadId,
            subscriptionId:
              subscription.id,
            error:
              receiptError,
          }
        )
      }

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
