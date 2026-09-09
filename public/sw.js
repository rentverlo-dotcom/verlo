self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let data = {}

  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {
      title: "Verlo",
      body: event.data ? event.data.text() : "",
    }
  }

  const title = data.title || "Verlo"

  const options = {
    body: data.body || "",
    icon: "/logo-verlo.png",
    badge: "/logo-verlo.png",
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url =
    event.notification?.data?.url || "/"

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }

      return clients.openWindow(url)
    })
  )
})
