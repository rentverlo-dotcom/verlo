self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

async function sendPushAck(
  deliveryId,
  stage
) {
  if (!deliveryId) {
    return
  }

  try {
    await fetch(
      "/api/push/ack",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            delivery_id:
              deliveryId,

            stage,
          }),
      }
    )
  } catch (error) {
    console.error(
      "Push ACK failed",
      {
        deliveryId,
        stage,
        error,
      }
    )
  }
}

self.addEventListener("push", (event) => {
  let data = {}

  try {
    data =
      event.data
        ? event.data.json()
        : {}
  } catch {
    data = {
      title:
        "Verlo",

      body:
        event.data
          ? event.data.text()
          : "",
    }
  }

  const title =
    data.title ||
    "Verlo"

  const deliveryId =
    data.delivery_id ||
    null

  const options = {
    body:
      data.body ||
      "",

    icon:
      "/logo-verlo.png",

    badge:
      "/logo-verlo.png",

    data: {
      url:
        data.url ||
        "/",

      delivery_id:
        deliveryId,

      lead_id:
        data.lead_id ||
        null,

      subscription_id:
        data.subscription_id ||
        null,
    },
  }

  event.waitUntil(
    (async () => {
      await sendPushAck(
        deliveryId,
        "delivered"
      )

      await self.registration
        .showNotification(
          title,
          options
        )

      await sendPushAck(
        deliveryId,
        "displayed"
      )
    })()
  )
})

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close()

    const url =
      event.notification
        ?.data
        ?.url ||
      "/"

    const deliveryId =
      event.notification
        ?.data
        ?.delivery_id ||
      null

    event.waitUntil(
      (async () => {
        await sendPushAck(
          deliveryId,
          "clicked"
        )

        const clientList =
          await clients.matchAll({
            type:
              "window",

            includeUncontrolled:
              true,
          })

        for (
          const client
          of clientList
        ) {
          if (
            "focus"
            in client
          ) {
            await client.navigate(
              url
            )

            return client.focus()
          }
        }

        return clients.openWindow(
          url
        )
      })()
    )
  }
)
