import { test, expect } from "@playwright/test"

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx7sAAAAASUVORK5CYII=",
  "base64"
)

test(
  "E2E REAL Verlo: Juan + Alejandro hasta doble OK",
  async ({ page, context, request }) => {
    test.setTimeout(180_000)

    await context.grantPermissions(
      ["notifications"],
      { origin: "https://verlo.lat" }
    )

    // =========================================================
    // 1. OWNER — JUAN
    // =========================================================

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
      .locator('select[name="owner_neighborhood"]')
      .selectOption({
        label: "Munro",
      })

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

    await page
      .locator('select[name="min_income_ratio"]')
      .selectOption("2")

    await page
      .locator(
        'input[name="accepted_guarantee_types"][value="surety_insurance"]'
      )
      .check()

    const ownerFileInput = page.locator(
      'input[type="file"][accept="image/*,video/*"]'
    )

    await expect(ownerFileInput).toHaveCount(1)

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
          response.url().includes("/api/lead-intake") &&
          response.request().method() === "POST"
      )

    await page
      .locator('button.submit[type="submit"]')
      .click()

    const ownerIntakeResponse =
      await ownerIntakePromise

    expect(ownerIntakeResponse.status()).toBe(200)

    const ownerData =
      await ownerIntakeResponse.json()

    expect(ownerData?.ok).toBe(true)
    expect(ownerData?.lead_id).toBeTruthy()

    console.log(
      "OWNER LEAD:",
      ownerData.lead_id
    )

    await page.waitForTimeout(4000)

    // =========================================================
    // 2. TENANT — ALEJANDRO
    // =========================================================

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
      .locator("button.area-tab")
      .filter({
        hasText: "GBA Norte",
      })
      .click()

    await page
      .locator(
        'input[name="tenant_neighborhoods"][value="Munro"]'
      )
      .check()

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
      .selectOption("700001-900000")

    await page
      .locator(
        'select[name="move_timing"]'
      )
      .selectOption("En 1 a 3 meses")

    await page
      .locator(
        'select[name="income_proof_type"]'
      )
      .selectOption("salary_receipt")

    await page
      .locator(
        'select[name="income_range"]'
      )
      .selectOption("2000001-3000000")

    await page
      .locator(
        'input[name="guarantee_types"][value="surety_insurance"]'
      )
      .check()

    const tenantIntakePromise =
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/lead-intake") &&
          response.request().method() === "POST"
      )

    await page
      .locator('button.submit[type="submit"]')
      .click()

    const tenantIntakeResponse =
      await tenantIntakePromise

    expect(tenantIntakeResponse.status()).toBe(200)

    const tenantData =
      await tenantIntakeResponse.json()

    expect(tenantData?.ok).toBe(true)
    expect(tenantData?.lead_id).toBeTruthy()

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

    expect(
      Number(
        tenantData?.match_result?.created || 0
      )
    ).toBeGreaterThan(0)

    // =========================================================
    // 3. TOKEN DE MATCHES DEL TENANT
    // =========================================================

    const tokenResponse =
      await request.post(
        "/api/tenant-matches-token",
        {
          data: {
            tenant_lead_id:
              tenantData.lead_id,
          },
        }
      )

    expect(tokenResponse.status()).toBe(200)

    const tokenData =
      await tokenResponse.json()

    expect(tokenData?.ok).toBe(true)
    expect(tokenData?.token).toBeTruthy()
    expect(tokenData?.matches_url).toBeTruthy()

    console.log(
      "TENANT MATCHES URL:",
      tokenData.matches_url
    )

    // =========================================================
    // 4. IDENTIFICAR EXACTAMENTE LA PROPIEDAD NUEVA DE JUAN
    // =========================================================

    const matchesViewResponse =
      await request.get(
        `/api/tenant-matches-view?token=${encodeURIComponent(
          tokenData.token
        )}`
      )

    expect(
      matchesViewResponse.status()
    ).toBe(200)

    const matchesView =
      await matchesViewResponse.json()

    expect(matchesView?.ok).toBe(true)

    const juanMatchIndex =
      (matchesView.matches || []).findIndex(
        (match: any) =>
          (match.media || []).some(
            (media: any) =>
              media.filename ===
              "verlo-owner-1.png"
          )
      )

    expect(juanMatchIndex).toBeGreaterThanOrEqual(0)

    const juanMatch =
      matchesView.matches[juanMatchIndex]

    expect(juanMatch?.id).toBeTruthy()

    console.log(
      "MATCH JUAN/ALEJANDRO:",
      juanMatch.id
    )

    // =========================================================
    // 5. ABRIR MATCHES Y ELEGIR EXACTAMENTE A JUAN
    // =========================================================

    await page.goto(
      tokenData.matches_url,
      {
        waitUntil: "domcontentloaded",
      }
    )

    await expect(
      page.getByText(
        "Encontramos opciones",
        {
          exact: false,
        }
      )
    ).toBeVisible()

    const cards =
      page.locator("article.card")

    expect(
      await cards.count()
    ).toBeGreaterThan(0)

    await cards
      .nth(juanMatchIndex)
      .locator("button.select")
      .click()

    await page
      .locator("section.bottom button")
      .click()

    await expect(page).toHaveURL(
      new RegExp(
        `/tenant/validacion/${tokenData.token}\\?matches=`
      )
    )

    console.log(
      "VALIDATION URL:",
      page.url()
    )

    // =========================================================
    // 6. VALIDACIÓN TENANT — DATOS FICTICIOS
    // =========================================================

    const validationForm =
      page.locator("form.tenant-form")

    await expect(validationForm).toBeVisible()

    await validationForm
      .getByLabel("DNI / documento")
      .fill("30123456")

    await validationForm
      .getByLabel("Situación laboral")
      .selectOption(
        "Relación de dependencia"
      )

    await validationForm
      .getByLabel("Rango de ingresos")
      .selectOption(
        "Más de $2.500.000"
      )

    await validationForm
      .getByLabel("Garantía / respaldo")
      .selectOption(
        "Seguro de caución"
      )

    await validationForm
      .getByLabel("DNI frente")
      .setInputFiles({
        name: "dni-frente-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel("DNI dorso")
      .setInputFiles({
        name: "dni-dorso-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel("Selfie")
      .setInputFiles({
        name: "selfie-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel(
        "Comprobante de ingresos"
      )
      .setInputFiles({
        name: "ingresos-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel(
        "Garantía / seguro / caución"
      )
      .setInputFiles({
        name: "garantia-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel("Notas adicionales")
      .fill(
        "Datos ficticios generados por E2E Verlo."
      )

    const verificationPromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/tenant-verification"
          ) &&
          response.request().method() ===
            "POST"
      )

    await validationForm
      .getByRole("button", {
        name: "Enviar validación",
      })
      .click()

    const verificationResponse =
      await verificationPromise

    expect(
      verificationResponse.status()
    ).toBe(200)

    const verificationData =
      await verificationResponse.json()

    expect(
      verificationData?.ok
    ).toBe(true)

    expect(
      verificationData?.verification_id
    ).toBeTruthy()

    expect(
      verificationData?.match_ids
    ).toContain(juanMatch.id)

    console.log(
      "VERIFICATION:",
      verificationData.verification_id
    )

    // =========================================================
    // 7. OBTENER URL EXACTA DE CANDIDATOS DE JUAN
    // =========================================================

    const juanOwnerNotification =
      (
        verificationData.owner_notifications ||
        []
      ).find(
        (item: any) =>
          item.owner_lead_id ===
          ownerData.lead_id
      )

    expect(
      juanOwnerNotification
    ).toBeTruthy()

    expect(
      juanOwnerNotification
        ?.candidates_url
    ).toBeTruthy()

    const candidatesUrl =
      juanOwnerNotification.candidates_url

    console.log(
      "OWNER CANDIDATES URL:",
      candidatesUrl
    )

    // =========================================================
    // 8. JUAN ABRE SUS CANDIDATOS
    // =========================================================

    await page.goto(
      candidatesUrl,
      {
        waitUntil: "domcontentloaded",
      }
    )

    await expect(
      page.getByText(
        "Tenés candidatos",
        {
          exact: false,
        }
      )
    ).toBeVisible()

    const alejandroCard =
      page
        .locator(
          "article.candidate-card"
        )
        .filter({
          hasText: "Alejandro",
        })

    await expect(
      alejandroCard
    ).toHaveCount(1)

    // =========================================================
    // 9. JUAN ACEPTA A ALEJANDRO
    // =========================================================

    const ownerInterestPromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/owner-interest"
          ) &&
          response.request().method() ===
            "POST"
      )

    await alejandroCard
      .locator("button.accept-button")
      .click()

    const ownerInterestResponse =
      await ownerInterestPromise

    expect(
      ownerInterestResponse.status()
    ).toBe(200)

    const ownerInterestData =
      await ownerInterestResponse.json()

    console.log(
      "OWNER INTEREST:",
      JSON.stringify(
        ownerInterestData,
        null,
        2
      )
    )

    expect(
      ownerInterestData?.ok
    ).toBe(true)

    expect(
      ownerInterestData?.match_id
    ).toBe(juanMatch.id)

    expect(
      ownerInterestData?.owner_interest
    ).toBe(true)

    expect(
      ownerInterestData?.tenant_interest
    ).toBe(true)

    expect(
      ownerInterestData?.tenant_verified
    ).toBe(true)

    expect(
      ownerInterestData?.ready_to_connect
    ).toBe(true)

    expect(
      ownerInterestData?.contract_id
    ).toBeTruthy()

    expect(
      ownerInterestData
        ?.tenant_closing_url
    ).toBeTruthy()

    expect(
      ownerInterestData
        ?.owner_closing_url
    ).toBeTruthy()

    console.log(
      "CONTRACT:",
      ownerInterestData.contract_id
    )

    console.log(
      "TENANT CLOSING:",
      ownerInterestData
        .tenant_closing_url
    )

    console.log(
      "OWNER CLOSING:",
      ownerInterestData
        .owner_closing_url
    )

    // =========================================================
    // 10. ABRIR CIERRE COMO TENANT
    // =========================================================

    const tenantClosingPromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/closing-view"
          ) &&
          response.request().method() ===
            "GET"
      )

    await page.goto(
      ownerInterestData
        .tenant_closing_url,
      {
        waitUntil: "domcontentloaded",
      }
    )

    const tenantClosingResponse =
      await tenantClosingPromise

    expect(
      tenantClosingResponse.status()
    ).toBe(200)

    const tenantClosingData =
      await tenantClosingResponse.json()

    expect(
      tenantClosingData?.ok
    ).toBe(true)

    expect(
      tenantClosingData?.viewer?.role
    ).toBe("tenant")

    expect(
      tenantClosingData?.contract?.id
    ).toBe(
      ownerInterestData.contract_id
    )

    console.log(
      "TENANT CIERRE OK"
    )

    // =========================================================
    // 11. ABRIR CIERRE COMO OWNER
    // =========================================================

    const ownerClosingPromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/closing-view"
          ) &&
          response.request().method() ===
            "GET"
      )

    await page.goto(
      ownerInterestData
        .owner_closing_url,
      {
        waitUntil: "domcontentloaded",
      }
    )

    const ownerClosingResponse =
      await ownerClosingPromise

    expect(
      ownerClosingResponse.status()
    ).toBe(200)

    const ownerClosingData =
      await ownerClosingResponse.json()

    expect(
      ownerClosingData?.ok
    ).toBe(true)

    expect(
      ownerClosingData?.viewer?.role
    ).toBe("owner")

    expect(
      ownerClosingData?.contract?.id
    ).toBe(
      ownerInterestData.contract_id
    )

    console.log(
      "OWNER CIERRE OK"
    )

    console.log(
      "E2E DOBLE OK COMPLETADO"
    )
  }
)
