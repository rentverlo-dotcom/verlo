import { expect, test } from "@playwright/test"

// Read-only smoke tests: no production leads, payments or user records are created.
// Run against a preview with PLAYWRIGHT_BASE_URL set to that exact deployment.
test.describe("Caucion simulator · VerloBrand", () => {
  test("shows the official VERLO logo and never invents the caucion premium", async ({ page }) => {
    await page.goto("/caucion/simular")
    await expect(page.getByRole("heading", { name: /tu garantía para alquilar/i })).toBeVisible()
    await expect(page.locator('header img[src="/logo-verlo.png"]')).toBeVisible()
    await page.getByLabel("Alquiler mensual (ARS)").fill("650000")
    await page.getByLabel("Expensas mensuales (ARS)").fill("80000")
    await page.getByLabel("Duración del contrato (meses)").fill("24")
    await page.getByRole("button", { name: "Ver mi simulación" }).click()
    await expect(page.getByText("Pendiente de cotización")).toBeVisible()
    await expect(page.getByRole("button", { name: "Continuar en VERLO" })).toBeVisible()
  })

  test("offers the optional contract and shows its conditional discount", async ({ page }) => {
    await page.goto("/caucion/simular?utm_source=meta&utm_campaign=caucion")
    await page.getByLabel("Alquiler mensual (ARS)").fill("650000")
    await page.getByLabel("Expensas mensuales (ARS)").fill("0")
    await page.getByLabel("Duración del contrato (meses)").fill("24")
    await page.getByText("Caución + contrato digital VERLO").click()
    await page.getByRole("button", { name: "Ver mi simulación" }).click()
    await expect(page.getByText("Contrato bonificado:", { exact: false })).toContainText("59.500")
    await expect(page.getByText(/solo se aplica si la caución powermarket está pagada/i)).toBeVisible()
    await page.getByRole("button", { name: "Continuar en VERLO" }).click()
    await expect(page).toHaveURL(/\/permanentes\?.*utm_source=meta/)
    const stored = await page.evaluate(() => sessionStorage.getItem("verlo_caucion_simulation"))
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored || "{}").choice).toBe("caucion_con_contrato")
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
