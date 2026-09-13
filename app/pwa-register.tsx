'use client'

import {
  useEffect,
} from 'react'

const PUSH_LEAD_STORAGE_KEY =
  'verlo_push_lead_id'

const PUSH_ROLE_STORAGE_KEY =
  'verlo_push_role'

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding =
    '='.repeat(
      (4 -
        (base64String.length %
          4)) %
        4
    )

  const base64 = (
    base64String +
    padding
  )
    .replace(
      /-/g,
      '+'
    )
    .replace(
      /_/g,
      '/'
    )

  const rawData =
    window.atob(
      base64
    )

  const outputArray =
    new Uint8Array(
      rawData.length
    )

  for (
    let i = 0;
    i <
    rawData.length;
    i += 1
  ) {
    outputArray[i] =
      rawData.charCodeAt(
        i
      )
  }

  return outputArray
}

function subscriptionFailed(
  result: any,
  leadId: string
) {
  const notifications =
    Array.isArray(
      result?.notifications
    )
      ? result.notifications
      : []

  return notifications.some(
    (
      notification: any
    ) => {
      if (
        notification?.lead_id !==
        leadId
      ) {
        return false
      }

      const failed =
        Number(
          notification
            ?.result
            ?.failed ||
            0
        )

      return (
        notification?.sent ===
          false ||
        failed > 0
      )
    }
  )
}

export default function PwaRegister() {
  useEffect(() => {
    if (
      !(
        'serviceWorker'
        in navigator
      )
    ) {
      return
    }

    let cancelled =
      false

    const registerAndRepairPush =
      async () => {
        try {
          const registration =
            await navigator
              .serviceWorker
              .register(
                '/sw.js'
              )

          if (
            cancelled
          ) {
            return
          }

          if (
            !(
              'Notification'
              in window
            ) ||
            !(
              'PushManager'
              in window
            )
          ) {
            return
          }

          if (
            Notification
              .permission !==
            'granted'
          ) {
            return
          }

          const leadId =
            window.localStorage
              .getItem(
                PUSH_LEAD_STORAGE_KEY
              )
              ?.trim() ||
            ''

          const storedRole =
            window.localStorage
              .getItem(
                PUSH_ROLE_STORAGE_KEY
              )
              ?.trim() ||
            ''

          if (
            !leadId ||
            (
              storedRole !==
                'tenant' &&
              storedRole !==
                'owner'
            )
          ) {
            return
          }

          const role =
            storedRole as
              | 'tenant'
              | 'owner'

          const publicKey =
            process.env
              .NEXT_PUBLIC_VAPID_PUBLIC_KEY

          if (
            !publicKey
          ) {
            console.error(
              'Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY'
            )

            return
          }

          const createSubscription =
            async () => {
              return registration
                .pushManager
                .subscribe({
                  userVisibleOnly:
                    true,

                  applicationServerKey:
                    urlBase64ToUint8Array(
                      publicKey
                    ),
                })
            }

          const registerSubscription =
            async (
              subscription:
                PushSubscription
            ) => {
              const response =
                await fetch(
                  '/api/push/subscribe',
                  {
                    method:
                      'POST',

                    headers: {
                      'Content-Type':
                        'application/json',
                    },

                    body:
                      JSON.stringify({
                        lead_id:
                          leadId,

                        role,

                        subscription:
                          subscription
                            .toJSON(),
                      }),
                  }
                )

              const result =
                await response
                  .json()
                  .catch(
                    () => null
                  )

              if (
                !response.ok ||
                !result?.ok
              ) {
                throw new Error(
                  result?.error ||
                    'Push registration failed'
                )
              }

              return result
            }

          const getBackendStatus =
            async (
              subscription:
                PushSubscription
            ) => {
              const response =
                await fetch(
                  '/api/push/status',
                  {
                    method:
                      'POST',

                    headers: {
                      'Content-Type':
                        'application/json',
                    },

                    body:
                      JSON.stringify({
                        lead_id:
                          leadId,

                        endpoint:
                          subscription
                            .endpoint,
                      }),
                  }
                )

              const result =
                await response
                  .json()
                  .catch(
                    () => null
                  )

              if (
                !response.ok ||
                !result?.ok
              ) {
                throw new Error(
                  result?.error ||
                    'Push status failed'
                )
              }

              return result
            }

          const createAndRegister =
            async () => {
              const subscription =
                await createSubscription()

              const result =
                await registerSubscription(
                  subscription
                )

              if (
                subscriptionFailed(
                  result,
                  leadId
                )
              ) {
                try {
                  await subscription
                    .unsubscribe()
                } catch (
                  error
                ) {
                  console.error(
                    'push auto-repair unsubscribe error:',
                    error
                  )
                }

                throw new Error(
                  'Fresh push subscription was rejected'
                )
              }

              return subscription
            }

          const currentSubscription =
            await registration
              .pushManager
              .getSubscription()

          if (
            !currentSubscription
          ) {
            await createAndRegister()

            console.log(
              'Verlo Push subscription restored'
            )

            return
          }

          const backendStatus =
            await getBackendStatus(
              currentSubscription
            )

          if (
            backendStatus
              .active
          ) {
            return
          }

          try {
            await currentSubscription
              .unsubscribe()
          } catch (
            error
          ) {
            console.error(
              'push stale unsubscribe error:',
              error
            )
          }

          await createAndRegister()

          console.log(
            'Verlo Push subscription repaired'
          )
        } catch (error) {
          console.error(
            'Push automatic health check failed:',
            error
          )
        }
      }

    registerAndRepairPush()

    return () => {
      cancelled =
        true
    }
  }, [])

  return null
}
