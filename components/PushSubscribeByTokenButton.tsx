'use client'

import { useState } from 'react'

type Props = {
  token: string
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

  const base64 =
    (base64String + padding)
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

export default function PushSubscribeByTokenButton({
  token,
  role,
}: Props) {
  const [status, setStatus] =
    useState<
      'idle' |
      'loading' |
      'success' |
      'error'
    >('idle')

  async function activatePush() {
    try {
      setStatus('loading')

      if (
        !('serviceWorker' in navigator)
      ) {
        throw new Error(
          'Service Worker no disponible'
        )
      }

      if (
        !('PushManager' in window)
      ) {
        throw new Error(
          'Web Push no disponible'
        )
      }

      const permission =
        await Notification.requestPermission()

      if (
        permission !== 'granted'
      ) {
        throw new Error(
          'Permiso de notificaciones rechazado'
        )
      }

      const registration =
        await navigator.serviceWorker.ready

      let subscription =
        await registration
          .pushManager
          .getSubscription()

      if (!subscription) {
        const publicKey =
          process.env
            .NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (!publicKey) {
          throw new Error(
            'Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY'
          )
        }

        subscription =
          await registration
            .pushManager
            .subscribe({
              userVisibleOnly: true,
              applicationServerKey:
                urlBase64ToUint8Array(
                  publicKey
                ),
            })
      }

      const response =
        await fetch(
          '/api/push/subscribe-by-token',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              token,
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
            'No se pudo registrar la notificación'
        )
      }

      setStatus('success')
    } catch (error) {
      console.error(
        'Push activation error',
        error
      )

      setStatus('error')
    }
  }

  return (
    <button
      type="button"
      onClick={activatePush}
      disabled={
        status === 'loading' ||
        status === 'success'
      }
    >
      {status === 'loading'
        ? 'Activando...'
        : status === 'success'
          ? 'Notificaciones activadas'
          : status === 'error'
            ? 'Reintentar notificaciones'
            : 'Activar notificaciones'}
    </button>
  )
}
