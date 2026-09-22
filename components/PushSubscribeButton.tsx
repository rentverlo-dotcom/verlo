'use client'

import {
  useEffect,
  useState,
} from 'react'

type Props = {
  leadId: string
  role:
    | 'tenant'
    | 'owner'
}

type Status =
  | 'checking'
  | 'idle'
  | 'loading'
  | 'success'
  | 'install_required'
  | 'unsupported'
  | 'error'

const PUSH_LEAD_STORAGE_KEY =
  'verlo_push_lead_id'

const PUSH_ROLE_STORAGE_KEY =
  'verlo_push_role'

function savePushIdentity(
  leadId: string,
  role:
    | 'tenant'
    | 'owner'
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
  } catch (
    error
  ) {
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
                subscription.endpoint,
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

    return Boolean(
      result.active
    )
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
          'No se pudo registrar el dispositivo.'
      )
    }

    return result
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
        const active =
          await getBackendStatus(
            subscription
          )

        if (
          !active
        ) {
          await subscription
            .unsubscribe()

          subscription =
            await createSubscription(
              registration
            )
        }
      } else {
        subscription =
          await createSubscription(
            registration
          )
      }

      await registerSubscription(
        subscription
      )

      setStatus(
        'success'
      )
    } catch (
      error
    ) {
      console.error(
        'push activation error:',
        error
      )

      setStatus(
        'error'
      )
    }
  }

  useEffect(
    () => {
      let cancelled =
        false

      async function checkPush() {
        try {
          if (
            typeof window ===
              'undefined'
          ) {
            return
          }

          const iosLike =
            /iphone|ipad|ipod/i.test(
              window.navigator.userAgent
            ) ||
            (
              window.navigator.platform ===
                'MacIntel' &&
              window.navigator.maxTouchPoints >
                1
            )

          const standalone =
            window.matchMedia(
              '(display-mode: standalone)'
            ).matches ||
            (
              window.navigator as Navigator & {
                standalone?: boolean
              }
            ).standalone ===
              true

          if (
            iosLike &&
            !standalone
          ) {
            if (!cancelled) {
              setStatus(
                'install_required'
              )
            }
            return
          }

          if (
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
            if (!cancelled) {
              setStatus(
                'unsupported'
              )
            }
            return
          }

          // IMPORTANTE:
          // permiso del navegador != suscripción Verlo para este lead.
          // Nunca registramos ni re-vinculamos automáticamente.
          if (
            Notification
              .permission !==
            'granted'
          ) {
            if (!cancelled) {
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
            if (!cancelled) {
              setStatus(
                'idle'
              )
            }
            return
          }

          const active =
            await getBackendStatus(
              subscription
            )

          if (!cancelled) {
            setStatus(
              active
                ? 'success'
                : 'idle'
            )
          }
        } catch (
          error
        ) {
          console.error(
            'push status check error:',
            error
          )

          if (!cancelled) {
            setStatus(
              'idle'
            )
          }
        }
      }

      checkPush()

      return () => {
        cancelled =
          true
      }
    },
    [
      leadId,
      role,
    ]
  )

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
          'checking' ||
        status ===
          'install_required' ||
        status ===
          'unsupported'
      }
    >
      {
        status ===
        'checking'
          ? 'Comprobando notificaciones...'
          : status ===
              'loading'
            ? 'Activando...'
            : status ===
                'install_required'
              ? 'Instalá Verlo para activar notificaciones'
              : status ===
                  'unsupported'
                ? 'Notificaciones no compatibles'
                : status ===
                    'error'
                  ? 'Reintentar notificaciones'
                  : 'Activar notificaciones'
      }
    </button>
  )
}
