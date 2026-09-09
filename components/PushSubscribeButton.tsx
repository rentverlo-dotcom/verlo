'use client'

import { useState } from 'react'

type Props = {
  leadId: string
  role: 'tenant' | 'owner'
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
    base64String + padding
  )
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData =
    window.atob(base64)

  const outputArray =
    new Uint8Array(
      rawData.length
    )

  for (
    let i = 0;
    i < rawData.length;
    i += 1
  ) {
    outputArray[i] =
      rawData.charCodeAt(i)
  }

  return outputArray
}

export default function PushSubscribeButton({
  leadId,
  role,
}: Props) {
  const [status, setStatus] =
    useState('idle')

  async function activatePush() {
    try {
      setStatus('loading')

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

      const permission =
        await Notification.requestPermission()

      if (
        permission !==
        'granted'
      ) {
        throw new Error(
          'No se habilitaron las notificaciones.'
        )
      }

      const registration =
        await navigator.serviceWorker.ready

      let subscription =
        await registration.pushManager.getSubscription()

      if (!subscription) {
        const publicKey =
          process.env
            .NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (!publicKey) {
          throw new Error(
            'Falta la clave pública VAPID.'
          )
        }

        subscription =
          await registration.pushManager.subscribe(
            {
              userVisibleOnly:
                true,
              applicationServerKey:
                urlBase64ToUint8Array(
                  publicKey
                ),
            }
          )
      }

      const response =
        await fetch(
          '/api/push/subscribe',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              lead_id: leadId,
              role,
              subscription:
                subscription.toJSON(),
            }),
          }
        )

      const result =
        await response.json()

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            'No se pudo activar.'
        )
      }

      setStatus('success')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  if (
    status === 'success'
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
      onClick={activatePush}
      disabled={
        status === 'loading'
      }
    >
      {status === 'loading'
        ? 'Activando...'
        : status === 'error'
          ? 'Reintentar notificaciones'
          : 'Activar notificaciones'}
    </button>
  )
}
