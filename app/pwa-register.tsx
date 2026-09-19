'use client'

import {
  useEffect,
} from 'react'

const PUSH_LEAD_STORAGE_KEY =
  'verlo_push_lead_id'

const PUSH_ROLE_STORAGE_KEY =
  'verlo_push_role'

const PWA_RESUME_URL_STORAGE_KEY =
  'verlo_pwa_resume_url'

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding =
    '='.repeat(
      (
        4 -
        (
          base64String.length %
          4
        )
      ) %
        4
    )

  const base64 =
    (
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

function isStandaloneMode() {
  const standalone =
    window.matchMedia(
      '(display-mode: standalone)'
    ).matches

  const navigatorStandalone =
    (
      window.navigator as Navigator & {
        standalone?: boolean
      }
    ).standalone ===
    true

  return (
    standalone ||
    navigatorStandalone
  )
}

export default function PwaRegister() {
  useEffect(
    () => {
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

      async function registerAndRepairPush() {
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
            isStandaloneMode()
          ) {
            try {
              const resumeUrl =
                window
                  .localStorage
                  .getItem(
                    PWA_RESUME_URL_STORAGE_KEY
                  )
                  ?.trim() ||
                ''

              if (
                resumeUrl
              ) {
                const currentUrl =
                  `${window.location.pathname}${window.location.search}`

                if (
                  currentUrl !==
                  resumeUrl
                ) {
                  window.localStorage
                    .removeItem(
                      PWA_RESUME_URL_STORAGE_KEY
                    )

                  window.location
                    .replace(
                      resumeUrl
                    )

                  return
                }

                window.localStorage
                  .removeItem(
                    PWA_RESUME_URL_STORAGE_KEY
                  )
              }
            } catch (
              error
            ) {
              console.error(
                'PWA resume error:',
                error
              )
            }
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
            window
              .localStorage
              .getItem(
                PUSH_LEAD_STORAGE_KEY
              )
              ?.trim() ||
            ''

          const storedRole =
            window
              .localStorage
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
            throw new Error(
              'Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY'
            )
          }

          let subscription =
            await registration
              .pushManager
              .getSubscription()

          if (
            !subscription
          ) {
            subscription =
              await registration
                .pushManager
                .subscribe({
                  userVisibleOnly:
                    true,

                  applicationServerKey:
                    urlBase64ToUint8Array(
                      publicKey
                    ),
                })

            const subscribeResponse =
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

            const subscribeResult =
              await subscribeResponse
                .json()
                .catch(
                  () => null
                )

            if (
              !subscribeResponse.ok ||
              !subscribeResult?.ok
            ) {
              throw new Error(
                subscribeResult?.error ||
                  'Push repair failed'
              )
            }

            console.log(
              'Verlo Push subscription recreated'
            )

            return
          }

          const statusResponse =
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

          const statusResult =
            await statusResponse
              .json()
              .catch(
                () => null
              )

          if (
            statusResponse.ok &&
            statusResult?.ok &&
            statusResult?.active
          ) {
            return
          }

          await subscription
            .unsubscribe()

          subscription =
            await registration
              .pushManager
              .subscribe({
                userVisibleOnly:
                  true,

                applicationServerKey:
                  urlBase64ToUint8Array(
                    publicKey
                  ),
              })

          const subscribeResponse =
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

          const subscribeResult =
            await subscribeResponse
              .json()
              .catch(
                () => null
              )

          if (
            !subscribeResponse.ok ||
            !subscribeResult?.ok
          ) {
            throw new Error(
              subscribeResult?.error ||
                'Push repair failed'
            )
          }

          console.log(
            'Verlo Push subscription repaired'
          )
        } catch (
          error
        ) {
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
    },
    []
  )

  return null
}
