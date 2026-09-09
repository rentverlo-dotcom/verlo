import { test, expect } from "@playwright/test"

test("tenant completa la búsqueda y envía el payload correcto", async ({ page }) => {
  let capturedPayload: Record<string, unknown> | null = null

  await page.route("**/api/ghl-lead-webhook", async (route) => {
    capturedPayload = route.request().postDataJSON()

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        lead_id: "e2e-tenant-lead",
      }),
    })
  })

  await page.goto("/")

  await page.locator('input[name="full_name"]').fill("Tenant E2E Verlo")
  await page.locator('input[name="phone"]').fill("11 5555 0101")
  await page.locator('input[name="email"]').fill("tenant.e2e@example.com")

  await page.getByLabel("Palermo", { exact: true }).check()
  await page.getByLabel("Belgrano", { exact: true }).check()

  await page
    .locator('select[name="desired_property_type"]')
    .selectOption({ label: "Departamento" })

  await page
    .locator('select[name="desired_rooms"]')
    .selectOption({ label: "2 ambientes" })

  await page
    .locator('select[name="budget_range"]')
    .selectOption("500001-700000")

  await page
    .locator('select[name="move_timing"]')
    .selectOption("En 1 a 3 meses")

  await page
    .locator('select[name="income_proof_type"]')
    .selectOption("salary_receipt")

  await page
    .locator('select[name="income_range"]')
    .selectOption("1000001-1500000")

  await page.getByLabel("Seguro de caución", { exact: true }).check()

  await page
    .getByRole("button", { name: "Cargar mi búsqueda" })
    .click()

  expect(capturedPayload).toMatchObject({
    full_name: "Tenant E2E Verlo",
    email: "tenant.e2e@example.com",
    phone: "11 5555 0101",
    role: "tenant",
    intent: "tenant_search",
    zone: "Palermo, Belgrano",
    desired_property_type: "Departamento",
    desired_rooms: "2 ambientes",
    budget_range: "500001-700000",
    budget_max: 700000,
    move_timing: "En 1 a 3 meses",
    income_proof_type: "salary_receipt",
    income_range: "1000001-1500000",
    income_max: 1500000,
    guarantee_types: ["surety_insurance"],
    source: "verlo_home",
  })
})
