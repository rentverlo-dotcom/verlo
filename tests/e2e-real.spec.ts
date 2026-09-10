import { test, expect } from "@playwright/test"

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx7sAAAAASUVORK5CYII=",
  "base64"
)

test("E2E REAL Verlo: Juan owner + Alejandro tenant generan match real", async ({ page, context }) => {
  test.setTimeout(120_000)

  await context.grantPermissions(
    ["notifications"],
    { origin: "https://verlo.lat" }
  )

  // ============================================================
  // 1. OWNER REAL: JUAN MANUEL ODDONE
  // ============================================================

  await page.goto("/", {
    waitUntil: "domcontentloaded",
  })

  await page
    .locator("button.path-card")
    .filter({
      hasText: "Tengo una propiedad",
    })
    .click()

  await page
    .locator('input[name="full_name"]')
    .fill("Juan Manuel Oddone")

  await page
    .locator('input[name="phone"]')
    .fill("1133614865")

  await page
    .locator('input[name="email"]')
    .fill("juancho12oddone@gmail.com")

 await page
  .locator('select[name="property_neighborhood"]')
  .selectOption({ label: "Munro" })

  await page
    .locator('select[name="property_type"]')
    .selectOption({
      label: "Departamento",
    })

  await page
    .locator('select[name="property_rooms"]')
    .selectOption({
      label: "2 ambientes",
    })

  await page
    .locator('select[name="approx_price"]')
    .selectOption("700001-900000")

  await page
    .locator('select[name="availability_status"]')
    .selectOption("En 1 a 3 meses")

  await page
    .locator(
      'input[name="accepted_income_proof_types"][value="salary_receipt"]'
    )
    .check()

  const minIncomeRatio =
    page.locator(
      '[name="min_income_ratio"]'
    )

  if (
    await minIncomeRatio.count()
  ) {
    const tagName =
      await minIncomeRatio.evaluate(
        (element) =>
          element.tagName.toLowerCase()
      )

    if (
      tagName === "select"
    ) {
      await minIncomeRatio.selectOption("2")
    } else {
      await minIncomeRatio.fill("2")
    }
  }

  await page
    .locator(
      'input[name="accepted_guarantee_types"][value="surety_insurance"]'
    )
    .check()

  const ownerFileInput =
    page.locator(
      'input[type="file"][accept="image/*,video/*"]'
    )

  await expect(
    ownerFileInput
  ).toHaveCount(1)

  await ownerFileInput.setInputFiles([
    {
      name: "verlo-owner-1.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    },
    {
      name: "verlo-owner-2.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    },
    {
      name: "verlo-owner-3.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    },
  ])

  const ownerIntakePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes(
          "/api/lead-intake"
        ) &&
        response.request().method() ===
          "POST"
    )

  await page
    .getByRole("button", {
      name: /Cargar mi propiedad/i,
    })
    .click()

  const ownerIntakeResponse =
    await ownerIntakePromise

  expect(
    ownerIntakeResponse.status()
  ).toBe(200)

  const ownerData =
    await ownerIntakeResponse.json()

  expect(
    ownerData?.ok
  ).toBe(true)

  expect(
    ownerData?.lead_id
  ).toBeTruthy()

  console.log(
    "OWNER LEAD:",
    ownerData.lead_id
  )

  await page.waitForTimeout(5000)

  // ============================================================
  // 2. TENANT REAL: ALEJANDRO DEVINCENZI
  // ============================================================

  await page.goto("/", {
    waitUntil: "domcontentloaded",
  })

  await page
    .locator("button.path-card")
    .filter({
      hasText: "Busco alquilar",
    })
    .click()

  await page
    .locator('input[name="full_name"]')
    .fill("Alejandro Devincenzi")

  await page
    .locator('input[name="phone"]')
    .fill("1154217300")

  await page
    .locator('input[name="email"]')
    .fill("aedevincenzi@gmail.com")
await page
  .locator('select[name="property_neighborhood"]')
  .selectOption({ label: "Munro" })

  await page
    .locator(
      'select[name="desired_property_type"]'
    )
    .selectOption({
      label: "Departamento",
    })

  await page
    .locator(
      'select[name="desired_rooms"]'
    )
    .selectOption({
      label: "2 ambientes",
    })

  await page
    .locator(
      'select[name="budget_range"]'
    )
    .selectOption(
      "700001-900000"
    )

  await page
    .locator(
      'select[name="move_timing"]'
    )
    .selectOption(
      "En 1 a 3 meses"
    )

  await page
    .locator(
      'select[name="income_proof_type"]'
    )
    .selectOption(
      "salary_receipt"
    )

  await page
    .locator(
      'select[name="income_range"]'
    )
    .selectOption(
      "2000001-3000000"
    )

  await page
    .locator(
      'input[name="guarantee_types"][value="surety_insurance"]'
    )
    .check()

  const tenantIntakePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes(
          "/api/lead-intake"
        ) &&
        response.request().method() ===
          "POST"
    )

  await page
    .getByRole("button", {
      name: "Cargar mi búsqueda",
    })
    .click()

  const tenantIntakeResponse =
    await tenantIntakePromise

  expect(
    tenantIntakeResponse.status()
  ).toBe(200)

  const tenantData =
    await tenantIntakeResponse.json()

  expect(
    tenantData?.ok
  ).toBe(true)

  expect(
    tenantData?.lead_id
  ).toBeTruthy()

  console.log(
    "TENANT LEAD:",
    tenantData.lead_id
  )

  console.log(
    "MATCH RESULT:",
    JSON.stringify(
      tenantData?.match_result,
      null,
      2
    )
  )

  console.log(
    "MATCH SUMMARY:",
    JSON.stringify(
      tenantData?.match_summary,
      null,
      2
    )
  )

  expect(
    tenantData?.match_result?.ok
  ).not.toBe(false)

  expect(
    Number(
      tenantData?.match_result?.created ||
        0
    )
  ).toBeGreaterThan(0)
})
