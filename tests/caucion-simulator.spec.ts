import { expect, test } from "@playwright/test"

// Read-only smoke tests: no production leads, payments or user records are created.
// Run against a preview with PLAYWRIGHT_BASE_URL set to that exact deployment.
test.describe("Caucion simulator · VerloBrand", () => {
  test("shows the official VERLO logo and never invents the caucion premium", async ({ page }) => {
    await page.goto("/caucion/simular")
    await expect(page.getByRole("heading", { name: /alquilá con respaldo/i })).toBeVisible()
    await expect(page.locator('header img[src="/logo-verlo.png"]')).toBeVisible()
    await expect(page.getByText(/powermarket/i)).toHaveCount(0)
    await page.getByLabel("Alquiler mensual (ARS)").fill("650000")
    await page.getByLabel("Expensas (ARS)").fill("80000")
    await page.getByLabel("Duración del contrato (meses)").fill("24")
    await page.getByRole("button", { name: "Descubrí tu opción" }).click()
    await expect(page.getByText("A cotizar")).toBeVisible()
    await expect(page.getByRole("button", { name: "Quiero avanzar" })).toBeVisible()
  })

  test("offers the optional contract and shows its conditional discount", async ({ page }) => {
    await page.goto("/caucion/simular?utm_source=meta&utm_campaign=caucion")
    await page.getByLabel("Alquiler mensual (ARS)").fill("650000")
    await page.getByLabel("Expensas (ARS)").fill("0")
    await page.getByLabel("Duración del contrato (meses)").fill("24")
    await page.getByText("Caución + contrato digital de alquiler con firma electrónica").click()
    await page.getByRole("button", { name: "Descubrí tu opción" }).click()
    await expect(page.getByText("Con bonificación:", { exact: false })).toContainText("59.500")
    await expect(page.getByText(/50% de descuento aplica únicamente con caución confirmada/i)).toBeVisible()
    await page.getByRole("button", { name: "Quiero avanzar" }).click()
    await expect(page).toHaveURL(/\/permanentes\?.*utm_source=meta/)
    const stored = await page.evaluate(() => sessionStorage.getItem("verlo_caucion_simulation"))
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored || "{}").choice).toBe("caucion_con_contrato")
    await expect(page.locator('input[name="request_caucion"]')).toBeChecked()
    await expect(page.locator('input[name="guarantee_types"][value="surety_insurance"]')).toBeChecked()
  })


  test("regular form stays unchecked for direct visitors", async ({ page }) => {
    await page.goto("/permanentes")
    await expect(page.locator('input[name="request_caucion"]')).not.toBeChecked()
  })

  test("prefills application only with valid simulator session and hides provider name", async ({ page }) => {
    await page.goto("/caucion/simular")
    await page.evaluate(() => sessionStorage.setItem("verlo_caucion_simulation", JSON.stringify({
      choice: "solo_caucion", rent: 650000, expenses: 80000, months: 24, timestamp: Date.now(),
    })))
    await page.goto("/caucion/solicitar?access=test-invalid-readonly")
    await expect(page.getByRole("heading", { name: /precalificá tu seguro de caución/i })).toBeVisible()
    await expect(page.locator('input[type="number"]').nth(0)).toHaveValue("650000")
    await expect(page.locator('input[type="number"]').nth(1)).toHaveValue("80000")
    await expect(page.locator('input[type="number"]').nth(2)).toHaveValue("24")
    await expect(page.getByText(/powermarket/i)).toHaveCount(0)
  })

  test("shows the same form on mobile without horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/caucion/simular")
    await expect(page.locator('header img[src="/logo-verlo.png"]')).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  })
})
