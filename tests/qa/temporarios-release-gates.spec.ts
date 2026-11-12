import { test, expect, devices } from "@playwright/test"
import { readFileSync } from "node:fs"

const read = (name: string) => readFileSync(name, "utf8")

test("Temporarios: production migration changes new fee to 49999 without rewriting older test records", () => {
  const sql = read("docs/temporarios/production-release-49999-and-rejected.sql")
  const prepare = read("app/api/temporarios/payments/prepare/route.ts")
  expect(sql).toContain("SET DEFAULT 49999")
  expect(sql).toContain("amount_ars = 49999")
  expect(sql).toContain("amount_ars = 29900")
  expect(sql).toContain("created_at < TIMESTAMPTZ")
  expect(sql).toContain("'rejected'")
  expect(sql).toContain("SET LOCAL lock_timeout")
  expect(sql).not.toMatch(/\bDELETE\s+FROM\s+public\.temporary_payment_attempts\b/i)
  expect(sql).not.toMatch(/\bUPDATE\s+public\.temporary_payment_attempts\b/i)
  expect(prepare).toContain("const FEE=49999")
})

test("Temporarios: entry clearly separates rent from VERLO contract fee", async ({ page }) => {
  await page.goto("/temporarios", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("link", { name: "Busco alojamiento" })).toHaveAttribute("href", "/temporarios/buscar")
  await expect(page.getByRole("link", { name: "Quiero publicar" })).toHaveAttribute("href", "/temporarios/publicar")
  await expect(page.locator("main")).toContainText("49.999")
  await expect(page.locator("main")).toContainText(/transfiere directamente al propietario/i)
  await expect(page.locator("main")).toContainText(/propietarios: gratis/i)
})

test.describe("Temporarios: mobile onboarding smoke with no writes", () => {
  test.use({ ...devices["Pixel 7"] })
  test("tenant and owner forms render on real mobile viewport", async ({ page }) => {
    let writes = 0
    page.on("request", request => {
      if (request.method() !== "GET" && /\/api\/temporarios\//.test(request.url())) writes++
    })
    await page.goto("/temporarios/buscar", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { name: /Elegí tus fechas/i })).toBeVisible()
    await page.goto("/temporarios/publicar", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { name: /Publicá directo/i })).toBeVisible()
    expect(writes).toBe(0)
  })
})
