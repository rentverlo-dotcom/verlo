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
    data:
      targetLead,
    error:
      targetLeadError,
  } =
    await supabaseAdmin
      .from('lead_intake')
      .select('id, email, phone_normalized, role')
      .eq('id', leadId)
      .maybeSingle()

  if (targetLeadError) {
    throw targetLeadError
  }

  const identityPhone =
    String(
      targetLead?.phone_normalized || ''
    ).trim()

  const identityEmail =
    String(
      targetLead?.email || ''
    )
      .trim()
      .toLowerCase()

  const targetRole =
    targetLead?.role === 'tenant' ||
    targetLead?.role === 'owner'
      ? targetLead.role
      : null

  let relatedLeadIds =
    [leadId]

  if (identityPhone || identityEmail) {
    let relatedQuery =
      supabaseAdmin
        .from('lead_intake')
        .select('id, role')

    relatedQuery =
      identityPhone
        ? relatedQuery.eq(
            'phone_normalized',
            identityPhone
          )
        : relatedQuery.ilike(
            'email',
            identityEmail
          )

    const {
      data:
        relatedLeads,
      error:
        relatedLeadsError,
    } =
      await relatedQuery

    if (relatedLeadsError) {
      throw relatedLeadsError
    }

    relatedLeadIds =
      Array.from(
        new Set([
          leadId,
          ...(
            relatedLeads ||
            []
          )
            .filter(
              (row) =>
                !targetRole ||
                row.role === targetRole ||
                row.role === 'both'
            )
            .map(
              (row) =>
                String(
                  row.id
                )
            ),
        ])
      )
  }

  const {
    data:
      subscriptionRows,
    error,
  } =
    await supabaseAdmin
      .from('push_subscriptions')
      .select(
        'id, role, endpoint, p256dh, auth'
      )
      .in(
        'lead_id',
        relatedLeadIds
      )
      .is(
        'revoked_at',
        null
      )

  const filteredSubscriptionRows =
    targetRole
      ? (subscriptionRows || []).filter(
          (subscription) =>
            subscription.role === targetRole
        )
      : (subscriptionRows || [])

  const subscriptions =
    Array.from(
      new Map(
        filteredSubscriptionRows.map(
          (subscription) => [
            subscription.endpoint,
            subscription,
          ]
        )
      ).values()
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
