'use client'

import {
  useEffect,
  useState,
} from 'react'

type Props = {
  leadId: string
  role: 'tenant' | 'owner'
}

type Status =
  | 'idle'
  | 'checking'
  | 'loading'
  | 'success'
  | 'error'

const PUSH_LEAD_STORAGE_KEY =
  'verlo_push_lead_id'

const PUSH_ROLE_STORAGE_KEY =
  'verlo_push_role'

function savePushIdentity(
  leadId: string,
  role: 'tenant' | 'owner'
) {
  try {
    window.localStorage.setItem(
      PUSH_LEAD_STORAGE_KEY,
      leadId
    )

    window.localStorage.setItem(
      PUSH_ROLE_STORAGE_KEY,
      role
    )
  } catch (error) {
    console.error(
      'push identity storage error:',
      error
    )
  }
}

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

export default function PushSubscribeButton({
  leadId,
  role,
}: Props) {
  const [
    status,
    setStatus,
  ] =
    useState<Status>(
      'checking'
    )

  async function getRegistration() {
    if (
      !(
        'serviceWorker'
        in navigator
      )
    ) {
      throw new Error(
        'Este dispositivo no soporta notificaciones.'
      )
    }

    if (
      !(
        'PushManager'
        in window
      )
    ) {
      throw new Error(
        'Este navegador no soporta Web Push.'
      )
    }

    return (
      await navigator
        .serviceWorker
        .ready
    )
  }

  async function createSubscription(
    registration:
      ServiceWorkerRegistration
  ) {
    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (
      !publicKey
    ) {
      throw new Error(
        'Falta la clave pública VAPID.'
      )
    }

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

  async function getBackendStatus(
    subscription:
      PushSubscription
  ) {
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
          'No pudimos comprobar las notificaciones.'
      )
    }

    return result
  }

  async function registerSubscription(
    subscription:
      PushSubscription
  ) {
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
          'No se pudo activar.'
      )
    }

    return result
  }

  async function repairSubscription(
    registration:
      ServiceWorkerRegistration,
    oldSubscription?:
      PushSubscription | null
  ) {
    if (
      oldSubscription
    ) {
      try {
        await oldSubscription
          .unsubscribe()
      } catch (
        error
      ) {
        console.error(
          'push unsubscribe error:',
          error
        )
      }
    }

    const freshSubscription =
      await createSubscription(
        registration
      )

    const result =
      await registerSubscription(
        freshSubscription
      )

    if (
      subscriptionFailed(
        result,
        leadId
      )
    ) {
      try {
        await freshSubscription
          .unsubscribe()
      } catch (
        error
      ) {
        console.error(
          'fresh push unsubscribe error:',
          error
        )
      }

      throw new Error(
        'La suscripción Push fue rechazada. Volvé a intentar.'
      )
    }

    savePushIdentity(
      leadId,
      role
    )

    return freshSubscription
  }

  async function activatePush() {
    try {
      setStatus(
        'loading'
      )

      if (
        !(
          'Notification'
          in window
        )
      ) {
        throw new Error(
          'Este navegador no soporta notificaciones.'
        )
      }

      const permission =
        await Notification
          .requestPermission()

      if (
        permission !==
        'granted'
      ) {
        throw new Error(
          'No se habilitaron las notificaciones.'
        )
      }

      savePushIdentity(
        leadId,
        role
      )

      const registration =
        await getRegistration()

      let subscription =
        await registration
          .pushManager
          .getSubscription()

      if (
        subscription
      ) {
        const backendStatus =
          await getBackendStatus(
            subscription
          )

        if (
          backendStatus
            .active
        ) {
          savePushIdentity(
            leadId,
            role
          )

          setStatus(
            'success'
          )

          return
        }

        subscription =
          await repairSubscription(
            registration,
            subscription
          )

        setStatus(
          'success'
        )

        return
      }

      subscription =
        await createSubscription(
          registration
        )

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
        await repairSubscription(
          registration,
          subscription
        )
      }

      savePushIdentity(
        leadId,
        role
      )

      setStatus(
        'success'
      )
    } catch (error) {
      console.error(
        error
      )

      setStatus(
        'error'
      )
    }
  }

  useEffect(() => {
    let cancelled =
      false

    async function checkPush() {
      try {
        savePushIdentity(
          leadId,
          role
        )

        if (
          typeof window ===
            'undefined' ||
          !(
            'Notification'
            in window
          ) ||
          !(
            'serviceWorker'
            in navigator
          ) ||
          !(
            'PushManager'
            in window
          )
        ) {
          if (
            !cancelled
          ) {
            setStatus(
              'idle'
            )
          }

          return
        }

        if (
          Notification
            .permission !==
          'granted'
        ) {
          if (
            !cancelled
          ) {
            setStatus(
              'idle'
            )
          }

          return
        }

        const registration =
          await getRegistration()

        const subscription =
          await registration
            .pushManager
            .getSubscription()

        if (
          !subscription
        ) {
          if (
            !cancelled
          ) {
            setStatus(
              'idle'
            )
          }

          return
        }

        const backendStatus =
          await getBackendStatus(
            subscription
          )

        if (
          cancelled
        ) {
          return
        }

        if (
          backendStatus
            .active
        ) {
          savePushIdentity(
            leadId,
            role
          )

          setStatus(
            'success'
          )

          return
        }

        setStatus(
          'loading'
        )

        await repairSubscription(
          registration,
          subscription
        )

        if (
          !cancelled
        ) {
          setStatus(
            'success'
          )
        }
      } catch (error) {
        console.error(
          'push health check error:',
          error
        )

        if (
          !cancelled
        ) {
          setStatus(
            'error'
          )
        }
      }
    }

    checkPush()

    return () => {
      cancelled =
        true
    }
  }, [
    leadId,
    role,
  ])

  if (
    status ===
    'success'
  ) {
    return (
      <button
        type="button"
        disabled
      >
        Notificaciones activadas
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={
        activatePush
      }
      disabled={
        status ===
          'loading' ||
        status ===
          'checking'
      }
    >
      {status ===
      'checking'
        ? 'Comprobando notificaciones...'
        : status ===
            'loading'
          ? 'Activando...'
          : status ===
              'error'
            ? 'Reintentar notificaciones'
            : 'Activar notificaciones'}
    </button>
  )
}
