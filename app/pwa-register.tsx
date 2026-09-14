'use client'

import {
  useEffect,
} from 'react'

const PUSH_LEAD_STORAGE_KEY =
  'verlo_push_lead_id'

const PUSH_ROLE_STORAGE_KEY =
  'verlo_push_role'

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

          const subscription =
            await registration
              .pushManager
              .getSubscription()

          if (
            !subscription
          ) {
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
