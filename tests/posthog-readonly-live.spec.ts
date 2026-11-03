import { test, expect } from "@playwright/test"

/**
 * Read-only production observation. Uses stubbed PostHog transport and blocks
 * all mutation requests; no synthetic leads, no real analytics, no emails.
 */
const origin = process.env.VERLO_QA_ORIGIN || "https://verlo.lat"
const pages: Array<{ path: string; area: string; stage: string }> = [
  { path: "/", area: "tradicionales", stage: "discovery" },
  { path: "/buscar", area: "tradicionales", stage: "form" },
  { path: "/propietario/publicar-v2", area: "tradicionales", stage: "form" },
  { path: "/temporarios", area: "temporarios", stage: "discovery" },
  { path: "/temporarios/buscar", area: "temporarios", stage: "search_form" },
  { path: "/temporarios/publicar", area: "temporarios", stage: "publish_form" },
  { path: "/caucion/solicitar", area: "powermarket", stage: "application" },
  { path: "/powermarket", area: "powermarket", stage: "partner_dashboard" },
  { path: "/mi-verlo", area: "tradicionales", stage: "dashboard" },
  { path: "/temporarios/mi-verlo", area: "temporarios", stage: "dashboard" },
]

for (const { path, area, stage } of pages) {
  test(`read-only ${path} emits category without leaking private data`, async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as typeof window & {
        __verloCaptured?: Array<{ event: string; properties: Record<string, unknown> }>
        posthog?: unknown
      }
      w.__verloCaptured = []
      w.posthog = {
        capture: (event: string, properties: Record<string, unknown>) =>
          w.__verloCaptured!.push({ event, properties }),
        identify: () => undefined,
      }
    })
    await page.route("**/*", async route => {
      const request = route.request()
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
        await route.fulfill({ status: 403, body: "Read-only automated QA" })
        return
      }
      // Avoid calling external analytics in automated QA.
      if (/posthog|\/e\/\?|\/batch\/|\/capture\/|\/decide\/\?/.test(request.url())) {
        await route.fulfill({ status: 204, body: "" })
        return
      }
      await route.continue()
    })
    const response = await page.goto(origin + path, { waitUntil: "domcontentloaded" })
    expect(response?.status()).toBeLessThan(500)
    await expect.poll(async () => page.evaluate(() => {
      const w = window as typeof window & {
        __verloCaptured?: Array<{ event: string; properties: Record<string, unknown> }>
      }
      return w.__verloCaptured?.find(x => x.event === "verlo_screen_viewed")?.properties || null
    }), { timeout: 10000 }).toMatchObject({ area, stage })

    const events = await page.evaluate(() => {
      const w = window as typeof window & {
        __verloCaptured?: Array<{ event: string; properties: Record<string, unknown> }>
      }
      return w.__verloCaptured || []
    })
    for (const event of events) {
      const props = JSON.stringify(event.properties)
      expect(props).not.toContain("access=")
      expect(props).not.toContain("Bearer ")
      expect(props).not.toContain("password")
    }
  })
}
