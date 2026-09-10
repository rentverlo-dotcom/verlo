import { test, expect } from "@playwright/test"

test("E2E MATCH REAL Verlo", async ({ page }) => {
  test.setTimeout(120_000)

  await page.route("**/api/ghl-lead-webhook", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, lead_id: "e2e-test-lead" }),
    })
  })


  // =========================
  // OWNER
  // =========================

  await page.goto("/")

  await page
    .getByText("Tengo una propiedad", { exact: true })
    .first()
    .click()

  await page.locator('[name="full_name"]').fill("Juan Manuel Oddone")
  await page.locator('[name="phone"]').fill("1133614865")
  await page.locator('[name="email"]').fill("juancho12oddone@gmail.com")

  await page.locator('[name="owner_neighborhood"]').selectOption({
    label: "Munro",
  })

  await page.locator('[name="property_type"]').selectOption({
    label: "Departamento",
  })

  await page.locator('[name="property_rooms"]').selectOption({
    label: "2 ambientes",
  })

  await page
    .locator('[name="approx_price"]')
    .selectOption("700001-900000")

  await page
    .locator('[name="availability_status"]')
    .selectOption("En 1 a 3 meses")

  await page
    .locator(
      '[name="accepted_income_proof_types"][value="salary_receipt"]'
    )
    .check()

  await page
    .locator('[name="min_income_ratio"]')
    .selectOption("2")

  await page
    .locator(
      '[name="accepted_guarantee_types"][value="surety_insurance"]'
    )
    .check()

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  )

  await page.locator('input[type="file"]').setInputFiles([
    {
      name: "propiedad-match-e2e-1.png",
      mimeType: "image/png",
      buffer: png,
    },
    {
      name: "propiedad-match-e2e-2.png",
      mimeType: "image/png",
      buffer: png,
    },
    {
      name: "propiedad-match-e2e-3.png",
      mimeType: "image/png",
      buffer: png,
    },
  ])

  const ownerWebhook = page.waitForResponse(
    r =>
      r.url().includes("/api/ghl-lead-webhook") &&
      r.request().method() === "POST"
  )

  await page
    .getByRole("button", { name: "Publicar mi propiedad" })
    .click()

  expect((await ownerWebhook).ok()).toBeTruthy()

  await expect(
    page.getByText(/Publicamos tu propiedad/i)
  ).toBeVisible({ timeout: 60_000 })

  // =========================
  // TENANT
  // =========================

  await page.goto("/")

  await page
    .getByText("Busco alquilar", { exact: true })
    .first()
    .click()

  await page.locator('[name="full_name"]').fill("Alejandro Devincenzi")
  await page.locator('[name="phone"]').fill("1154217300")
  await page.locator('[name="email"]').fill("aedevincenzi@gmail.com")

  await page.getByRole("button", { name: "GBA Norte" }).click()

  await page
    .locator('[name="tenant_neighborhoods"][value="Munro"]')
    .check()

  await page.locator('[name="desired_property_type"]').selectOption({
    label: "Departamento",
  })

  await page.locator('[name="desired_rooms"]').selectOption({
    label: "2 ambientes",
  })

  await page
    .locator('[name="budget_range"]')
    .selectOption("700001-900000")

  await page
    .locator('[name="move_timing"]')
    .selectOption("En 1 a 3 meses")

  await page
    .locator('[name="income_proof_type"]')
    .selectOption("salary_receipt")

  await page
    .locator('[name="income_range"]')
    .selectOption("2000001-3000000")

  await page
    .locator('[name="guarantee_types"][value="surety_insurance"]')
    .check()

  const tenantWebhook = page.waitForResponse(
    r =>
      r.url().includes("/api/ghl-lead-webhook") &&
      r.request().method() === "POST"
  )

  await page
    .getByRole("button", { name: "Cargar mi búsqueda" })
    .click()

  expect((await tenantWebhook).ok()).toBeTruthy()

  await expect(
    page.getByText(/Listo\. Guardamos tus datos/i)
  ).toBeVisible({ timeout: 30_000 })
})
