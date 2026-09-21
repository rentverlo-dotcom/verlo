import { test, expect } from "@playwright/test"

test("abre Verlo", async ({ page }) => {
  await page.goto("/")

  await expect(page).toHaveURL(/verlo\.lat|vercel\.app/)
})

test("PWA expone manifest y service worker", async ({ page, request }) => {
  const manifestResponse =
    await request.get("/manifest.webmanifest")

  expect(manifestResponse.status()).toBe(200)

  const manifest =
    await manifestResponse.json()

  expect(manifest.name).toBe("Verlo")
  expect(manifest.short_name).toBe("Verlo")
  expect(manifest.display).toBe("standalone")
  expect(manifest.start_url).toBe("/")
  expect(Array.isArray(manifest.icons)).toBe(true)
  expect(manifest.icons.length).toBeGreaterThan(0)

  const swResponse =
    await request.get("/sw.js")

  expect(swResponse.status()).toBe(200)

  const swText =
    await swResponse.text()

  expect(swText).toContain('self.addEventListener("push"')
  expect(swText).toMatch(/self\.addEventListener\(\s*["']notificationclick["']/)

  await page.goto("/success?role=tenant&lead=test")

  const registration =
    await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return null
      }

      const ready =
        await navigator.serviceWorker.ready

      return {
        scope:
          ready.scope,
        scriptURL:
          ready.active?.scriptURL || null,
      }
    })

  expect(registration).not.toBeNull()
  expect(registration?.scriptURL).toContain("/sw.js")
})
